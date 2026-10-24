import type { CustomerInput } from '@/features/customers/validation';
import type { Customer } from '@/types/customer';

// MOCK (M0): everything here is in memory and resets when the app reloads. In M3 the bodies of
// these functions are replaced with Supabase queries; their names and signatures stay, so
// hooks and screens do not change. All data below is fictional.
let customers: Customer[] = [
  { id: 'c1', name: 'Maple Street Bakery', phone: '555-0101', address: '12 Maple Street', createdAt: '2026-09-01T09:00:00Z' },
  { id: 'c2', name: 'Priya Natarajan', phone: '555-0102', address: '48 Orchard Lane', createdAt: '2026-09-03T14:30:00Z' },
  { id: 'c3', name: 'Harbor View Dental', phone: '555-0103', address: '3 Harbor Road, Suite 2', createdAt: '2026-09-07T11:15:00Z' },
  { id: 'c4', name: 'Tomás Rivera', phone: null, address: '77 Cedar Court', createdAt: '2026-09-12T16:45:00Z' },
  { id: 'c5', name: 'Greenfield Community Hall', phone: '555-0105', address: null, createdAt: '2026-09-18T08:20:00Z' },
  { id: 'c6', name: 'Amelia Brooks', phone: '555-0106', address: '9 Willow Way', createdAt: '2026-09-25T13:05:00Z' },
];

let nextCustomerNumber = customers.length;

// Edit the return value to rehearse each screen state with Fast Refresh:
// 'normal' | 'empty' | 'error' | 'slow'. A function (not a const) so TypeScript does not narrow it.
type MockMode = 'normal' | 'empty' | 'error' | 'slow';
function getMockMode(): MockMode {
  return 'normal';
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// Shared by every function: pretend to be a network request, and fail on demand.
async function simulateNetwork(): Promise<MockMode> {
  const mode = getMockMode();
  await wait(mode === 'slow' ? 5000 : 600);
  if (mode === 'error') {
    throw new Error('Mock network failure');
  }
  return mode;
}

// iOS: `async` functions return a Promise, like Swift's `async throws` returning a value.
// A thrown error rejects the Promise, and the caller handles it with try/catch or `.catch`.
export async function listCustomers(): Promise<Customer[]> {
  const mode = await simulateNetwork();
  return mode === 'empty' ? [] : customers;
}

// `Customer | null`: null means "no customer with that id", which is not an error.
export async function getCustomer(id: string): Promise<Customer | null> {
  await simulateNetwork();
  return customers.find((customer) => customer.id === id) ?? null;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  await simulateNetwork();
  nextCustomerNumber += 1;
  const customer: Customer = {
    id: `c${nextCustomerNumber}`, // M3: the database generates a UUID
    ...input,
    createdAt: new Date().toISOString(),
  };
  // Never mutate state in place: build a new array. (The same rule React state follows.)
  customers = [...customers, customer];
  return customer;
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  await simulateNetwork();
  const existing = customers.find((customer) => customer.id === id);
  if (existing === undefined) {
    throw new Error('Customer not found');
  }
  const updated: Customer = { ...existing, ...input };
  customers = customers.map((customer) => (customer.id === id ? updated : customer));
  return updated;
}
