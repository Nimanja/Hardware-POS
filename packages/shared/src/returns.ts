/**
 * Shared return / refund vocabulary.
 *
 * The Prisma schema (packages/database) is the source of truth for the enum
 * *values*; these string-literal unions mirror those values so both the web
 * dropdowns and the API's receipt renderer can share one set of human-readable
 * labels and ordered option lists. Keep the string values in exact sync with
 * the `ReturnReason` / `ItemCondition` / `StockDisposition` enums in
 * `schema.prisma`.
 */

export type ReturnReasonCode =
  | 'WRONG_PRODUCT'
  | 'DAMAGED'
  | 'DEFECTIVE'
  | 'EXTRA_QUANTITY'
  | 'CHANGED_MIND'
  | 'NOT_SUITABLE'
  | 'OTHER';

export type ItemConditionCode =
  | 'GOOD'
  | 'DAMAGED'
  | 'DEFECTIVE'
  | 'OPENED_USED'
  | 'NON_RESELLABLE';

export type StockDispositionCode =
  | 'RETURN_TO_STOCK'
  | 'DAMAGED_STOCK'
  | 'SUPPLIER_REVIEW'
  | 'DO_NOT_RESTOCK';

export type ReturnStatusCode =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type RefundStatusCode = 'PENDING' | 'COMPLETED' | 'FAILED';

export type SaleReturnStatusCode =
  | 'NOT_RETURNED'
  | 'PARTIALLY_RETURNED'
  | 'FULLY_RETURNED';

export const RETURN_REASON_LABELS: Record<ReturnReasonCode, string> = {
  WRONG_PRODUCT: 'Wrong product',
  DAMAGED: 'Damaged product',
  DEFECTIVE: 'Defective product',
  EXTRA_QUANTITY: 'Extra quantity purchased',
  CHANGED_MIND: 'Customer changed mind',
  NOT_SUITABLE: 'Product did not match requirement',
  OTHER: 'Other',
};

export const ITEM_CONDITION_LABELS: Record<ItemConditionCode, string> = {
  GOOD: 'Good condition',
  DAMAGED: 'Damaged',
  DEFECTIVE: 'Defective',
  OPENED_USED: 'Opened or used',
  NON_RESELLABLE: 'Non-resellable',
};

export const STOCK_DISPOSITION_LABELS: Record<StockDispositionCode, string> = {
  RETURN_TO_STOCK: 'Return to stock',
  DAMAGED_STOCK: 'Damaged stock',
  SUPPLIER_REVIEW: 'Supplier review',
  DO_NOT_RESTOCK: 'Do not restock',
};

export const RETURN_STATUS_LABELS: Record<ReturnStatusCode, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

export const REFUND_STATUS_LABELS: Record<RefundStatusCode, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

/** Ordered option lists for UI dropdowns. */
export const RETURN_REASON_OPTIONS = (
  Object.keys(RETURN_REASON_LABELS) as ReturnReasonCode[]
).map((value) => ({ value, label: RETURN_REASON_LABELS[value] }));

export const ITEM_CONDITION_OPTIONS = (
  Object.keys(ITEM_CONDITION_LABELS) as ItemConditionCode[]
).map((value) => ({ value, label: ITEM_CONDITION_LABELS[value] }));

export const STOCK_DISPOSITION_OPTIONS = (
  Object.keys(STOCK_DISPOSITION_LABELS) as StockDispositionCode[]
).map((value) => ({ value, label: STOCK_DISPOSITION_LABELS[value] }));

/**
 * Conditions that must never re-enter normal available stock. The UI blocks
 * `RETURN_TO_STOCK` for these, and the API rejects it as a safety net.
 */
export const NON_RESTOCKABLE_CONDITIONS: ItemConditionCode[] = [
  'DAMAGED',
  'DEFECTIVE',
  'OPENED_USED',
  'NON_RESELLABLE',
];

/**
 * Default stock disposition suggested for a given item condition. Good items
 * default to going back on the shelf; everything else is held for review so it
 * does not silently inflate available stock.
 */
export const DEFAULT_DISPOSITION_FOR_CONDITION: Record<
  ItemConditionCode,
  StockDispositionCode
> = {
  GOOD: 'RETURN_TO_STOCK',
  DAMAGED: 'DAMAGED_STOCK',
  DEFECTIVE: 'SUPPLIER_REVIEW',
  OPENED_USED: 'DO_NOT_RESTOCK',
  NON_RESELLABLE: 'DO_NOT_RESTOCK',
};
