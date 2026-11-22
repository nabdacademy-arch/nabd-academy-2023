const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/quality-director.js'), 'utf8');
const countCode = source.slice(source.indexOf('let pendingCountRequest'), source.indexOf('// Director-controlled'));

function panel(results){
  const counter = {};
  const client = { from(table){
    assert.equal(table,'nabd_quality_submissions');
    const filters = {};
    return {
      select(columns, options){
        assert.match(columns,/nabd_quality_exams!inner/);
        assert.equal(options.count,'exact');
        assert.equal(options.head,true);
        return this;
      },
      eq(key,value){ filters[key]=value; return this; },
      neq(key,value){ assert.equal(key,'nabd_quality_exams.status'); assert.equal(value,'draft'); return this; },
      is(key,value){
        assert.equal(filters['nabd_quality_exams.created_by'],'owner');
        assert.equal(key,'human_score');
        assert.equal(value,null);
        return results.shift()();
      }
    };
  }};
  const ctx = vm.createContext({ director:{id:'owner'},client,$:()=>counter });
  vm.runInContext(countCode,ctx);
  return { refresh:ctx.countPending,counter };
}
test('shows exact server counts including zero and counts above the old row limit',async()=>{
  const p=panel([()=>({count:1837}),()=>({count:0})]);
  await p.refresh(); assert.equal(p.counter.textContent,'1837');
  await p.refresh(); assert.equal(p.counter.textContent,'0');
});
test('service errors, missing counts, and rejected requests are not reported as zero',async()=>{
  const p=panel([()=>({count:0,error:{message:'offline'}}),()=>({count:null}),()=>Promise.reject(Error('offline')),()=>({count:5})]);
  for(let i=0;i<3;i++){await p.refresh();assert.equal(p.counter.textContent,'غير متاح');}
  await p.refresh();assert.equal(p.counter.textContent,'5');
});
test('an older response cannot overwrite a newer count',async()=>{
  let finish;
  const p=panel([()=>new Promise(resolve=>{finish=resolve;}),()=>({count:4})]);
  const old=p.refresh();await p.refresh();
  finish({count:7});await old;assert.equal(p.counter.textContent,'4');
});
