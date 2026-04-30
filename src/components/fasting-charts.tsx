"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateTargetDifference,
  DEFAULT_FASTING_TARGET_MINUTES,
  FastingEntryView,
  formatDuration,
  formatHours,
  formatTickDate,
  getCompletedFasts,
} from "@/lib/fasting";

type FastingChartsProps = {
  entries: FastingEntryView[];
};

type FastingDatum = {
  id: number;
  endDate: string;
  tickDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  durationMinutes: number;
  targetHours: number;
  targetMinutes: number;
  targetDifferenceMinutes: number;
};

type TooltipPayload = {
  payload?: FastingDatum;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
};

export function FastingCharts({ entries }: FastingChartsProps) {
  const completedEntries = getCompletedFasts(entries);
  const chartData = completedEntries.map((entry) => ({
    id: entry.id,
    endDate: entry.endDate,
    tickDate: formatTickDate(entry.endAt),
    startTime: `${entry.startDate} ${entry.startTime}`,
    endTime: `${entry.endDate} ${entry.endTime}`,
    durationHours: Number(formatHours(entry.durationMinutes)),
    durationMinutes: entry.durationMinutes,
    targetHours: Number(formatHours(entry.targetMinutes)),
    targetMinutes: entry.targetMinutes,
    targetDifferenceMinutes: calculateTargetDifference(entry) ?? 0,
  }));
  const targetHours = Number(formatHours(DEFAULT_FASTING_TARGET_MINUTES));

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Fasting duration over time
      </h2>
      <div className="mt-4 h-[320px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 8, right: 20, bottom: 6, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.25} />
              <XAxis
                dataKey="tickDate"
                tickLine={false}
                axisLine={false}
                interval={getTickInterval(chartData.length)}
                tick={{ fill: "#71717a", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickFormatter={(value) => `${Number(value).toFixed(0)}h`}
                width={44}
              />
              <Tooltip content={<FastingTooltip />} cursor={{ stroke: "#a1a1aa", strokeDasharray: "3 3" }} />
              <ReferenceLine
                y={targetHours}
                stroke="#14b8a6"
                strokeDasharray="4 4"
                strokeOpacity={0.85}
              />
              <Line
                type="monotone"
                dataKey="durationHours"
                name="Fast duration"
                stroke="#0f766e"
                strokeWidth={3}
                dot={{ r: 3, fill: "#0f766e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 px-6 text-center dark:border-zinc-700">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">No fasting entries yet</p>
            <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Add completed fasts in Admin / Data tools.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function FastingTooltip({ active, payload }: CustomTooltipProps) {
  const datum = active ? payload?.[0]?.payload : null;

  if (!datum) {
    return null;
  }

  return (
    <div className="min-w-64 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 text-sm shadow-lg">
      <p className="font-semibold text-zinc-50">{datum.endDate}</p>
      <div className="mt-2 flex flex-col gap-1">
        <TooltipRow label="Start" value={datum.startTime} />
        <TooltipRow label="End" value={datum.endTime} />
        <TooltipRow label="Duration" value={formatDuration(datum.durationMinutes)} />
        <TooltipRow label="Target" value={formatDuration(datum.targetMinutes)} />
        <TooltipRow label="Target met" value={datum.targetDifferenceMinutes >= 0 ? "Yes" : "No"} />
        <TooltipRow
          label="Difference"
          value={formatSignedDuration(datum.targetDifferenceMinutes)}
        />
      </div>
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

function formatSignedDuration(minutes: number) {
  if (minutes === 0) {
    return "On target";
  }

  return `${minutes > 0 ? "+" : "-"}${formatDuration(Math.abs(minutes))}`;
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
