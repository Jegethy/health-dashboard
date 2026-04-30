# Health Dashboard

A local personal health and weight-loss tracking dashboard built with Next.js App Router, TypeScript, Tailwind CSS, Recharts, SQLite, Prisma, Zod, and date-fns.

The app supports manual entry, CSV import/export, and Google Health API sync. Fitbit Web API is not used because new Fitbit developer app creation is unavailable.

## Features

- Daily entries for weight, steps, calories eaten, calories burned, and notes.
- One entry per date; saving an existing date updates that entry.
- Summary cards for latest weight, total weight change, 7-day average steps, 7-day calorie balance, and current entry streak.
- Charts for weight, steps, calories eaten versus burned, and calorie deficit/surplus.
- Recent entries table sorted newest first, with source indicators.
- Google Health OAuth connection and date-range sync.
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

`db:migrate` runs an idempotent local SQLite setup script. The Prisma schema remains the source of truth for the application model.

## Run Locally

```bash
npm run dev
```

Open http://127.0.0.1:3000.

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

- `https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly` for steps and total calories.
- `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly` for weight.

After changing scopes, update Google Cloud Data Access and `.env.local`, then disconnect and reconnect Google Health. Existing OAuth grants do not automatically gain new scopes. If the dashboard shows only `activity_and_fitness.readonly`, weight sync will fail or be skipped.

The local OAuth callback URL is:

```text
http://127.0.0.1:3000/api/integrations/google-health/callback
```

After configuring Google Cloud and `.env.local`:

1. Restart the dev server.
2. Open http://127.0.0.1:3000.
3. Click Connect Google Health.
4. Complete Google OAuth consent.
5. Click Sync last 7 days or Sync last 30 days.

Manual command-line sync after OAuth is connected:

```bash
npm run sync:google-health
```

Use a custom day count:

```bash
$env:GOOGLE_HEALTH_SYNC_DAYS=14; npm run sync:google-health
```

Safe sync debug logging:

```bash
GOOGLE_HEALTH_DEBUG_SYNC="true"
```

This logs rollup field names and mapped values without logging tokens or secrets.

Clear fictional sample rows only:

```bash
npm run db:clear-sample
```

Troubleshooting:

- If the Integrations section says Google Health is not configured, check `.env.local` and restart the dev server.
- If token decryption fails after changing `INTEGRATION_TOKEN_ENCRYPTION_KEY`, disconnect and reconnect Google Health.
- If Google OAuth reports a redirect mismatch, verify the callback URL in Google Cloud.
- If Google returns 403, confirm the Google Health API is enabled, Google Cloud Data Access has the requested scopes, `.env.local` matches, and your account is a test user.

See `docs/google-health-setup.md` for full setup details.

## CSV Import And Export

- Export: use the dashboard's Export CSV button.
- Import: choose a CSV file with the same columns and submit it from the dashboard.
- Matching dates are updated.
- New dates are inserted.
- Negative values are rejected.

## Current Limitations

- Local-only app with no authentication.
- Google Health API is new and may change.
- Calories eaten is manual/CSV only until Google documents a clear nutrition/calories-eaten API path.
- No deletion UI yet.
- CSV parsing handles normal quoted CSV files but is intentionally simple.
- Metrics such as measurements, gym sessions, sleep, water intake, and mood are planned but not implemented.

## Roadmap

- Add delete entry support.
- Add optional metrics for sleep, water, mood, body measurements, and gym sessions.
- Add provider-specific CSV mappers for MyFitnessPal and Samsung Health exports.
- Add calories-eaten sync if Google Health documents nutrition support.
- Add import preview and row-level error display.

See `docs/api-integration-plan.md` for the future integration plan.
