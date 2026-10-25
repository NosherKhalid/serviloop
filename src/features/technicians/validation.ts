import { z } from 'zod';

// Same shape and limits as the database (name 2-100, specialty up to 100 or empty).
function blankToNull(value: string): string | null {
  return value === '' ? null : value;
}

export const technicianFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(100, 'Keep the name under 100 characters'),
  specialty: z.string().trim().max(100, 'Keep the specialty under 100 characters').transform(blankToNull),
});

export type TechnicianFormValues = z.input<typeof technicianFormSchema>;
export type TechnicianInput = z.output<typeof technicianFormSchema>;
export type TechnicianFormErrors = Partial<Record<keyof TechnicianFormValues, string>>;

export type TechnicianFormResult =
  | { success: true; data: TechnicianInput }
  | { success: false; errors: TechnicianFormErrors };

export const emptyTechnicianForm: TechnicianFormValues = { name: '', specialty: '' };

export function validateTechnicianForm(values: TechnicianFormValues): TechnicianFormResult {
  const result = technicianFormSchema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: TechnicianFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if ((field === 'name' || field === 'specialty') && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}
