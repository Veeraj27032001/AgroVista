import 'server-only';
import crypto from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { ArticleCoAuthor, ArticleSubmission, SubmissionStatus, SubmissionVersion } from '@/lib/types';

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
  article_code: string | null;
  theme: string | null;
  theme_other: string | null;
  word_count: number | null;
  author_salutation: string | null;
  author_first_name: string | null;
  author_last_name: string | null;
  author_email: string | null;
  author_phone: string | null;
  author_affiliation: string | null;
  author_designation: string | null;
  author_city: string | null;
  author_state: string | null;
  author_country: string | null;
  publication_charge: number | null;
  amount_paid: number;
  contribution_token: string | null;
  volume_number: number | null;
  issue_number: number | null;
  publication_month: number | null;
  publication_year: number | null;
  page_range: string | null;
  published_date: string | null;
  article_url: string | null;
  reject_reason: string | null;
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
  updatedAt: r.updated_at,
  articleCode: r.article_code,
  theme: r.theme,
  themeOther: r.theme_other,
  wordCount: r.word_count,
  authorSalutation: r.author_salutation,
  authorFirstName: r.author_first_name,
  authorLastName: r.author_last_name,
  authorEmail: r.author_email,
  authorPhone: r.author_phone,
  authorAffiliation: r.author_affiliation,
  authorDesignation: r.author_designation,
  authorCity: r.author_city,
  authorState: r.author_state,
  authorCountry: r.author_country,
  publicationCharge: r.publication_charge === null ? null : Number(r.publication_charge),
  amountPaid: Number(r.amount_paid),
  contributionToken: r.contribution_token,
  volumeNumber: r.volume_number,
  issueNumber: r.issue_number,
  publicationMonth: r.publication_month,
  publicationYear: r.publication_year,
  pageRange: r.page_range,
  publishedDate: r.published_date,
  articleUrl: r.article_url,
  rejectReason: r.reject_reason
});

type VersionRow = {
  id: string;
  submission_id: string;
  version_number: number;
  word_path: string;
  pdf_path: string | null;
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

type CoAuthorRow = {
  id: string;
  submission_id: string;
  position: number;
  salutation: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  affiliation: string | null;
  designation: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  created_at: string;
};

const toCoAuthor = (r: CoAuthorRow): ArticleCoAuthor => ({
  id: r.id,
  submissionId: r.submission_id,
  position: r.position,
  salutation: r.salutation,
  firstName: r.first_name,
  lastName: r.last_name,
  email: r.email,
  phone: r.phone,
  affiliation: r.affiliation,
  designation: r.designation,
  city: r.city,
  state: r.state,
  country: r.country,
  createdAt: r.created_at
});

async function generateArticleCode(): Promise<string> {
  const year = new Date().getFullYear();
  const db = getSupabaseAdmin();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { count } = await db
      .from('article_submissions')
      .select('*', { count: 'exact', head: true })
      .like('article_code', `AGX-${year}-%`);
    const next = (count ?? 0) + 1 + attempt;
    const code = `AGX-${year}-${String(next).padStart(6, '0')}`;
    const { data: existing } = await db.from('article_submissions').select('id').eq('article_code', code).maybeSingle();
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique article code.');
}

export type CoAuthorInput = {
  salutation?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  affiliation?: string;
  designation?: string;
  city?: string;
  state?: string;
  country?: string;
};

export async function createSubmission(params: {
  userId: string;
  title: string;
  description?: string;
  language?: string;
  theme: string;
  themeOther?: string;
  wordCount?: number;
  authorSalutation?: string;
  authorFirstName: string;
  authorLastName: string;
  authorEmail: string;
  authorPhone?: string;
  authorAffiliation?: string;
  authorDesignation?: string;
  authorCity?: string;
  authorState?: string;
  authorCountry?: string;
  coAuthors?: CoAuthorInput[];
}): Promise<ArticleSubmission> {
  const articleCode = await generateArticleCode();
  const { data, error } = await getSupabaseAdmin()
    .from('article_submissions')
    .insert({
      user_id: params.userId,
      title: params.title,
      description: params.description || null,
      language: params.language || 'English',
      article_code: articleCode,
      theme: params.theme,
      theme_other: params.themeOther || null,
      word_count: params.wordCount ?? null,
      author_salutation: params.authorSalutation || null,
      author_first_name: params.authorFirstName,
      author_last_name: params.authorLastName,
      author_email: params.authorEmail,
      author_phone: params.authorPhone || null,
      author_affiliation: params.authorAffiliation || null,
      author_designation: params.authorDesignation || null,
      author_city: params.authorCity || null,
      author_state: params.authorState || null,
      author_country: params.authorCountry || 'India'
    })
    .select('*')
    .single();
  if (error) throw error;
  const submission = toSubmission(data as SubmissionRow);

  if (params.coAuthors?.length) {
    const rows = params.coAuthors.map((c, i) => ({
      submission_id: submission.id,
      position: i + 1,
      salutation: c.salutation || null,
      first_name: c.firstName,
      last_name: c.lastName,
      email: c.email,
      phone: c.phone || null,
      affiliation: c.affiliation || null,
      designation: c.designation || null,
      city: c.city || null,
      state: c.state || null,
      country: c.country || 'India'
    }));
    const { error: coError } = await getSupabaseAdmin().from('article_co_authors').insert(rows);
    if (coError) throw coError;
  }

  return submission;
}

export async function listCoAuthors(submissionId: string): Promise<ArticleCoAuthor[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_co_authors')
    .select('*')
    .eq('submission_id', submissionId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data as CoAuthorRow[]).map(toCoAuthor);
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

export async function getSubmissionByToken(token: string): Promise<ArticleSubmission | null> {
  const { data, error } = await getSupabaseAdmin().from('article_submissions').select('*').eq('contribution_token', token).maybeSingle();
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

/** Accept the article and open the publication-charge workflow: sets the charge, a shareable contribution token, and status -> payment_pending. */
export async function acceptSubmission(id: string, publicationCharge: number): Promise<ArticleSubmission> {
  const token = crypto.randomBytes(16).toString('hex');
  const { data, error } = await getSupabaseAdmin()
    .from('article_submissions')
    .update({
      status: 'payment_pending',
      publication_charge: publicationCharge,
      contribution_token: token,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toSubmission(data as SubmissionRow);
}

export async function rejectSubmission(id: string, reason: string): Promise<ArticleSubmission> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_submissions')
    .update({ status: 'rejected', reject_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toSubmission(data as SubmissionRow);
}

export async function scheduleSubmission(
  id: string,
  fields: { volumeNumber: number; issueNumber: number; publicationMonth: number; publicationYear: number; pageRange?: string }
): Promise<ArticleSubmission> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_submissions')
    .update({
      status: 'scheduled',
      volume_number: fields.volumeNumber,
      issue_number: fields.issueNumber,
      publication_month: fields.publicationMonth,
      publication_year: fields.publicationYear,
      page_range: fields.pageRange || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toSubmission(data as SubmissionRow);
}

export async function markSubmissionPublished(id: string, articleUrl?: string): Promise<ArticleSubmission> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_submissions')
    .update({
      status: 'published',
      published_date: new Date().toISOString().slice(0, 10),
      article_url: articleUrl || null,
      updated_at: new Date().toISOString()
    })
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
  pdfPath?: string | null;
  submittedBy: 'user' | 'admin';
  isAdminEdit?: boolean;
}): Promise<SubmissionVersion> {
  const { data, error } = await getSupabaseAdmin()
    .from('submission_versions')
    .insert({
      submission_id: params.submissionId,
      version_number: params.versionNumber,
      word_path: params.wordPath,
      pdf_path: params.pdfPath ?? null,
      submitted_by: params.submittedBy,
      is_admin_edit: params.isAdminEdit ?? false
    })
    .select('*')
    .single();
  if (error) throw error;
  return toVersion(data as VersionRow);
}
