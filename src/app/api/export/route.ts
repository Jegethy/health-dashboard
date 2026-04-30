import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { entriesToCsv } from "@/lib/csv";
import { getEntries } from "@/lib/entries";

export async function GET() {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  const entries = await getEntries();
  const csv = entriesToCsv(entries);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="health-dashboard-entries.csv"',
    },
  });
}
