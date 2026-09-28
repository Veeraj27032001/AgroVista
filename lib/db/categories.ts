import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Category } from '@/lib/types';

type CategoryRow = { id: string; name: string; slug: string; is_active: boolean; is_deleted: boolean };

const toCategory = (r: CategoryRow): Category => ({ id: r.id, name: r.name, slug: r.slug, isActive: r.is_active });

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** includeInactive: also return is_active=false rows. Deleted rows are never returned. */
export async function listCategories(includeInactive = false): Promise<Category[]> {
  let query = getSupabaseAdmin().from('categories').select('*').eq('is_deleted', false).order('name', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data as CategoryRow[]).map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .maybeSingle();
  if (error) throw error;
  return data ? toCategory(data as CategoryRow) : null;
}

export async function createCategory(name: string): Promise<Category> {
  const { data, error } = await getSupabaseAdmin()
    .from('categories')
    .insert({ name: name.trim(), slug: slugify(name) })
    .select('*')
    .single();
  if (error) throw error;
  return toCategory(data as CategoryRow);
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const { data, error } = await getSupabaseAdmin()
    .from('categories')
    .update({ name: name.trim(), slug: slugify(name) })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toCategory(data as CategoryRow);
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await getSupabaseAdmin().from('categories').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

export async function setCategoryDeleted(id: string, isDeleted: boolean): Promise<void> {
  const { error } = await getSupabaseAdmin().from('categories').update({ is_deleted: isDeleted }).eq('id', id);
  if (error) throw error;
}
