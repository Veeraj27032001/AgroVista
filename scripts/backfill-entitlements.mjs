import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket }
});

async function main() {
  const { data: orders, error } = await sb
    .from('issue_orders')
    .select('id, user_id, issue_id, format')
    .eq('payment_status', 'paid')
    .in('format', ['soft', 'both']);
  if (error) throw error;

  console.log(`Found ${orders.length} paid soft/both issue_orders to backfill.`);
  let created = 0;
  let skipped = 0;

  for (const o of orders) {
    const { data: existing } = await sb
      .from('entitlements')
      .select('id')
      .eq('user_id', o.user_id)
      .eq('issue_id', o.issue_id)
      .eq('order_item_id', o.id)
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }
    const { error: insertError } = await sb.from('entitlements').insert({
      user_id: o.user_id,
      issue_id: o.issue_id,
      source: 'purchase',
      order_item_id: o.id,
      status: 'active'
    });
    if (insertError) throw insertError;
    created++;
  }

  console.log(`Backfill done. Created ${created}, already present ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
