// One-time: creates (or promotes) an admin user so you can sign in to /admin.
// Run with: npm run seed:admin -- --email you@example.com --password "Something8+" --name "Your Name"

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import WebSocket from 'ws';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg, i, arr) => (arg.startsWith('--') ? [arg.slice(2), arr[i + 1]] : null)).filter(Boolean)
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
if (!args.email || !args.password) {
  console.error('Usage: npm run seed:admin -- --email you@example.com --password "Something8+" --name "Your Name"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket }
});

async function main() {
  const email = args.email.toLowerCase();
  const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();

  if (existing) {
    const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', existing.id);
    if (error) throw error;
    console.log(`Promoted existing user ${email} to admin.`);
    return;
  }

  const passwordHash = await bcrypt.hash(args.password, 12);
  const { error } = await supabase.from('users').insert({
    name: args.name || 'Admin',
    email,
    password_hash: passwordHash,
    role: 'admin'
  });
  if (error) throw error;
  console.log(`Created admin user ${email}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
