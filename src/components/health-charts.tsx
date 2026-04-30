"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EntryView } from "@/lib/entries";

type HealthChartsProps = {
  entries: EntryView[];
};

export function HealthCharts({ entries }: HealthChartsProps) {
  const hasWeight = entries.some((entry) => entry.weightKg != null);
  const chartData = entries.map((entry) => ({
    date: entry.date.slice(5),
    weightKg: entry.weightKg,
    steps: entry.steps,
    caloriesBurned: entry.caloriesBurned,
  }));

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartFrame title="Weight over time">
        {hasWeight ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.25} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip />
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

      <ChartFrame title="Daily steps">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.25} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="steps" name="Steps" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame title="Calories burned over time">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.25} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
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
        <ChartNote>
          Total calories burned as returned by Google Health/Fitbit.
        </ChartNote>
      </ChartFrame>
    </section>
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

function ChartNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{children}</p>;
}
