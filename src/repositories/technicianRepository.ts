import type { TechnicianInput } from '@/features/technicians/validation';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { Technician } from '@/types/technician';

// Row-level security means every query only sees the signed-in owner's own technicians.

type TechnicianRow = Database['public']['Tables']['technicians']['Row'];

const COLUMNS = 'id, name, specialty, active';

function toTechnician(row: Pick<TechnicianRow, 'id' | 'name' | 'specialty' | 'active'>): Technician {
  return { id: row.id, name: row.name, specialty: row.specialty, active: row.active };
}

// Active technicians first, then alphabetical, so people who left sink to the bottom of the list.
export async function listTechnicians(): Promise<Technician[]> {
  const { data, error } = await supabase
    .from('technicians')
    .select(COLUMNS)
    .order('active', { ascending: false })
    .order('name', { ascending: true });
  if (error) {
    throw error;
  }
  return data.map(toTechnician);
}

export async function getTechnician(id: string): Promise<Technician | null> {
  const { data, error } = await supabase.from('technicians').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) {
    throw error;
  }
  return data === null ? null : toTechnician(data);
}

export async function createTechnician(businessId: string, input: TechnicianInput): Promise<Technician> {
  const { data, error } = await supabase
    .from('technicians')
    .insert({ business_id: businessId, name: input.name, specialty: input.specialty })
    .select(COLUMNS)
    .single();
  if (error) {
    throw error;
  }
  return toTechnician(data);
}

export async function updateTechnician(id: string, input: TechnicianInput): Promise<Technician> {
  const { data, error } = await supabase
    .from('technicians')
    .update({ name: input.name, specialty: input.specialty })
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (data === null) {
    throw new Error('Technician not found');
  }
  return toTechnician(data);
}

// Deactivate (or reactivate) instead of deleting: old jobs keep pointing at this person.
export async function setTechnicianActive(id: string, active: boolean): Promise<Technician> {
  const { data, error } = await supabase.from('technicians').update({ active }).eq('id', id).select(COLUMNS).maybeSingle();
  if (error) {
    throw error;
  }
  if (data === null) {
    throw new Error('Technician not found');
  }
  return toTechnician(data);
}
