jest.mock('@/lib/supabase', () => ({ supabase: require('@/testing/mockSupabase').mockDb.client }));

import { mockDb } from '@/testing/mockSupabase';
import {
  createTechnician,
  getTechnician,
  listTechnicians,
  setTechnicianActive,
  updateTechnician,
} from '@/repositories/technicianRepository';

const row = { id: 't1', name: 'Sam Rivera', specialty: 'Plumbing', active: true };
const technician = { id: 't1', name: 'Sam Rivera', specialty: 'Plumbing', active: true };
const input = { name: 'Ivy Chen', specialty: null };

beforeEach(() => {
  mockDb.reset();
});

describe('technicianRepository (real queries, mocked client)', () => {
  it('lists active technicians first, then alphabetically', async () => {
    mockDb.result = { data: [row], error: null };

    expect(await listTechnicians()).toEqual([technician]);
    expect(mockDb.called('from')).toEqual([['technicians']]);
    expect(mockDb.called('order')).toEqual([
      ['active', { ascending: false }],
      ['name', { ascending: true }],
    ]);
  });

  it('throws the service error when listing fails', async () => {
    const failure = { code: '', message: 'TypeError: Network request failed' };
    mockDb.result = { data: null, error: failure };
    await expect(listTechnicians()).rejects.toBe(failure);
  });

  it('gets one technician, or null when there is none', async () => {
    mockDb.result = { data: row, error: null };
    expect(await getTechnician('t1')).toEqual(technician);
    expect(mockDb.called('eq')).toEqual([['id', 't1']]);

    mockDb.result = { data: null, error: null };
    expect(await getTechnician('missing')).toBeNull();
  });

  it('creates a technician in the given business', async () => {
    mockDb.result = { data: { ...row, name: 'Ivy Chen', specialty: null }, error: null };

    const created = await createTechnician('b1', input);

    expect(created).toEqual({ id: 't1', name: 'Ivy Chen', specialty: null, active: true });
    expect(mockDb.called('insert')).toEqual([[{ business_id: 'b1', name: 'Ivy Chen', specialty: null }]]);
  });

  it('never sends columns the app may not write (id, created_at, business_id on updates)', async () => {
    mockDb.result = { data: row, error: null };
    await updateTechnician('t1', input);
    await setTechnicianActive('t1', false);

    const sent = mockDb.called('update').flat() as Record<string, unknown>[];
    expect(sent).toEqual([{ name: 'Ivy Chen', specialty: null }, { active: false }]);
  });

  it('deactivates and reactivates instead of deleting', async () => {
    mockDb.result = { data: { ...row, active: false }, error: null };
    expect((await setTechnicianActive('t1', false)).active).toBe(false);

    mockDb.result = { data: row, error: null };
    expect((await setTechnicianActive('t1', true)).active).toBe(true);
    expect(mockDb.called('update')).toEqual([[{ active: false }], [{ active: true }]]);
  });

  it('passes on a refusal from the database', async () => {
    const refusal = { code: '42501', message: 'new row violates row-level security policy' };
    mockDb.result = { data: null, error: refusal };
    await expect(createTechnician('someone-elses-business', input)).rejects.toBe(refusal);
  });

  it('reports "not found" when an update matches nothing', async () => {
    mockDb.result = { data: null, error: null };
    await expect(updateTechnician('missing', input)).rejects.toThrow('Technician not found');
    await expect(setTechnicianActive('missing', false)).rejects.toThrow('Technician not found');
  });
});
