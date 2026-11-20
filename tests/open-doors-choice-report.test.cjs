"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

for (const [kind, correct, selected, score] of [
  ["single", [0], [0], 1], ["single", [1], [0], 0],
  ["multi", [0, 2], [2], 1], ["multi", [0, 2], [0, 2], 3]
]) {
  test(kind + " report preserves displayed options and score " + score, async () => {
    class Element {
      constructor() { this.children = []; this.classList = {toggle() {}}; }
      replaceChildren() { this.children = []; }
      append(...nodes) { this.children.push(...nodes); }
      addEventListener(event, fn) { this[event] = fn; }
      click() {}
      remove() {}
    }
    const nodes = new Map();
    function get(id) {
      if (!nodes.has(id)) nodes.set(id, new Element());
      return nodes.get(id);
    }
    const deck = {order: [2, 0, 1], q: {
      id: "fixture", kind, question: "Pick an option", options: ["First", "Second", "Third"],
      subject: "chemistry", topic: "Fixture", correct
    }};
    const result = {correct, selected, score, max: kind === "single" ? 1 : 3};
    const session = {id: "choice", index: 0, kind, translation: new Map(), questions: [deck], reviewed: [result]};
    let blob;
    const context = {window: {OpenDoorsChoiceBank: {SOURCES: {}}}, session, createClient: () => ({}),
      document: {getElementById: get, createElement: () => new Element(), body: new Element()},
      Blob, URL: {createObjectURL(file) {blob = file; return "blob:test";}}, setTimeout() {}};
    const file = path.join(__dirname, "../assets/js/open-doors-choice.js");
    const source = fs.readFileSync(file, "utf8").replace(/^import .*$/m, "");
    vm.runInNewContext(source.slice(0, source.indexOf('init("single");')) +
      "renderResult(session); finish(session);", context);
    const summary = get("choiceSummary");
    summary.children.flatMap(e => e.children).find(e => e.textContent.startsWith("Download")).click();
    const report = await blob.text();
    assert.match(report, /A\) Third.*\nB\) First.*\nC\) Second/);
    const letters = indices => indices.map(i => ["B", "C", "A"][i]).join(", ");
    const marked = "Your selection / اختيارك: " + letters(selected);
    const key = "Correct / الصحيح: " + letters(correct);
    assert.ok(get("choiceResult").children.some(e => e.textContent === marked + "   ·   " + key));
    assert.ok(report.includes(marked + "\n" + key + "\nPoints: " + score + "/" + result.max));
    for (const i of deck.order) {
      assert.ok(report.split("\n").includes(letters([i]) + ") " + deck.q.options[i] +
        (correct.includes(i) ? " [CORRECT]" : "")));
    }
  });
}
