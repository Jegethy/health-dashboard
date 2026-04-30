import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (body?.confirmation !== "DELETE") {
    return NextResponse.json(
      { error: 'Type "DELETE" to clear local dashboard health entries.' },
      { status: 400 },
    );
  }

  const result = await prisma.dailyHealthEntry.deleteMany();
  revalidatePath("/");

  return NextResponse.json({ deletedCount: result.count });
}
