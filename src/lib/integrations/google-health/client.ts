import { addSeconds, isBefore, subMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/integrations/token-crypto";
import {
  GOOGLE_HEALTH_API_BASE_URL,
  GOOGLE_HEALTH_PROVIDER,
  GOOGLE_HEALTH_TOKEN_URL,
  getGoogleHealthConfig,
  getGoogleHealthConfigError,
} from "@/lib/integrations/google-health/config";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

export type GoogleHealthIdentity = {
  name?: string;
  healthUserId?: string;
  legacyUserId?: string;
};

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const config = getGoogleHealthConfig();
  const configError = getGoogleHealthConfigError(config);

  if (configError) {
    throw new Error(configError);
  }

  return requestToken({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });
}

export async function googleHealthFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let account = await getConnectedGoogleHealthAccount();

  if (!account) {
    throw new Error("Google Health account is not connected.");
  }

  if (isBefore(account.accessTokenExpiresAt, subMinutes(new Date(), -2))) {
    account = await refreshGoogleHealthAccessToken(account.id);
  }

  const response = await fetch(`${GOOGLE_HEALTH_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${decryptToken(account.accessTokenEncrypted)}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    account = await refreshGoogleHealthAccessToken(account.id);
    const retry = await fetch(`${GOOGLE_HEALTH_API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${decryptToken(account.accessTokenEncrypted)}`,
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });

    if (!retry.ok) {
      throw new Error(await googleHealthErrorMessage(retry));
    }

    return retry.json() as Promise<T>;
  }

  if (!response.ok) {
    throw new Error(await googleHealthErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export async function refreshGoogleHealthAccessToken(accountId: number) {
  const account = await prisma.integrationAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new Error("Google Health account is not connected.");
  }

  const config = getGoogleHealthConfig();
  const token = await requestToken({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: decryptToken(account.refreshTokenEncrypted),
    grant_type: "refresh_token",
  });

  return prisma.integrationAccount.update({
    where: { id: account.id },
    data: {
      accessTokenEncrypted: encryptToken(token.access_token),
      refreshTokenEncrypted: encryptToken(token.refresh_token ?? decryptToken(account.refreshTokenEncrypted)),
      accessTokenExpiresAt: addSeconds(new Date(), token.expires_in),
      tokenType: token.token_type ?? account.tokenType,
      scopes: token.scope ?? account.scopes,
    },
  });
}

export async function storeGoogleHealthTokens(token: GoogleTokenResponse) {
  if (!token.refresh_token) {
    throw new Error("Google did not return a refresh token. Try disconnecting and connecting again with consent.");
  }

  const config = getGoogleHealthConfig();
  const identity = await fetchGoogleHealthIdentity(token.access_token).catch(() => null);
  const providerUserId = identity?.healthUserId ?? identity?.name ?? "me";
  const scopesToStore = token.scope ?? config.scopes.join(" ");

  return prisma.integrationAccount.upsert({
    where: {
      provider_providerUserId: {
        provider: GOOGLE_HEALTH_PROVIDER,
        providerUserId,
      },
    },
    update: {
      googleHealthUserId: identity?.healthUserId ?? null,
      legacyFitbitUserId: identity?.legacyUserId ?? null,
      displayName: identity?.healthUserId ?? null,
      scopes: scopesToStore,
      accessTokenEncrypted: encryptToken(token.access_token),
      refreshTokenEncrypted: encryptToken(token.refresh_token),
      accessTokenExpiresAt: addSeconds(new Date(), token.expires_in),
      tokenType: token.token_type ?? null,
      connectedAt: new Date(),
    },
    create: {
      provider: GOOGLE_HEALTH_PROVIDER,
      providerUserId,
      googleHealthUserId: identity?.healthUserId ?? null,
      legacyFitbitUserId: identity?.legacyUserId ?? null,
      displayName: identity?.healthUserId ?? null,
      scopes: scopesToStore,
      accessTokenEncrypted: encryptToken(token.access_token),
      refreshTokenEncrypted: encryptToken(token.refresh_token),
      accessTokenExpiresAt: addSeconds(new Date(), token.expires_in),
      tokenType: token.token_type ?? null,
    },
  });
}

export async function getConnectedGoogleHealthAccount() {
  return prisma.integrationAccount.findFirst({
    where: { provider: GOOGLE_HEALTH_PROVIDER },
    orderBy: { connectedAt: "desc" },
  });
}

async function fetchGoogleHealthIdentity(accessToken: string): Promise<GoogleHealthIdentity> {
  const response = await fetch(`${GOOGLE_HEALTH_API_BASE_URL}/v4/users/me/identity`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await googleHealthErrorMessage(response));
  }

  return response.json();
}

async function requestToken(body: Record<string, string>): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_HEALTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    throw new Error(await googleHealthErrorMessage(response));
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

async function googleHealthErrorMessage(response: Response) {
  const fallback = `Google Health API request failed (${response.status}): ${response.statusText}`;

  try {
    const body = await response.json();
    const message = body.error?.message ?? body.error_description ?? body.error;
    return message ? `Google Health API request failed (${response.status}): ${message}` : fallback;
  } catch {
    return fallback;
  }
}
