import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { GOOGLE_HEALTH_PROVIDER } from "@/lib/integrations/google-health/config";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  await prisma.integrationAccount.deleteMany({
    where: { provider: GOOGLE_HEALTH_PROVIDER },
  });

  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ ok: true });
}
