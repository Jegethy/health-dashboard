# API Integration Plan

Google Health API is the live source for this focused dashboard. Fitbit Web API is not used because new Fitbit developer app creation is unavailable.

The intended flow is:

1. Health Sync on Android pushes health data into Google-connected health services where available.
2. This dashboard connects to Google Health with OAuth.
3. Google Health daily summaries for weight, steps, and total calories burned are normalized into `DailyHealthEntry`.
4. Manual entry and CSV import/export remain fallback and correction methods.

This app intentionally does not track food intake, calories eaten, hydration, mood, notes, general nutrition, or calorie deficit/surplus.

The provider code lives under `src/lib/integrations`. Dashboard components should depend on normalized provider interfaces, not raw provider response shapes.

## Current Google Health Provider

- Uses Google OAuth 2.0 Authorization Code flow.
- Requests offline access for refresh tokens.
- Stores encrypted access and refresh tokens in SQLite.
- Calls `users/me/identity` to store Google Health and legacy Fitbit identifiers when available.
- Syncs daily `steps`, `total-calories`, and `weight` using `dataPoints:dailyRollUp`.
- Requires `activity_and_fitness.readonly` for steps/total calories and `health_metrics_and_measurements.readonly` for weight.
- Provides a direct Google Health rollup CSV export for comparing API output against the phone app.
- Does not overwrite existing fields with null when Google Health has no value.
- Keeps source metadata internally for import/sync conflict behavior, but source is not part of the main dashboard.

The legacy `caloriesEaten` and `notes` database fields are unused by the current product UI and may be removed in a future cleanup migration.

## Fitbit

Fitbit Web API setup is superseded. Do not build new Fitbit Web API work unless Google reopens a supported migration path that requires it.

Legacy Fitbit IDs returned by Google Health identity are stored only for reference/migration mapping.

## MyFitnessPal

Direct MyFitnessPal API integration is not planned because this app is not a nutrition tracker.

## Samsung Health And Health Connect

Samsung Health should remain export/import focused unless a reliable local API path becomes available.

Future options should stay within weight, steps, and calorie-burn trends unless the product scope changes.

## Secrets And Local Storage

- `.env` and `.env.local` are ignored by Git.
- `.env.example` contains placeholders only.
- OAuth tokens are encrypted before being stored in SQLite.
- SQLite database files are ignored by Git.
- Do not commit exported personal health data.

## Expansion Path

1. Stabilize Google Health sync and conflict behavior.
2. Add import previews and row-level sync/import messages.
3. Add raw data point export if the data type mapping is clear for supported dashboard metrics.
4. Add Samsung Health or Health Connect import paths if they become useful for the focused metrics.
