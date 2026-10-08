const STATUS_VARIANT: Record<string, string> = {
  active: 'success',
  paid: 'success',
  delivered: 'success',
  accepted: 'success',
  published: 'success',
  actioned: 'success',
  expired: 'danger',
  cancelled: 'danger',
  failed: 'danger',
  rejected: 'danger',
  refund_failed: 'danger',
  draft: 'secondary',
  pending: 'warning',
  reviewed: 'warning',
  processing: 'warning',
  out_for_delivery: 'warning',
  under_review: 'warning',
  resubmitted: 'warning',
  revision_required: 'warning',
  return_requested: 'warning',
  refund_initiated: 'warning',
  refund_processing: 'warning',
  reissue_initiated: 'warning',
  new_copy_dispatched: 'warning',
  reissue_delivered: 'success',
  submitted: 'warning',
  payment_pending: 'warning',
  partially_paid: 'primary',
  payment_completed: 'success',
  scheduled: 'primary'
};

export default function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status] || 'secondary';
  return <span className={`badge rounded-pill text-bg-${variant}`}>{status.replace(/_/g, ' ')}</span>;
}
