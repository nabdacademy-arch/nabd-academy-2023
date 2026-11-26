const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../v11/sw.js'), 'utf8');
const scope = 'https://example.org/academy/v11/';

function worker(status, cacheState = 'hit') {
  const calls = [];
  const events = {};
  const cached = new Response('offline anatomy');
  const online = status ? new Response('server', {status}) : undefined;
  vm.runInNewContext(source, {URL, Response, self: {
    location: new URL(scope), registration: {scope}, addEventListener: (k, v) => events[k] = v
  }, caches: {async match(key, options) {
    calls.push([key, options.cacheName]);
    if (cacheState === 'blocked') throw Error('Storage unavailable');
    return cacheState === 'hit' ? cached : undefined;
  }}, async fetch() {
    if (!online) throw Error('No connection');
    return online;
  }});
  return {calls, cached, online, navigate(relative, headers = new Headers()) {
    let result;
    events.fetch({request: {url: new URL(relative, scope).href, method:'GET', mode:'navigate', headers},
      respondWith(response) {result = response;}});
    return result;
  }};
}

test('temporary gateway failures or disconnect use the installed V11 shell', async () => {
  for (const route of ['./?lang=ar', './index.html?lang=en']) {
    for (const status of [502, 503, 504, null]) {
      const w = worker(status);
      assert.equal(await w.navigate(route), w.cached);
      assert.equal(w.calls.length, 1);
      assert.equal(w.calls[0][0], scope + 'index.html');
      assert.match(w.calls[0][1], /^nabd-v11-/);
    }
  }
});

test('ordinary responses and access errors retain their original status', async () => {
  for (const status of [200, 401, 403, 404]) {
    const w = worker(status);
    assert.equal(await w.navigate('./'), w.online);
    assert.equal(w.calls.length, 0);
  }
});

test('missing or unavailable cache preserves gateway failure or network error', async () => {
  for (const state of ['miss','blocked']) {
    const w = worker(503, state);
    assert.equal(await w.navigate('./'), w.online);
    assert.equal((await worker(null, state).navigate('./')).type, 'error');
  }
});

test('other pages and authenticated navigation bypass this fallback', () => {
  const w = worker(503);
  assert.equal(w.navigate('../index.html'), undefined);
  assert.equal(w.navigate('./unknown.html'), undefined);
  assert.equal(w.navigate('./', new Headers({Authorization:'test'})), undefined);
  assert.equal(w.calls.length, 0);
});
