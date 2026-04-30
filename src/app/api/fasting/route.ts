import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { createFastingEntry, fastingInputSchema, getFastingEntries } from "@/lib/fasting";

export async function GET() {
  const entries = await getFastingEntries();
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  const parsed = fastingInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid fasting entry." },
      { status: 400 },
    );
  }

  const entry = await createFastingEntry(parsed.data);
  revalidateFastingPaths();

  return NextResponse.json({ entry });
}

function revalidateFastingPaths() {
  revalidatePath("/fasting");
  revalidatePath("/admin");
  revalidatePath("/admin/fasting");
}
