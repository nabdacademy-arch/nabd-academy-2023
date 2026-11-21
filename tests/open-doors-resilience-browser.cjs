"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");

(async()=>{
 fs.mkdirSync("open-doors-resilience-results",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:420,height:850},acceptDownloads:true});
 const errors=[];
 page.on("pageerror",err=>errors.push(String(err)));
 // Deliberately make the Supabase SDK unavailable: the local 24 bilingual choice
 // and 18 essay tasks must remain usable without login or cloud database requests.
 await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2*/+esm",route=>route.abort());
 await page.route(/https?:\/\/(?!127\.0\.0\.1:8123|cdn\.jsdelivr\.net)/,route=>route.abort());
 try{
  await page.goto("http://127.0.0.1:8123/open-doors-ai.html",{waitUntil:"domcontentloaded"});
  await page.locator("#appView").waitFor({state:"visible",timeout:22000});
  assert.equal(await page.locator("#kQuestions").innerText(),"42","24 local MCQs + 18 authored essays");
  assert.equal(await page.locator("#authView").isVisible(),false);
  assert.equal(await page.locator("input[type=email],input[type=password]").count(),0);
  assert.equal(await page.locator("#guestBankStatus").isVisible(),true);
  assert.match(await page.locator("#guestBankStatus").innerText(),/42/);
  assert.equal(await page.locator("#retryBankBtn").isVisible(),true);

  await page.locator("#subjectSel").selectOption("chemistry");
  await page.locator("#difficultySel").selectOption("intermediate");
  await page.locator("#modeSel").selectOption("practice");
  await page.locator("#startBtn").click();
  assert.equal(await page.locator("#examStage").isVisible(),true);
  assert.match(await page.locator("#prompt").innerText(),/.{14,}/);
  await page.locator("#translateBtn").click();
  assert.equal(await page.locator("#promptTranslation").isVisible(),true,"local authored Arabic translation should work");
  await page.locator("#options input[type=radio]").first().check();
  await page.locator("#checkBtn").click();
  assert.equal(await page.locator("#feedback").isVisible(),true);
  assert.equal(await page.locator("#kAnswered").innerText(),"1");

  // Local progress survives reload on the same phone without a user account.
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#appView").waitFor({state:"visible",timeout:22000});
  assert.equal(await page.locator("#kAnswered").innerText(),"1");

  // Original bilingual choice bank does not wait for remote archive loading.
  await page.locator('[data-tab="choiceSingle"]').click();
  await page.locator("#choiceSingleSource").selectOption("new");
  await page.locator("#choiceSingleStart").click();
  await page.locator("#choiceSinglePanel").waitFor({state:"visible",timeout:8000});
  await page.locator("#choiceSingleTranslate").click();
  assert.equal(await page.locator("#choiceSinglePromptArabic").isVisible(),true);
  await page.locator("#choiceSingleOptions input[type=radio]").first().check();
  await page.locator("#choiceSingleCheck").click();
  assert.equal(await page.locator("#choiceSingleResult").isVisible(),true);

  // Public self-review works in essay mode without a paid AI grading endpoint.
  await page.locator('[data-tab="essayLab"]').click();
  await page.locator("#essaySubject").selectOption("chemistry");
  await page.locator("#essayMode").selectOption("single");
  await page.locator("#essayStart").click();
  await page.locator("#essayQuestionEn").waitFor({state:"visible",timeout:8000});
  await page.locator("#essayReveal").click();
  assert.equal(await page.locator("#essaySelfRubric input[type=checkbox]").count(),4);

  // Clock must expire after the REAL 180 minutes, even if browser intervals were paused.
  await page.locator('[data-tab="trainer"]').click();
  await page.locator("#difficultySel").selectOption("all");
  await page.locator("#subjectSel").selectOption("all");
  await page.locator("#modeSel").selectOption("mock");
  await page.locator("#startBtn").click();
  assert.equal(await page.locator("#examStage").isVisible(),true);
  await page.evaluate(()=>{
   const original=Date.now.bind(Date);
   Date.now=()=>original()+181*60*1000;
   document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.locator("#examDone").waitFor({state:"visible",timeout:4000});
  assert.match(await page.locator("#timer").innerText(),/0:00/);
  assert.equal(await page.locator("#examStage").isVisible(),false);
  await page.screenshot({path:"open-doors-resilience-results/offline-guest-mock-mobile.png",fullPage:true});

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=8,"Mobile horizontal overflow "+overflow);
  assert.deepEqual(errors,[],"No uncaught page errors when CDN and database are unavailable");

  // The independent master's bank also runs from its 81 built-in questions.
  await page.goto("http://127.0.0.1:8123/open-doors-masters.html",{waitUntil:"domcontentloaded"});
  await page.locator("#masterApp").waitFor({state:"visible",timeout:10000});
  assert.equal(await page.locator("#masterBankCount").innerText(),"81");
  assert.equal(await page.locator("#mastersAuth").isVisible(),false);
  await page.locator('.master-nav [data-view="single"]').click();
  await page.locator("#masterPracticeStart").click();
  await page.locator("#masterPracticeQuestion").waitFor({state:"visible",timeout:8000});
  assert.equal(await page.locator("#masterPracticeQuestion input[type=radio]").count(),4);
  assert.deepEqual(errors,[]);
  console.log("PASS: 42-question local guest fallback, persistence, bilingual choices, essays, wall-clock mock and 81-question master's lab without CDN");
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
