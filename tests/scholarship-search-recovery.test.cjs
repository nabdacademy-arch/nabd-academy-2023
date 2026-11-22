const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const script = fs.readFileSync(path.join(__dirname, '../assets/js/scholarship-center.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

function page() {
  class Element {
    children = [];
    classList = { remove() {}, add() {} };
    append(...children) { this.children.push(...children); }
    replaceChildren() { this.children = []; }
    addEventListener(name, fn) { this[name] = fn; }
  }
  const nodes = new Map();
  const get = key => {
    if (!nodes.has(key)) nodes.set(key, new Element());
    return nodes.get(key);
  };
  const list = get('list'), window = new Element(), pending = [];
  list.append('loading');
  window.nabdSupabase = { from() { return {
    select() { return this; }, eq() { return this; }, order() { return this; },
    limit() { return new Promise((resolve, reject) => pending.push({ resolve, reject })); }
  }; } };
  vm.runInNewContext(script, {
    document: { querySelector: key => key === '[data-scholarship-list]' ? list : null,
      getElementById: get, createElement: () => new Element(), addEventListener() {} },
    window, URL, setInterval() {}
  });
  return { list, window, pending, status: get('sch-public-status'), search: get('sch-search'), count: get('sch-results-count') };
}

test('search during initial load and failure waits for confirmed results, then recovers online', async () => {
  const p = page();
  p.search.value = 'طب';
  p.search.input();
  assert.deepEqual(p.list.children, ['loading']);
  p.pending[0].reject(Error('offline'));
  await tick();
  p.search.input();
  assert.equal(p.status.hidden, false);
  assert.equal(p.list.children.length, 0);
  assert.equal(p.count.textContent, undefined);
  p.window.online();
  p.pending[1].resolve({ data: [{ title: 'طب', description: '' }, { title: 'هندسة', description: '' }] });
  await tick();
  assert.equal(p.count.textContent, '1 فرصة');
  assert.equal(p.status.hidden, true);
  p.window.online();
  p.pending[2].resolve({ error: { message: 'unavailable' } });
  await tick();
  p.search.value = '';
  p.search.input();
  assert.equal(p.count.textContent, '2 فرصة');
  assert.equal(p.status.hidden, false);
});

test('an older response cannot replace a newer confirmed empty listing', async () => {
  const p = page();
  p.window.online();
  p.pending[1].resolve({ data: [] });
  await tick();
  p.pending[0].resolve({ data: [{ title: 'old', description: '' }] });
  await tick();
  assert.equal(p.count.textContent, '0 فرصة');
  assert.match(p.list.children[0].textContent, /لم تنشر/);
});
