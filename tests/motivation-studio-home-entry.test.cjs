"use strict";
const fs=require("node:fs");
const path=require("node:path");
const test=require("node:test");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const home=fs.readFileSync(path.join(root,"index.html"),"utf8");
test("small NABD Motivation Studio button is visible in the active homepage hero",()=>{
 const active=home.split('<div class="neo-site" id="nabdNeoHome"')[1]?.split('<div id="nabdLegacyShell"')[0]||"";
 assert.ok(active,"active homepage shell exists");
 assert.match(active,/<a class="neo-motivation-mini" href="motivation-studio\.html"/);
 assert.match(active,/data-neo-ar="✍️ أنشئ رسالة الدافع"/);
 assert.match(active,/data-neo-en="✍️ Write a Motivation Letter"/);
 assert.match(home,/\.neo-site \.neo-hero-buttons \.neo-motivation-mini\{min-height:35px;/);
 assert.ok(fs.existsSync(path.join(root,"motivation-studio.html")),"destination page exists");
});
test("homepage's primary existing links are retained",()=>{
 for(const href of ["scholarships.html","nabd-hope.html","portal.html","impact-lab/"]) {
  assert.match(home,new RegExp('href="'+href.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"'));
 }
});
