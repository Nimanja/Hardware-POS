'use client';

import { PageHeader } from '@/components/page-header';
import { QuotationBuilder } from '@/components/quotations/quotation-builder';

export default function NewQuotationPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="New quotation"
        description="Build a priced offer for a customer. Totals are calculated on the server."
      />
      <QuotationBuilder mode="create" />
    </div>
  );
}
