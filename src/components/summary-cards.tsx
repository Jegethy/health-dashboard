import {
  averageCaloriesBurnedLast7Days,
  averageStepsLast7Days,
  dataCoverage,
  latestWeight,
  weightChange,
} from "@/lib/calculations";
import { EntryView } from "@/lib/entries";

type SummaryCardsProps = {
  entries: EntryView[];
};

export function SummaryCards({ entries }: SummaryCardsProps) {
  const coverage = dataCoverage(entries);
  const currentWeight = latestWeight(entries);
  const stats = [
    {
      label: "Latest weight",
      value: currentWeight == null ? "No recent weigh-ins" : formatKg(currentWeight),
      detail:
        currentWeight == null
          ? "Sync a wider date range or add a manual weigh-in."
          : "Most recent recorded weigh-in",
    },
    {
      label: "Weight change",
      value: formatSignedKg(weightChange(entries)),
      detail: "First to latest recorded weight",
    },
    {
      label: "Avg steps",
      value: formatNumber(averageStepsLast7Days(entries)),
      detail: "Last 7 tracked days",
    },
    {
      label: "Avg calories burned",
      value: formatKcal(averageCaloriesBurnedLast7Days(entries)),
      detail: "Total calories burned, last 7 tracked days",
    },
    {
      label: "Data coverage",
      value: `${coverage.totalDays} days`,
      detail: `${coverage.totalDays} days with API or local data`,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {stat.value}
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">{stat.detail}</p>
        </article>
      ))}
    </section>
  );
}

function formatKg(value: number | null) {
  return value == null ? "No data" : `${value.toFixed(1)} kg`;
}

function formatSignedKg(value: number | null) {
  if (value == null) {
    return "No data";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)} kg`;
}

function formatNumber(value: number | null) {
  return value == null ? "No data" : Math.round(value).toLocaleString();
}

function formatKcal(value: number | null) {
  return value == null ? "No data" : `${Math.round(value).toLocaleString()} kcal`;
}
