import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@hardware-pos/database';
import {
  formatCurrency,
  ITEM_CONDITION_LABELS,
  QUOTATION_STATUS_LABELS,
  QuotationStatusCode,
  RETURN_REASON_LABELS,
  type ItemConditionCode,
  type ReturnReasonCode,
} from '@hardware-pos/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { DocumentSettings } from '../settings/settings.interfaces';
import { QuotationDetail } from '../quotations/quotations.types';
import {
  A4Column,
  A4Document,
  A4Party,
  A4Row,
  A4Seller,
  A4SummaryLine,
  esc,
  renderA4Document,
} from './document-templates';
import { PdfService } from './pdf.service';

/** A line normalised for the A4 item table (both quotations and bills map here). */
interface DocLine {
  index: number;
  name: string;
  sku: string | null;
  description: string | null;
  quantity: number;
  unitType: string | null;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

const saleForBill = {
  items: { include: { product: { select: { unitType: true } } } },
  payments: true,
  customer: true,
  branch: { select: { name: true, address: true, phone: true } },
  tenant: { select: { name: true } },
} satisfies Prisma.SaleInclude;

type SaleForBillRow = Prisma.SaleGetPayload<{ include: typeof saleForBill }>;

const returnForDoc = {
  items: true,
  originalSale: { select: { saleNumber: true } },
  customer: true,
  branch: { select: { name: true, address: true, phone: true } },
  tenant: { select: { name: true } },
  refundPayments: true,
} satisfies Prisma.ReturnInclude;

type ReturnForDocRow = Prisma.ReturnGetPayload<{ include: typeof returnForDoc }>;

/** A returned or replacement line for the Exchange A4 template. */
export interface ExchangeLine {
  name: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly pdf: PdfService,
  ) {}

  /** Whether a server-side PDF engine (Puppeteer) is installed. */
  get pdfAvailable(): boolean {
    return this.pdf.available;
  }

  // ── Quotation A4 ─────────────────────────────────────────────

  buildQuotationDocument(tenantId: string, q: QuotationDetail, sellerName: string): A4Document {
    const docs = this.settings.getSettings(tenantId).documents;
    const lines: DocLine[] = q.items.map((it, i) => ({
      index: i + 1,
      name: it.productName,
      sku: it.sku,
      description: it.description,
      quantity: it.quantity,
      unitType: it.unitType,
      unitPrice: it.unitPrice,
      discountAmount: it.discountAmount,
      taxAmount: it.taxAmount,
      lineTotal: it.lineTotal,
    }));

    const summary: A4SummaryLine[] = [{ label: 'Subtotal', value: formatCurrency(q.subtotal) }];
    if (q.productDiscountTotal > 0)
      summary.push({ label: 'Product discounts', value: `- ${formatCurrency(q.productDiscountTotal)}`, muted: true });
    if (q.quotationDiscountAmount > 0)
      summary.push({ label: 'Quotation discount', value: `- ${formatCurrency(q.quotationDiscountAmount)}`, muted: true });
    if (q.taxAmount > 0) summary.push({ label: 'Tax / VAT', value: formatCurrency(q.taxAmount) });
    summary.push({ label: 'Grand total', value: formatCurrency(q.grandTotal), strong: true });

    const meta = [
      { label: 'Issue date', value: this.date(q.issueDate) },
      { label: 'Valid until', value: q.validUntil ? this.date(q.validUntil) : '—' },
      { label: 'Status', value: QUOTATION_STATUS_LABELS[q.status] },
    ];

    return {
      seller: this.seller(docs, sellerName, q.branchName, q.branchAddress, q.branchPhone),
      title: 'Quotation',
      number: q.revisionLabel,
      statusBadge: QUOTATION_STATUS_LABELS[q.status],
      watermark: this.quotationWatermark(q.status, q.isExpired),
      meta,
      party: this.customerParty(q.customer),
      columns: this.columns(docs),
      rows: this.rows(lines, docs),
      summary,
      notes: q.notes,
      terms: q.termsAndConditions,
      footerText: docs.footerText,
      signatures: docs.signatureFields,
    };
  }

  async quotationHtml(tenantId: string, q: QuotationDetail): Promise<string> {
    const sellerName = await this.tenantName(tenantId);
    return renderA4Document(this.buildQuotationDocument(tenantId, q, sellerName));
  }

  async quotationPdf(tenantId: string, q: QuotationDetail): Promise<Buffer | null> {
    return this.pdf.htmlToPdf(await this.quotationHtml(tenantId, q));
  }

  private async tenantName(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    return tenant?.name ?? 'Hardware POS';
  }

  // ── Sale / bill A4 ───────────────────────────────────────────

  private async loadSale(tenantId: string, saleId: string): Promise<SaleForBillRow> {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: saleForBill,
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  buildSaleDocument(tenantId: string, sale: SaleForBillRow): A4Document {
    const docs = this.settings.getSettings(tenantId).documents;
    const num = (v: Prisma.Decimal | number | null) => (v == null ? 0 : Number(v));

    const lines: DocLine[] = sale.items.map((it, i) => ({
      index: i + 1,
      name: it.productName,
      sku: it.sku,
      description: null,
      quantity: num(it.quantity),
      unitType: it.product?.unitType ?? null,
      unitPrice: num(it.unitPrice),
      discountAmount: num(it.discountAmount),
      taxAmount: num(it.taxAmount),
      lineTotal: num(it.lineTotal),
    }));

    const paid = num(sale.paidAmount);
    const balance = num(sale.balanceAmount);
    const summary: A4SummaryLine[] = [{ label: 'Subtotal', value: formatCurrency(num(sale.subtotal)) }];
    if (num(sale.totalDiscount) > 0)
      summary.push({ label: 'Product discounts', value: `- ${formatCurrency(num(sale.totalDiscount))}`, muted: true });
    if (num(sale.orderDiscountAmount) > 0)
      summary.push({ label: 'Order discount', value: `- ${formatCurrency(num(sale.orderDiscountAmount))}`, muted: true });
    if (num(sale.taxAmount) > 0) summary.push({ label: 'Tax / VAT', value: formatCurrency(num(sale.taxAmount)) });
    summary.push({ label: 'Grand total', value: formatCurrency(num(sale.total)), strong: true });
    summary.push({ label: 'Paid', value: formatCurrency(paid) });
    if (balance > 0) summary.push({ label: 'Balance due', value: formatCurrency(balance) });

    const paymentMethods = sale.payments.map((p) => p.method).join(', ');
    const meta = [
      { label: 'Date', value: this.date((sale.completedAt ?? sale.createdAt).toISOString()) },
      { label: 'Payment', value: sale.paymentStatus },
      ...(paymentMethods ? [{ label: 'Method', value: paymentMethods }] : []),
    ];

    return {
      seller: this.seller(docs, sale.tenant.name, sale.branch?.name ?? null, sale.branch?.address ?? null, sale.branch?.phone ?? null),
      title: 'Invoice',
      number: sale.saleNumber,
      statusBadge: sale.paymentStatus,
      watermark: sale.status === 'VOIDED' ? 'VOID' : balance > 0 ? 'UNPAID' : null,
      meta,
      party: this.customerParty(
        sale.customer
          ? {
              name: sale.customer.name,
              companyName: sale.customer.companyName,
              phone: sale.customer.phone,
              email: sale.customer.email,
              billingAddress: sale.customer.billingAddress,
              taxNumber: sale.customer.taxNumber,
            }
          : null,
      ),
      columns: this.columns(docs),
      rows: this.rows(lines, docs),
      summary,
      footerText: docs.footerText,
      signatures: docs.signatureFields,
    };
  }

  async saleHtml(tenantId: string, saleId: string): Promise<string> {
    const sale = await this.loadSale(tenantId, saleId);
    return renderA4Document(this.buildSaleDocument(tenantId, sale));
  }

  async salePdf(tenantId: string, saleId: string): Promise<Buffer | null> {
    return this.pdf.htmlToPdf(await this.saleHtml(tenantId, saleId));
  }

  // ── Return / refund A4 ───────────────────────────────────────

  private async loadReturn(tenantId: string, returnId: string): Promise<ReturnForDocRow> {
    const ret = await this.prisma.return.findFirst({
      where: { id: returnId, tenantId },
      include: returnForDoc,
    });
    if (!ret) throw new NotFoundException('Return not found');
    return ret;
  }

  buildReturnDocument(tenantId: string, ret: ReturnForDocRow): A4Document {
    const docs = this.settings.getSettings(tenantId).documents;
    const num = (v: Prisma.Decimal | number | null) => (v == null ? 0 : Number(v));

    const lines: DocLine[] = ret.items.map((it, i) => {
      const reason = RETURN_REASON_LABELS[it.returnReason as ReturnReasonCode] ?? it.returnReason;
      const condition = ITEM_CONDITION_LABELS[it.itemCondition as ItemConditionCode] ?? it.itemCondition;
      const desc = [`${reason} · ${condition}`, it.note].filter(Boolean).join(' — ');
      return {
        index: i + 1,
        name: it.productNameSnapshot,
        sku: it.skuSnapshot,
        description: desc,
        quantity: num(it.returnQuantity),
        unitType: null,
        unitPrice: num(it.originalUnitPrice),
        discountAmount: 0,
        taxAmount: num(it.taxAdjustment),
        lineTotal: num(it.refundableAmount),
      };
    });

    const summary: A4SummaryLine[] = [{ label: 'Items refund', value: formatCurrency(num(ret.subtotal)) }];
    if (num(ret.productDiscountAdjustment) > 0)
      summary.push({ label: 'Product discount reversed', value: `- ${formatCurrency(num(ret.productDiscountAdjustment))}`, muted: true });
    if (num(ret.orderDiscountAdjustment) > 0)
      summary.push({ label: 'Order discount reversed', value: `- ${formatCurrency(num(ret.orderDiscountAdjustment))}`, muted: true });
    if (num(ret.taxAdjustment) > 0)
      summary.push({ label: 'Tax reversed', value: formatCurrency(num(ret.taxAdjustment)) });
    summary.push({ label: 'Total refund', value: formatCurrency(num(ret.refundTotal)), strong: true });
    if (ret.refundMethod) summary.push({ label: 'Refund method', value: ret.refundMethod });
    summary.push({ label: 'Refund status', value: ret.refundStatus });

    const meta = [
      { label: 'Date', value: this.date((ret.completedAt ?? ret.createdAt).toISOString()) },
      { label: 'Original sale', value: ret.originalSale.saleNumber },
    ];

    return {
      seller: this.seller(docs, ret.tenant.name, ret.branch?.name ?? null, ret.branch?.address ?? null, ret.branch?.phone ?? null),
      title: 'Return / Refund',
      number: ret.returnNumber,
      statusBadge: ret.refundStatus,
      watermark: ret.refundStatus === 'FAILED' ? 'FAILED' : null,
      meta,
      party: this.customerParty(
        ret.customer
          ? {
              name: ret.customer.name,
              companyName: ret.customer.companyName,
              phone: ret.customer.phone,
              email: ret.customer.email,
              billingAddress: ret.customer.billingAddress,
              taxNumber: ret.customer.taxNumber,
            }
          : null,
      ),
      columns: this.columns(docs),
      rows: this.rows(lines, docs),
      summary,
      notes: ret.notes,
      footerText: docs.footerText,
      signatures: docs.signatureFields,
    };
  }

  async returnHtml(tenantId: string, returnId: string): Promise<string> {
    const ret = await this.loadReturn(tenantId, returnId);
    return renderA4Document(this.buildReturnDocument(tenantId, ret));
  }

  async returnPdf(tenantId: string, returnId: string): Promise<Buffer | null> {
    return this.pdf.htmlToPdf(await this.returnHtml(tenantId, returnId));
  }

  // ── Exchange A4 (returned + replacement lines → net difference) ──────────────
  //
  // Exchanges are not yet a first-class transaction in the POS. This renderer is
  // ready for that feature: pass the returned lines and the replacement lines and
  // it produces a combined A4 note showing the net amount due / to refund.

  buildExchangeDocument(
    tenantId: string,
    sellerName: string,
    exchangeNumber: string,
    returned: ExchangeLine[],
    replacements: ExchangeLine[],
  ): A4Document {
    const docs = this.settings.getSettings(tenantId).documents;
    const toDoc = (l: ExchangeLine, i: number, sign: number): DocLine => ({
      index: i + 1,
      name: `${sign < 0 ? 'Return: ' : 'New: '}${l.name}`,
      sku: l.sku ?? null,
      description: null,
      quantity: l.quantity,
      unitType: null,
      unitPrice: l.unitPrice,
      discountAmount: 0,
      taxAmount: 0,
      lineTotal: sign * l.lineTotal,
    });
    const returnedTotal = returned.reduce((a, l) => a + l.lineTotal, 0);
    const replacementTotal = replacements.reduce((a, l) => a + l.lineTotal, 0);
    const net = Math.round((replacementTotal - returnedTotal) * 100) / 100;

    const lines = [
      ...returned.map((l, i) => toDoc(l, i, -1)),
      ...replacements.map((l, i) => toDoc(l, returned.length + i, 1)),
    ];
    const summary: A4SummaryLine[] = [
      { label: 'Returned value', value: `- ${formatCurrency(returnedTotal)}`, muted: true },
      { label: 'Replacement value', value: formatCurrency(replacementTotal) },
      {
        label: net >= 0 ? 'Balance due from customer' : 'Refund to customer',
        value: formatCurrency(Math.abs(net)),
        strong: true,
      },
    ];

    return {
      seller: this.seller(docs, sellerName, null, null, null),
      title: 'Exchange',
      number: exchangeNumber,
      meta: [{ label: 'Date', value: this.date(new Date().toISOString()) }],
      columns: this.columns({ ...docs, showTaxColumn: false, showDiscountColumn: false }),
      rows: this.rows(lines, { ...docs, showTaxColumn: false, showDiscountColumn: false }),
      summary,
      footerText: docs.footerText,
      signatures: docs.signatureFields,
    };
  }

  // ── Shared building blocks ───────────────────────────────────

  private seller(
    docs: DocumentSettings,
    fallbackName: string,
    branchName: string | null,
    branchAddress: string | null,
    branchPhone: string | null,
  ): A4Seller {
    return {
      name: docs.companyName ?? fallbackName ?? 'Hardware POS',
      addressLine: docs.addressLine ?? branchAddress ?? (branchName ? `Branch: ${branchName}` : null),
      phone: docs.phone ?? branchPhone ?? null,
      email: docs.email ?? null,
      taxNumber: docs.taxNumber ?? null,
      logoUrl: docs.logoUrl ?? null,
    };
  }

  private customerParty(
    customer:
      | {
          name: string;
          companyName: string | null;
          phone: string | null;
          email: string | null;
          billingAddress: string | null;
          taxNumber: string | null;
        }
      | null,
  ): A4Party {
    if (!customer) return { label: 'Bill to', name: 'Walk-in customer' };
    return {
      label: 'Bill to',
      name: customer.name,
      company: customer.companyName,
      phone: customer.phone,
      email: customer.email,
      address: customer.billingAddress,
      taxNumber: customer.taxNumber,
    };
  }

  private columns(docs: DocumentSettings): A4Column[] {
    const cols: A4Column[] = [{ label: '#', align: 'left', width: '28px' }, { label: 'Product', align: 'left' }];
    if (docs.showSku) cols.push({ label: 'SKU', align: 'left' });
    cols.push({ label: 'Qty', align: 'right' });
    cols.push({ label: 'Unit', align: 'left' });
    cols.push({ label: 'Unit price', align: 'right' });
    if (docs.showDiscountColumn) cols.push({ label: 'Discount', align: 'right' });
    if (docs.showTaxColumn) cols.push({ label: 'Tax', align: 'right' });
    cols.push({ label: 'Line total', align: 'right' });
    return cols;
  }

  private rows(lines: DocLine[], docs: DocumentSettings): A4Row[] {
    return lines.map((l) => {
      const name = l.description
        ? `${esc(l.name)}<div style="color:#94a3b8;font-size:10.5px">${esc(l.description)}</div>`
        : esc(l.name);
      const cells: string[] = [String(l.index), name];
      if (docs.showSku) cells.push(esc(l.sku ?? '—'));
      cells.push(this.qty(l.quantity));
      cells.push(esc(l.unitType ?? '—'));
      cells.push(formatCurrency(l.unitPrice));
      if (docs.showDiscountColumn) cells.push(l.discountAmount > 0 ? `- ${formatCurrency(l.discountAmount)}` : '—');
      if (docs.showTaxColumn) cells.push(l.taxAmount > 0 ? formatCurrency(l.taxAmount) : '—');
      cells.push(formatCurrency(l.lineTotal));
      return { cells };
    });
  }

  private quotationWatermark(status: QuotationStatusCode, isExpired: boolean): string | null {
    if (status === 'CANCELLED') return 'CANCELLED';
    if (status === 'CONVERTED_TO_SALE') return 'CONVERTED';
    if (isExpired) return 'EXPIRED';
    if (status === 'DRAFT') return 'DRAFT';
    return null;
  }

  private qty(n: number): string {
    return Number.isInteger(n) ? String(n) : String(n);
  }

  private date(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
