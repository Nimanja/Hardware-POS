import { computeReturnLine, sumReturnTotals, type OriginalSaleSnapshot } from './returns.calc';

/** A sale with no order discount and no tax. */
const PLAIN_SALE: OriginalSaleSnapshot = {
  subtotal: 400,
  totalDiscount: 0,
  orderDiscountAmount: 0,
  taxAmount: 0,
};

describe('computeReturnLine', () => {
  it('refunds the original price for a partial return with no discounts or tax', () => {
    const line = computeReturnLine(
      PLAIN_SALE,
      { unitPrice: 100, purchasedQuantity: 4, discountAmount: 0, lineTotal: 400 },
      2,
    );
    expect(line.originalLineSubtotal).toBe(200);
    expect(line.productDiscountAdjustment).toBe(0);
    expect(line.orderDiscountAdjustment).toBe(0);
    expect(line.taxAdjustment).toBe(0);
    expect(line.refundableAmount).toBe(200);
  });

  it('applies the product discount proportionally', () => {
    // 100 × 4 with a 40 (10%) line discount → lineTotal 360.
    const line = computeReturnLine(
      { subtotal: 400, totalDiscount: 40, orderDiscountAmount: 0, taxAmount: 0 },
      { unitPrice: 100, purchasedQuantity: 4, discountAmount: 40, lineTotal: 360 },
      2,
    );
    expect(line.originalLineSubtotal).toBe(200);
    expect(line.productDiscountAdjustment).toBe(20); // half of 40
    expect(line.refundableAmount).toBe(180); // 200 - 20
  });

  it('applies the order-level discount proportionally', () => {
    // 10% order discount (40) on a single 100×4 line.
    const line = computeReturnLine(
      { subtotal: 400, totalDiscount: 0, orderDiscountAmount: 40, taxAmount: 0 },
      { unitPrice: 100, purchasedQuantity: 4, discountAmount: 0, lineTotal: 400 },
      2,
    );
    expect(line.orderDiscountAdjustment).toBe(20); // 40 × (200/400)
    expect(line.refundableAmount).toBe(180); // 200 - 20
  });

  it('reverses tax proportionally', () => {
    const line = computeReturnLine(
      { subtotal: 400, totalDiscount: 0, orderDiscountAmount: 0, taxAmount: 40 },
      { unitPrice: 100, purchasedQuantity: 4, discountAmount: 0, lineTotal: 400 },
      2,
    );
    expect(line.taxAdjustment).toBe(20); // 40 × (200/400)
    expect(line.refundableAmount).toBe(220); // 200 + 20
  });

  it('combines product discount, order discount, and tax for a half-line return', () => {
    // Sale: two lines. Line1 100×2 with a 20 line discount (lineTotal 180).
    // discountedSubtotal 380, order discount 38 (10%), tax 34.20 (10% of 342).
    const sale: OriginalSaleSnapshot = {
      subtotal: 400,
      totalDiscount: 20,
      orderDiscountAmount: 38,
      taxAmount: 34.2,
    };
    const line = computeReturnLine(
      sale,
      { unitPrice: 100, purchasedQuantity: 2, discountAmount: 20, lineTotal: 180 },
      1,
    );
    expect(line.originalLineSubtotal).toBe(100);
    expect(line.productDiscountAdjustment).toBe(10); // 20 × 0.5
    expect(line.orderDiscountAdjustment).toBe(9); // (38 × 180/380) × 0.5 = 9
    expect(line.taxAdjustment).toBe(8.1); // (34.2 × 162/342) × 0.5 = 8.1
    expect(line.refundableAmount).toBe(89.1); // 90 - 9 + 8.1
  });
});

describe('sumReturnTotals — full sale return equals the sale total', () => {
  it('sums per-line refunds to exactly the original total', () => {
    const sale: OriginalSaleSnapshot = {
      subtotal: 400,
      totalDiscount: 20,
      orderDiscountAmount: 38,
      taxAmount: 34.2,
    };
    const line1 = computeReturnLine(
      sale,
      { unitPrice: 100, purchasedQuantity: 2, discountAmount: 20, lineTotal: 180 },
      2,
    );
    const line2 = computeReturnLine(
      sale,
      { unitPrice: 100, purchasedQuantity: 2, discountAmount: 0, lineTotal: 200 },
      2,
    );
    const totals = sumReturnTotals([line1, line2]);
    expect(totals.subtotal).toBe(400);
    expect(totals.productDiscountAdjustment).toBe(20);
    expect(totals.orderDiscountAdjustment).toBe(38);
    expect(totals.taxAdjustment).toBe(34.2);
    // The whole point: a full return refunds exactly what the customer paid.
    expect(totals.refundTotal).toBe(376.2); // 400 - 20 - 38 + 34.2
  });

  it('aggregates a multi-item partial return', () => {
    const line1 = computeReturnLine(
      PLAIN_SALE,
      { unitPrice: 100, purchasedQuantity: 4, discountAmount: 0, lineTotal: 400 },
      1,
    );
    const line2 = computeReturnLine(
      PLAIN_SALE,
      { unitPrice: 50, purchasedQuantity: 2, discountAmount: 0, lineTotal: 100 },
      2,
    );
    const totals = sumReturnTotals([line1, line2]);
    expect(totals.subtotal).toBe(200); // 100 + 100
    expect(totals.refundTotal).toBe(200);
  });
});
