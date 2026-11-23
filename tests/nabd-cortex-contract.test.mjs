import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('nabd-cortex.html');
const edge=read('supabase/functions/nabd-cortex/index.ts');
const sql=read('supabase/migrations/20261123183000_nabd_cortex_foundation.sql');
const conf=read('supabase/config.toml');

test('Cortex two buttons use server-side founder RPC',()=>{
  for(const id of ['start','stop','run','feedback','tasks','runs','sources'])assert.match(ui,new RegExp('id="'+id+'"'));
  assert.match(ui,/nabd_cortex_set_enabled/);
  assert.match(sql,/nabd_cortex_set_enabled\(p_enabled boolean\)/);
  assert.match(sql,/role='founder' and is_active/);
  assert.match(ui,/مفتاح التشغيل مخصص للمؤسس/);
});

test('Cortex requires a real admin session and obeys kill switch',()=>{
  assert.match(edge,/auth\.getUser\(jwt\)/);
  assert.match(edge,/rpc\("nabd_agent_admin_info"\)/);
  assert.match(edge,/enabled!==true/);
  assert.match(edge,/!stillOn\.data\?\.enabled/);
  assert.match(edge,/\(recent\.count\|\|0\)>=8/);
  assert.match(conf,/\[functions\.nabd-cortex\]\s*verify_jwt\s*=\s*false/);
});
test('Medical and finance paths are human-gated, no model-authorized tools',()=>{
  assert.match(edge,/domain==="medical" \|\| domain==="finance" \|\| domain==="cybersecurity"/);
  assert.match(edge,/requiresHuman=risk!=="low"/);
  assert.match(edge,/\["administration","education","crisis"\]/);
  assert.doesNotMatch(edge,/execute_sql|run_shell|eval\(/);
  assert.doesNotMatch(ui,/SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY/);
  assert.doesNotMatch(ui,/\.innerHTML\s*=/);
});
test('All five exposed database tables enforce RLS and append/read permissions',()=>{
 for(const name of ['settings','sources','runs','tasks','audit']){
  assert.match(sql,new RegExp('alter table public\\.nabd_cortex_'+name+' enable row level security'));
  assert.match(sql,new RegExp('create policy cortex_'+name+'_admin_read'));
 }
 assert.match(sql,/revoke all on public\.nabd_cortex_settings/);
 assert.match(sql,/grant select on public\.nabd_cortex_settings/);
 assert.match(sql,/execution','none/);
});
test('No artificial student sessions or data changes in Cortex pilot',()=>{
 assert.doesNotMatch(edge,/from\("profiles"\)\.update|from\("courses"\)\.update|from\("certificates"\)\.insert/);
 assert.match(ui,/لم نُنشئ نشاطًا وهميًا/);
});
