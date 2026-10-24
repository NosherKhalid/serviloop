import { isNetworkProblem } from '@/utils/networkError';

// Turns an error from the auth service into one short, friendly sentence for the screen.
// Rules: never show raw service text (it can mention internals), and use the SAME message for
// "unknown email" and "wrong password" so the app cannot be used to discover who has an account.

type ErrorLike = { code?: unknown };

function asErrorLike(error: unknown): ErrorLike {
  return typeof error === 'object' && error !== null ? (error as ErrorLike) : {};
}

export function authErrorMessage(error: unknown): string {
  const e = asErrorLike(error);

  if (isNetworkProblem(error)) {
    return "We can't reach the server. Check your connection and try again.";
  }

  switch (e.code) {
    case 'invalid_credentials':
      return 'Email or password is incorrect.';
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Try signing in instead.';
    case 'email_not_confirmed':
      return 'Please confirm your email address first, then sign in.';
    case 'weak_password':
      return 'Choose a stronger password (at least 8 characters).';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Enter a valid email address.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
    case 'over_sms_send_rate_limit':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'signup_disabled':
      return 'New sign-ups are turned off right now.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
