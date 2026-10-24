// Formats a scheduled time for the job list, e.g. "Oct 26". Shown in UTC for now, so the result is
// the same on every device; real time-zone handling arrives with the database in M3.
export function formatScheduledDate(isoDate: string | null): string {
  if (isoDate === null) {
    return 'Not scheduled';
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
