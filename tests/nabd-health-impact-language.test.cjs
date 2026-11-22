"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>readFileSync(path.join(root,file),"utf8");

test("health impact initiative uses no yellow founding banner or misleading activity numbers",()=>{
 const page=read("nabd-health-impact.html");
 assert.doesNotMatch(page,/class="phase"|حالة المبادرة: قيد التأسيس|Initiative status: in preparation/);
 assert.match(page,/صور من مواد منشورة لجهات إنسانية مستقلة/);
 assert.match(page,/حقوق الصور لأصحابها/);
 assert.match(page,/nabd-site-language\.js/);
});

test("compact homepage adds direct bilingual initiative links without replacing current sections",()=>{
 const page=read("index.html");
 const compact=page.slice(page.indexOf('<div class="neo-site"'),page.indexOf('<div id="nabdLegacyShell"'));
 assert.equal((compact.match(/href="nabd-health-impact\.html"/g)||[]).length,2);
 assert.match(compact,/data-neo-ar="♡ مبادرة نبض للأثر الصحي"/);
 assert.match(compact,/data-neo-en="♡ NABD Health Impact Initiative"/);
 assert.match(page,/localStorage\.setItem\("nabd_lang",lang\)/);
 assert.match(page,/localStorage\.setItem\("nabdCompactHomeLanguage",lang\)/);
});

test("bilingual internal pages share a preference without translating unreviewed languages",()=>{
 const script=read("assets/js/nabd-site-language.js");
 const nav=read("assets/js/nabd-institutional-nav.js");
 const signature=read("assets/js/nabd-signature.js");
 const directory=read("assets/js/academy-directory.js");
 const dirHtml=read("academy-directory.html");
 assert.match(script,/Set\(\["ar","en"\]\)/);
 assert.match(script,/node\.children\.length/);
 assert.match(script,/localStorage\.getItem\(HOMEPAGE_KEY\)/);
 assert.match(script,/localStorage\.setItem\(PRIMARY_KEY,lang\)/);
 assert.match(nav,/nabd-site-language\.js\?v=1/);
 assert.match(signature,/nabd-site-language\.js\?v=1/);
 assert.match(dirHtml,/defer data-nabd-site-language/);
 assert.match(directory,/NABD_SITE_LANGUAGE\?\.get\(\)/);
 assert.match(directory,/NABD_SITE_LANGUAGE\?\.choose\(language\)/);
});
