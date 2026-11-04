import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {scenario} from "../scenario-data.mjs";
const root=new URL("../",import.meta.url);
const html=readFileSync(new URL("index.html",root),"utf8");
const app=readFileSync(new URL("app.mjs",root),"utf8");
const sw=readFileSync(new URL("sw.js",root),"utf8");
const manifest=JSON.parse(readFileSync(new URL("manifest.webmanifest",root),"utf8"));
for(const file of ["index.html","heart-lab.html","clinical-hub.html","clinical-hub.css","clinical-hub.mjs","clinical-engine.mjs","clinical-cases.mjs","app.mjs","styles.css","sw.js","scenario-data.mjs","manifest.webmanifest","icon.svg"])assert.ok(existsSync(new URL(file,root)),file);
assert.equal(scenario.steps.length,3);
assert.equal(scenario.maxPoints,6);
scenario.steps.forEach((step,i)=>{
  assert.equal(step.options.length,3, "step "+i);
  assert.ok(step.options.some(o=>o.points===2),"positive answer in step "+i);
  for(const option of step.options){
    assert.ok([0,2].includes(option.points));
    assert.ok(option.ar&&option.en&&option.feedback.ar&&option.feedback.en);
  }
});
assert.equal(manifest.start_url,"./index.html");
assert.equal(manifest.scope,"./");
assert.match(html,/lang="ar" dir="rtl"/);
assert.match(html,/data-view-button="case"/);
assert.match(html,/data-view-button="offline"/);
assert.match(html,/heart-lab.html/);
assert.match(sw,/nabd-atlas-foundation-v3/);
assert.match(html,/clinical-hub.html/);
assert.match(app,/clinical-hub\.mjs/);
assert.match(app,/import \{scenario\}/);
assert.match(app,/localStorage/);
assert.match(app,/caches\.open/);
assert.match(sw,/request\.method!=="GET"/);
assert.match(sw,/url\.origin!==self\.location\.origin/);
assert.match(sw,/url\.pathname\.startsWith/);
assert.ok(!/supabase\.co|service_role|patient_email|api_key/i.test(app+sw+html));
console.log("NABD ATLAS foundation structural and simulation checks passed.");