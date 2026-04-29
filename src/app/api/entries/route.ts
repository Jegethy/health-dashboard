import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { upsertEntry } from "@/lib/entries";
import { entryInputSchema } from "@/lib/validation";

export async function POST(request: Request) {
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

  return NextResponse.json({ entry });
}
