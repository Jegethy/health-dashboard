# API Integration Plan

Fitbit is now the first live data source. The intended flow is:

1. Health Sync on Android pushes health data into Fitbit.
2. This dashboard connects to Fitbit with OAuth.
3. Fitbit daily summaries are normalized into `DailyHealthEntry`.
4. Manual entry and CSV import/export remain fallback and correction methods.

The provider code lives under `src/lib/integrations`, with Fitbit implemented as the first adapter. A future Google Health API provider should implement the same provider interface rather than rewriting dashboard components.

## Current Fitbit Provider

- Uses Fitbit OAuth Authorization Code flow.
- Stores encrypted access and refresh tokens in SQLite.
- Syncs daily steps, calories burned, weight, and nutrition calories when Fitbit provides them.
- Preserves notes.
- Does not overwrite existing fields with null when Fitbit has no value.
- Marks entries as `fitbit` or `mixed` in the dashboard source column.

## Google Health API Future Provider

Google Health API migration is a priority because Fitbit Web API is legacy.

- Add a Google provider under `src/lib/integrations/google-health`.
- Reuse `IntegrationAccount` and `SyncLog`.
- Normalize data into `DailyHealthEntry`.
- Keep provider-specific payload parsing inside the provider adapter.
- Store OAuth secrets in `.env.local`, never in source control.

## MyFitnessPal

Direct MyFitnessPal API integration is not planned for now because access is restricted.

- Treat MyFitnessPal as a CSV/manual import source.
- Prefer dedicated CSV mappers if exported data shape differs from the dashboard CSV format.
- Map food diary calories into `caloriesEaten`.

## Samsung Health

Samsung Health should remain export/import focused unless a reliable local API path becomes available.

- Start with CSV or file export parsing.
- Consider new models only for data that does not fit daily summaries, such as workouts or sleep sessions.

## Secrets And Local Storage

- `.env` and `.env.local` are ignored by Git.
- `.env.example` contains placeholders only.
- OAuth tokens are encrypted before being stored in SQLite.
- SQLite database files are ignored by Git.
- Do not commit exported personal health data.

## Expansion Path

1. Stabilize Fitbit sync and conflict behavior.
2. Add import previews and row-level sync/import messages.
3. Add optional models for sleep, body measurements, mood, water, and gym sessions.
4. Add Google Health API as a second provider.
5. Phase Fitbit toward legacy fallback status when Google Health covers the needed data reliably.
