export type ProviderStatus = {
  configured: boolean;
  connected: boolean;
  providerUserId: string | null;
  googleHealthUserId?: string | null;
  legacyFitbitUserId?: string | null;
  displayName: string | null;
  email: string | null;
  scopes: string[];
  configuredScopes: string[];
  requiredScopes: string[];
  missingRequiredScopes: string[];
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncMessage: string | null;
  configError: string | null;
};

export type DailyMetricPatch = {
  date: string;
  weightKg?: number;
  steps?: number;
  caloriesEaten?: number;
  caloriesBurned?: number;
};

export type SyncSummary = {
  provider: string;
  fromDate: string;
  toDate: string;
  createdCount: number;
  updatedCount: number;
  skippedFields: number;
  errorCount: number;
  errors: string[];
  syncLogId?: number;
};

export type HealthDataProvider = {
  providerName: string;
  connectUrl: string;
  getStatus(): Promise<ProviderStatus>;
  syncDailyMetrics(fromDate: string, toDate: string): Promise<SyncSummary>;
};
