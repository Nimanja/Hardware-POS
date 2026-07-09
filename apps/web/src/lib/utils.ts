import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as currency for display. */
export function formatMoney(amount: number, currency = 'USD'): string {
  return `${currency} ${amount.toFixed(2)}`;
}
