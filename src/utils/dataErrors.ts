import { isNetworkProblem } from './networkError';

// One friendly sentence for a failed data request (load or save). Never shows raw service text,
// which can mention table or column names. `fallback` is the screen's own generic sentence.
type ErrorLike = { code?: unknown };

export function dataErrorMessage(error: unknown, fallback: string): string {
  if (isNetworkProblem(error)) {
    return "We can't reach the server. Check your connection and try again.";
  }
  const code = typeof error === 'object' && error !== null ? (error as ErrorLike).code : undefined;
  // 42501 = not allowed; 28000 / PGRST301 = the login has expired or is invalid.
  if (code === '42501' || code === '28000' || code === 'PGRST301') {
    return 'Your session has expired. Please sign in again.';
  }
  return fallback;
}
