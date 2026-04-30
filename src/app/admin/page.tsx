import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AdminSystemStatus } from "@/components/admin-system-status";
import { DataCoverage } from "@/components/data-coverage";
import { EntryForm } from "@/components/entry-form";
import { ImportExport } from "@/components/import-export";
import { IntegrationsPanel } from "@/components/integrations-panel";
import { RecentEntries } from "@/components/recent-entries";
import { hasAdminSession } from "@/lib/admin-auth";
import { backupsDirectoryExists } from "@/lib/database-backup";
import { getAdminAuthConfigStatus } from "@/lib/env";
import { getEntries } from "@/lib/entries";
import { getFastingEntries } from "@/lib/fasting";
import { googleHealthProvider } from "@/lib/integrations/google-health/provider";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  if (!(await hasAdminSession())) {
    redirect("/login?next=/admin");
  }

  const params = await searchParams;
  const integrationMessage = firstParam(params?.message) ?? null;
  const [entries, fastingEntries, googleHealthStatus] = await Promise.all([
    getEntries(),
    getFastingEntries(),
    googleHealthProvider.getStatus(),
  ]);
  const activeFastExists = fastingEntries.some((entry) => entry.active);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <AppHeader active="admin" />
        <form action="/api/admin/logout" method="post" className="flex justify-end">
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Logout
          </button>
        </form>
        <IntegrationsPanel
          googleHealthStatus={googleHealthStatus}
          initialMessage={integrationMessage}
        />
        <AdminSystemStatus
          googleHealthConnected={googleHealthStatus.connected}
          lastSyncAt={formatDateTime(googleHealthStatus.lastSyncAt)}
          lastSyncStatus={googleHealthStatus.lastSyncStatus ?? "-"}
          lastSyncMessage={googleHealthStatus.lastSyncMessage ?? "-"}
          healthEntryCount={entries.length}
          fastingEntryCount={fastingEntries.length}
          activeFastExists={activeFastExists}
          adminAuthConfigured={getAdminAuthConfigStatus().configured}
          backupsFolderExists={backupsDirectoryExists()}
        />
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Fasting tools
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Add, edit, or delete completed intermittent fasting entries.
              </p>
            </div>
            <Link
              href="/admin/fasting"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Manage fasting entries
            </Link>
          </div>
        </section>
        <DataCoverage entries={entries} />
        <EntryForm />
        <ImportExport />
        <RecentEntries entries={entries} />
      </div>
      <AppFooter />
    </main>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null) {
  return value ? value.slice(0, 16).replace("T", " ") : "-";
}
