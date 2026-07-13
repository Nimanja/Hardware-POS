'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { CustomerForm } from '@/components/customers/customer-form';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { fetchCustomer, type ManagedCustomer } from '@/lib/customers-api';
import { Permission } from '@/lib/permissions';

export default function EditCustomerPage() {
  const { session, hasPermission } = useAuth();
  const canManage = hasPermission(Permission.CUSTOMER_MANAGE);
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = React.useState<ManagedCustomer | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
  }, [session, id]);

  if (!session) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={`/customers/${id}`}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to customer
        </Link>
        <PageHeader title="Edit customer" description={customer?.name} />
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
      ) : error || !customer ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-danger">
            {error ?? 'Customer not found'}
          </CardContent>
        </Card>
      ) : !canManage ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            You don’t have permission to edit customers.
          </CardContent>
        </Card>
      ) : (
        <CustomerForm session={session} customer={customer} />
      )}
    </div>
  );
}
