import { differenceInCalendarDays } from "date-fns";
import { parseDateInput } from "@/lib/dates";
import {
  GOOGLE_HEALTH_PROVIDER,
  REQUIRED_GOOGLE_HEALTH_SYNC_SCOPES,
  getGoogleHealthConfigError,
  getGoogleHealthConfig,
  getMissingRequiredGoogleHealthScopes,
} from "@/lib/integrations/google-health/config";
import {
  civilDateToString,
  debugSync,
  fetchGoogleHealthDailyRollup,
  rollupPointRawFields,
} from "@/lib/integrations/google-health/rollup";
import { HealthDataProvider, ProviderStatus, SyncSummary } from "@/lib/integrations/types";
import { prisma } from "@/lib/prisma";

type GoogleHealthMetric = {
  date: string;
  weightKg?: number;
  steps?: number;
  caloriesBurned?: number;
};

const SYNC_DATA_TYPES = ["steps", "total-calories", "weight"] as const;
const DATA_TYPE_SCOPES: Record<(typeof SYNC_DATA_TYPES)[number], string> = {
  steps: REQUIRED_GOOGLE_HEALTH_SYNC_SCOPES[0],
  "total-calories": REQUIRED_GOOGLE_HEALTH_SYNC_SCOPES[0],
  weight: REQUIRED_GOOGLE_HEALTH_SYNC_SCOPES[1],
};

export const googleHealthProvider: HealthDataProvider = {
  providerName: GOOGLE_HEALTH_PROVIDER,
  connectUrl: "/api/integrations/google-health/connect",
  getStatus: getGoogleHealthStatus,
  syncDailyMetrics: syncGoogleHealthDailyMetrics,
};

export async function getGoogleHealthStatus(): Promise<ProviderStatus> {
  const config = getGoogleHealthConfig();
  const configError = getGoogleHealthConfigError();
  const [account, lastLog] = await Promise.all([
    prisma.integrationAccount.findFirst({
      where: { provider: GOOGLE_HEALTH_PROVIDER },
      orderBy: { connectedAt: "desc" },
    }),
    prisma.syncLog.findFirst({
      where: { provider: GOOGLE_HEALTH_PROVIDER },
      orderBy: { startedAt: "desc" },
    }),
  ]);
  const grantedScopes = account?.scopes?.split(/\s+/).filter(Boolean) ?? [];

  return {
    configured: configError == null,
    connected: account != null,
    providerUserId: account?.providerUserId ?? null,
    googleHealthUserId: account?.googleHealthUserId ?? null,
    legacyFitbitUserId: account?.legacyFitbitUserId ?? null,
    displayName: account?.displayName ?? null,
    email: account?.email ?? null,
    scopes: grantedScopes,
    configuredScopes: config.scopes,
    requiredScopes: [...REQUIRED_GOOGLE_HEALTH_SYNC_SCOPES],
    missingRequiredScopes: grantedScopes.length > 0 ? getMissingRequiredGoogleHealthScopes(grantedScopes) : [],
    connectedAt: account?.connectedAt.toISOString() ?? null,
    lastSyncAt: account?.lastSyncAt?.toISOString() ?? null,
    lastSyncStatus: lastLog?.status ?? null,
    lastSyncMessage: lastLog?.message ?? null,
    configError,
  };
}

export async function syncGoogleHealthDailyMetrics(fromDate: string, toDate: string): Promise<SyncSummary> {
  const log = await prisma.syncLog.create({
    data: {
      provider: GOOGLE_HEALTH_PROVIDER,
      startedAt: new Date(),
      status: "running",
      fromDate: parseDateInput(fromDate),
      toDate: parseDateInput(toDate),
    },
  });
  const summary: SyncSummary = {
    provider: GOOGLE_HEALTH_PROVIDER,
    fromDate,
    toDate,
    createdCount: 0,
    updatedCount: 0,
    skippedFields: 0,
    errorCount: 0,
    errors: [],
    syncLogId: log.id,
  };

  try {
    const configError = getGoogleHealthConfigError();

    if (configError) {
      throw new Error(configError);
    }

    if (differenceInCalendarDays(parseDateInput(toDate), parseDateInput(fromDate)) < 0) {
      throw new Error("Sync end date must be on or after the start date.");
    }

    const metrics = await fetchGoogleHealthMetrics(fromDate, toDate, summary);

    for (const metric of metrics.values()) {
      const result = await upsertGoogleHealthMetric(metric);
      summary.createdCount += result.created ? 1 : 0;
      summary.updatedCount += result.updated ? 1 : 0;
      summary.skippedFields += result.skippedFields;
    }

    await prisma.integrationAccount.updateMany({
      where: { provider: GOOGLE_HEALTH_PROVIDER },
      data: { lastSyncAt: new Date() },
    });

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        status: summary.errorCount > 0 ? "partial" : "success",
        message: summary.errors.join(" | ") || "Google Health sync completed.",
        createdCount: summary.createdCount,
        updatedCount: summary.updatedCount,
        errorCount: summary.errorCount,
      },
    });

    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Health sync failed.";
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

async function fetchGoogleHealthMetrics(
  fromDate: string,
  toDate: string,
  summary: SyncSummary,
): Promise<Map<string, GoogleHealthMetric>> {
  const metrics = new Map<string, GoogleHealthMetric>();
  const account = await prisma.integrationAccount.findFirst({
    where: { provider: GOOGLE_HEALTH_PROVIDER },
    orderBy: { connectedAt: "desc" },
  });
  if (!account) {
    throw new Error("Google Health account is not connected.");
  }
  const grantedScopes = account?.scopes?.split(/\s+/).filter(Boolean) ?? [];
  const scopesKnown = grantedScopes.length > 0;

  for (const dataType of SYNC_DATA_TYPES) {
    const requiredScope = DATA_TYPE_SCOPES[dataType];

    if (scopesKnown && !grantedScopes.includes(requiredScope)) {
      summary.errorCount += 1;
      summary.errors.push(`${dataType}: missing required OAuth scope ${requiredScope}`);
      debugSync({
        dataType,
        fromDate,
        toDate,
        skipped: "missing_required_scope",
        requiredScope,
        grantedScopes,
      });
      continue;
    }

    try {
      debugSync({
        dataType,
        fromDate,
        toDate,
        requestRange: {
          startInclusive: fromDate,
          endInclusive: toDate,
        },
      });
      const points = await fetchGoogleHealthDailyRollup(dataType, fromDate, toDate);

      for (const point of points) {
        const date = civilDateToString(point.civilStartTime);

        if (!date) {
          continue;
        }

        const mapped: Partial<GoogleHealthMetric> = {};

        if (dataType === "steps" && point.steps?.countSum != null) {
          mapped.steps = Number(point.steps.countSum);
        }

        if (dataType === "total-calories" && point.totalCalories?.kcalSum != null) {
          mapped.caloriesBurned = Math.round(point.totalCalories.kcalSum);
        }

        if (dataType === "weight" && point.weight?.weightGramsAvg != null) {
          mapped.weightKg = point.weight.weightGramsAvg / 1000;
        }

        if (Object.keys(mapped).length > 0) {
          mergeMetric(metrics, date, mapped);
        }

        debugSync({
          dataType,
          fromDate,
          toDate,
          date,
          rawFields: rollupPointRawFields(point),
          rawValues: {
            countSum: point.steps?.countSum,
            kcalSum: point.totalCalories?.kcalSum,
            weightGramsAvg: point.weight?.weightGramsAvg,
          },
          mapped,
        });
      }
    } catch (error) {
      summary.errorCount += 1;
      summary.errors.push(`${dataType}: ${errorMessage(error)}`);
    }
  }

  return metrics;
}

async function upsertGoogleHealthMetric(metric: GoogleHealthMetric) {
  const existing = await prisma.dailyHealthEntry.findUnique({
    where: { date: parseDateInput(metric.date) },
  });
  const updateData = {
    ...(metric.weightKg != null ? { weightKg: metric.weightKg } : {}),
    ...(metric.steps != null ? { steps: metric.steps } : {}),
    ...(metric.caloriesBurned != null ? { caloriesBurned: metric.caloriesBurned } : {}),
    source: existing && existing.source !== GOOGLE_HEALTH_PROVIDER ? "mixed" : GOOGLE_HEALTH_PROVIDER,
    sourceUpdatedAt: new Date(),
    syncedAt: new Date(),
  };
  const realFieldCount = ["weightKg", "steps", "caloriesBurned"].filter(
    (field) => metric[field as keyof GoogleHealthMetric] != null,
  ).length;

  if (!existing) {
    await prisma.dailyHealthEntry.create({
      data: {
        date: parseDateInput(metric.date),
        notes: "",
        ...updateData,
      },
    });

    return { created: true, updated: false, skippedFields: 3 - realFieldCount };
  }

  await prisma.dailyHealthEntry.update({
    where: { id: existing.id },
    data: updateData,
  });

  return { created: false, updated: true, skippedFields: 3 - realFieldCount };
}

function mergeMetric(
  metrics: Map<string, GoogleHealthMetric>,
  date: string,
  patch: Partial<GoogleHealthMetric>,
) {
  metrics.set(date, {
    date,
    ...(metrics.get(date) ?? {}),
    ...patch,
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown Google Health API error.";
}
