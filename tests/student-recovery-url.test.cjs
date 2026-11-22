const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require.resolve("../assets/js/portal.js"), "utf8");

for (const [path, recovery] of [
  ["?type=recovery", true],
  ["#access_token=test&type=recovery", true],
  ["?type=%72ecovery", true],
  ["?note=type=recovery", false],
  ["#subtype=recovery", false],
  ["?type=recovery-preview", false],
  ["?type=signup", false],
  ["", false],
]) {
  test("student portal startup at /portal.html" + path, async () => {
    const active = new Set();
    let start;
    let sessionChecks = 0;
    const window = {
      location: new URL("https://example.invalid/portal.html" + path),
      nabdSupabase: { auth: {
        onAuthStateChange() {},
        async getSession() {
          sessionChecks++;
          return { data: { session: null }, error: null };
        },
      } },
    };
    const document = {
      addEventListener(event, callback) { if (event === "DOMContentLoaded") start = callback; },
      querySelectorAll() { return []; },
      querySelector(selector) {
        if (!["#signInView", "#resetPasswordView"].includes(selector)) return null;
        return { classList: {
          add() { active.add(selector); },
          remove() { active.delete(selector); },
        } };
      },
    };
    vm.runInNewContext(source, { window, document, URLSearchParams, setTimeout() {} });
    await start();
    assert.equal(sessionChecks, recovery ? 0 : 1);
    assert.deepEqual([...active], [recovery ? "#resetPasswordView" : "#signInView"]);
  });
}
