'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { computeDiscount, type DiscountType, type LineDiscount } from '@/lib/cart';
import { cn, formatMoney } from '@/lib/utils';

export function ItemDiscountDialog({
  open,
  productName,
  lineSubtotal,
  currency,
  initial,
  onApply,
  onClear,
  onClose,
}: {
  open: boolean;
  productName: string;
  lineSubtotal: number;
  currency: string;
  initial?: LineDiscount;
  onApply: (discount: LineDiscount) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [type, setType] = React.useState<DiscountType>(initial?.type ?? 'PERCENTAGE');
  const [value, setValue] = React.useState<string>(initial ? String(initial.value) : '');
  const [reason, setReason] = React.useState(initial?.reason ?? '');

  React.useEffect(() => {
    if (open) {
      setType(initial?.type ?? 'PERCENTAGE');
      setValue(initial ? String(initial.value) : '');
      setReason(initial?.reason ?? '');
    }
  }, [open, initial]);

  const numeric = Number(value) || 0;
  const preview = computeDiscount(lineSubtotal, { type, value: numeric });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Product discount"
      description={productName}
      footer={
        <>
          {initial ? (
            <Button variant="ghost" className="mr-auto text-danger" onClick={onClear}>
              Remove
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={numeric <= 0}
            onClick={() => onApply({ type, value: numeric, reason: reason.trim() || undefined })}
          >
            Apply discount
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(['PERCENTAGE', 'FIXED'] as DiscountType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
                type === t
                  ? 'border-primary bg-brand-50 text-brand-700'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {t === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed amount'}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="discount-value">
            {type === 'PERCENTAGE' ? 'Percentage off' : 'Amount off'}
          </Label>
          <Input
            id="discount-value"
            inputMode="decimal"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 5.00'}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="discount-reason">Reason (optional)</Label>
          <Input
            id="discount-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. bulk order"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
          <span className="text-muted-foreground">Discount preview</span>
          <span className="font-semibold">-{formatMoney(preview, currency)}</span>
        </div>
      </div>
    </Dialog>
  );
}
