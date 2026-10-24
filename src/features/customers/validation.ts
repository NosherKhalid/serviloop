import { z } from 'zod';

// Turn a blank optional field into `null`, matching the nullable database columns.
function blankToNull(value: string): string | null {
  return value === '' ? null : value;
}

// iOS: a Zod schema is "Codable + validation" in one. Unlike a TypeScript type, it exists at
// runtime, so it can reject bad data. `.trim()` and `.transform()` clean values as they pass through.
export const customerFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(100, 'Keep the name under 100 characters'),
  phone: z.string().trim().max(30, 'Keep the phone number under 30 characters').transform(blankToNull),
  address: z.string().trim().max(200, 'Keep the address under 200 characters').transform(blankToNull),
});

// What the text fields hold: always strings, even when empty.
export type CustomerFormValues = z.input<typeof customerFormSchema>;
// What we save after validation: trimmed, with blank phone/address turned into null.
export type CustomerInput = z.output<typeof customerFormSchema>;

export type CustomerFormErrors = Partial<Record<keyof CustomerFormValues, string>>;

export type CustomerFormResult =
  | { success: true; data: CustomerInput }
  | { success: false; errors: CustomerFormErrors };

export const emptyCustomerForm: CustomerFormValues = { name: '', phone: '', address: '' };

// A plain function with no React in it, so it is easy to unit-test (slice 7).
export function validateCustomerForm(values: CustomerFormValues): CustomerFormResult {
  const result = customerFormSchema.safeParse(values); // `safeParse` returns a result instead of throwing

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: CustomerFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    // Keep only the first message per field, and only for fields we know about.
    if ((field === 'name' || field === 'phone' || field === 'address') && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}
