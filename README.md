# Health Dashboard

A local personal dashboard for weight, movement, and calorie-burn trends. It is built with Next.js App Router, TypeScript, Tailwind CSS, Recharts, SQLite, Prisma, Zod, and date-fns.

The app syncs Google Health data for:

- Weight
- Steps
- Total calories burned

It intentionally does not track food intake, calories eaten, hydration, mood, general nutrition, or calorie deficit/surplus.

## Features

- Google Health OAuth connection and sync.
- Daily entries for weight, steps, total calories burned, and notes.
- Manual entry for weigh-ins or corrections.
- Dashboard summary cards for latest weight, weight change, average steps, average calories burned, and compact data coverage.
- Charts for weight, steps, and total calories burned.
- Recent entries table.
- CSV import/export from Admin / Data tools using:

```csv
date,weightKg,steps,caloriesBurned,notes
```

Older CSV files with `caloriesEaten` are tolerated, but that field is legacy/internal and unused by the dashboard.

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
- Clear local dashboard entries
- Clear local entries and sync last 30 days
- Data coverage details

Reset actions affect local dashboard data only. They do not delete Google Health/Fitbit source data or OAuth tokens.

## Google Health Integration

Create `.env.local` from `.env.example` and add:

```bash
GOOGLE_HEALTH_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_HEALTH_CLIENT_SECRET="your-google-oauth-client-secret"
GOOGLE_HEALTH_REDIRECT_URI="http://127.0.0.1:3000/api/integrations/google-health/callback"
GOOGLE_HEALTH_SCOPES="https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly https://www.googleapis.com/auth/googlehealth.profile.readonly"
GOOGLE_HEALTH_DEBUG_SYNC="false"
INTEGRATION_TOKEN_ENCRYPTION_KEY="a-long-random-local-secret"
```

Required sync scopes:

- `https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly` for steps and total calories burned.
- `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly` for weight.

After changing scopes, update Google Cloud Data Access and `.env.local`, then disconnect and reconnect Google Health.

## CSV Import And Export

Admin / Data tools CSV import/export uses:

```csv
date,weightKg,steps,caloriesBurned,notes
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

## Current Limitations

- Local-only app with no authentication.
- Google Health API is new and may change.
- Weight appears only for dates where Google Health has weigh-in data.
- Raw Google Health data point export is not implemented; comparison export uses official daily rollups.
- The database still contains a legacy `caloriesEaten` field from an earlier MVP, but it is unused by the product UI.

See `docs/google-health-setup.md` and `docs/api-integration-plan.md` for more detail.
