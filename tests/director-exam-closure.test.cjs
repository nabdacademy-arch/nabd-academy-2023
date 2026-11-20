const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const js = fs.readFileSync(path.join(__dirname,'../assets/js/quality-director.js'),'utf8');
const logic = js.slice(js.indexOf('const closingExams='),js.indexOf('function editExam'));
function panel(write,read,consent=true){
  const actions=new Map(), messages=[], calls=[];
  const node=()=>({append(){},replaceChildren(){}});
  const exam={id:'exam',status:'published',closes_at:'2100-01-01'};
  const client={from(){
    let op='read';
    const filters={};
    return {
      update(values){assert.equal(values.status,'closed');op='write';return this;},
      eq(k,v){filters[k]=v;return this;},select(){return this;},
      maybeSingle(){
        calls.push(op);
        assert.equal(filters.created_by,'owner');
        assert.equal(filters.id,'exam');
        if(op==='write')assert.equal(filters.status,'published');
        return op==='write'?write():read();
      }
    };
  }};
  const ctx=vm.createContext({director:{id:'owner'},client,window:{confirm:()=>consent},exams:[exam],
    $:node,el:node,isoDate:()=>'',btn:(label,action)=>{actions.set(label,action);return node();},
    status:(_,text,kind)=>messages.push({text,kind}),loadExams:async()=>calls.push('refresh')});
  vm.runInContext(logic,ctx);ctx.renderExams();
  return {click:actions.get('إغلاق الامتحان الآن'),calls,messages};
}
const closed=()=>({data:{status:'closed'}});
test('normal confirmation updates once, cancellation does nothing',async()=>{
  const p=panel(closed);await Promise.all([p.click(),p.click()]);
  assert.deepEqual(p.calls,['write','refresh']);assert.equal(p.messages.at(-1).kind,'success');
  const cancelled=panel(closed,null,false);await cancelled.click();assert.deepEqual(cancelled.calls,[]);
});
test('lost write receipt is reconciled with a read and no second write',async()=>{
  const p=panel(()=>Promise.reject(Error('offline')),closed);
  await p.click();assert.deepEqual(p.calls,['write','read','refresh']);assert.equal(p.messages.at(-1).kind,'success');
});
test('zero affected rows, a missing record and a failed read cannot confirm closure',async()=>{
  for(const read of [()=>({data:{status:'published'}}),()=>({data:null}),()=>Promise.reject(Error('offline'))]){
    const p=panel(()=>({data:null}),read);await p.click();
    assert.deepEqual(p.calls,['write','read']);assert.equal(p.messages.at(-1).kind,'error');
  }
});
