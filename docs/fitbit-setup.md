# Fitbit Setup

This app supports Fitbit as the first live data provider for local personal use. Your Android Health Sync app can push data into Fitbit, then this dashboard can pull daily summaries from Fitbit.

Fitbit Web API is legacy and should eventually be replaced by a Google Health API provider when that path is practical.

## Register A Fitbit App

1. Go to the Fitbit developer portal: https://dev.fitbit.com/apps
2. Create or register an app for personal/local use.
3. Choose an app type suitable for personal OAuth testing.
4. Add this OAuth redirect URI:

```text
http://127.0.0.1:3000/api/integrations/fitbit/callback
```

5. Save the app and copy the client ID and client secret.

## Scopes

Use these scopes for the first version:

```text
activity weight nutrition profile
```

They are used for:

- `activity`: steps and calories burned.
- `weight`: weight logs.
- `nutrition`: calories eaten if food logging data is available in Fitbit.
- `profile`: basic account details so the dashboard can show which account is connected.

## Local Environment

Create `.env.local` locally and add:

```bash
FITBIT_CLIENT_ID="your-fitbit-client-id"
FITBIT_CLIENT_SECRET="your-fitbit-client-secret"
FITBIT_REDIRECT_URI="http://127.0.0.1:3000/api/integrations/fitbit/callback"
FITBIT_SCOPES="activity weight nutrition profile"
FITBIT_TOKEN_ENCRYPTION_KEY="a-long-random-local-secret"
```

Generate a local encryption key with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Do not commit `.env.local`. The project `.gitignore` excludes local environment files and SQLite data files.

## Connect Fitbit

1. Start the app:

```bash
npm run dev
```

2. Open http://127.0.0.1:3000.
3. In the Integrations section, click Connect Fitbit.
4. Complete the Fitbit OAuth approval screen.
5. You should return to the dashboard with Fitbit connected.

## Sync Data

From the dashboard:

- Click Sync last 7 days, or
- Click Sync last 30 days.

From the command line after OAuth is connected:

```bash
npm run sync:fitbit
```

The script syncs the last 30 days by default. To change the range:

```bash
$env:FITBIT_SYNC_DAYS=14; npm run sync:fitbit
```

This is suitable for a future Windows Task Scheduler task, but the project does not configure Task Scheduler automatically.

## Disconnect Or Reconnect

- Click Disconnect Fitbit to remove stored Fitbit tokens.
- Existing health entries are kept.
- Click Connect Fitbit again to reconnect or switch the Fitbit account.

## Known Limitations

- Fitbit Web API is legacy.
- Nutrition calories are only available if Fitbit has food log data.
- Sync is limited to 31 days per request in the app UI/API to keep calls rate-limit friendly.
- Tokens are encrypted in SQLite using `FITBIT_TOKEN_ENCRYPTION_KEY`; changing that key makes existing stored tokens unreadable, so reconnect Fitbit after changing it.
