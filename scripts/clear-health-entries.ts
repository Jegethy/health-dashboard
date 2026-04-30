import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  if (!process.argv.includes("--confirm")) {
    console.log(
      [
        "Refusing to delete local health entries.",
        "Run this command with -- --confirm to delete DailyHealthEntry rows only:",
        "npm run db:clear-health-entries -- --confirm",
        "IntegrationAccount, OAuth tokens, SyncLog rows, and the SQLite file will be kept.",
      ].join("\n"),
    );
    return;
  }

  const result = await prisma.dailyHealthEntry.deleteMany();

  console.log(`Deleted ${result.count} local health entries.`);
  console.log("Google Health connection, OAuth tokens, sync logs, and the SQLite database file were kept.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
