import { dataCoverage } from "@/lib/calculations";
import { EntryView } from "@/lib/entries";

type DataCoverageProps = {
  entries: EntryView[];
};

export function DataCoverage({ entries }: DataCoverageProps) {
  const coverage = dataCoverage(entries);
  const items = [
    ["Steps", coverage.stepsDays],
    ["Calories burned", coverage.caloriesBurnedDays],
    ["Weight", coverage.weightDays],
  ] as const;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Data coverage</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Counts across the current local rows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map(([label, value]) => (
            <span
              key={label}
              className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {label}: {value}/{coverage.totalDays} days
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
