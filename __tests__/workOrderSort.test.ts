import { sortForList } from '@/features/workOrders/sort';
import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';

function job(title: string, status: WorkOrderStatus, scheduledFor: string | null): WorkOrder {
  return { id: title, title, description: null, status, customerId: 'c', customerName: 'C', technicianId: null, technicianName: null, scheduledFor, completionNotes: null, aiSummary: null };
}

describe('sortForList', () => {
  it('puts jobs that still need doing first, soonest first, undated last', () => {
    const sorted = sortForList([
      job('later', 'open', '2026-10-30T09:00:00Z'),
      job('undated', 'open', null),
      job('soon', 'in_progress', '2026-10-26T09:00:00Z'),
    ]);
    expect(sorted.map((j) => j.title)).toEqual(['soon', 'later', 'undated']);
  });

  it('puts finished and cancelled jobs after them, most recent first', () => {
    const sorted = sortForList([
      job('old done', 'completed', '2026-10-01T09:00:00Z'),
      job('open', 'open', '2026-10-28T09:00:00Z'),
      job('recent done', 'completed', '2026-10-20T09:00:00Z'),
      job('cancelled', 'cancelled', '2026-10-22T09:00:00Z'),
    ]);
    expect(sorted.map((j) => j.title)).toEqual(['open', 'cancelled', 'recent done', 'old done']);
  });

  it('treats an unreadable date like no date', () => {
    const sorted = sortForList([job('bad', 'open', 'not a date'), job('good', 'open', '2026-10-26T09:00:00Z')]);
    expect(sorted.map((j) => j.title)).toEqual(['good', 'bad']);
  });

  it('does not change the list it was given', () => {
    const input = [job('b', 'completed', null), job('a', 'open', null)];
    const copy = [...input];
    sortForList(input);
    expect(input).toEqual(copy);
  });
});
