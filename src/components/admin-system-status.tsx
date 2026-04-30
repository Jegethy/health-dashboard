"use client";

import { useState } from "react";

type AdminSystemStatusProps = {
  googleHealthConnected: boolean;
  lastSyncAt: string;
  lastSyncStatus: string;
  lastSyncMessage: string;
  healthEntryCount: number;
  fastingEntryCount: number;
  activeFastExists: boolean;
  adminAuthConfigured: boolean;
  backupsFolderExists: boolean;
};

export function AdminSystemStatus({
  googleHealthConnected,
  lastSyncAt,
  lastSyncStatus,
  lastSyncMessage,
  healthEntryCount,
  fastingEntryCount,
  activeFastExists,
  adminAuthConfigured,
  backupsFolderExists,
}: AdminSystemStatusProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  async function createBackup() {
    setIsCreatingBackup(true);
    setMessage(null);

    const response = await fetch("/api/admin/backup-database", { method: "POST" });
    const result = await response.json().catch(() => ({}));
    setIsCreatingBackup(false);

    if (!response.ok) {
      setMessage(result.error ?? "Database backup failed.");
      return;
    }

    setMessage(`Backup created: ${result.filename}`);
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">System status</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Local app health, sync status, and backup tools.
          </p>
        </div>
        <button
          type="button"
          disabled={isCreatingBackup}
          onClick={createBackup}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          {isCreatingBackup ? "Creating backup..." : "Create database backup"}
        </button>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <StatusItem label="Google Health" value={googleHealthConnected ? "Connected" : "Not connected"} />
        <StatusItem label="Last sync" value={lastSyncAt} />
        <StatusItem label="Last sync status" value={lastSyncStatus} />
        <StatusItem label="Last sync message" value={lastSyncMessage} />
        <StatusItem label="Health entries" value={String(healthEntryCount)} />
        <StatusItem label="Fasting entries" value={String(fastingEntryCount)} />
        <StatusItem label="Active fast" value={activeFastExists ? "Yes" : "No"} />
        <StatusItem label="Admin auth" value={adminAuthConfigured ? "Configured" : "Missing config"} />
        <StatusItem label="Backups folder" value={backupsFolderExists ? "Exists" : "Not created yet"} />
      </dl>

      {message ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{message}</p> : null}
    </section>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words text-zinc-800 dark:text-zinc-200">{value || "-"}</dd>
    </div>
  );
}
