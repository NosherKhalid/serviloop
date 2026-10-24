import type { WorkOrderStatus } from '@/types/workOrder';

// Pure product rules for job statuses: no React, no data access, easy to test.

export const workOrderStatuses: readonly WorkOrderStatus[] = ['open', 'in_progress', 'completed', 'cancelled'];

const labels: Record<WorkOrderStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function statusLabel(status: WorkOrderStatus): string {
  return labels[status];
}

// Which status can a job move to next? `Record<WorkOrderStatus, ...>` makes TypeScript insist that
// every status has an entry, so adding a fifth status later cannot be forgotten here.
//   open        -> start work, or cancel
//   in_progress -> finish, hand back to open, or cancel
//   completed   -> final (a finished job is not reopened in v0.1)
//   cancelled   -> can be reopened
const transitions: Record<WorkOrderStatus, readonly WorkOrderStatus[]> = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['open', 'completed', 'cancelled'],
  completed: [],
  cancelled: ['open'],
};

export function nextStatuses(from: WorkOrderStatus): readonly WorkOrderStatus[] {
  return transitions[from];
}

export function canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return transitions[from].includes(to);
}
