# Health Dashboard

A local personal health and weight-loss tracking dashboard built with Next.js App Router, TypeScript, Tailwind CSS, Recharts, SQLite, Prisma, Zod, and date-fns.

The MVP focuses on manual data entry and CSV import/export. It does not include live Fitbit, Google Health, Samsung Health, MyFitnessPal, or OAuth integrations yet.

## Features

- Daily entries for weight, steps, calories eaten, calories burned, and notes.
- One entry per date; saving an existing date updates that entry.
- Summary cards for latest weight, total weight change, 7-day average steps, 7-day calorie balance, and current entry streak.
- Charts for weight, steps, calories eaten versus burned, and calorie deficit/surplus.
- Recent entries table sorted newest first.
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

The app also seeds fictional sample data automatically when the database is empty. In this MVP, `db:migrate` runs an idempotent local SQLite setup script because Prisma's migration engine can be sensitive to local Windows execution policy and binary-download issues. The Prisma schema remains the source of truth for the application model.

## Run Locally

```bash
npm run dev
```

Open http://localhost:3000.

## CSV Import And Export

- Export: use the dashboard's Export CSV button.
- Import: choose a CSV file with the same columns and submit it from the dashboard.
- Matching dates are updated.
- New dates are inserted.
- Negative values are rejected.

## Current Limitations

- Local-only app with no authentication.
- No live API integrations.
- No deletion UI yet.
- CSV parsing handles normal quoted CSV files but is intentionally simple.
- Metrics such as measurements, gym sessions, sleep, water intake, and mood are planned but not implemented.

## Roadmap

- Add delete entry support.
- Add optional metrics for sleep, water, mood, body measurements, and gym sessions.
- Add provider-specific CSV mappers for MyFitnessPal and Samsung Health exports.
- Add Google Health or Fitbit OAuth only after the local workflow is stable.
- Add import preview and row-level error display.

See `docs/api-integration-plan.md` for the future integration plan.
