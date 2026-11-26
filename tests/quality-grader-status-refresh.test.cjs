const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/quality-director.js'),'utf8');
const code=source.slice(source.indexOf('let graderEnabled='),source.indexOf('async function setGrader'));
function setup(){
 const nodes={}, requests=[];
 const ctx=vm.createContext({director:{id:'test'},$:id=>nodes[id]??={},status(){},isoDate:String,
  client:{rpc:()=>new Promise((resolve,reject)=>requests.push({resolve,reject}))}});
 vm.runInContext(code,ctx);
 return {nodes,requests,ctx};
}
test('confirmed counts include zero; missing and invalid counts stay unknown',async()=>{
 const {ctx,nodes,requests}=setup();
 const task=ctx.loadGraderStatus();
 requests[0].resolve({data:{enabled:true,pending:0,needs_review:-1}});await task;
 assert.match(nodes['ql-bot-summary'].textContent,/الآلي: 0/);
 assert.match(nodes['ql-bot-summary'].textContent,/مراجعة: غير متاح/);
 assert.match(nodes['ql-bot-summary'].textContent,/التصحيح: غير متاح/);
 assert.equal(nodes['ql-bot-run'].disabled,false);
});
test('network failure and empty or malformed settings keep manual stop available',async()=>{
 for(const data of [null,{}, {enabled:'false'}]){
  const {ctx,nodes,requests}=setup();
  const task=ctx.loadGraderStatus();
  if(data===null)requests[0].reject(new Error('offline'));else requests[0].resolve({data});
  await task;
  assert.equal(nodes['ql-bot-state'].textContent,'غير معروف');
  assert.equal(nodes['ql-bot-stop'].disabled,false);
  assert.equal(nodes['ql-bot-start'].disabled,true);
  assert.equal(nodes['ql-bot-run'].disabled,true);
  const retry=ctx.loadGraderStatus();requests[1].resolve({data:{enabled:false}});await retry;
  assert.equal(nodes['ql-bot-start'].disabled,false);
 }
});
test('old response cannot overwrite the latest status or update a signed-out view',async()=>{
 const {ctx,nodes,requests}=setup();
 const a=ctx.loadGraderStatus(), b=ctx.loadGraderStatus();
 requests[1].resolve({data:{enabled:false}});await b;
 requests[0].resolve({data:{enabled:true}});await a;
 assert.equal(nodes['ql-bot-state'].textContent,'متوقف');
 const c=ctx.loadGraderStatus();ctx.director=null;requests[2].resolve({data:{enabled:true}});await c;
 assert.equal(nodes['ql-bot-state'].textContent,'متوقف');
});
