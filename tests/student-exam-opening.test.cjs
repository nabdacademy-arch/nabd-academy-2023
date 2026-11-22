const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'../assets/js/quality-student.js'),'utf8');
const entry = source.slice(source.indexOf('let openingPaper='),source.indexOf('function captureAnswers'));
function page(monitoring, consent=true) {
  const events=[], prompts=[], calls=[], notices=[];
  const elements=new Map();
  const context=vm.createContext({
    student:{id:'demo'}, exam:null, questions:[], timer:null,
    client:{rpc:async (name,args)=>{
      calls.push([name,args.p_exam]);
      return name==='nabd_quality_student_questions' ? {data:{id:args.p_exam,title:'Test',questions:[]}} : monitoring.shift()();
    }},
    $:id=>{
      if(!elements.has(id))elements.set(id,{replaceChildren(){},scrollIntoView(){}});
      return elements.get(id);
    },
    message:(id,text)=>notices.push(text), window:{confirm:text=>{prompts.push(text);return consent;}},
    setPaperLanguage(){},restoreDraft(){},setInterval(){},tick(){},
    CustomEvent:class {constructor(type){this.type=type;}},document:{dispatchEvent:e=>events.push(e.type)}
  });
  vm.runInContext(entry,context);
  return {open:id=>context.openPaper(id),events,prompts,calls,notices};
}
for(const [enabled,consent,opens] of [[false,false,true],[true,true,true],[true,false,false]]){
  test('monitoring '+enabled+', consent '+consent,async()=>{
    const p=page([()=>({data:{open:true,enabled}})],consent);
    await p.open('exam');
    assert.equal(p.events.length,opens?1:0);
    assert.equal(p.prompts.length,enabled?1:0);
  });
}
test('failed checks keep the paper closed and allow a verified retry',async()=>{
  const p=page([()=>{throw Error('offline');},()=>({error:{message:'unavailable'}}),
    ()=>({data:{}}),()=>({data:{open:false,enabled:false}}),()=>({data:{open:true,enabled:false}})]);
  for(let i=0;i<4;i++){
    await p.open('exam');
    assert.equal(p.events.length,0);
    assert.match(p.notices.at(-1),/retry|no longer open/);
  }
  await Promise.all([p.open('exam'),p.open('exam')]);
  assert.equal(p.calls.length,10);
  assert.deepEqual(p.events,['nabd:exam-open']);
});
