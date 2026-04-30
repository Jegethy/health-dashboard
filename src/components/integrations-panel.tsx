"use client";

import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { ProviderStatus, SyncSummary } from "@/lib/integrations/types";

type IntegrationsPanelProps = {
  googleHealthStatus: ProviderStatus;
  initialMessage: string | null;
};

export function IntegrationsPanel({ googleHealthStatus, initialMessage }: IntegrationsPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(
    initialMessage ?? googleHealthStatus.configError,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
  }, []);

  async function syncDays(days: number) {
    setIsSyncing(true);
    setMessage(null);

    const toDate = format(new Date(), "yyyy-MM-dd");
    const fromDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
    const response = await fetch("/api/integrations/google-health/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromDate, toDate }),
    });
    const result = await response.json();

    setIsSyncing(false);

    if (!response.ok) {
      setMessage(result.error ?? "Google Health sync failed.");
      return;
    }

    const summary = result as SyncSummary;
    const warning = summary.errors.length > 0 ? ` Warnings: ${summary.errors.slice(0, 2).join(" | ")}` : "";
    setMessage(
      `Google Health sync complete: ${summary.createdCount} created, ${summary.updatedCount} updated, ${summary.errorCount} warning/error(s).${warning}`,
    );
    router.refresh();
  }

  async function disconnect() {
    setMessage(null);
    const response = await fetch("/api/integrations/google-health/disconnect", {
      method: "POST",
    });

    if (!response.ok) {
      setMessage("Could not disconnect Google Health.");
      return;
    }

    setMessage("Google Health disconnected. Existing health entries were kept.");
    router.refresh();
  }

  async function clearEntries() {
    setIsResetting(true);
    setMessage(null);

    const response = await fetch("/api/admin/clear-health-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: resetConfirmation }),
    });
    const result = await response.json();

    setIsResetting(false);

    if (!response.ok) {
      setMessage(result.error ?? "Could not clear local health entries.");
      return;
    }

    setMessage(`Deleted ${result.deletedCount} local health entries. Google Health remains connected.`);
    setResetConfirmation("");
    router.refresh();
  }

  async function clearAndSync() {
    setIsResetting(true);
    setMessage(null);

    const response = await fetch("/api/admin/clear-and-sync-google-health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: resetConfirmation }),
    });
    const result = await response.json();

    setIsResetting(false);

    if (!response.ok) {
      setMessage(result.error ?? "Could not clear and sync Google Health.");
      return;
    }

    setMessage(
      `Deleted ${result.deletedCount} local entries. Google Health sync: ${result.createdCount} created, ${result.updatedCount} updated, ${result.skippedFields} skipped field(s), ${result.errorCount} error(s).`,
    );
    setResetConfirmation("");
    router.refresh();
  }

  function exportRollup(days: number) {
    const toDate = format(new Date(), "yyyy-MM-dd");
    const fromDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
    window.location.href = `/api/integrations/google-health/export-rollup?fromDate=${fromDate}&toDate=${toDate}`;
  }

  return (
    <section
      id="integrations"
      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-400">Integrations</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Google Health
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <StatusItem label="Status" value={googleHealthStatus.connected ? "Connected" : "Not connected"} />
            <StatusItem label="Google Health ID" value={googleHealthStatus.googleHealthUserId ?? googleHealthStatus.providerUserId ?? "-"} />
            <StatusItem label="Legacy Fitbit ID" value={googleHealthStatus.legacyFitbitUserId ?? "-"} />
            <StatusItem label="Configured scopes" value={googleHealthStatus.configuredScopes.join(", ") || "-"} />
            <StatusItem label="Granted scopes" value={googleHealthStatus.scopes.join(", ") || "-"} />
            <StatusItem label="Missing required scopes" value={googleHealthStatus.missingRequiredScopes.join(", ") || "-"} />
            <StatusItem label="Last sync" value={formatDateTime(googleHealthStatus.lastSyncAt)} />
            <StatusItem label="Last status" value={googleHealthStatus.lastSyncStatus ?? "-"} />
            <StatusItem label="Message" value={googleHealthStatus.lastSyncMessage ?? "-"} />
          </dl>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <a
            href="/api/integrations/google-health/connect"
            aria-disabled={!googleHealthStatus.configured}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            Connect Google Health
          </a>
          <button
            type="button"
            disabled={!googleHealthStatus.connected || isSyncing}
            onClick={() => syncDays(7)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Sync last 7 days
          </button>
          <button
            type="button"
            disabled={!googleHealthStatus.connected || isSyncing}
            onClick={() => syncDays(30)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            {isSyncing ? "Syncing..." : "Sync last 30 days"}
          </button>
          <button
            type="button"
            disabled={!googleHealthStatus.connected || isSyncing}
            onClick={() => syncDays(90)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Sync last 90 days
          </button>
          <button
            type="button"
            disabled={!googleHealthStatus.connected}
            onClick={disconnect}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            Disconnect
          </button>
          <button
            type="button"
            disabled={!googleHealthStatus.connected}
            onClick={() => exportRollup(7)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Export rollup CSV: 7 days
          </button>
          <button
            type="button"
            disabled={!googleHealthStatus.connected}
            onClick={() => exportRollup(30)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Export rollup CSV: 30 days
          </button>
          <button
            type="button"
            disabled={!googleHealthStatus.connected}
            onClick={() => exportRollup(90)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Export rollup CSV: 90 days
          </button>
        </div>
      </div>
      {message ? <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{message}</p> : null}
      {googleHealthStatus.connected && googleHealthStatus.missingRequiredScopes.length > 0 ? (
        <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Google Health is connected, but required scopes are missing. Disconnect and reconnect
          Google Health after updating .env.local and Google Cloud OAuth scopes.
        </p>
      ) : null}
      {!googleHealthStatus.configured ? (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          Add the Google Health values from .env.example to .env.local, then restart the dev server.
        </p>
      ) : null}
      <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Data reset</h3>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
          These actions delete local dashboard health entries only. Google Health connection,
          OAuth tokens, sync logs, and Google Health/Fitbit source data are kept. Type DELETE to enable.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={resetConfirmation}
            onChange={(event) => setResetConfirmation(event.target.value)}
            placeholder="Type DELETE"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 sm:max-w-xs"
          />
          <button
            type="button"
            disabled={resetConfirmation !== "DELETE" || isResetting}
            onClick={clearEntries}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            Clear local health entries
          </button>
          <button
            type="button"
            disabled={resetConfirmation !== "DELETE" || isResetting || !googleHealthStatus.connected}
            onClick={clearAndSync}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear and sync last 30 days
          </button>
        </div>
        <p className="mt-3 max-w-3xl text-xs text-zinc-500 dark:text-zinc-500">
          Dashboard CSV export downloads local stored data. Google Health rollup CSV export asks
          Google Health directly; use it to compare API values with the phone app. If those values
          differ, the discrepancy is upstream/API availability rather than the local dashboard table.
          This app intentionally does not track diet data.
        </p>
      </div>
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

  return value.slice(0, 16).replace("T", " ");
}
