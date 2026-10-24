import { z } from 'zod';

// Same limits as the database (2-100 characters after trimming), so the person hears about a
// problem before anything is sent.
export const businessNameSchema = z
  .string()
  .trim()
  .min(2, 'Enter at least 2 characters')
  .max(100, 'Keep the name under 100 characters');

export type BusinessNameResult = { success: true; name: string } | { success: false; error: string };

export function validateBusinessName(value: string): BusinessNameResult {
  const result = businessNameSchema.safeParse(value);
  return result.success ? { success: true, name: result.data } : { success: false, error: result.error.issues[0]?.message ?? 'Enter a business name' };
}
