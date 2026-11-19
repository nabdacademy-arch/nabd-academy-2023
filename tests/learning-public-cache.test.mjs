import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../learning/sw.js', import.meta.url), 'utf8');
const scope = 'https://academy.test/learning/';
const asset = scope + 'app.mjs';

function worker(fetch, match) {
 const listeners = {};
 const writes = [];
 const self = {
  location: new URL(scope), registration: {scope},
  addEventListener(name, listener) { listeners[name] = listener; }
 };
 const caches = {
  match,
  async open(name) {
   return { async put(url, response) { writes.push([name, url, await response.text()]); } };
  }
 };
 vm.runInNewContext(source, {self, fetch, caches, URL, Response});
 return {
  writes,
  async request(url = asset, options) {
   const pending = [];
   let result;
   listeners.fetch({
    request: new Request(url, options),
    respondWith(promise) { result = promise; },
    waitUntil(promise) { pending.push(promise); }
   });
   const response = await result;
   await Promise.all(pending);
   return response;
  }
 };
}

test('a healthy public request refreshes the canonical entry', async () => {
 const fresh = new Response('fresh');
 Object.defineProperty(fresh, 'type', {value: 'basic'});
 const app = worker(async () => fresh);
 assert.equal(await app.request(asset + '?v=1'), fresh);
 assert.equal(app.writes.length, 1);
 assert.deepEqual(app.writes[0].slice(1), [asset, 'fresh']);
});

for (const status of [502, 503, 504, 'offline']) {
 test('recover from ' + status + ' when the current cache contains the file', async () => {
  const cached = new Response('saved');
  const app = worker(async () => {
   if (status === 'offline') throw new TypeError();
   return new Response(null, {status});
  }, async (url, options) => {
   assert.equal(url, asset);
   assert.equal(options.cacheName, /const CACHE='([^']+)'/.exec(source)[1]);
   return cached;
  });
  assert.equal(await app.request(), cached);
  assert.equal(app.writes.length, 0);
 });
}

test('a missing or unavailable cache preserves the original failure', async () => {
 for (const match of [async () => undefined, async () => { throw new Error(); }]) {
  const unavailable = new Response('busy', {status: 503});
  assert.equal(await worker(async () => unavailable, match).request(), unavailable);
  const offline = worker(async () => { throw new TypeError(); }, match);
  assert.equal((await offline.request()).type, 'error');
 }
});

test('access refusals and missing files pass through without a cache lookup', async () => {
 for (const status of [401, 403, 404]) {
  const response = new Response(null, {status});
  let reads = 0;
  const app = worker(async () => response, async () => { reads++; });
  assert.equal(await app.request(), response);
  assert.equal(reads, 0);
 }
});

test('private, authenticated, cross-origin and non-GET requests bypass the worker', async () => {
 let calls = 0;
 const app = worker(async () => { calls++; });
 assert.equal(await app.request(scope + 'account'), undefined);
 assert.equal(await app.request(asset, {headers: {Authorization: 'local-test'}}), undefined);
 assert.equal(await app.request('https://other.test/learning/app.mjs'), undefined);
 assert.equal(await app.request(asset, {method: 'POST'}), undefined);
 assert.equal(calls, 0);
});
