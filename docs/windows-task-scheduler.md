# Windows Task Scheduler

Use this to run the local Google Health sync once per day on a Windows PC or home server.

## Recommended Schedule

- Frequency: daily
- Suggested time: 03:00
- The machine must be awake and able to reach Google Health.
- `.env.local` and the SQLite database must remain on this machine.

## Command

Create a basic task that starts a program:

```text
Program/script:
npm

Add arguments:
run sync:daily

Start in:
E:\Documents\GitHub\health-dashboard
```

If Task Scheduler cannot find `npm`, use the full path to `npm.cmd`, for example:

```text
C:\Program Files\nodejs\npm.cmd
```

## Test Manually

From the project directory:

```bash
npm run sync:daily
```

The script syncs the last 14 days, uses stored Google Health OAuth tokens, and does not clear local entries.

## Logs

Task Scheduler shows recent task result codes in the task history. For richer logs, redirect output in the scheduled action to a local ignored folder, for example by running through PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "cd 'E:\Documents\GitHub\health-dashboard'; npm run sync:daily *> logs\sync-daily.log"
```

The `logs/` folder is ignored by Git.

## Notes

- This is for local/home-server use, not shared web hosting.
- NFO-style shared hosting that does not support Node.js is not a target for this app.
- If deployed later, use Node-capable hosting, a VPS, or a home server.
- Do not commit `.env.local`, SQLite database files, backups, or logs.
