import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { config } from './config';

// Server-only admin client using the service_role key. This bypasses Row Level
// Security, so it must never be imported from a Client Component or exposed to
// the browser — every module that imports this file is server-only (enforced
// by the `server-only` package above).
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }
  adminClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Node 20 has no native WebSocket (that lands in Node 22) — the realtime
    // client the SDK initializes internally needs one to construct at all,
    // even though this app never subscribes to realtime channels.
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket }
  });
  return adminClient;
}
