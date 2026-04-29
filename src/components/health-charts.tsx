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
import { calorieBalance } from "@/lib/calculations";
import { EntryView } from "@/lib/entries";

type HealthChartsProps = {
  entries: EntryView[];
};

export function HealthCharts({ entries }: HealthChartsProps) {
  const chartData = entries.map((entry) => ({
    date: entry.date.slice(5),
    weightKg: entry.weightKg,
    steps: entry.steps,
    caloriesEaten: entry.caloriesEaten,
    caloriesBurned: entry.caloriesBurned,
    balance: calorieBalance(entry),
  }));

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartFrame title="Weight over time">
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

      <ChartFrame title="Calories eaten vs burned">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.25} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="caloriesEaten"
              name="Calories eaten"
              stroke="#b45309"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="caloriesBurned"
              name="Calories burned"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame title="Calorie deficit/surplus">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.25} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="balance" name="Balance" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
