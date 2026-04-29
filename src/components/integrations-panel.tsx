"use client";

import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { ProviderStatus, SyncSummary } from "@/lib/integrations/types";

type IntegrationsPanelProps = {
  fitbitStatus: ProviderStatus;
};

export function IntegrationsPanel({ fitbitStatus }: IntegrationsPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return fitbitStatus.configError;
    }

    return new URLSearchParams(window.location.search).get("message") ?? fitbitStatus.configError;
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fitbit = params.get("fitbit");
    const oauthMessage = params.get("message");

    if (fitbit && oauthMessage) {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
  }, []);

  async function syncDays(days: number) {
    setIsSyncing(true);
    setMessage(null);

    const toDate = format(new Date(), "yyyy-MM-dd");
    const fromDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
    const response = await fetch("/api/integrations/fitbit/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromDate, toDate }),
    });
    const result = await response.json();

    setIsSyncing(false);

    if (!response.ok) {
      setMessage(result.error ?? "Fitbit sync failed.");
      return;
    }

    const summary = result as SyncSummary;
    setMessage(
      `Fitbit sync complete: ${summary.createdCount} created, ${summary.updatedCount} updated, ${summary.errorCount} error(s).`,
    );
    router.refresh();
  }

  async function disconnect() {
    setMessage(null);
    const response = await fetch("/api/integrations/fitbit/disconnect", {
      method: "POST",
    });

    if (!response.ok) {
      setMessage("Could not disconnect Fitbit.");
      return;
    }

    setMessage("Fitbit disconnected. Existing health entries were kept.");
    router.refresh();
  }

  return (
    <section
      id="integrations"
      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-400">Integrations</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Fitbit</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <StatusItem label="Status" value={fitbitStatus.connected ? "Connected" : "Not connected"} />
            <StatusItem label="Account" value={fitbitStatus.displayName ?? fitbitStatus.providerUserId ?? "-"} />
            <StatusItem label="Scopes" value={fitbitStatus.scopes.join(", ") || "-"} />
            <StatusItem label="Last sync" value={formatDateTime(fitbitStatus.lastSyncAt)} />
            <StatusItem label="Last status" value={fitbitStatus.lastSyncStatus ?? "-"} />
            <StatusItem label="Message" value={fitbitStatus.lastSyncMessage ?? "-"} />
          </dl>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <a
            href="/api/integrations/fitbit/connect"
            aria-disabled={!fitbitStatus.configured}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            Connect Fitbit
          </a>
          <button
            type="button"
            disabled={!fitbitStatus.connected || isSyncing}
            onClick={() => syncDays(7)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Sync last 7 days
          </button>
          <button
            type="button"
            disabled={!fitbitStatus.connected || isSyncing}
            onClick={() => syncDays(30)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            {isSyncing ? "Syncing..." : "Sync last 30 days"}
          </button>
          <button
            type="button"
            disabled={!fitbitStatus.connected}
            onClick={disconnect}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            Disconnect
          </button>
        </div>
      </div>
      {message ? <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{message}</p> : null}
      {!fitbitStatus.configured ? (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          Add the Fitbit values from .env.example to .env.local, then restart the dev server.
        </p>
      ) : null}
    </section>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
