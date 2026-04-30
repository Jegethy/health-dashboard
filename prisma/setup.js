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

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
