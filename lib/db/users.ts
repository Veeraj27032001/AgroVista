import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { User } from '@/lib/types';

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  phone: string | null;
  address: string | null;
  state_id: string | null;
  district_id: string | null;
  taluk_id: string | null;
  city: string | null;
  pincode: string | null;
  role: 'user' | 'admin';
  created_at: string;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    stateId: row.state_id,
    districtId: row.district_id,
    talukId: row.taluk_id,
    city: row.city,
    pincode: row.pincode,
    role: row.role,
    createdAt: row.created_at
  };
}

export async function createUser(params: {
  name: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  address?: string;
  stateId?: string;
  districtId?: string;
  talukId?: string;
  city?: string;
  pincode?: string;
}): Promise<User> {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .insert({
      name: params.name,
      email: params.email.toLowerCase(),
      password_hash: params.passwordHash || null,
      phone: params.phone || null,
      address: params.address || null,
      state_id: params.stateId || null,
      district_id: params.districtId || null,
      taluk_id: params.talukId || null,
      city: params.city || null,
      pincode: params.pincode || null
    })
    .select('*')
    .single();
  if (error) throw error;
  return toUser(data as UserRow);
}

export async function findUserByEmail(email: string): Promise<(User & { passwordHash: string | null }) | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as UserRow;
  return { ...toUser(row), passwordHash: row.password_hash };
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await getSupabaseAdmin().from('users').select('*').eq('phone', phone).maybeSingle();
  if (error) throw error;
  return data ? toUser(data as UserRow) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const { data, error } = await getSupabaseAdmin().from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toUser(data as UserRow) : null;
}

export async function updateUserProfile(
  id: string,
  fields: Partial<{ name: string; phone: string; address: string; stateId: string; districtId: string; talukId: string; city: string; pincode: string }>
): Promise<User> {
  const patch: Record<string, unknown> = {};
  if (fields.name !== undefined) patch.name = fields.name;
  if (fields.phone !== undefined) patch.phone = fields.phone;
  if (fields.address !== undefined) patch.address = fields.address;
  if (fields.stateId !== undefined) patch.state_id = fields.stateId || null;
  if (fields.districtId !== undefined) patch.district_id = fields.districtId || null;
  if (fields.talukId !== undefined) patch.taluk_id = fields.talukId || null;
  if (fields.city !== undefined) patch.city = fields.city;
  if (fields.pincode !== undefined) patch.pincode = fields.pincode;

  const { data, error } = await getSupabaseAdmin().from('users').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return toUser(data as UserRow);
}

export async function updateUserPasswordHash(id: string, passwordHash: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('users').update({ password_hash: passwordHash }).eq('id', id);
  if (error) throw error;
}

/** Mandatory for ordering/delivery — enforced at checkout regardless of how the account was created. */
export function isProfileComplete(user: User): boolean {
  return Boolean(user.phone && user.address && user.city && user.pincode && user.stateId && user.districtId && user.talukId);
}

export async function listUsers(): Promise<User[]> {
  const { data, error } = await getSupabaseAdmin().from('users').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as UserRow[]).map(toUser);
}
