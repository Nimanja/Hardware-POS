/**
 * Shared quotation vocabulary. The Prisma schema (packages/database) owns the
 * enum *values*; these string-literal unions mirror them so the web dropdowns
 * and the API share one set of labels. Keep in sync with the `QuotationStatus`,
 * `ShareChannel`, and `ShareStatus` enums in schema.prisma.
 */

export type QuotationStatusCode =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVISED'
  | 'CONVERTED_TO_SALE'
  | 'CANCELLED';

export type ShareChannelCode = 'WHATSAPP' | 'EMAIL' | 'DOWNLOAD' | 'PRINT';

export type ShareStatusCode = 'PENDING' | 'SENT' | 'FAILED';

export const QUOTATION_STATUS_LABELS: Record<QuotationStatusCode, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  REVISED: 'Revised',
  CONVERTED_TO_SALE: 'Converted to sale',
  CANCELLED: 'Cancelled',
};

export interface QuotationStatusOption {
  value: QuotationStatusCode;
  label: string;
}

export const QUOTATION_STATUS_OPTIONS: QuotationStatusOption[] = (
  Object.keys(QUOTATION_STATUS_LABELS) as QuotationStatusCode[]
).map((value) => ({ value, label: QUOTATION_STATUS_LABELS[value] }));

export const SHARE_CHANNEL_LABELS: Record<ShareChannelCode, string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  DOWNLOAD: 'Download',
  PRINT: 'Print',
};
