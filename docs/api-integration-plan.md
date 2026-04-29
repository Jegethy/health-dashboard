# Future API Integration Plan

Live API integrations are intentionally outside the MVP. The first version keeps health data local, editable, and portable through manual entry plus CSV import/export. That makes the data model easier to trust before adding OAuth flows, background sync, or provider-specific edge cases.

## Google Health / Fitbit

- Add provider-specific modules under `src/lib/integrations`.
- Store normalized daily values in the existing `DailyHealthEntry` model where possible.
- Keep raw provider payloads out of the core dashboard until there is a clear need for auditing or re-syncing.
- Add OAuth only after the local workflow is stable.
- Store OAuth client IDs and secrets in `.env.local` for local development, never in source control.
- Document required scopes before enabling any sync.

## MyFitnessPal

MyFitnessPal API access is likely restricted, so treat it as a CSV/manual source first.

- Prefer importing exported food diary CSV files.
- Map calories eaten into `caloriesEaten`.
- Keep manual correction available after import because food diary exports can vary by format and region.

## Samsung Health

Samsung Health is best treated as an export/import source unless a reliable local integration path is chosen later.

- Start with CSV export parsing for steps, weight, sleep, and exercise sessions.
- Add new models only when the dashboard needs data that does not fit the daily summary entry.

## Secrets And Local Storage

- Keep `.env` and `.env.local` ignored by Git.
- Use `.env.example` for placeholder configuration.
- Use SQLite for local persistence in the MVP.
- Do not commit OAuth tokens, refresh tokens, client secrets, or personal exported data.

## Suggested Expansion Path

1. Keep manual entry and CSV import/export as the source of truth.
2. Add provider-specific CSV import mappers.
3. Add integration tables for sync metadata if live APIs are introduced.
4. Add OAuth flows behind a clear settings page.
5. Add background sync only after manual re-sync and conflict handling are reliable.
