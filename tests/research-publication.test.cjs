const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../assets/js/research-center.js'), 'utf8');

async function submit(scenario, edit = false) {
  const elements = new Map();
  function element() {
    return { value: '', classList: { add() {}, remove() {} }, reset() {}, append() {},
      replaceChildren() {}, addEventListener(type, callback) { this[type] = callback; } };
  }
  function byId(id) {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  }
  const removed = [];
  let lists = 0;
  const old = { id: 'paper', pdf_path: 'old.pdf' };
  const db = {
    auth: { onAuthStateChange() {}, getUser: async () => ({ data: { user: { id: 'author' } } }) },
    from(table) {
      return {
        select() { return this; }, eq() { return this; }, order() { return this; },
        insert(row) { assert.equal(row.pdf_path, 'new.pdf'); return this; },
        update(row) { assert.equal(row.pdf_path, 'new.pdf'); return this; },
        async limit() {
          if (++lists > 1 && scenario === 'refresh') throw Error('offline');
          return { data: edit ? [old] : [] };
        },
        async maybeSingle() {
          if (table === 'nabd_research_publishers') return { data: { active: true } };
          if (scenario === 'offline') throw Error('offline');
          if (scenario === 'unknown') return { error: { code: '08007' } };
          if (scenario === 'denied') return { error: { code: '42501' } };
          return { data: { id: 'paper' } };
        }
      };
    },
    storage: { from: () => ({ async remove(paths) {
      removed.push(...paths);
      if (scenario === 'cleanup') throw Error('offline');
      return {};
    } }) }
  };
  vm.runInNewContext(source, {
    document: { querySelector: s => s.includes('manager') ? {} : null, getElementById: byId, createElement: element },
    window: { nabdSupabase: db, NABDResearchPDFUploader: { create: () => ({
      getFile: () => ({}), uploadPdf: async () => 'new.pdf', clear() {}
    }) } }
  });
  await new Promise(resolve => setImmediate(resolve));
  byId('res-title').value = 'title';
  byId('res-abstract').value = 'abstract text';
  byId('res-edit-id').value = edit ? 'paper' : '';
  await byId('res-publish-form').submit({ preventDefault() {} });
  assert.equal(byId('res-submit').disabled, false);
  return { removed, status: byId('res-publish-status').textContent };
}

test('confirmed publication and replacement', async () => {
  assert.match((await submit('ok')).status, /نُشر/);
  assert.deepEqual((await submit('ok', true)).removed, ['old.pdf']);
});
test('unknown write outcome preserves the PDF', async () => {
  for (const scenario of ['offline', 'unknown']) {
    const result = await submit(scenario);
    assert.deepEqual(result.removed, []);
    assert.match(result.status, /قبل إعادة الإرسال/);
  }
});
test('definite permission rejection cleans up the new upload only', async () => {
  assert.deepEqual((await submit('denied', true)).removed, ['new.pdf']);
});
test('post-commit failures preserve the published file', async () => {
  for (const scenario of ['cleanup', 'refresh']) {
    const result = await submit(scenario, true);
    assert.deepEqual(result.removed, ['old.pdf']);
    assert.match(result.status, /تم حفظ البحث/);
  }
});
