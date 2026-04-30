import {
  calculateAverageFast,
  calculateTargetHitRate,
  FastingEntryView,
  formatDuration,
  getCompletedFasts,
  getLongestFast,
} from "@/lib/fasting";

type FastingSummaryCardsProps = {
  entries: FastingEntryView[];
};

export function FastingSummaryCards({ entries }: FastingSummaryCardsProps) {
  const completedEntries = getCompletedFasts(entries);
  const latest = completedEntries.at(-1) ?? null;
  const average = calculateAverageFast(entries);
  const longest = getLongestFast(entries);
  const hitRate = calculateTargetHitRate(entries);
  const stats = [
    {
      label: "Latest fast",
      value: latest ? formatDuration(latest.durationMinutes) : "No fasts yet",
      detail: latest ? `Ended ${latest.endDate}` : "Add completed fasts in Admin / Data tools",
    },
    {
      label: "Average fast",
      value: average == null ? "No data" : formatDuration(average),
      detail: "All completed fasts",
    },
    {
      label: "Longest fast",
      value: longest?.durationMinutes == null ? "No data" : formatDuration(longest.durationMinutes),
      detail: longest?.endDate ? `Ended ${longest.endDate}` : "No completed fasts",
    },
    {
      label: "Target hit rate",
      value: hitRate == null ? "No data" : `${hitRate}%`,
      detail: "Fasts meeting their target",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
