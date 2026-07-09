'use client';

import { Link2 } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function QuickBooksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="QuickBooks"
        description="QuickBooks Online is the inventory and accounting source of truth."
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Link2 className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Connection</CardTitle>
              <p className="text-sm text-muted-foreground">Sandbox environment</p>
            </div>
          </div>
          <Badge variant="danger">Not connected</Badge>
        </CardHeader>
        <CardContent className="flex items-center justify-between border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Connect your QuickBooks Online company to sync products, prices, stock, and sales.
          </p>
          <Button disabled>Connect QuickBooks</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {['Products pulled', 'Sales pushed', 'Failed syncs'].map((label) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">{label}</div>
              <div className="mt-1 text-2xl font-semibold">0</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
