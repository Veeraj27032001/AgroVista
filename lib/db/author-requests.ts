import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';

export type AuthorRequestStatus = 'pending' | 'approved' | 'rejected';

export type AuthorRequest = {
  id: string;
  userId: string;
  status: AuthorRequestStatus;
  note: string | null;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  user_id: string;
  status: AuthorRequestStatus;
  note: string | null;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const toRequest = (r: Row): AuthorRequest => ({
  id: r.id,
  userId: r.user_id,
  status: r.status,
  note: r.note,
  adminNote: r.admin_note,
  reviewedBy: r.reviewed_by,
  reviewedAt: r.reviewed_at,
  createdAt: r.created_at
});

export async function createAuthorRequest(userId: string, note?: string): Promise<AuthorRequest> {
  const { data, error } = await getSupabaseAdmin()
    .from('author_requests')
    .insert({ user_id: userId, note: note || null })
    .select('*')
    .single();
  if (error) throw error;
  return toRequest(data as Row);
}

export async function getLatestAuthorRequestForUser(userId: string): Promise<AuthorRequest | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('author_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toRequest(data as Row) : null;
}

export type AuthorRequestWithUser = AuthorRequest & { userName: string; userEmail: string };

export async function listAuthorRequestsWithUser(): Promise<AuthorRequestWithUser[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('author_requests')
    .select('*, users(name, email)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as (Row & { users: { name: string; email: string } | null })[]).map((r) => ({
    ...toRequest(r),
    userName: r.users?.name || '',
    userEmail: r.users?.email || ''
  }));
}

export async function getAuthorRequest(id: string): Promise<AuthorRequest | null> {
  const { data, error } = await getSupabaseAdmin().from('author_requests').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toRequest(data as Row) : null;
}

export async function actionAuthorRequest(
  id: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  adminNote?: string
): Promise<AuthorRequest> {
  const { data, error } = await getSupabaseAdmin()
    .from('author_requests')
    .update({ status, admin_note: adminNote || null, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toRequest(data as Row);
}
