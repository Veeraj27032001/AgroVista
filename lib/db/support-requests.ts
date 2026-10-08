import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';

export type SupportRequestType =
  | 'damaged'
  | 'wrong_issue'
  | 'missing_pages'
  | 'not_received'
  | 'digital_access'
  | 'duplicate_purchase'
  | 'subscription_query'
  | 'other';
export type SupportRequestStatus = 'open' | 'in_review' | 'approved' | 'rejected' | 'resolved' | 'closed';
export type SupportResolution = 'replace' | 'refund' | 'access_restored' | 'no_action';

export type SupportRequest = {
  id: string;
  requestNumber: string;
  userId: string;
  type: SupportRequestType;
  legacyIssueOrderId: string | null;
  subscriptionId: string | null;
  description: string;
  attachmentKeys: string[];
  status: SupportRequestStatus;
  resolution: SupportResolution | null;
  resolutionNote: string | null;
  handledBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  request_number: string;
  user_id: string;
  type: SupportRequestType;
  legacy_issue_order_id: string | null;
  subscription_id: string | null;
  description: string;
  attachment_keys: string[];
  status: SupportRequestStatus;
  resolution: SupportResolution | null;
  resolution_note: string | null;
  handled_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

const toRequest = (r: Row): SupportRequest => ({
  id: r.id,
  requestNumber: r.request_number,
  userId: r.user_id,
  type: r.type,
  legacyIssueOrderId: r.legacy_issue_order_id,
  subscriptionId: r.subscription_id,
  description: r.description,
  attachmentKeys: r.attachment_keys || [],
  status: r.status,
  resolution: r.resolution,
  resolutionNote: r.resolution_note,
  handledBy: r.handled_by,
  resolvedAt: r.resolved_at,
  createdAt: r.created_at
});

async function generateRequestNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const db = getSupabaseAdmin();
  const { count } = await db.from('support_requests').select('*', { count: 'exact', head: true }).like('request_number', `REQ-${year}-%`);
  return `REQ-${year}-${String((count ?? 0) + 1).padStart(6, '0')}`;
}

export async function createSupportRequest(params: {
  userId: string;
  type: SupportRequestType;
  legacyIssueOrderId?: string;
  subscriptionId?: string;
  description: string;
  attachmentKeys?: string[];
}): Promise<SupportRequest> {
  const requestNumber = await generateRequestNumber();
  const { data, error } = await getSupabaseAdmin()
    .from('support_requests')
    .insert({
      request_number: requestNumber,
      user_id: params.userId,
      type: params.type,
      legacy_issue_order_id: params.legacyIssueOrderId || null,
      subscription_id: params.subscriptionId || null,
      description: params.description,
      attachment_keys: params.attachmentKeys || []
    })
    .select('*')
    .single();
  if (error) throw error;
  return toRequest(data as Row);
}

export async function listSupportRequestsForUser(userId: string): Promise<SupportRequest[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('support_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toRequest);
}

export type SupportRequestWithUser = SupportRequest & { userEmail: string };

export async function listAllSupportRequestsWithUser(): Promise<SupportRequestWithUser[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('support_requests')
    .select('*, users(email)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as (Row & { users: { email: string } | null })[]).map((r) => ({ ...toRequest(r), userEmail: r.users?.email || '' }));
}

export async function getSupportRequest(id: string): Promise<SupportRequest | null> {
  const { data, error } = await getSupabaseAdmin().from('support_requests').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toRequest(data as Row) : null;
}

export async function actionSupportRequest(
  id: string,
  params: { status: SupportRequestStatus; resolution?: SupportResolution; resolutionNote?: string; handledBy: string }
): Promise<SupportRequest> {
  const { data, error } = await getSupabaseAdmin()
    .from('support_requests')
    .update({
      status: params.status,
      resolution: params.resolution || null,
      resolution_note: params.resolutionNote || null,
      handled_by: params.handledBy,
      resolved_at: ['resolved', 'rejected', 'closed'].includes(params.status) ? new Date().toISOString() : null
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toRequest(data as Row);
}

// ---- support_messages ----

export type SupportMessage = { id: string; supportRequestId: string; senderUserId: string | null; isStaff: boolean; body: string; createdAt: string };

type MessageRow = { id: string; support_request_id: string; sender_user_id: string | null; is_staff: boolean; body: string; created_at: string };

const toMessage = (r: MessageRow): SupportMessage => ({
  id: r.id,
  supportRequestId: r.support_request_id,
  senderUserId: r.sender_user_id,
  isStaff: r.is_staff,
  body: r.body,
  createdAt: r.created_at
});

export async function listSupportMessages(supportRequestId: string): Promise<SupportMessage[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('support_messages')
    .select('*')
    .eq('support_request_id', supportRequestId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as MessageRow[]).map(toMessage);
}

export async function createSupportMessage(supportRequestId: string, senderUserId: string | null, isStaff: boolean, body: string): Promise<SupportMessage> {
  const { data, error } = await getSupabaseAdmin()
    .from('support_messages')
    .insert({ support_request_id: supportRequestId, sender_user_id: senderUserId, is_staff: isStaff, body })
    .select('*')
    .single();
  if (error) throw error;
  return toMessage(data as MessageRow);
}
