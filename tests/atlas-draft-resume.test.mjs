import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const code = readFileSync(new URL('../atlas/clinical-hub.mjs', import.meta.url), 'utf8');
const read = code.slice(code.indexOf('function readDraft('), code.indexOf('function warning('));
const activate = code.slice(code.indexOf('function activateCase('), code.indexOf('function renderStep('));
function resume(draft, revision=1) {
  const item = {id:'sample', revision, steps:Array.from({length:3},()=>({options:[{},{}]}))};
  const context = {clinicalCases:[item], validateCase:()=>true, safeRead:()=>({sample:draft}),
    safeWrite(){}, renderCatalog(){}, renderReferences(){}, renderStep(){},
    LAST_CASE_KEY:'last', DRAFT_KEY:'draft'};
  return runInNewContext('let current,picks,stepIndex,selectedAnswer,replayBefore,reportMode,lastRecorded,lastGrade;'
    + read + activate + ';activateCase("sample"); JSON.stringify([stepIndex,picks,selectedAnswer]);',context);
}

test('compatible and first-edition legacy drafts resume at their saved decision',()=>{
  for(const draft of [{step:2,picks:[1,0]}, {step:2,picks:[1,0],revision:1}]) {
    assert.equal(resume(draft),JSON.stringify([2,[1,0],null]));
  }
  assert.equal(resume({revision:2,step:1,picks:[0,1]},2),JSON.stringify([1,[0,1],1]));
});
test('incomplete decision sequences restart at the first decision',()=>{
  for(const picks of [[],[0],[null,1],[2,0]]) {
    assert.equal(resume({revision:1,step:2,picks}),JSON.stringify([0,[],null]));
  }
});
test('an earlier version or invalid revision cannot restore choices into a revised case',()=>{
  for(const draft of [{step:1,picks:[0]}, {step:1,picks:[0],revision:1}, {step:1,picks:[0],revision:null}]) {
    assert.equal(resume(draft,2),JSON.stringify([0,[],null]));
  }
});
