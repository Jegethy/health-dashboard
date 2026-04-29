import { EntryForm } from "@/components/entry-form";
import { HealthCharts } from "@/components/health-charts";
import { ImportExport } from "@/components/import-export";
import { IntegrationsPanel } from "@/components/integrations-panel";
import { RecentEntries } from "@/components/recent-entries";
import { SummaryCards } from "@/components/summary-cards";
import { fitbitProvider } from "@/lib/integrations/fitbit/provider";
import { getEntries } from "@/lib/entries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [entries, fitbitStatus] = await Promise.all([
    getEntries(),
    fitbitProvider.getStatus(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-2 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
            Personal health tracking
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Health Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                Manual daily tracking for weight, movement, calories, and notes.
              </p>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {entries.length} total entries
            </p>
          </div>
        </header>

        <SummaryCards entries={entries} />
        <HealthCharts entries={entries} />
        <IntegrationsPanel fitbitStatus={fitbitStatus} />
        <EntryForm />
        <ImportExport />
        <RecentEntries entries={entries} />
      </div>
    </main>
  );
}
