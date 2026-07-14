import { computeQuotationLine, computeQuotationTotals } from './quotations.calc';

describe('computeQuotationLine', () => {
  it('multiplies unit price by quantity with no discount', () => {
    const line = computeQuotationLine({ unitPrice: 250, quantity: 3 });
    expect(line.lineSubtotal).toBe(750);
    expect(line.discountAmount).toBe(0);
    expect(line.lineTotal).toBe(750);
  });

  it('applies a percentage line discount', () => {
    const line = computeQuotationLine({
      unitPrice: 100,
      quantity: 4,
      discountType: 'PERCENTAGE',
      discountValue: 10,
    });
    expect(line.lineSubtotal).toBe(400);
    expect(line.discountAmount).toBe(40);
    expect(line.lineTotal).toBe(360);
  });

  it('applies a fixed line discount and never exceeds the line subtotal', () => {
    const line = computeQuotationLine({
      unitPrice: 100,
      quantity: 1,
      discountType: 'FIXED',
      discountValue: 250,
    });
    expect(line.discountAmount).toBe(100); // capped at the 100 subtotal
    expect(line.lineTotal).toBe(0);
  });
});

describe('computeQuotationTotals', () => {
  it('sums lines and needs no discount or tax', () => {
    const totals = computeQuotationTotals(
      [
        { unitPrice: 100, quantity: 2 },
        { unitPrice: 50, quantity: 3 },
      ],
      null,
      0,
    );
    expect(totals.subtotal).toBe(350);
    expect(totals.productDiscountTotal).toBe(0);
    expect(totals.quotationDiscountAmount).toBe(0);
    expect(totals.taxAmount).toBe(0);
    expect(totals.grandTotal).toBe(350);
  });

  it('applies product discounts then an order discount then tax, in order', () => {
    // Two lines, 400 + 200 = 600 subtotal. Line 1 has a 10% (40) discount.
    // discountedSubtotal = 560. Order 10% = 56. taxable = 504. tax 15% = 75.60.
    const totals = computeQuotationTotals(
      [
        { unitPrice: 100, quantity: 4, discountType: 'PERCENTAGE', discountValue: 10 },
        { unitPrice: 100, quantity: 2 },
      ],
      { type: 'PERCENTAGE', value: 10 },
      15,
    );
    expect(totals.subtotal).toBe(600);
    expect(totals.productDiscountTotal).toBe(40);
    expect(totals.quotationDiscountAmount).toBe(56);
    expect(totals.taxAmount).toBe(75.6);
    expect(totals.grandTotal).toBe(579.6); // 504 + 75.60
  });

  it('applies a fixed order discount capped at the discounted subtotal', () => {
    const totals = computeQuotationTotals(
      [{ unitPrice: 100, quantity: 1 }],
      { type: 'FIXED', value: 500 },
      0,
    );
    expect(totals.quotationDiscountAmount).toBe(100);
    expect(totals.grandTotal).toBe(0);
  });

  it('allocates per-line tax so the columns sum back to the order tax exactly', () => {
    const totals = computeQuotationTotals(
      [
        { unitPrice: 33.33, quantity: 1 },
        { unitPrice: 33.33, quantity: 1 },
        { unitPrice: 33.34, quantity: 1 },
      ],
      null,
      15,
    );
    const lineTaxSum = totals.lines.reduce((acc, l) => acc + l.taxAmount, 0);
    expect(Math.round(lineTaxSum * 100) / 100).toBe(totals.taxAmount);
  });

  it('handles an empty quotation', () => {
    const totals = computeQuotationTotals([], null, 15);
    expect(totals.subtotal).toBe(0);
    expect(totals.grandTotal).toBe(0);
    expect(totals.lines).toHaveLength(0);
  });
});
