const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'nabd-hope.html'), 'utf8');
const script = html.match(/src="([^"?]*nabd-hope-public-metrics\.js)(?:\?[^"]*)?"/)[1];
const source = fs.readFileSync(path.join(root, script), 'utf8');

function page(lang) {
  const nodes = new Map();
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, {textContent: '', addEventListener() {}});
    return nodes.get(id);
  }
  const count = element('hope-served-count');
  count.textContent = html.match(/id="hope-served-count">([^<]*)</)[1];
  let refresh;
  const window = {addEventListener(type, handler) { if (type === 'focus') refresh = handler; }};
  vm.runInNewContext(source, {window, setInterval() {}, document: {
    documentElement: {lang}, getElementById: element, querySelectorAll: () => []
  }});
  const api = {from() { return this; }, select() { return this; }, eq() { return this; }};
  window.supabase = {createClient: () => api};
  return {count, status: element('hope-metrics-updated'), async receive(value) {
    api.single = async () => ({data: {beneficiaries_served: value, beneficiary_target: 100,
      updated_at: '2026-01-01T00:00:00Z'}});
    await refresh();
  }};
}

for (const [lang, error] of [['ar', /تعذر/], ['en', /Unable/]]) {
  test(lang + ': unknown before confirmation, confirmed zero, and last count on failure', async () => {
    const view = page(lang);
    assert.equal(view.count.textContent, '—');
    assert.match(view.status.textContent, error);
    await view.receive(null);
    assert.equal(view.count.textContent, '—');
    for (const count of [0, 17]) {
      await view.receive(count);
      assert.equal(view.count.textContent, count.toLocaleString(lang));
      assert.doesNotMatch(view.status.textContent, error);
    }
    for (const invalid of [null, undefined, '', -1, 2.5]) {
      await view.receive(invalid);
      assert.equal(view.count.textContent, (17).toLocaleString(lang));
      assert.match(view.status.textContent, error);
    }
  });
}
