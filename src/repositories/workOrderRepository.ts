import type { WorkOrderInput } from '@/features/workOrders/validation';
import { supabase } from '@/lib/supabase';
import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';

// Real data (M3). Row-level security means this only ever returns the signed-in owner's own jobs.
//
// The customer's and technician's names come from the database in the same request: the two
// `!work_orders_..._same_business` hints name the foreign keys that link a job to its customer and
// technician (see the M1 schema), so there is no second request per row.
const COLUMNS =
  'id, title, description, status, scheduled_for, completion_notes, ai_summary, customer_id, technician_id, ' +
  'customers!work_orders_customer_same_business(name), technicians!work_orders_technician_same_business(name)';

// What the database sends back for one job (snake_case, with the joined names nested).
type WorkOrderRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduled_for: string | null;
  completion_notes: string | null;
  ai_summary: string | null;
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
    completionNotes: row.completion_notes,
    aiSummary: row.ai_summary,
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

// Saves (or clears, with `null`) the customer-facing summary. Writes only `ai_summary`: the text was drafted by
// the Edge Function but the owner has edited it, and it reaches the database through the normal RLS-protected path.
export async function updateWorkOrderSummary(id: string, summary: string | null): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .update({ ai_summary: summary })
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

// The newest activity first: the jobs changed most recently, whatever their status. `updated_at` is set by the
// database on every change (M1), so a status change or a note moves a job to the top.
export async function listRecentWorkOrders(limit: number): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from('work_orders')
    .select(COLUMNS)
    .order('updated_at', { ascending: false })
    .limit(limit)
    .returns<WorkOrderRow[]>();
  if (error) {
    throw error;
  }
  return data.map(toWorkOrder);
}

// How many jobs have each status, counted by the database (one small request per status, sent together).
// `head: true` means "send me the count, not the rows", so the number stays right however many jobs there are.
export async function countWorkOrdersByStatus(): Promise<Record<WorkOrderStatus, number>> {
  const counts = await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabase
        .from('work_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);
      if (error) {
        throw error;
      }
      return count ?? 0;
    }),
  );
  return { open: counts[0], in_progress: counts[1], completed: counts[2], cancelled: counts[3] };
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

// Moves a job along (and/or saves its completion notes). Writes only these two columns, so nothing else
// about the job can change through this path. `status` is optional: omit it to save the notes alone.
export type WorkOrderProgress = { status?: WorkOrderStatus; completionNotes: string | null };

export async function updateWorkOrderProgress(id: string, progress: WorkOrderProgress): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .update(
      progress.status === undefined
        ? { completion_notes: progress.completionNotes }
        : { status: progress.status, completion_notes: progress.completionNotes },
    )
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
