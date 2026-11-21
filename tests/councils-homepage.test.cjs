"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const page=read("index.html");
const style=read("assets/css/nabd-councils-home.css");
const portal=read("councils.html");
test("compact main homepage links to the real members-only councils gateway",()=>{
 const compact=page.slice(page.indexOf('id="nabdNeoHome"'),page.indexOf('id="nabdLegacyShell"'));
 assert.match(compact,/id="neo-councils"/);
 assert.match(compact,/href="#neo-councils"/);
 assert.match(compact,/href="councils\.html" class="neo-councils-button"/);
 assert.match(compact,/href="councils\.html" data-neo-ar="بوابة المجالس الثمانية/);
 assert.match(compact,/data-neo-en="NABD Academy Councils Network"/);
 assert.match(compact,/الدخول للأعضاء المعتمدين فقط/);
 assert.match(page,/nabd-councils-home\.css\?v=1/);
});
test("homepage has a single linked feature and does not expose member records",()=>{
 assert.equal((page.match(/id="neo-councils"/g)||[]).length,1);
 assert.equal((page.match(/class="neo-councils-button"/g)||[]).length,1);
 assert.match(portal,/id="workspace"[^>]*hidden/);
 assert.ok(style.includes("hero-architecture.svg"));
 assert.match(style,/@media\(max-width:520px\)/);
 assert.match(style,/\.neo-site \.neo-councils-section/);
});
