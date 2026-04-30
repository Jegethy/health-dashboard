import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { GOOGLE_HEALTH_PROVIDER } from "@/lib/integrations/google-health/config";
import { prisma } from "@/lib/prisma";

export async function POST() {
  await prisma.integrationAccount.deleteMany({
    where: { provider: GOOGLE_HEALTH_PROVIDER },
  });

  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
