const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const tick = () => new Promise(resolve => setImmediate(resolve));
const rows = (start, count) => Array.from({length: count}, (_, i) => ({
  id: start+i, title: 'record-'+(start+i), status: 'published'
}));

async function studio() {
  const nodes = new Map(), pages = [];
  function el(id) {
    if (!nodes.has(id)) nodes.set(id, {value: id === 'studio-filter' ? 'all' : '',
      elements: {id: {}}, reset() {}, addEventListener() {}});
    return nodes.get(id);
  }
  const db = {
    auth: { getUser: async () => ({data: {user: {id: 'lecturer'}}}), onAuthStateChange() {} },
    rpc: async () => ({data: false}),
    from(table) {
      return {select() { return this; }, order() {
        return table === 'nabd_teaching_records' ? this : Promise.resolve({data: []});
      }, range(start, end) { return new Promise(resolve => pages.push({start, end, resolve})); }};
    }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/js/lecturers.js'),'utf8'), {
    document: {getElementById: el}, window: {nabdSupabase: db}, URL, console: {error() {}}
  });
  await tick();
  return {el, pages, more: el('studio-more')};
}

test('refresh and repeated clicks keep page boundaries intact', async () => {
  const {el, pages, more} = await studio();
  pages[0].resolve({data: rows(0,30)}); await tick();
  const stale = more.onclick();
  const refresh = el('studio-refresh').onclick(); await tick();
  await more.onclick();
  assert.equal(pages.length, 3);
  pages[1].resolve({error: Error('old request')}); await stale;
  assert.equal(more.disabled, true);
  pages[2].resolve({data: rows(0,30)}); await refresh;
  const next = more.onclick(); await more.onclick();
  assert.deepEqual(pages.map(p => [p.start,p.end]), [[0,29],[30,59],[0,29],[30,59]]);
  pages[3].resolve({data: rows(30,1)}); await next;
  assert.match(el('studio-records').innerHTML, /record-30/);
  assert.equal(more.hidden, true);
});

test('failed page can be retried without losing previously loaded records', async () => {
  const {el, pages, more} = await studio();
  pages[0].resolve({data: rows(0,30)}); await tick();
  const failed = more.onclick();
  pages[1].resolve({error: Error('offline')}); await failed;
  assert.match(el('studio-status').textContent, /تعذر/);
  assert.match(el('studio-records').innerHTML, /record-29/);
  const retry = more.onclick();
  assert.equal(pages[2].start, 30);
  pages[2].resolve({data: rows(30,1)}); await retry;
  assert.match(el('studio-status').textContent, /تم تحميل/);
  assert.equal(more.hidden, true);
});
