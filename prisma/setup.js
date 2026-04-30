const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DailyHealthEntry" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "date" DATETIME NOT NULL,
      "weightKg" REAL,
      "steps" INTEGER,
      "caloriesEaten" INTEGER,
      "caloriesBurned" INTEGER,
      "notes" TEXT,
      "source" TEXT NOT NULL DEFAULT 'manual',
      "sourceUpdatedAt" DATETIME,
      "syncedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await addColumnIfMissing("DailyHealthEntry", "source", "TEXT NOT NULL DEFAULT 'manual'");
  await addColumnIfMissing("DailyHealthEntry", "sourceUpdatedAt", "DATETIME");
  await addColumnIfMissing("DailyHealthEntry", "syncedAt", "DATETIME");

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "DailyHealthEntry_date_key"
    ON "DailyHealthEntry"("date");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "IntegrationAccount" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "provider" TEXT NOT NULL,
      "providerUserId" TEXT,
      "googleHealthUserId" TEXT,
      "legacyFitbitUserId" TEXT,
      "displayName" TEXT,
      "email" TEXT,
      "scopes" TEXT,
      "accessTokenEncrypted" TEXT NOT NULL,
      "refreshTokenEncrypted" TEXT NOT NULL,
      "accessTokenExpiresAt" DATETIME NOT NULL,
      "tokenType" TEXT,
      "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastSyncAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await addColumnIfMissing("IntegrationAccount", "googleHealthUserId", "TEXT");
  await addColumnIfMissing("IntegrationAccount", "legacyFitbitUserId", "TEXT");

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationAccount_provider_providerUserId_key"
    ON "IntegrationAccount"("provider", "providerUserId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "IntegrationAccount_provider_idx"
    ON "IntegrationAccount"("provider");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SyncLog" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "provider" TEXT NOT NULL,
      "startedAt" DATETIME NOT NULL,
      "finishedAt" DATETIME,
      "status" TEXT NOT NULL,
      "message" TEXT,
      "fromDate" DATETIME,
      "toDate" DATETIME,
      "createdCount" INTEGER NOT NULL DEFAULT 0,
      "updatedCount" INTEGER NOT NULL DEFAULT 0,
      "errorCount" INTEGER NOT NULL DEFAULT 0
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "FastingEntry" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "startAt" DATETIME NOT NULL,
      "endAt" DATETIME,
      "durationMinutes" INTEGER,
      "targetMinutes" INTEGER NOT NULL DEFAULT 960,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await rebuildFastingEntryIfNeeded();

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "FastingEntry_endAt_idx"
    ON "FastingEntry"("endAt");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "FastingEntry_single_active_idx"
    ON "FastingEntry"((1))
    WHERE "endAt" IS NULL;
  `);

  console.log("SQLite database is ready.");
}

async function addColumnIfMissing(tableName, columnName, definition) {
  const columns = await prisma.$queryRawUnsafe(`PRAGMA table_info("${tableName}")`);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${definition}`,
    );
  }
}

async function rebuildFastingEntryIfNeeded() {
  const columns = await prisma.$queryRawUnsafe(`PRAGMA table_info("FastingEntry")`);
  const endAt = columns.find((column) => column.name === "endAt");
  const durationMinutes = columns.find((column) => column.name === "durationMinutes");
  const targetMinutes = columns.find((column) => column.name === "targetMinutes");
  const targetDefault = String(targetMinutes?.dflt_value ?? "");
  const needsRebuild =
    endAt?.notnull === 1 ||
    durationMinutes?.notnull === 1 ||
    targetDefault.includes("1080");

  if (!needsRebuild) {
    return;
  }

  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "FastingEntry_endAt_idx";`);
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "FastingEntry_single_active_idx";`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "FastingEntry" RENAME TO "FastingEntry_old";`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "FastingEntry" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "startAt" DATETIME NOT NULL,
      "endAt" DATETIME,
      "durationMinutes" INTEGER,
      "targetMinutes" INTEGER NOT NULL DEFAULT 960,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    INSERT INTO "FastingEntry" (
      "id", "startAt", "endAt", "durationMinutes", "targetMinutes", "createdAt", "updatedAt"
    )
    SELECT "id", "startAt", "endAt", "durationMinutes", "targetMinutes", "createdAt", "updatedAt"
    FROM "FastingEntry_old";
  `);
  await prisma.$executeRawUnsafe(`DROP TABLE "FastingEntry_old";`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
