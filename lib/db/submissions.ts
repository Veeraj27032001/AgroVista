import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { ArticleSubmission, SubmissionStatus, SubmissionVersion } from '@/lib/types';

type SubmissionRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  language: string;
  status: SubmissionStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

const toSubmission = (r: SubmissionRow): ArticleSubmission => ({
  id: r.id,
  userId: r.user_id,
  title: r.title,
  description: r.description,
  language: r.language,
  status: r.status,
  adminNote: r.admin_note,
  createdAt: r.created_at,
  updatedAt: r.updated_at
});

type VersionRow = {
  id: string;
  submission_id: string;
  version_number: number;
  word_path: string;
  pdf_path: string;
  submitted_by: 'user' | 'admin';
  is_admin_edit: boolean;
  created_at: string;
};

const toVersion = (r: VersionRow): SubmissionVersion => ({
  id: r.id,
  submissionId: r.submission_id,
  versionNumber: r.version_number,
  wordPath: r.word_path,
  pdfPath: r.pdf_path,
  submittedBy: r.submitted_by,
  isAdminEdit: r.is_admin_edit,
  createdAt: r.created_at
});

export async function createSubmission(params: {
  userId: string;
  title: string;
  description?: string;
  language?: string;
}): Promise<ArticleSubmission> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_submissions')
    .insert({
      user_id: params.userId,
      title: params.title,
      description: params.description || null,
      language: params.language || 'English'
    })
    .select('*')
    .single();
  if (error) throw error;
  return toSubmission(data as SubmissionRow);
}

export async function listSubmissionsForUser(userId: string): Promise<ArticleSubmission[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SubmissionRow[]).map(toSubmission);
}

export async function listAllSubmissions(status?: SubmissionStatus): Promise<ArticleSubmission[]> {
  let query = getSupabaseAdmin().from('article_submissions').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data as SubmissionRow[]).map(toSubmission);
}

export type SubmissionWithUser = ArticleSubmission & { userEmail: string };

export async function listAllSubmissionsWithUser(status?: SubmissionStatus): Promise<SubmissionWithUser[]> {
  let query = getSupabaseAdmin().from('article_submissions').select('*, users(email)').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data as (SubmissionRow & { users: { email: string } | null })[]).map((r) => ({ ...toSubmission(r), userEmail: r.users?.email || '' }));
}

export async function getSubmission(id: string): Promise<ArticleSubmission | null> {
  const { data, error } = await getSupabaseAdmin().from('article_submissions').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toSubmission(data as SubmissionRow) : null;
}

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
  adminNote?: string
): Promise<ArticleSubmission> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_submissions')
    .update({ status, admin_note: adminNote ?? null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toSubmission(data as SubmissionRow);
}

export async function listVersionsForSubmission(submissionId: string): Promise<SubmissionVersion[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('submission_versions')
    .select('*')
    .eq('submission_id', submissionId)
    .order('version_number', { ascending: true });
  if (error) throw error;
  return (data as VersionRow[]).map(toVersion);
}

export async function nextVersionNumber(submissionId: string): Promise<number> {
  const versions = await listVersionsForSubmission(submissionId);
  const userVersions = versions.filter((v) => !v.isAdminEdit);
  return userVersions.length + 1;
}

export async function createSubmissionVersion(params: {
  submissionId: string;
  versionNumber: number;
  wordPath: string;
  pdfPath: string;
  submittedBy: 'user' | 'admin';
  isAdminEdit?: boolean;
}): Promise<SubmissionVersion> {
  const { data, error } = await getSupabaseAdmin()
    .from('submission_versions')
    .insert({
      submission_id: params.submissionId,
      version_number: params.versionNumber,
      word_path: params.wordPath,
      pdf_path: params.pdfPath,
      submitted_by: params.submittedBy,
      is_admin_edit: params.isAdminEdit ?? false
    })
    .select('*')
    .single();
  if (error) throw error;
  return toVersion(data as VersionRow);
}
