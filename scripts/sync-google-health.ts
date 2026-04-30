import { format, subDays } from "date-fns";
import { loadEnvConfig } from "@next/env";
import type { PrismaClient } from "@prisma/client";

let prismaClient: PrismaClient | null = null;

async function main() {
  loadEnvConfig(process.cwd());
  const [{ googleHealthProvider }, { prisma }] = await Promise.all([
    import("@/lib/integrations/google-health/provider"),
    import("@/lib/prisma"),
  ]);
  prismaClient = prisma;
  const days = Number(process.env.GOOGLE_HEALTH_SYNC_DAYS ?? 30);
  const safeDays = Number.isFinite(days) && days > 0 ? Math.min(Math.round(days), 31) : 30;
  const toDate = format(new Date(), "yyyy-MM-dd");
  const fromDate = format(subDays(new Date(), safeDays - 1), "yyyy-MM-dd");
  const summary = await googleHealthProvider.syncDailyMetrics(fromDate, toDate);

  console.log(
    [
      `Google Health sync ${summary.fromDate} to ${summary.toDate}`,
      `Created: ${summary.createdCount}`,
      `Updated: ${summary.updatedCount}`,
      `Skipped fields: ${summary.skippedFields}`,
      `Errors: ${summary.errorCount}`,
      `Sync log: ${summary.syncLogId ?? "-"}`,
    ].join("\n"),
  );

  if (summary.errors.length > 0) {
    console.log(`\nWarnings:\n${summary.errors.join("\n")}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Google Health sync failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient?.$disconnect();
  });
