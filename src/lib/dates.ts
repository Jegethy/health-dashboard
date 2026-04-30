export function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateInput(date: Date | string): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  return parsed.toISOString().slice(0, 10);
}
