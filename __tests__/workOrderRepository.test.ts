jest.mock('@/lib/supabase', () => ({ supabase: require('@/testing/mockSupabase').mockDb.client }));

import { createWorkOrder, getWorkOrder, listWorkOrders, updateWorkOrder } from '@/repositories/workOrderRepository';
import { mockDb } from '@/testing/mockSupabase';

const row = {
  id: 'w1',
  title: 'Replace kitchen faucet',
  description: 'Dripping tap',
  status: 'in_progress',
  scheduled_for: '2026-10-26T09:00:00Z',
  customer_id: 'c1',
  technician_id: 't1',
  customers: { name: 'Maple Street Bakery' },
  technicians: { name: 'Sam Rivera' },
};

beforeEach(() => {
  mockDb.reset();
});

describe('workOrderRepository.listWorkOrders (real query, mocked client)', () => {
  it('asks for the jobs together with the customer and technician names', async () => {
    mockDb.result = { data: [row], error: null };

    await listWorkOrders();

    expect(mockDb.called('from')).toEqual([['work_orders']]);
    const [columns] = mockDb.called('select')[0] as [string];
    expect(columns).toContain('customers!work_orders_customer_same_business(name)');
    expect(columns).toContain('technicians!work_orders_technician_same_business(name)');
  });

  it('turns database rows into jobs', async () => {
    mockDb.result = { data: [row], error: null };

    expect(await listWorkOrders()).toEqual([
      {
        id: 'w1',
        title: 'Replace kitchen faucet',
        description: 'Dripping tap',
        status: 'in_progress',
        customerId: 'c1',
        customerName: 'Maple Street Bakery',
        technicianId: 't1',
        technicianName: 'Sam Rivera',
        scheduledFor: '2026-10-26T09:00:00Z',
      },
    ]);
  });

  it('handles a job with no technician and no date', async () => {
    mockDb.result = { data: [{ ...row, technician_id: null, technicians: null, scheduled_for: null, description: null }], error: null };

    const [job] = await listWorkOrders();

    expect(job.technicianId).toBeNull();
    expect(job.technicianName).toBeNull();
    expect(job.scheduledFor).toBeNull();
    expect(job.description).toBeNull();
  });

  it('never crashes on an unexpected status or a missing customer name', async () => {
    mockDb.result = { data: [{ ...row, status: 'archived', customers: null }], error: null };

    const [job] = await listWorkOrders();

    expect(job.status).toBe('open');
    expect(job.customerName).toBe('Unknown customer');
  });

  it('throws the service error when the request fails', async () => {
    const failure = { code: '', message: 'TypeError: Network request failed' };
    mockDb.result = { data: null, error: failure };
    await expect(listWorkOrders()).rejects.toBe(failure);
  });
});

const input = {
  title: 'Replace kitchen faucet',
  description: null,
  customerId: 'c1',
  technicianId: 't1',
  scheduledFor: '2026-10-26T09:00:00.000Z',
  status: 'in_progress' as const,
};

describe('workOrderRepository.getWorkOrder', () => {
  it('gets one job by id, or null when there is none', async () => {
    mockDb.result = { data: row, error: null };
    expect((await getWorkOrder('w1'))?.title).toBe('Replace kitchen faucet');
    expect(mockDb.called('eq')).toEqual([['id', 'w1']]);

    mockDb.result = { data: null, error: null };
    expect(await getWorkOrder('missing')).toBeNull();
  });
});

describe('workOrderRepository.createWorkOrder', () => {
  it('creates the job in the given business and always starts it as open', async () => {
    mockDb.result = { data: { ...row, status: 'open' }, error: null };

    const created = await createWorkOrder('b1', input);

    expect(created.status).toBe('open');
    expect(mockDb.called('insert')).toEqual([
      [
        {
          business_id: 'b1',
          customer_id: 'c1',
          technician_id: 't1',
          title: 'Replace kitchen faucet',
          description: null,
          status: 'open', // not input.status: a new job cannot start as in progress
          scheduled_for: '2026-10-26T09:00:00.000Z',
        },
      ],
    ]);
  });

  it('passes on a refusal from the database (e.g. a customer from another business)', async () => {
    const refusal = { code: '23503', message: 'violates foreign key constraint "work_orders_customer_same_business"' };
    mockDb.result = { data: null, error: refusal };
    await expect(createWorkOrder('b1', input)).rejects.toBe(refusal);
  });
});

describe('workOrderRepository.updateWorkOrder', () => {
  it('updates the editable fields and never sends business_id or id', async () => {
    mockDb.result = { data: row, error: null };

    await updateWorkOrder('w1', input);

    const [payload] = mockDb.called('update')[0] as [Record<string, unknown>];
    expect(payload).toEqual({
      customer_id: 'c1',
      technician_id: 't1',
      title: 'Replace kitchen faucet',
      description: null,
      status: 'in_progress',
      scheduled_for: '2026-10-26T09:00:00.000Z',
    });
    expect(Object.keys(payload)).not.toContain('business_id');
    expect(mockDb.called('eq')).toEqual([['id', 'w1']]);
  });

  it('reports "not found" when an update matches nothing', async () => {
    mockDb.result = { data: null, error: null };
    await expect(updateWorkOrder('missing', input)).rejects.toThrow('Job not found');
  });
});
