const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../skill-passport.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness() {
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      dataset: {}, value: '', appendChild() {},
      addEventListener(event, handler) { this[event] = handler; }
    });
    return nodes.get(id);
  }
  let notify;
  const pending = [];
  const db = {
    auth: { onAuthStateChange(fn) { notify = fn; } },
    from(table) {
      let student;
      return {
        select() { return this; },
        eq(field, value) { if (field === 'student_id') student = value; return this; },
        order(field) {
          if (field === 'domain') return this;
          if (table === 'nabd_skill_catalog') return Promise.resolve({ data: [] });
          return new Promise(resolve => pending.push({ student, resolve }));
        }
      };
    }
  };
  const document = { body: {}, documentElement: {}, getElementById: node,
    querySelectorAll: () => [], createElement: () => ({}) };
  vm.runInNewContext(script, { document, window: { nabdSupabase: db }, setTimeout: setImmediate });
  return { node, pending, session(event, id) {
    notify(event, id ? { user: { id, email: id + '@example.test' } } : null);
  } };
}

function history(text) {
  return { data: [{ response_payload: { reflection: { learned: text } } }] };
}

test('switching accounts clears drafts and ignores older history responses', async () => {
  const h = harness();
  h.session('INITIAL_SESSION', 'first');
  await tick();
  h.node('learned').value = 'first draft';
  h.session('TOKEN_REFRESHED', 'first');
  assert.equal(h.node('learned').value, 'first draft');
  h.session('SIGNED_IN', 'second');
  assert.equal(h.node('learned').value, '');
  await tick();
  assert.deepEqual(h.pending.map(q => q.student), ['first', 'second']);
  h.pending[1].resolve(history('second reflection'));
  await tick();
  h.pending[0].resolve(history('first reflection'));
  await tick();
  assert.match(h.node('history').innerHTML, /second reflection/);
  assert.doesNotMatch(h.node('history').innerHTML, /first reflection/);
  h.node('languageBtn').click();
  assert.match(h.node('history').innerHTML, /second reflection/);
});

test('current refresh errors are visible and stale errors after logout are discarded', async () => {
  const h = harness();
  h.session('INITIAL_SESSION', 'first');
  await tick();
  h.pending[0].resolve({ error: new Error('network unavailable') });
  await tick();
  assert.match(h.node('authStatus').textContent, /network unavailable/);
  const refresh = h.node('refreshBtn').click();
  h.session('SIGNED_OUT', null);
  h.pending[1].resolve({ error: new Error('old failure') });
  await refresh;
  assert.equal(h.node('historyStatus').textContent, '');
  assert.equal(h.node('recordCount').textContent, '0');
  assert.equal(h.node('studentEmail').textContent, '—');
});
