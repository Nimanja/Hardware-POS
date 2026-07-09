/**
 * Contracts for the QuickBooks Online integration. The concrete provider
 * (OAuth 2.0 + Accounting API) is intentionally NOT implemented yet — these
 * interfaces define the surface the rest of the app will depend on.
 */

export interface QuickBooksConnectionStatus {
  connected: boolean;
  realmId: string | null;
  environment: string | null;
  tokenExpiresAt: string | null;
}

export interface QuickBooksAuthUrl {
  /** URL to redirect the admin to for the QBO consent screen. */
  url: string;
}

export interface QuickBooksCallbackResult {
  connected: boolean;
  realmId: string;
}

/**
 * Port implemented later by the real QuickBooks client. Kept here so services
 * can be wired against the abstraction rather than a concrete SDK.
 */
export interface QuickBooksPort {
  getAuthorizationUrl(tenantId: string): Promise<QuickBooksAuthUrl>;
  handleCallback(tenantId: string, code: string, realmId: string): Promise<QuickBooksCallbackResult>;
  getConnectionStatus(tenantId: string): Promise<QuickBooksConnectionStatus>;
}
