"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const get=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const migration=get("supabase/migrations/20261121_restore_service_role_document_grants.sql");
const backend=get("supabase/functions/nabd-official-documents/index.ts");
const client=get("assets/js/official-documents.js");
const page=get("official-documents.html");

test("all document server SQL table and sequence grants are restored",()=>{
 for(const table of ["public.profiles","public.nabd_official_documents","public.nabd_document_issuer_permissions","public.nabd_council_memberships","public.nabd_council_account_audit"]){
   assert.ok(migration.includes(table),table+" must receive a server-only grant");
 }
 assert.match(migration,/grant select on table public\.profiles to service_role;/i);
 assert.match(migration,/grant select, insert, update on table public\.nabd_official_documents to service_role;/i);
 assert.match(migration,/grant select, insert, update on table public\.nabd_document_issuer_permissions to service_role;/i);
 assert.match(migration,/grant usage on sequence public\.nabd_official_documents_id_seq to service_role;/i);
 assert.match(migration,/grant usage on sequence public\.nabd_council_account_audit_id_seq to service_role;/i);
 assert.doesNotMatch(migration,/^\s*grant\b[^\n;]*\bto\s+(?:anon|authenticated|public)\b/im);
});
test("profile lookup failures are distinguished from a missing profile",()=>{
 assert.match(backend,/if\(profileError\)\{/);
 assert.match(backend,/return fail\("profile_lookup_failed",503\)/);
 assert.match(backend,/if\(!profile\)return fail\("account_profile_missing",403\)/);
 assert.match(backend,/db\.auth\.getUser\(token\)/);
 assert.match(backend,/profile\.role==="admin"/);
});
test("document UI reports readable Arabic errors and busts stale script",()=>{
 assert.match(client,/profile_lookup_failed:"تعذر قراءة ملف الحساب/);
 assert.match(client,/account_profile_missing:"هذا الحساب غير مرتبط/);
 assert.match(client,/serviceMessages\[code\]/);
 assert.match(page,/assets\/js\/official-documents\.js\?v=2/);
 assert.doesNotThrow(()=>new Function(client));
});
