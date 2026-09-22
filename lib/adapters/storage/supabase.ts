import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { StorageAdapter } from '../types';

export class SupabaseStorageAdapter implements StorageAdapter {
  async ensureBucket(bucket: string, isPublic: boolean): Promise<void> {
    const { data: buckets, error } = await getSupabaseAdmin().storage.listBuckets();
    if (error) throw error;
    if (buckets.some((b) => b.name === bucket)) return;
    const { error: createError } = await getSupabaseAdmin().storage.createBucket(bucket, { public: isPublic });
    if (createError) throw createError;
  }

  async upload(bucket: string, path: string, data: Buffer, contentType: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .storage.from(bucket)
      .upload(path, data, { contentType, upsert: true });
    if (error) throw error;
  }

  async download(bucket: string, path: string): Promise<Buffer> {
    const { data, error } = await getSupabaseAdmin().storage.from(bucket).download(path);
    if (error || !data) throw error || new Error('File not found');
    return Buffer.from(await data.arrayBuffer());
  }

  getPublicUrl(bucket: string, path: string): string {
    return getSupabaseAdmin().storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async getSignedUrl(bucket: string, path: string, expiresInSeconds: number): Promise<string> {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(bucket)
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data) throw error || new Error('Could not create signed URL');
    return data.signedUrl;
  }

  async remove(bucket: string, path: string): Promise<void> {
    const { error } = await getSupabaseAdmin().storage.from(bucket).remove([path]);
    if (error) throw error;
  }
}
