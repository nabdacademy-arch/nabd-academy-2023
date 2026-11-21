"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const read=x=>fs.readFileSync(path.join(__dirname,"..",x),"utf8");
const bachelor=read("open-doors-ai.html");
const masters=read("open-doors-masters.html");
const masterJS=read("assets/js/open-doors-masters.js");
const choice=read("assets/js/open-doors-choice.js");
const essay=read("assets/js/open-doors-essay.js");
const migration=read("supabase/migrations/20261122_open_doors_public_readonly_practice.sql");
const homepage=read("index.html");
const homeStyle=read("assets/css/open-doors-public-home.css");

test("Open Doors Bachelor and Master portals have zero required login fields",()=>{
 for(const [name,page] of [["Bachelor",bachelor],["Master",masters]]){
  assert.doesNotMatch(page,/<input[^>]+type=["'](?:email|password)["']/i,name+" login field");
  assert.doesNotMatch(page,/id=["'](?:loginForm|mastersLoginForm)["']/i);
  assert.match(page,/بدون (?:تسجيل دخول|بريد أو كلمة مرور)/,name+" guest promise");
 }
 assert.doesNotMatch(bachelor,/signInWithPassword|db\.auth\.getUser/);
 assert.match(bachelor,/await loadPortal\(\)/);
 assert.match(masterJS,/launchPublicMasters\(\)/);
 assert.doesNotMatch(masterJS,/signInWithPassword|authorize\(\)/);
});

test("Open Doors training scripts parse without authentication",()=>{
 const match=bachelor.match(/<script type="module">([\s\S]*?)<\/script>/);
 assert.ok(match,"Bachelor inline module");
 const code=match[1].replace(/^import \{createClient\}[^\n]*\n/m,"");
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 assert.doesNotThrow(()=>new AsyncFunction(code));
 for(const [name,src] of [["masters",masterJS],["essay",essay],["choice",choice]]){
  assert.doesNotThrow(()=>new vm.Script(src.replace(/^import \{createClient\}[^\n]*\n/m,""),{filename:name}));
 }
});

test("public read-only grants keep attempts and paid AI grading protected",()=>{
 for(const table of ["open_doors_questions","open_doors_sources","open_doors_patterns"]){
  assert.match(migration,new RegExp("grant select on table public\\."+table+" to anon, authenticated"));
  assert.ok(migration.includes('create policy "NABD Open Doors public '),"Public training policy missing");
  assert.ok(migration.includes('on public.'+table),"Policy for "+table+" missing");
 }
 assert.match(migration,/revoke all on public\.open_doors_attempts from anon/);
 assert.match(migration,/revoke insert, update, delete on public\.open_doors_questions from anon/);
 assert.match(bachelor,/persistGuestAttempts\(\)/);
 assert.match(bachelor,/localStorage\.setItem\(GUEST_ATTEMPTS_KEY/);
 assert.doesNotMatch(bachelor,/\.from\(['"]open_doors_attempts['"]\)/);
 assert.doesNotMatch(choice,/SIGN_IN_REQUIRED/);
 assert.doesNotMatch(essay,/Sign in to NABD first/);
 assert.match(essay,/db\.functions\.invoke\("open-doors-essay-grade"/);
 assert.match(masters,/id="masterApp" hidden/);
 assert.match(masterJS,/gradeBtn\.disabled=true;gradeBtn\.hidden=true/);
 assert.match(masterJS,/ai\.disabled=true;ai\.hidden=true/);
 assert.match(bachelor,/id="essayGrade"[^>]*hidden style="display:none"/);
});

test("homepage has a clearly discoverable bilingual no-login card with both links",()=>{
 assert.match(homepage,/id="nabd-open-doors-public"/);
 assert.match(homepage,/href="open-doors-ai\.html"/);
 assert.match(homepage,/href="open-doors-masters\.html"/);
 assert.match(homepage,/بدون تسجيل/);
 assert.match(homepage,/data-neo-en="No sign-in"/);
 assert.match(homepage,/assets\/css\/open-doors-public-home\.css\?v=1/);
 assert.match(homeStyle,/\.nabd-od-home-container/);
 assert.match(homeStyle,/@media\(max-width:660px\)/);
 assert.match(bachelor,/open-doors-choice\.js\?v=3/);
 assert.match(bachelor,/open-doors-essay\.js\?v=3/);
 assert.match(masters,/open-doors-masters\.js\?v=3/);
});
