import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { stopActiveFast } from "@/lib/fasting";

export async function POST() {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const entry = await stopActiveFast();
    revalidateFastingPaths();
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not end fast." },
      { status: 400 },
    );
  }
}

function revalidateFastingPaths() {
  revalidatePath("/fasting");
  revalidatePath("/admin");
  revalidatePath("/admin/fasting");
}
