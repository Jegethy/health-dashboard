"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function EntryForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Could not save the entry.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Entry saved.");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Add or update entry</h2>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 lg:grid-cols-6">
        <Field label="Date" name="date" type="date" required />
        <Field label="Weight kg" name="weightKg" type="number" step="0.1" min="0" />
        <Field label="Steps" name="steps" type="number" step="1" min="0" />
        <Field label="Calories burned" name="caloriesBurned" type="number" step="1" min="0" />
        <div className="lg:col-span-6">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save entry"}
          </button>
          {message ? <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p> : null}
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  type,
  required,
  min,
  step,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <div className="lg:col-span-1">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        min={min}
        step={step}
        className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
    </div>
  );
}
