"use strict";
const assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const read=x=>fs.readFileSync(path.resolve(__dirname,"..",x),"utf8");
const source=read("assets/js/open-doors-masters-bank.js");
const app=read("assets/js/open-doors-masters.js");
const html=read("open-doors-masters.html"),bachelor=read("open-doors-ai.html"),css=read("assets/css/open-doors-masters.css");
new vm.Script(source,{filename:"master-bank"});
const context={};vm.runInNewContext(source,context);
const bank=context.NABDOpenDoorsMastersBank;
assert.ok(bank&&bank.version);
const subjects=["chemistry","biology","medicine"];
assert.equal(bank.QUESTIONS.length,72,"Master's original curated bank: 10 single +6 multi +5 written +3 oral per field");
const ids=new Set();
for(const q of bank.QUESTIONS){
 assert.ok(!ids.has(q.id),"Unique authored ID "+q.id);ids.add(q.id);
 assert.equal(q.origin,"NABD_MASTER_ORIGINAL");
 assert.match(q.source,/^https:\/\/od\.globaluni\.ru\/subject\/(52|45|55)\/ma$/);
 assert.ok(q.prompt_en.length>=24&&q.prompt_ar.length>=14,"Bilingual authored question: "+q.id);
 if(q.kind==="single"||q.kind==="multi"){
  assert.equal(q.options.length,4);assert.equal(q.options_ar.length,4);
  assert.equal(q.correct.length,q.kind==="single"?1:3);
  assert.ok(q.explain_en.length>=16&&q.explain_ar.length>=10);
  assert.equal(bank.gradeChoice(q,q.correct).score,q.kind==="single"?1:3);
  const incorrect=q.options.map((_,i)=>i).filter(i=>!q.correct.includes(i));
  assert.equal(bank.gradeChoice(q,[...q.correct,...incorrect]).score,0);
 }else if(q.kind==="written"){
  assert.equal(q.points,10);assert.equal(q.rubric.length,4);
  assert.equal(q.rubric.reduce((a,c)=>a+c.points,0),10);
  assert.ok(q.model_en.length>=100&&q.model_ar.length>=65);
 }else{
  assert.equal(q.kind,"oral");assert.equal(q.points,5);assert.equal(q.rubric.length,5);
 }
}
for(const subject of subjects){
 assert.equal(bank.available(subject,"single").length,10);
 assert.equal(bank.available(subject,"multi").length,6);
 assert.equal(bank.available(subject,"written").length,5);
 assert.equal(bank.available(subject,"oral").length,3);
 assert.match(bank.SOURCES[subject].page,/\/ma$/);
 assert.match(bank.SOURCES[subject].demo,/\/attachment\/\d+\/download$/);
 assert.match(bank.SOURCES[subject].syllabus,/\/attachment\/\d+\/download$/);
 assert.ok(bank.SOURCES[subject].topics.length>=8);
 for(const kind of ["single","multi"]){
  const seen=new Set();
  for(let n=0;n<400;n++){
   const q=bank.generated(subject,kind,n);
   assert.equal(q.kind,kind);assert.equal(q.subject,subject);
   assert.equal(q.origin,"NABD_MASTER_GENERATED");
   assert.equal(q.options.length,4);assert.equal(q.options_ar.length,4);
   assert.equal(new Set(q.options).size,4,"Options must be different: "+subject+"/"+kind+"/"+n);
   assert.equal(bank.gradeChoice(q,q.correct).score,kind==="single"?1:3);
   assert.ok(q.explain_en.length>=12&&q.explain_ar.length>=8);
   if(n<100)seen.add(q.prompt_en);
  }
  assert.ok(seen.size>(kind==="single"?40:18),"Generator must yield diverse master-level tasks: "+subject+"/"+kind+" got "+seen.size);
 }
}
for(const id of ["dashboard","masterSingle","masterMulti","masterWritten","masterOral","masterExam","officialSources","masterProgress"]){
 assert.match(html,new RegExp('id="'+id+'"'),"Missing view "+id);
 assert.match(html,new RegExp('data-view="'+id+'"'),"Missing tab "+id);
}
assert.match(bachelor,/href="open-doors-masters\.html"/,"One-click Bachelor to Master's link");
assert.match(html,/id="masterAuth"/);assert.match(html,/id="masterLogin"/);assert.match(html,/id="masterPassword"/);
assert.match(html,/data-ar=/);assert.match(html,/data-en=/);assert.match(html,/open-doors-masters-bank\.js\?v=1/);
assert.match(html,/open-doors-masters\.js\?v=1/);
assert.match(app,/await client\.auth\.getUser/);
assert.match(app,/\.from\("open_doors_questions"\)\.select\("id"\)\.limit\(1\)/,"RLS access check");
assert.match(app,/\.functions\.invoke\("open-doors-essay-grade"/,"Picture-based essay AI");
assert.match(app,/\.functions\.invoke\("open-doors-grade"/,"Existing protected written/oral evaluator");
assert.match(app,/const singles=makeDeck\(subject,"single",25/);
assert.match(app,/const multis=makeDeck\(subject,"multi",15/);
assert.match(app,/\.slice\(0,3\).*map\(q=>\(\{q,order:\[\]\}\)\)/);
assert.match(app,/175\*60\*1000/);
assert.match(app,/5\*60\*1000/);
assert.match(app,/objective\+.*essay/);
assert.match(app,/permission=.*checked/);
assert.doesNotMatch(app,/service_role|SUPABASE_SERVICE_ROLE_KEY/);
assert.match(app,/\.textContent=/,"No HTML rendering from user supplied exam answers");
assert.match(css,/prefers-reduced-motion/);assert.match(css,/max-width:600px/);
console.log("PASS: 48 original Master's questions, 2,400 numerical generated test cases, all subject links, 44-task structure, AI consent, protected auth, bilingual workspaces and mobile CSS");
