import { api } from './api';
import type { Session } from './auth';
import { isMockSession } from './sales';

export type CustomerType = 'WALK_IN' | 'RETAIL' | 'CONTRACTOR' | 'CREDIT' | 'DEALER';
export type CustomerSyncStatus = 'NOT_SYNCED' | 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  WALK_IN: 'Walk-in',
  RETAIL: 'Retail',
  CONTRACTOR: 'Contractor',
  CREDIT: 'Credit customer',
  DEALER: 'Dealer',
};

export interface ManagedCustomer {
  id: string;
  name: string;
  companyName: string | null;
  customerType: CustomerType;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  taxNumber: string | null;
  creditAllowed: boolean;
  creditLimit: number | null;
  notes: string | null;
  isActive: boolean;
  quickbooksCustomerId: string | null;
  syncStatus: CustomerSyncStatus;
}

export interface CustomersPage {
  items: ManagedCustomer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  customerType?: CustomerType;
  isActive?: 'true' | 'false';
}

export interface CustomerInput {
  name: string;
  companyName?: string | null;
  customerType?: CustomerType;
  email?: string | null;
  phone?: string | null;
  billingAddress?: string | null;
  taxNumber?: string | null;
  creditAllowed?: boolean;
  creditLimit?: number | null;
  notes?: string | null;
  isActive?: boolean;
}

type ApiCustomer = Omit<ManagedCustomer, 'creditLimit'> & { creditLimit: string | number | null };

function auth(session: Session): { token: string; tenantId: string } {
  return { token: session.token, tenantId: session.user.tenantId };
}

function toManaged(c: ApiCustomer): ManagedCustomer {
  return { ...c, creditLimit: c.creditLimit != null ? Number(c.creditLimit) : null };
}

function buildQuery(q: CustomersQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(q.page ?? 1));
  params.set('pageSize', String(q.pageSize ?? 25));
  if (q.search) params.set('search', q.search);
  if (q.customerType) params.set('customerType', q.customerType);
  if (q.isActive) params.set('isActive', q.isActive);
  return params.toString();
}

export async function fetchCustomers(
  session: Session,
  query: CustomersQuery = {},
): Promise<CustomersPage> {
  if (isMockSession(session)) {
    return { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 25 };
  }
  const res = await api.get<{ items: ApiCustomer[]; total: number; page: number; pageSize: number }>(
    `/customers?${buildQuery(query)}`,
    auth(session),
  );
  return { ...res, items: res.items.map(toManaged) };
}

export async function fetchCustomer(session: Session, id: string): Promise<ManagedCustomer> {
  return toManaged(await api.get<ApiCustomer>(`/customers/${id}`, auth(session)));
}

export async function createCustomer(
  session: Session,
  input: CustomerInput,
): Promise<ManagedCustomer> {
  return toManaged(await api.post<ApiCustomer>('/customers', input, auth(session)));
}

export async function updateCustomer(
  session: Session,
  id: string,
  input: Partial<CustomerInput>,
): Promise<ManagedCustomer> {
  return toManaged(await api.patch<ApiCustomer>(`/customers/${id}`, input, auth(session)));
}

export async function syncCustomerToQuickBooks(
  session: Session,
  id: string,
): Promise<ManagedCustomer> {
  return toManaged(
    await api.post<ApiCustomer>(`/customers/${id}/sync-to-quickbooks`, undefined, auth(session)),
  );
}
