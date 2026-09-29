import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket }
});

const SCRATCH = process.argv[2];
if (!SCRATCH) {
  console.error('Usage: node scripts/import-locations.mjs <dir-with-states.tsv,districts.tsv,taluks.tsv>');
  process.exit(1);
}

function readTsv(path) {
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('\t'));
}

function titleCase(name) {
  return name
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

async function insertChunked(table, rows, chunkSize = 500) {
  const inserted = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await sb.from(table).insert(chunk).select('*');
    if (error) throw new Error(`${table} insert failed at chunk ${i}: ${error.message}`);
    inserted.push(...data);
    console.log(`  ${table}: ${Math.min(i + chunkSize, rows.length)}/${rows.length}`);
  }
  return inserted;
}

async function main() {
  const statesRaw = readTsv(`${SCRATCH}/states.tsv`); // [mysql_id, name]
  const districtsRaw = readTsv(`${SCRATCH}/districts.tsv`); // [mysql_id, name, mysql_state_id]
  const taluksRaw = readTsv(`${SCRATCH}/taluks.tsv`); // [mysql_id, name, mysql_district_id]

  console.log(`Read ${statesRaw.length} states, ${districtsRaw.length} districts, ${taluksRaw.length} taluks.`);

  console.log('Inserting states...');
  const stateRows = statesRaw.map(([, name]) => ({ name: titleCase(name) }));
  const insertedStates = await insertChunked('states', stateRows);
  const stateIdByMysqlId = new Map();
  statesRaw.forEach(([mysqlId, name], i) => {
    const match = insertedStates.find((s) => s.name === titleCase(name));
    stateIdByMysqlId.set(mysqlId, match.id);
  });

  console.log('Inserting districts...');
  const districtRows = districtsRaw
    .filter(([, , stateId]) => stateIdByMysqlId.has(stateId))
    .map(([, name, stateId]) => ({ name: titleCase(name), state_id: stateIdByMysqlId.get(stateId) }));
  const insertedDistricts = await insertChunked('districts', districtRows);
  const districtIdByMysqlId = new Map();
  let di = 0;
  districtsRaw.forEach(([mysqlId, name, stateId]) => {
    if (!stateIdByMysqlId.has(stateId)) return;
    const wantedName = titleCase(name);
    const wantedStateId = stateIdByMysqlId.get(stateId);
    const match = insertedDistricts.find((d) => d.name === wantedName && d.state_id === wantedStateId && !districtIdByMysqlId.has(mysqlId));
    if (match) districtIdByMysqlId.set(mysqlId, match.id);
  });

  console.log('Inserting taluks...');
  const talukRows = taluksRaw
    .filter(([, , districtId]) => districtIdByMysqlId.has(districtId))
    .map(([, name, districtId]) => ({ name: titleCase(name), district_id: districtIdByMysqlId.get(districtId) }));
  await insertChunked('taluks', talukRows);

  console.log('Done.');
  console.log(`States: ${insertedStates.length}, Districts: ${insertedDistricts.length}, Taluks: ${talukRows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
