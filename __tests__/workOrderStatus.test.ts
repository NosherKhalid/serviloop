import { canTransition, nextStatuses, statusLabel, transitionLabel, workOrderStatuses } from '@/features/workOrders/status';

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

describe('transitionLabel (what each move button says)', () => {
  it('names every allowed move as an action', () => {
    expect(transitionLabel('open', 'in_progress')).toBe('Start job');
    expect(transitionLabel('open', 'cancelled')).toBe('Cancel job');
    expect(transitionLabel('in_progress', 'completed')).toBe('Mark completed');
    expect(transitionLabel('in_progress', 'open')).toBe('Back to open');
    expect(transitionLabel('in_progress', 'cancelled')).toBe('Cancel job');
    expect(transitionLabel('cancelled', 'open')).toBe('Reopen job');
  });

  it('has a label for every move the rules allow, and no two buttons for one job read the same', () => {
    for (const from of workOrderStatuses) {
      const labels = nextStatuses(from).map((to) => transitionLabel(from, to));
      expect(new Set(labels).size).toBe(labels.length);
    }
  });
});
