import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { differenceInCalendarDays } from "date-fns";
import { parseDateInput } from "@/lib/dates";
import { fitbitProvider } from "@/lib/integrations/fitbit/provider";

const syncSchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = syncSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Use fromDate and toDate in YYYY-MM-DD format." }, { status: 400 });
  }

  const days = differenceInCalendarDays(
    parseDateInput(parsed.data.toDate),
    parseDateInput(parsed.data.fromDate),
  );

  if (days < 0) {
    return NextResponse.json({ error: "toDate must be on or after fromDate." }, { status: 400 });
  }

  if (days > 31) {
    return NextResponse.json({ error: "Fitbit sync is limited to 31 days per request." }, { status: 400 });
  }

  try {
    const summary = await fitbitProvider.syncDailyMetrics(parsed.data.fromDate, parsed.data.toDate);
    revalidatePath("/");

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fitbit sync failed." },
      { status: 500 },
    );
  }
}
