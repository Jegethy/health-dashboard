export const FITBIT_PROVIDER = "fitbit";
export const FITBIT_AUTH_URL = "https://www.fitbit.com/oauth2/authorize";
export const FITBIT_TOKEN_URL = "https://api.fitbit.com/oauth2/token";
export const FITBIT_API_BASE_URL = "https://api.fitbit.com";
export const DEFAULT_FITBIT_SCOPES = "activity weight nutrition profile";

export type FitbitConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  encryptionKey: string;
};

export function getFitbitConfig(): FitbitConfig {
  const scopes = process.env.FITBIT_SCOPES?.trim() || DEFAULT_FITBIT_SCOPES;

  return {
    clientId: process.env.FITBIT_CLIENT_ID?.trim() ?? "",
    clientSecret: process.env.FITBIT_CLIENT_SECRET?.trim() ?? "",
    redirectUri:
      process.env.FITBIT_REDIRECT_URI?.trim() ??
      "http://127.0.0.1:3000/api/integrations/fitbit/callback",
    scopes: scopes.split(/\s+/).filter(Boolean),
    encryptionKey: process.env.FITBIT_TOKEN_ENCRYPTION_KEY?.trim() ?? "",
  };
}

export function getFitbitConfigError(config = getFitbitConfig()): string | null {
  if (!config.clientId) {
    return "FITBIT_CLIENT_ID is missing.";
  }

  if (!config.clientSecret) {
    return "FITBIT_CLIENT_SECRET is missing.";
  }

  if (!config.redirectUri) {
    return "FITBIT_REDIRECT_URI is missing.";
  }

  if (config.scopes.length === 0) {
    return "FITBIT_SCOPES is missing.";
  }

  if (!config.encryptionKey) {
    return "FITBIT_TOKEN_ENCRYPTION_KEY is missing.";
  }

  return null;
}
