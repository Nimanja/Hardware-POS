'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Minus,
  NotebookPen,
  Plus,
  Search,
  Tag,
  Trash2,
  Warehouse,
} from 'lucide-react';

import { ItemDiscountDialog } from '@/components/pos/item-discount-dialog';
import { ItemNoteDialog } from '@/components/pos/item-note-dialog';
import { PaymentDialog } from '@/components/pos/payment-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useCheckoutData } from '@/lib/catalog';
import {
  computeLine,
  computeTotals,
  newCartItem,
  type CartItem,
  type LineDiscount,
} from '@/lib/cart';
import type { ClientProduct } from '@/lib/catalog';
import { cn, formatMoney } from '@/lib/utils';

export default function PosPage() {
  const { session } = useAuth();
  const data = useCheckoutData(session!);

  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('All');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [customerId, setCustomerId] = React.useState('');
  const [noteFor, setNoteFor] = React.useState<string | null>(null);
  const [discountFor, setDiscountFor] = React.useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  // ── catalog filtering ──────────────────────────────────────────────────────
  const categories = ['All', ...data.categories];
  const q = query.trim().toLowerCase();
  const products = data.products.filter((p) => {
    const matchesCat = category === 'All' || p.categoryName === category;
    const matchesQuery =
      !q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // ── cart operations ────────────────────────────────────────────────────────
  const updateItem = (productId: string, fn: (item: CartItem) => CartItem) =>
    setCart((prev) => prev.map((it) => (it.product.id === productId ? fn(it) : it)));

  const addToCart = (product: ClientProduct) =>
    setCart((prev) => {
      const found = prev.find((it) => it.product.id === product.id);
      if (found) {
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it,
        );
      }
      return [...prev, newCartItem(product)];
    });

  const changeQty = (productId: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((it) => (it.product.id === productId ? { ...it, quantity: it.quantity + delta } : it))
        .filter((it) => it.quantity > 0),
    );

  const removeItem = (productId: string) =>
    setCart((prev) => prev.filter((it) => it.product.id !== productId));

  const setNote = (productId: string, note: string) => {
    updateItem(productId, (it) => ({ ...it, note: note || undefined }));
    setNoteFor(null);
  };

  const setDiscount = (productId: string, discount: LineDiscount) => {
    updateItem(productId, (it) => ({ ...it, discount }));
    setDiscountFor(null);
  };

  const clearDiscount = (productId: string) => {
    updateItem(productId, (it) => ({ ...it, discount: undefined }));
    setDiscountFor(null);
  };

  const totals = computeTotals(cart, data.settings.taxRatePercent);
  const { currency } = data.settings;

  const noteItem = cart.find((it) => it.product.id === noteFor);
  const discountItem = cart.find((it) => it.product.id === discountFor);
  const customerName =
    data.customers.find((c) => c.id === customerId)?.name ?? 'Walk-in customer';

  const completeSale = () => {
    // TODO: submit to POST /sales/complete (with discount approval) in the payment task.
    setPaymentOpen(false);
    setCart([]);
    setCustomerId('');
    showToast('Sale completed (demo). Payment submission is wired next.');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* ── Catalog ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products or scan barcode…"
              className="pl-10"
            />
          </div>
          <Badge variant={data.source === 'api' ? 'success' : 'neutral'}>
            {data.source === 'api' ? 'Live data' : 'Demo data'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                category === c
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-border',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {data.loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading products…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => {
              const outOfStock = p.quantityOnHand <= 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex flex-col rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary hover:shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{p.sku}</span>
                    {p.requiresWarehousePickup ? (
                      <Warehouse className="h-4 w-4 text-warning" aria-label="Warehouse pickup" />
                    ) : null}
                  </div>
                  <div className="mt-1 line-clamp-2 min-h-10 text-sm font-medium">{p.name}</div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-base font-semibold text-primary">
                      {formatMoney(p.unitPrice, currency)}
                    </span>
                    <span
                      className={cn(
                        'text-xs',
                        outOfStock ? 'font-medium text-danger' : 'text-muted-foreground',
                      )}
                    >
                      {outOfStock ? 'Out of stock' : `${p.quantityOnHand} on hand`}
                    </span>
                  </div>
                </button>
              );
            })}
            {products.length === 0 ? (
              <p className="col-span-full py-16 text-center text-sm text-muted-foreground">
                No products match your search.
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Cart ────────────────────────────────────────────────── */}
      <Card className="flex h-fit flex-col lg:sticky lg:top-6">
        <div className="space-y-3 border-b border-border p-4">
          <div className="text-sm font-semibold">
            Cart{totals.itemCount > 0 ? ` · ${totals.itemCount} item${totals.itemCount > 1 ? 's' : ''}` : ''}
          </div>
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Walk-in customer</option>
            {data.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <CardContent className="max-h-[46vh] space-y-3 overflow-auto p-4">
          {cart.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Tap a product to add it to the cart.
            </p>
          ) : (
            cart.map((item) => {
              const line = computeLine(item);
              return (
                <div key={item.product.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{item.product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(item.product.unitPrice, currency)} each
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold">
                      {formatMoney(line.lineTotal, currency)}
                      {line.discountAmount > 0 ? (
                        <div className="text-xs font-normal text-success">
                          -{formatMoney(line.discountAmount, currency)}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {line.outOfStock ? (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Only {item.product.quantityOnHand} in stock
                    </div>
                  ) : null}

                  {item.note ? (
                    <div className="mt-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
                      {item.note}
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeQty(item.product.id, -1)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeQty(item.product.id, 1)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn('h-8 w-8', item.note && 'text-primary')}
                        onClick={() => setNoteFor(item.product.id)}
                        aria-label="Add note"
                      >
                        <NotebookPen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn('h-8 w-8', item.discount && 'text-primary')}
                        onClick={() => setDiscountFor(item.product.id)}
                        aria-label="Add discount"
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => removeItem(item.product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>

        <div className="space-y-2 border-t border-border p-4 text-sm">
          <Row label="Subtotal" value={formatMoney(totals.subtotal, currency)} />
          <Row label="Product discount" value={`-${formatMoney(totals.totalDiscount, currency)}`} />
          <Row label={`Tax (${data.settings.taxRatePercent}%)`} value={formatMoney(totals.taxAmount, currency)} />
          <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(totals.total, currency)}</span>
          </div>

          {totals.hasStockIssue ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              Some items exceed available stock.
            </div>
          ) : null}

          <Button size="lg" className="mt-1 w-full" disabled={cart.length === 0} onClick={() => setPaymentOpen(true)}>
            Payment · {formatMoney(totals.total, currency)}
          </Button>
        </div>
      </Card>

      {/* ── Dialogs ─────────────────────────────────────────────── */}
      {noteItem ? (
        <ItemNoteDialog
          open={!!noteFor}
          productName={noteItem.product.name}
          initialNote={noteItem.note}
          onSave={(note) => setNote(noteItem.product.id, note)}
          onClose={() => setNoteFor(null)}
        />
      ) : null}

      {discountItem ? (
        <ItemDiscountDialog
          open={!!discountFor}
          productName={discountItem.product.name}
          lineSubtotal={computeLine(discountItem).lineSubtotal}
          currency={currency}
          initial={discountItem.discount}
          onApply={(d) => setDiscount(discountItem.product.id, d)}
          onClear={() => clearDiscount(discountItem.product.id)}
          onClose={() => setDiscountFor(null)}
        />
      ) : null}

      <PaymentDialog
        open={paymentOpen}
        totals={totals}
        currency={currency}
        customerName={customerName}
        onClose={() => setPaymentOpen(false)}
        onComplete={completeSale}
      />

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
