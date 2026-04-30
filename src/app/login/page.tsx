import { redirect } from "next/navigation";
import {
  createAdminSession,
  getSafeNextPath,
  hasAdminSession,
  isAdminAuthConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params?.next);

  if (await hasAdminSession()) {
    redirect(nextPath);
  }

  const error = firstParam(params?.error);
  const loggedOut = firstParam(params?.loggedOut);

  async function login(formData: FormData) {
    "use server";

    const password = formData.get("password");
    const next = getSafeNextPath(formData.get("next"));
    const errorParams = new URLSearchParams({ next });

    if (!isAdminAuthConfigured()) {
      errorParams.set("error", "not-configured");
      redirect(`/login?${errorParams.toString()}`);
    }

    if (typeof password !== "string" || !(await verifyAdminPassword(password))) {
      errorParams.set("error", "invalid");
      redirect(`/login?${errorParams.toString()}`);
    }

    await createAdminSession();
    redirect(next);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-center">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium text-teal-700 dark:text-teal-400">Admin / Data tools</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Log in
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter the local admin password to manage sync, exports, corrections, and data reset.
          </p>

          <form action={login} className="mt-5 space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Log in
            </button>
          </form>

          {error ? (
            <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error === "not-configured"
                ? "Admin login is not configured. Add ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET to .env.local."
                : "Password was not accepted."}
            </p>
          ) : null}
          {loggedOut ? (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">You have been logged out.</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
