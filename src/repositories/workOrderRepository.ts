import type { WorkOrder } from '@/types/workOrder';

// MOCK (M0): in-memory and fictional, like customerRepository. In M3 the body becomes a Supabase
// query joined with customers; the function name and return type stay.
const workOrders: WorkOrder[] = [
  { id: 'w1', title: 'Replace kitchen faucet', status: 'in_progress', customerId: 'c1', customerName: 'Maple Street Bakery', scheduledFor: '2026-10-26T09:00:00Z' },
  { id: 'w2', title: 'Annual boiler service', status: 'open', customerId: 'c3', customerName: 'Harbor View Dental', scheduledFor: '2026-10-28T13:30:00Z' },
  { id: 'w3', title: 'Fix leaking pipe under sink', status: 'completed', customerId: 'c2', customerName: 'Priya Natarajan', scheduledFor: '2026-10-20T10:00:00Z' },
  { id: 'w4', title: 'Install outdoor lighting', status: 'open', customerId: 'c4', customerName: 'Tomás Rivera', scheduledFor: null },
  { id: 'w5', title: 'Unblock main drain', status: 'completed', customerId: 'c5', customerName: 'Greenfield Community Hall', scheduledFor: '2026-10-18T08:00:00Z' },
  { id: 'w6', title: 'Quote for bathroom refit', status: 'cancelled', customerId: 'c6', customerName: 'Amelia Brooks', scheduledFor: '2026-10-22T15:00:00Z' },
];

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function listWorkOrders(): Promise<WorkOrder[]> {
  await wait(600); // pretend to be a network request
  return workOrders;
}
