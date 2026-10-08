export const SETTINGS_FIELDS: { key: string; label: string; type: 'number' | 'json'; help?: string }[] = [
  { key: 'pending_order_minutes', label: 'Pending order expiry (minutes)', type: 'number' },
  { key: 'max_pending_orders_per_user', label: 'Max pending orders per user', type: 'number' },
  { key: 'max_print_qty_per_line', label: 'Max print quantity per cart line', type: 'number' },
  { key: 'problem_window_days', label: 'Days to report a delivery problem', type: 'number' },
  { key: 'not_received_after_days', label: '"Not received" eligible after (days past expected delivery)', type: 'number' },
  { key: 'shipment_overdue_days', label: 'Shipment flagged overdue after (days)', type: 'number' },
  { key: 'subscription_grace_days', label: 'Autopay failure grace period (days)', type: 'number' },
  { key: 'subscription_address_cutoff_days', label: 'Subscription address-change cutoff (days before publish)', type: 'number' },
  { key: 'renewal_reminder_issues_left', label: 'Renewal reminder when issues left ≤', type: 'number' },
  { key: 'article_payment_deadline_days', label: 'Article payment deadline (days after acceptance)', type: 'number' },
  { key: 'article_min_contribution_paise', label: 'Minimum article contribution (paise)', type: 'number', help: '₹100 = 10000' },
  { key: 'manuscript_max_mb', label: 'Max manuscript size (MB)', type: 'number' },
  { key: 'manuscript_word_warning', label: 'Manuscript word-count warning threshold', type: 'number' },
  { key: 'preview_pages_default', label: 'Default free preview pages', type: 'number' },
  { key: 'request_auto_close_days', label: 'Auto-close resolved help requests after (days)', type: 'number' },
  { key: 'article_reminder_days_before', label: 'Article payment reminder days-before (JSON array)', type: 'json' },
  { key: 'business_details', label: 'Business details for invoices (JSON)', type: 'json' }
];
