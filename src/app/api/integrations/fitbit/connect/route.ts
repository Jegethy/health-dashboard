import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  FITBIT_AUTH_URL,
  getFitbitConfig,
  getFitbitConfigError,
} from "@/lib/integrations/fitbit/config";

export async function GET() {
  const config = getFitbitConfig();
  const configError = getFitbitConfigError(config);

  if (configError) {
    return NextResponse.redirect(
      new URL(`/?fitbit=error&message=${encodeURIComponent(configError)}`, config.redirectUri),
    );
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    state,
  });

  const response = NextResponse.redirect(`${FITBIT_AUTH_URL}?${params.toString()}`);
  response.cookies.set("fitbit_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
