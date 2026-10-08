import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket }
});

// Defaults from AgriOxen_Functional_Specification.md §13.
const DEFAULTS = {
  pending_order_minutes: 30,
  max_pending_orders_per_user: 3,
  max_print_qty_per_line: 10,
  problem_window_days: 7,
  not_received_after_days: 3,
  shipment_overdue_days: 10,
  subscription_grace_days: 7,
  subscription_address_cutoff_days: 5,
  renewal_reminder_issues_left: 2,
  article_payment_deadline_days: 15,
  article_min_contribution_paise: 10000,
  article_reminder_days_before: [7, 2],
  manuscript_max_mb: 10,
  manuscript_word_warning: 2000,
  preview_pages_default: 4,
  request_auto_close_days: 7,
  business_details: {
    legal_name: '',
    address: '',
    gstin: '',
    state: '',
    support_email: '',
    support_phone: ''
  }
};

async function main() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const { data: existing } = await sb.from('settings').select('key').eq('key', key).maybeSingle();
    if (existing) {
      console.log(`skip (exists): ${key}`);
      continue;
    }
    const { error } = await sb.from('settings').insert({ key, value });
    if (error) throw error;
    console.log(`seeded: ${key} = ${JSON.stringify(value)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
