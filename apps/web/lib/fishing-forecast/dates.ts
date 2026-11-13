const TIME_ZONE = 'America/Chicago';

/** Calendar date in Louisiana, YYYY-MM-DD. */
export function chicagoToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

/** 7 days back, today, and 7 days forward. */
export function forecastWindow(today = chicagoToday()): string[] {
  return Array.from({ length: 15 }, (_, index) => addDays(today, index - 7));
}

export function dayKind(date: string, today: string): 'observed' | 'forecast' {
  return date < today ? 'observed' : 'forecast';
}

export function formatDayLabel(isoDate: string): { weekday: string; monthDay: string } {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, 12));
  return {
    weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(utc),
    monthDay: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(utc),
  };
}
