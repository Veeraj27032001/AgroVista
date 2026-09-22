// One-time: runs supabase/schema.sql directly against your Supabase Postgres
// database, so you don't have to paste it into the SQL editor by hand.
// Run with: npm run apply:schema

import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL || !DB_PASSWORD) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD in .env.local');
  process.exit(1);
}

const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');

async function tryConnect(config, label) {
  const client = new pg.Client(config);
  await client.connect();
  console.log(`Connected via ${label}.`);
  return client;
}

async function main() {
  let client;
  try {
    client = await tryConnect(
      {
        host: `db.${projectRef}.supabase.co`,
        port: 5432,
        user: 'postgres',
        password: DB_PASSWORD,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
      },
      'direct connection'
    );
  } catch (directErr) {
    console.warn(`Direct connection failed (${directErr.message}), trying the pooler...`);
    client = await tryConnect(
      {
        host: `aws-0-ap-south-1.pooler.supabase.com`,
        port: 6543,
        user: `postgres.${projectRef}`,
        password: DB_PASSWORD,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
      },
      'pooler connection'
    );
  }

  try {
    await client.query(sql);
    console.log('Schema applied successfully.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Failed to apply schema:', err.message);
  process.exit(1);
});
