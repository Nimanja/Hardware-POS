'use client';

import * as React from 'react';
import { Minus, Plus, Search, Trash2, Warehouse } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MOCK_PRODUCTS, type MockProduct } from '@/lib/mock-data';
import { cn, formatMoney } from '@/lib/utils';

interface CartLine {
  product: MockProduct;
  quantity: number;
}

const CATEGORIES = ['All', ...Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category)))];

export default function PosPage() {
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('All');
  const [cart, setCart] = React.useState<CartLine[]>([]);

  const products = MOCK_PRODUCTS.filter((p) => {
    const matchesCat = category === 'All' || p.category === category;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const addToCart = (product: MockProduct) =>
    setCart((prev) => {
      const found = prev.find((l) => l.product.id === product.id);
      if (found) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { product, quantity: 1 }];
    });

  const changeQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );

  const removeLine = (id: string) => setCart((prev) => prev.filter((l) => l.product.id !== id));

  const subtotal = cart.reduce((sum, l) => sum + l.product.unitPrice * l.quantity, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Catalog */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products or scan barcode…"
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
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
                  {formatMoney(p.unitPrice)}
                </span>
                <span className="text-xs text-muted-foreground">{p.quantityOnHand} on hand</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <Card className="flex h-fit flex-col lg:sticky lg:top-6">
        <div className="border-b border-border p-4 text-sm font-semibold">
          Cart {cart.length > 0 ? `· ${cart.length} item${cart.length > 1 ? 's' : ''}` : ''}
        </div>
        <CardContent className="space-y-3 p-4">
          {cart.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Tap a product to add it to the cart.
            </p>
          ) : (
            cart.map((l) => (
              <div key={l.product.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{l.product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatMoney(l.product.unitPrice)} each
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeQty(l.product.id, -1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{l.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeQty(l.product.id, 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => removeLine(l.product.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
        <div className="space-y-3 border-t border-border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatMoney(subtotal)}</span>
          </div>
          <Button size="lg" className="w-full" disabled={cart.length === 0}>
            Charge {formatMoney(subtotal)}
          </Button>
          {cart.some((l) => l.product.requiresWarehousePickup) ? (
            <Badge variant="warning" className="w-full justify-center">
              <Warehouse className="h-3.5 w-3.5" /> Includes warehouse pickup items
            </Badge>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
