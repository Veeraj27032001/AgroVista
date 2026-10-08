import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';

export type EntitlementSource = 'purchase' | 'subscription' | 'subscription_archive' | 'admin_grant';
export type EntitlementStatus = 'active' | 'revoked';

export type Entitlement = {
  id: string;
  userId: string;
  issueId: string;
  source: EntitlementSource;
  orderItemId: string | null;
  subscriptionId: string | null;
  grantedBy: string | null;
  status: EntitlementStatus;
  grantedAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
};

type Row = {
  id: string;
  user_id: string;
  issue_id: string;
  source: EntitlementSource;
  order_item_id: string | null;
  subscription_id: string | null;
  granted_by: string | null;
  status: EntitlementStatus;
  granted_at: string;
  revoked_at: string | null;
  revoke_reason: string | null;
};

const toEntitlement = (r: Row): Entitlement => ({
  id: r.id,
  userId: r.user_id,
  issueId: r.issue_id,
  source: r.source,
  orderItemId: r.order_item_id,
  subscriptionId: r.subscription_id,
  grantedBy: r.granted_by,
  status: r.status,
  grantedAt: r.granted_at,
  revokedAt: r.revoked_at,
  revokeReason: r.revoke_reason
});

export async function grantEntitlement(params: {
  userId: string;
  issueId: string;
  source: EntitlementSource;
  orderItemId?: string;
  subscriptionId?: string;
  grantedBy?: string;
}): Promise<Entitlement> {
  const { data, error } = await getSupabaseAdmin()
    .from('entitlements')
    .insert({
      user_id: params.userId,
      issue_id: params.issueId,
      source: params.source,
      order_item_id: params.orderItemId ?? null,
      subscription_id: params.subscriptionId ?? null,
      granted_by: params.grantedBy ?? null
    })
    .select('*')
    .single();
  if (error) throw error;
  return toEntitlement(data as Row);
}

export async function revokeEntitlement(id: string, reason: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('entitlements')
    .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoke_reason: reason })
    .eq('id', id);
  if (error) throw error;
}

/** Revokes every active entitlement a specific order item granted (e.g. on refund of that line). */
export async function revokeEntitlementsForOrderItem(orderItemId: string, reason: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('entitlements')
    .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoke_reason: reason })
    .eq('order_item_id', orderItemId)
    .eq('status', 'active');
  if (error) throw error;
}

/** Revokes every active subscription_archive entitlement for a subscription (called when it ends). */
export async function revokeArchiveEntitlementsForSubscription(subscriptionId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('entitlements')
    .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoke_reason: 'subscription_ended' })
    .eq('subscription_id', subscriptionId)
    .eq('source', 'subscription_archive')
    .eq('status', 'active');
  if (error) throw error;
}

/** The single access check: can this user read this issue right now? */
export async function hasActiveEntitlement(userId: string, issueId: string): Promise<boolean> {
  const { count, error } = await getSupabaseAdmin()
    .from('entitlements')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('issue_id', issueId)
    .eq('status', 'active');
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function listEntitlementsForUser(userId: string): Promise<Entitlement[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('granted_at', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toEntitlement);
}
