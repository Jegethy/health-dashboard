# Google Health Setup

Google Health API is the first live provider for this local personal dashboard. Fitbit Web API is not used because new Fitbit developer app creation is unavailable.

The app keeps manual entry and CSV import/export as fallback and correction methods.

## What The Integration Syncs

The first Google Health version uses the official Google Health API v4 discovery document:

- `users/me/identity` for Google Health and legacy Fitbit identifiers.
- `dataPoints:dailyRollUp` for supported daily summaries.
- Data types:
  - `steps`
  - `total-calories`
  - `weight`

The discovery document did not show a nutrition/calories-eaten data type, so calories eaten remains manual/CSV for now.

## Google Cloud Setup

1. Create or choose a Google Cloud project.
2. Enable the Google Health API for that project.
3. Configure the OAuth consent screen.
4. Keep the app in testing mode for personal/local use if you are the only user.
5. Add your own Google account as a test user.
6. Create an OAuth 2.0 Client ID.
7. Choose Web application as the client type.
8. Add this authorized redirect URI:

```text
http://127.0.0.1:3000/api/integrations/google-health/callback
```

## Environment Variables

Create `.env.local` from `.env.example` and fill in the Google values:

```bash
GOOGLE_HEALTH_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_HEALTH_CLIENT_SECRET="your-google-oauth-client-secret"
GOOGLE_HEALTH_REDIRECT_URI="http://127.0.0.1:3000/api/integrations/google-health/callback"
GOOGLE_HEALTH_SCOPES="https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly https://www.googleapis.com/auth/googlehealth.profile.readonly"
GOOGLE_HEALTH_DEBUG_SYNC="false"
INTEGRATION_TOKEN_ENCRYPTION_KEY="a-long-random-local-secret"
```

Required sync scopes:

- `https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly` for `steps` and `total-calories`.
- `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly` for `weight`.

`https://www.googleapis.com/auth/googlehealth.profile.readonly` is included in the recommended local configuration for profile/identity-related access, but the current daily sync requires the first two scopes.

Generate an encryption key with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Do not commit `.env.local`.

## Connect And Sync

1. Start the app:

```bash
npm run dev
```

2. Open http://127.0.0.1:3000.
3. In Integrations, click Connect Google Health.
4. Complete Google OAuth consent.
5. Click Sync last 7 days or Sync last 30 days.

If you add or change scopes, disconnect and reconnect Google Health. Existing OAuth grants will not automatically gain new scopes. If the app shows only `activity_and_fitness.readonly`, weight sync will fail or be skipped until you reconnect with `health_metrics_and_measurements.readonly`.

Command-line sync after OAuth is connected:

```bash
npm run sync:google-health
```

Use a custom day count:

```bash
$env:GOOGLE_HEALTH_SYNC_DAYS=14; npm run sync:google-health
```

This can be used later with Windows Task Scheduler. The project does not configure Task Scheduler automatically.

## Google Health Rollup CSV Export

The dashboard Integrations panel includes:

- Export Google Health rollup CSV: last 7 days
- Export Google Health rollup CSV: last 30 days

These exports call Google Health directly and do not read from `DailyHealthEntry`. Use them to compare the API values against the Fitbit/phone app.

Direct URL format:

```text
http://127.0.0.1:3000/api/integrations/google-health/export-rollup?fromDate=2026-04-01&toDate=2026-04-30
```

CSV columns:

```text
date,googleHealthSteps,googleHealthTotalCaloriesBurned,googleHealthWeightKg,stepsRawFields,caloriesRawFields,weightRawFields,warnings
```

`total-calories` rollup requests are chunked into 14-day ranges because Google Health daily rollup documents a 14-day maximum range for `total-calories`.

Raw data point export is not implemented in this pass. The official discovery document clearly supports `dataPoints.list`, but `total-calories` appears as a rollup data type rather than a normal `DataPoint` union field, so the safer comparison tool is the daily rollup CSV.

## Debug Sync Output

Set this in `.env.local` to print safe rollup diagnostics during sync:

```bash
GOOGLE_HEALTH_DEBUG_SYNC="true"
```

The logs include requested data type, requested date range, raw rollup field names, relevant raw values such as `countSum`, `kcalSum`, `weightGramsAvg`, and the mapped dashboard fields. Tokens, client secrets, and profile data are not logged.

## Clearing Sample Data

To remove fictional seed/sample rows without deleting manual, CSV, mixed, or Google Health rows:

```bash
npm run db:clear-sample
```

## Clearing Local Health Entries

To remove all local dashboard health entries and keep Google Health connected:

```bash
npm run db:clear-health-entries -- --confirm
```

Without `--confirm`, the command refuses to delete anything:

```bash
npm run db:clear-health-entries
```

This deletes `DailyHealthEntry` rows only. It does not delete `IntegrationAccount`, OAuth tokens, `SyncLog`, or the SQLite database file.

The dashboard also has a Data reset section. Type `DELETE`, then choose:

- Clear local health entries
- Clear and sync last 30 days

Clear and sync requires Google Health to already be connected. If Google Health is not connected, no local entries are deleted by that combined action.

## Troubleshooting

- `GOOGLE_HEALTH_CLIENT_ID is missing`: add Google Health variables to `.env.local` and restart the dev server.
- `INTEGRATION_TOKEN_ENCRYPTION_KEY is missing`: add a local encryption key. If you change the key after connecting, disconnect and reconnect.
- OAuth redirect mismatch: make sure Google Cloud has exactly `http://127.0.0.1:3000/api/integrations/google-health/callback`.
- Missing refresh token: disconnect and reconnect; the app requests offline access and consent.
- Weight 403 or skipped weight: confirm Google Cloud Data Access and `.env.local` include `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`, then disconnect and reconnect.
- 403 errors: confirm the Google Health API is enabled, the OAuth consent screen includes the required scopes, and your Google account is added as a test user.
- Phone app mismatch: export Google Health rollup CSV. If the rollup export differs from the phone app, the mismatch is upstream/API availability or delay, not the local dashboard table.

Google Health API is new and may still change. If Google changes endpoint, scope, or response details, update the provider adapter rather than dashboard components.
