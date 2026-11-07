"use strict";
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const path=require("node:path");
(async()=>{
  const root=path.resolve(__dirname,".."),port=8771;
  const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:root,stdio:"ignore"});
  let browser;
  try{
    let ready=false;
    for(let i=0;i<40;i++){
      try{const r=await fetch("http://127.0.0.1:"+port+"/v11/");if(r.ok){ready=true;break}}catch(e){}
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    assert.ok(ready,"V11 local web server ready");
    browser=await chromium.launch({headless:true});
    for(const width of [390,1440]){
      const context=await browser.newContext({viewport:{width,height:860},reducedMotion:"reduce"});
      await context.route(/^https:\/\//,route=>route.abort());
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await page.goto("http://127.0.0.1:"+port+"/v11/",{waitUntil:"domcontentloaded"});
      await page.locator(".system-option").first().waitFor();
      assert.equal(await page.locator(".system-option").count(),8,"8 human systems");
      assert.equal(await page.locator("html").getAttribute("dir"),"rtl");
      await page.locator('.body-hotspot[data-target="respiratory"]').click();
      assert.match(await page.locator("#systemHeading").innerText(),/التنفسي/);
      await page.locator("#tab-function").click();
      assert.match(await page.locator("#lensTitle").innerText(),/يعمل/);
      await page.locator("#checkUnderstanding").click();
      assert.equal(await page.locator("#checkChoices .answer-button").count(),4);
      await page.locator("#checkChoices .answer-button").nth(1).click();
      assert.equal(await page.locator("#quizStat").innerText(),"1");
      await page.locator(".scenario-button").first().click();
      await page.locator(".scenario-choice").first().click();
      await page.locator(".scenario-next").click();
      await page.locator(".scenario-choice").first().click();
      await page.locator(".scenario-next").click();
      assert.equal(await page.locator("#missionStat").innerText(),"1");
      await page.locator("#saveProgress").check();
      await page.reload({waitUntil:"domcontentloaded"});
      assert.equal(await page.locator("#quizStat").innerText(),"1","Opt-in progress survives reload");
      assert.equal(await page.locator("#missionStat").innerText(),"1");
      await page.locator("#langBtn").click();
      assert.equal(await page.locator("html").getAttribute("dir"),"ltr","English LTR");
      assert.match(await page.locator("#heroTitle").innerText(),/universe/);
      await page.locator("#clearProgress").click();
      assert.equal(await page.locator("#quizStat").innerText(),"0","Clear deletes mastery");
      assert.equal(await page.locator("#missionStat").innerText(),"0","Clear deletes missions");
      assert.equal(await page.evaluate(()=>localStorage.getItem("nabd-v11-progress-v1")),null,"No saved data after clearing");
      const geometry=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,offenders:[...document.querySelectorAll("body *")].map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,cls:typeof e.className==="string"?e.className.slice(0,70):"",left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}}).filter(x=>x.left < -9 || x.right > innerWidth+9).slice(0,18)}));
      assert.ok(geometry.scrollWidth<=geometry.viewport+8,"No horizontal overflow at "+width+" "+JSON.stringify(geometry));
      assert.deepEqual(errors,[],"No page errors at "+width);
      if(width===390){
        await page.evaluate(async()=>{if("serviceWorker" in navigator){await navigator.serviceWorker.ready}});
        await context.setOffline(true);
        await page.reload({waitUntil:"domcontentloaded"});
        assert.equal(await page.locator(".system-option").count(),8,"V11 shell available offline after installation");
        await context.setOffline(false);
      }
      await context.close();
    }
    console.log("NABD V11 browser tests passed (mobile, desktop, study missions, opt-in local progress, English RTL/LTR, offline).");
  }finally{
    if(browser)await browser.close();
    server.kill();
  }
})().catch(err=>{console.error(err);process.exitCode=1});
