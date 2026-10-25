import type { WorkOrderInput } from '@/features/workOrders/validation';
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

// `null` means "no such job (or not yours)", which is not an error.
export async function getWorkOrder(id: string): Promise<WorkOrder | null> {
  const { data, error } = await supabase.from('work_orders').select(COLUMNS).eq('id', id).returns<WorkOrderRow[]>().maybeSingle();
  if (error) {
    throw error;
  }
  return data === null ? null : toWorkOrder(data);
}

// A new job always starts as 'open'. `businessId` comes from the signed-in owner's business; the
// database refuses a customer or technician from any other business (composite foreign keys, M1).
export async function createWorkOrder(businessId: string, input: WorkOrderInput): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .insert({
      business_id: businessId,
      customer_id: input.customerId,
      technician_id: input.technicianId,
      title: input.title,
      description: input.description,
      status: 'open',
      scheduled_for: input.scheduledFor,
    })
    .select(COLUMNS)
    .returns<WorkOrderRow>()
    .single();
  if (error) {
    throw error;
  }
  return toWorkOrder(data);
}

// `business_id` is never sent on an update: a job can never be moved to another business.
export async function updateWorkOrder(id: string, input: WorkOrderInput): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .update({
      customer_id: input.customerId,
      technician_id: input.technicianId,
      title: input.title,
      description: input.description,
      status: input.status,
      scheduled_for: input.scheduledFor,
    })
    .eq('id', id)
    .select(COLUMNS)
    .returns<WorkOrderRow>()
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (data === null) {
    throw new Error('Job not found'); // updating a row that does not exist (or is not yours) changes nothing
  }
  return toWorkOrder(data);
}

// Permanent. Same rules as `deleteCustomer`: a job that is already gone is not an error.
export async function deleteWorkOrder(id: string): Promise<void> {
  const { error } = await supabase.from('work_orders').delete().eq('id', id);
  if (error) {
    throw error;
  }
}
