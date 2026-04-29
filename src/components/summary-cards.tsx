import {
  averageDeficitLast7Days,
  averageStepsLast7Days,
  currentEntryStreak,
  latestWeight,
  weightChange,
} from "@/lib/calculations";
import { EntryView } from "@/lib/entries";

type SummaryCardsProps = {
  entries: EntryView[];
};

export function SummaryCards({ entries }: SummaryCardsProps) {
  const stats = [
    {
      label: "Latest weight",
      value: formatKg(latestWeight(entries)),
      detail: "Most recent recorded weigh-in",
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
      label: "Avg calorie balance",
      value: formatSignedNumber(averageDeficitLast7Days(entries)),
      detail: "Burned minus eaten, last 7 days",
    },
    {
      label: "Entry streak",
      value: `${currentEntryStreak(entries)} days`,
      detail: "Consecutive tracked days to latest entry",
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

function formatSignedNumber(value: number | null) {
  if (value == null) {
    return "No data";
  }

  return `${value > 0 ? "+" : ""}${Math.round(value).toLocaleString()} kcal`;
}
