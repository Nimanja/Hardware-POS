'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react';

import { SyncBadge } from '@/components/quickbooks/sync-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { reprintCustomerReceipt } from '@/lib/receipt-print';
import { fetchSale, retrySaleSync, type PaymentStatusCode, type SaleDetail } from '@/lib/sales';
import { formatMoney } from '@/lib/utils';

const PAYMENT_STATUS: Record<
  PaymentStatusCode,
  { label: string; variant: 'success' | 'warning' | 'neutral' | 'danger' }
> = {
  PAID: { label: 'Paid', variant: 'success' },
  PARTIAL: { label: 'Partially paid', variant: 'warning' },
  UNPAID: { label: 'Credit / Unpaid', variant: 'danger' },
  REFUNDED: { label: 'Refunded', variant: 'neutral' },
};

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  QR_PAYMENT: 'QR Payment',
  CHECK: 'Cheque',
  STORE_CREDIT: 'Store Credit',
  OTHER: 'Other',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SaleDetailPage() {
  const { session } = useAuth();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [sale, setSale] = React.useState<SaleDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    if (!session || !id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSale(session, id)
      .then((s) => !cancelled && setSale(s))
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load sale');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [session, id, reloadKey]);

  const handleReprint = async () => {
    if (!session || !sale) return;
    setBusy(true);
    try {
      await reprintCustomerReceipt(session, sale.id);
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    if (!session || !sale) return;
    setBusy(true);
    try {
      await retrySaleSync(session, sale.id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Loading sale…</p>;
  }

  if (error || !sale) {
    return (
      <div className="space-y-4">
        <Link href="/sales" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to sales
        </Link>
        <Card>
          <CardContent className="py-16 text-center text-sm text-danger">
            {error ?? 'Sale not found'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const pay = PAYMENT_STATUS[sale.paymentStatus];
  const canRetry = sale.syncStatus === 'FAILED' || sale.syncStatus === 'PENDING';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/sales"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sales
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Sale {sale.saleNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(sale.completedAt ?? sale.createdAt)} ·{' '}
            {sale.customer?.name ?? 'Walk-in customer'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReprint} disabled={busy}>
            <Printer className="h-4 w-4" />
            Print receipt
          </Button>
          {canRetry ? (
            <Button variant="outline" onClick={handleRetry} disabled={busy}>
              <RefreshCw className="h-4 w-4" />
              Retry sync
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={pay.variant}>{pay.label}</Badge>
        <SyncBadge status={sale.syncStatus} />
        {sale.quickbooksDocumentType ? (
          <Badge variant="primary">
            {sale.quickbooksDocumentType === 'SALES_RECEIPT' ? 'Sales Receipt' : 'Invoice'}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Discount</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((it) => (
                  <tr key={it.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{it.productName}</div>
                      {it.sku ? (
                        <div className="text-xs text-muted-foreground">{it.sku}</div>
                      ) : null}
                      {it.discountReason ? (
                        <div className="text-xs text-muted-foreground">Reason: {it.discountReason}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">{formatMoney(it.unitPrice)}</td>
                    <td className="px-4 py-3 text-right">{it.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      {it.discountAmount > 0 ? (
                        <span className="text-success">-{formatMoney(it.discountAmount)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Summary + payments + QB */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatMoney(sale.subtotal)} />
              <Row label="Product discount" value={`-${formatMoney(sale.totalDiscount)}`} />
              {sale.orderDiscountAmount > 0 ? (
                <Row label="Order discount" value={`-${formatMoney(sale.orderDiscountAmount)}`} />
              ) : null}
              <Row label="Tax / VAT" value={formatMoney(sale.taxAmount)} />
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(sale.total)}</span>
              </div>
              <Row label="Paid" value={formatMoney(sale.paidAmount)} />
              {sale.balanceAmount > 0 ? (
                <div className="flex items-center justify-between font-medium text-danger">
                  <span>Balance</span>
                  <span>{formatMoney(sale.balanceAmount)}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {sale.payments.length === 0 ? (
                <p className="text-muted-foreground">No payments recorded (credit sale).</p>
              ) : (
                sale.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {METHOD_LABEL[p.method] ?? p.method}
                      {p.reference ? ` · ${p.reference}` : ''}
                    </span>
                    <span className="font-medium">{formatMoney(p.amount)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QuickBooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row
                label="Document"
                value={
                  sale.quickbooksDocumentType === 'SALES_RECEIPT'
                    ? 'Sales Receipt'
                    : sale.quickbooksDocumentType === 'INVOICE'
                      ? 'Invoice'
                      : '—'
                }
              />
              <Row label="Document ID" value={sale.quickbooksDocumentId ?? 'Not synced'} />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <SyncBadge status={sale.syncStatus} />
              </div>
              {sale.syncError ? <p className="text-xs text-danger">{sale.syncError}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
