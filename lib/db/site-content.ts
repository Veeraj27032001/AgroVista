import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function getSiteContentMap(): Promise<Record<string, string>> {
  const { data, error } = await getSupabaseAdmin().from('site_content').select('key, value');
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data as { key: string; value: string }[]) map[row.key] = row.value;
  return map;
}

export async function setSiteContentBulk(entries: { key: string; value: string }[]): Promise<void> {
  const rows = entries.map((e) => ({ key: e.key, value: e.value, updated_at: new Date().toISOString() }));
  const { error } = await getSupabaseAdmin().from('site_content').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
}
