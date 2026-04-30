process.env.GOOGLE_HEALTH_SYNC_DAYS ??= "14";

import("./sync-google-health").catch((error) => {
  console.error(error instanceof Error ? error.message : "Daily sync failed.");
  process.exitCode = 1;
});
