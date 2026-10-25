jest.mock('@/lib/supabase', () => ({ supabase: require('@/testing/mockSupabase').mockDb.client }));

import { mockDb } from '@/testing/mockSupabase';
import { createCustomer, deleteCustomer, getCustomer, listCustomers, updateCustomer } from '@/repositories/customerRepository';

const row = { id: 'c1', name: 'Maple Street Bakery', phone: '555-0101', address: '12 Maple Street', created_at: '2026-09-01T09:00:00Z' };
const customer = { id: 'c1', name: 'Maple Street Bakery', phone: '555-0101', address: '12 Maple Street', createdAt: '2026-09-01T09:00:00Z' };
const input = { name: 'Riverside Cafe', phone: null, address: '5 River Road' };

const called = (method: string) => mockDb.called(method);

beforeEach(() => {
  mockDb.reset();
});

describe('customerRepository (real queries, mocked client)', () => {
  it('lists customers by name and converts rows to the app\'s shape', async () => {
    mockDb.result = { data: [row], error: null };

    expect(await listCustomers()).toEqual([customer]);
    expect(called('from')).toEqual([['customers']]);
    expect(called('order')).toEqual([['name', { ascending: true }]]);
  });

  it('throws the service error when listing fails', async () => {
    const failure = { code: '', message: 'TypeError: Network request failed' };
    mockDb.result = { data: null, error: failure };
    await expect(listCustomers()).rejects.toBe(failure);
  });

  it('gets one customer by id', async () => {
    mockDb.result = { data: row, error: null };
    expect(await getCustomer('c1')).toEqual(customer);
    expect(called('eq')).toEqual([['id', 'c1']]);
  });

  it('returns null for a customer that does not exist (or is not yours)', async () => {
    mockDb.result = { data: null, error: null };
    expect(await getCustomer('missing')).toBeNull();
  });

  it('creates a customer in the given business and returns it', async () => {
    mockDb.result = { data: { ...row, name: 'Riverside Cafe', phone: null, address: '5 River Road' }, error: null };

    const created = await createCustomer('b1', input);

    expect(created.name).toBe('Riverside Cafe');
    expect(called('insert')).toEqual([[{ business_id: 'b1', name: 'Riverside Cafe', phone: null, address: '5 River Road' }]]);
  });

  it('never sends columns the database does not let the app write', async () => {
    mockDb.result = { data: row, error: null };
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
    mockDb.result = { data: null, error: refusal };
    await expect(createCustomer('someone-elses-business', input)).rejects.toBe(refusal);
  });

  it('updates only the edited customer', async () => {
    mockDb.result = { data: { ...row, name: 'Riverside Bistro' }, error: null };

    const updated = await updateCustomer('c1', { ...input, name: 'Riverside Bistro' });

    expect(updated.name).toBe('Riverside Bistro');
    expect(called('eq')).toEqual([['id', 'c1']]);
  });

  it('reports "not found" when an update matches nothing', async () => {
    mockDb.result = { data: null, error: null };
    await expect(updateCustomer('missing', input)).rejects.toThrow('Customer not found');
  });
});

describe('customerRepository.deleteCustomer (real query, mocked client)', () => {
  it('deletes only the chosen customer', async () => {
    mockDb.result = { data: null, error: null };

    await deleteCustomer('c1');

    expect(called('from')).toEqual([['customers']]);
    expect(called('delete')).toHaveLength(1);
    expect(called('eq')).toEqual([['id', 'c1']]);
  });

  it('throws the service error when the database refuses (the customer still has jobs)', async () => {
    const refusal = { code: '23503', message: 'update or delete on table "customers" violates foreign key constraint' };
    mockDb.result = { data: null, error: refusal };

    await expect(deleteCustomer('c1')).rejects.toBe(refusal);
  });
});
