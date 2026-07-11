'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Session } from '@/lib/auth';
import {
  CUSTOMER_TYPE_LABELS,
  createCustomer,
  updateCustomer,
  type CustomerInput,
  type CustomerType,
  type ManagedCustomer,
} from '@/lib/customers-api';
import { cn } from '@/lib/utils';

const TYPE_OPTIONS = Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[];

interface FormState {
  name: string;
  companyName: string;
  customerType: CustomerType;
  phone: string;
  email: string;
  billingAddress: string;
  taxNumber: string;
  creditAllowed: boolean;
  creditLimit: string;
  notes: string;
  isActive: boolean;
}

function initialState(c?: ManagedCustomer): FormState {
  return {
    name: c?.name ?? '',
    companyName: c?.companyName ?? '',
    customerType: c?.customerType ?? 'RETAIL',
    phone: c?.phone ?? '',
    email: c?.email ?? '',
    billingAddress: c?.billingAddress ?? '',
    taxNumber: c?.taxNumber ?? '',
    creditAllowed: c?.creditAllowed ?? false,
    creditLimit: c?.creditLimit != null ? String(c.creditLimit) : '',
    notes: c?.notes ?? '',
    isActive: c?.isActive ?? true,
  };
}

export function buildCustomerInput(form: FormState): CustomerInput {
  return {
    name: form.name.trim(),
    companyName: form.companyName.trim() || null,
    customerType: form.customerType,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    billingAddress: form.billingAddress.trim() || null,
    taxNumber: form.taxNumber.trim() || null,
    creditAllowed: form.creditAllowed,
    creditLimit: form.creditAllowed && form.creditLimit.trim() !== '' ? Number(form.creditLimit) : null,
    notes: form.notes.trim() || null,
    isActive: form.isActive,
  };
}

export function CustomerForm({
  session,
  customer,
}: {
  session: Session;
  customer?: ManagedCustomer;
}) {
  const router = useRouter();
  const editing = !!customer;
  const [form, setForm] = React.useState<FormState>(() => initialState(customer));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.name.trim()) {
      setError('Customer name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input = buildCustomerInput(form);
      const saved =
        editing && customer
          ? await updateCustomer(session, customer.id, input)
          : await createCustomer(session, input);
      router.push(`/customers/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save customer');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ravi Perera" />
          </Field>
          <Field label="Business / company name">
            <Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Customer type">
            <Select value={form.customerType} onChange={(e) => set('customerType', e.target.value as CustomerType)}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {CUSTOMER_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="e.g. 077 123 4567" />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Textarea value={form.billingAddress} onChange={(e) => set('billingAddress', e.target.value)} rows={2} placeholder="Optional" />
          </Field>
          <Field label="Tax / VAT number">
            <Input value={form.taxNumber} onChange={(e) => set('taxNumber', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Notes">
            <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-3">
            <div>
              <div className="text-sm font-medium">Allow credit / pay-later</div>
              <div className="text-xs text-muted-foreground">
                Let this customer take credit and partial-payment sales.
              </div>
            </div>
            <Switch checked={form.creditAllowed} onCheckedChange={(v) => set('creditAllowed', v)} />
          </div>
          {form.creditAllowed ? (
            <Field label="Credit limit (Rs.)">
              <Input
                inputMode="decimal"
                value={form.creditLimit}
                onChange={(e) => set('creditLimit', e.target.value)}
                placeholder="Leave blank for no limit"
              />
            </Field>
          ) : null}
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-3">
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-muted-foreground">Inactive customers are hidden from the POS.</div>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(v) => set('isActive', v)} />
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex items-center gap-2">
        <Button size="lg" onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create customer'}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
