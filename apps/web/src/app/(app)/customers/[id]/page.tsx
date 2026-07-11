'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { ArrowLeft, Pencil, RefreshCw } from 'lucide-react';

import { SyncBadge } from '@/components/quickbooks/sync-badge';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import {
  CUSTOMER_TYPE_LABELS,
  fetchCustomer,
  syncCustomerToQuickBooks,
  type ManagedCustomer,
} from '@/lib/customers-api';
import { Permission } from '@/lib/permissions';
import { formatMoney } from '@/lib/utils';

export default function CustomerDetailPage() {
  const { session, hasPermission } = useAuth();
  const canManage = hasPermission(Permission.CUSTOMER_MANAGE);
  const canSyncQb = hasPermission(Permission.QUICKBOOKS_MANAGE);
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = React.useState<ManagedCustomer | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    if (!session || !id) return;
    let cancelled = false;
    setLoading(true);
    fetchCustomer(session, id)
      .then((c) => !cancelled && setCustomer(c))
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load customer'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [session, id, reloadKey]);

  const handleSync = async () => {
    if (!session || !customer) return;
    setBusy(true);
    try {
      await syncCustomerToQuickBooks(session, customer.id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>;

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>
        <Card>
          <CardContent className="py-16 text-center text-sm text-danger">{error ?? 'Customer not found'}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to customers
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            {CUSTOMER_TYPE_LABELS[customer.customerType]}
            {customer.companyName ? ` · ${customer.companyName}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSyncQb && !customer.quickbooksCustomerId ? (
            <Button variant="outline" onClick={handleSync} disabled={busy}>
              <RefreshCw className="h-4 w-4" />
              Sync to QuickBooks
            </Button>
          ) : null}
          {canManage ? (
            <Link href={`/customers/${customer.id}/edit`} className={buttonVariants()}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {customer.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
        {customer.quickbooksCustomerId ? (
          <Badge variant="primary">QuickBooks-linked</Badge>
        ) : (
          <Badge variant="neutral">Not synced</Badge>
        )}
        <SyncBadge status={customer.quickbooksCustomerId ? 'SYNCED' : customer.syncStatus} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Detail label="Phone" value={customer.phone ?? '—'} />
          <Detail label="Email" value={customer.email ?? '—'} />
          <Detail label="Tax / VAT number" value={customer.taxNumber ?? '—'} />
          <Detail label="Credit" value={customer.creditAllowed ? 'Allowed' : 'Not allowed'} />
          <Detail
            label="Credit limit"
            value={customer.creditAllowed ? (customer.creditLimit != null ? formatMoney(customer.creditLimit) : 'No limit') : '—'}
          />
          <Detail label="QuickBooks customer ID" value={customer.quickbooksCustomerId ?? 'Not synced'} />
          {customer.billingAddress ? (
            <div className="sm:col-span-2">
              <div className="text-xs text-muted-foreground">Address</div>
              <p className="mt-0.5 whitespace-pre-line font-medium">{customer.billingAddress}</p>
            </div>
          ) : null}
          {customer.notes ? (
            <div className="sm:col-span-2">
              <div className="text-xs text-muted-foreground">Notes</div>
              <p className="mt-0.5">{customer.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
