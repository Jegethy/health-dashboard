import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { parseEntriesCsv } from "@/lib/csv";
import { getEntries, upsertEntry } from "@/lib/entries";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a CSV file to import." }, { status: 400 });
  }

  const csv = await file.text();
  const parsed = parseEntriesCsv(csv);

  if (parsed.entries.length === 0) {
    return NextResponse.json(
      { error: parsed.errors[0] ?? "No valid rows were found." },
      { status: 400 },
    );
  }

  const existingDates = new Set((await getEntries()).map((entry) => entry.date));
  let inserted = 0;
  let updated = 0;

  for (const entry of parsed.entries) {
    if (existingDates.has(entry.date)) {
      updated += 1;
    } else {
      inserted += 1;
      existingDates.add(entry.date);
    }

    await upsertEntry(entry, "csv");
  }

  revalidatePath("/");

  return NextResponse.json({
    inserted,
    updated,
    errors: parsed.errors,
  });
}
