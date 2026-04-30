# Health Dashboard

A local personal dashboard for weight, movement, and calorie-burn trends. It is built with Next.js App Router, TypeScript, Tailwind CSS, Recharts, SQLite, Prisma, Zod, and date-fns.

It also supports manual intermittent fasting tracking as a separate read-only dashboard.

The app syncs Google Health data for:

- Weight
- Steps
- Total calories burned

It intentionally does not track food intake, calories eaten, hydration, mood, general nutrition, or calorie deficit/surplus.

## Features

- Google Health OAuth connection and sync.
- Daily entries for weight, steps, and total calories burned.
- Manual correction tools for date, weight, steps, and calories burned.
- Dashboard summary cards for latest weight, weight change, average steps, and average calories burned.
- Charts for weight, steps, and total calories burned.
- Public read-only fasting dashboard for completed fast duration trends.
- Protected fasting management tools for starting, ending, adding, editing, and deleting fasts.
- Recent entries table in Admin / Data tools.
- CSV import/export from Admin / Data tools using:

```csv
date,weightKg,steps,caloriesBurned
```

Older CSV files with `caloriesEaten` or `notes` are tolerated, but those fields are legacy/internal and unused by the dashboard.

## Install

```bash
npm install
```

## Database Setup

The app uses SQLite through Prisma. The local database URL is:

```bash
DATABASE_URL="file:./dev.db"
```

For a fresh setup:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

`db:migrate` runs an idempotent local SQLite setup script. The Prisma schema remains the source of truth for the application model.

## Run Locally

```bash
npm run dev
```

Open http://127.0.0.1:3000.

## Admin / Data Tools

The main dashboard is intentionally focused. Operational tools live at:

```text
http://127.0.0.1:3000/admin
```

The admin page includes:

- Google Health connection status
- Connect/disconnect Google Health
- Sync last 7, 30, or 90 days
- Export Google Health rollup CSV for 7, 30, or 90 days
- Recent entries inspection
- Manual corrections
- Local CSV import/export
- Fasting entry management
- System status and database backup
- Clear local dashboard entries
- Clear local entries and sync last 30 days
- Data coverage details

Reset actions affect local dashboard data only. They do not delete Google Health account data or OAuth tokens.

## Google Health Integration

Create `.env.local` from `.env.example` and add:

```bash
GOOGLE_HEALTH_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_HEALTH_CLIENT_SECRET="your-google-oauth-client-secret"
GOOGLE_HEALTH_REDIRECT_URI="http://127.0.0.1:3000/api/integrations/google-health/callback"
GOOGLE_HEALTH_SCOPES="https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly https://www.googleapis.com/auth/googlehealth.profile.readonly"
GOOGLE_HEALTH_DEBUG_SYNC="false"
INTEGRATION_TOKEN_ENCRYPTION_KEY="a-long-random-local-secret"
ADMIN_PASSWORD_HASH="generated-admin-password-hash"
ADMIN_SESSION_SECRET="a-long-random-admin-session-secret"
```

Required sync scopes:

- `https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly` for steps and total calories burned.
- `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly` for weight.

After changing scopes, update Google Cloud Data Access and `.env.local`, then disconnect and reconnect Google Health.

## Local Admin Login

The main dashboard at `/` is public on the local network. Admin / Data tools at `/admin` and the backend action routes are protected by a single local admin password and a signed HTTP-only session cookie. This is a simple single-user admin login, not a registration or multi-user account system.

Generate an admin password hash:

```bash
npm run admin:hash-password
```

Copy the printed `ADMIN_PASSWORD_HASH` value into `.env.local`.

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add both values to `.env.local`:

```bash
ADMIN_PASSWORD_HASH="paste-the-generated-hash"
ADMIN_SESSION_SECRET="paste-a-random-session-secret"
```

Do not commit `.env.local`.

Go to http://127.0.0.1:3000/admin to log in. The login page redirects back to `/admin` after success. Use the Logout button on `/admin` to clear the session cookie.

Protected backend routes include `/api/admin/*`, `/api/export`, `/api/import`, `/api/entries`, and Google Health connect/disconnect/sync/export routes. The Google Health OAuth callback remains available for Google's redirect and is still protected by OAuth state validation.

## Intermittent Fasting

The fasting dashboard is public and read-only:

```text
http://127.0.0.1:3000/fasting
```

It shows active fasting status when a fast is running, latest completed fast, average fast, longest fast, target hit rate, and a fasting duration chart with a 16-hour target reference line.

Fasting entries are managed in the protected admin area:

```text
http://127.0.0.1:3000/admin/fasting
```

Fasting data is manual because Google Health does not currently provide a clear intermittent fasting data type. The fixed fasting target is 16 hours. Use Start fast now / End fast now for autonomous tracking, or add completed fasts manually for corrections. Active fasts are shown separately and do not affect averages until completed. The app still does not track food intake, calories eaten, hydration, nutrition, mood, or deficit/surplus.

## CSV Import And Export

Admin / Data tools CSV import/export uses:

```csv
date,weightKg,steps,caloriesBurned
```

Google Health rollup CSV export calls Google Health directly and is useful for comparing API values with the phone app:

```text
http://127.0.0.1:3000/api/integrations/google-health/export-rollup?fromDate=2026-04-01&toDate=2026-04-30
```

Use the 90-day sync/export buttons if older weigh-ins are outside the current range.

## Local Reset Commands

Clear fictional sample rows only:

```bash
npm run db:clear-sample
```

Clear all local dashboard health entries only:

```bash
npm run db:clear-health-entries -- --confirm
```

This deletes `DailyHealthEntry` rows only. Google Health OAuth tokens, connected account state, sync logs, and the SQLite database file are kept.

## Backups

Create a timestamped local SQLite backup:

```bash
npm run db:backup
```

Backups are stored in:

```text
backups/
```

The backup command copies the SQLite database file and does not delete or modify the original. The protected Admin / Data tools page also has a Create database backup button.

Manual restore is intentionally simple: stop the dev/server process, copy the desired backup `.db` file over the active SQLite database file, then start the app again. Keep backups local and do not commit them.

## Daily Sync

Run a scheduled-friendly sync for the last 14 days:

```bash
npm run sync:daily
```

This uses the same Google Health sync code as `npm run sync:google-health`, does not clear entries, and requires an already connected Google Health account.

For Windows Task Scheduler instructions, see `docs/windows-task-scheduler.md`.

## Current Limitations

- Local personal app with a simple single-user admin login.
- Google Health API is new and may change.
- Weight appears only for dates where Google Health has weigh-in data.
- Raw Google Health data point export is not implemented; comparison export uses official daily rollups.
- Fasting CSV import/export is future work.
- Local/home-server deployment is the target for now. Shared hosting that cannot run Node.js, such as NFO shared web hosting, is not suitable; use Node-capable hosting, a VPS, or a home server if deploying later.
- The database still contains a legacy `caloriesEaten` field from an earlier MVP, but it is unused by the product UI.
- The database still contains legacy `notes` and source-tracking fields, but notes/source are not part of the normal user-facing workflow.

See `docs/google-health-setup.md` and `docs/api-integration-plan.md` for more detail.
