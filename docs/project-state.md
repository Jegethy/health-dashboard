# Project State

## Goal

Build a local personal dashboard for tracking weight, movement, and calorie-burn trends over time. The app is for private use on Windows and should stay simple, readable, and easy to extend.

Intermittent fasting is tracked as a separate manual feature with a public read-only dashboard and protected admin management tools.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Recharts
- SQLite
- Prisma
- Zod
- date-fns
- Google Health API OAuth + sync

## Current Scope

The dashboard tracks:

- Weight
- Steps
- Total calories burned
- Manual corrections for the focused metrics
- Completed intermittent fasts, separate from Google Health

The app intentionally does not track:

- Food intake
- Calories eaten
- Hydration or water intake
- Mood
- Notes
- General nutrition
- Calorie deficit/surplus

The database still has legacy `caloriesEaten` and `notes` fields from the early MVP, but they are not part of the product UI.

## Google Health Status

Google Health integration is working and powers sync for:

- `steps`
- `total-calories`
- `weight`, when weigh-in data exists

OAuth tokens are stored encrypted in SQLite. Do not log or expose tokens. Do not delete `IntegrationAccount` rows unless explicitly asked.

Google Health is the only intended live data source.

## Important Pages And Routes

- `/` main dashboard for viewing trends.
- `/fasting` public read-only intermittent fasting dashboard.
- `/login` local admin password login.
- `/admin` protected operational tools and backend controls.
- `/admin/fasting` protected fasting entry management.
- `/api/integrations/google-health/connect`
- `/api/integrations/google-health/callback`
- `/api/integrations/google-health/sync`
- `/api/integrations/google-health/export-rollup`
- `/api/admin/clear-health-entries`
- `/api/admin/clear-and-sync-google-health`
- `/api/export`
- `/api/import`
- `/api/entries`
- `/api/admin/logout`
- `/api/admin/backup-database`
- `/api/fasting`
- `/api/fasting/[id]`
- `/api/fasting/start`
- `/api/fasting/stop`
- `/api/fasting/cancel-active`

## Important Scripts

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:clear-sample`
- `npm run db:clear-health-entries -- --confirm`
- `npm run db:backup`
- `npm run admin:hash-password`
- `npm run sync:daily`
- `npm run sync:google-health`

## Design And Layout

Main dashboard is intentionally clean and read-only:

- Header with `Health Dashboard`
- Navigation: Dashboard, Admin / Data tools
- Four summary cards: latest weight, weight change, average steps, average calories burned
- Charts:
  - Weight over time full width
  - Daily steps and Calories burned below, side by side on desktop
- No Recent entries table on the dashboard
- Footer: `© 2026 Scott Blackmore. All rights reserved.`

Fasting dashboard is also read-only:

- Header with `Health Dashboard`
- Navigation: Dashboard, Fasting, Admin / Data tools
- Title: `Intermittent Fasting`
- Summary cards: latest fast, average fast, longest fast, target hit rate
- Active fasting status banner when a fast is running
- Fasting duration over time chart with a 16-hour target line

Admin page contains operational tools:

- Google Health connection/sync/export controls
- Data coverage details
- Manual correction form
- CSV import/export
- Recent entries data inspection
- Data reset controls
- Link to protected fasting tools
- System status panel with safe local metadata
- Protected database backup button

Admin fasting page contains:

- Start fast now / End fast now controls
- Add fasting entry form
- 16-hour preset and repeat-previous helpers
- Edit/delete completed fasting entries
- Fasting history table

## Known Constraints

- Local-only app with a simple single-user admin login for `/admin`.
- Do not add live integrations beyond Google Health unless explicitly requested.
- Do not use Google Health as a fasting source unless a clear fasting data type becomes available.
- Google Health may not return weight unless weigh-in data exists.
- Google Health does not provide food/calories-eaten in current app scope.
- `total-calories` rollup requests must stay chunked safely.
- SQLite DB and `.env.local` are local/private and ignored by Git.
- `backups/` and `logs/` are ignored by Git.
- `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` live in `.env.local`.
- App remains local/home-server focused. Shared hosting without Node.js, such as NFO shared web hosting, is not a target.

## Things Not To Break

- Google Health OAuth flow.
- Encrypted token storage.
- Admin session cookie security.
- Existing Google Health sync and rollup export.
- Manual correction flow.
- CSV import/export for `date,weightKg,steps,caloriesBurned`.
- Data reset safety confirmation.
- Do not delete user data or OAuth tokens without explicit confirmation.
- Keep the Google Health OAuth callback state-protected and reachable by Google's redirect.
- Keep `/fasting` public/read-only and fasting write routes protected.

## Recent Completed Work

- Migrated from discontinued Fitbit Web API plan to Google Health API.
- Added Google Health sync, OAuth, encrypted tokens, rollup export, and admin tools.
- Cleared dashboard scope to weight, steps, and calories burned only.
- Moved operational tools from dashboard to `/admin`.
- Moved Recent entries from the dashboard to `/admin`.
- Fixed chart layout to avoid blank grid space.
- Added shared footer.
- Removed notes from the visible manual correction and CSV workflow.
- Added local admin login for `/admin` and backend data/action routes.
- Added public read-only fasting dashboard and protected fasting management tools.
- Added database backup support, daily sync script, and Windows Task Scheduler docs.

## Admin Auth

- `/` remains accessible without login.
- `/admin` redirects to `/login?next=/admin` without a valid admin session.
- Admin sessions use a signed HTTP-only cookie.
- API action/data routes return JSON `401` when unauthenticated.
- Google Health OAuth callback remains open to Google's redirect but validates OAuth state.
- Password hashes are generated with `npm run admin:hash-password`.
- Session secrets can be generated with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

## Fasting

- `FastingEntry` stores completed and active fasts: start, optional end, optional calculated duration, target, timestamps.
- Default target is 960 minutes, or 16 hours.
- Duration is recalculated from `startAt` and `endAt` on create/update.
- Active fasts have `startAt` with null `endAt` and null `durationMinutes`.
- `/fasting` is public and read-only.
- `/admin/fasting` is protected by admin login.
- `POST /api/fasting`, `PUT /api/fasting/[id]`, and `DELETE /api/fasting/[id]` require admin session.
- `POST /api/fasting/start`, `POST /api/fasting/stop`, and `POST /api/fasting/cancel-active` require admin session.
- `GET /api/fasting` is public and returns read-only fasting entries.
- Fasting is manual; Google Health is not used for fasting data.
- Active fasts are shown separately and do not affect completed-fast summaries or charts until ended.
- Future automation could add reminders, phone shortcuts, or CSV import/export.

## Maintenance

- `npm run db:backup` creates timestamped SQLite backups in `backups/`.
- `POST /api/admin/backup-database` creates a backup from the protected admin UI.
- `npm run sync:daily` syncs Google Health for the last 14 days without clearing entries.
- `docs/windows-task-scheduler.md` explains how to schedule daily sync on Windows.
- `src/lib/env.ts` centralizes server-side environment status helpers.
- `src/lib/api-response.ts` centralizes small JSON/auth/revalidation helpers for API routes.
- `src/lib/database-backup.ts` centralizes SQLite backup path and copy logic.

## Recommended Next Task

Polish fasting workflow after real use:

- Consider fasting CSV import/export if manual history grows.
- Home Assistant fasting automation is the next likely feature, but should stay separate from Google Health sync.
- Add reminders or phone shortcuts only if they stay local and simple.
- Keep `/fasting` read-only and uncluttered.
