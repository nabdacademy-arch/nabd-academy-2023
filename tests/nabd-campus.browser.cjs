"use strict";
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");
const path = require("node:path");

(async () => {
  const root = path.resolve(__dirname,"..");
  const port = 8765;
  const server = spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:root,stdio:"ignore"});
  let browser;
  try {
    let ready = false;
    for (let attempt=0;attempt<30;attempt++) {
      try { const r=await fetch("http://127.0.0.1:"+port+"/nabd-campus.html"); if(r.ok){ready=true;break;} }catch(_){}
      await new Promise(r=>setTimeout(r,250));
    }
    assert.ok(ready,"local static server must be ready");
    browser=await chromium.launch({headless:true});
    for (const width of [375,1440]) {
      const context=await browser.newContext({viewport:{width,height:830},reducedMotion:"reduce"});
      // Offline/CDN failure is expected to degrade gracefully, without accessing private data.
      await context.route(/^https:\/\//,route=>route.abort());
      const page=await context.newPage();
      const errors=[];
      page.on("pageerror",err=>errors.push(err.message));
      await page.goto("http://127.0.0.1:"+port+"/nabd-campus.html",{waitUntil:"domcontentloaded"});
      await page.locator("#accountStatus").waitFor();
      assert.equal(await page.locator("html").getAttribute("dir"),"rtl");
      assert.equal(await page.locator("#adminPanel").isVisible(),false,"admin UI must not appear to public visitors");
      assert.equal(await page.locator("#courseCount").innerText(),"—","public view must not pretend to have course data");
      await page.locator("#languageButton").click();
      assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
      assert.ok((await page.locator("h1").innerText()).includes("medical world"));
      assert.equal(await page.locator("#studentAction").getAttribute("href"),"portal.html");
      assert.equal(await page.locator("a[href='nabd-partners.html']").count()>0,true);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth+8),"Campus must not overflow viewport");
      await page.goto("http://127.0.0.1:"+port+"/nabd-partners.html",{waitUntil:"domcontentloaded"});
      await page.locator("#copyBrief").waitFor();
      await page.locator("#languageButton").click();
      assert.equal(await page.locator("html").getAttribute("dir"),"rtl","language switch should preserve layout direction");
      assert.ok((await page.locator(".budget tbody tr").count())===8,"seven line items plus total");
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth+8),"Partners page must not overflow viewport");
      assert.deepEqual(errors,[],"no uncaught client-side errors");
      await context.close();
    }
    console.log("NABD Campus browser/mobile fallback checks passed.");
  } finally {
    if(browser)await browser.close();
    server.kill();
  }
})().catch(err=>{console.error(err);process.exitCode=1;});
