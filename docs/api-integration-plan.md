# API Integration Plan

Google Health API is now the first live source for this dashboard. Fitbit Web API is not used because new Fitbit developer app creation is unavailable.

The intended flow is:

1. Health Sync on Android pushes health data into Google-connected health services where available.
2. This dashboard connects to Google Health with OAuth.
3. Google Health daily summaries are normalized into `DailyHealthEntry`.
4. Manual entry and CSV import/export remain fallback and correction methods.

The provider code lives under `src/lib/integrations`. Dashboard components should depend on normalized provider interfaces, not raw provider response shapes.

## Current Google Health Provider

- Uses Google OAuth 2.0 Authorization Code flow.
- Requests offline access for refresh tokens.
- Stores encrypted access and refresh tokens in SQLite.
- Calls `users/me/identity` to store Google Health and legacy Fitbit identifiers when available.
- Syncs daily `steps`, `total-calories`, and `weight` using `dataPoints:dailyRollUp`.
- Requires `activity_and_fitness.readonly` for steps/total calories and `health_metrics_and_measurements.readonly` for weight.
- Provides a direct Google Health rollup CSV export for comparing API output against the phone app.
- Preserves notes.
- Does not overwrite existing fields with null when Google Health has no value.
- Marks entries as `google_health` or `mixed` in the dashboard source column.

Nutrition/calories-eaten is not implemented because the official Google Health API discovery document did not expose a clear nutrition/calories-eaten daily data type. Keep calories eaten as manual/CSV until Google documents a supported path.

## Fitbit

Fitbit Web API setup is superseded. Do not build new Fitbit Web API work unless Google reopens a supported migration path that requires it.

Legacy Fitbit IDs returned by Google Health identity are stored only for reference/migration mapping.

## MyFitnessPal

Direct MyFitnessPal API integration is not planned.

- Treat MyFitnessPal as a CSV/manual import source.
- Prefer dedicated CSV mappers if exported data shape differs from the dashboard CSV format.
- Map food diary calories into `caloriesEaten`.

## Samsung Health And Health Connect

Samsung Health should remain export/import focused unless a reliable local API path becomes available.

Future options:

- Samsung Health export/import.
- Direct Health Connect integration if Google provides a practical local/web-accessible route later.
- New models for data that does not fit daily summaries, such as workouts or sleep sessions.

## Secrets And Local Storage

- `.env` and `.env.local` are ignored by Git.
- `.env.example` contains placeholders only.
- OAuth tokens are encrypted before being stored in SQLite.
- SQLite database files are ignored by Git.
- Do not commit exported personal health data.

## Expansion Path

1. Stabilize Google Health sync and conflict behavior.
2. Add import previews and row-level sync/import messages.
3. Add optional models for sleep, body measurements, mood, water, and gym sessions.
4. Add calories-eaten sync only if Google documents a supported nutrition data type.
5. Add raw data point export if the data type mapping is clear for all supported dashboard metrics.
6. Add Samsung Health or Health Connect import paths if they become useful.
