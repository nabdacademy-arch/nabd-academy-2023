const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(require.resolve('../assets/js/quality-proctor-student.js'), 'utf8');
const flush = () => new Promise(setImmediate);
function page() {
  const listeners = {}, checks = [], reports = [], delays = new Map(), polls = new Map();
  const notice = {dataset:{}};
  const client = {rpc(name, payload) {
    if (name === 'nabd_quality_proctor_student_state') {
      return new Promise((resolve,reject) => checks.push({resolve,reject}));
    }
    reports.push(payload);
    return Promise.resolve({});
  }};
  vm.runInNewContext(source, {
    document:{querySelector:() => ({}), getElementById:id => id.includes('notice') ? notice : {lang:'en'},
      visibilityState:'visible',hasFocus:() => false,addEventListener:(name,fn) => listeners[name]=fn},
    window:{nabdSupabase:client,addEventListener:(name,fn) => listeners[name]=fn},
    setInterval:fn => {polls.set(fn,fn);return fn}, clearInterval:fn => polls.delete(fn),
    setTimeout:fn => {delays.set(fn,fn);return fn}, clearTimeout:fn => delays.delete(fn)
  });
  return {notice,checks,reports,delays,polls,listeners,open:id=>listeners['nabd:exam-open']({detail:{examId:id}})};
}
const status = enabled => ({data:{enabled,open:true}});
test('only a confirmed active session records an event; closing stops it', async()=>{
  const p=page();p.open('first');p.listeners.copy();
  assert.equal(p.reports.length,0);
  p.checks[0].resolve(status(true));await flush();p.listeners.copy();
  assert.equal(p.reports[0].p_exam,'first');
  p.listeners['nabd:exam-end']();p.listeners.copy();
  assert.equal(p.reports.length,1);
  assert.equal(p.notice.dataset.state,'off');
});
test('old success or error cannot change a reopened exam or release its pending check',async()=>{
  for(const rejects of [false,true]){
    const p=page();p.open('same');p.listeners['nabd:exam-end']();p.open('same');
    assert.equal(p.checks.length,2);
    if(rejects)p.checks[0].reject(new Error('offline'));else p.checks[0].resolve(status(true));
    await flush();p.listeners.copy();
    assert.equal(p.reports.length,0);
    assert.match(p.notice.textContent,/Checking/);
    for(const poll of p.polls.values())poll();
    assert.equal(p.checks.length,2);
    p.checks[1].reject(new Error('offline'));await flush();
    assert.equal(p.notice.dataset.state,'error');
    for(const poll of p.polls.values())poll();
    p.checks[2].resolve(status(true));await flush();
    assert.equal(p.notice.dataset.state,'on');
  }
});
test('switching papers cancels a pending blur before the new exam can record it',async()=>{
  const p=page();p.open('first');p.checks[0].resolve(status(true));await flush();
  p.listeners.blur();assert.equal(p.delays.size,1);
  p.open('second');assert.equal(p.delays.size,0);
  p.checks[1].resolve(status(true));await flush();
  assert.equal(p.reports.length,0);
});
