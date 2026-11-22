"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const page=read("index.html"),service=read("assets/js/nabd-neo-locale-data.js");
const neo=page.slice(page.indexOf('<div class="neo-site"'),page.indexOf('<div id="nabdLegacyShell"'));
const sources=[...new Set([...neo.matchAll(/data-neo-en="([^"]*)"/g)]
 .map(x=>x[1].replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'")))];
const sourceMatch=service.match(/const sources=(\[[^\n]+\]);/);
const locales=["fr","es","tr","ru","de","it","id","pt","zh","ur"];
test("homepage preserves academy identity and existing content structure",()=>{
 assert.match(page,/أكاديمية نبض للعلوم الطبية/);
 assert.match(page,/id="nabdNeoHome"/);
 assert.match(page,/class="neo-hero"/);
 assert.match(page,/class="neo-programs"/);
 assert.match(page,/data-neo-en="open to everyone\."/);
 assert.ok(!page.includes('data-home-lang="xx"'));
});
test("12 real language options, semantic and keyboard accessible",()=>{
 const actual=[...neo.matchAll(/<button type="button" data-home-lang="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(actual,["ar","en",...locales]);
 assert.match(neo,/id="neoLang"[^>]*aria-controls="neoLangMenu"[^>]*aria-expanded="false"/);
 assert.match(neo,/id="neoLangMenu"[^>]*hidden/);
 assert.match(page,/if\(e\.key==="Escape"\)/);
 assert.match(page,/localStorage\.setItem\("nabdCompactHomeLanguage"/);
 assert.match(page,/setAttribute\("aria-pressed"/);
});
test("the ten locale files actually translate every original homepage phrase",()=>{
 assert.ok(sourceMatch,"source text manifest missing");
 const manifest=JSON.parse(sourceMatch[1]);
 assert.deepEqual(manifest,sources,"translation source manifest must not drift from homepage markup");
 assert.equal(manifest.length,135);
 for(const lang of locales){
  const file=JSON.parse(read("assets/i18n/neo-home/"+lang+".json"));
  assert.equal(file.lang,lang);
  assert.equal(file.translations.length,manifest.length,"Incomplete "+lang);
  assert.ok(file.translations.every(t=>typeof t==="string"&&t.trim().length>0),"empty "+lang);
  assert.ok(file.translations.filter((t,i)=>t!==manifest[i]).length>=112,"Locale not genuinely translated: "+lang);
  assert.ok(file.translations[manifest.indexOf("Our proposed goal: support 100 students across Gaza with tuition, transport, devices and learning essentials. The program is in preparation; this is not a funded award count.")].includes("100"),"The proposed (not funded) 100-student goal must remain in "+lang);
  assert.ok(file.translations[manifest.indexOf("196 NABD bank questions")].includes("196"),"Question count must remain intact in "+lang);
  assert.doesNotMatch(file.translations.join(" "),/<script|javascript:|<iframe/i);
 }
});
test("language support is self-hosted, no personal content is sent to external translation services",()=>{
 assert.match(service,/credentials:"omit"/);
 assert.match(service,/TRANSLATION_INVALID/);
 assert.match(service,/translations\.length!==sources\.length/);
 assert.doesNotMatch(service,/translate\.google|translate\.yandex|api\.mymemory|localStorage|sessionStorage/);
});
test("responsive header uses earlier breakpoint and does not change other page components",()=>{
 const css=read("assets/css/nabd-neo-mobile-languages.css");
 assert.match(page,/href="assets\/css\/nabd-neo-mobile-languages\.css\?v=1"/);
 assert.match(page,/src="assets\/js\/nabd-neo-locale-data\.js\?v=1"/);
 assert.match(css,/@media\(max-width:1240px\)/);
 assert.match(css,/\.neo-site \.neo-nav\.neo-open/);
 assert.match(css,/\.neo-site \.neo-lang-menu:not\(\[hidden\]\)/);
 assert.match(css,/\.neo-site \.neo-brand/);
 assert.doesNotMatch(css,/neo-portrait|neo-programs|neo-hero-grid|neo-initiatives/);
});
