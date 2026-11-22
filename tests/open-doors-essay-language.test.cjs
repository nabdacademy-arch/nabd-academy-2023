"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

test("translation preserves the active essay and the completed round", async () => {
  const elements = [];
  class Element {
    constructor() {
      elements.push(this);
      this.dataset = {};
      this.style = {};
      this.value = "";
      this.children = [];
      this.classList = { toggle() {} };
    }
    addEventListener(event, handler) { this[event] = handler; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    querySelector() { return null; }
    prepend(...nodes) { this.children.unshift(...nodes); }
    getAttribute(key) { return key.endsWith("-ar") ? this.dataset.essayAr : this.dataset.essayEn; }
    setAttribute() {}
    removeAttribute() {}
  }
  const nodes = new Map();
  function get(id) {
    if (!nodes.has(id)) nodes.set(id, new Element());
    return nodes.get(id);
  }
  const document = {
    getElementById: get, createElement: () => new Element(), querySelector: () => null,
    querySelectorAll: () => elements.filter(e => e.dataset.essayAr !== undefined)
  };
  const unavailable = () => { throw Error("storage unavailable"); };
  const context = {
    document, sessionStorage: { getItem: unavailable, setItem: unavailable },
    URL: { createObjectURL: () => "blob:fixture", revokeObjectURL: () => assert.fail("Photo discarded") },
    createClient: () => ({auth: {getUser: async () => ({data: {user: null}})}})
  };
  context.window = context;
  const read = name => fs.readFileSync(path.join(__dirname, "../assets/js", name), "utf8");
  vm.runInNewContext(read("open-doors-essay-bank.js"), context);
  vm.runInNewContext(read("open-doors-essay.js").replace(/^import .*$/m, ""), context);
  get("essaySubject").value = "chemistry";
  await get("essayStart").click();
  get("essayAnswer").value = "My worked answer";
  get("essayAnswer").input();
  get("essayImage").files = [{name: "answer.png", type: "image/png", size: 2000}];
  get("essayImage").change();
  get("essayConsent").checked = true;
  get("essayTranslate").click();
  assert.equal(get("essayAnswer").value, "My worked answer");
  assert.equal(get("essayPreview").src, "blob:fixture");
  assert.equal(get("essayPreview").hidden, false);
  assert.equal(get("essayConsent").checked, true);
  assert.equal(get("essayQuestionAr").hidden, false);

  get("essayReveal").click();
  const rubric = get("essaySelfRubric");
  const checkbox = rubric.children[1].children[0];
  checkbox.checked = true;
  get("essayTranslate").click();
  assert.equal(rubric.children[1].children[0], checkbox);
  assert.equal(checkbox.checked, true);
  rubric.children.at(-1).click();
  assert.match(get("essayFeedback").children[1].textContent, /Self-assessment: 3\/10/);
  get("essayTranslate").click();
  assert.match(get("essayFeedback").children[1].textContent, /درجة التقييم الذاتي: 3\/10/);
  assert.equal(get("essayNext").hidden, false);
  get("essayNext").click();
  get("essayTranslate").click();
  assert.equal(get("essayWorkspace").hidden, true);
  assert.equal(get("essaySummary").hidden, false);
  assert.match(get("essaySummary").children[1].textContent, /3\/10/);
});
