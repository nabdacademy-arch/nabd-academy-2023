"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const home=read("index.html");
const base=read("assets/js/nabd-home-i18n.js");
const locales=["fr","es","tr","ru","id","de","pt","zh","hi","ur"];
test("homepage retains its existing name, hero, services and links",()=>{
 assert.match(home,/id="nabdNeoHome"/);
 assert.match(home,/NABD Academy for Medical Sciences/);
 assert.match(home,/id="neo-h1"/);
 assert.match(home,/href="motivation-studio.html"/);
 assert.match(home,/href="nabd-hope.html"/);
 assert.match(home,/href="portal.html"/);
 assert.match(home,/href="academy-full.html"/);
 assert.match(home,/id="neoNav"/);
});
test("12-language real options and accessible mobile dropdown are wired",()=>{
 for(const lang of ["ar","en",...locales])
  assert.match(home,new RegExp('<option value="'+lang+'">'));
 assert.match(home,/id="neoLang" class="neo-language-select"/);
 assert.match(home,/NABD_NEO_I18N\?\.init\(root,switcher\)/);
 assert.match(home,/id="neoLanguageNotice" role="status"/);
 assert.match(home,/assets\/css\/nabd-neo-header-languages\.css\?v=1/);
 assert.match(home,/assets\/js\/nabd-home-i18n\.js\?v=1/);
 assert.match(read("assets/css/nabd-neo-header-languages.css"),/max-width:1599px/);
 assert.match(read("assets/css/nabd-neo-header-languages.css"),/\.neo-site\[dir="ltr"\]/);
 assert.match(base,/script\.src="assets\/js\/nabd-neo-"/);
 assert.doesNotMatch(base,/translate\.google|translat(e|or)\.googleapis|sendBeacon|fetch\(/);
});
test("all ten localized homepage catalogs are complete and nonempty",()=>{
 const texts=[...home.matchAll(/data-neo-ar="([^"]*)" data-neo-en="([^"]*)"/g)];
 assert.equal(texts.length,135,"Translation index must remain aligned to real homepage content.");
 const context=vm.createContext({window:{}});
 for(const lang of locales){
  const file="assets/js/nabd-neo-"+lang+".js";
  const code=read(file);
  vm.runInContext(code,context,{filename:file});
  const translations=context.window.NABD_NEO_TRANSLATIONS[lang];
  assert.equal(translations.length,135,"Incomplete "+lang+" translation");
  for(let i=0;i<translations.length;i++){
   assert.equal(typeof translations[i],"string",lang+" #"+i);
   assert.ok(translations[i].trim().length>1,lang+" empty #"+i);
  }
  assert.notEqual(translations[15],texts[15][2],lang+" intro must really be translated");
  assert.notEqual(translations[85],texts[85][2],lang+" funding disclaimer must be translated");
 }
});
test("no homepage translation sends user information or uses dynamic HTML injection",()=>{
 assert.doesNotMatch(base,/localStorage\.setItem\([^,]+,\s*JSON\.stringify/);
 assert.doesNotMatch(base,/innerHTML|insertAdjacentHTML|eval\(/);
 assert.match(base,/textContent=translated/);
 assert.match(base,/rtl=new Set\(\["ar","ur"\]\)/);
 assert.match(base,/try\{localStorage\.setItem/);
});
