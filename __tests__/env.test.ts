import { parseSupabaseEnv } from '@/lib/env';

const validUrl = 'https://abcdefghijklmnopqrst.supabase.co';
const validKey = 'sb_publishable_FAKEKEYFORTESTS123456789';

describe('parseSupabaseEnv', () => {
  it('accepts a hosted project URL and a publishable key', () => {
    expect(parseSupabaseEnv({ url: validUrl, publishableKey: validKey })).toEqual({ url: validUrl, publishableKey: validKey });
  });

  it('says which settings are missing', () => {
    expect(() => parseSupabaseEnv({ url: undefined, publishableKey: undefined })).toThrow(
      /EXPO_PUBLIC_SUPABASE_URL is missing[\s\S]*EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing/,
    );
  });

  it('rejects the placeholder values from .env.example', () => {
    expect(() =>
      parseSupabaseEnv({ url: 'https://YOUR_PROJECT_REF.supabase.co', publishableKey: 'YOUR_PUBLISHABLE_KEY' }),
    ).toThrow(/invalid/);
  });

  it('refuses a secret key and never repeats it in the error', () => {
    const secret = 'sb_secret_THISMUSTNEVERBEPRINTED';
    let message = '';
    try {
      parseSupabaseEnv({ url: validUrl, publishableKey: secret });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }
    expect(message).toMatch(/publishable key/);
    expect(message).not.toContain('THISMUSTNEVERBEPRINTED');
  });

  it('refuses a legacy JWT-style key and an http URL', () => {
    expect(() => parseSupabaseEnv({ url: validUrl, publishableKey: 'eyJhbGciOiJIUzI1NiJ9.payload.signature' })).toThrow();
    expect(() => parseSupabaseEnv({ url: 'http://abcdefghijklmnopqrst.supabase.co', publishableKey: validKey })).toThrow();
  });
});
