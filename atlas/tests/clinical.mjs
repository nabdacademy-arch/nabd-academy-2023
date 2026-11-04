import assert from "node:assert/strict";
import {clinicalCases,clinicalDepartments} from "../clinical-cases.mjs";
import {grade,comparePath,isFinished,validateCase,sumMaximum} from "../clinical-engine.mjs";
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
