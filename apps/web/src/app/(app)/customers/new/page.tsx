'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { CustomerForm } from '@/components/customers/customer-form';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { Permission } from '@/lib/permissions';

export default function NewCustomerPage() {
  const { session, hasPermission } = useAuth();
  const canManage = hasPermission(Permission.CUSTOMER_MANAGE);

  if (!session) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>
        <PageHeader title="Add customer" />
      </div>

      {!canManage ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            You don’t have permission to add customers.
          </CardContent>
        </Card>
      ) : (
        <CustomerForm session={session} />
      )}
    </div>
  );
}
