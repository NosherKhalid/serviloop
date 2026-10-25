// The four statuses a job can have (spec §5). A union of string literals ≈ a Swift enum with raw values.
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type WorkOrder = {
  id: string;
  title: string;
  description: string | null;
  status: WorkOrderStatus;
  customerId: string;
  customerName: string; // looked up from the customer record (a join), so renaming a customer updates every job
  technicianId: string | null; // null = not assigned yet
  technicianName: string | null;
  scheduledFor: string | null; // UTC ISO timestamp, or null when not scheduled yet
};
