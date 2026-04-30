import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { DataCoverage } from "@/components/data-coverage";
import { EntryForm } from "@/components/entry-form";
import { ImportExport } from "@/components/import-export";
import { IntegrationsPanel } from "@/components/integrations-panel";
import { RecentEntries } from "@/components/recent-entries";
import { hasAdminSession } from "@/lib/admin-auth";
import { getEntries } from "@/lib/entries";
import { googleHealthProvider } from "@/lib/integrations/google-health/provider";
import { redirect } from "next/navigation";

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
  const [entries, googleHealthStatus] = await Promise.all([
    getEntries(),
    googleHealthProvider.getStatus(),
  ]);

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
