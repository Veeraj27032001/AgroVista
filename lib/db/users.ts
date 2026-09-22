import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { User } from '@/lib/types';

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
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
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    role: row.role,
    createdAt: row.created_at
  };
}

export async function createUser(params: {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}): Promise<User> {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .insert({
      name: params.name,
      email: params.email.toLowerCase(),
      password_hash: params.passwordHash,
      phone: params.phone || null,
      address: params.address || null,
      city: params.city || null,
      state: params.state || null,
      pincode: params.pincode || null
    })
    .select('*')
    .single();
  if (error) throw error;
  return toUser(data as UserRow);
}

export async function findUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
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
  fields: Partial<Pick<User, 'name' | 'phone' | 'address' | 'city' | 'state' | 'pincode'>>
): Promise<User> {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .update(fields)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toUser(data as UserRow);
}

export async function updateUserPasswordHash(id: string, passwordHash: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('users').update({ password_hash: passwordHash }).eq('id', id);
  if (error) throw error;
}

export async function listUsers(): Promise<User[]> {
  const { data, error } = await getSupabaseAdmin().from('users').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as UserRow[]).map(toUser);
}
