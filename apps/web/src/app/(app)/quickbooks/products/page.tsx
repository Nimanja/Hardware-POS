'use client';

import { RefreshCw } from 'lucide-react';

import { SyncBadge } from '@/components/quickbooks/sync-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { Permission } from '@/lib/permissions';
import { formatQbTime, useQuickBooks } from '@/lib/quickbooks';
import { cn, formatMoney } from '@/lib/utils';

export default function QuickBooksProductsPage() {
  const { state, syncProducts } = useQuickBooks();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(Permission.QUICKBOOKS_MANAGE);

  if (!state.connected) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Connect QuickBooks to sync products.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {state.products.length} products cached from QuickBooks · last pull{' '}
          {formatQbTime(state.productSync.lastSyncISO)}
        </p>
        <Button onClick={syncProducts} disabled={!canManage || state.productSync.status === 'SYNCING'}>
          <RefreshCw
            className={cn('h-4 w-4', state.productSync.status === 'SYNCING' && 'animate-spin')}
          />
          Sync Products
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">QuickBooks Item</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">On hand</th>
                <th className="px-4 py-3 font-medium">Sync</th>
                <th className="px-4 py-3 font-medium">Last synced</th>
              </tr>
            </thead>
            <tbody>
              {state.products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.quickbooksItemId}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(p.unitPrice)}</td>
                  <td className="px-4 py-3 text-right">{p.quantityOnHand}</td>
                  <td className="px-4 py-3">
                    <SyncBadge status={p.syncStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatQbTime(p.lastSyncISO)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
