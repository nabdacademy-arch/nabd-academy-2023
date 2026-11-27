const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=readFileSync(path.join(__dirname,'../assets/js/nabd-hope-applications.js'),'utf8');

function page(lang){
 const nodes=new Map(),reads=[];
 function node(id){
  if(!nodes.has(id))nodes.set(id,{dataset:{},addEventListener(event,fn){this[event]=fn;},replaceChildren(){}});
  return nodes.get(id);
 }
 const query={select(){return this;},eq(){return this;},single(){return new Promise((resolve,reject)=>reads.push({resolve,reject}));}};
 vm.runInNewContext(source,{
  document:{getElementById:node,documentElement:{lang},querySelectorAll:()=>[],querySelector:()=>null,createElement:()=>({}),head:{append(){}}},
  window:{supabase:{createClient:()=>({from:()=>query})}}
 });
 return {node,reads,refresh:()=>node('hope-refresh-state').click()};
}
const result=value=>({data:{registration_open:value},error:null});
const settled=()=>new Promise(resolve=>setImmediate(resolve));

test('late initial open response cannot reopen a closed application form',async()=>{
 const p=page('ar'),refresh=p.refresh();
 p.reads[1].resolve(result(false));await refresh;
 p.reads[0].resolve(result(true));await settled();
 assert.equal(p.node('hope-form').hidden,true);
 assert.equal(p.node('hope-registration-status').textContent,'التقديم مغلق حاليًا');
});
test('late network failure cannot hide a newer confirmed open form',async()=>{
 const p=page('en'),refresh=p.refresh();
 p.reads[1].resolve(result(true));await refresh;
 p.reads[0].reject(Error('offline'));await settled();
 assert.equal(p.node('hope-form-fields').disabled,false);
 assert.equal(p.node('hope-registration-status').textContent,'Applications are open');
});
test('an unconfirmed latest read disables applications until a successful retry',async()=>{
 const p=page('en');
 p.reads[0].resolve(result(true));await settled();
 for(const response of [result('true'),{data:null,error:{message:'offline'}}]){
  const refresh=p.refresh();p.reads.at(-1).resolve(response);await refresh;
  assert.equal(p.node('hope-form-fields').disabled,true);
  assert.equal(p.node('hope-registration-status').textContent,'Registration status unavailable');
 }
 const retry=p.refresh();p.reads.at(-1).resolve(result(true));await retry;
 assert.equal(p.node('hope-form').hidden,false);
});
