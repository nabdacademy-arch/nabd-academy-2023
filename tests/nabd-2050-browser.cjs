"use strict";
const assert=require("node:assert/strict"),{spawn}=require("node:child_process"),{resolve}=require("node:path"),{chromium}=require("playwright");
async function run(){
 const port=8898,base="http://127.0.0.1:"+port,server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:resolve(__dirname,".."),stdio:"ignore"});
 let browser;
 try{
  let started=false;for(let i=0;i<55;i++){try{started=(await fetch(base+"/nabd-2050.html")).ok;if(started)break}catch(e){}await new Promise(r=>setTimeout(r,200))}
  assert.ok(started,"Site fixture available");
  browser=await chromium.launch({headless:true});
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:870},reducedMotion:"reduce"});
   await context.route(/^https:\/\//,route=>route.abort());
   const page=await context.newPage();
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto(base+"/nabd-2050.html",{waitUntil:"domcontentloaded"});
   await page.locator("#modelMenu .model-tab").first().waitFor();
   assert.equal(await page.locator("#modelMenu .model-tab").count(),6,"Six model selections are rendered");
   await page.locator("#choiceList input").first().check();
   await page.locator("#next").click();
   assert.match(await page.locator("#stageIndex").innerText(),/02 \/ 04/,"Time Lab progresses");
   await page.locator("#choiceList input").nth(1).check();
   await page.locator("#next").click();
   await page.locator("#choiceList input").first().check();
   await page.locator("#next").click();
   await page.locator("#choiceList input").first().check();
   await page.locator("#next").click();
   assert.ok(await page.locator("#completion").isVisible(),"Completes 4-phase journey");
   assert.match(await page.locator("#summaryText").innerText(),/6 \/ 8/,"Report reflects decisions: 2+0+2+2");
   assert.equal(await page.locator("#activateAR").isEnabled(),false,"AR disabled before model is loaded");
   await page.locator("#modelMenu button[data-model='lungs']").click();
   assert.match(await page.locator("#modelName").innerText(),/الرئتان/,"Different organ fact data");
   assert.match(await page.locator("#modelPoster").getAttribute("src"),/lungs-3d\.svg/,"Model image fallback changes");
   await page.locator("#language").click();
   assert.equal(await page.locator("html").getAttribute("lang"),"en");
   assert.match(await page.locator("#modelName").innerText(),/Lungs/);
   assert.match(await page.locator("#summaryTitle").innerText(),/reasoning/i,"Completion content is bilingual");
   await page.locator("#scenario").selectOption("fluid");
   assert.match(await page.locator("#stageIndex").innerText(),/01 \/ 04/,"Changing scenario resets old answers");
   assert.match(await page.locator("#scenarioTitle").innerText(),/Kidneys/,"Independent renal scenario");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=5,"2050 layout has no horizontal overflow at "+width+"px: "+overflow);
   assert.deepEqual(errors,[],"No page errors before optional model loading");
   await context.close();
  }
  const context=await browser.newContext({viewport:{width:430,height:900}});
  await context.route(/^https:\/\//,route=>route.abort());
  const page=await context.newPage();
  await page.goto(base+"/nabd-2050.html",{waitUntil:"domcontentloaded"});
  await page.locator("#loadModel").click();
  await page.waitForFunction(()=>document.querySelector("#arStatus")?.textContent?.includes("لم تفتح مكتبة العرض"),null,{timeout:10000});
  assert.equal(await page.locator("#modelPoster").isVisible(),true,"Failed remote viewer preserves fallback");
  await page.locator("#modelMenu button[data-model='brain']").click();
  assert.equal(await page.locator("#activateAR").isEnabled(),false,"Changing model clears AR state");
  await context.close();
  console.log("NABD 2050 browser: mobile + desktop, 3 branching scenarios, score, RTL/LTR, AR fallback PASS");
 }finally{if(browser)await browser.close();server.kill()}
}
run().catch(e=>{console.error(e);process.exitCode=1});