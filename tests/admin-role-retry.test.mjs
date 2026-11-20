import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../admin.html", import.meta.url), "utf8");
const handlers = html.slice(html.indexOf("function showRoleRetry"), html.indexOf('async function load()'));
const bootstrap = html.match(/\(async\(\)=>\{let\{data\}=await db\.auth\.getSession\(\).*?\}\)\(\)/)[0];
const tick = () => new Promise(resolve => setImmediate(resolve));

function page(responses) {
  const user = { id: "test-user" };
  const nodes = new Map();
  const get = id => {
    if (!nodes.has(id)) nodes.set(id, { value: "", classList: new Set(), append(button) { this.retry = button; } });
    return nodes.get(id);
  };
  get("app").classList.add("hidden");
  get("app").classList.remove = Set.prototype.delete;
  const counts = { loads: 0, signouts: 0 };
  const db = {
    auth: {
      signInWithPassword: async () => ({ data: { user } }),
      getSession: async () => ({ data: { session: { user } } }),
      signOut: async () => { counts.signouts++; }
    },
    from() { return { select() { return this; }, eq(key, value) {
      assert.equal(key, "id"); assert.equal(value, user.id); return this;
    }, maybeSingle: async () => responses.shift()() }; }
  };
  const context = vm.createContext({ db, S: {}, $: get, document: { createElement: () => ({}) },
    location: { reload: () => vm.runInContext(bootstrap, context) },
    load: async () => { counts.loads++; } });
  vm.runInContext(handlers, context);
  return { counts, get, login: () => get("loginForm").onsubmit({ preventDefault() {} }) };
}

for (const [kind, failure] of [
  ["service error", () => ({ error: { message: "temporary" } })],
  ["rejected request", () => { throw Error("offline"); }]
]) {
  test(kind + ' preserves the session and retries through session restoration', async () => {
    const p = page([failure, () => ({ data: { role: "admin", full_name: "Demo" } })]);
    await p.login(); await tick();
    assert.equal(p.get("app").classList.has("hidden"), true);
    assert.deepEqual(p.counts, { loads: 0, signouts: 0 });
    p.get("loginMsg").retry.onclick(); await tick();
    assert.deepEqual(p.counts, { loads: 1, signouts: 0 });
    assert.equal(p.get("app").classList.has("hidden"), false);
    assert.equal(p.get("adminName").textContent, "Demo");
  });
}

test("confirmed non-admin and missing profiles remain denied", async () => {
  for (const profile of [null, { role: "student" }]) {
    const p = page([() => ({ data: profile })]);
    await p.login(); await tick();
    assert.deepEqual(p.counts, { loads: 0, signouts: 1 });
    assert.match(p.get("loginMsg").textContent, /Access denied/);
    assert.equal(p.get("app").classList.has("hidden"), true);
  }
});
