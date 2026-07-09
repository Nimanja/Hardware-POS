'use client';

import { Banknote, CreditCard } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CartTotals } from '@/lib/cart';
import { cn, formatMoney, round2 } from '@/lib/utils';

type Method = 'CASH' | 'CARD';

export function PaymentDialog({
  open,
  totals,
  currency,
  customerName,
  onClose,
  onComplete,
}: {
  open: boolean;
  totals: CartTotals;
  currency: string;
  customerName: string;
  onClose: () => void;
  onComplete: (method: Method, amountPaid: number) => void;
}) {
  const [method, setMethod] = React.useState<Method>('CASH');
  const [tendered, setTendered] = React.useState<string>('');

  React.useEffect(() => {
    if (open) {
      setMethod('CASH');
      setTendered(totals.total.toFixed(2));
    }
  }, [open, totals.total]);

  const paid = Number(tendered) || 0;
  const change = method === 'CASH' ? round2(Math.max(0, paid - totals.total)) : 0;

  const rows: [string, number][] = [
    ['Subtotal', totals.subtotal],
    ['Discount', -totals.totalDiscount],
    ['Tax', totals.taxAmount],
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Payment"
      description={customerName}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="lg" onClick={() => onComplete(method, method === 'CASH' ? paid : totals.total)}>
            Complete sale
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border p-4 text-sm">
          {rows.map(([label, amount]) => (
            <div key={label} className="flex justify-between py-1 text-muted-foreground">
              <span>{label}</span>
              <span>{formatMoney(amount, currency)}</span>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
            <span>Total</span>
            <span>{formatMoney(totals.total, currency)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {([
            { key: 'CASH', label: 'Cash', Icon: Banknote },
            { key: 'CARD', label: 'Card', Icon: CreditCard },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setMethod(key)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                method === key
                  ? 'border-primary bg-brand-50 text-brand-700'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {method === 'CASH' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tendered">Amount tendered</Label>
              <Input
                id="tendered"
                inputMode="decimal"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Change</Label>
              <div className="flex h-11 items-center rounded-xl bg-muted px-4 text-sm font-semibold">
                {formatMoney(change, currency)}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
