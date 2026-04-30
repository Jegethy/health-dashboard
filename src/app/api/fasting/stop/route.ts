import { jsonError, jsonOk, requireAdminJson, revalidateAppPaths } from "@/lib/api-response";
import { stopActiveFast } from "@/lib/fasting";

export async function POST() {
  const unauthorized = await requireAdminJson();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const entry = await stopActiveFast();
    revalidateFastingPaths();
    return jsonOk({ entry });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not end fast.");
  }
}

function revalidateFastingPaths() {
  revalidateAppPaths(["/fasting", "/admin", "/admin/fasting"]);
}
