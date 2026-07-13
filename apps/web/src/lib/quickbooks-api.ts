import { api } from './api';
import type { Session } from './auth';

export interface SyncProductsSummary {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  total: number;
}

/** Trigger a QuickBooks product sync via POST /quickbooks/sync-products. */
export async function syncQuickBooksProducts(session: Session): Promise<SyncProductsSummary> {
  return api.post<SyncProductsSummary>('/quickbooks/sync-products', undefined, {
    token: session.token,
    tenantId: session.user.tenantId,
  });
}
