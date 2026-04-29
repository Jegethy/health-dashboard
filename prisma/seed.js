const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const entries = [
  ["2026-04-15", 96.8, 6120, 2280, 2700, "Started tracking again."],
  ["2026-04-16", 96.5, 7840, 2150, 2820, "Good walk after work."],
  ["2026-04-17", 96.4, 5030, 2400, 2550, ""],
  ["2026-04-18", 96.1, 9100, 2050, 2950, "Meal prep helped."],
  ["2026-04-19", 95.9, 8420, 2210, 2860, ""],
  ["2026-04-20", 95.7, 7010, 2180, 2740, "Rest day."],
  ["2026-04-21", 95.4, 10220, 2090, 3050, "Long walk."],
  ["2026-04-22", 95.3, 6880, 2320, 2680, ""],
  ["2026-04-23", 95.0, 11140, 2120, 3120, "Gym and walk."],
  ["2026-04-24", 94.8, 7340, 2190, 2760, ""],
  ["2026-04-25", 94.9, 6450, 2380, 2600, "Higher calories, still tracked."],
  ["2026-04-26", 94.6, 12050, 2040, 3200, "Strong day."],
];

function toUtcDate(date) {
  return new Date(`${date}T00:00:00.000Z`);
}

async function main() {
  const count = await prisma.dailyHealthEntry.count();

  if (count > 0) {
    console.log("Database already has entries; skipping sample seed.");
    return;
  }

  await prisma.dailyHealthEntry.createMany({
    data: entries.map(
      ([date, weightKg, steps, caloriesEaten, caloriesBurned, notes]) => ({
        date: toUtcDate(date),
        weightKg,
        steps,
        caloriesEaten,
        caloriesBurned,
        notes,
      }),
    ),
  });

  console.log(`Seeded ${entries.length} sample health entries.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
