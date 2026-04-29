import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeCodeForTokens, storeFitbitTokens } from "@/lib/integrations/fitbit/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("fitbit_oauth_state")?.value;

  if (error) {
    return redirectWithMessage(baseUrl, "error", `Fitbit authorization failed: ${error}`);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithMessage(baseUrl, "error", "Fitbit OAuth state did not match.");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeFitbitTokens(tokens);
    const response = redirectWithMessage(baseUrl, "success", "Fitbit connected.");
    response.cookies.delete("fitbit_oauth_state");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not connect Fitbit.";
    return redirectWithMessage(baseUrl, "error", message);
  }
}

function redirectWithMessage(baseUrl: string, status: "success" | "error", message: string) {
  return NextResponse.redirect(
    `${baseUrl}/?fitbit=${status}&message=${encodeURIComponent(message)}#integrations`,
  );
}
