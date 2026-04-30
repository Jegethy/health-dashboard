"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EntryView } from "@/lib/entries";

type HealthChartsProps = {
  entries: EntryView[];
};

type ChartDatum = {
  date: string;
  tickDate: string;
  tooltipDate: string;
  weightKg: number | null;
  weightChangeFromFirst: number | null;
  weightChangeFromPrevious: number | null;
  steps: number | null;
  stepsDiffFromAverage: number | null;
  stepsPercentOfAverage: number | null;
  caloriesBurned: number | null;
  caloriesDiffFromAverage: number | null;
  caloriesPercentOfAverage: number | null;
};

type TooltipPayload = {
  payload?: ChartDatum;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
};

export function HealthCharts({ entries }: HealthChartsProps) {
  const hasWeight = entries.some((entry) => entry.weightKg != null);
  const stepsAverage = average(entries.map((entry) => entry.steps));
  const caloriesAverage = average(entries.map((entry) => entry.caloriesBurned));
  const chartData = buildChartData(entries, stepsAverage, caloriesAverage);
  const xTickInterval = getTickInterval(chartData.length);

  return (
    <section className="flex flex-col gap-4">
      <ChartFrame title="Weight over time">
        {hasWeight ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 20, bottom: 6, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.25} />
              <XAxis
                dataKey="tickDate"
                tickLine={false}
                axisLine={false}
                interval={xTickInterval}
                tick={{ fill: "#71717a", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                domain={["dataMin - 1", "dataMax + 1"]}
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickFormatter={(value) => `${Number(value).toFixed(0)} kg`}
                width={54}
              />
              <Tooltip content={<WeightTooltip />} cursor={{ stroke: "#a1a1aa", strokeDasharray: "3 3" }} />
              <Line
                type="monotone"
                dataKey="weightKg"
                name="Weight kg"
                stroke="#0f766e"
                strokeWidth={3}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartMessage
            title="No recent weigh-ins"
            detail="Sync a wider date range or add a manual weigh-in."
          />
        )}
      </ChartFrame>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame title="Daily steps">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 6, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.25} />
              <XAxis
                dataKey="tickDate"
                tickLine={false}
                axisLine={false}
                interval={xTickInterval}
                tick={{ fill: "#71717a", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickFormatter={(value) => formatCompactNumber(Number(value))}
                width={56}
              />
              <Tooltip content={<StepsTooltip />} cursor={{ fill: "rgba(37, 99, 235, 0.08)" }} />
              {stepsAverage != null ? (
                <ReferenceLine
                  y={stepsAverage}
                  stroke="#60a5fa"
                  strokeDasharray="4 4"
                  strokeOpacity={0.8}
                />
              ) : null}
              <Bar dataKey="steps" name="Steps" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Calories burned over time">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 20, bottom: 6, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.25} />
              <XAxis
                dataKey="tickDate"
                tickLine={false}
                axisLine={false}
                interval={xTickInterval}
                tick={{ fill: "#71717a", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickFormatter={(value) => formatCompactNumber(Number(value))}
                width={56}
              />
              <Tooltip content={<CaloriesTooltip />} cursor={{ stroke: "#a1a1aa", strokeDasharray: "3 3" }} />
              {caloriesAverage != null ? (
                <ReferenceLine
                  y={caloriesAverage}
                  stroke="#4ade80"
                  strokeDasharray="4 4"
                  strokeOpacity={0.8}
                />
              ) : null}
              <Line
                type="monotone"
                dataKey="caloriesBurned"
                name="Total calories burned"
                stroke="#16a34a"
                strokeWidth={3}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
    </section>
  );
}

function buildChartData(
  entries: EntryView[],
  stepsAverage: number | null,
  caloriesAverage: number | null,
): ChartDatum[] {
  const weightEntries = entries.filter((entry) => entry.weightKg != null);
  const firstWeight = weightEntries[0]?.weightKg ?? null;
  let previousWeight: number | null = null;

  return entries.map((entry) => {
    const weightChangeFromFirst =
      entry.weightKg != null && firstWeight != null ? entry.weightKg - firstWeight : null;
    const weightChangeFromPrevious =
      entry.weightKg != null && previousWeight != null ? entry.weightKg - previousWeight : null;

    if (entry.weightKg != null) {
      previousWeight = entry.weightKg;
    }

    return {
      date: entry.date,
      tickDate: formatTickDate(entry.date),
      tooltipDate: formatTooltipDate(entry.date),
      weightKg: entry.weightKg,
      weightChangeFromFirst,
      weightChangeFromPrevious,
      steps: entry.steps,
      stepsDiffFromAverage:
        entry.steps != null && stepsAverage != null ? entry.steps - stepsAverage : null,
      stepsPercentOfAverage:
        entry.steps != null && stepsAverage != null && stepsAverage > 0
          ? (entry.steps / stepsAverage) * 100
          : null,
      caloriesBurned: entry.caloriesBurned,
      caloriesDiffFromAverage:
        entry.caloriesBurned != null && caloriesAverage != null
          ? entry.caloriesBurned - caloriesAverage
          : null,
      caloriesPercentOfAverage:
        entry.caloriesBurned != null && caloriesAverage != null && caloriesAverage > 0
          ? (entry.caloriesBurned / caloriesAverage) * 100
          : null,
    };
  });
}

function WeightTooltip({ active, payload }: CustomTooltipProps) {
  const datum = active ? payload?.[0]?.payload : null;

  if (!datum || datum.weightKg == null) {
    return null;
  }

  return (
    <TooltipFrame title={datum.tooltipDate}>
      <TooltipRow label="Weight" value={`${datum.weightKg.toFixed(1)} kg`} />
      <TooltipRow
        label="From first visible"
        value={formatSignedKg(datum.weightChangeFromFirst)}
      />
      <TooltipRow
        label="From previous weigh-in"
        value={formatSignedKg(datum.weightChangeFromPrevious)}
      />
    </TooltipFrame>
  );
}

function StepsTooltip({ active, payload }: CustomTooltipProps) {
  const datum = active ? payload?.[0]?.payload : null;

  if (!datum || datum.steps == null) {
    return null;
  }

  return (
    <TooltipFrame title={datum.tooltipDate}>
      <TooltipRow label="Steps" value={`${formatInteger(datum.steps)} steps`} />
      <TooltipRow
        label="Vs visible avg"
        value={`${formatSignedInteger(datum.stepsDiffFromAverage)} steps`}
      />
      <TooltipRow
        label="Percent of avg"
        value={formatPercent(datum.stepsPercentOfAverage)}
      />
    </TooltipFrame>
  );
}

function CaloriesTooltip({ active, payload }: CustomTooltipProps) {
  const datum = active ? payload?.[0]?.payload : null;

  if (!datum || datum.caloriesBurned == null) {
    return null;
  }

  return (
    <TooltipFrame title={datum.tooltipDate}>
      <TooltipRow label="Burned" value={`${formatInteger(datum.caloriesBurned)} kcal`} />
      <TooltipRow
        label="Vs visible avg"
        value={`${formatSignedInteger(datum.caloriesDiffFromAverage)} kcal`}
      />
      <TooltipRow
        label="Percent of avg"
        value={formatPercent(datum.caloriesPercentOfAverage)}
      />
    </TooltipFrame>
  );
}

function TooltipFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-56 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 text-sm shadow-lg">
      <p className="font-semibold text-zinc-50">{title}</p>
      <div className="mt-2 flex flex-col gap-1">{children}</div>
    </div>
  );
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-100">{value}</span>
    </div>
  );
}

function ChartFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
      <div className="mt-4 h-[280px]">{children}</div>
    </article>
  );
}

function EmptyChartMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 px-6 text-center dark:border-zinc-700">
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{detail}</p>
    </div>
  );
}

function average(values: Array<number | null>) {
  const present = values.filter((value): value is number => value != null);

  if (present.length === 0) {
    return null;
  }

  return present.reduce((total, value) => total + value, 0) / present.length;
}

function getTickInterval(length: number) {
  if (length > 75) {
    return 13;
  }

  if (length > 45) {
    return 6;
  }

  if (length > 21) {
    return 3;
  }

  if (length > 10) {
    return 1;
  }

  return 0;
}

function formatTickDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

function formatTooltipDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${monthNames[month - 1]} ${year}`;
}

function formatInteger(value: number) {
  return Math.round(value).toLocaleString("en-GB");
}

function formatCompactNumber(value: number) {
  return Math.round(value).toLocaleString("en-GB", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

function formatSignedInteger(value: number | null) {
  if (value == null) {
    return "No comparison";
  }

  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded.toLocaleString("en-GB")}`;
}

function formatSignedKg(value: number | null) {
  if (value == null) {
    return "No comparison";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)} kg`;
}

function formatPercent(value: number | null) {
  if (value == null) {
    return "No comparison";
  }

  return `${Math.round(value)}%`;
}
