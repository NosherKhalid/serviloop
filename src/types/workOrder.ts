// The four statuses a job can have (spec §5). A union of string literals ≈ a Swift enum with raw values.
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type WorkOrder = {
  id: string;
  title: string;
  status: WorkOrderStatus;
  customerId: string;
  customerName: string; // MOCK: denormalised; in M3 this comes from a join on customers
  scheduledFor: string | null; // UTC ISO timestamp, or null when not scheduled yet
};
