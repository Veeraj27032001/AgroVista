import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Category } from '@/lib/types';

type CategoryRow = { id: string; name: string; slug: string };

const toCategory = (r: CategoryRow): Category => ({ id: r.id, name: r.name, slug: r.slug });

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await getSupabaseAdmin().from('categories').select('*').order('name', { ascending: true });
  if (error) throw error;
  return (data as CategoryRow[]).map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await getSupabaseAdmin().from('categories').select('*').eq('slug', slug).maybeSingle();
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

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('categories').delete().eq('id', id);
  if (error) throw error;
}
