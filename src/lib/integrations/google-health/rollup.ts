import { addDays, differenceInCalendarDays } from "date-fns";
import { parseDateInput } from "@/lib/dates";
import { googleHealthFetch } from "@/lib/integrations/google-health/client";

export type GoogleHealthDataType = "steps" | "total-calories" | "weight";

export type GoogleHealthRollupRow = {
  date: string;
  googleHealthSteps: number | null;
  googleHealthTotalCaloriesBurned: number | null;
  googleHealthWeightKg: number | null;
  stepsRawFields: string;
  caloriesRawFields: string;
  weightRawFields: string;
  warnings: string[];
};

type CivilDateTime = {
  date?: { year?: number; month?: number; day?: number };
};

type DailyRollupDataPoint = {
  civilStartTime?: CivilDateTime;
  civilEndTime?: CivilDateTime;
  steps?: { countSum?: string };
  totalCalories?: { kcalSum?: number };
  weight?: { weightGramsAvg?: number };
};

type DailyRollupResponse = {
  rollupDataPoints?: DailyRollupDataPoint[];
};

export async function fetchGoogleHealthRollupRows(fromDate: string, toDate: string) {
  const rows = createEmptyRows(fromDate, toDate);
  const warnings: string[] = [];

  await mergeDataType(rows, "steps", fromDate, toDate, warnings);
  await mergeDataType(rows, "total-calories", fromDate, toDate, warnings);
  await mergeDataType(rows, "weight", fromDate, toDate, warnings);

  return {
    rows: [...rows.values()].sort((a, b) => a.date.localeCompare(b.date)),
    warnings,
  };
}

export async function fetchGoogleHealthDailyRollup(
  dataType: GoogleHealthDataType,
  fromDate: string,
  toDate: string,
) {
  const responses: DailyRollupDataPoint[] = [];

  for (const chunk of chunkDateRange(fromDate, toDate, dataType === "total-calories" ? 14 : 90)) {
    debugSync({
      dataType,
      fromDate: chunk.fromDate,
      toDate: chunk.toDate,
      requestRange: {
        startInclusive: chunk.fromDate,
        endInclusive: chunk.toDate,
      },
    });

    const response = await dailyRollup(dataType, chunk.fromDate, chunk.toDate);
    debugSync({
      dataType,
      fromDate: chunk.fromDate,
      toDate: chunk.toDate,
      rollupPointCount: response.rollupDataPoints?.length ?? 0,
    });

    responses.push(...(response.rollupDataPoints ?? []));
  }

  return responses;
}

export function civilDateToString(civilDateTime?: CivilDateTime) {
  const date = civilDateTime?.date;

  if (!date?.year || !date.month || !date.day) {
    return null;
  }

  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

export function rollupPointRawFields(point: DailyRollupDataPoint) {
  return Object.keys(point).filter((key) => key !== "civilStartTime" && key !== "civilEndTime");
}

export function debugSync(payload: Record<string, unknown>) {
  if (process.env.GOOGLE_HEALTH_DEBUG_SYNC !== "true") {
    return;
  }

  console.log("[google-health-sync]", JSON.stringify(payload));
}

async function mergeDataType(
  rows: Map<string, GoogleHealthRollupRow>,
  dataType: GoogleHealthDataType,
  fromDate: string,
  toDate: string,
  warnings: string[],
) {
  try {
    const points = await fetchGoogleHealthDailyRollup(dataType, fromDate, toDate);

    for (const point of points) {
      const date = civilDateToString(point.civilStartTime);

      if (!date) {
        warnings.push(`${dataType}: rollup point did not include civilStartTime.date.`);
        continue;
      }

      const row = rows.get(date) ?? createEmptyRow(date);
      const rawFields = rollupPointRawFields(point);

      if (dataType === "steps") {
        row.googleHealthSteps = point.steps?.countSum == null ? null : Number(point.steps.countSum);
        row.stepsRawFields = compactJson({
          fields: rawFields,
          countSum: point.steps?.countSum,
        });
      }

      if (dataType === "total-calories") {
        row.googleHealthTotalCaloriesBurned =
          point.totalCalories?.kcalSum == null ? null : Math.round(point.totalCalories.kcalSum);
        row.caloriesRawFields = compactJson({
          fields: rawFields,
          kcalSum: point.totalCalories?.kcalSum,
        });
      }

      if (dataType === "weight") {
        row.googleHealthWeightKg =
          point.weight?.weightGramsAvg == null ? null : point.weight.weightGramsAvg / 1000;
        row.weightRawFields = compactJson({
          fields: rawFields,
          weightGramsAvg: point.weight?.weightGramsAvg,
        });
      }

      rows.set(date, row);
    }
  } catch (error) {
    const warning = `${dataType}: ${error instanceof Error ? error.message : "Google Health rollup failed."}`;
    warnings.push(warning);
    const firstRow = rows.get(fromDate) ?? createEmptyRow(fromDate);
    firstRow.warnings.push(warning);
    rows.set(fromDate, firstRow);
  }
}

async function dailyRollup(
  dataType: GoogleHealthDataType,
  fromDate: string,
  toDate: string,
) {
  const exclusiveEnd = addDays(parseDateInput(toDate), 1).toISOString().slice(0, 10);

  return googleHealthFetch<DailyRollupResponse>(
    `/v4/users/me/dataTypes/${dataType}/dataPoints:dailyRollUp`,
    {
      method: "POST",
      body: JSON.stringify({
        range: {
          start: { date: dateToGoogleDate(fromDate) },
          end: { date: dateToGoogleDate(exclusiveEnd) },
        },
        windowSizeDays: 1,
        pageSize: 100,
      }),
    },
  );
}

function createEmptyRows(fromDate: string, toDate: string) {
  const rows = new Map<string, GoogleHealthRollupRow>();
  const days = differenceInCalendarDays(parseDateInput(toDate), parseDateInput(fromDate));

  for (let index = 0; index <= days; index += 1) {
    const date = addDays(parseDateInput(fromDate), index).toISOString().slice(0, 10);
    rows.set(date, createEmptyRow(date));
  }

  return rows;
}

function createEmptyRow(date: string): GoogleHealthRollupRow {
  return {
    date,
    googleHealthSteps: null,
    googleHealthTotalCaloriesBurned: null,
    googleHealthWeightKg: null,
    stepsRawFields: "",
    caloriesRawFields: "",
    weightRawFields: "",
    warnings: [],
  };
}

function chunkDateRange(fromDate: string, toDate: string, maxDays: number) {
  const chunks: Array<{ fromDate: string; toDate: string }> = [];
  let cursor = parseDateInput(fromDate);
  const end = parseDateInput(toDate);

  while (differenceInCalendarDays(end, cursor) >= 0) {
    const chunkEnd = addDays(cursor, maxDays - 1);
    const safeChunkEnd = chunkEnd > end ? end : chunkEnd;
    chunks.push({
      fromDate: cursor.toISOString().slice(0, 10),
      toDate: safeChunkEnd.toISOString().slice(0, 10),
    });
    cursor = addDays(safeChunkEnd, 1);
  }

  return chunks;
}

function dateToGoogleDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function compactJson(value: unknown) {
  return JSON.stringify(value);
}
