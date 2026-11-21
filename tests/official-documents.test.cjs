"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=x=>fs.readFileSync(path.resolve(__dirname,"..",x),"utf8");
const admin=read("admin.html"),councils=read("councils.html");
const page=read("official-documents.html"),css=read("assets/css/official-documents.css");
const js=read("assets/js/official-documents.js"),checkPage=read("official-document-verify.html");
const checkJS=read("assets/js/official-document-verification.js");
const issue=read("supabase/functions/nabd-official-documents/index.ts");
const verify=read("supabase/functions/nabd-document-verify/index.ts");
const sql=read("supabase/migrations/20261121_official_documents_center.sql");
const config=read("supabase/config.toml");

test("six fixed official templates and protected medical request phrasing",()=>{
 for(const type of ["statement","permit","report","treatment_request","consultation_request","complaint"])
  assert.ok(js.includes('id:"'+type+'"'),"Missing "+type);
 assert.equal((js.match(/\{id:"(?:statement|permit|report|treatment_request|consultation_request|complaint)"/g)||[]).length,6);
 assert.match(js,/ليست? وصفة|ليس وصفة|ليس وصفة دوائية|ليس وصفة علاجية|ليس وصفة/);
 assert.match(js,/ممارس صحي مرخّص/);
 assert.match(page,/اعتماد إلكتروني مسجل في النظام، وليس توقيعًا بخط اليد/);
});

test("director panel, council staff access and A4 print functionality",()=>{
 assert.match(admin,/id="officialDocumentsEntry"/);
 assert.match(councils,/href="official-documents\.html"/);
 assert.match(page,/id="template-grid"/);
 assert.match(page,/id="search-results"/);
 assert.match(page,/id="issuer-scopes"/);
 assert.match(page,/id="sheet-name"/);
 assert.match(page,/id="sheet-date"/);
 assert.match(page,/id="sheet-issuer"/);
 assert.match(page,/id="sheet-number"/);
 assert.match(page,/id="sheet-qr"/);
 assert.match(css,/@page\{size:A4 portrait/);
 assert.match(js,/window\.print\(\)/);
 assert.match(js,/new QRCode\(/);
 assert.match(js,/nabd-official-documents/);
});

test("server issues docs only with verified JWT and per-template permission",()=>{
 assert.match(issue,/db\.auth\.getUser\(token\)/);
 assert.match(issue,/profile\.role==="admin"/);
 assert.match(issue,/nabd_document_issuer_permissions/);
 assert.match(issue,/allowed\.includes\(doc_type\)/);
 assert.match(issue,/select\("full_name,role"\)/);
 assert.match(issue,/nabd_official_documents/);
 assert.match(issue,/action==="grant_issuer"/);
 assert.match(issue,/if\(!isAdmin\)return fail\("admin_only",403\)/);
 assert.doesNotMatch(js,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(config,/\[functions\.nabd-official-documents\]\s*verify_jwt = true/);
});

test("documents are private by default and public QR returns no identity",()=>{
 assert.match(sql,/alter table public\.nabd_official_documents enable row level security/);
 assert.match(sql,/revoke all on table public\.nabd_official_documents from public,anon,authenticated/);
 assert.match(sql,/alter table public\.nabd_document_issuer_permissions enable row level security/);
 assert.match(sql,/revoke all on table public\.nabd_document_issuer_permissions from public,anon,authenticated/);
 assert.match(verify,/\.eq\("verify_token",token\)/);
 assert.match(verify,/\.select\("id,doc_type,status,issued_at"\)/);
 assert.doesNotMatch(verify,/\.select\(".*(subject_name|issuer_name|subject_user_id).*"\)/);
 assert.match(config,/\[functions\.nabd-document-verify\]\s*verify_jwt = false/);
 assert.match(checkPage,/name="referrer" content="no-referrer"/);
 assert.match(checkJS,/d\.status==="valid"/);
});

test("document center javascript parses",()=>{
 for(const code of [js,checkJS])assert.doesNotThrow(()=>new Function(code));
});
