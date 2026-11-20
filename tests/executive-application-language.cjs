const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('role selections survive language changes, a failed upload and submission', async () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../executive-application.html'), 'utf8');
  const script = html.match(/<script>\s*(const db=supabase[\s\S]*?)<\/script>/)[1];
  const nodes = new Map();
  function get(id) {
    if (!nodes.has(id)) nodes.set(id, {
      value: '', style: {}, options: [{ value: '' }], classList: { add() {} },
      set innerHTML(value) { this.options = []; this.value = ''; },
      appendChild(option) { this.options.push(option); }, addEventListener() {}, scrollIntoView() {}
    });
    return nodes.get(id);
  }
  const document = { getElementById: get, documentElement: {}, createElement: () => ({}), querySelectorAll: () => [] };
  let attempts = 0;
  const sent = [];
  const db = {
    storage: { from: () => ({ upload: async () => ({ error: attempts++ === 0 ? Error('offline') : null }) }) },
    rpc: async (_, { p }) => { sent.push(p); return { data: 'TEST-1' }; }
  };
  vm.runInNewContext(script, { document, TextDecoder, crypto: { randomUUID: () => 'test' },
    supabase: { createClient: () => db }, console: { error() {} } });
  const primary = get('position_applied'), alternate = get('alternative_position');
  const toggle = get('langBtn').onclick;
  toggle();
  assert.equal(alternate.value, '');
  primary.value = 'Research Director';
  alternate.value = 'Operations Director';
  toggle();
  assert.equal(document.documentElement.dir, 'rtl');
  const label = select => select.options.find(o => o.value === select.value)?.textContent;
  assert.equal(label(primary), 'مدير البحث العلمي');
  assert.equal(label(alternate), 'مدير العمليات');
  get('cv_file').files = [new Blob(['%PDF-fixture'])];
  const submit = () => get('applicationForm').onsubmit({ preventDefault() {} });
  await submit();
  assert.match(get('formStatus').className, /error/);
  assert.equal(sent.length, 0);
  toggle();
  assert.equal(document.documentElement.dir, 'ltr');
  assert.equal(label(primary), 'Research Director');
  assert.equal(label(alternate), 'Operations Director');
  await submit();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].position_applied, 'Research Director');
  assert.equal(sent[0].alternative_position, 'Operations Director');
  assert.equal(get('applicationNumber').textContent, 'TEST-1');
});
