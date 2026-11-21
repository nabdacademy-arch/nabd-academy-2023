"use strict";
const {chromium}=require("playwright");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const fakeModule=String.raw`
export function createClient(){
 return {
  auth:{
   getUser:async()=>({data:{user:null},error:null}),
   signInWithPassword:async()=>{throw Error("GUEST_MUST_NOT_SIGN_IN")},
   signOut:async()=>({error:null})
  },
  from:()=>({
   select:()=>({
    limit:async()=>({data:[{id:"owner-private-bank-question"}],error:null})
   })
  }),
  functions:{invoke:async()=>({data:{ok:false,error:"MOCK_NO_AI"},error:null})}
 };
}
`;
(async()=>{
 fs.mkdirSync("masters-browser-results",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
 const errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2*/+esm",route=>route.fulfill({
  status:200,contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fakeModule
 }));
 await page.route(/https?:\/\/(?!127\.0\.0\.1:8123|cdn\.jsdelivr\.net)/,route=>route.abort());
 try{
  await page.goto("http://127.0.0.1:8123/open-doors-masters.html",{waitUntil:"domcontentloaded"});
  await page.locator("#masterApp").waitFor({state:"visible",timeout:20000});
  assert.equal(await page.locator("#mastersAuth").isVisible(),false);
  assert.equal(await page.locator("#mastersLoginForm").count(),0);
  assert.equal(await page.locator("#masterSubjectCards [data-subject]").count(),3);
  assert.equal(await page.locator("#masterBankCount").innerText(),"81");
  // Subject cards change the master's track, not the bachelor's question bank.
  await page.locator('#masterSubjectCards [data-subject="biology"]').click();
  await page.locator('.master-nav [data-view="single"]').click();
  await page.locator("#masterPracticeCount").selectOption("5",{timeout:6000});
  await page.locator("#masterPracticeStart").click();
  await page.locator("#masterPracticeQuestion").waitFor({state:"visible"});
  assert.equal(await page.locator("#masterPracticeQuestion input[type=radio]").count(),4);
  assert.match(await page.locator("#masterPracticeQuestion .question-en").innerText(),/.{20}/);
  await page.locator("#masterPracticeQuestion .translation-button").click();
  assert.equal(await page.locator("#masterPracticeQuestion .question-ar").isVisible(),true);
  assert.equal(await page.locator("#masterPracticeQuestion .arabic").count(),4);
  await page.locator("#masterPracticeQuestion input[type=radio]").first().check();
  await page.locator("#masterPracticeCheck").click();
  await page.locator("#masterPracticeReport").waitFor({state:"visible"});
  assert.match(await page.locator("#masterPracticeReport").innerText(),/الإجابة العلمية|Worked|مراجعة/);
  assert.equal(await page.locator("#masterPracticeNext").isVisible(),true);
  await page.locator("#masterPracticeNext").click();
  assert.match(await page.locator("#masterPracticeNumber").innerText(),/2\/5/);
  // Multiple choice uses checkboxes and independent rubric.
  await page.locator('.master-nav [data-view="multi"]').click();
  await page.locator("#masterPracticeStart").click();
  assert.equal(await page.locator("#masterPracticeQuestion input[type=checkbox]").count(),4);
  await page.locator("#masterPracticeQuestion input[type=checkbox]").first().check();
  await page.locator("#masterPracticeCheck").click();
  assert.equal(await page.locator("#masterPracticeReport").isVisible(),true);
  assert.match(await page.locator("#masterPracticeReport").innerText(),/الاختيارات|correct|الإجابة/);
  // Postgraduate written prompts and self-review are not replaced by undergraduate items.
  await page.locator('.master-nav [data-view="written"]').click();
  await page.locator("#masterPracticeCount").selectOption("1");
  await page.locator("#masterPracticeStart").click();
  assert.equal(await page.locator("#masterPracticeQuestion textarea").count(),1);
  await page.locator("#masterPracticeQuestion textarea").fill("A well-founded research answer would discuss design, equations, controls and limitations.");
  await page.locator("#masterPracticeModel").click();
  assert.equal(await page.locator("#masterPracticeReport").isVisible(),true);
  assert.match(await page.locator("#masterPracticeReport").innerText(),/الإجابة العلمية|model|reference/i);
  // Master's official sources and syllabus links are present for the selected track.
  await page.locator('.master-nav [data-view="sources"]').click();
  assert.ok(await page.locator('#masterSourcesContent a[href*="od.globaluni.ru"]').count()>=6);
  await page.locator('.master-nav [data-view="curriculum"]').click();
  assert.ok(await page.locator("#masterCurriculumContent article").count()>=6);
  // Launch 43-question mock plus oral stage; do not wait 3 hours.
  await page.locator('.master-nav [data-view="simulation"]').click();
  await page.locator("#masterExamStart").click();
  await page.locator("#masterExamWorkspace").waitFor({state:"visible"});
  assert.equal(await page.locator("#masterExamNavigator button").count(),43);
  assert.match(await page.locator("#masterExamClock").innerText(),/174|175/);
  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#masterExamReset").click();
  // Refresh via control after dialog returns.
  await page.locator("#masterLanguage").click();
  assert.equal(await page.locator("html").getAttribute("lang"),"en");
  await page.setViewportSize({width:390,height:844});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=5,"Master's mobile horizontal overflow: "+overflow);
  await page.screenshot({path:"masters-browser-results/masters-mobile.png",fullPage:true});
  assert.deepEqual(errors,[],"No browser JavaScript runtime errors");
  console.log("PASS: Masters guest training with no sign-in, bilingual practice, self-review, sources and 44-task mock.");
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
