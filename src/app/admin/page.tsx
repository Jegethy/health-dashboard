import { AppHeader } from "@/components/app-header";
import { DataCoverage } from "@/components/data-coverage";
import { IntegrationsPanel } from "@/components/integrations-panel";
import { getEntries } from "@/lib/entries";
import { googleHealthProvider } from "@/lib/integrations/google-health/provider";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const integrationMessage = firstParam(params?.message) ?? null;
  const [entries, googleHealthStatus] = await Promise.all([
    getEntries(),
    googleHealthProvider.getStatus(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <AppHeader active="admin" entryCount={entries.length} />
        <IntegrationsPanel
          googleHealthStatus={googleHealthStatus}
          initialMessage={integrationMessage}
        />
        <DataCoverage entries={entries} />
      </div>
    </main>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
