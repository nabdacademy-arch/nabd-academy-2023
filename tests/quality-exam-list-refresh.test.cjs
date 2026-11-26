const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../assets/js/quality-director.js'),'utf8');
const loadList=source.slice(source.indexOf('let examListRequest='),source.indexOf('let pendingCountRequest='));

function setup(){
  const requests=[], renders=[], messages=[], labels={};
  const query={
    select(){return this;}, eq(){return this;}, order(){return this;},
    limit(){return new Promise((resolve,reject)=>requests.push({resolve,reject}));}
  };
  const context=vm.createContext({
    director:{id:'owner-a'}, exams:[], client:{from:()=>query},
    $:id=>(labels[id]??={}), renderExams:()=>renders.push(context.exams),
    countPending:async()=>{}, status:(...args)=>messages.push(args)
  });
  vm.runInContext(loadList,context);
  return {context,requests,renders,messages,labels};
}

test('a slow refresh cannot replace the latest exam list or its counts',async()=>{
  const {context,requests,renders,labels}=setup();
  const first=context.loadExams(), latest=context.loadExams();
  const rows=[{id:'recent',status:'draft'}];
  requests[1].resolve({data:rows}); await latest;
  requests[0].resolve({data:[]}); await first;
  assert.deepEqual(renders,[rows]);
  assert.equal(labels['ql-draft-count'].textContent,1);
});

test('responses after account change or logout have no display effects',async()=>{
  for(const reply of ['success','error','rejected']){
    const {context,requests,renders,messages}=setup();
    const pending=context.loadExams();
    context.director=reply==='success'?{id:'owner-b'}:null;
    if(reply==='rejected')requests[0].reject(new Error('offline'));
    else requests[0].resolve(reply==='error'?{error:{}}:{data:[{id:'old'}]});
    await pending;
    assert.equal(renders.length,0);
    assert.equal(messages.length,0);
  }
});

test('a malformed reply preserves the list while a confirmed empty list clears it',async()=>{
  const {context,requests,messages,renders}=setup();
  context.exams=[{id:'known'}];
  const malformed=context.loadExams();
  requests[0].resolve({data:null}); await malformed;
  assert.equal(context.exams[0].id,'known');
  assert.equal(messages.length,1);
  const empty=context.loadExams();
  requests[1].resolve({data:[]}); await empty;
  assert.deepEqual(renders,[[]]);
});
