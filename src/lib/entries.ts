import { DailyHealthEntry } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatDateInput, parseDateInput } from "@/lib/dates";
import { EntryInput } from "@/lib/validation";

export type EntryView = {
  id: number;
  date: string;
  weightKg: number | null;
  steps: number | null;
  caloriesEaten: number | null;
  caloriesBurned: number | null;
  notes: string;
  source: string;
  sourceUpdatedAt: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getEntries(): Promise<EntryView[]> {
  await seedIfEmpty();

  const entries = await prisma.dailyHealthEntry.findMany({
    orderBy: { date: "asc" },
  });

  return entries.map(toEntryView);
}

export async function upsertEntry(input: EntryInput, source = "manual"): Promise<EntryView> {
  const date = parseDateInput(input.date);
  const existing = await prisma.dailyHealthEntry.findUnique({
    where: { date },
  });
  const nextSource = existing && existing.source !== source ? "mixed" : source;

  const entry = await prisma.dailyHealthEntry.upsert({
    where: { date },
    update: {
      weightKg: input.weightKg,
      steps: input.steps,
      caloriesEaten: input.caloriesEaten,
      caloriesBurned: input.caloriesBurned,
      notes: input.notes,
      source: nextSource,
      sourceUpdatedAt: new Date(),
    },
    create: {
      date,
      weightKg: input.weightKg,
      steps: input.steps,
      caloriesEaten: input.caloriesEaten,
      caloriesBurned: input.caloriesBurned,
      notes: input.notes,
      source,
      sourceUpdatedAt: new Date(),
    },
  });

  return toEntryView(entry);
}

async function seedIfEmpty() {
  const count = await prisma.dailyHealthEntry.count();

  if (count > 0) {
    return;
  }

  const today = new Date();

  await prisma.dailyHealthEntry.createMany({
    data: Array.from({ length: 12 }, (_, index) => {
      const day = subDays(today, 11 - index);

      return {
        date: parseDateInput(formatDateInput(day)),
        weightKg: Number((96.8 - index * 0.18 + (index % 3) * 0.05).toFixed(1)),
        steps: 5600 + index * 430 + (index % 4) * 370,
        caloriesEaten: 2380 - index * 18 + (index % 3) * 70,
        caloriesBurned: 2630 + index * 35 + (index % 2) * 120,
        notes: index === 0 ? "Fictional starter data." : "",
        source: "sample",
        sourceUpdatedAt: new Date(),
      };
    }),
  });
}

function toEntryView(entry: DailyHealthEntry): EntryView {
  return {
    id: entry.id,
    date: formatDateInput(entry.date),
    weightKg: entry.weightKg,
    steps: entry.steps,
    caloriesEaten: entry.caloriesEaten,
    caloriesBurned: entry.caloriesBurned,
    notes: entry.notes ?? "",
    source: entry.source,
    sourceUpdatedAt: entry.sourceUpdatedAt?.toISOString() ?? null,
    syncedAt: entry.syncedAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
