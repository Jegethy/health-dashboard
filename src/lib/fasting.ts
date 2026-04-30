import { FastingEntry } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const DEFAULT_FASTING_TARGET_MINUTES = 16 * 60;
export const DEFAULT_FASTING_TARGET_HOURS = 16;

export type FastingEntryView = {
  id: number;
  startAt: string;
  endAt: string | null;
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  targetMinutes: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const localDateTimeSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
  "Use date and time.",
);

export const fastingInputSchema = z
  .object({
    startAt: localDateTimeSchema,
    endAt: localDateTimeSchema,
  })
  .transform((input) => {
    const startAt = parseLocalDateTimeInput(input.startAt);
    const endAt = parseLocalDateTimeInput(input.endAt);
    const durationMinutes = calculateDurationMinutes(startAt, endAt);

    return {
      startAt,
      endAt,
      durationMinutes,
      targetMinutes: DEFAULT_FASTING_TARGET_MINUTES,
    };
  })
  .superRefine((input, context) => {
    if (input.durationMinutes <= 0) {
      context.addIssue({
        code: "custom",
        message: "End time must be after start time.",
        path: ["endAt"],
      });
    }

    if (input.durationMinutes > 7 * 24 * 60) {
      context.addIssue({
        code: "custom",
        message: "Fasting duration looks too long.",
        path: ["endAt"],
      });
    }
  });

export type FastingInput = z.infer<typeof fastingInputSchema>;

export async function getFastingEntries(): Promise<FastingEntryView[]> {
  const entries = await prisma.fastingEntry.findMany({
    orderBy: [{ endAt: "asc" }, { startAt: "asc" }],
  });

  return entries.map(toFastingEntryView);
}

export async function createFastingEntry(input: FastingInput) {
  const entry = await prisma.fastingEntry.create({
    data: input,
  });

  return toFastingEntryView(entry);
}

export async function updateFastingEntry(id: number, input: FastingInput) {
  const entry = await prisma.fastingEntry.update({
    where: { id },
    data: input,
  });

  return toFastingEntryView(entry);
}

export async function deleteFastingEntry(id: number) {
  return prisma.fastingEntry.delete({
    where: { id },
  });
}

export async function getActiveFast() {
  const entry = await prisma.fastingEntry.findFirst({
    where: { endAt: null },
    orderBy: { startAt: "desc" },
  });

  return entry ? toFastingEntryView(entry) : null;
}

export async function startActiveFast(now = new Date()) {
  const active = await getActiveFast();

  if (active) {
    throw new Error("A fast is already active.");
  }

  if (now.getTime() > Date.now() + 60_000) {
    throw new Error("Start time cannot be in the future.");
  }

  const entry = await prisma.fastingEntry.create({
    data: {
      startAt: now,
      endAt: null,
      durationMinutes: null,
      targetMinutes: DEFAULT_FASTING_TARGET_MINUTES,
    },
  });

  return toFastingEntryView(entry);
}

export async function stopActiveFast(now = new Date()) {
  const active = await prisma.fastingEntry.findFirst({
    where: { endAt: null },
    orderBy: { startAt: "desc" },
  });

  if (!active) {
    throw new Error("No active fast exists.");
  }

  const durationMinutes = calculateDurationMinutes(active.startAt, now);

  if (durationMinutes <= 0) {
    throw new Error("End time must be after start time.");
  }

  if (durationMinutes > 7 * 24 * 60) {
    throw new Error("Fasting duration looks too long.");
  }

  const entry = await prisma.fastingEntry.update({
    where: { id: active.id },
    data: {
      endAt: now,
      durationMinutes,
      targetMinutes: DEFAULT_FASTING_TARGET_MINUTES,
    },
  });

  return toFastingEntryView(entry);
}

export async function cancelActiveFast() {
  const active = await prisma.fastingEntry.findFirst({
    where: { endAt: null },
    orderBy: { startAt: "desc" },
  });

  if (!active) {
    throw new Error("No active fast exists.");
  }

  await prisma.fastingEntry.delete({ where: { id: active.id } });
}

export function getCompletedFasts(entries: FastingEntryView[]) {
  return entries.filter(
    (entry): entry is FastingEntryView & { endAt: string; durationMinutes: number } =>
      !entry.active && entry.endAt != null && entry.durationMinutes != null,
  );
}

export function calculateDurationMinutes(startAt: Date, endAt: Date) {
  return Math.round((endAt.getTime() - startAt.getTime()) / 60000);
}

export function calculateElapsedMinutes(startAt: string, now = new Date()) {
  return Math.max(0, calculateDurationMinutes(parseStoredDateTime(startAt), now));
}

export function formatDuration(minutes: number) {
  const sign = minutes < 0 ? "-" : "";
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const remainder = absolute % 60;

  if (hours === 0) {
    return `${sign}${remainder}m`;
  }

  if (remainder === 0) {
    return `${sign}${hours}h`;
  }

  return `${sign}${hours}h ${remainder}m`;
}

export function calculateAverageFast(entries: FastingEntryView[]) {
  const completed = getCompletedFasts(entries);

  if (completed.length === 0) {
    return null;
  }

  return Math.round(
    completed.reduce((total, entry) => total + entry.durationMinutes, 0) / completed.length,
  );
}

export function getLongestFast(entries: FastingEntryView[]) {
  return getCompletedFasts(entries).reduce<FastingEntryView | null>(
    (longest, entry) =>
      !longest ||
      (longest.durationMinutes != null && entry.durationMinutes > longest.durationMinutes)
        ? entry
        : longest,
    null,
  );
}

export function getShortestFast(entries: FastingEntryView[]) {
  return getCompletedFasts(entries).reduce<FastingEntryView | null>(
    (shortest, entry) =>
      !shortest ||
      (shortest.durationMinutes != null && entry.durationMinutes < shortest.durationMinutes)
        ? entry
        : shortest,
    null,
  );
}

export function calculateTargetHitRate(entries: FastingEntryView[]) {
  const completed = getCompletedFasts(entries);

  if (completed.length === 0) {
    return null;
  }

  const hits = completed.filter((entry) => entry.durationMinutes >= entry.targetMinutes).length;
  return Math.round((hits / completed.length) * 100);
}

export function calculateTargetDifference(entry: FastingEntryView) {
  return entry.durationMinutes == null ? null : entry.durationMinutes - entry.targetMinutes;
}

export function formatDateTimeLabel(dateTime: string) {
  return dateTime.replace("T", " ");
}

export function formatTickDate(dateTime: string) {
  const [, month, day] = dateTime.slice(0, 10).split("-");
  return `${day}/${month}`;
}

export function formatHours(minutes: number) {
  return (minutes / 60).toFixed(1);
}

export function getFastingPreset() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(14, 0, 0, 0);

  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  start.setHours(22, 0, 0, 0);

  return {
    startAt: formatLocalDateTimeInput(start),
    endAt: formatLocalDateTimeInput(end),
  };
}

export function getRepeatPreset(entry: FastingEntryView | null) {
  if (!entry?.endAt) {
    return getFastingPreset();
  }

  const start = parseStoredDateTime(entry.startAt);
  const end = parseStoredDateTime(entry.endAt);
  start.setDate(start.getDate() + 1);
  end.setDate(end.getDate() + 1);

  return {
    startAt: formatLocalDateTimeInput(start),
    endAt: formatLocalDateTimeInput(end),
  };
}

function toFastingEntryView(entry: FastingEntry): FastingEntryView {
  const startAt = formatLocalDateTimeInput(entry.startAt);
  const endAt = entry.endAt ? formatLocalDateTimeInput(entry.endAt) : null;

  return {
    id: entry.id,
    startAt,
    endAt,
    startDate: startAt.slice(0, 10),
    startTime: startAt.slice(11, 16),
    endDate: endAt?.slice(0, 10) ?? null,
    endTime: endAt?.slice(11, 16) ?? null,
    durationMinutes: entry.durationMinutes,
    targetMinutes: entry.targetMinutes,
    active: entry.endAt == null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function parseLocalDateTimeInput(value: string) {
  return new Date(value);
}

function parseStoredDateTime(value: string) {
  return new Date(value);
}

function formatLocalDateTimeInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
