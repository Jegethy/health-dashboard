"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calculateElapsedMinutes,
  DEFAULT_FASTING_TARGET_MINUTES,
  FastingEntryView,
  formatDuration,
  getCompletedFasts,
  getFastingPreset,
  getRepeatPreset,
} from "@/lib/fasting";

type FastingManagerProps = {
  entries: FastingEntryView[];
};

type FormState = {
  id: number | null;
  startAt: string;
  endAt: string;
};

export function FastingManager({ entries }: FastingManagerProps) {
  const router = useRouter();
  const completedEntries = getCompletedFasts(entries);
  const latest = completedEntries.at(-1) ?? null;
  const activeFast = entries.find((entry) => entry.active) ?? null;
  const initialState = useMemo(() => {
    const preset = getFastingPreset();
    return {
      id: null,
      startAt: preset.startAt,
      endAt: preset.endAt,
    };
  }, []);
  const [form, setForm] = useState<FormState>(initialState);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isActiveActionRunning, setIsActiveActionRunning] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);
  const [cancelConfirmation, setCancelConfirmation] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!activeFast) {
      return;
    }

    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, [activeFast]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const response = await fetch(form.id == null ? "/api/fasting" : `/api/fasting/${form.id}`, {
      method: form.id == null ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt: form.startAt,
        endAt: form.endAt,
      }),
    });
    const result = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setMessage(result.error ?? "Could not save fasting entry.");
      return;
    }

    setMessage(form.id == null ? "Fasting entry added." : "Fasting entry updated.");
    setForm(initialState);
    router.refresh();
  }

  async function runActiveAction(url: string, successMessage: string) {
    setIsActiveActionRunning(true);
    setMessage(null);

    const response = await fetch(url, { method: "POST" });
    const result = await response.json().catch(() => ({}));
    setIsActiveActionRunning(false);

    if (!response.ok) {
      setMessage(result.error ?? "Could not update active fast.");
      return;
    }

    setCancelConfirmation(false);
    setMessage(successMessage);
    router.refresh();
  }

  async function deleteEntry(id: number) {
    if (deleteConfirmation !== id) {
      setDeleteConfirmation(id);
      return;
    }

    setMessage(null);
    const response = await fetch(`/api/fasting/${id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(result.error ?? "Could not delete fasting entry.");
      return;
    }

    setDeleteConfirmation(null);
    setMessage("Fasting entry deleted.");
    router.refresh();
  }

  function usePreset() {
    const preset = getFastingPreset();
    setForm({
      id: null,
      startAt: preset.startAt,
      endAt: preset.endAt,
    });
  }

  function repeatPrevious() {
    const preset = getRepeatPreset(latest);
    setForm({
      id: null,
      startAt: preset.startAt,
      endAt: preset.endAt,
    });
  }

  const elapsedMinutes = activeFast && now ? calculateElapsedMinutes(activeFast.startAt, now) : null;
  const progress =
    elapsedMinutes == null
      ? null
      : Math.min(100, Math.round((elapsedMinutes / DEFAULT_FASTING_TARGET_MINUTES) * 100));

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="rounded-md border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/30">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Active fast
        </h2>
        {activeFast ? (
          <div className="mt-3 flex flex-col gap-3">
            <div className="grid gap-3 text-sm sm:grid-cols-4">
              <Status label="Started" value={`${activeFast.startDate} ${activeFast.startTime}`} />
              <Status
                label="Elapsed"
                value={elapsedMinutes == null ? "Refreshing..." : formatDuration(elapsedMinutes)}
              />
              <Status label="Target" value={formatDuration(DEFAULT_FASTING_TARGET_MINUTES)} />
              <Status label="Progress" value={progress == null ? "Refreshing..." : `${progress}%`} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isActiveActionRunning}
                onClick={() => runActiveAction("/api/fasting/stop", "Fast completed.")}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                End fast now
              </button>
              <button
                type="button"
                disabled={isActiveActionRunning}
                onClick={() =>
                  cancelConfirmation
                    ? runActiveAction("/api/fasting/cancel-active", "Active fast cancelled.")
                    : setCancelConfirmation(true)
                }
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                {cancelConfirmation ? "Confirm cancel" : "Cancel active fast"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              No active fast. Starting one records the current date and time as the fasting start.
            </p>
            <button
              type="button"
              disabled={isActiveActionRunning}
              onClick={() => runActiveAction("/api/fasting/start", "Fast started.")}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Start fast now
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Completed fasts
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Add, edit, or delete completed fasts. New entries use a fixed 16-hour target.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={usePreset}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            16-hour preset
          </button>
          <button
            type="button"
            onClick={repeatPrevious}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Repeat previous fast
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 lg:grid-cols-4">
        <Field
          label="Start"
          value={form.startAt}
          onChange={(value) => setForm((current) => ({ ...current, startAt: value }))}
        />
        <Field
          label="End"
          value={form.endAt}
          onChange={(value) => setForm((current) => ({ ...current, endAt: value }))}
        />
        <div className="flex items-end gap-2 lg:col-span-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : form.id == null ? "Add fast" : "Update fast"}
          </button>
          {form.id != null ? (
            <button
              type="button"
              onClick={() => setForm(initialState)}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      {message ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{message}</p> : null}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <Th>Start</Th>
              <Th>End</Th>
              <Th>Duration</Th>
              <Th>Target</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {[...completedEntries].reverse().map((entry) => (
              <tr key={entry.id}>
                <Td>{`${entry.startDate} ${entry.startTime}`}</Td>
                <Td>{`${entry.endDate} ${entry.endTime}`}</Td>
                <Td>{formatDuration(entry.durationMinutes)}</Td>
                <Td>{formatDuration(entry.targetMinutes)}</Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          id: entry.id,
                          startAt: entry.startAt,
                          endAt: entry.endAt,
                        })
                      }
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry.id)}
                      className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      {deleteConfirmation === entry.id ? "Confirm delete" : "Delete"}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-500">{label}</p>
      <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <input
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{children}</td>;
}
