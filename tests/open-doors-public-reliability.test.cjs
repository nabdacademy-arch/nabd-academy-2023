"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
const html=read("open-doors-ai.html");
const essay=read("assets/js/open-doors-essay.js");
const choice=read("assets/js/open-doors-choice.js");
const master=read("assets/js/open-doors-masters.js");
const bank=read("assets/js/open-doors-choice-bank.js");
const edge=read("supabase/functions/open-doors-essay-grade/index.ts");
test("public bachelor entry has no email/password gate and offers offline bank fallback",()=>{
 assert.match(html,/بوابة أوبن دورز العامة · بدون تسجيل دخول/);
 assert.doesNotMatch(html,/id="loginForm"/);
 assert.match(html,/id="retryOpenDoors"/);
 assert.match(html,/id="retryBankBtn"/);
 assert.match(html,/localStudyBank\(\)/);
 assert.match(html,/withDeadline\(Promise\.all/);
 assert.match(html,/db\.from\('open_doors_questions'\)/);
 assert.match(html,/GUEST_ATTEMPTS_KEY/);
 assert.match(html,/await loadPortal\(\)/);
});
test("all public question modules parse and local single/multi practice stays available",()=>{
 assert.doesNotThrow(()=>new Function(choice.replace(/^const dbPromise=import\([^\n]+\)[\s\S]*?\.catch\(\(\)=>null\);/,"const dbPromise=Promise.resolve(null);")));
 assert.doesNotThrow(()=>new Function(essay.replace(/^const dbPromise=import\([^\n]+\)[\s\S]*?\.catch\(\(\)=>null\);/,"const dbPromise=Promise.resolve(null);")));
 assert.doesNotThrow(()=>new Function(master.replace(/^import [^\n]+;?/gm,"")));
 assert.match(choice,/function init\(kind\)/);
 assert.match(bank,/window\.OpenDoorsChoiceBank/);
});
test("guests can self-review without an email and are not asked to upload to founder-only AI grading",()=>{
 assert.match(essay,/if\(!access\.data\?\.user\)/);
 assert.match(essay,/\$\("essayReveal"\)\.disabled=false/);
 assert.match(essay,/للجميع: الأسئلة والحلول والمراجعة الذاتية مجانية بلا حساب/);
 assert.match(essay,/if\(!\$\("essayConsent"\)\.checked\)/);
 assert.match(edge,/user\.id!==FOUNDER_USER_ID/);
 assert.doesNotMatch(essay,/signInWithPassword\(/);
});
test("official identity and educational disclaimer are retained",()=>{
 assert.match(html,/ليست امتحانات رسمية مسرّبة/);
 assert.match(html,/open-doors-essay\.js\?v=3/);
 assert.match(html,/open-doors-choice\.js\?v=3/);
});
