import { format, subDays } from "date-fns";
import { fitbitProvider } from "@/lib/integrations/fitbit/provider";
import { prisma } from "@/lib/prisma";

async function main() {
  const days = Number(process.env.FITBIT_SYNC_DAYS ?? 30);
  const safeDays = Number.isFinite(days) && days > 0 ? Math.min(Math.round(days), 31) : 30;
  const toDate = format(new Date(), "yyyy-MM-dd");
  const fromDate = format(subDays(new Date(), safeDays - 1), "yyyy-MM-dd");
  const summary = await fitbitProvider.syncDailyMetrics(fromDate, toDate);

  console.log(
    [
      `Fitbit sync ${summary.fromDate} to ${summary.toDate}`,
      `Created: ${summary.createdCount}`,
      `Updated: ${summary.updatedCount}`,
      `Skipped fields: ${summary.skippedFields}`,
      `Errors: ${summary.errorCount}`,
    ].join("\n"),
  );

  if (summary.errors.length > 0) {
    console.log(`\nWarnings:\n${summary.errors.join("\n")}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Fitbit sync failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
