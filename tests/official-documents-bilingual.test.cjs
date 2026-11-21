"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
const page=read("official-documents.html");
const js=read("assets/js/official-documents.js");
const css=read("assets/css/official-documents.css");
const backend=read("supabase/functions/nabd-official-documents/index.ts");
const sql=read("supabase/migrations/20261121_official_document_evidence_signature.sql");

test("one A4 institutional document has BOTH Arabic and English content",()=>{
 assert.match(js,/const bilingualTemplates=/);
 for(const doc of ["statement","permit","report","treatment_request","consultation_request","complaint"]){
  assert.ok(js.includes(doc+":["),doc+" must have English text");
 }
 assert.match(js,/textSection\("ar","النص الرسمي باللغة العربية",t\.lines\)/);
 assert.match(js,/textSection\("en","Official English text",bilingualTemplates\[row\.doc_type\]/);
 assert.match(page,/lang="en" dir="ltr"/);
 assert.match(page,/id="sheet-date-en"/);
 assert.match(css,/@page\{size:A4 portrait/);
 assert.match(css,/\.bilingual-text--en/);
 assert.match(css,/\.bilingual-text--ar/);
 assert.doesNotThrow(()=>new Function(js));
});
test("only verified certificates and active council roles appear as snapshotted evidence",()=>{
 assert.match(sql,/subject_details jsonb not null default '\{\}'::jsonb/);
 assert.match(sql,/grant select on table public\.certificates to service_role/);
 assert.match(sql,/grant select on table public\.courses to service_role/);
 assert.match(sql,/grant select on table public\.enrollments to service_role/);
 assert.match(backend,/verifiedSubjectDetails/);
 assert.match(backend,/\.eq\("status","valid"\)/);
 assert.match(backend,/\.eq\("status","active"\)/);
 assert.match(backend,/\.eq\("active",true\)/);
 assert.match(backend,/subject_details:details/);
 assert.match(backend,/subject_details,signatory_name,signatory_kind/);
 assert.match(js,/renderVerifiedDetails\(row\)/);
 assert.match(js,/completion not certified/);
 assert.doesNotMatch(js,/raw_user_meta_data|app_metadata/);
});
test("the academy seal is ABOVE the named signatory and each print has QR + Code128 barcode",()=>{
 const stack=page.indexOf('class="signature-stack"');
 const seal=page.indexOf('class="institution-seal"',stack);
 const sign=page.indexOf('class="issue-signature"',stack);
 assert.ok(stack>=0&&seal>stack&&sign>seal,"institutional seal precedes the signatory");
 assert.match(page,/id="sheet-signatory"/);
 assert.match(page,/id="sheet-signature-role"/);
 assert.match(page,/id="sheet-issuer"/);
 assert.match(page,/id="sheet-number"/);
 assert.match(page,/id="sheet-qr"/);
 assert.match(page,/id="sheet-barcode"/);
 assert.match(page,/jsbarcode@3\.11\.6/);
 assert.match(js,/format:"CODE128"/);
 assert.match(js,/JsBarcode\(svg,row\.number/);
 assert.match(js,/\!qrReady\|\|\!barcodeReady/);
 assert.match(js,/row\.issued_at/);
 assert.match(js,/row\.verify_token/);
 assert.match(css,/\.signature-stack/);
 assert.match(css,/\.sheet-linear-code/);
 assert.match(backend,/signatory_name=isAdmin/);
 assert.match(backend,/signatory_kind=isAdmin\?"director":"issuer"/);
 assert.match(page,/ليس توقيعًا بخط اليد/);
});
test("public verification stays anonymized and old issued documents remain unchanged",()=>{
 const verify=read("supabase/functions/nabd-document-verify/index.ts");
 assert.match(verify,/\.select\("id,doc_type,status,issued_at"\)/);
 assert.doesNotMatch(verify,/\.select\(".*(subject_details|signatory_name|subject_name).*"\)/);
 assert.match(sql,/alter table public\.nabd_official_documents/);
 assert.doesNotMatch(sql,/update public\.nabd_official_documents/i);
});
