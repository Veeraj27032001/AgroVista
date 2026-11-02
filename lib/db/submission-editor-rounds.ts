import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import { assignEditor, clearEditorAssignment } from '@/lib/db/submissions';

export type EditorRoundStatus = 'pending' | 'accepted' | 'cancelled';

export type EditorRound = {
  id: string;
  submissionId: string;
  editorId: string;
  editorName: string | null;
  assignedBy: string | null;
  assignRemarks: string | null;
  assignedAt: string;
  forwardedAt: string | null;
  forwardRemarks: string | null;
  hasAttachment: boolean;
  status: EditorRoundStatus;
  decidedAt: string | null;
  decidedBy: string | null;
};

type Row = {
  id: string;
  submission_id: string;
  editor_id: string;
  assigned_by: string | null;
  assign_remarks: string | null;
  assigned_at: string;
  forwarded_at: string | null;
  forward_remarks: string | null;
  has_attachment: boolean;
  status: EditorRoundStatus;
  decided_at: string | null;
  decided_by: string | null;
  editor?: { name: string } | null;
};

const toRound = (r: Row): EditorRound => ({
  id: r.id,
  submissionId: r.submission_id,
  editorId: r.editor_id,
  editorName: r.editor?.name ?? null,
  assignedBy: r.assigned_by,
  assignRemarks: r.assign_remarks,
  assignedAt: r.assigned_at,
  forwardedAt: r.forwarded_at,
  forwardRemarks: r.forward_remarks,
  hasAttachment: r.has_attachment,
  status: r.status,
  decidedAt: r.decided_at,
  decidedBy: r.decided_by
});

/** Full history, newest first — three FKs to users on this table, so every embed needs an explicit hint. */
export async function listEditorRounds(submissionId: string): Promise<EditorRound[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('submission_editor_rounds')
    .select('*, editor:users!submission_editor_rounds_editor_id_fkey(name)')
    .eq('submission_id', submissionId)
    .order('assigned_at', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toRound);
}

/** The round admin is currently waiting on or deciding on, if any. */
export async function getActiveEditorRound(submissionId: string): Promise<EditorRound | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('submission_editor_rounds')
    .select('*, editor:users!submission_editor_rounds_editor_id_fkey(name)')
    .eq('submission_id', submissionId)
    .eq('status', 'pending')
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toRound(data as Row) : null;
}

/** Admin forwards (or re-forwards) to an editor — starts a new round and mirrors the shortcut fields on article_submissions. */
export async function startEditorRound(params: {
  submissionId: string;
  editorId: string;
  assignedBy: string;
  remarks: string;
}): Promise<EditorRound> {
  const { data, error } = await getSupabaseAdmin()
    .from('submission_editor_rounds')
    .insert({
      submission_id: params.submissionId,
      editor_id: params.editorId,
      assigned_by: params.assignedBy,
      assign_remarks: params.remarks
    })
    .select('*, editor:users!submission_editor_rounds_editor_id_fkey(name)')
    .single();
  if (error) throw error;
  await assignEditor(params.submissionId, params.editorId);
  return toRound(data as Row);
}

/** Editor forwards their round back to admin — hasAttachment drives whether admin later sees Accept or only Cancel. */
export async function forwardEditorRound(roundId: string, submissionId: string, hasAttachment: boolean, remarks: string): Promise<EditorRound> {
  const { data, error } = await getSupabaseAdmin()
    .from('submission_editor_rounds')
    .update({ forwarded_at: new Date().toISOString(), forward_remarks: remarks || null, has_attachment: hasAttachment })
    .eq('id', roundId)
    .select('*, editor:users!submission_editor_rounds_editor_id_fkey(name)')
    .single();
  if (error) throw error;
  await getSupabaseAdmin().from('article_submissions').update({ editor_forwarded_at: new Date().toISOString() }).eq('id', submissionId);
  return toRound(data as Row);
}

/** Admin accepts (only valid when the round has an attachment) or cancels the round. */
export async function decideEditorRound(
  roundId: string,
  submissionId: string,
  decision: 'accepted' | 'cancelled',
  decidedBy: string
): Promise<EditorRound> {
  const { data, error } = await getSupabaseAdmin()
    .from('submission_editor_rounds')
    .update({ status: decision, decided_at: new Date().toISOString(), decided_by: decidedBy })
    .eq('id', roundId)
    .select('*, editor:users!submission_editor_rounds_editor_id_fkey(name)')
    .single();
  if (error) throw error;
  await clearEditorAssignment(submissionId);
  return toRound(data as Row);
}
