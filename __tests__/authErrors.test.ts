import { authErrorMessage } from '@/features/auth/errors';

describe('authErrorMessage', () => {
  it('uses one message for a wrong password and an unknown email (no account discovery)', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', status: 400, message: 'Invalid login credentials' })).toBe(
      'Email or password is incorrect.',
    );
  });

  it('explains an email that is already registered', () => {
    expect(authErrorMessage({ code: 'user_already_exists' })).toMatch(/already exists/);
    expect(authErrorMessage({ code: 'email_exists' })).toMatch(/already exists/);
  });

  it('explains rate limits', () => {
    expect(authErrorMessage({ code: 'over_request_rate_limit', status: 429 })).toMatch(/Too many attempts/);
    expect(authErrorMessage({ code: 'over_email_send_rate_limit' })).toMatch(/Too many attempts/);
  });

  it('recognises a network problem however it is reported', () => {
    const friendly = "We can't reach the server. Check your connection and try again.";
    expect(authErrorMessage({ name: 'AuthRetryableFetchError', message: 'x', status: 0 })).toBe(friendly);
    expect(authErrorMessage(new TypeError('Network request failed'))).toBe(friendly);
    expect(authErrorMessage({ status: 0 })).toBe(friendly);
  });

  it('handles weak passwords, invalid emails and unconfirmed emails', () => {
    expect(authErrorMessage({ code: 'weak_password' })).toMatch(/stronger password/);
    expect(authErrorMessage({ code: 'email_address_invalid' })).toMatch(/valid email/);
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toMatch(/confirm your email/);
  });

  it('never shows raw service text for unknown errors', () => {
    const message = authErrorMessage({ code: 'something_new', message: 'duplicate key value violates unique constraint "users_pkey"' });
    expect(message).toBe('Something went wrong. Please try again.');
    expect(authErrorMessage('a string')).toBe('Something went wrong. Please try again.');
    expect(authErrorMessage(null)).toBe('Something went wrong. Please try again.');
    expect(authErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
  });
});
