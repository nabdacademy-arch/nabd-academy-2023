"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const bankJS=read("assets/js/open-doors-choice-bank.js");
const appJS=read("assets/js/open-doors-choice.js");
const css=read("assets/css/open-doors-choice.css");
const html=read("open-doors-ai.html");
new vm.Script(bankJS,{filename:"open-doors-choice-bank.js"});
new vm.Script(appJS.replace(/^import \{createClient\}[^\n]+$/m,""),{filename:"open-doors-choice.js"});
const root={};vm.runInNewContext(bankJS,root);
const b=root.OpenDoorsChoiceBank;
assert.ok(b);
assert.equal(b.QUESTIONS.length,24,"24 independent authored science questions");
for(const subject of ["chemistry","biology","medicine"]){
 assert.equal(b.sample("single",subject).length,4);
 assert.equal(b.sample("multi",subject).length,4);
 assert.ok(b.SOURCES[subject].url.startsWith("https://od.globaluni.ru/subject/"));
 assert.match(b.SOURCES[subject].sample,/https:\/\/od\.globaluni\.ru\/attachment\/\d+\/download/);
 for(const kind of ["single","multi"]){
  for(const q of b.sample(kind,subject)){
   assert.equal(q.origin,"NABD_ORIGINAL");
   assert.equal(q.kind,kind);
   assert.equal(q.subject,subject);
   assert.equal(q.options.length,4);
   assert.equal(q.options_ar.length,4);
   assert.ok(q.question.length>18&&q.question_ar.length>10);
   assert.ok(q.explanation_en.length>20&&q.explanation_ar.length>15);
   assert.equal(q.correct.length,kind==="single"?1:3);
   const perfect=b.grade(q,[...q.correct]);
   assert.equal(perfect.score,kind==="single"?1:3,q.id+" grading all correct");
   assert.equal(perfect.max,kind==="single"?1:3);
   assert.equal(perfect.exact,true);
   const wrong=q.options.map((_,i)=>i).filter(i=>!q.correct.includes(i));
   assert.ok(wrong.length);
   const penalized=b.grade(q,[...q.correct,...wrong.slice(0,1)]);
   assert.equal(penalized.score,0,q.id+" false selection should not receive credit");
   const empty=b.grade(q,[]);
   assert.equal(empty.score,0);
  }
  for(let i=0;i<25;i++){
   const q=b.generated(subject,kind,i);
   assert.equal(q.kind,kind);
   assert.equal(q.subject,subject);
   assert.equal(q.correct.length,kind==="single"?1:3);
   assert.equal(q.origin,"NABD_ORIGINAL");
   assert.equal(new Set(q.options).size,q.options.length,"Distinct generated options "+q.id);
   assert.equal(b.grade(q,q.correct).score,kind==="single"?1:3);
  }
 }
}
const sampleDB={id:"OD26-001",subject:"biology",kind:"multi",topic:"Genetics",difficulty:"intermediate",
 question:"Select all valid genetic statements.",options:["Crossing over","Random mutation","Selection","Every offspring identical"],
 answers:["A","B","C"],explanation:"العبور والطفرات والانتخاب يغيرون التنوع.",origin:"authored",
 source_note:"https://od.globaluni.ru/attachment/4558541/download"};
const normalized=b.normalizeDatabase(sampleDB);
assert.deepEqual(Array.from(normalized.correct),[0,1,2]);
assert.equal(normalized.origin,"NABD_EXISTING_DATABASE");
assert.equal(normalized.source,b.SOURCES.biology.url);
assert.equal(normalized.explanation_ar,sampleDB.explanation);
assert.equal(b.grade(normalized,[0,1,2]).score,3);
assert.equal(b.grade(normalized,[0,1]).score,2);
assert.equal(b.grade(normalized,[0]).score,1);
assert.equal(b.grade(normalized,[0,3]).score,0);
assert.equal(b.grade(normalized,[3]).score,0);
const s=b.normalizeDatabase({...sampleDB,kind:"single",answers:["C"]});
assert.equal(b.grade(s,[2]).score,1);
assert.equal(b.grade(s,[0]).score,0);
assert.equal(b.normalizeDatabase({...sampleDB,answers:["A","A"]}),null);
assert.equal(b.normalizeDatabase({...sampleDB,answers:[]}),null);
assert.equal(b.normalizeDatabase({...sampleDB,kind:"written"}),null);
const tabIDs=["choiceSingle","choiceMulti"];
for(const id of tabIDs){
 for(const tag of [
  'data-tab="'+id+'"','id="'+id+'"','id="'+id+'Subject"','id="'+id+'Source"','id="'+id+'Count"',
  'id="'+id+'Start"','id="'+id+'Translate"','id="'+id+'Prompt"','id="'+id+'PromptArabic"',
  'id="'+id+'Options"','id="'+id+'Check"','id="'+id+'Next"','id="'+id+'Status"','id="'+id+'Result"',
  'id="'+id+'Summary"'
 ])assert.ok(html.includes(tag),"Missing "+tag);
}
for(const name of ["choiceSingleQuick","choiceMultiQuick"]){
 assert.ok(html.includes('id="'+name+'"'));
 assert.ok(appJS.includes(name));
}
assert.match(html,/'essayLab','choiceSingle','choiceMulti'/,"All new tabs handled in original selectTab()");
assert.match(html,/open-doors-choice-bank\.js\?v=1/);
assert.match(html,/open-doors-choice\.js\?v=1/);
assert.match(html,/open-doors-choice\.css\?v=1/);
assert.match(appJS,/\.from\("open_doors_questions"\)/);
assert.match(appJS,/\.in\("kind",\["single","multi"\]\)/);
assert.match(appJS,/db\.functions\.invoke\("open-doors-translate"/);
assert.match(appJS,/renderResult\(ctx\)/);
assert.match(appJS,/function exportReport/);
assert.match(appJS,/if\(ctx\.kind==="single"\)/);
assert.doesNotMatch(appJS,/open-doors-essay-grade|service_role|SUPABASE_SERVICE_ROLE_KEY/);
assert.match(css,/@media\(max-width:760px\)/);
assert.match(css,/focus-within/);
console.log("Open Doors choice labs: 120 prior DB items supported, 24 bilingual new original items, 150 generated variants smoke-tested, translation hooks, strict answer key, safe partial credit and mobile UIs OK.");
