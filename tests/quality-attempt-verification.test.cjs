const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assets/js/quality-student.js'), 'utf8');
const id = '11111111-1111-1111-1111-111111111111';

function element(tag) {
  return {tag, children: [], handlers: {},
    replaceChildren() { this.children = []; },
    append(...nodes) { this.children.push(...nodes); },
    addEventListener(event, handler) { this.handlers[event] = handler; }};
}

function portal(readAttempts, deepLink = false) {
  const nodes = new Map();
  const get = key => {
    if (!nodes.has(key)) nodes.set(key, element('div'));
    return nodes.get(key);
  };
  let opens = 0;
  const client = {
    auth: {getUser: async () => ({data:{user:{id:'student'}}})},
    from() {
      const query = {select: () => query, eq: () => query,
        maybeSingle: async () => ({data:{role:'student'}}), limit: () => readAttempts()};
      return query;
    },
    async rpc(name) {
      if (name === 'nabd_quality_active_exams') return {data:[{id,title:'Example'}]};
      if (name === 'nabd_quality_student_questions') { opens++; return {error:true}; }
      return {data:[]};
    }
  };
  vm.runInNewContext(source, {
    window:{nabdSupabase:client, location:{search:deepLink ? '?exam=' + id : ''}},
    document:{getElementById:get, createElement:element, querySelector:() => ({})}, URLSearchParams
  });
  return {get, opens:() => opens, refresh:() => get('ql-refresh').handlers.click()};
}

function buttons(node) {
  return [node, ...node.children.flatMap(buttons)].filter(n => n.tag === 'button');
}

test('unverified attempts block list and deep link; manual refresh recovers', async () => {
  for (const failure of [() => ({error:true,data:[]}), () => ({data:null}), () => Promise.reject(new Error('offline'))]) {
    let read = failure;
    const p = portal(() => read(), true);
    await new Promise(setImmediate);
    assert.equal(p.opens(), 0);
    assert.match(p.get('ql-student-status').textContent, /تعذّر/);
    assert.equal(buttons(p.get('ql-student-list')).length, 0);
    read = () => ({data:[]});
    await p.refresh();
    const [start] = buttons(p.get('ql-student-list'));
    assert.equal(start.disabled, false);
    await start.handlers.click();
    assert.equal(p.opens(), 1);
    read = () => ({data:[{exam_id:id, human_score:null}]});
    await p.refresh();
    assert.equal(buttons(p.get('ql-student-list'))[0].disabled, true);
  }
});

test('deep link opens for a verified new attempt, skips confirmed submission', async () => {
  for (const prior of [false, true]) {
    const p = portal(() => ({data:prior ? [{exam_id:id}] : []}), true);
    await new Promise(setImmediate);
    assert.equal(p.opens(), prior ? 0 : 1);
  }
});

test('a superseded successful refresh cannot undo a newer failure', async () => {
  let finish;
  let calls = 0;
  const p = portal(() => ++calls === 1 ? new Promise(resolve => {finish = resolve;}) : {error:true});
  await new Promise(setImmediate);
  await p.refresh();
  finish({data:[]});
  await new Promise(setImmediate);
  assert.equal(buttons(p.get('ql-student-list')).length, 0);
  assert.match(p.get('ql-student-status').textContent, /تعذّر/);
});
