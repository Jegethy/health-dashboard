import { EntryView } from "@/lib/entries";

type RecentEntriesProps = {
  entries: EntryView[];
};

export function RecentEntries({ entries }: RecentEntriesProps) {
  const recentEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  return (
    <details className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <summary className="cursor-pointer list-none p-5 text-lg font-semibold text-zinc-950 marker:hidden dark:text-zinc-50">
        Recent entries
        <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
          {recentEntries.length} rows
        </span>
      </summary>
      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <Th>Date</Th>
                <Th>Weight</Th>
                <Th>Steps</Th>
                <Th>Calories burned</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {recentEntries.map((entry) => (
                <tr key={entry.id} className="align-top">
                  <Td>{entry.date}</Td>
                  <Td>{entry.weightKg == null ? "-" : `${entry.weightKg.toFixed(1)} kg`}</Td>
                  <Td>{entry.steps?.toLocaleString() ?? "-"}</Td>
                  <Td>{entry.caloriesBurned?.toLocaleString() ?? "-"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{children}</td>;
}
