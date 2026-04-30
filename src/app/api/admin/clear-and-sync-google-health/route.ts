import { format, subDays } from "date-fns";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { getConnectedGoogleHealthAccount } from "@/lib/integrations/google-health/client";
import { googleHealthProvider } from "@/lib/integrations/google-health/provider";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);

  if (body?.confirmation !== "DELETE") {
    return NextResponse.json(
      { error: 'Type "DELETE" to clear local entries and sync Google Health.' },
      { status: 400 },
    );
  }

  const account = await getConnectedGoogleHealthAccount();

  if (!account) {
    return NextResponse.json(
      { error: "Google Health is not connected. No local health entries were deleted." },
      { status: 400 },
    );
  }

  const deleteResult = await prisma.dailyHealthEntry.deleteMany();
  const toDate = format(new Date(), "yyyy-MM-dd");
  const fromDate = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const syncSummary = await googleHealthProvider.syncDailyMetrics(fromDate, toDate);

  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({
    deletedCount: deleteResult.count,
    ...syncSummary,
  });
}
