import { validateCredentials } from '@/features/auth/validation';

describe('validateCredentials', () => {
  it('cleans the email (trim, lower-case) when signing in', () => {
    expect(validateCredentials('signIn', { email: '  Jane.Doe@Example.COM ', password: 'x' })).toEqual({
      success: true,
      data: { email: 'jane.doe@example.com', password: 'x' },
    });
  });

  it('does not judge the strength of an existing password when signing in', () => {
    expect(validateCredentials('signIn', { email: 'a@b.co', password: 'short' }).success).toBe(true);
  });

  it('asks for a password when signing in without one', () => {
    expect(validateCredentials('signIn', { email: 'a@b.co', password: '' })).toEqual({
      success: false,
      errors: { password: 'Enter your password' },
    });
  });

  it('rejects an invalid email', () => {
    for (const email of ['', 'jane', 'jane@', '@example.com', 'jane example@x.com']) {
      const result = validateCredentials('signIn', { email, password: 'x' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.errors.email).toBe('Enter a valid email address');
    }
  });

  it('requires at least 8 characters for a new password', () => {
    const tooShort = validateCredentials('signUp', { email: 'a@b.co', password: '1234567' });
    expect(tooShort).toEqual({ success: false, errors: { password: 'Use at least 8 characters' } });
    expect(validateCredentials('signUp', { email: 'a@b.co', password: '12345678' }).success).toBe(true);
  });

  it('rejects a new password longer than 72 characters (the hashing limit)', () => {
    const result = validateCredentials('signUp', { email: 'a@b.co', password: 'x'.repeat(73) });
    expect(result).toEqual({ success: false, errors: { password: 'Use at most 72 characters' } });
  });

  it('reports both problems at once', () => {
    const result = validateCredentials('signUp', { email: 'nope', password: 'abc' });
    expect(result).toEqual({
      success: false,
      errors: { email: 'Enter a valid email address', password: 'Use at least 8 characters' },
    });
  });
});
