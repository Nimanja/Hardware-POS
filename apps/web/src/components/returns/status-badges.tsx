import {
  REFUND_STATUS_LABELS,
  RETURN_STATUS_LABELS,
  type RefundStatusCode,
  type ReturnStatusCode,
  type SaleReturnStatusCode,
} from '@hardware-pos/shared';

import { Badge, type BadgeProps } from '@/components/ui/badge';

type Variant = BadgeProps['variant'];

const RETURN_STATUS_VARIANT: Record<ReturnStatusCode, Variant> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  FAILED: 'danger',
};

const REFUND_STATUS_VARIANT: Record<RefundStatusCode, Variant> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'danger',
};

export function ReturnStatusBadge({ status }: { status: ReturnStatusCode }) {
  return <Badge variant={RETURN_STATUS_VARIANT[status]}>{RETURN_STATUS_LABELS[status]}</Badge>;
}

export function RefundStatusBadge({ status }: { status: RefundStatusCode }) {
  return <Badge variant={REFUND_STATUS_VARIANT[status]}>{REFUND_STATUS_LABELS[status]}</Badge>;
}

/** Shown on the Sales list / Sale detail to indicate how much of a sale was returned. */
export function SaleReturnStatusBadge({ status }: { status: SaleReturnStatusCode }) {
  if (status === 'NOT_RETURNED') return null;
  return (
    <Badge variant={status === 'FULLY_RETURNED' ? 'danger' : 'warning'}>
      {status === 'FULLY_RETURNED' ? 'Fully Returned' : 'Partially Returned'}
    </Badge>
  );
}
