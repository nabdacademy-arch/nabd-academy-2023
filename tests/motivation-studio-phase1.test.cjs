"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("motivation-studio.html");
const js=read("assets/js/motivation-studio.js");
const css=read("assets/css/motivation-studio.css");
const edge=read("supabase/functions/nabd-motivation-studio/index.ts");

test("standalone portal is properly linked and loads actual local assets",()=>{
 assert.match(read("scholarships.html"),/href="motivation-studio\.html"/);
 assert.match(html,/href="assets\/css\/motivation-studio\.css\?v=1"/);
 assert.match(html,/src="assets\/js\/motivation-studio\.js\?v=1"/);
 assert.match(html,/<html lang="ar" dir="rtl">/);
 assert.match(css,/@media \(max-width:620px\)/);
});
test("the three actual form stages have required accessible fields",()=>{
 for(const step of [1,2,3])assert.match(html,new RegExp('id="step'+step+'" data-step="'+step+'"'));
 for(const field of ["kindInput","specialty","opportunity","about","achievements","challenges","future",
  "why","fit","requirements","organization","language","tone","length","aiConsent","motivation-captcha"])
  assert.match(html,new RegExp('id="'+field+'"'));
 for(const purpose of ["scholarship","university","job","internship","research","volunteer","exchange","fellowship","other"])
  assert.match(html,new RegExp('data-kind="'+purpose+'"'));
});
test("AI requests are consented, CAPTCHA-gated, and never simulated offline",()=>{
 assert.match(js,/aiConsent/);
 assert.match(js,/turnstile\.getResponse/);
 assert.match(js,/turnstile\.reset/);
 assert.match(js,/fetch\(API/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|service_role|sb_secret_/i);
 assert.doesNotMatch(html,/SUPABASE_SERVICE_ROLE_KEY|GROQ_API_KEY|GEMINI_API_KEY/i);
});
test("server validates CAPTCHA origin and expected action before model call",()=>{
 assert.match(edge,/siteverify/);
 assert.match(edge,/data\.hostname===HOSTNAME && data\.action===ACTION/);
 assert.match(edge,/if\(origin&&origin!==ORIGIN\)/);
 assert.match(edge,/if\(!passed\)return reply/);
 assert.match(edge,/await allowRate\(ip\)/);
 assert.match(edge,/RATE_LIMIT/);
 assert.match(edge,/p\.aiConsent!==true/);
});
test("AI prompt safeguards truth and personalization",()=>{
 for(const phrase of ["NEVER invent grades","untrusted facts/data","never contain generic placeholders","natural, individualized",
   "new variation substantially distinct"]){
   assert.ok(edge.includes(phrase)||edge.toLowerCase().includes(phrase.toLowerCase()),phrase);
 }
 assert.match(edge,/No personal prose, names, or letters are written/);
});
test("new rate limiter only stores an anonymized digest and time",()=>{
 const migration=read("supabase/migrations/20261122140511_nabd_motivation_studio_private_rate_gate_20261122.sql");
 assert.match(migration,/key_digest text NOT NULL/);
 assert.match(migration,/created_at timestamptz NOT NULL/);
 assert.match(migration,/ENABLE ROW LEVEL SECURITY/);
 assert.match(migration,/REVOKE ALL ON FUNCTION public\.nabd_motivation_try_rate\(text\) FROM PUBLIC, anon, authenticated/);
 assert.doesNotMatch(migration,/letter_text|applicant_name|personal_story|applicant_email/);
});
test("editable result includes download, copy and fresh variant controls",()=>{
 for(const id of ["generatedLetter","copyBtn","downloadBtn","newVariantBtn","strengthList","missingList","qualityBar","wordCount"])
 assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/new Blob\(/);
 assert.match(js,/output\.addEventListener\("input"/);
});

test("every opportunity type drives purpose-specific hints and server writing criteria",()=>{
 for(const kind of ["scholarship","university","job","internship","research",
   "volunteer","exchange","fellowship","other"]){
   assert.match(js,new RegExp('\\b'+kind+':\\['),
     "Missing tailored UI hints for "+kind);
   assert.match(edge,new RegExp('\\b'+kind+':"'),
     "Missing tailored AI instructions for "+kind);
 }
 assert.match(html,/id="kindContext"[^>]*aria-live="polite"/);
 assert.match(html,/id="qualityAdvice"[^>]*aria-live="polite"/);
 assert.match(js,/function updateContext\(/);
 assert.match(js,/function updateAdvice\(/);
});

test("variation strategies change without changing application facts",()=>{
 assert.match(edge,/const structures=\[/);
 assert.match(edge,/const writingAngle=structures\[/);
 assert.match(edge,/Never use a rigid template/);
 assert.match(js,/const jump=1\+\(random\[0\]%8\)/);
 assert.match(js,/variant=\(\(variant-1\+jump\)%9\)\+1/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|sb_secret_/i);
});

test("professional workspace remains private and export is explicit",()=>{
 for(const id of ["saveBrief","loadBrief","resetBrief","briefFile","moment","mustInclude",
  "wordLimit","draftHistory","draftTabs","compareBtn","compareColumns","printBtn",
  "printLetter","checkFacts","checkFit","checkVoice","wordLimitStatus","genericWarning"])
   assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/NABD_MOTIVATION_BRIEF/);
 assert.match(js,/window\.confirm/);
 assert.match(js,/file\.size>25000/);
 assert.match(js,/aiConsent"\)\.checked=false/);
 assert.match(js,/const drafts=\[\]/);
 assert.match(js,/selectedDraft/);
 assert.match(js,/function renderDrafts/);
 assert.match(js,/function rememberDraft/);
 assert.match(js,/text\.textContent=draft\.letter/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|indexedDB|sendBeacon/);
 assert.match(css,/@media print/);
});
test("word limits and grounded evidence pass defensible bounds",()=>{
 assert.match(edge,/wordLimit=p\.wordLimit===undefined\?0:p\.wordLimit/);
 assert.match(edge,/wordLimit<150\|\|wordLimit>900/);
 assert.match(edge,/key==="moment"\?1100:key==="mustInclude"\?650/);
 assert.match(edge,/Evidence-first editing/);
 assert.match(edge,/Distinguish aspirations from completed accomplishments/);
 assert.match(edge,/actual>input\.wordLimit/);
 assert.match(js,/wordLimitStatus/);
 assert.match(js,/classList\.toggle\("over-limit"/);
 assert.match(js,/letter-warning/);
});
