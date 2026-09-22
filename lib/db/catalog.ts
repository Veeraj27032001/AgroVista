import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Issue, IssueSlot, IssueWithPdfPath, PublicationYear, Volume } from '@/lib/types';

// ---- publication_years ----

type YearRow = { id: string; year: number; is_active: boolean };
const toYear = (r: YearRow): PublicationYear => ({ id: r.id, year: r.year, isActive: r.is_active });

export async function listYears(): Promise<PublicationYear[]> {
  const { data, error } = await getSupabaseAdmin().from('publication_years').select('*').order('year', { ascending: false });
  if (error) throw error;
  return (data as YearRow[]).map(toYear);
}

export async function createYear(year: number): Promise<PublicationYear> {
  const { data, error } = await getSupabaseAdmin().from('publication_years').insert({ year }).select('*').single();
  if (error) throw error;
  return toYear(data as YearRow);
}

export async function getYear(id: string): Promise<PublicationYear | null> {
  const { data, error } = await getSupabaseAdmin().from('publication_years').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toYear(data as YearRow) : null;
}

export async function updateYear(id: string, fields: Partial<{ isActive: boolean }>): Promise<PublicationYear> {
  const { data, error } = await getSupabaseAdmin()
    .from('publication_years')
    .update({ is_active: fields.isActive })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toYear(data as YearRow);
}

export async function deleteYear(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('publication_years').delete().eq('id', id);
  if (error) throw error;
}

// ---- volumes ----

type VolumeRow = {
  id: string;
  year_id: string;
  volume_number: number;
  name: string | null;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
  start_month: number | null;
  end_month: number | null;
};
const toVolume = (r: VolumeRow): Volume => ({
  id: r.id,
  yearId: r.year_id,
  volumeNumber: r.volume_number,
  name: r.name,
  quarter: r.quarter,
  startMonth: r.start_month,
  endMonth: r.end_month
});

export async function listVolumesForYear(yearId: string): Promise<Volume[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('volumes')
    .select('*')
    .eq('year_id', yearId)
    .order('volume_number', { ascending: true });
  if (error) throw error;
  return (data as VolumeRow[]).map(toVolume);
}

export async function getVolume(id: string): Promise<Volume | null> {
  const { data, error } = await getSupabaseAdmin().from('volumes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toVolume(data as VolumeRow) : null;
}

export async function createVolume(params: {
  yearId: string;
  volumeNumber: number;
  name?: string;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  startMonth?: number;
  endMonth?: number;
}): Promise<Volume> {
  const { data, error } = await getSupabaseAdmin()
    .from('volumes')
    .insert({
      year_id: params.yearId,
      volume_number: params.volumeNumber,
      name: params.name || null,
      quarter: params.quarter || null,
      start_month: params.startMonth ?? null,
      end_month: params.endMonth ?? null
    })
    .select('*')
    .single();
  if (error) throw error;
  return toVolume(data as VolumeRow);
}

export async function updateVolume(
  id: string,
  fields: Partial<{ name: string; quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'; startMonth: number; endMonth: number }>
): Promise<Volume> {
  const patch: Record<string, unknown> = {};
  if (fields.name !== undefined) patch.name = fields.name;
  if (fields.quarter !== undefined) patch.quarter = fields.quarter;
  if (fields.startMonth !== undefined) patch.start_month = fields.startMonth;
  if (fields.endMonth !== undefined) patch.end_month = fields.endMonth;
  const { data, error } = await getSupabaseAdmin().from('volumes').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return toVolume(data as VolumeRow);
}

export async function deleteVolume(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('volumes').delete().eq('id', id);
  if (error) throw error;
}

// ---- issue_slots ----

type SlotRow = {
  id: string;
  volume_id: string;
  slot_number: number;
  month: number | null;
  issue_type: 'monthly' | 'weekly';
};
const toSlot = (r: SlotRow): IssueSlot => ({
  id: r.id,
  volumeId: r.volume_id,
  slotNumber: r.slot_number,
  month: r.month,
  issueType: r.issue_type
});

export async function listSlotsForVolume(volumeId: string): Promise<IssueSlot[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('issue_slots')
    .select('*')
    .eq('volume_id', volumeId)
    .order('slot_number', { ascending: true });
  if (error) throw error;
  return (data as SlotRow[]).map(toSlot);
}

export async function getSlot(id: string): Promise<IssueSlot | null> {
  const { data, error } = await getSupabaseAdmin().from('issue_slots').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toSlot(data as SlotRow) : null;
}

export async function createSlot(params: {
  volumeId: string;
  slotNumber: number;
  month?: number;
  issueType?: 'monthly' | 'weekly';
}): Promise<IssueSlot> {
  const { data, error } = await getSupabaseAdmin()
    .from('issue_slots')
    .insert({
      volume_id: params.volumeId,
      slot_number: params.slotNumber,
      month: params.month ?? null,
      issue_type: params.issueType || 'monthly'
    })
    .select('*')
    .single();
  if (error) throw error;
  return toSlot(data as SlotRow);
}

export async function deleteSlot(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('issue_slots').delete().eq('id', id);
  if (error) throw error;
}

// ---- issues ----

type IssueRow = {
  id: string;
  slot_id: string | null;
  volume_id: string | null;
  is_special_edition: boolean;
  title: string;
  description: string | null;
  language: string;
  poster_url: string | null;
  pdf_storage_path: string | null;
  soft_copy_rate: number | null;
  hard_copy_rate: number | null;
  both_rate: number | null;
  coupon_applicable: boolean;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
};

function toIssue(r: IssueRow): Issue {
  return {
    id: r.id,
    slotId: r.slot_id,
    volumeId: r.volume_id,
    isSpecialEdition: r.is_special_edition,
    title: r.title,
    description: r.description,
    language: r.language,
    posterUrl: r.poster_url,
    softCopyRate: r.soft_copy_rate === null ? null : Number(r.soft_copy_rate),
    hardCopyRate: r.hard_copy_rate === null ? null : Number(r.hard_copy_rate),
    bothRate: r.both_rate === null ? null : Number(r.both_rate),
    couponApplicable: r.coupon_applicable,
    status: r.status,
    publishedAt: r.published_at,
    createdAt: r.created_at
  };
}

function toIssueWithPdfPath(r: IssueRow): IssueWithPdfPath {
  return { ...toIssue(r), pdfStoragePath: r.pdf_storage_path };
}

export type IssueFilters = {
  year?: number;
  volumeId?: string;
  language?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  specialEditionsOnly?: boolean;
};

export async function listPublishedIssues(filters: IssueFilters = {}): Promise<{ issues: Issue[]; total: number }> {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 24;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = getSupabaseAdmin()
    .from('issues')
    .select('*, volumes!inner(id, volume_number, year_id, publication_years!inner(year))', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  if (filters.language) query = query.eq('language', filters.language);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);
  if (filters.volumeId) query = query.eq('volume_id', filters.volumeId);
  if (filters.year) query = query.eq('volumes.publication_years.year', filters.year);
  if (filters.specialEditionsOnly !== undefined) query = query.eq('is_special_edition', filters.specialEditionsOnly);

  const { data, error, count } = await query;
  if (error) throw error;
  return { issues: (data as unknown as IssueRow[]).map(toIssue), total: count ?? 0 };
}

export async function listAllIssuesForAdmin(): Promise<Issue[]> {
  const { data, error } = await getSupabaseAdmin().from('issues').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as IssueRow[]).map(toIssue);
}

export async function getIssue(id: string): Promise<Issue | null> {
  const { data, error } = await getSupabaseAdmin().from('issues').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toIssue(data as IssueRow) : null;
}

/** Server-only: includes the private PDF storage path. */
export async function getIssueWithPdfPath(id: string): Promise<IssueWithPdfPath | null> {
  const { data, error } = await getSupabaseAdmin().from('issues').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toIssueWithPdfPath(data as IssueRow) : null;
}

export type CreateIssueParams = {
  slotId?: string | null;
  volumeId?: string | null;
  isSpecialEdition?: boolean;
  title: string;
  description?: string;
  language?: string;
  posterUrl?: string;
  pdfStoragePath?: string;
  softCopyRate?: number;
  hardCopyRate?: number;
  bothRate?: number;
  couponApplicable?: boolean;
  status?: 'draft' | 'published';
};

export async function createIssue(params: CreateIssueParams): Promise<Issue> {
  const { data, error } = await getSupabaseAdmin()
    .from('issues')
    .insert({
      slot_id: params.slotId ?? null,
      volume_id: params.volumeId ?? null,
      is_special_edition: params.isSpecialEdition ?? false,
      title: params.title,
      description: params.description || null,
      language: params.language || 'English',
      poster_url: params.posterUrl || null,
      pdf_storage_path: params.pdfStoragePath || null,
      soft_copy_rate: params.softCopyRate ?? null,
      hard_copy_rate: params.hardCopyRate ?? null,
      both_rate: params.bothRate ?? null,
      coupon_applicable: params.couponApplicable ?? true,
      status: params.status || 'draft',
      published_at: params.status === 'published' ? new Date().toISOString() : null
    })
    .select('*')
    .single();
  if (error) throw error;
  return toIssue(data as IssueRow);
}

export async function updateIssue(id: string, params: Partial<CreateIssueParams>): Promise<Issue> {
  const patch: Record<string, unknown> = {};
  if (params.slotId !== undefined) patch.slot_id = params.slotId;
  if (params.volumeId !== undefined) patch.volume_id = params.volumeId;
  if (params.isSpecialEdition !== undefined) patch.is_special_edition = params.isSpecialEdition;
  if (params.title !== undefined) patch.title = params.title;
  if (params.description !== undefined) patch.description = params.description;
  if (params.language !== undefined) patch.language = params.language;
  if (params.posterUrl !== undefined) patch.poster_url = params.posterUrl;
  if (params.pdfStoragePath !== undefined) patch.pdf_storage_path = params.pdfStoragePath;
  if (params.softCopyRate !== undefined) patch.soft_copy_rate = params.softCopyRate;
  if (params.hardCopyRate !== undefined) patch.hard_copy_rate = params.hardCopyRate;
  if (params.bothRate !== undefined) patch.both_rate = params.bothRate;
  if (params.couponApplicable !== undefined) patch.coupon_applicable = params.couponApplicable;
  if (params.status !== undefined) {
    patch.status = params.status;
    if (params.status === 'published') patch.published_at = new Date().toISOString();
  }

  const { data, error } = await getSupabaseAdmin().from('issues').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return toIssue(data as IssueRow);
}

export async function deleteIssue(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('issues').delete().eq('id', id);
  if (error) throw error;
}

/** All active subscriptions whose format covers hard-copy delivery, for auto-delivery on publish. */
export async function listActiveHardCopySubscriptions(): Promise<{ userId: string; format: 'hard' | 'both' }[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('subscriptions')
    .select('user_id, format')
    .eq('status', 'active')
    .in('format', ['hard', 'both'])
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString());
  if (error) throw error;
  return (data as { user_id: string; format: 'hard' | 'both' }[]).map((r) => ({ userId: r.user_id, format: r.format }));
}
