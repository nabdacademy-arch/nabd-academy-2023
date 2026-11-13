"use strict";
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {resolve}=require("node:path");
const {chromium}=require("playwright");
async function serverReady(base){for(let i=0;i<45;i++){try{const r=await fetch(base+"/academy.html");if(r.ok)return true}catch(e){}await new Promise(r=>setTimeout(r,250))}return false}
async function main(){
 const port=8778,base="http://127.0.0.1:"+port,server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:resolve(__dirname,".."),stdio:"ignore"});
 let browser;
 try{
  assert.ok(await serverReady(base),"local web server started");
  browser=await chromium.launch({headless:true});
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:860},acceptDownloads:true,reducedMotion:"reduce"});
   await context.route(/^https:\/\//,route=>route.abort());
   const page=await context.newPage();
   await page.goto(base+"/academy.html",{waitUntil:"domcontentloaded"});
   await page.locator("#nc-route-grid .ncore-card").first().waitFor();
   assert.equal(await page.locator("#nc-route-grid .ncore-card").count(),15,"Academy shows all 15 current service routes");
   await page.locator("#nc-route-role").selectOption("student");
   const studentCount=await page.locator("#nc-route-grid .ncore-card").count();assert.ok(studentCount>=4&&studentCount<15,"Student filter works");
   await page.locator("#nc-route-query").fill("Skill Passport");
   assert.equal(await page.locator("#nc-route-grid .ncore-card").count(),1,"Search matches English service title in RTL page");
   await page.locator("#nc-route-query").fill("");
   await page.locator("#nc-build-route").click();
   assert.equal(await page.locator("#nc-route-plan li").count(),3,"Three-step personal route produced");
   const mobileBounds=await page.locator("#academic-pathfinder").evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,viewport:innerWidth}});
   assert.ok(mobileBounds.left>=-3&&mobileBounds.right<=mobileBounds.viewport+3,"Academic module fits viewport at "+width);
   await page.goto(base+"/global-lectures.html",{waitUntil:"domcontentloaded"});
   await page.locator("#nc-lecture-preview li").first().waitFor();
   await page.locator("#nc-lecture-track").selectOption("research");
   await page.locator("#nc-lecture-goal").fill("Compare reliable research sources");
   await page.locator('#nc-lecture-form button[type="submit"]').click();
   assert.equal(await page.locator("#nc-lecture-preview li").count(),3,"Lecture preparation has before/during/after steps");
   assert.match(await page.locator("#nc-lecture-preview").innerText(),/Compare reliable research sources/);
   const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#nc-download-lecture").click()]);
   assert.match(download.suggestedFilename(),/NABD-lecture-preparation\.txt/);
   await page.locator("#lang").click();
   assert.equal(await page.locator("html").getAttribute("lang"),"en","Lecture module preserves English language toggle");
   assert.match(await page.locator("#nc-lecture-preview").innerText(),/Research methods/);
   await page.goto(base+"/nabd-medical-knowledge.html",{waitUntil:"domcontentloaded"});
   await page.locator("#nc-quiz-answers .ncore-answer").first().waitFor();
   assert.equal(await page.locator("#nc-quiz-answers .ncore-answer").count(),3);
   await page.locator("#nc-quiz-answers .ncore-answer").first().click();
   assert.equal(await page.locator("#nc-quiz-answers .ncore-answer.correct").count(),1,"Answered quiz shows right answer");
   await page.locator("#nc-quiz-next").click();
   assert.match(await page.locator("#nc-quiz-progress").innerText(),/2/);
   await page.locator('#nc-quiz-filters [data-area="research"]').click();
   assert.match(await page.locator("#nc-quiz-question").innerText(),/PICO/);
   await page.goto(base+"/nabd-campus.html",{waitUntil:"domcontentloaded"});
   await page.locator("#nc-route-grid .ncore-card").first().waitFor();
   assert.equal(await page.locator("#nc-route-grid .ncore-card").count(),15,"Digital campus has all 15 connected routes");
   await context.close();
  }
  console.log("Academic Core browser acceptance passed: pathways, filtering, route planning, lecture export, bilingual switching, knowledge quiz and campus on 390px/1440px.");
 }finally{if(browser)await browser.close();server.kill()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
