import 'server-only';
import { config } from '@/lib/config';
import type { StorageAdapter } from '../types';
import { StubStorageAdapter } from './stub';
import { SupabaseStorageAdapter } from './supabase';

let instance: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (instance) return instance;
  instance = config.adapters.storage === 'supabase' ? new SupabaseStorageAdapter() : new StubStorageAdapter();
  return instance;
}
