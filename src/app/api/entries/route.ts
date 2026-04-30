import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { upsertEntry } from "@/lib/entries";
import { entryInputSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json();
  const parsed = entryInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid entry." },
      { status: 400 },
    );
  }

  const entry = await upsertEntry(parsed.data);
  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ entry });
}
