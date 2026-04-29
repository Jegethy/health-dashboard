"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ImportExport() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsImporting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/import", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    setIsImporting(false);

    if (!response.ok) {
      setMessage(result.error ?? "Import failed.");
      return;
    }

    const warning = result.errors?.length ? ` ${result.errors.length} row warning(s).` : "";
    setMessage(`Imported ${result.inserted} new row(s), updated ${result.updated} row(s).${warning}`);
    fileInput.current!.value = "";
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            CSV import/export
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Uses date, weightKg, steps, caloriesEaten, caloriesBurned, notes.
          </p>
        </div>
        <a
          href="/api/export"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Export CSV
        </a>
      </div>
      <form onSubmit={handleImport} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={fileInput}
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:file:bg-zinc-800 dark:file:text-zinc-100 sm:max-w-md"
        />
        <button
          type="submit"
          disabled={isImporting}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          {isImporting ? "Importing..." : "Import CSV"}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{message}</p> : null}
    </section>
  );
}
