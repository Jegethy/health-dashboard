import { redirect } from "next/navigation";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { FastingManager } from "@/components/fasting-manager";
import { hasAdminSession } from "@/lib/admin-auth";
import { getFastingEntries } from "@/lib/fasting";

export const dynamic = "force-dynamic";

export default async function AdminFastingPage() {
  if (!(await hasAdminSession())) {
    redirect("/login?next=/admin/fasting");
  }

  const entries = await getFastingEntries();

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
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Fasting tools
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Manage completed intermittent fasting entries. Public fasting charts remain read-only.
          </p>
        </section>
        <FastingManager entries={entries} />
      </div>
      <AppFooter />
    </main>
  );
}
