import { round2, sum2 } from '../../common/money';

/**
 * Pure quotation money maths. Mirrors the Sale pricing pipeline so a quotation
 * converts to a sale with identical numbers:
 *
 *   lineSubtotal        = unitPrice × quantity
 *   discountAmount      = per-line discount (% of lineSubtotal, or fixed)
 *   lineTotal           = lineSubtotal − discountAmount           (pre order-discount, pre-tax)
 *   subtotal            = Σ lineSubtotal
 *   productDiscountTotal= Σ discountAmount
 *   discountedSubtotal  = subtotal − productDiscountTotal
 *   quotationDiscount   = order-level discount on discountedSubtotal
 *   taxable             = discountedSubtotal − quotationDiscountAmount
 *   taxAmount           = taxable × taxRatePercent / 100
 *   grandTotal          = taxable + taxAmount
 *
 * All figures are rounded to cents with round2 — never trust client totals; the
 * server always recomputes with this module.
 */

export type DiscountTypeCode = 'PERCENTAGE' | 'FIXED';

export interface QuotationLineInput {
  unitPrice: number;
  quantity: number;
  discountType?: DiscountTypeCode | null;
  discountValue?: number | null;
}

export interface ComputedQuotationLine {
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
  discountType: DiscountTypeCode | null;
  discountValue: number | null;
  discountAmount: number;
  lineTotal: number;
  /** Per-line share of the order tax, allocated by lineTotal (display column). */
  taxAmount: number;
}

export interface QuotationDiscountInput {
  type?: DiscountTypeCode | null;
  value?: number | null;
}

export interface QuotationTotals {
  lines: ComputedQuotationLine[];
  subtotal: number;
  productDiscountTotal: number;
  quotationDiscountType: DiscountTypeCode | null;
  quotationDiscountValue: number | null;
  quotationDiscountAmount: number;
  taxAmount: number;
  grandTotal: number;
}

/** A discount amount can never exceed the base it applies to. */
function discountAmount(base: number, type: DiscountTypeCode | null, value: number | null): number {
  if (!type || value == null || value <= 0) return 0;
  if (type === 'PERCENTAGE') return Math.min(base, round2((base * value) / 100));
  return Math.min(base, round2(value));
}

export function computeQuotationLine(input: QuotationLineInput): ComputedQuotationLine {
  const unitPrice = round2(input.unitPrice);
  const lineSubtotal = round2(unitPrice * input.quantity);
  const type = input.discountType ?? null;
  const value = input.discountValue ?? null;
  const lineDiscount = discountAmount(lineSubtotal, type, value);
  return {
    unitPrice,
    quantity: input.quantity,
    lineSubtotal,
    discountType: type,
    discountValue: value,
    discountAmount: lineDiscount,
    lineTotal: round2(lineSubtotal - lineDiscount),
    taxAmount: 0,
  };
}

export function computeQuotationTotals(
  lineInputs: QuotationLineInput[],
  orderDiscount: QuotationDiscountInput | null | undefined,
  taxRatePercent: number,
): QuotationTotals {
  const lines = lineInputs.map(computeQuotationLine);

  const subtotal = sum2(lines.map((l) => l.lineSubtotal));
  const productDiscountTotal = sum2(lines.map((l) => l.discountAmount));
  const discountedSubtotal = round2(subtotal - productDiscountTotal);

  const qType = orderDiscount?.type ?? null;
  const qValue = orderDiscount?.value ?? null;
  const quotationDiscountAmount = discountAmount(discountedSubtotal, qType, qValue);

  const taxable = round2(discountedSubtotal - quotationDiscountAmount);
  const taxAmount = taxRatePercent > 0 ? round2((taxable * taxRatePercent) / 100) : 0;
  const grandTotal = round2(taxable + taxAmount);

  // Spread the order-level tax across lines proportionally to lineTotal so the
  // per-line tax column sums back to taxAmount exactly (remainder to the last line).
  if (taxAmount > 0 && discountedSubtotal > 0) {
    let allocated = 0;
    const lastIndex = lines.length - 1;
    lines.forEach((line, index) => {
      if (index === lastIndex) {
        line.taxAmount = round2(taxAmount - allocated);
      } else {
        const share = round2(taxAmount * (line.lineTotal / discountedSubtotal));
        line.taxAmount = share;
        allocated = round2(allocated + share);
      }
    });
  }

  return {
    lines,
    subtotal,
    productDiscountTotal,
    quotationDiscountType: qType,
    quotationDiscountValue: qValue,
    quotationDiscountAmount,
    taxAmount,
    grandTotal,
  };
}
