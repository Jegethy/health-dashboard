const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.dailyHealthEntry.deleteMany({
    where: { source: "sample" },
  });

  console.log(`Deleted ${result.count} sample entries. Manual, CSV, mixed, and synced entries were kept.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
