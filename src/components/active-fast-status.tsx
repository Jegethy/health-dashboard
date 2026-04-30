"use client";

import { useEffect, useState } from "react";
import {
  calculateElapsedMinutes,
  DEFAULT_FASTING_TARGET_MINUTES,
  FastingEntryView,
  formatDuration,
} from "@/lib/fasting";

type ActiveFastStatusProps = {
  activeFast: FastingEntryView | null;
};

export function ActiveFastStatus({ activeFast }: ActiveFastStatusProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!activeFast) {
      return;
    }

    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, [activeFast]);

  if (!activeFast) {
    return null;
  }

  const elapsedMinutes = now ? calculateElapsedMinutes(activeFast.startAt, now) : null;
  const progress =
    elapsedMinutes == null
      ? null
      : Math.min(100, Math.round((elapsedMinutes / DEFAULT_FASTING_TARGET_MINUTES) * 100));

  return (
    <section className="rounded-lg border border-teal-200 bg-teal-50 p-4 shadow-sm dark:border-teal-900 dark:bg-teal-950/30">
      <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Active fast</p>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
        <Status label="Started" value={`${activeFast.startDate} ${activeFast.startTime}`} />
        <Status
          label="Elapsed"
          value={elapsedMinutes == null ? "Refreshing..." : formatDuration(elapsedMinutes)}
        />
        <Status label="Target" value={formatDuration(DEFAULT_FASTING_TARGET_MINUTES)} />
        <Status label="Progress" value={progress == null ? "Refreshing..." : `${progress}%`} />
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
