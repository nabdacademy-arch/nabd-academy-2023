import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('nabd-cortex.html');
const edge=read('supabase/functions/nabd-cortex/index.ts');
const sql=read('supabase/migrations/20261123183000_nabd_cortex_foundation.sql');
const conf=read('supabase/config.toml');
const timerSql=read('supabase/migrations/20261123192000_nabd_cortex_admin_control_timer.sql');

test('Cortex two buttons use server-side admin/founder RPC',()=>{
  for(const id of ['start','stop','run','feedback','tasks','runs','sources'])assert.match(ui,new RegExp('id="'+id+'"'));
  assert.match(ui,/nabd_cortex_set_enabled/);
  assert.match(sql,/nabd_cortex_set_enabled\(p_enabled boolean\)/);
  assert.match(sql,/role='founder' and is_active/);
  assert.match(ui,/مفتاح التشغيل مخصص لحساب الإدارة المعتمد/);
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

test('Control permissions match authorized administrator and active founder login',()=>{
 assert.match(timerSql,/public\.is_admin\(\)/);
 assert.match(timerSql,/role='founder' and is_active/);
 assert.match(timerSql,/auth\.uid\(\) is null/);
 assert.match(timerSql,/revoke all on function public\.nabd_cortex_set_enabled\(boolean\) from public,anon/);
 assert.match(timerSql,/create or replace function public\.nabd_cortex_review_task/);
 assert.match(timerSql,/Admin or active founder authorization required/);
});

test('Uptime timers persist across visits and finish at stop',()=>{
 for(const id of ['activeTimer','totalTimer','lastToggle','taskTimer'])assert.match(ui,new RegExp('id="'+id+'"'));
 assert.match(ui,/select\('enabled,updated_at,active_since,last_stopped_at,elapsed_seconds'\)/);
 assert.match(ui,/setInterval\(renderTimers,1000\)/);
 assert.match(ui,/taskStartedAt=performance\.now\(\)/);
 assert.match(timerSql,/add column if not exists active_since timestamptz/);
 assert.match(timerSql,/add column if not exists elapsed_seconds bigint/);
 assert.match(timerSql,/for update/);
 assert.match(timerSql,/v_elapsed := v_elapsed \+ greatest/);
 assert.match(timerSql,/if p_enabled is distinct from v_enabled then/);
});
