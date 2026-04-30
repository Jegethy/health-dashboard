export type ConfigStatus = {
  configured: boolean;
  missing: string[];
};

export function envValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function requiredEnvStatus(names: string[]): ConfigStatus {
  const missing = names.filter((name) => !envValue(name));

  return {
    configured: missing.length === 0,
    missing,
  };
}

export function getAdminAuthConfigStatus() {
  return requiredEnvStatus(["ADMIN_PASSWORD_HASH", "ADMIN_SESSION_SECRET"]);
}

export function getIntegrationTokenConfigStatus() {
  return requiredEnvStatus(["INTEGRATION_TOKEN_ENCRYPTION_KEY"]);
}

export function isEnvFlagEnabled(name: string) {
  return ["1", "true", "yes", "on"].includes(envValue(name).toLowerCase());
}
