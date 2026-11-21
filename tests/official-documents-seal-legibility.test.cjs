"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
const html=read("official-documents.html");
const css=read("assets/css/official-documents.css");
const js=read("assets/js/official-documents.js");
const verifier=read("supabase/functions/nabd-document-verify/index.ts");
test("all six document headers print a clear translated English title",()=>{
 const expected={
  statement:"Statement of Account Registration",
  permit:"Internal Participation Authorization",
  report:"Administrative Report",
  treatment_request:"Treatment / Referral Request Form",
  consultation_request:"Consultation Request",
  complaint:"Complaint Submission Form"
 };
 for(const [id,title] of Object.entries(expected)){
  const line=js.split("\n").find(x=>x.includes('id:"'+id+'"'));
  assert.ok(line?.includes('en:"'+title+'"'),id+" must have exact English title");
 }
 assert.match(js,/\$\("sheet-subtitle"\)\.textContent=t\.en\.toUpperCase\(\)/);
 assert.match(html,/id="sheet-subtitle" lang="en" dir="ltr"/);
 assert.match(html,/AUTHORIZED INSTITUTIONAL DOCUMENT/);
 assert.match(html,/النسخة العربية/);
});
test("large vivid Academy-only blue ink seal replaces the small gold medallion",()=>{
 assert.match(html,/class="academy-blue-seal"/);
 assert.match(html,/role="img" aria-label="ختم مؤسسي أزرق لأكاديمية نبض/);
 assert.match(html,/NABD ACADEMY/);
 assert.match(html,/DIGITAL ACADEMY SEAL/);
 assert.match(html,/أكاديمية نبض/);
 assert.match(css,/\.signature-stack \.institution-seal\s*\{\s*width:156px/);
 assert.match(html,/stroke="#1557a4"/);
 assert.ok(html.indexOf('class="institution-seal"')<html.indexOf('class="issue-signature"'));
});
test("larger print fonts for both languages, readable course labels, safe mobile zoom",()=>{
 assert.match(css,/\.bilingual-text p,.bilingual-text--en p\{font-size:13\.5px/);
 assert.match(css,/\.sheet-document-header>p#sheet-subtitle\{font-size:17px/);
 assert.match(css,/\.signature-stack \.institution-seal\{width:140px/);
 assert.match(js,/confirmedCourseTitles/);
 assert.match(js,/localizedCourse\(c\)\.ar/);
 assert.match(html,/id="zoom-document"/);
 assert.match(js,/classList\.toggle\("doc-preview-zoom"\)/);
 assert.match(css,/@media print\{/);
 assert.match(css,/@page\{size:A4 portrait/);
 assert.doesNotThrow(()=>new Function(js));
});
test("QR, barcode, official issue dates and authorization logic remain unchanged",()=>{
 assert.match(js,/qr\(\$\("sheet-qr"\),link\)/);
 assert.match(js,/JsBarcode\(svg,row\.number/);
 assert.match(js,/\$\("sheet-number"\)\.textContent=row\.number/);
 assert.match(js,/\$\("sheet-date"\)\.textContent=fmt\(row\.issued_at\)/);
 assert.match(js,/\$\("sheet-signatory"\)\.textContent=signatory/);
 assert.match(html,/اعتماد مسجل إلكترونيًا، وليس توقيعًا بخط اليد/);
 assert.match(verifier,/\.eq\("verify_token",token\)/);
 assert.match(html,/official-documents\.js\?v=5/);
 assert.match(html,/official-documents\.css\?v=4/);
});
