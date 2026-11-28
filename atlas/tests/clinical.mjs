import assert from "node:assert/strict";
import {clinicalCases,clinicalDepartments} from "../clinical-cases.mjs";
import {grade,comparePath,isFinished,validateCase,sumMaximum,learningGaps,validDraft,alternativeScores,learningEvidence,explorationPath,crisisStudyPlan,documentationGaps,makePracticeRecord,checkPracticeRecord,comparePracticeRecords} from "../clinical-engine.mjs";
assert.equal(clinicalCases.length,22,"22 scenarios are required");
assert.equal(new Set(clinicalCases.map(x=>x.id)).size,22,"Case IDs must be unique");
assert.equal(clinicalCases.reduce((sum,item)=>sum+item.steps.length,0),86,"86 learning checkpoints expected");
assert.equal(new Set(clinicalCases.map(x=>x.department)).size,13);
assert.equal(clinicalDepartments.length,14);
let partialOptions=0;
for(const item of clinicalCases){
  assert.ok(validateCase(item),item.id);
  assert.equal(sumMaximum(item),item.maxPoints,item.id);
  assert.ok(item.vitals?.hr&&item.vitals?.bp&&item.vitals?.spo2,item.id);
  assert.ok(["intro","intermediate","advanced"].includes(item.level),item.id);
  assert.equal(item.reviewStatus,"unreviewed",item.id);
  assert.ok(item.objectives?.ar&&item.objectives?.en,item.id);
  const best=item.steps.map(step=>step.options.findIndex(x=>x.points===2));
  const worst=item.steps.map(step=>step.options.findIndex(x=>x.points===0));
  assert.ok(isFinished(item,best),item.id);
  assert.equal(grade(item,best).score,item.maxPoints,item.id);
  assert.equal(grade(item,worst).score,0,item.id);
  assert.equal(comparePath(item,best,worst).difference,-item.maxPoints,item.id);
  assert.equal(isFinished(item,best.slice(1)),false,item.id);
  assert.throws(()=>grade(item,best.slice(1)));
  item.steps.forEach((step,i)=>{
    assert.equal(step.options.length,3,item.id+"/"+i);
    assert.ok(step.title.ar&&step.title.en&&step.description.ar&&step.description.en,item.id+"/"+i);
    assert.ok(step.options.some(o=>o.points===0)&&step.options.some(o=>o.points===2),item.id+"/"+i);
    if(step.options.some(o=>o.points===1))partialOptions++;
    for(const o of step.options)assert.ok(o.ar&&o.en&&o.feedback?.ar&&o.feedback?.en,item.id+"/"+i);
  });
  for(const url of item.references??[])assert.match(url,/^https:\/\/www\.(who\.int|cdc\.gov|heart\.org)\//);
}
assert.ok(partialOptions>=75,"Most missions need nuanced partially appropriate responses");
assert.ok(!validateCase({...clinicalCases[0],maxPoints:100}));
console.log("22 fictional clinical cases, 86 decision steps and "+partialOptions+" nuanced decisions validated.");

for(const item of clinicalCases){
 const worst=item.steps.map(s=>s.options.findIndex(o=>o.points===0));
 const best=item.steps.map(s=>s.options.findIndex(o=>o.points===2));
 const row={caseId:item.id,revision:item.revision??1,answers:worst};
 assert.equal(learningGaps([item],[row])[0].gap,1);
 assert.deepEqual(learningGaps([item],[row,{...row,answers:best}]),[]);
 assert.deepEqual(learningGaps([item],[{...row,revision:-1}]),[]);
}

for(const item of clinicalCases){
 const picks=item.steps.map(s=>s.options.findIndex(o=>o.points===0));
 assert.ok(validDraft(item,{revision:item.revision??1,step:0,picks:[]}));
 assert.ok(!validDraft(item,{revision:-1,step:0,picks:[]}));
 assert.ok(!validDraft(item,{revision:item.revision??1,step:1,picks:[null]}));
 for(let i=0;i<picks.length;i++)for(const alt of alternativeScores(item,picks,i)){
  const changed=[...picks];changed[i]=alt.answer;
  assert.equal(alt.score,grade(item,changed).score);
  assert.equal(alt.delta,comparePath(item,picks,changed).difference);
 }
}

for(const item of clinicalCases){
 const low=item.steps.map(s=>s.options.findIndex(o=>o.points===0));const high=item.steps.map(s=>s.options.findIndex(o=>o.points===2));
 const row={caseId:item.id,revision:item.revision??1,answers:low,score:99999};
 const ev=learningEvidence([item],[row,{...row,answers:high},{...row,revision:-1}]);
 assert.equal(ev.completed,1);assert.equal(ev.pairedCases,1);assert.equal(ev.meanScoreChange,1);assert.equal(ev.departments[0].score,item.maxPoints);
 assert.equal(learningEvidence([item],[]).meanScoreChange,null);
 assert.ok(!JSON.stringify(ev).includes("answers"));
}

const exploration=explorationPath(clinicalCases,[]);
assert.equal(exploration.length,3);
assert.equal(new Set(exploration.map(id=>clinicalCases.find(c=>c.id===id).department)).size,3);
const finished=clinicalCases.map(c=>({caseId:c.id,revision:c.revision??1,answers:c.steps.map(s=>s.options.findIndex(o=>o.points===2))}));
assert.deepEqual(explorationPath(clinicalCases,finished),[]);
assert.ok(!explorationPath(clinicalCases,[finished.find(x=>x.caseId===exploration[0])]).includes(exploration[0]));

for(const budget of [1,4,8,12,20,86]){const p=crisisStudyPlan(clinicalCases,[],budget);assert.equal(p.selected.reduce((n,x)=>n+x.decisions,0)+p.remaining,budget);assert.ok(p.remaining>=0);assert.equal(new Set(p.selected.map(x=>x.caseId)).size,p.selected.length);}
assert.equal(documentationGaps(clinicalCases).length,22);
for(const item of clinicalCases){const a=makePracticeRecord(item,item.steps.map(s=>s.options.findIndex(o=>o.points===2)));const b=makePracticeRecord(item,item.steps.map(s=>s.options.findIndex(o=>o.points===0)));assert.deepEqual(checkPracticeRecord(clinicalCases,a),a);assert.equal(checkPracticeRecord(clinicalCases,{...a,score:-1}),null);assert.equal(comparePracticeRecords(clinicalCases,a,a).agreements,item.steps.length);assert.equal(comparePracticeRecords(clinicalCases,a,b).agreements,0);}
