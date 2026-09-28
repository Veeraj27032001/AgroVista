import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';

export type LocationOption = { id: string; name: string };

export async function getStateName(stateId: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin().from('states').select('name').eq('id', stateId).maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}

export async function getDistrictName(districtId: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin().from('districts').select('name').eq('id', districtId).maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}

export async function getTalukName(talukId: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin().from('taluks').select('name').eq('id', talukId).maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}

export async function listStates(): Promise<LocationOption[]> {
  const { data, error } = await getSupabaseAdmin().from('states').select('id, name').order('name', { ascending: true });
  if (error) throw error;
  return data as LocationOption[];
}

export async function listDistricts(stateId: string): Promise<LocationOption[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('districts')
    .select('id, name')
    .eq('state_id', stateId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data as LocationOption[];
}

export async function listTaluks(districtId: string): Promise<LocationOption[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('taluks')
    .select('id, name')
    .eq('district_id', districtId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data as LocationOption[];
}
