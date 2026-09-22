import 'server-only';
import type { StorageAdapter } from '../types';

/** No-op storage — logs to console, returns fake URLs. Used when STORAGE_ADAPTER=stub (no Supabase configured yet). */
export class StubStorageAdapter implements StorageAdapter {
  async ensureBucket(bucket: string, isPublic: boolean): Promise<void> {
    console.log(`[stub storage] ensureBucket(${bucket}, public=${isPublic})`);
  }

  async upload(bucket: string, path: string): Promise<void> {
    console.log(`[stub storage] upload -> ${bucket}/${path}`);
  }

  async download(bucket: string, path: string): Promise<Buffer> {
    console.log(`[stub storage] download <- ${bucket}/${path}`);
    return Buffer.from('');
  }

  getPublicUrl(bucket: string, path: string): string {
    return `stub://storage/${bucket}/${path}`;
  }

  async getSignedUrl(bucket: string, path: string): Promise<string> {
    return `stub://storage/${bucket}/${path}?signed=1`;
  }

  async remove(bucket: string, path: string): Promise<void> {
    console.log(`[stub storage] remove ${bucket}/${path}`);
  }
}
