export const GOOGLE_HEALTH_PROVIDER = "google_health";
export const GOOGLE_HEALTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_HEALTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_HEALTH_API_BASE_URL = "https://health.googleapis.com";
export const GOOGLE_HEALTH_ACTIVITY_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly";
export const GOOGLE_HEALTH_MEASUREMENTS_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly";
export const GOOGLE_HEALTH_PROFILE_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.profile.readonly";
export const REQUIRED_GOOGLE_HEALTH_SYNC_SCOPES = [
  GOOGLE_HEALTH_ACTIVITY_SCOPE,
  GOOGLE_HEALTH_MEASUREMENTS_SCOPE,
] as const;
export const RECOMMENDED_GOOGLE_HEALTH_SCOPES = [
  GOOGLE_HEALTH_ACTIVITY_SCOPE,
  GOOGLE_HEALTH_MEASUREMENTS_SCOPE,
  GOOGLE_HEALTH_PROFILE_SCOPE,
] as const;
export const DEFAULT_GOOGLE_HEALTH_SCOPES = RECOMMENDED_GOOGLE_HEALTH_SCOPES.join(" ");

export type GoogleHealthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  encryptionKey: string;
};

export function getGoogleHealthConfig(): GoogleHealthConfig {
  const scopes = process.env.GOOGLE_HEALTH_SCOPES?.trim() || DEFAULT_GOOGLE_HEALTH_SCOPES;

  return {
    clientId: process.env.GOOGLE_HEALTH_CLIENT_ID?.trim() ?? "",
    clientSecret: process.env.GOOGLE_HEALTH_CLIENT_SECRET?.trim() ?? "",
    redirectUri:
      process.env.GOOGLE_HEALTH_REDIRECT_URI?.trim() ??
      "http://127.0.0.1:3000/api/integrations/google-health/callback",
    scopes: scopes.split(/\s+/).filter(Boolean),
    encryptionKey: process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY?.trim() ?? "",
  };
}

export function getGoogleHealthConfigError(config = getGoogleHealthConfig()): string | null {
  if (!config.clientId) {
    return "GOOGLE_HEALTH_CLIENT_ID is missing.";
  }

  if (!config.clientSecret) {
    return "GOOGLE_HEALTH_CLIENT_SECRET is missing.";
  }

  if (!config.redirectUri) {
    return "GOOGLE_HEALTH_REDIRECT_URI is missing.";
  }

  if (config.scopes.length === 0) {
    return "GOOGLE_HEALTH_SCOPES is missing.";
  }

  if (!config.encryptionKey) {
    return "INTEGRATION_TOKEN_ENCRYPTION_KEY is missing.";
  }

  return null;
}

export function getMissingRequiredGoogleHealthScopes(grantedScopes: string[]) {
  return REQUIRED_GOOGLE_HEALTH_SYNC_SCOPES.filter((scope) => !grantedScopes.includes(scope));
}
