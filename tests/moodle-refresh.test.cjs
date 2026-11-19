const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup(history) {
  function element() {
    return {children: [], dataset: {}, addEventListener(event, cb) { this[event] = cb; },
      replaceChildren() { this.children = []; }, append(...items) { this.children.push(...items); }};
  }
  const nodes = new Map();
  function el(id) {
    if (!nodes.has(id)) nodes.set(id,element());
    return nodes.get(id);
  }
  const db = {
    auth: { getUser: async () => ({data:{user:{id:'student'}}}), signOut: async () => ({}) },
    from() {
      return {select(){return this;},eq(){return this;},order(){return this;},
        limit:async()=>({data:[]}),maybeSingle:async()=>({data:{role:'student'}})};
    },
    rpc(name) {return name==='nabd_quality_student_history'?history():Promise.resolve({data:[{id:'e',title:'Exam'}]});}
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/js/nabd-moodle.js'),'utf8'),{
    window:{nabdSupabase:db},setInterval(){},document:{getElementById:el,documentElement:{},
      querySelector:()=>true,querySelectorAll:()=>[],addEventListener(){},createElement:element}
  });
  return el;
}

test('partial failure keeps exams visible and enables retry before a start link is offered', async () => {
  let attempt = 0;
  const el = setup(async () => {
    if (++attempt === 1) throw Error('offline');
    if (attempt === 2) return {error:{message:'timeout'}};
    return {data:[]};
  });
  const refresh = el('mdl-refresh');
  await tick();
  for (let i=0;i<2;i++) {
    assert.equal(refresh.disabled,false);
    assert.equal(el('mdl-live-count').textContent,'1');
    assert.match(el('mdl-load-message').textContent,/الدرجات/);
    assert.doesNotMatch(JSON.stringify(el('mdl-exams').children),/student-exams\.html/);
    await refresh.click();
  }
  assert.match(JSON.stringify(el('mdl-exams').children),/student-exams\.html/);
  assert.equal(el('mdl-load-message').textContent,'');
});

test('a late result cannot render after sign-out', async () => {
  let finish;
  const el = setup(() => new Promise(resolve=>{finish=resolve;}));
  await tick();
  await el('mdl-sign-out').click();
  finish({data:[{title:'old result',human_score:75}]});
  await tick();
  assert.equal(el('mdl-app').hidden,true);
  assert.doesNotMatch(JSON.stringify(el('mdl-grade-rows').children),/old result/);
});
