import { differenceInCalendarDays, subDays } from "date-fns";

export type HealthEntry = {
  date: string;
  weightKg: number | null;
  steps: number | null;
  caloriesEaten: number | null;
  caloriesBurned: number | null;
};

export function calorieBalance(entry: HealthEntry): number | null {
  if (entry.caloriesBurned == null || entry.caloriesEaten == null) {
    return null;
  }

  return entry.caloriesBurned - entry.caloriesEaten;
}

export function weightChange(entries: HealthEntry[]): number | null {
  const withWeight = entries
    .filter((entry) => entry.weightKg != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (withWeight.length < 2) {
    return null;
  }

  return withWeight[withWeight.length - 1].weightKg! - withWeight[0].weightKg!;
}

export function latestWeight(entries: HealthEntry[]): number | null {
  return [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((entry) => entry.weightKg != null)?.weightKg ?? null;
}

export function averageStepsLast7Days(entries: HealthEntry[]): number | null {
  const recent = entriesInLast7Days(entries).filter((entry) => entry.steps != null);
  return average(recent.map((entry) => entry.steps!));
}

export function averageDeficitLast7Days(entries: HealthEntry[]): number | null {
  const balances = entriesInLast7Days(entries)
    .map(calorieBalance)
    .filter((balance): balance is number => balance != null);

  return average(balances);
}

export function currentEntryStreak(entries: HealthEntry[]): number {
  const uniqueDates = new Set(entries.map((entry) => entry.date));

  if (uniqueDates.size === 0) {
    return 0;
  }

  const newestDate = [...uniqueDates].sort().at(-1)!;
  let cursor = new Date(`${newestDate}T00:00:00.000Z`);
  let streak = 0;

  while (uniqueDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
}

function entriesInLast7Days(entries: HealthEntry[]): HealthEntry[] {
  if (entries.length === 0) {
    return [];
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const newest = new Date(`${sorted[0].date}T00:00:00.000Z`);

  return sorted.filter((entry) => {
    const entryDate = new Date(`${entry.date}T00:00:00.000Z`);
    const age = differenceInCalendarDays(newest, entryDate);
    return age >= 0 && age < 7;
  });
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}
