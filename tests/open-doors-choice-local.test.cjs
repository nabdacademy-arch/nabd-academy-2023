"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

test("only rounds using the protected archive request it", async () => {
  class Element {
    constructor() {
      this.children = [];
      this.style = {};
      this.classList = {toggle() {}};
    }
    addEventListener(event, handler) { this[event] = handler; }
    append(...children) { this.children.push(...children); }
    replaceChildren() { this.children = []; }
    setAttribute() {}
  }
  const nodes = new Map();
  function get(id) {
    if (!nodes.has(id)) nodes.set(id, new Element());
    return nodes.get(id);
  }
  let checks = 0, reads = 0, online = false;
  const archived = {
    id: "OD-1", subject: "chemistry", kind: "single", question: "Archived practice question",
    options: ["A", "B", "C"], answers: ["A"], topic: "Practice"
  };
  const db = {
    auth: {async getUser() {
      checks++;
      if (!online) throw Error("offline");
      return {data: {user: {id: "fixture"}}};
    }},
    from() {
      reads++;
      return {select() {return this}, in() {return this}, limit() {return {data: [archived]}}};
    }
  };
  const context = {
    createClient: () => db,
    document: {getElementById: get, createElement: () => new Element(), querySelector: get}
  };
  context.window = context;
  const read = name => fs.readFileSync(path.join(__dirname, "../assets/js", name), "utf8");
  vm.runInNewContext(read("open-doors-choice-bank.js"), context);
  vm.runInNewContext(read("open-doors-choice.js").replace(/^import .*$/m, ""), context);
  async function start(id, source) {
    get(id+"Subject").value = "chemistry";
    get(id+"Count").value = "1";
    get(id+"Source").value = source;
    await get(id+"Start").click();
    assert.equal(get(id+"Start").disabled, false);
  }
  for (const id of ["choiceSingle", "choiceMulti"]) {
    get('[data-tab="'+id+'"]').click?.();
    for (const source of ["generated", "new"]) {
      await start(id, source);
      assert.equal(get(id+"Panel").hidden, false);
      assert.ok(get(id+"Options").children.length >= 2);
      assert.equal(checks, 0);
    }
  }
  await start("choiceSingle", "mixed");
  assert.equal(checks, 1);
  assert.match(get("choiceSingleStatus").textContent, /بدأت الجولة/);
  await start("choiceSingle", "archive");
  assert.match(get("choiceSingleStatus").textContent, /تعذّر تحميل الأرشيف/);
  assert.equal(reads, 0);
  online = true;
  await start("choiceSingle", "archive");
  assert.equal(reads, 1);
  assert.equal(get("choiceSinglePrompt").textContent, archived.question);
});
