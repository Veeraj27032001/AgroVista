import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await getSupabaseAdmin().from('settings').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return data ? (data.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const { error } = await getSupabaseAdmin().from('settings').upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const { data, error } = await getSupabaseAdmin().from('settings').select('key, value');
  if (error) throw error;
  const map: Record<string, unknown> = {};
  for (const row of data as { key: string; value: unknown }[]) map[row.key] = row.value;
  return map;
}
