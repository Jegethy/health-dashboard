# Health Dashboard

A local personal health and weight-loss tracking dashboard built with Next.js App Router, TypeScript, Tailwind CSS, Recharts, SQLite, Prisma, Zod, and date-fns.

The MVP started with manual entry and CSV import/export. The app now also includes a Fitbit provider as the first live data source, while keeping manual and CSV workflows as fallbacks.

## Features

- Daily entries for weight, steps, calories eaten, calories burned, and notes.
- One entry per date; saving an existing date updates that entry.
- Summary cards for latest weight, total weight change, 7-day average steps, 7-day calorie balance, and current entry streak.
- Charts for weight, steps, calories eaten versus burned, and calorie deficit/surplus.
- Recent entries table sorted newest first.
- Fitbit OAuth connection and date-range sync.
- CSV export and import using:

```csv
date,weightKg,steps,caloriesEaten,caloriesBurned,notes
```

## Install

```bash
npm install
```

## Database Setup

The app uses SQLite through Prisma. The local database URL is:

```bash
DATABASE_URL="file:./dev.db"
```

Fitbit integration also uses:

```bash
FITBIT_CLIENT_ID="your-fitbit-client-id"
FITBIT_CLIENT_SECRET="your-fitbit-client-secret"
FITBIT_REDIRECT_URI="http://127.0.0.1:3000/api/integrations/fitbit/callback"
FITBIT_SCOPES="activity weight nutrition profile"
FITBIT_TOKEN_ENCRYPTION_KEY="a-long-random-local-secret"
```

For a fresh setup:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

You can also run both database creation and seed data in one step:

```bash
npm run db:setup
```

The app also seeds fictional sample data automatically when the database is empty. In this MVP, `db:migrate` runs an idempotent local SQLite setup script because Prisma's migration engine can be sensitive to local Windows execution policy and binary-download issues. The Prisma schema remains the source of truth for the application model.

## Run Locally

```bash
npm run dev
```

Open http://localhost:3000.

For Fitbit OAuth, prefer opening http://127.0.0.1:3000 so it matches the local callback URL exactly.

## Fitbit Integration

Fitbit is used as the first live source for data pushed from Health Sync on Android. It can sync:

- Weight
- Steps
- Calories burned
- Calories eaten, when Fitbit nutrition data is available

Setup:

1. Register a Fitbit developer app.
2. Use this callback URL:

```text
http://127.0.0.1:3000/api/integrations/fitbit/callback
```

3. Add the Fitbit values to `.env.local`.
4. Restart the dev server.
5. Click Connect Fitbit in the dashboard Integrations section.
6. Click Sync last 30 days.

Manual sync from the command line after OAuth is connected:

```bash
npm run sync:fitbit
```

Use a custom day count:

```bash
$env:FITBIT_SYNC_DAYS=14; npm run sync:fitbit
```

Troubleshooting:

- If the Integrations section says Fitbit is not configured, check `.env.local`.
- If token decryption fails after changing `FITBIT_TOKEN_ENCRYPTION_KEY`, disconnect and reconnect Fitbit.
- Fitbit Web API is legacy; future migration to Google Health API is planned.

See `docs/fitbit-setup.md` for full setup details.

## CSV Import And Export

- Export: use the dashboard's Export CSV button.
- Import: choose a CSV file with the same columns and submit it from the dashboard.
- Matching dates are updated.
- New dates are inserted.
- Negative values are rejected.

## Current Limitations

- Local-only app with no authentication.
- Fitbit Web API is legacy and local-only OAuth setup is required.
- No deletion UI yet.
- CSV parsing handles normal quoted CSV files but is intentionally simple.
- Metrics such as measurements, gym sessions, sleep, water intake, and mood are planned but not implemented.

## Roadmap

- Add delete entry support.
- Add optional metrics for sleep, water, mood, body measurements, and gym sessions.
- Add provider-specific CSV mappers for MyFitnessPal and Samsung Health exports.
- Add Google Health API provider as a future Fitbit migration path.
- Add import preview and row-level error display.

See `docs/api-integration-plan.md` for the future integration plan.
