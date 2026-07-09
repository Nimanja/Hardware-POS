/** POS-level settings surfaced to the front-end. */
export interface AppSettings {
  currency: string;
  taxInclusive: boolean;
  /** Discount percentage at or above which manager approval is required. */
  highDiscountThresholdPercent: number;
  receiptFooter: string;
}
