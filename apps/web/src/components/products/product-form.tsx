'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

import { ProductImage } from '@/components/product-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Session } from '@/lib/auth';
import {
  createProduct,
  deleteProductImage,
  updateProduct,
  uploadProductImage,
  type Category,
  type ManagedProduct,
  type ProductInput,
} from '@/lib/products-api';
import { cn } from '@/lib/utils';

interface FormState {
  name: string;
  sku: string;
  barcode: string;
  brand: string;
  categoryId: string;
  unitType: string;
  unitPrice: string;
  costPrice: string;
  quantityOnHand: string;
  reorderLevel: string;
  description: string;
  imageAltText: string;
  trackInventory: boolean;
  taxable: boolean;
  requiresWarehousePickup: boolean;
  isActive: boolean;
}

function initialState(p?: ManagedProduct): FormState {
  return {
    name: p?.name ?? '',
    sku: p?.sku ?? '',
    barcode: p?.barcode ?? '',
    brand: p?.brand ?? '',
    categoryId: p?.categoryId ?? '',
    unitType: p?.unitType ?? '',
    unitPrice: p ? String(p.unitPrice) : '',
    costPrice: p?.costPrice != null ? String(p.costPrice) : '',
    quantityOnHand: p ? String(p.quantityOnHand) : '0',
    reorderLevel: p?.reorderLevel != null ? String(p.reorderLevel) : '',
    description: p?.description ?? '',
    imageAltText: p?.imageAltText ?? '',
    trackInventory: p?.trackInventory ?? true,
    taxable: p?.taxable ?? true,
    requiresWarehousePickup: p?.requiresWarehousePickup ?? false,
    isActive: p?.isActive ?? true,
  };
}

const numOrNull = (s: string): number | null => (s.trim() === '' ? null : Number(s));

export function ProductForm({
  session,
  categories,
  product,
  isAdmin,
}: {
  session: Session;
  categories: Category[];
  /** Present in edit mode. */
  product?: ManagedProduct;
  /** Owner/Admin — may override QuickBooks-managed stock. */
  isAdmin: boolean;
}) {
  const router = useRouter();
  const editing = !!product;
  const [form, setForm] = React.useState<FormState>(() => initialState(product));
  const [imageUrl, setImageUrl] = React.useState<string | null>(product?.imageUrl ?? null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [imageBusy, setImageBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const qbManaged = !!product?.quickbooksItemId;
  const stockLocked = qbManaged && !isAdmin;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  React.useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const onPickFile = async (file: File) => {
    setError(null);
    if (editing && product) {
      // Product exists — upload immediately.
      setImageBusy(true);
      try {
        const updated = await uploadProductImage(session, product.id, file);
        setImageUrl(updated.imageUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Image upload failed');
      } finally {
        setImageBusy(false);
      }
    } else {
      // Create mode — hold the file and upload after the product is created.
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      setPendingFile(file);
      setPendingPreview(URL.createObjectURL(file));
    }
  };

  const onRemoveImage = async () => {
    setError(null);
    if (editing && product && imageUrl) {
      setImageBusy(true);
      try {
        await deleteProductImage(session, product.id);
        setImageUrl(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not remove image');
      } finally {
        setImageBusy(false);
      }
    } else {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      setPendingFile(null);
      setPendingPreview(null);
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const buildInput = (): ProductInput => ({
    name: form.name.trim(),
    sku: form.sku.trim() || null,
    barcode: form.barcode.trim() || null,
    brand: form.brand.trim() || null,
    categoryId: form.categoryId || null,
    unitType: form.unitType.trim() || null,
    unitPrice: Number(form.unitPrice) || 0,
    costPrice: numOrNull(form.costPrice),
    quantityOnHand: Number(form.quantityOnHand) || 0,
    reorderLevel: numOrNull(form.reorderLevel),
    description: form.description.trim() || null,
    imageAltText: form.imageAltText.trim() || null,
    trackInventory: form.trackInventory,
    taxable: form.taxable,
    requiresWarehousePickup: form.requiresWarehousePickup,
    isActive: form.isActive,
  });

  const submit = async () => {
    if (!form.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (form.unitPrice.trim() === '' || Number.isNaN(Number(form.unitPrice))) {
      setError('A valid selling price is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input = buildInput();
      if (editing && product) {
        // Don't send stock changes the server would reject for QB-managed products.
        if (stockLocked) delete (input as Partial<ProductInput>).quantityOnHand;
        await updateProduct(session, product.id, input);
        router.push(`/products/${product.id}`);
      } else {
        const created = await createProduct(session, input);
        if (pendingFile) {
          try {
            await uploadProductImage(session, created.id, pendingFile);
          } catch {
            /* product created; image can be added later from edit */
          }
        }
        router.push(`/products/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save product');
      setSaving(false);
    }
  };

  const previewSrc = pendingPreview ?? imageUrl;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main fields */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Angle Grinder 4 inch" />
            </Field>
            <Field label="SKU">
              <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="e.g. GRND-4" />
            </Field>
            <Field label="Barcode">
              <Input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="e.g. 6001234599999" />
            </Field>
            <Field label="Brand">
              <Input value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="e.g. Bosch" />
            </Field>
            <Field label="Category">
              <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & stock</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Selling price (Rs.)" required>
              <Input
                inputMode="decimal"
                value={form.unitPrice}
                onChange={(e) => set('unitPrice', e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Cost price (Rs.)">
              <Input
                inputMode="decimal"
                value={form.costPrice}
                onChange={(e) => set('costPrice', e.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field label="Unit type">
              <Input value={form.unitType} onChange={(e) => set('unitType', e.target.value)} placeholder="e.g. PIECE, BAG, METER" />
            </Field>
            <Field label="Quantity on hand" hint={stockLocked ? 'Managed by QuickBooks' : undefined}>
              <Input
                inputMode="decimal"
                value={form.quantityOnHand}
                onChange={(e) => set('quantityOnHand', e.target.value)}
                disabled={stockLocked}
              />
            </Field>
            <Field label="Reorder level">
              <Input
                inputMode="decimal"
                value={form.reorderLevel}
                onChange={(e) => set('reorderLevel', e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleRow
              label="Track inventory"
              hint="Deduct stock as this product is sold."
              checked={form.trackInventory}
              onChange={(v) => set('trackInventory', v)}
            />
            <ToggleRow
              label="Taxable"
              hint="Apply tax/VAT to this product."
              checked={form.taxable}
              onChange={(v) => set('taxable', v)}
            />
            <ToggleRow
              label="Requires warehouse pickup"
              hint="Bulky/heavy items picked from the warehouse."
              checked={form.requiresWarehousePickup}
              onChange={(v) => set('requiresWarehousePickup', v)}
            />
            <ToggleRow
              label="Active"
              hint="Inactive products are hidden from the POS."
              checked={form.isActive}
              onChange={(v) => set('isActive', v)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Image + save */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProductImage src={previewSrc} alt={form.name || 'Product image'} className="aspect-square w-full" />
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPickFile(f);
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={imageBusy}
                onClick={() => fileInput.current?.click()}
              >
                {imageBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {previewSrc ? 'Replace' : 'Upload'}
              </Button>
              {previewSrc ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger"
                  disabled={imageBusy}
                  onClick={onRemoveImage}
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
            <Field label="Image alt text">
              <Input
                value={form.imageAltText}
                onChange={(e) => set('imageAltText', e.target.value)}
                placeholder="Describe the image"
              />
            </Field>
            <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, or GIF up to 5MB.</p>
          </CardContent>
        </Card>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex items-center gap-2">
          <Button size="lg" className="flex-1" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
          </Button>
          <Button size="lg" variant="ghost" onClick={() => router.back()} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
