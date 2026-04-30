import Link from "next/link";

type AppHeaderProps = {
  active: "dashboard" | "admin";
  entryCount?: number;
};

export function AppHeader({ active, entryCount }: AppHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800">
      <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
        Weight, movement, and burn trends
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Health Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Google Health-powered tracking for weight, steps, and total calories burned.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <NavLink href="/" active={active === "dashboard"}>
            Dashboard
          </NavLink>
          <NavLink href="/admin" active={active === "admin"}>
            Admin / Data tools
          </NavLink>
          {entryCount != null ? (
            <span className="ml-1 text-zinc-500 dark:text-zinc-400">{entryCount} entries</span>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-md bg-zinc-950 px-3 py-2 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"
          : "rounded-md border border-zinc-300 px-3 py-2 font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
      }
    >
      {children}
    </Link>
  );
}
