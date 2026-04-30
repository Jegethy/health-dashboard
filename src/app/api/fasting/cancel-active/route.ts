import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { cancelActiveFast } from "@/lib/fasting";

export async function POST() {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    await cancelActiveFast();
    revalidateFastingPaths();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not cancel active fast." },
      { status: 400 },
    );
  }
}

function revalidateFastingPaths() {
  revalidatePath("/fasting");
  revalidatePath("/admin");
  revalidatePath("/admin/fasting");
}
