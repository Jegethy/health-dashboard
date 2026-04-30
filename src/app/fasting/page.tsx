import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { ActiveFastStatus } from "@/components/active-fast-status";
import { FastingCharts } from "@/components/fasting-charts";
import { FastingSummaryCards } from "@/components/fasting-summary-cards";
import { getActiveFast, getFastingEntries } from "@/lib/fasting";

export const dynamic = "force-dynamic";

export default async function FastingPage() {
  const [entries, activeFast] = await Promise.all([getFastingEntries(), getActiveFast()]);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <AppHeader active="fasting" />
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Intermittent Fasting
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Fasting duration trends and consistency.
          </p>
        </section>
        <ActiveFastStatus activeFast={activeFast} />
        <FastingSummaryCards entries={entries} />
        <FastingCharts entries={entries} />
      </div>
      <AppFooter />
    </main>
  );
}
