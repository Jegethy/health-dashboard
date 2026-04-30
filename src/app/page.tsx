import { AppHeader } from "@/components/app-header";
import { EntryForm } from "@/components/entry-form";
import { DataCoverage } from "@/components/data-coverage";
import { HealthCharts } from "@/components/health-charts";
import { ImportExport } from "@/components/import-export";
import { RecentEntries } from "@/components/recent-entries";
import { SummaryCards } from "@/components/summary-cards";
import { getEntries } from "@/lib/entries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await getEntries();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <AppHeader active="dashboard" entryCount={entries.length} />

        <SummaryCards entries={entries} />
        <DataCoverage entries={entries} />
        <HealthCharts entries={entries} />
        <EntryForm />
        <ImportExport />
        <RecentEntries entries={entries} />
      </div>
    </main>
  );
}
