import { format, parseISO } from "date-fns";

export function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateInput(date: Date | string): string {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return format(parsed, "yyyy-MM-dd");
}
