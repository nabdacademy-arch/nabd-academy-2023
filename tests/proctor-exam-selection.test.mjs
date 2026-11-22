import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const script = readFileSync(new URL('../assets/js/quality-proctor-director.js', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup() {
  class Element {
    children = [];
    append(child) { this.children.push(child); }
    replaceChildren(...children) { this.children = children; }
    addEventListener(name, fn) { this[name] = fn; }
  }
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id, new Element());
    return nodes.get(id);
  };
  const exams = ['a', 'b'].map(id => ({
    id, title: id, status: 'published', opens_at: '2000-01-01', closes_at: '2100-01-01'
  }));
  const pending = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }), onAuthStateChange() {} },
    from() {
      return {
        select() { return this; }, eq() { return this; }, in() { return this; }, order() { return this; },
        maybeSingle: async () => ({ data: { user_id: 'owner' } }), limit: async () => ({ data: exams })
      };
    },
    rpc(name, { p_exam }) {
      assert.equal(name, 'nabd_quality_proctor_dashboard');
      return new Promise(resolve => pending.push({ exam: p_exam, resolve }));
    }
  };
  vm.runInNewContext(script, {
    window: { nabdSupabase: client }, Option: Element, setInterval() {},
    document: { getElementById: element, createElement: () => new Element(), addEventListener() {} }
  });
  const get = key => element('ql-proctor-' + key);
  return { pending, get, select(id) { get('exam').value = id; get('exam').change(); } };
}

test('switch clears previous rows and rejects delayed results even after reselecting the same exam', async () => {
  const h = setup();
  await tick();
  h.pending[0].resolve({ data: { enabled: true, total: 1, events: [{ student_name: 'local student A' }] } });
  await tick();
  assert.equal(h.get('stop').disabled, false);
  assert.match(JSON.stringify(h.get('log')), /local student A/);
  h.select('b');
  assert.doesNotMatch(JSON.stringify(h.get('log')), /local student A/);
  assert.equal(h.get('start').disabled, true);
  h.select('a');
  h.select('b');
  assert.deepEqual(h.pending.map(q => q.exam), ['a', 'b', 'a', 'b']);
  h.pending[3].resolve({ data: { enabled: false, total: 4, events: [] } });
  await tick();
  h.pending[1].resolve({ data: { enabled: true, total: 80, events: [] } });
  h.pending[2].resolve({ error: { message: 'stale error' } });
  await tick();
  assert.equal(h.get('count').textContent, '4');
  assert.equal(h.get('start').disabled, false);
  assert.equal(h.get('status').textContent, '');
});

test('an unavailable dashboard keeps controls locked and manual refresh recovers', async () => {
  const h = setup();
  await tick();
  h.pending[0].resolve({ error: { message: 'offline' } });
  await tick();
  assert.match(h.get('status').textContent, /offline/);
  assert.equal(h.get('start').disabled, true);
  assert.equal(h.get('stop').disabled, true);
  h.get('refresh').click();
  await tick();
  h.pending[1].resolve({ data: { enabled: true, total: 0, events: [] } });
  await tick();
  assert.equal(h.get('status').textContent, '');
  assert.equal(h.get('stop').disabled, false);
});
