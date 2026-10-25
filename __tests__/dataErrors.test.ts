import { dataErrorMessage } from '@/utils/dataErrors';

describe('dataErrorMessage', () => {
  const fallback = "We couldn't save this. Please try again.";

  it('explains a missing connection', () => {
    expect(dataErrorMessage(new TypeError('Network request failed'), fallback)).toBe("We can't reach the server. Check your connection and try again.");
  });

  it('explains an expired or refused login', () => {
    for (const code of ['42501', '28000', 'PGRST301']) {
      expect(dataErrorMessage({ code }, fallback)).toBe('Your session has expired. Please sign in again.');
    }
  });

  it('uses the screen\'s own sentence for everything else and never shows raw database text', () => {
    const raw = { code: '23514', message: 'new row for relation "customers" violates check constraint "customers_name_check"' };
    expect(dataErrorMessage(raw, fallback)).toBe(fallback);
    expect(dataErrorMessage(undefined, fallback)).toBe(fallback);
    expect(dataErrorMessage('boom', fallback)).toBe(fallback);
  });
});
