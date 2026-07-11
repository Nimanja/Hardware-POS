import { api } from './api';
import type { Session } from './auth';
import type { DiscountType } from './cart';

/** Seeded dev branch/register (the app targets the demo tenant). */
export const DEV_BRANCH_ID = 'brn_dev';
export const DEV_REGISTER_ID = 'reg_dev';

/**
 * The offline demo session uses a `mock.*` token and cannot reach the API. Real
 * logins (email/PIN) issue a JWT. Screens that read live data should gate on this.
 */
export function isMockSession(session: Session): boolean {
  return session.token.startsWith('mock.');
}

function auth(session: Session): { token: string; tenantId: string } {
  return { token: session.token, tenantId: session.user.tenantId };
}

export type PaymentMethodCode =
  | 'CASH'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'QR_PAYMENT'
  | 'CHECK'
  | 'STORE_CREDIT'
  | 'OTHER';

export interface SaleItemPayload {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discountType?: DiscountType;
  discountValue?: number;
  discountReason?: string;
  approvalToken?: string;
}

export interface SalePaymentPayload {
  method: PaymentMethodCode;
  amount: number;
  reference?: string;
}

export interface CompleteSaleDto {
  branchId: string;
  registerId?: string;
  customerId?: string;
  items: SaleItemPayload[];
  payments: SalePaymentPayload[];
  orderDiscountType?: DiscountType;
  orderDiscountValue?: number;
  orderDiscountReason?: string;
  orderApprovalToken?: string;
}

export interface CompletedSale {
  id: string;
  saleNumber: string;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  quickbooksDocumentType: string | null;
  syncStatus: string;
  /** True for the offline demo (no real sale persisted). */
  demo: boolean;
}

interface ApiSale {
  id: string;
  saleNumber: string;
  total: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  paymentStatus: string;
  quickbooksDocumentType: string | null;
  syncStatus: string;
}

function paymentStatusFor(total: number, paid: number): string {
  if (paid <= 0) return 'UNPAID';
  return paid >= total ? 'PAID' : 'PARTIAL';
}

/**
 * Complete a sale. With a real session this calls POST /sales/complete. In the
 * offline demo session it simulates a completed sale so the flow is testable.
 */
export async function completeSale(
  session: Session,
  dto: CompleteSaleDto,
  totals: { total: number },
): Promise<CompletedSale> {
  const paidAmount = Math.round(dto.payments.reduce((s, p) => s + p.amount, 0) * 100) / 100;

  if (isMockSession(session)) {
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    return {
      id: `demo-${suffix}`,
      saleNumber: `S-DEMO-${suffix}`,
      total: totals.total,
      paidAmount,
      balanceAmount: Math.max(0, Math.round((totals.total - paidAmount) * 100) / 100),
      paymentStatus: paymentStatusFor(totals.total, paidAmount),
      quickbooksDocumentType: paidAmount >= totals.total ? 'SALES_RECEIPT' : 'INVOICE',
      syncStatus: 'PENDING',
      demo: true,
    };
  }

  const sale = await api.post<ApiSale>('/sales/complete', dto, auth(session));
  return {
    id: sale.id,
    saleNumber: sale.saleNumber,
    total: Number(sale.total),
    paidAmount: Number(sale.paidAmount),
    balanceAmount: Number(sale.balanceAmount),
    paymentStatus: sale.paymentStatus,
    quickbooksDocumentType: sale.quickbooksDocumentType,
    syncStatus: sale.syncStatus,
    demo: false,
  };
}

// ── Sales history (list + detail) ─────────────────────────────────────────────

export type SaleStatusCode = 'DRAFT' | 'COMPLETED' | 'VOIDED' | 'REFUNDED';
export type PaymentStatusCode = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
export type SyncStatusCode = 'NOT_SYNCED' | 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

/** A row in the Sales history list (matches the API `SaleListItem`). */
export interface SaleListItem {
  id: string;
  saleNumber: string;
  status: SaleStatusCode;
  createdAt: string;
  completedAt: string | null;
  customerName: string | null;
  cashierName: string | null;
  itemCount: number;
  subtotal: number;
  totalDiscount: number;
  orderDiscountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatusCode;
  paymentMethods: PaymentMethodCode[];
  quickbooksDocumentType: string | null;
  syncStatus: SyncStatusCode;
}

export interface SalesPage {
  items: SaleListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SalesQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  paymentStatus?: PaymentStatusCode;
  syncStatus?: SyncStatusCode;
  dateFrom?: string;
  dateTo?: string;
}

/** Detailed sale (matches the API `SaleWithRelations`, decimals as strings). */
export interface SaleDetailItem {
  id: string;
  productName: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountAmount: number;
  discountReason: string | null;
  lineSubtotal: number;
  lineTotal: number;
}

export interface SaleDetailPayment {
  id: string;
  method: PaymentMethodCode;
  amount: number;
  reference: string | null;
  syncStatus: SyncStatusCode;
}

export interface SaleDetail {
  id: string;
  saleNumber: string;
  status: SaleStatusCode;
  createdAt: string;
  completedAt: string | null;
  customer: { id: string; name: string } | null;
  subtotal: number;
  totalDiscount: number;
  orderDiscountType: DiscountType | null;
  orderDiscountValue: number | null;
  orderDiscountAmount: number;
  orderDiscountReason: string | null;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatusCode;
  quickbooksDocumentType: string | null;
  quickbooksDocumentId: string | null;
  syncStatus: SyncStatusCode;
  syncError: string | null;
  items: SaleDetailItem[];
  payments: SaleDetailPayment[];
}

interface ApiSaleDetail {
  id: string;
  saleNumber: string;
  status: SaleStatusCode;
  createdAt: string;
  completedAt: string | null;
  customer: { id: string; name: string } | null;
  subtotal: string | number;
  totalDiscount: string | number;
  orderDiscountType: DiscountType | null;
  orderDiscountValue: string | number | null;
  orderDiscountAmount: string | number;
  orderDiscountReason: string | null;
  taxAmount: string | number;
  total: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  paymentStatus: PaymentStatusCode;
  quickbooksDocumentType: string | null;
  quickbooksDocumentId: string | null;
  syncStatus: SyncStatusCode;
  syncError: string | null;
  items: Array<{
    id: string;
    productName: string;
    sku: string | null;
    unitPrice: string | number;
    quantity: string | number;
    discountType: DiscountType | null;
    discountValue: string | number | null;
    discountAmount: string | number;
    discountReason: string | null;
    lineSubtotal: string | number;
    lineTotal: string | number;
  }>;
  payments: Array<{
    id: string;
    method: PaymentMethodCode;
    amount: string | number;
    reference: string | null;
    syncStatus: SyncStatusCode;
  }>;
}

function buildQuery(q: SalesQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(q.page ?? 1));
  params.set('pageSize', String(q.pageSize ?? 25));
  if (q.search) params.set('search', q.search);
  if (q.paymentStatus) params.set('paymentStatus', q.paymentStatus);
  if (q.syncStatus) params.set('syncStatus', q.syncStatus);
  if (q.dateFrom) params.set('dateFrom', q.dateFrom);
  if (q.dateTo) params.set('dateTo', q.dateTo);
  return params.toString();
}

/** Fetch a page of the sales history. Returns an empty page for the offline demo. */
export async function fetchSales(session: Session, query: SalesQuery = {}): Promise<SalesPage> {
  if (isMockSession(session)) {
    return { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 25 };
  }
  return api.get<SalesPage>(`/sales?${buildQuery(query)}`, auth(session));
}

/** Fetch a single sale with items and payments. */
export async function fetchSale(session: Session, id: string): Promise<SaleDetail> {
  const s = await api.get<ApiSaleDetail>(`/sales/${id}`, auth(session));
  return {
    id: s.id,
    saleNumber: s.saleNumber,
    status: s.status,
    createdAt: s.createdAt,
    completedAt: s.completedAt,
    customer: s.customer,
    subtotal: Number(s.subtotal),
    totalDiscount: Number(s.totalDiscount),
    orderDiscountType: s.orderDiscountType,
    orderDiscountValue: s.orderDiscountValue != null ? Number(s.orderDiscountValue) : null,
    orderDiscountAmount: Number(s.orderDiscountAmount),
    orderDiscountReason: s.orderDiscountReason,
    taxAmount: Number(s.taxAmount),
    total: Number(s.total),
    paidAmount: Number(s.paidAmount),
    balanceAmount: Number(s.balanceAmount),
    paymentStatus: s.paymentStatus,
    quickbooksDocumentType: s.quickbooksDocumentType,
    quickbooksDocumentId: s.quickbooksDocumentId,
    syncStatus: s.syncStatus,
    syncError: s.syncError,
    items: s.items.map((it) => ({
      id: it.id,
      productName: it.productName,
      sku: it.sku,
      unitPrice: Number(it.unitPrice),
      quantity: Number(it.quantity),
      discountType: it.discountType,
      discountValue: it.discountValue != null ? Number(it.discountValue) : null,
      discountAmount: Number(it.discountAmount),
      discountReason: it.discountReason,
      lineSubtotal: Number(it.lineSubtotal),
      lineTotal: Number(it.lineTotal),
    })),
    payments: s.payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: Number(p.amount),
      reference: p.reference,
      syncStatus: p.syncStatus,
    })),
  };
}

/** Retry the QuickBooks push for a completed sale. */
export async function retrySaleSync(session: Session, id: string): Promise<void> {
  await api.post(`/sales/${id}/retry-sync`, undefined, auth(session));
}
