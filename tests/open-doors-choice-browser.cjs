"use strict";
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");

async function run() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const origin = "http://127.0.0.1:8123";
    const html = await fs.readFile("open-doors-ai.html", "utf8");
    const panels = ["choiceSingle", "choiceMulti"].map(id => {
      const panel = html.match(new RegExp('<section id="' + id + '"[\\s\\S]*?</section>'));
      assert.ok(panel, id);
      return panel[0].replace(" hidden ", " ");
    });
    await page.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.href === origin + "/fixture") {
        return route.fulfill({contentType: "text/html", body: panels.join("") +
          '<script src="/assets/js/open-doors-choice-bank.js"></script>' +
          '<script type="module" src="/assets/js/open-doors-choice.js"></script>'});
      }
      if (url.hostname === "cdn.jsdelivr.net") {
        return route.fulfill({contentType: "text/javascript", headers: {"Access-Control-Allow-Origin": "*"},
          body: 'export const createClient = () => ({auth:{getUser:async()=>{throw Error("offline")}}});'});
      }
      return url.origin === origin ? route.continue() : route.abort();
    });
    await page.goto(origin + "/fixture");
    const field = suffix => page.locator("#choiceSingle" + suffix);
    await field("Source").selectOption("archive");
    await field("Start").click();
    await page.waitForSelector("#choiceSingleStatus.error");
    assert.equal(await field("Panel").isVisible(), false);
    await field("Source").selectOption("generated");
    await field("Count").selectOption("5");
    await field("Start").click();
    await field("Check").click();
    assert.match(await field("Status").innerText(), /اختر إجابة/);
    const optionsByQuestion = [];
    for (let i = 0; i < 5; i++) {
      optionsByQuestion.push(await field("Options").locator(".en").allTextContents());
      await field("Options").locator("input").first().check();
      await field("Check").click();
      await field("Next").click();
    }
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", {name: /Download report TXT/}).click();
    const download = await downloadEvent;
    const report = await fs.readFile(await download.path(), "utf8");
    const sections = report.split(/\nQuestion \d+ \/ /).slice(1);
    assert.equal(sections.length, 5);
    sections.forEach((section, i) => {
      const lines = section.split("\n").map(line => line.replace(/ \[CORRECT\]$/, ""));
      for (const [position, option] of optionsByQuestion[i].entries()) {
        assert.ok(lines.includes(String.fromCharCode(65 + position) + ") " + option));
      }
      assert.ok(lines.includes("Your selection / اختيارك: A"));
    });
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
