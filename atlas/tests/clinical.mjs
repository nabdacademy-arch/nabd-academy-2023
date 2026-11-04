import assert from "node:assert/strict";
import {clinicalCases} from "../clinical-cases.mjs";
import {grade,comparePath,isFinished,validateCase,sumMaximum} from "../clinical-engine.mjs";
assert.equal(clinicalCases.length,2);
for(const item of clinicalCases){
  assert.ok(validateCase(item),item.id);
  assert.equal(sumMaximum(item),item.maxPoints);
  assert.ok(item.vitals?.hr&&item.vitals?.bp&&item.vitals?.spo2);
  const correct=item.steps.map(step=>step.options.findIndex(x=>x.points===2));
  const wrong=item.steps.map(step=>step.options.findIndex(x=>x.points===0));
  assert.ok(isFinished(item,correct));
  assert.equal(grade(item,correct).score,item.maxPoints);
  assert.equal(grade(item,wrong).score,0);
  assert.equal(comparePath(item,correct,wrong).difference,-item.maxPoints);
  assert.equal(isFinished(item,correct.slice(1)),false);
  assert.throws(()=>grade(item,correct.slice(1)));
}
assert.ok(!validateCase({...clinicalCases[0],maxPoints:100}));
console.log("NABD ATLAS clinical engine validated for all fictional cases.");
