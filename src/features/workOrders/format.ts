type FormatOptions = {
  // Defaults to the phone's own time zone (what the owner sees on their clock). Tests pass 'UTC'.
  timeZone?: string;
};

// e.g. "Oct 26, 9:00 AM" in the phone's time zone; "Not scheduled" when there is no (valid) date.
export function formatScheduledDate(isoDate: string | null, options: FormatOptions = {}): string {
  if (isoDate === null) {
    return 'Not scheduled';
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: options.timeZone,
  });
}
