import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const scope = "https://academy.example/project/atlas/";
const worker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const link = new URL("clinical-hub.html?department=pediatrics", scope).href;

function navigate(url, online, pages) {
  const events = {};
  const self = {
    registration: { scope },
    location: new URL(scope),
    addEventListener: (name, handler) => { events[name] = handler; }
  };
  const cache = {
    match: async key => pages[new URL(key.url ?? key, scope).href]
  };
  vm.runInNewContext(worker, {
    self, URL, caches: { open: async () => cache },
    fetch: async request => {
      assert.equal(request.url, url);
      if (online) return "live page";
      throw new Error("offline");
    }
  });
  let response;
  events.fetch({
    request: { url, method: "GET", mode: "navigate" },
    respondWith: value => { response = value; }
  });
  return response;
}

test("department navigation uses the original network request online", async () => {
  assert.equal(await navigate(link, true, {}), "live page");
});

test("department navigation opens the bundled case library offline", async () => {
  const pages = {
    [scope + "clinical-hub.html"]: "cases",
    [scope + "index.html"]: "home"
  };
  assert.equal(await navigate(link, false, pages), "cases");
  assert.equal(await navigate(scope + "unknown", false, pages), "home");
});

test("an empty bundle propagates the network failure and other portals bypass Atlas", async () => {
  await assert.rejects(navigate(link, false, {}), /offline/);
  assert.equal(navigate(new URL("../students/", scope).href, false, {}), undefined);
});
