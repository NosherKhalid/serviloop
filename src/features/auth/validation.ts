import { z } from 'zod';

// Same shape as the customer form: a pure function (no React) that returns either clean data or
// one message per field. The service enforces its own rules too; this is for instant, friendly feedback.

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

// 72 is the most a bcrypt password hash can use; longer input would be silently cut short.
const newPassword = z.string().min(8, 'Use at least 8 characters').max(72, 'Use at most 72 characters');

export const signInSchema = z.object({
  email,
  // Do not judge the strength of an existing password here, only that something was typed.
  password: z.string().min(1, 'Enter your password'),
});

export const signUpSchema = z.object({ email, password: newPassword });

export type CredentialsValues = { email: string; password: string };
export type CredentialsErrors = Partial<Record<keyof CredentialsValues, string>>;

export type CredentialsResult =
  | { success: true; data: CredentialsValues }
  | { success: false; errors: CredentialsErrors };

export type AuthMode = 'signIn' | 'signUp';

export function validateCredentials(mode: AuthMode, values: CredentialsValues): CredentialsResult {
  const result = (mode === 'signIn' ? signInSchema : signUpSchema).safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: CredentialsErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if ((field === 'email' || field === 'password') && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}
