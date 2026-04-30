import fs from "fs";
import path from "path";

export type DatabaseBackupResult = {
  sourcePath: string;
  backupPath: string;
  filename: string;
};

export function createDatabaseBackup(): DatabaseBackupResult {
  const sourcePath = getSqliteDatabasePath();

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`SQLite database was not found at ${sourcePath}.`);
  }

  const backupsDir = getBackupsDirectory();
  fs.mkdirSync(backupsDir, { recursive: true });

  const filename = `health-dashboard-${formatBackupTimestamp(new Date())}.db`;
  const backupPath = path.join(backupsDir, filename);
  fs.copyFileSync(sourcePath, backupPath);

  return {
    sourcePath,
    backupPath,
    filename,
  };
}

export function backupsDirectoryExists() {
  return fs.existsSync(getBackupsDirectory());
}

export function getBackupsDirectory() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), "backups");
}

function getSqliteDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL?.trim() || "file:./dev.db";

  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Only local SQLite file DATABASE_URL values can be backed up.");
  }

  const filePath = databaseUrl.slice("file:".length);

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), "prisma", filePath);
}

function formatBackupTimestamp(date: Date) {
  return date
    .toISOString()
    .replaceAll(":", "")
    .replaceAll("-", "")
    .replace(".", "-")
    .slice(0, 15);
}
