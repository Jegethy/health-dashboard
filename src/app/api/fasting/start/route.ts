import { jsonError, jsonOk, requireAdminJson, revalidateAppPaths } from "@/lib/api-response";
import { startActiveFast } from "@/lib/fasting";

export async function POST() {
  const unauthorized = await requireAdminJson();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const entry = await startActiveFast();
    revalidateFastingPaths();
    return jsonOk({ entry });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not start fast.");
  }
}

function revalidateFastingPaths() {
  revalidateAppPaths(["/fasting", "/admin", "/admin/fasting"]);
}
