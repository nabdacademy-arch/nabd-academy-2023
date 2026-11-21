"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=x=>fs.readFileSync(path.resolve(__dirname,"..",x),"utf8");
const main=read("open-doors-ai.html");
const essay=read("assets/js/open-doors-essay.js");
const choice=read("assets/js/open-doors-choice.js");
const masters=read("assets/js/open-doors-masters.js");
const home=read("index.html");
test("Public guest coach is explicitly login-free and contains independent bank fallback",()=>{
 assert.match(main,/id="appView"/);
 assert.match(main,/function localStudyBank\(\)/);
 assert.match(main,/function localTranslations\(questions\)/);
 assert.match(main,/function bankStatus\(text,refresh\)/);
 assert.match(main,/function withDeadline\(promise,ms=8500\)/);
 assert.match(main,/\$\("retryBankBtn"\)\.onclick=loadPortal/);
 assert.doesNotMatch(main,/<input[^>]*type=["'](?:email|password)["']/i);
 assert.doesNotMatch(main,/signInWithPassword|auth\.getUser\(/);
 assert.match(home,/open-doors-ai\.html/);
});
test("Guest progress stays local and no database attempts or auth are written",()=>{
 assert.match(main,/localStorage\.getItem\(GUEST_ATTEMPTS_KEY\)/);
 assert.match(main,/localStorage\.setItem\(GUEST_ATTEMPTS_KEY/);
 assert.match(main,/typeof x\.is_correct==='boolean'/);
 assert.match(main,/function persistGuestAttempts/);
 assert.doesNotMatch(main,/\.from\(['"]open_doors_attempts['"]\)/);
 assert.doesNotMatch(choice,/\.insert\(|\.upsert\(/);
});
test("Exam clock is real-deadline based, including answer and self-mark guards",()=>{
 assert.match(main,/state\.deadline=Date\.now\(\)\+180\*60\*1000/);
 assert.match(main,/Math\.ceil\(\(state\.deadline-Date\.now\(\)\)\/1000\)/);
 assert.match(main,/function mockTimeExpired\(\)/);
 assert.match(main,/state\.mode==='mock'&&state\.deadline&&Date\.now\(\)>=state\.deadline/);
 assert.match(main,/if\(state\.locked\|\|mockTimeExpired\(\)\)return/);
 assert.match(main,/if\(!\$\('nextBtn'\)\.disabled\|\|mockTimeExpired\(\)\)return/);
 assert.match(main,/function finishRound\(\)\{if\(state\.complete\)return/);
 assert.match(main,/document\.addEventListener\('visibilitychange'/);
});
test("No third-party CDN outage makes locally authored question banks inaccessible",()=>{
 assert.match(main,/dbPromise=import\('/);
 assert.match(main,/\.catch\(\(\)=>null\)/);
 assert.match(essay,/dbPromise=import\("/);
 assert.match(choice,/dbPromise=import\("/);
 assert.match(masters,/dbPromise=import\("/);
 for(const src of [main,essay,choice,masters]){
  assert.match(src,/@supabase\/supabase-js@2\.57\.0/);
 }
});
test("Optional archive can retry after failed requests",()=>{
 assert.match(essay,/let archivePromise=null/);
 assert.match(essay,/if\(archivePromise\)return archivePromise/);
 assert.match(essay,/state\.cacheLoaded=true/);
 assert.doesNotMatch(essay,/if\(state\.cacheLoaded\)return;state\.cacheLoaded=true/);
 assert.match(essay,/\.finally\(\(\)=>\{archivePromise=null\}\)/);
});
test("All student bank entries are clearly independent practice, not official Open Doors",()=>{
 assert.match(main,/ليست امتحانات رسمية مسرّبة/);
 assert.match(choice,/not claim they appeared in the live exam/);
 assert.match(masters,/No fake official questions/);
});
