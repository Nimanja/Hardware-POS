import { formatCurrency } from '@hardware-pos/shared';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency for display (Sri Lankan Rupees, e.g. `Rs. 1,250.00`).
 *
 * All POS transactions are treated as LKR, so the optional `currency` argument is
 * retained only for call-site compatibility and no longer affects the output.
 */
export function formatMoney(amount: number, _currency?: string): string {
  return formatCurrency(amount);
}

/** Round to 2 decimal places (currency). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
