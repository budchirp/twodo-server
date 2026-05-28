const millisecondsPerDay = 24 * 60 * 60 * 1000;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateString(value: string): Date | null {
  if (!datePattern.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return toDateString(date) === value ? date : null;
}

export function addDays(value: string, days: number): string {
  const date = parseDateString(value);
  if (!date) {
    return value;
  }

  date.setUTCDate(date.getUTCDate() + days);
  return toDateString(date);
}

export function daysBetween(startDate: string, endDate: string): number {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);

  if (!start || !end) {
    return 0;
  }

  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay);
}

export function datesBetweenInclusive(
  startDate: string,
  endDate: string,
): string[] {
  const days = daysBetween(startDate, endDate);
  if (days < 0) {
    return [];
  }

  return Array.from({ length: days + 1 }, (_, index) => addDays(startDate, index));
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayDateString(): string {
  return toDateString(new Date());
}
