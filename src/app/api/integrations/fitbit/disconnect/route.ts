import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { FITBIT_PROVIDER } from "@/lib/integrations/fitbit/config";
import { prisma } from "@/lib/prisma";

export async function POST() {
  await prisma.integrationAccount.deleteMany({
    where: { provider: FITBIT_PROVIDER },
  });

  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
