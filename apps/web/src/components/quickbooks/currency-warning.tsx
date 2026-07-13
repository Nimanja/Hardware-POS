'use client';

import { AlertTriangle } from 'lucide-react';

import { CURRENCY_CODE } from '@hardware-pos/shared';

/**
 * Warns when the connected QuickBooks company currency does not match the POS
 * currency (LKR). We do not convert amounts automatically — the user must
 * reconcile currency settings before syncing.
 */
export function CurrencyMismatchWarning({ currency }: { currency: string | null | undefined }) {
  if (!currency || currency === CURRENCY_CODE) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-soft/50 p-4 text-sm text-warning"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <p>
        The QuickBooks company currency is not {CURRENCY_CODE}. Please review currency settings before
        syncing.
      </p>
    </div>
  );
}
