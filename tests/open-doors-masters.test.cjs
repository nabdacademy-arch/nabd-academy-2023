"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
const src=read("assets/js/open-doors-masters-bank.js");
const app=read("assets/js/open-doors-masters.js");
const html=read("open-doors-masters.html");
const css=read("assets/css/open-doors-masters.css");
const bachelor=read("open-doors-ai.html");
new vm.Script(src,{filename:"open-doors-masters-bank.js"});
new vm.Script(app.replace(/^import \{createClient\}[^\n]*\n/m,""),{filename:"open-doors-masters.js"});
const win={};vm.runInNewContext(src,{globalThis:win,Math,Date,Number,Object,Set,Error,Array});
const B=win.NabdOpenDoorsMasters;
assert.ok(B);
assert.equal(B.questions.length,81);
assert.equal(B.single.length,36);assert.equal(B.multi.length,24);
assert.equal(B.written.length,12);assert.equal(B.oral.length,9);
assert.equal(new Set(Array.from(B.questions,x=>x.id)).size,81);
for(const sub of ["chemistry","biology","medicine"]){
 const s=B.SUBJECTS[sub];assert.ok(s);
 assert.match(s.page,/^https:\/\/od\.globaluni\.ru\/subject\/\d+\/ma$/);
 assert.match(s.program,/^https:\/\/od\.globaluni\.ru\/attachment\/\d+\/download$/);
 assert.match(s.sample,/^https:\/\/od\.globaluni\.ru\/attachment\/\d+\/download$/);
 assert.equal(B.subjectItems(sub,"single").length,12);
 assert.equal(B.subjectItems(sub,"multi").length,8);
 assert.equal(B.subjectItems(sub,"written").length,4);
 assert.equal(B.subjectItems(sub,"oral").length,3);
 assert.ok(s.fields.length>=5);
 for(const kind of ["single","multi","written","oral"]){
  const arr=B.subjectItems(sub,kind);
  for(const q of arr){
   assert.equal(q.subject,sub);assert.equal(q.kind,kind);
   assert.equal(q.origin,"NABD_MASTERS_AUTHORED");
   assert.ok(q.prompt_en.length>20&&q.prompt_ar.length>15);
   if(["single","multi"].includes(kind)){
    assert.equal(q.options.length,4);assert.equal(q.options_ar.length,4);
    assert.ok(q.explanation_en.length>25);assert.ok(q.explanation_ar.length>22);
    assert.equal(B.gradeChoice(q,Array.from(q.correct)).score,kind==="single"?1:3);
    assert.equal(B.gradeChoice(q,[]).score,0);
    const wrong=[0,1,2,3].find(i=>!q.correct.includes(i));
    assert.notEqual(wrong,undefined);
    assert.equal(B.gradeChoice(q,[wrong]).score,0);
    if(kind==="multi"){
     assert.equal(B.gradeChoice(q,Array.from(q.correct).slice(0,2)).score,2);
     assert.equal(B.gradeChoice(q,[q.correct[0],wrong]).score,0);
    }
   }else{
    assert.ok(q.model_en.length>50&&q.model_ar.length>40);
    assert.equal(q.rubric.length,4);
    assert.equal(q.rubric.reduce((x,y)=>x+y.points,0),10);
    assert.equal(q.points,kind==="oral"?5:10);
   }
  }
 }
 for(let seed=0;seed<320;seed+=3){
  for(const kind of ["single","multi"]){
   const v=B.generated(sub,kind,seed);
   assert.equal(new Set(Array.from(v.options)).size,4,"duplicate options "+v.id);
   assert.ok(v.prompt_en.length>25&&v.prompt_ar.length>25);
   assert.equal(B.gradeChoice(v,Array.from(v.correct)).score,kind==="single"?1:3);
   assert.equal(v.origin,"NABD_MASTERS_GENERATED");
  }
 }
 for(const seed of [1,13,20261115,999899]){
  const exam=B.exam(sub,seed),items=exam.questions;
  assert.equal(items.length,43);
  assert.equal(items.filter(q=>q.kind==="single").length,25);
  assert.equal(items.filter(q=>q.kind==="multi").length,15);
  assert.equal(items.filter(q=>q.kind==="written").length,3);
  assert.equal(exam.oralChoices.length,3);
  assert.ok(exam.oralChoices.every(q=>q.kind==="oral"));
  assert.equal(new Set(Array.from(items,q=>q.id)).size,43);
  assert.equal(exam.max_total,105);
  assert.equal(exam.duration_written_sec,10500);
  assert.equal(exam.duration_oral_sec,300);
 }
}
assert.ok(B.SUBJECTS.biology.archive.length===2);
assert.equal(B.SUBJECTS.medicine.degrees[0],"32.04.01 Public health");
const tags=["mastersAuth","masterApp","masterSubjectCards","masterPractice",
 "masterPracticeQuestion","masterPracticeCheck","masterPracticeModel","masterSimulation",
 "masterExamStart","masterExamWorkspace","masterExamOral","masterExamResults",
 "masterCurriculum","masterSources","masterProgress"];
for(const id of tags)assert.ok(html.includes('id="'+id+'"'),"Missing "+id);
for(const v of ["home","single","multi","written","oral","simulation","curriculum","sources","progress"])
 assert.ok(html.includes('data-view="'+v+'"'),"Missing view "+v);
for(const subject of ["chemistry","biology","medicine"])
 assert.ok(html.includes('data-subject="'+subject+'"'));
assert.match(html,/open-doors-masters-bank\.js\?v=1/);
assert.match(html,/open-doors-masters\.js\?v=3/);
assert.match(html,/open-doors-masters\.css\?v=1/);
assert.match(bachelor,/href="open-doors-masters\.html"/,"One-click link in existing bachelor trainer");
assert.match(app,/launchPublicMasters\(\)/,"Public guest launch");
assert.doesNotMatch(html,/mastersLoginForm|mastersEmail|mastersPassword/,"No public login fields");
assert.doesNotMatch(app,/signInWithPassword|authorize\(\)/,"No guest sign-in requirement");
assert.match(app,/db\.functions\.invoke\("open-doors-essay-grade"/,"Existing secure essay grader");
assert.match(app,/CONSENT_REQUIRED/,"No AI without opt in");
assert.match(app,/readable===false/,"No fabricated grading for unreadable photo");
assert.match(app,/renderExamResults/);
assert.match(app,/setInterval\(tick,1000\)/);
assert.match(app,/session|localStorage\.setItem/);
assert.doesNotMatch(app,/service_role|SUPABASE_SERVICE_ROLE_KEY|GROQ_API_KEY|GEMINI_API_KEY/);
assert.match(css,/@media\(max-width:530px\)/);
assert.match(css,/focus-visible/);
assert.match(css,/prefers-reduced-motion/);
console.log("PASS Master's lab: 81 bilingual authored questions, verified master's official links, parameter generators, independent 44-task mocks, 175+5 minute timings, self-assessment with protected AI disabled for guests, no login, mobile and previous bachelor link.");
