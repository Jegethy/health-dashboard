import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  storeGoogleHealthTokens,
} from "@/lib/integrations/google-health/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_health_oauth_state")?.value;

  if (error) {
    return redirectWithMessage(baseUrl, "error", `Google Health authorization failed: ${error}`);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithMessage(baseUrl, "error", "Google Health OAuth state did not match.");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeGoogleHealthTokens(tokens);
    const response = redirectWithMessage(baseUrl, "success", "Google Health connected.");
    response.cookies.delete("google_health_oauth_state");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not connect Google Health.";
    return redirectWithMessage(baseUrl, "error", message);
  }
}

function redirectWithMessage(baseUrl: string, status: "success" | "error", message: string) {
  return NextResponse.redirect(
    `${baseUrl}/?integration=${status}&message=${encodeURIComponent(message)}#integrations`,
  );
}
