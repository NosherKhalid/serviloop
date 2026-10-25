import { formatScheduledDate } from '@/features/workOrders/format';

describe('formatScheduledDate', () => {
  it('shows date and time', () => {
    expect(formatScheduledDate('2026-10-26T09:00:00Z', { timeZone: 'UTC' })).toBe('Oct 26, 9:00 AM');
    expect(formatScheduledDate('2026-10-26T13:30:00Z', { timeZone: 'UTC' })).toBe('Oct 26, 1:30 PM');
  });

  it('shows the time on the phone\'s own clock, not in UTC', () => {
    // 09:00 UTC is 14:00 in Karachi (UTC+5, no daylight saving) and 05:00 in New York (UTC-4 in October).
    expect(formatScheduledDate('2026-10-26T09:00:00Z', { timeZone: 'Asia/Karachi' })).toBe('Oct 26, 2:00 PM');
    expect(formatScheduledDate('2026-10-26T09:00:00Z', { timeZone: 'America/New_York' })).toBe('Oct 26, 5:00 AM');
  });

  it('can roll over to the next day in another time zone', () => {
    expect(formatScheduledDate('2026-10-26T22:00:00Z', { timeZone: 'Asia/Karachi' })).toBe('Oct 27, 3:00 AM');
  });

  it('says "Not scheduled" for null or an unreadable date', () => {
    expect(formatScheduledDate(null)).toBe('Not scheduled');
    expect(formatScheduledDate('not a date')).toBe('Not scheduled');
  });
});
