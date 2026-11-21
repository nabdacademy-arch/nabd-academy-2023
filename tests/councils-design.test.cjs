"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const js=read("assets/js/councils.js");
const css=read("assets/css/councils.css");
const html=read("councils.html");
const codes=["trustees","academic","research","students","international","quality","digital","humanitarian"];

test("eight original local illustrations exist with valid basic SVG elements",()=>{
 for(const code of codes){
  const asset=read("assets/images/councils/"+code+".svg");
  assert.match(asset,/<svg\b/);
  assert.match(asset,/<\/svg>/);
  assert.match(asset,/<linearGradient\b/);
  assert.ok(asset.length>1400,code+" illustration missing");
 }
 const hero=read("assets/images/councils/hero-architecture.svg");
 assert.match(hero,/<svg\b/);
 assert.match(hero,/<\/svg>/);
 assert.ok(hero.length>2000);
});

test("visual upgrade uses internal images and screenshot-inspired gold/navy style",()=>{
 assert.match(css,/NABD COUNCILS \/ SIGNATURE INSTITUTIONAL DESIGN v2/);
 assert.match(css,/--gold: #dfbd80/);
 assert.match(css,/images\/councils\/hero-architecture\.svg/);
 assert.match(css,/\.council-art img/);
 assert.match(css,/\.sidebar-security/);
 assert.match(css,/@media\(max-width:490px\)/);
 assert.match(html,/class="sidebar-crest"/);
 assert.match(html,/class="activity-shell"/);
 assert.match(html,/data-tab="records"/);
});

test("functional portal retains backend auth and RLS boundaries",()=>{
 assert.match(html,/id="workspace"[^>]*hidden/);
 assert.match(js,/auth\.getUser\(\)/);
 assert.match(js,/signInWithPassword/);
 assert.match(js,/canAccess\(c\.code\)/);
 assert.match(js,/assets\/images\/councils\//);
 assert.match(js,/state\.memberships\.filter\(m=>m\.active\)\.length/);
 assert.doesNotMatch(html,/تم اعتماد محضر اجتماع المجلس الأعلى/);
 assert.doesNotMatch(html,/د\. خالد الأحمد/);
});

test("artwork remains decorative and interface supports RTL and English",()=>{
 assert.match(js,/aria-hidden="true"><img loading="lazy"/);
 assert.match(js,/alt=""/);
 assert.match(html,/lang="ar" dir="rtl"/);
 assert.match(html,/data-en=/);
 assert.match(css,/prefers-reduced-motion/);
});
