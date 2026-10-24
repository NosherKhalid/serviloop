import { z } from 'zod';

import { supabase } from '@/lib/supabase';

export type Business = {
  id: string;
  name: string;
};

export type DemoDataSummary = {
  customers: number;
  technicians: number;
  jobs: number;
};

// The database function `load_demo_data()` returns loosely typed JSON. Types vanish at runtime,
// so check the answer before trusting it.
const demoDataResultSchema = z.object({
  customers: z.number(),
  technicians: z.number(),
  jobs: z.number(),
});

// Row-level security guarantees this can only ever return the signed-in owner's own business.
// `null` means "this person has not set up a business yet" (not an error).
export async function getMyBusiness(): Promise<Business | null> {
  const { data, error } = await supabase.from('businesses').select('id, name').maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

// The owner is filled in by the database from the signed-in user; the app never sends it.
export async function createBusiness(name: string): Promise<Business> {
  const { data, error } = await supabase.from('businesses').insert({ name }).select('id, name').single();
  if (error) {
    throw error;
  }
  return data;
}

// Creates the owner's business if needed and fills it with fictional customers, technicians and jobs.
// The database refuses if the business already has any data.
export async function loadDemoData(): Promise<{ business: Business; summary: DemoDataSummary }> {
  const { data, error } = await supabase.rpc('load_demo_data');
  if (error) {
    throw error;
  }
  const summary = demoDataResultSchema.parse(data);
  const business = await getMyBusiness();
  if (business === null) {
    throw new Error('Demo data was loaded but the business could not be found.');
  }
  return { business, summary: { customers: summary.customers, technicians: summary.technicians, jobs: summary.jobs } };
}
