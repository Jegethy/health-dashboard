import { differenceInCalendarDays } from "date-fns";
import { parseDateInput } from "@/lib/dates";
import { FITBIT_PROVIDER, getFitbitConfigError } from "@/lib/integrations/fitbit/config";
import { fitbitFetch } from "@/lib/integrations/fitbit/client";
import { prisma } from "@/lib/prisma";
import { HealthDataProvider, ProviderStatus, SyncSummary } from "@/lib/integrations/types";

type TimeSeriesResponse = Record<string, Array<{ dateTime: string; value: string }>>;
type WeightLogResponse = {
  weight?: Array<{ date: string; weight: number }>;
};
type FoodLogResponse = {
  summary?: { calories?: number };
};

type FitbitDailyMetrics = {
  date: string;
  weightKg?: number;
  steps?: number;
  caloriesBurned?: number;
  caloriesEaten?: number;
};

export const fitbitProvider: HealthDataProvider = {
  providerName: FITBIT_PROVIDER,
  connectUrl: "/api/integrations/fitbit/connect",
  getStatus: getFitbitStatus,
  syncDailyMetrics: syncFitbitDailyMetrics,
};

export async function getFitbitStatus(): Promise<ProviderStatus> {
  const configError = getFitbitConfigError();
  const [account, lastLog] = await Promise.all([
    prisma.integrationAccount.findFirst({
      where: { provider: FITBIT_PROVIDER },
      orderBy: { connectedAt: "desc" },
    }),
    prisma.syncLog.findFirst({
      where: { provider: FITBIT_PROVIDER },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  return {
    configured: configError == null,
    connected: account != null,
    providerUserId: account?.providerUserId ?? null,
    displayName: account?.displayName ?? null,
    email: account?.email ?? null,
    scopes: account?.scopes?.split(/\s+/).filter(Boolean) ?? [],
    connectedAt: account?.connectedAt.toISOString() ?? null,
    lastSyncAt: account?.lastSyncAt?.toISOString() ?? null,
    lastSyncStatus: lastLog?.status ?? null,
    lastSyncMessage: lastLog?.message ?? null,
    configError,
  };
}

export async function syncFitbitDailyMetrics(fromDate: string, toDate: string): Promise<SyncSummary> {
  const startedAt = new Date();
  const log = await prisma.syncLog.create({
    data: {
      provider: FITBIT_PROVIDER,
      startedAt,
      status: "running",
      fromDate: parseDateInput(fromDate),
      toDate: parseDateInput(toDate),
    },
  });

  const summary: SyncSummary = {
    provider: FITBIT_PROVIDER,
    fromDate,
    toDate,
    createdCount: 0,
    updatedCount: 0,
    skippedFields: 0,
    errorCount: 0,
    errors: [],
  };

  try {
    const configError = getFitbitConfigError();

    if (configError) {
      throw new Error(configError);
    }

    if (differenceInCalendarDays(parseDateInput(toDate), parseDateInput(fromDate)) < 0) {
      throw new Error("Sync end date must be on or after the start date.");
    }

    const metrics = await fetchFitbitMetrics(fromDate, toDate, summary);

    for (const metric of metrics.values()) {
      const result = await upsertFitbitMetric(metric);
      summary.createdCount += result.created ? 1 : 0;
      summary.updatedCount += result.updated ? 1 : 0;
      summary.skippedFields += result.skippedFields;
    }

    await prisma.integrationAccount.updateMany({
      where: { provider: FITBIT_PROVIDER },
      data: { lastSyncAt: new Date() },
    });

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        status: summary.errorCount > 0 ? "partial" : "success",
        message: summary.errors.join(" | ") || "Fitbit sync completed.",
        createdCount: summary.createdCount,
        updatedCount: summary.updatedCount,
        errorCount: summary.errorCount,
      },
    });

    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fitbit sync failed.";
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        status: "error",
        message,
        createdCount: summary.createdCount,
        updatedCount: summary.updatedCount,
        errorCount: summary.errorCount + 1,
      },
    });

    throw error;
  }
}

async function fetchFitbitMetrics(
  fromDate: string,
  toDate: string,
  summary: SyncSummary,
): Promise<Map<string, FitbitDailyMetrics>> {
  const metrics = new Map<string, FitbitDailyMetrics>();

  await fetchTimeSeries("activities/steps", "steps", fromDate, toDate, metrics, summary);
  await fetchTimeSeries("activities/calories", "caloriesBurned", fromDate, toDate, metrics, summary);
  await fetchWeight(fromDate, toDate, metrics, summary);
  await fetchNutrition(fromDate, toDate, metrics, summary);

  return metrics;
}

async function fetchTimeSeries(
  path: string,
  field: "steps" | "caloriesBurned",
  fromDate: string,
  toDate: string,
  metrics: Map<string, FitbitDailyMetrics>,
  summary: SyncSummary,
) {
  try {
    const response = await fitbitFetch<TimeSeriesResponse>(
      `/1/user/-/${path}/date/${fromDate}/${toDate}.json`,
    );
    const rows = response[path] ?? [];

    for (const row of rows) {
      const value = Number(row.value);

      if (Number.isFinite(value)) {
        mergeMetric(metrics, row.dateTime, { [field]: Math.round(value) });
      }
    }
  } catch (error) {
    summary.errorCount += 1;
    summary.errors.push(`${field}: ${errorMessage(error)}`);
  }
}

async function fetchWeight(
  fromDate: string,
  toDate: string,
  metrics: Map<string, FitbitDailyMetrics>,
  summary: SyncSummary,
) {
  try {
    const response = await fitbitFetch<WeightLogResponse>(
      `/1/user/-/body/log/weight/date/${fromDate}/${toDate}.json`,
    );

    for (const row of response.weight ?? []) {
      const value = Number(row.weight);

      if (Number.isFinite(value)) {
        mergeMetric(metrics, row.date, { weightKg: value });
      }
    }
  } catch (error) {
    summary.errorCount += 1;
    summary.errors.push(`weightKg: ${errorMessage(error)}`);
  }
}

async function fetchNutrition(
  fromDate: string,
  toDate: string,
  metrics: Map<string, FitbitDailyMetrics>,
  summary: SyncSummary,
) {
  const dayCount = differenceInCalendarDays(parseDateInput(toDate), parseDateInput(fromDate));

  for (let index = 0; index <= dayCount; index += 1) {
    const date = new Date(parseDateInput(fromDate));
    date.setUTCDate(date.getUTCDate() + index);
    const dateString = date.toISOString().slice(0, 10);

    try {
      const response = await fitbitFetch<FoodLogResponse>(`/1/user/-/foods/log/date/${dateString}.json`);
      const calories = response.summary?.calories;

      if (typeof calories === "number" && Number.isFinite(calories)) {
        mergeMetric(metrics, dateString, { caloriesEaten: Math.round(calories) });
      }
    } catch (error) {
      summary.errorCount += 1;
      summary.errors.push(`caloriesEaten ${dateString}: ${errorMessage(error)}`);
    }
  }
}

async function upsertFitbitMetric(metric: FitbitDailyMetrics) {
  const existing = await prisma.dailyHealthEntry.findUnique({
    where: { date: parseDateInput(metric.date) },
  });
  const updateData = {
    ...(metric.weightKg != null ? { weightKg: metric.weightKg } : {}),
    ...(metric.steps != null ? { steps: metric.steps } : {}),
    ...(metric.caloriesEaten != null ? { caloriesEaten: metric.caloriesEaten } : {}),
    ...(metric.caloriesBurned != null ? { caloriesBurned: metric.caloriesBurned } : {}),
    source: existing && existing.source !== FITBIT_PROVIDER ? "mixed" : FITBIT_PROVIDER,
    sourceUpdatedAt: new Date(),
    fitbitSyncedAt: new Date(),
  };
  const realFieldCount = ["weightKg", "steps", "caloriesEaten", "caloriesBurned"].filter(
    (field) => metric[field as keyof FitbitDailyMetrics] != null,
  ).length;

  if (!existing) {
    await prisma.dailyHealthEntry.create({
      data: {
        date: parseDateInput(metric.date),
        notes: "",
        ...updateData,
      },
    });

    return { created: true, updated: false, skippedFields: 4 - realFieldCount };
  }

  await prisma.dailyHealthEntry.update({
    where: { id: existing.id },
    data: updateData,
  });

  return { created: false, updated: true, skippedFields: 4 - realFieldCount };
}

function mergeMetric(
  metrics: Map<string, FitbitDailyMetrics>,
  date: string,
  patch: Partial<FitbitDailyMetrics>,
) {
  metrics.set(date, {
    date,
    ...(metrics.get(date) ?? {}),
    ...patch,
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown Fitbit API error.";
}
