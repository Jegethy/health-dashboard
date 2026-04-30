import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { HealthCharts } from "@/components/health-charts";
import { RecentEntries } from "@/components/recent-entries";
import { SummaryCards } from "@/components/summary-cards";
import { getEntries } from "@/lib/entries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await getEntries();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <AppHeader active="dashboard" />

        <SummaryCards entries={entries} />
        <HealthCharts entries={entries} />
        <RecentEntries entries={entries} />
      </div>
      <AppFooter />
    </main>
  );
}
