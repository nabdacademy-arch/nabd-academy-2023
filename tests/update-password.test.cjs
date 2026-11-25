const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = readFileSync(path.join(root, 'update-password.html'), 'utf8');
const scriptPath = html.match(/src="([^"]*update-password\.js)"/)[1];
const source = readFileSync(path.join(root, scriptPath), 'utf8');

function page(auth, {preferred, language, blocked} = {}) {
  const nodes = new Map(Array.from(html.matchAll(/id="([^"]+)"/g), ([, id]) =>
    [id, {value: '', classList: {toggle() {}}}]));
  const form = nodes.get('updatePasswordForm');
  const button = {disabled: false};
  form.querySelector = selector => selector === '[type="submit"]' && html.includes('<button type="submit"') ? button : null;
  form.reset = () => { for (const node of nodes.values()) node.value = ''; };
  const location = {};
  const rootElement = {};
  const labels = Array.from(html.matchAll(/data-ar="([^"]+)">([^<]+)/g),
    ([, ar, textContent]) => ({dataset: {ar}, textContent}));
  vm.runInNewContext(source, {
    document: {documentElement: rootElement, querySelectorAll: () => labels, getElementById: id => nodes.get(id)},
    window: {navigator: {language}, localStorage: {getItem(key) {
      assert.equal(key, 'nabd_lang');
      if (blocked) throw new Error('Storage blocked');
      return preferred;
    }}, nabdSupabase: auth && {auth}}, location, setTimeout: callback => callback()
  });
  const password = nodes.get('newPassword');
  const confirmation = nodes.get('confirmPassword');
  password.value = confirmation.value = 'example-only';
  return {rootElement, labels, button, confirmation, password, location, message: nodes.get('updatePasswordMessage'),
    submit: () => form.onsubmit({preventDefault() {}})};
}

test('valid submission updates once, clears fields and returns to portal', async () => {
  let writes = 0;
  const state = page({
    async getSession() { return {data: {session: {user: {id: 'test'}}}}; },
    async updateUser({password}) { assert.equal(password, 'example-only'); writes++; return {}; }
  });
  await Promise.all([state.submit(), state.submit()]);
  assert.equal(writes, 1);
  assert.equal(state.password.value, '');
  assert.equal(state.confirmation.value, '');
  assert.equal(state.location.href, 'portal.html');
  assert.equal(state.button.disabled, true);
});

test('missing backend, invalid fields and absent session cannot submit an update', async () => {
  assert.equal(page(null).button.disabled, true);
  let reads = 0;
  let writes = 0;
  const state = page({async getSession() { reads++; return {data: {session: null}}; },
    async updateUser() { writes++; return {}; }});
  state.password.value = 'short';
  await state.submit();
  assert.match(state.message.textContent, /at least 8/);
  state.password.value = 'different';
  await state.submit();
  assert.match(state.message.textContent, /do not match/);
  assert.equal(reads, 0);
  state.confirmation.value = 'different';
  await state.submit();
  assert.match(state.message.textContent, /reset link/);
  assert.equal(writes, 0);
});

test('lookup or update failure permits a successful manual retry', async () => {
  for (const failAt of ['lookup', 'update', 'offline']) {
    let fail = true;
    const state = page({
      async getSession() {
        if (fail && failAt === 'lookup') return {error: new Error('Session unavailable')};
        return {data: {session: {user: {id: 'test'}}}};
      },
      async updateUser() {
        if (fail && failAt === 'offline') throw new Error('Connection lost');
        if (fail) return {error: new Error('Update refused')};
        return {};
      }
    });
    await state.submit();
    assert.match(state.message.textContent, /unavailable|lost|refused/);
    assert.equal(state.button.disabled, false);
    assert.equal(state.password.value, 'example-only');
    assert.equal(state.location.href, undefined);
    fail = false;
    await state.submit();
    assert.equal(state.location.href, 'portal.html');
  }
});

test('saved Arabic applies RTL to the form and reports failure and success in Arabic', async () => {
  let fail = true;
  const state = page({
    async getSession() { return {data: {session: {user: {id: 'test'}}}}; },
    async updateUser() { if (fail) throw new Error('Network unavailable'); return {}; }
  }, {preferred: 'ar', language: 'en'});
  assert.deepEqual(state.rootElement, {lang: 'ar', dir: 'rtl'});
  assert.equal(state.labels.length, 7);
  for (const label of state.labels) assert.equal(label.textContent, label.dataset.ar);
  await state.submit();
  assert.match(state.message.textContent, /حاول مجددًا/);
  assert.equal(state.password.value, 'example-only');
  fail = false;
  await state.submit();
  assert.match(state.message.textContent, /بنجاح/);
});

test('stored English overrides browser Arabic and blocked storage falls back to browser language', () => {
  const english = page(null, {preferred: 'en', language: 'ar-PS'});
  assert.deepEqual(english.rootElement, {lang: 'en', dir: 'ltr'});
  assert.match(english.message.textContent, /Reload/);
  const arabic = page(null, {blocked: true, language: 'ar-PS'});
  assert.equal(arabic.rootElement.dir, 'rtl');
  assert.match(arabic.message.textContent, /عودة الاتصال/);
  assert.equal(arabic.button.disabled, true);
});
