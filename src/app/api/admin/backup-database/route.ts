import { jsonError, jsonOk, requireAdminJson } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const unauthorized = await requireAdminJson();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { createDatabaseBackup } = await import("@/lib/database-backup");
    const backup = createDatabaseBackup();
    return jsonOk({
      filename: backup.filename,
      backupPath: backup.backupPath,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Database backup failed.", 500);
  }
}
