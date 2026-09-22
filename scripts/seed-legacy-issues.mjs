// One-time: seeds the new catalog (publication_years -> volumes -> issue_slots
// -> issues) with the same 33 sample issues the legacy Express app shipped
// with, so the site has real content to browse instead of empty states.
// Run with: npm run seed:legacy-issues

import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket }
});

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const legacyIssues = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'legacy-express-app', 'server', 'data', 'issues.json'), 'utf8')
);

async function upsertYear(year) {
  const { data: existing } = await supabase.from('publication_years').select('id').eq('year', year).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase.from('publication_years').insert({ year }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function upsertVolume(yearId, volumeNumber) {
  const { data: existing } = await supabase
    .from('volumes')
    .select('id')
    .eq('year_id', yearId)
    .eq('volume_number', volumeNumber)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('volumes')
    .insert({ year_id: yearId, volume_number: volumeNumber })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertSlot(volumeId, slotNumber, month) {
  const { data: existing } = await supabase
    .from('issue_slots')
    .select('id')
    .eq('volume_id', volumeId)
    .eq('slot_number', slotNumber)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('issue_slots')
    .insert({ volume_id: volumeId, slot_number: slotNumber, month })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function main() {
  console.log(`Seeding ${legacyIssues.length} legacy issues into the new catalog...`);

  for (const issue of legacyIssues) {
    const { data: existingIssue } = await supabase.from('issues').select('id').eq('title', issue.title).maybeSingle();
    if (existingIssue) {
      console.log(`= skip (already exists): ${issue.title}`);
      continue;
    }

    const yearId = await upsertYear(issue.year);
    const volumeId = await upsertVolume(yearId, issue.volume);
    const monthNumber = MONTHS.indexOf(issue.month) + 1;
    const slotId = await upsertSlot(volumeId, issue.issueNumber, monthNumber || null);

    const publishedAt = new Date(Date.UTC(issue.year, Math.max(0, monthNumber - 1), 1)).toISOString();

    const { error } = await supabase.from('issues').insert({
      slot_id: slotId,
      volume_id: volumeId,
      is_special_edition: false,
      title: issue.title,
      description: issue.summary,
      language: 'English',
      poster_url: issue.cover,
      pdf_storage_path: null,
      soft_copy_rate: issue.price,
      hard_copy_rate: null,
      both_rate: null,
      coupon_applicable: true,
      status: 'published',
      published_at: publishedAt
    });

    if (error) {
      console.error(`✗ ${issue.title}: ${error.message}`);
    } else {
      console.log(`✓ ${issue.title}`);
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
