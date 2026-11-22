const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const script = fs.readFileSync(path.resolve(__dirname, '../assets/js/quality-feed.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function page() {
  let user = 'first', authChanged;
  const pending = [];
  const host = { dataset: { qualityDestination: '../student-exams.html' }, replaceChildren(...nodes) { this.children = nodes; } };
  const window = { addEventListener(event, fn) { this[event] = fn; }, nabdSupabase: {
    auth: {
      getUser: async () => ({ data: { user: user && { id: user } } }),
      onAuthStateChange(fn) { authChanged = fn; }
    },
    rpc: () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
  } };
  vm.runInNewContext(script, { window, setTimeout: setImmediate, setInterval() {},
    document: { querySelectorAll: () => [host], addEventListener() {},
      createElement: () => ({ children: [], append(child) { this.children.push(child); } }) }
  });
  return { host, pending, window, change(id) {
    user = id;
    authChanged(id ? 'SIGNED_IN' : 'SIGNED_OUT', id ? { user: { id } } : null);
  } };
}
const exam = title => ({ data: [{ title, closes_at: '2026-11-20T20:00:00Z' }] });
test('account switch and logout discard in-flight notices', async () => {
  const p = page();
  await tick();
  p.change('second');
  await tick();
  p.pending[1].resolve(exam('Second exam')); await tick();
  p.pending[0].resolve(exam('First exam')); await tick();
  assert.match(p.host.children[2].children[0].textContent, /Second exam/);
  assert.equal(p.host.children[2].children[0].href, '../student-exams.html');
  p.window.online(); await tick();
  p.change(null);
  assert.equal(p.host.children[2].children.length, 0);
  p.pending[2].resolve(exam('Late exam')); await tick();
  assert.equal(p.host.children[2].children.length, 0);
});
test('connectivity failure shows an error and reconnect refreshes once', async () => {
  const p = page(); await tick();
  p.pending[0].reject(Error('offline')); await tick();
  assert.match(p.host.children[1].textContent, /تعذّر/);
  p.window.online(); p.window.online(); await tick();
  assert.equal(p.pending.length, 2);
  p.pending[1].resolve({ data: [] }); await tick();
  assert.match(p.host.children[1].textContent, /بعد موافقة المدير/);
});
