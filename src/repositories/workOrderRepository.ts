import { supabase } from '@/lib/supabase';
import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';

// Real data (M3). Row-level security means this only ever returns the signed-in owner's own jobs.
//
// The customer's and technician's names come from the database in the same request: the two
// `!work_orders_..._same_business` hints name the foreign keys that link a job to its customer and
// technician (see the M1 schema), so there is no second request per row.
const COLUMNS =
  'id, title, description, status, scheduled_for, customer_id, technician_id, ' +
  'customers!work_orders_customer_same_business(name), technicians!work_orders_technician_same_business(name)';

// What the database sends back for one job (snake_case, with the joined names nested).
type WorkOrderRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduled_for: string | null;
  customer_id: string;
  technician_id: string | null;
  customers: { name: string } | null;
  technicians: { name: string } | null;
};

const statuses: readonly WorkOrderStatus[] = ['open', 'in_progress', 'completed', 'cancelled'];

// The database only stores these four values (a check constraint), but TypeScript cannot know that,
// and anything unexpected must not crash the screen.
function toStatus(value: string): WorkOrderStatus {
  return statuses.find((status) => status === value) ?? 'open';
}

export function toWorkOrder(row: WorkOrderRow): WorkOrder {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: toStatus(row.status),
    customerId: row.customer_id,
    customerName: row.customers?.name ?? 'Unknown customer',
    technicianId: row.technician_id,
    technicianName: row.technicians?.name ?? null,
    scheduledFor: row.scheduled_for,
  };
}

// Order here is only a stable starting point (soonest first, undated last); the screen sorts for display.
export async function listWorkOrders(): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from('work_orders')
    .select(COLUMNS)
    .order('scheduled_for', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .returns<WorkOrderRow[]>();
  if (error) {
    throw error;
  }
  return data.map(toWorkOrder);
}
