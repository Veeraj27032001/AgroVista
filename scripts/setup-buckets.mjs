// One-time: creates the 4 Supabase Storage buckets this app expects.
// Run with: npm run setup:buckets

import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Node 20 has no native WebSocket; the SDK's realtime client needs one to construct.
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket }
});

const BUCKETS = [
  { name: process.env.SUPABASE_POSTERS_BUCKET || 'issue-posters', public: true },
  { name: process.env.SUPABASE_ISSUE_PDFS_BUCKET || 'issue-pdfs', public: false },
  { name: process.env.SUPABASE_SUBMISSION_FILES_BUCKET || 'submission-files', public: false },
  { name: process.env.SUPABASE_ADMIN_EDITS_BUCKET || 'admin-edits', public: false }
];

async function main() {
  const { data: existing, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  const existingNames = new Set(existing.map((b) => b.name));

  for (const bucket of BUCKETS) {
    if (existingNames.has(bucket.name)) {
      console.log(`= ${bucket.name} already exists`);
      continue;
    }
    const { error: createError } = await supabase.storage.createBucket(bucket.name, { public: bucket.public });
    if (createError) {
      console.error(`✗ ${bucket.name}: ${createError.message}`);
    } else {
      console.log(`✓ created ${bucket.name} (public: ${bucket.public})`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
