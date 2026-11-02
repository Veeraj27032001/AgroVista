// One-time: strips the zero-padding from existing article codes, invoice
// numbers, and support request numbers now that new ones are generated
// without padding (AGX-2026-2 instead of AGX-2026-000002). Safe to re-run —
// rows that are already in the new format are left untouched.
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket }
});

async function renumber(table, column, idColumn, pattern) {
  const { data, error } = await sb.from(table).select(`${idColumn}, ${column}`).not(column, 'is', null);
  if (error) throw error;

  let updated = 0;
  for (const row of data) {
    const value = row[column];
    const match = value.match(pattern);
    if (!match) continue;
    const [, prefix, counter] = match;
    const stripped = `${prefix}${parseInt(counter, 10)}`;
    if (stripped === value) continue;

    const { error: updateError } = await sb.from(table).update({ [column]: stripped }).eq(idColumn, row[idColumn]);
    if (updateError) {
      console.error(`Failed to update ${table}.${idColumn}=${row[idColumn]}:`, updateError.message);
      continue;
    }
    console.log(`${table}: ${value} -> ${stripped}`);
    updated++;
  }
  console.log(`${table}: ${updated} of ${data.length} renumbered.\n`);
}

async function main() {
  await renumber('article_submissions', 'article_code', 'id', /^(AGX-\d{4}-)0*(\d+)$/);
  await renumber('support_requests', 'request_number', 'id', /^(REQ-\d{4}-)0*(\d+)$/);
  await renumber('invoices', 'invoice_number', 'id', /^(AGX(?:\/CN)?\/\d{4}-\d{2}\/)0*(\d+)$/);
}

main().catch((err) => {
  console.error('Renumber failed:', err.message);
  process.exit(1);
});
