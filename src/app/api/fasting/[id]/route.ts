import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { deleteFastingEntry, fastingInputSchema, updateFastingEntry } from "@/lib/fasting";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  const id = await parseId(context);

  if (id == null) {
    return NextResponse.json({ error: "Invalid fasting entry id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = fastingInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid fasting entry." },
      { status: 400 },
    );
  }

  try {
    const entry = await updateFastingEntry(id, parsed.data);
    revalidateFastingPaths();
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "Fasting entry was not found." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  const id = await parseId(context);

  if (id == null) {
    return NextResponse.json({ error: "Invalid fasting entry id." }, { status: 400 });
  }

  try {
    await deleteFastingEntry(id);
    revalidateFastingPaths();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Fasting entry was not found." }, { status: 404 });
  }
}

async function parseId(context: RouteContext) {
  const params = await context.params;
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function revalidateFastingPaths() {
  revalidatePath("/fasting");
  revalidatePath("/admin");
  revalidatePath("/admin/fasting");
}
