import { addSeconds, isBefore, subMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  FITBIT_API_BASE_URL,
  FITBIT_PROVIDER,
  FITBIT_TOKEN_URL,
  getFitbitConfig,
  getFitbitConfigError,
} from "@/lib/integrations/fitbit/config";
import { decryptToken, encryptToken } from "@/lib/integrations/fitbit/crypto";

type FitbitTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
  user_id?: string;
};

type FitbitApiError = {
  errors?: Array<{ message?: string; errorType?: string }>;
};

export async function exchangeCodeForTokens(code: string): Promise<FitbitTokenResponse> {
  const config = getFitbitConfig();
  const configError = getFitbitConfigError(config);

  if (configError) {
    throw new Error(configError);
  }

  return requestToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
  });
}

export async function refreshFitbitAccessToken(accountId: number) {
  const account = await prisma.integrationAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new Error("Fitbit account is not connected.");
  }

  const token = await requestToken({
    grant_type: "refresh_token",
    refresh_token: decryptToken(account.refreshTokenEncrypted),
  });

  return prisma.integrationAccount.update({
    where: { id: account.id },
    data: {
      accessTokenEncrypted: encryptToken(token.access_token),
      refreshTokenEncrypted: encryptToken(token.refresh_token),
      accessTokenExpiresAt: addSeconds(new Date(), token.expires_in),
      tokenType: token.token_type ?? account.tokenType,
      scopes: token.scope ?? account.scopes,
    },
  });
}

export async function fitbitFetch<T>(path: string): Promise<T> {
  let account = await getConnectedFitbitAccount();

  if (!account) {
    throw new Error("Fitbit account is not connected.");
  }

  if (isBefore(account.accessTokenExpiresAt, subMinutes(new Date(), -2))) {
    account = await refreshFitbitAccessToken(account.id);
  }

  const response = await fetch(`${FITBIT_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${decryptToken(account.accessTokenEncrypted)}`,
      Accept: "application/json",
      "Accept-Language": "en_GB",
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    account = await refreshFitbitAccessToken(account.id);
    const retry = await fetch(`${FITBIT_API_BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${decryptToken(account.accessTokenEncrypted)}`,
        Accept: "application/json",
        "Accept-Language": "en_GB",
      },
      cache: "no-store",
    });

    if (!retry.ok) {
      throw new Error(await fitbitErrorMessage(retry));
    }

    return retry.json() as Promise<T>;
  }

  if (response.status === 429) {
    const reset = response.headers.get("fitbit-rate-limit-reset");
    throw new Error(`Fitbit rate limit reached. Try again in ${reset ?? "a few"} seconds.`);
  }

  if (!response.ok) {
    throw new Error(await fitbitErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export async function storeFitbitTokens(token: FitbitTokenResponse) {
  const profile = await fetchFitbitProfile(token.access_token).catch(() => null);
  const providerUserId = token.user_id ?? profile?.user?.encodedId ?? "me";

  return prisma.integrationAccount.upsert({
    where: {
      provider_providerUserId: {
        provider: FITBIT_PROVIDER,
        providerUserId,
      },
    },
    update: {
      displayName: profile?.user?.displayName ?? null,
      email: profile?.user?.email ?? null,
      scopes: token.scope ?? null,
      accessTokenEncrypted: encryptToken(token.access_token),
      refreshTokenEncrypted: encryptToken(token.refresh_token),
      accessTokenExpiresAt: addSeconds(new Date(), token.expires_in),
      tokenType: token.token_type ?? null,
      connectedAt: new Date(),
    },
    create: {
      provider: FITBIT_PROVIDER,
      providerUserId,
      displayName: profile?.user?.displayName ?? null,
      email: profile?.user?.email ?? null,
      scopes: token.scope ?? null,
      accessTokenEncrypted: encryptToken(token.access_token),
      refreshTokenEncrypted: encryptToken(token.refresh_token),
      accessTokenExpiresAt: addSeconds(new Date(), token.expires_in),
      tokenType: token.token_type ?? null,
    },
  });
}

export async function getConnectedFitbitAccount() {
  return prisma.integrationAccount.findFirst({
    where: { provider: FITBIT_PROVIDER },
    orderBy: { connectedAt: "desc" },
  });
}

async function requestToken(body: Record<string, string>): Promise<FitbitTokenResponse> {
  const config = getFitbitConfig();
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(FITBIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    throw new Error(await fitbitErrorMessage(response));
  }

  return response.json() as Promise<FitbitTokenResponse>;
}

async function fetchFitbitProfile(accessToken: string): Promise<{
  user?: { encodedId?: string; displayName?: string; email?: string };
}> {
  const response = await fetch(`${FITBIT_API_BASE_URL}/1/user/-/profile.json`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await fitbitErrorMessage(response));
  }

  return response.json();
}

async function fitbitErrorMessage(response: Response) {
  let details = "";

  try {
    const body = (await response.json()) as FitbitApiError;
    details = body.errors?.map((error) => error.message ?? error.errorType).filter(Boolean).join("; ") ?? "";
  } catch {
    details = await response.text().catch(() => "");
  }

  return `Fitbit API request failed (${response.status}): ${details || response.statusText}`;
}
