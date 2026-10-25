// A recording stand-in for the Supabase query builder: every call is remembered so tests can check
// exactly what the repository asks the database for.
const mockCalls: { method: string; args: unknown[] }[] = [];
let mockResult: { data: unknown; error: unknown } = { data: null, error: null };

function mockBuilder(): Record<string, unknown> {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'insert', 'update', 'eq', 'order']) {
    builder[method] = (...args: unknown[]) => {
      mockCalls.push({ method, args });
      return builder;
    };
  }
  builder.single = () => Promise.resolve(mockResult);
  builder.maybeSingle = () => Promise.resolve(mockResult);
  // `await builder` (a list query with no .single()) resolves to the result.
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(mockResult).then(resolve);
  return builder;
}

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      mockCalls.push({ method: 'from', args: [table] });
      return mockBuilder();
    },
  },
}));

import { createCustomer, getCustomer, listCustomers, updateCustomer } from '@/repositories/customerRepository';

const row = { id: 'c1', name: 'Maple Street Bakery', phone: '555-0101', address: '12 Maple Street', created_at: '2026-09-01T09:00:00Z' };
const customer = { id: 'c1', name: 'Maple Street Bakery', phone: '555-0101', address: '12 Maple Street', createdAt: '2026-09-01T09:00:00Z' };
const input = { name: 'Riverside Cafe', phone: null, address: '5 River Road' };

const called = (method: string) => mockCalls.filter((call) => call.method === method).map((call) => call.args);

beforeEach(() => {
  mockCalls.length = 0;
  mockResult = { data: null, error: null };
});

describe('customerRepository (real queries, mocked client)', () => {
  it('lists customers by name and converts rows to the app\'s shape', async () => {
    mockResult = { data: [row], error: null };

    expect(await listCustomers()).toEqual([customer]);
    expect(called('from')).toEqual([['customers']]);
    expect(called('order')).toEqual([['name', { ascending: true }]]);
  });

  it('throws the service error when listing fails', async () => {
    const failure = { code: '', message: 'TypeError: Network request failed' };
    mockResult = { data: null, error: failure };
    await expect(listCustomers()).rejects.toBe(failure);
  });

  it('gets one customer by id', async () => {
    mockResult = { data: row, error: null };
    expect(await getCustomer('c1')).toEqual(customer);
    expect(called('eq')).toEqual([['id', 'c1']]);
  });

  it('returns null for a customer that does not exist (or is not yours)', async () => {
    mockResult = { data: null, error: null };
    expect(await getCustomer('missing')).toBeNull();
  });

  it('creates a customer in the given business and returns it', async () => {
    mockResult = { data: { ...row, name: 'Riverside Cafe', phone: null, address: '5 River Road' }, error: null };

    const created = await createCustomer('b1', input);

    expect(created.name).toBe('Riverside Cafe');
    expect(called('insert')).toEqual([[{ business_id: 'b1', name: 'Riverside Cafe', phone: null, address: '5 River Road' }]]);
  });

  it('never sends columns the database does not let the app write', async () => {
    mockResult = { data: row, error: null };
    await createCustomer('b1', input);
    await updateCustomer('c1', input);

    const sent = [...called('insert'), ...called('update')].flat() as Record<string, unknown>[];
    for (const payload of sent) {
      expect(Object.keys(payload)).not.toContain('id');
      expect(Object.keys(payload)).not.toContain('created_at');
    }
    // business_id is sent on creation only: rows can never be moved to another business.
    expect(Object.keys(called('update')[0][0] as object)).not.toContain('business_id');
  });

  it('throws the service error when the database refuses a new customer', async () => {
    const refusal = { code: '42501', message: 'new row violates row-level security policy' };
    mockResult = { data: null, error: refusal };
    await expect(createCustomer('someone-elses-business', input)).rejects.toBe(refusal);
  });

  it('updates only the edited customer', async () => {
    mockResult = { data: { ...row, name: 'Riverside Bistro' }, error: null };

    const updated = await updateCustomer('c1', { ...input, name: 'Riverside Bistro' });

    expect(updated.name).toBe('Riverside Bistro');
    expect(called('eq')).toEqual([['id', 'c1']]);
  });

  it('reports "not found" when an update matches nothing', async () => {
    mockResult = { data: null, error: null };
    await expect(updateCustomer('missing', input)).rejects.toThrow('Customer not found');
  });
});
