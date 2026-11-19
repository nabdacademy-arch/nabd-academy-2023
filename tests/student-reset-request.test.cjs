const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function portal(request) {
  const status = { classList: { add() {}, remove() {} } };
  const button = {};
  const email = { value: ' Student@Example.com ' };
  let submit, start;
  const nodes = {
    '#sendResetButton': button, '#forgotPasswordStatus': status, '#forgotPasswordEmail': email,
    '#forgotPasswordForm': { addEventListener(event, handler) { if (event === 'submit') submit = handler; } }
  };
  const auth = { getSession: async () => ({ data: {} }), onAuthStateChange() {}, resetPasswordForEmail: request };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/js/portal.js'), 'utf8'), {
    document: { querySelector: key => nodes[key], querySelectorAll: () => [],
      addEventListener(event, handler) { if (event === 'DOMContentLoaded') start = handler; } },
    window: { location: { origin: 'https://example.test', pathname: '/portal.html' }, nabdSupabase: { auth } },
    setTimeout() {}, console
  });
  await start();
  return { send: () => submit({ preventDefault() {} }), button, status, email };
}

test('only one pending request; success and normalization', async () => {
  let finish, calls = 0;
  const f = await portal((email, { redirectTo }) => {
    calls++;
    assert.equal(email, 'student@example.com');
    assert.equal(redirectTo, 'https://example.test/portal.html');
    return new Promise(resolve => { finish = resolve; });
  });
  const first = f.send();
  assert.equal(f.button.disabled, true);
  await f.send();
  assert.equal(calls, 1);
  finish({});
  await first;
  assert.equal(f.button.disabled, false);
  assert.match(f.status.textContent, /eligible/);
});

test('empty input, throttling, lost confirmation and successful retry', async () => {
  let calls = 0;
  const f = await portal(async () => {
    calls++;
    if (calls === 1) return { error: { status: 429 } };
    if (calls === 2) throw Error('private diagnostic');
    return {};
  });
  f.email.value = ' ';
  await f.send();
  assert.equal(calls, 0);
  f.email.value = 'a@example.com';
  await f.send();
  assert.match(f.status.textContent, /Too many requests/);
  await f.send();
  assert.match(f.status.textContent, /Check your inbox and connection/);
  await f.send();
  assert.match(f.status.textContent, /eligible/);
});
