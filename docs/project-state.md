# Project State

## Goal

Build a local personal dashboard for tracking weight, movement, and calorie-burn trends over time. The app is for private use on Windows and should stay simple, readable, and easy to extend.

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
- `/login` local admin password login.
- `/admin` protected operational tools and backend controls.
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

## Important Scripts

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:clear-sample`
- `npm run db:clear-health-entries -- --confirm`
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

Admin page contains operational tools:

- Google Health connection/sync/export controls
- Data coverage details
- Manual correction form
- CSV import/export
- Recent entries data inspection
- Data reset controls

## Known Constraints

- Local-only app with a simple single-user admin login for `/admin`.
- Do not add live integrations beyond Google Health unless explicitly requested.
- Google Health may not return weight unless weigh-in data exists.
- Google Health does not provide food/calories-eaten in current app scope.
- `total-calories` rollup requests must stay chunked safely.
- SQLite DB and `.env.local` are local/private and ignored by Git.
- `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` live in `.env.local`.

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

## Admin Auth

- `/` remains accessible without login.
- `/admin` redirects to `/login?next=/admin` without a valid admin session.
- Admin sessions use a signed HTTP-only cookie.
- API action/data routes return JSON `401` when unauthenticated.
- Google Health OAuth callback remains open to Google's redirect but validates OAuth state.
- Password hashes are generated with `npm run admin:hash-password`.
- Session secrets can be generated with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

## Recommended Next Task

Improve chart readability and custom tooltips:

- Format dates clearly in tooltips.
- Format large numbers with separators.
- Show units: kg, steps, kcal.
- Improve axis tick density for 30- and 90-day ranges.
- Keep the visual design quiet and dashboard-focused.
