import { createDatabaseBackup } from "@/lib/database-backup";
import { jsonError, jsonOk, requireAdminJson } from "@/lib/api-response";

export async function POST() {
  const unauthorized = await requireAdminJson();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const backup = createDatabaseBackup();
    return jsonOk({
      filename: backup.filename,
      backupPath: backup.backupPath,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Database backup failed.", 500);
  }
}
