import { addDays, startOfWeek } from "date-fns";

export function normalizeDate(input: string): Date {
  return new Date(`${input}T00:00:00.000Z`);
}

export function isoDate(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function mondayOf(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}
