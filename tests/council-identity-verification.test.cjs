"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const sql=read("supabase/migrations/20261121_council_member_numbers_and_verification.sql");
const verifier=read("supabase/functions/nabd-council-verify/index.ts");
const director=read("assets/js/nabd-councils-director.js");
const provision=read("supabase/functions/nabd-council-provision/index.ts");
const docHtml=read("council-documents.html");
const docJS=read("assets/js/council-documents.js");
const verifyPage=read("council-verify.html");
const verifyClient=read("assets/js/council-verification.js");
const councils=read("assets/js/councils.js");
const portal=read("councils.html");

test("membership ID is atomic, permanent, unique and generated in the database",()=>{
 assert.match(sql,/create table if not exists public\.nabd_council_number_counters/);
 assert.match(sql,/last_number\s*=\s*last_number\s*\+\s*1/);
 assert.match(sql,/new\.member_code := 'NABD-NCN-'/);
 assert.match(sql,/lpad\(n::text,greatest\(length\(n::text\),4\),'0'\)/);
 assert.match(sql,/new\.verify_token := gen_random_uuid\(\)/);
 assert.match(sql,/before insert on public\.nabd_council_memberships/);
 assert.match(sql,/nabd_council_membership_number_unique/);
 assert.match(sql,/nabd_council_membership_token_unique/);
 assert.match(sql,/where member_code is null or verify_token is null/);
 assert.match(sql,/revoke all on public\.nabd_council_number_counters from public,anon,authenticated/);
 assert.match(sql,/alter table public\.nabd_council_number_counters enable row level security/);
 assert.match(sql,/revoke all on function public\.nabd_issue_council_identity\(\) from public,anon,authenticated/);
});

test("verifier requires an unpredictable token, checks live active status and excludes secrets",()=>{
 assert.match(verifier,/const UUID=/);
 assert.match(verifier,/\.eq\("verify_token",token\)/);
 assert.match(verifier,/if\(!membership\.active\)return send\(\{status:"inactive"/);
 assert.match(verifier,/status:"valid"/);
 assert.match(verifier,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(verifier,/Cache-Control":"no-store/);
 assert.doesNotMatch(verifier,/email|password|session_id|access_token/);
 assert.match(verifyPage,/name="referrer" content="no-referrer"/);
 assert.match(verifyClient,/data\.status==="valid"/);
 assert.match(verifyClient,/data\.status==="inactive"/);
 assert.doesNotMatch(verifyClient,/select\(\s*["']\*["']\s*\)/);
});

test("membership cards and certificates fetch only RLS-authorized rows",()=>{
 assert.match(docHtml,/id="document-card"/);
 assert.match(docHtml,/id="document-certificate"/);
 assert.match(docHtml,/id="card-qr"/);
 assert.match(docHtml,/id="certificate-qr"/);
 assert.match(docHtml,/طباعة \/ حفظ PDF/);
 assert.match(docJS,/db\.auth\.getUser\(\)/);
 assert.match(docJS,/from\("nabd_council_memberships"\)/);
 assert.match(docJS,/\.eq\("user_id",member\)/);
 assert.match(docJS,/member_code,verify_token/);
 assert.match(docJS,/new QRCode\(target/);
 assert.match(docJS,/window\.print\(\)/);
 assert.doesNotMatch(docJS,/service_role|SUPABASE_SERVICE_ROLE_KEY/);
 assert.doesNotMatch(docHtml,/كلمة المرور الأولية:/);
});

test("director and council members can open the right appointment document",()=>{
 assert.match(provision,/appointed_at,member_code/);
 assert.match(director,/council-documents\.html\?member=/);
 assert.match(director,/m\.member_code/);
 assert.match(councils,/member_code/);
 assert.match(councils,/renderMemberDocuments/);
 assert.match(councils,/council-documents\.html\?member=/);
 assert.match(portal,/id="identity-view"/);
 assert.match(portal,/data-tab="identity"/);
});
