"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const admin=read("admin.html");
const js=read("assets/js/nabd-councils-director.js");
const portal=read("assets/js/councils.js");
const backend=read("supabase/functions/nabd-council-provision/index.ts");
const roles=read("supabase/migrations/20261121_guard_profile_roles_for_councils.sql");
const audit=read("supabase/migrations/20261121_council_account_provisioning_audit.sql");

test("director panel features eight councils, new accounts and Academy account linking",()=>{
 assert.match(admin,/data-tab="councilAccounts"/);
 assert.match(admin,/id="councilAccounts" class="panel card hidden"/);
 assert.match(admin,/id="ncg-create-form"/);
 assert.match(admin,/id="ncg-existing"/);
 assert.match(admin,/id="ncg-search-results"/);
 assert.match(admin,/id="ncg-member/);
 assert.match(admin,/id="ncg-password" type="password"/);
 assert.match(admin,/id="ncg-email-verified" type="checkbox" required/);
 assert.match(admin,/assets\/js\/nabd-councils-director\.js/);
 assert.match(admin,/assets\/css\/nabd-councils-director\.css/);
 assert.equal((js.match(/tag:"NCN-[A-Z]+"/g)||[]).length,8);
});

test("new account creation and linking are exclusive to the server Edge Function",()=>{
 assert.match(js,/db\.functions\.invoke\("nabd-council-provision"/);
 assert.doesNotMatch(js,/SUPABASE_SERVICE_ROLE_KEY|auth\.admin\.createUser/);
 assert.match(backend,/Deno\.env\.get\("SUPABASE_SERVICE_ROLE_KEY"\)/);
 assert.match(backend,/admin\.auth\.getUser\(token\)/);
 assert.match(backend,/profile\?\.role!=="admin"/);
 assert.match(backend,/admin\.auth\.admin\.createUser/);
 assert.match(backend,/admin\.auth\.admin\.getUserById/);
 assert.match(backend,/verified_email!==true/);
 assert.match(backend,/email_confirm:true/);
 assert.match(backend,/password\.length>=12/);
 assert.match(backend,/upsert\(\{user_id,\.\.\.selection,active:true\}/);
 assert.match(backend,/\.update\(\{active:body\.active\}\)/);
});

test("audit never stores secrets, and normal users cannot self-promote",()=>{
 assert.match(roles,/before update of role on public\.profiles/);
 assert.match(roles,/not coalesce\(public\.is_admin\(\),false\)/);
 assert.match(audit,/enable row level security/);
 assert.match(audit,/using \(\(select public\.is_admin\(\)\)\)/);
 assert.doesNotMatch(audit,/password\s+text|password\s+varchar|password\s+bytea/i);
});
test("requested council codes are navigation hints, not membership bypasses",()=>{
 assert.match(js,/councils\.html\?council=/);
 assert.match(portal,/canAccess\(direct\)/);
 assert.match(portal,/ownMemberships\(\)\.length===1/);
 assert.match(portal,/state\.tab="records"/);
 assert.match(portal,/auth\.getUser\(\)/);
});
