import { isNetworkProblem } from '@/utils/networkError';

// Friendly, fixed messages for setting up a business. Never shows raw database text.
type ErrorLike = { code?: unknown; message?: unknown };

export function businessErrorMessage(error: unknown): string {
  if (isNetworkProblem(error)) {
    return "We can't reach the server. Check your connection and try again.";
  }
  const e: ErrorLike = typeof error === 'object' && error !== null ? error : {};

  if (e.code === '23505') {
    return 'You already have a business set up.';
  }
  if (e.code === '42501' || e.code === '28000' || e.code === 'PGRST301') {
    return 'Your session has expired. Please sign in again.';
  }
  // Raised on purpose by `load_demo_data()` when the business already holds data.
  if (typeof e.message === 'string' && /already has data/i.test(e.message)) {
    return "This business already has data, so demo data can't be loaded.";
  }
  return 'Something went wrong. Please try again.';
}
