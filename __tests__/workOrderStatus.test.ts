import { canTransition, nextStatuses, statusLabel, workOrderStatuses } from '@/features/workOrders/status';

describe('work order status rules', () => {
  it('has a readable label for every status', () => {
    expect(workOrderStatuses.map(statusLabel)).toEqual(['Open', 'In progress', 'Completed', 'Cancelled']);
  });

  it('lets an open job start or be cancelled, but not jump to completed', () => {
    expect(canTransition('open', 'in_progress')).toBe(true);
    expect(canTransition('open', 'cancelled')).toBe(true);
    expect(canTransition('open', 'completed')).toBe(false);
  });

  it('lets a job in progress finish, go back to open, or be cancelled', () => {
    expect(nextStatuses('in_progress')).toEqual(['open', 'completed', 'cancelled']);
  });

  it('treats completed as final', () => {
    expect(nextStatuses('completed')).toEqual([]);
  });

  it('lets a cancelled job be reopened only', () => {
    expect(nextStatuses('cancelled')).toEqual(['open']);
  });

  it('never allows a status to change to itself', () => {
    for (const status of workOrderStatuses) {
      expect(canTransition(status, status)).toBe(false);
    }
  });
});
