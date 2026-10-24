const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({ maybeSingle: () => mockMaybeSingle(table) }),
      insert: (row: unknown) => {
        mockInsert(table, row);
        return { select: () => ({ single: () => mockSingle() }) };
      },
    }),
    rpc: (name: string) => mockRpc(name),
  },
}));

import { createBusiness, getMyBusiness, loadDemoData } from '@/repositories/businessRepository';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getMyBusiness', () => {
  it('returns the owner\'s business', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'b1', name: 'Riverside' }, error: null });
    expect(await getMyBusiness()).toEqual({ id: 'b1', name: 'Riverside' });
    expect(mockMaybeSingle).toHaveBeenCalledWith('businesses');
  });

  it('returns null when no business has been set up yet (not an error)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getMyBusiness()).toBeNull();
  });

  it('throws the service error so the caller can show a friendly message', async () => {
    const failure = { code: '', message: 'TypeError: Network request failed' };
    mockMaybeSingle.mockResolvedValue({ data: null, error: failure });
    await expect(getMyBusiness()).rejects.toBe(failure);
  });
});

describe('createBusiness', () => {
  it('sends only the name: the owner is filled in by the database, never by the app', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'b1', name: 'Riverside' }, error: null });

    const business = await createBusiness('Riverside');

    expect(business).toEqual({ id: 'b1', name: 'Riverside' });
    expect(mockInsert).toHaveBeenCalledWith('businesses', { name: 'Riverside' });
  });

  it('throws the service error when the database refuses', async () => {
    const failure = { code: '23505', message: 'duplicate key value' };
    mockSingle.mockResolvedValue({ data: null, error: failure });
    await expect(createBusiness('Riverside')).rejects.toBe(failure);
  });
});

describe('loadDemoData', () => {
  it('returns the counts and the business', async () => {
    mockRpc.mockResolvedValue({ data: { business_id: 'b1', customers: 6, technicians: 3, jobs: 6 }, error: null });
    mockMaybeSingle.mockResolvedValue({ data: { id: 'b1', name: 'Demo Plumbing Co.' }, error: null });

    expect(await loadDemoData()).toEqual({
      business: { id: 'b1', name: 'Demo Plumbing Co.' },
      summary: { customers: 6, technicians: 3, jobs: 6 },
    });
    expect(mockRpc).toHaveBeenCalledWith('load_demo_data');
  });

  it('passes on the "already has data" refusal', async () => {
    const refusal = { code: 'P0001', message: 'This business already has data. Demo data can only be loaded into an empty business.' };
    mockRpc.mockResolvedValue({ data: null, error: refusal });
    await expect(loadDemoData()).rejects.toBe(refusal);
  });

  it('rejects an answer from the database that does not have the expected shape', async () => {
    mockRpc.mockResolvedValue({ data: { customers: 'six' }, error: null });
    await expect(loadDemoData()).rejects.toThrow();
  });

  it('fails clearly if the business cannot be found after loading', async () => {
    mockRpc.mockResolvedValue({ data: { customers: 6, technicians: 3, jobs: 6 }, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(loadDemoData()).rejects.toThrow(/could not be found/);
  });
});
