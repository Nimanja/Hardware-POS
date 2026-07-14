'use client';

import Link from 'next/link';
import * as React from 'react';
import { Printer, ReceiptText, RefreshCw, Search } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { SyncBadge } from '@/components/quickbooks/sync-badge';
import { SaleReturnStatusBadge } from '@/components/returns/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { reprintCustomerReceipt } from '@/lib/receipt-print';
import {
  fetchSales,
  retrySaleSync,
  type PaymentStatusCode,
  type SaleListItem,
  type SalesQuery,
  type SyncStatusCode,
} from '@/lib/sales';
import { cn, formatMoney } from '@/lib/utils';

type DatePreset = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'ALL', label: 'All time' },
  { key: 'TODAY', label: 'Today' },
  { key: 'WEEK', label: 'This week' },
  { key: 'MONTH', label: 'This month' },
];

const PAGE_SIZES = [20, 30, 40, 50];

function dateRangeFor(preset: DatePreset): { dateFrom?: string; dateTo?: string } {
  if (preset === 'ALL') return {};
  const now = new Date();
  const start = new Date(now);
  if (preset === 'TODAY') {
    start.setHours(0, 0, 0, 0);
  } else if (preset === 'WEEK') {
    const day = (start.getDay() + 6) % 7; // Monday-based week
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PaymentStatusBadge({ status }: { status: PaymentStatusCode }) {
  const map: Record<
    PaymentStatusCode,
    { label: string; variant: 'success' | 'warning' | 'neutral' | 'danger' }
  > = {
    PAID: { label: 'Paid', variant: 'success' },
    PARTIAL: { label: 'Partially paid', variant: 'warning' },
    UNPAID: { label: 'Credit / Unpaid', variant: 'danger' },
    REFUNDED: { label: 'Refunded', variant: 'neutral' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export default function SalesPage() {
  const { session } = useAuth();

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [preset, setPreset] = React.useState<DatePreset>('ALL');
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatusCode | ''>('');
  const [syncStatus, setSyncStatus] = React.useState<SyncStatusCode | ''>('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const [rows, setRows] = React.useState<SaleListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  // Debounce the search box so we don't refetch on every keystroke.
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever a filter changes.
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, preset, paymentStatus, syncStatus, pageSize]);

  React.useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query: SalesQuery = {
      page,
      pageSize,
      search: debouncedSearch || undefined,
      paymentStatus: paymentStatus || undefined,
      syncStatus: syncStatus || undefined,
      ...dateRangeFor(preset),
    };
    fetchSales(session, query)
      .then((res) => {
        if (cancelled) return;
        setRows(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load sales');
        setRows([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session, page, pageSize, debouncedSearch, preset, paymentStatus, syncStatus, reloadKey]);

  const handleReprint = async (id: string) => {
    if (!session) return;
    setBusyId(id);
    try {
      await reprintCustomerReceipt(session, id);
    } catch {
      /* the print window handles its own errors */
    } finally {
      setBusyId(null);
    }
  };

  const handleRetry = async (id: string) => {
    if (!session) return;
    setBusyId(id);
    try {
      await retrySaleSync(session, id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Completed sales, payment status, and QuickBooks sync."
        actions={
          <Link href="/pos" className="text-sm font-medium text-primary hover:underline">
            New sale →
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sale number or customer…"
            className="pl-10"
          />
        </div>
        <Select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value as PaymentStatusCode | '')}
          className="w-auto"
        >
          <option value="">All payments</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partially paid</option>
          <option value="UNPAID">Credit / Unpaid</option>
          <option value="REFUNDED">Refunded</option>
        </Select>
        <Select
          value={syncStatus}
          onChange={(e) => setSyncStatus(e.target.value as SyncStatusCode | '')}
          className="w-auto"
        >
          <option value="">All sync</option>
          <option value="SYNCED">Synced</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="NOT_SYNCED">Not synced</option>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              preset === p.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-border',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Sale</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Cashier</th>
                <th className="px-4 py-3 text-right font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Sync</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-muted-foreground">
                    Loading sales…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                        <ReceiptText className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="font-medium text-foreground">No sales found</p>
                        <p className="text-sm">
                          Completed sales appear here as soon as a payment is taken.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/sales/${s.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {s.saleNumber}
                      </Link>
                      {s.quickbooksDocumentType ? (
                        <div className="text-xs text-muted-foreground">
                          {s.quickbooksDocumentType === 'SALES_RECEIPT' ? 'Sales Receipt' : 'Invoice'}
                        </div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDateTime(s.completedAt ?? s.createdAt)}
                    </td>
                    <td className="px-4 py-3">{s.customerName ?? 'Walk-in customer'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.cashierName ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{s.itemCount}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(s.total)}</td>
                    <td className="px-4 py-3 text-right">
                      {s.balanceAmount > 0 ? (
                        <span className="font-medium text-danger">
                          {formatMoney(s.balanceAmount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <PaymentStatusBadge status={s.paymentStatus} />
                        <SaleReturnStatusBadge status={s.returnStatus} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SyncBadge status={s.syncStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Reprint receipt"
                          disabled={busyId === s.id}
                          onClick={() => handleReprint(s.id)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {s.syncStatus === 'FAILED' || s.syncStatus === 'PENDING' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Retry QuickBooks sync"
                            disabled={busyId === s.id}
                            onClick={() => handleRetry(s.id)}
                          >
                            <RefreshCw
                              className={cn('h-4 w-4', busyId === s.id && 'animate-spin')}
                            />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Rows per page</span>
          <Select
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="w-auto"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            {total === 0
              ? '0'
              : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`}{' '}
            of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
