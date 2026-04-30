import { loadEnvConfig } from "@next/env";
import { createDatabaseBackup } from "@/lib/database-backup";

loadEnvConfig(process.cwd());

try {
  const backup = createDatabaseBackup();
  console.log(`Database backup created: ${backup.backupPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Database backup failed.");
  process.exitCode = 1;
}
