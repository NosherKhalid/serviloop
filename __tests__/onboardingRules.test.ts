import { businessErrorMessage } from '@/features/onboarding/errors';
import { validateBusinessName } from '@/features/onboarding/validation';

describe('validateBusinessName', () => {
  it('trims the name', () => {
    expect(validateBusinessName('  Riverside Plumbing  ')).toEqual({ success: true, name: 'Riverside Plumbing' });
  });

  it('rejects names that are too short, blank or too long (same limits as the database)', () => {
    expect(validateBusinessName('R')).toEqual({ success: false, error: 'Enter at least 2 characters' });
    expect(validateBusinessName('    ')).toEqual({ success: false, error: 'Enter at least 2 characters' });
    expect(validateBusinessName('x'.repeat(101))).toEqual({ success: false, error: 'Keep the name under 100 characters' });
    expect(validateBusinessName('x'.repeat(100)).success).toBe(true);
  });
});

describe('businessErrorMessage', () => {
  it('explains each known situation in plain words', () => {
    expect(businessErrorMessage(new TypeError('Network request failed'))).toMatch(/can't reach the server/);
    expect(businessErrorMessage({ code: '23505', message: 'duplicate key value violates unique constraint "businesses_owner_id_key"' })).toBe(
      'You already have a business set up.',
    );
    expect(businessErrorMessage({ code: '42501' })).toMatch(/sign in again/);
    expect(businessErrorMessage({ code: 'P0001', message: 'This business already has data. Demo data can only be loaded into an empty business.' })).toMatch(
      /already has data/,
    );
  });

  it('never shows raw database text for anything else', () => {
    const message = businessErrorMessage({ code: '23514', message: 'new row for relation "businesses" violates check constraint "businesses_name_check"' });
    expect(message).toBe('Something went wrong. Please try again.');
    expect(message).not.toMatch(/relation|constraint|businesses_name_check/);
    expect(businessErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
  });
});
