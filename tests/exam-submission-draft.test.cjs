const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../assets/js/quality-student.js'), 'utf8');
const drafts = source.slice(source.indexOf('function draftKey'), source.indexOf('function restoreDraft'));
const submission = source.slice(source.indexOf('async function confirmSavedSubmission'), source.indexOf('function tick'));
function page({ quota, receipt, arabic }) {
  const saved = new Map();
  const messages = new Map();
  const key = 'nabd-draft-student-paper';
  saved.set(key, 'older draft');
  const elements = new Map();
  const client = {
    rpc: async () => receipt ? {data:{ok:true,id:'receipt'}} : {error:Error('offline')},
    from: () => ({ select(){return this;}, eq(){return this;}, maybeSingle:async()=>({data:null}) })
  };
  const ctx = vm.createContext({
    student:{id:'student'}, exam:{id:'paper',closes_at:new Date(Date.now()+60000).toISOString()},
    submitting:false, timer:null, questions:[], autoRequested:false, autoRetries:0,
    sessionStorage:{setItem(k,v){if(quota)throw Error('quota');saved.set(k,v);},removeItem:k=>saved.delete(k)},
    captureAnswers:()=>({q:'latest answer'}), tr:(ar,en)=>arabic?ar:en, window:{confirm:()=>true},
    $:id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);},
    message:(id,text)=>messages.set(id,text), client, document:{dispatchEvent(){}}, CustomEvent:class {},
    load:async()=>{},startGradeRefresh(){}
  });
  vm.runInContext(drafts+submission,ctx);
  return {submit:ctx.submit,saved,key,messages,elements};
}

test('confirmed receipt completes submission even if the tab cannot store a draft',async()=>{
  const p=page({quota:true,receipt:true});
  await p.submit();
  assert.equal(p.saved.has(p.key),false);
  assert.match(p.messages.get('ql-student-status'),/saved on the server/);
});
test('unconfirmed submission reports a draft only after saving the current answers',async()=>{
  const p=page({});
  await p.submit();
  assert.equal(JSON.parse(p.saved.get(p.key)).answers.q,'latest answer');
  assert.match(p.messages.get('ql-paper-status'),/temporary copy/);
  assert.equal(p.elements.get('ql-submit-answers').disabled,false);
});
test('quota failure with an older draft gives accurate feedback in both languages',async()=>{
  for(const arabic of [true,false]){
    const p=page({quota:true,arabic});
    await p.submit();
    assert.equal(p.saved.get(p.key),'older draft');
    assert.match(p.messages.get('ql-paper-status'),arabic?/أبقِ الصفحة مفتوحة/:/Keep this page open/);
    assert.equal(p.elements.get('ql-submit-answers').disabled,false);
  }
});
