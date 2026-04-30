import { jsonError, jsonOk, requireAdminJson, revalidateAppPaths } from "@/lib/api-response";
import { cancelActiveFast } from "@/lib/fasting";

export async function POST() {
  const unauthorized = await requireAdminJson();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    await cancelActiveFast();
    revalidateFastingPaths();
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not cancel active fast.");
  }
}

function revalidateFastingPaths() {
  revalidateAppPaths(["/fasting", "/admin", "/admin/fasting"]);
}
