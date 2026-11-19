const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const html = readFileSync(require.resolve('../application-status.html'), 'utf8');
const script = html.match(/<script>\s*(const db =[\s\S]*?)<\/script>/)[1];

function page(rpc) {
  const elements = new Map();
  for (const [, id] of html.matchAll(/id="([^"]+)"/g)) {
    const classes = new Set();
    elements.set(id, {value: '', textContent: '', dataset: {},
      classList: {add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x)},
      scrollIntoView() {}});
  }
  const get = id => elements.get(id);
  get('submitBtn').dataset = {ar: 'فحص حالة الطلب', en: 'Check Application Status'};
  let expire;
  vm.runInNewContext(script, {
    window: {supabase: rpc && {createClient: () => ({rpc})}},
    document: {getElementById: get, documentElement: {}, querySelectorAll: () => []},
    AbortController, setTimeout(fn) {expire = fn;}, clearTimeout() {}
  });
  return {get, submit: () => get('statusForm').onsubmit({preventDefault() {}}), expire: () => expire()};
}

test('an edited lookup ignores its late reply and shows only the latest result', async () => {
  const calls = [];
  const p = page((name, args) => ({abortSignal: signal => new Promise(resolve => calls.push({name, args, signal, resolve}))}));
  p.get('applicationNumber').value = ' old ';
  p.get('email').value = ' example@test.invalid ';
  const old = p.submit();
  await p.submit();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'check_executive_application_status');
  assert.equal(calls[0].args.p_email, 'example@test.invalid');
  p.get('applicationNumber').value = 'new';
  p.get('statusForm').oninput();
  assert.ok(calls[0].signal.aborted);
  const current = p.submit();
  calls[0].resolve({data: [{application_number: 'old'}]});
  await old;
  assert.ok(p.get('submitBtn').disabled);
  assert.equal(p.get('resultNumber').textContent, '');
  calls[1].resolve({data: [{application_number: 'new', status: 'new'}]});
  await current;
  assert.equal(p.get('resultNumber').textContent, 'new');
  assert.equal(p.get('statusPill').textContent, 'جديد');
  p.get('statusForm').oninput();
  assert.equal(p.get('resultNumber').textContent, '');
});

test('timeout, rejected network call and backend error permit manual retry', async () => {
  let count = 0;
  const p = page(() => ({async abortSignal(signal) {
    switch (++count) {
      case 1: return new Promise(resolve => signal.addEventListener('abort', () => resolve({error: 'timeout'})));
      case 2: throw new TypeError('offline');
      case 3: return {error: 'unavailable'};
      default: return {data: []};
    }
  }}));
  p.get('langBtn').onclick();
  for (let i = 0; i < 3; i++) {
    const pending = p.submit();
    if (i === 0) p.expire();
    await pending;
    assert.match(p.get('message').textContent, /try again/i);
    assert.equal(p.get('submitBtn').disabled, false);
  }
  await p.submit();
  assert.match(p.get('message').textContent, /No matching application/);
});

test('missing authentication library shows a reload instruction', async () => {
  const p = page();
  await p.submit();
  assert.match(p.get('message').textContent, /أعد تحميل/);
  assert.equal(p.get('submitBtn').disabled, false);
});
