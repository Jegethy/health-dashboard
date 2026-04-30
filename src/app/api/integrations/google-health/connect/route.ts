import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  GOOGLE_HEALTH_AUTH_URL,
  getGoogleHealthConfig,
  getGoogleHealthConfigError,
} from "@/lib/integrations/google-health/config";

export async function GET() {
  const config = getGoogleHealthConfig();
  const configError = getGoogleHealthConfigError(config);

  if (configError) {
    return NextResponse.redirect(
      new URL(`/?integration=error&message=${encodeURIComponent(configError)}#integrations`, config.redirectUri),
    );
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });

  const response = NextResponse.redirect(`${GOOGLE_HEALTH_AUTH_URL}?${params.toString()}`);
  response.cookies.set("google_health_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
