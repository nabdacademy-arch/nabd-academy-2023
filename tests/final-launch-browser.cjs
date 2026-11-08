"use strict";
const assert=require("node:assert/strict"),{resolve}=require("node:path"),{chromium}=require("playwright");
async function run(){
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [390,1350]){
   const page=await browser.newPage({viewport:{width,height:870},reducedMotion:"reduce"});
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.setContent('<!doctype html><html lang="en"><head></head><body><main id="app"><nav class="tabs"></nav><section id="launch-readiness" class="panel card"></section></main></body></html>');
   await page.addStyleTag({path:resolve(__dirname,"../assets/css/nabd-launch-gate.css")});
   await page.evaluate(()=>{
    window.NABD_ADMIN_REGISTER_MODULE=m=>{window.launchModule=m;return true};
    window.queryLog=[];window.testRole="student";window.testCounts={courses:5,enrollments:1,nabd_os_faculty_assignments:0,nabd_os_course_modules:0,nabd_os_exams:0,nabd_os_exam_questions:0,nabd_skill_catalog:8,nabd_global_sessions:0,nabd_os_research_proposals:0,nabd_os_certificate_requests:0,certificates:59};
    window.testDb={
     auth:{getUser:async()=>({data:{user:{id:"test-admin"}},error:null})},
     from(table){window.queryLog.push(table);return {
      select(column,opts){
       if(table==="profiles")return {eq:()=>({maybeSingle:async()=>({data:{role:window.testRole},error:null})})};
       if(window.testFailure===table)return Promise.resolve({count:null,error:{message:"permission denied"}});
       return Promise.resolve({count:window.testCounts[table]??0,error:null});
      }
     }}
    };
   });
   await page.addScriptTag({path:resolve(__dirname,"../assets/js/nabd-launch-gate.js")});
   assert.equal(await page.evaluate(()=>window.launchModule?.id),"launch-readiness","Admin extension module is registered");
   await page.evaluate(()=>window.launchModule.render(document.querySelector("#launch-readiness"),{db:window.testDb,user:{id:"test-admin"}}));
   await page.waitForFunction(()=>document.querySelector("#launch-readiness")?.textContent.includes("لم تؤكد قاعدة البيانات"));
   assert.ok(!await page.locator(".nlg-card").count(),"Unauthorized student cannot inspect counts");
   assert.deepEqual(await page.evaluate(()=>window.queryLog),["profiles"],"Non-admin did not query protected tables");
   await page.evaluate(()=>{window.testRole="admin";window.queryLog=[];window.launchModule.render(document.querySelector("#launch-readiness"),{db:window.testDb,user:{id:"test-admin"}})});
   await page.locator(".nlg-card").first().waitFor();
   assert.equal(await page.locator(".nlg-card").count(),6,"Six core curriculum gates");
   assert.equal(await page.locator(".nlg-state.blocked").count(),4,"No OS faculty, modules, exams or questions");
   assert.match(await page.locator(".nlg-status").innerText(),/2 \/ 6/,"Only two core areas have records");
   assert.match(await page.locator(".nlg-status").innerText(),/إيقاف الإطلاق/,"Never claim automatic launch");
   assert.equal(await page.locator(".nlg-human li").count(),8,"Eight manual approvals are kept pending");
   assert.equal(await page.locator(".nlg-extra").count(),5,"Real supporting tables are counted separately");
   assert.match(await page.locator("#launch-readiness").innerText(),/الشهادات/,"Legacy certificate counts are qualified");
   const timestamp=await page.evaluate(()=>window.testStatusTimestamp||document.querySelector(".nlg-meta")?.textContent);
   await page.getByRole("button",{name:/تغيير لغة التقرير/}).click();
   assert.match(await page.locator("#launch-readiness").innerText(),/Core operating prerequisites/);
   assert.equal(await page.locator("#launch-readiness").getAttribute("dir"),"ltr","English direction");
   assert.equal(await page.locator(".nlg-meta").innerText(),timestamp,"Switching language must not refresh verification time");
   await page.evaluate(()=>{window.testFailure="nabd_os_exam_questions";window.launchModule.render(document.querySelector("#launch-readiness"),{db:window.testDb,user:{id:"test-admin"}})});
   await page.locator(".nlg-state.unknown").waitFor();
   assert.equal(await page.locator(".nlg-state.unknown").count(),1,"Errors are unknown, not empty");
   assert.match(await page.locator(".nlg-status").innerText(),/2 \/ 6/,"Unknown stats do not count as present");
   assert.deepEqual(errors,[],"No browser errors");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=5,"No horizontal overflow at "+width+"px: "+overflow);
   await page.close();
  }
  console.log("NABD FINAL LAUNCH browser: non-admin denied; admin counts; unknown failures; Arabic+English; 390px+1350px PASS");
 }finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1});