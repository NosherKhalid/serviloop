jest.mock('@/lib/supabase', () => ({ supabase: require('@/testing/mockSupabase').mockDb.client }));

import {
  countWorkOrdersByStatus,
  createWorkOrder,
  deleteWorkOrder,
  getWorkOrder,
  listRecentWorkOrders,
  listWorkOrders,
  updateWorkOrder,
  updateWorkOrderProgress,
} from '@/repositories/workOrderRepository';
import { mockDb } from '@/testing/mockSupabase';

const row = {
  id: 'w1',
  title: 'Replace kitchen faucet',
  description: 'Dripping tap',
  status: 'in_progress',
  scheduled_for: '2026-10-26T09:00:00Z',
  completion_notes: 'Replaced the washer.',
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
        completionNotes: 'Replaced the washer.',
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

describe('workOrderRepository.deleteWorkOrder (real query, mocked client)', () => {
  it('deletes only the chosen job', async () => {
    mockDb.result = { data: null, error: null };

    await deleteWorkOrder('w1');

    expect(mockDb.called('from')).toEqual([['work_orders']]);
    expect(mockDb.called('delete')).toHaveLength(1);
    expect(mockDb.called('eq')).toEqual([['id', 'w1']]);
  });

  it('throws the service error when the database refuses', async () => {
    const refusal = { code: '42501', message: 'permission denied for table work_orders' };
    mockDb.result = { data: null, error: refusal };

    await expect(deleteWorkOrder('w1')).rejects.toBe(refusal);
  });
});

describe('workOrderRepository.updateWorkOrderProgress (real query, mocked client)', () => {
  it('asks for the completion notes with every job', async () => {
    mockDb.result = { data: [row], error: null };

    await listWorkOrders();

    const [columns] = mockDb.called('select')[0] as [string];
    expect(columns).toContain('completion_notes');
  });

  it('moves a job and saves its notes in one update, touching nothing else', async () => {
    mockDb.result = { data: { ...row, status: 'completed', completion_notes: 'Done.' }, error: null };

    const job = await updateWorkOrderProgress('w1', { status: 'completed', completionNotes: 'Done.' });

    expect(mockDb.called('update')).toEqual([[{ status: 'completed', completion_notes: 'Done.' }]]);
    expect(mockDb.called('eq')).toEqual([['id', 'w1']]);
    expect(job.status).toBe('completed');
    expect(job.completionNotes).toBe('Done.');
  });

  it('saves only the notes when no status is given', async () => {
    mockDb.result = { data: row, error: null };

    await updateWorkOrderProgress('w1', { completionNotes: null });

    expect(mockDb.called('update')).toEqual([[{ completion_notes: null }]]);
  });

  it('never sends the business, customer or any other column', async () => {
    mockDb.result = { data: row, error: null };

    await updateWorkOrderProgress('w1', { status: 'in_progress', completionNotes: null });

    const sent = mockDb.called('update')[0][0] as Record<string, unknown>;
    expect(Object.keys(sent).sort()).toEqual(['completion_notes', 'status']);
  });

  it('reports "not found" when nothing matched, and throws the service error otherwise', async () => {
    mockDb.result = { data: null, error: null };
    await expect(updateWorkOrderProgress('gone', { completionNotes: null })).rejects.toThrow('Job not found');

    const refusal = { code: '42501', message: 'permission denied' };
    mockDb.result = { data: null, error: refusal };
    await expect(updateWorkOrderProgress('w1', { status: 'open', completionNotes: null })).rejects.toBe(refusal);
  });
});

describe('workOrderRepository.countWorkOrdersByStatus (real queries, mocked client)', () => {
  it('asks the database for one count per status, without fetching any rows', async () => {
    mockDb.queue.push(
      { data: null, error: null, count: 2 },
      { data: null, error: null, count: 1 },
      { data: null, error: null, count: 2 },
      { data: null, error: null, count: 1 },
    );

    const counts = await countWorkOrdersByStatus();

    expect(mockDb.called('from')).toEqual([['work_orders'], ['work_orders'], ['work_orders'], ['work_orders']]);
    expect(mockDb.called('select')).toEqual(Array(4).fill(['id', { count: 'exact', head: true }]));
    expect(mockDb.called('eq')).toEqual([
      ['status', 'open'],
      ['status', 'in_progress'],
      ['status', 'completed'],
      ['status', 'cancelled'],
    ]);
    expect(counts).toEqual({ open: 2, in_progress: 1, completed: 2, cancelled: 1 });
  });

  it('counts a status nobody has as zero', async () => {
    mockDb.result = { data: null, error: null, count: null };

    expect(await countWorkOrdersByStatus()).toEqual({ open: 0, in_progress: 0, completed: 0, cancelled: 0 });
  });

  it('throws the service error if any count fails, instead of showing a wrong number', async () => {
    const failure = { code: 'PGRST301', message: 'JWT expired' };
    mockDb.queue.push({ data: null, error: null, count: 2 }, { data: null, error: failure, count: null });

    await expect(countWorkOrdersByStatus()).rejects.toBe(failure);
  });
});

describe('workOrderRepository.listRecentWorkOrders (real query, mocked client)', () => {
  it('asks for the most recently changed jobs, newest first, up to the limit', async () => {
    mockDb.result = { data: [row], error: null };

    const jobs = await listRecentWorkOrders(5);

    expect(mockDb.called('order')).toEqual([['updated_at', { ascending: false }]]);
    expect(mockDb.called('limit')).toEqual([[5]]);
    expect(jobs.map((job) => job.title)).toEqual(['Replace kitchen faucet']);
  });

  it('throws the service error when the request fails', async () => {
    const failure = new TypeError('Network request failed');
    mockDb.result = { data: null, error: failure };

    await expect(listRecentWorkOrders(5)).rejects.toBe(failure);
  });
});
