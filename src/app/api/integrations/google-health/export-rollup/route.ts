import { NextResponse } from "next/server";
import { z } from "zod";
import { differenceInCalendarDays } from "date-fns";
import { requireAdminApi } from "@/lib/admin-auth";
import { parseDateInput } from "@/lib/dates";
import { getConnectedGoogleHealthAccount } from "@/lib/integrations/google-health/client";
import { fetchGoogleHealthRollupRows } from "@/lib/integrations/google-health/rollup";

const querySchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const headers = [
  "date",
  "googleHealthSteps",
  "googleHealthTotalCaloriesBurned",
  "googleHealthWeightKg",
  "stepsRawFields",
  "caloriesRawFields",
  "weightRawFields",
  "warnings",
];

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    fromDate: url.searchParams.get("fromDate"),
    toDate: url.searchParams.get("toDate"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Use fromDate and toDate query params in YYYY-MM-DD format." },
      { status: 400 },
    );
  }

  const days = differenceInCalendarDays(
    parseDateInput(parsed.data.toDate),
    parseDateInput(parsed.data.fromDate),
  );

  if (days < 0) {
    return NextResponse.json({ error: "toDate must be on or after fromDate." }, { status: 400 });
  }

  if (days > 89) {
    return NextResponse.json({ error: "Export range is limited to 90 calendar days." }, { status: 400 });
  }

  const account = await getConnectedGoogleHealthAccount();

  if (!account) {
    return NextResponse.json({ error: "Google Health is not connected." }, { status: 400 });
  }

  const { rows, warnings } = await fetchGoogleHealthRollupRows(parsed.data.fromDate, parsed.data.toDate);
  const csv = [
    headers.join(","),
    ...rows.map((row, index) =>
      [
        row.date,
        row.googleHealthSteps,
        row.googleHealthTotalCaloriesBurned,
        row.googleHealthWeightKg == null ? null : Number(row.googleHealthWeightKg.toFixed(3)),
        row.stepsRawFields,
        row.caloriesRawFields,
        row.weightRawFields,
        [...row.warnings, ...(index === 0 ? warnings : [])].join(" | "),
      ]
        .map(formatCsvCell)
        .join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="google-health-rollup-${parsed.data.fromDate}-to-${parsed.data.toDate}.csv"`,
    },
  });
}

function formatCsvCell(value: string | number | null): string {
  if (value == null) {
    return "";
  }

  const stringValue = String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}
