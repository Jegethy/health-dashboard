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
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "DailyHealthEntry_date_key"
    ON "DailyHealthEntry"("date");
  `);

  console.log("SQLite database is ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
