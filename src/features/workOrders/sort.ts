import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';

// "What needs doing" first: open and in-progress jobs, soonest first (undated ones last), then the
// finished and cancelled ones, most recent first. Pure and does not change the list it is given.

const finished: readonly WorkOrderStatus[] = ['completed', 'cancelled'];

function time(workOrder: WorkOrder): number | null {
  if (workOrder.scheduledFor === null) {
    return null;
  }
  const value = new Date(workOrder.scheduledFor).getTime();
  return Number.isNaN(value) ? null : value;
}

export function sortForList(workOrders: readonly WorkOrder[]): WorkOrder[] {
  const needsDoing = workOrders.filter((workOrder) => !finished.includes(workOrder.status));
  const done = workOrders.filter((workOrder) => finished.includes(workOrder.status));

  needsDoing.sort((a, b) => {
    const ta = time(a);
    const tb = time(b);
    if (ta === null && tb === null) return a.title.localeCompare(b.title);
    if (ta === null) return 1; // undated after dated
    if (tb === null) return -1;
    return ta - tb;
  });

  done.sort((a, b) => {
    const ta = time(a);
    const tb = time(b);
    if (ta === null && tb === null) return a.title.localeCompare(b.title);
    if (ta === null) return 1;
    if (tb === null) return -1;
    return tb - ta; // newest first
  });

  return [...needsDoing, ...done];
}
