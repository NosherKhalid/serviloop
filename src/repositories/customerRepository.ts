import type { CustomerInput } from '@/features/customers/validation';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { Customer } from '@/types/customer';

// Real data (M3). The function names and the `Customer` type are the same ones the M0 mock used
// (D-005), so the screens did not have to change. Row-level security guarantees every query below
// can only ever see or change the signed-in owner's own customers; the app never has to filter.

type CustomerRow = Database['public']['Tables']['customers']['Row'];

const COLUMNS = 'id, name, phone, address, created_at';

// Database rows use snake_case; the app uses camelCase.
function toCustomer(row: Pick<CustomerRow, 'id' | 'name' | 'phone' | 'address' | 'created_at'>): Customer {
  return { id: row.id, name: row.name, phone: row.phone, address: row.address, createdAt: row.created_at };
}

export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select(COLUMNS).order('name', { ascending: true });
  if (error) {
    throw error;
  }
  return data.map(toCustomer);
}

// `null` means "no such customer (or not yours)", which is not an error.
export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase.from('customers').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) {
    throw error;
  }
  return data === null ? null : toCustomer(data);
}

// `businessId` comes from the signed-in owner's business. Even a wrong value cannot cause harm:
// the database rejects a row for a business the caller does not own.
export async function createCustomer(businessId: string, input: CustomerInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({ business_id: businessId, name: input.name, phone: input.phone, address: input.address })
    .select(COLUMNS)
    .single();
  if (error) {
    throw error;
  }
  return toCustomer(data);
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update({ name: input.name, phone: input.phone, address: input.address })
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (data === null) {
    throw new Error('Customer not found'); // updating a row that does not exist (or is not yours) changes nothing
  }
  return toCustomer(data);
}

// Permanent. The database refuses (error 23503) while the customer still has jobs; the screen explains that.
// Deleting a customer that is already gone (or not yours) removes nothing and is not an error.
export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) {
    throw error;
  }
}
