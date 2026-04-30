import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(body: T) {
  return NextResponse.json(body);
}

export async function requireAdminJson() {
  return requireAdminApi();
}

export function revalidateAppPaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}
