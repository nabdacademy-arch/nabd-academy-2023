"use strict";
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const path=require("node:path");
(async()=>{
 const root=path.resolve(__dirname,".."),port=8775;
 const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:root,stdio:"ignore"});
 let browser;
 try{
  let ready=false;for(let n=0;n<40;n++){try{const r=await fetch("http://127.0.0.1:"+port+"/infinity/");if(r.ok){ready=true;break}}catch(e){}await new Promise(r=>setTimeout(r,250))}
  assert.ok(ready,"Local Infinity test server reachable");
  browser=await chromium.launch({headless:true});
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:880},reducedMotion:"reduce"});
   // The local teaching UI must work without any third-party network requests.
   await context.route(/^https:\/\//,route=>route.abort());
   const page=await context.newPage(),errors=[],remote=[];
   page.on("pageerror",error=>errors.push(error.message));
   page.on("request",request=>{if(/^https:\/\//.test(request.url()))remote.push(request.url())});
   await page.goto("http://127.0.0.1:"+port+"/infinity/",{waitUntil:"domcontentloaded"});
   await page.locator(".model-btn").first().waitFor();
   assert.equal(await page.locator(".model-btn").count(),6,"Six real GLB destinations");
   assert.equal(await page.locator(".mission-btn").count(),5,"Five training missions");
   assert.equal(await page.locator(".building").count(),6,"Six campus destinations");
   assert.equal(await page.locator("html").getAttribute("dir"),"rtl");
   assert.equal(remote.length,0,"No third-party fetch before user opts in to 3D");
   await page.locator(".model-btn").nth(2).click();
   assert.match(await page.locator("#modelTitle").innerText(),/الرئتان/);
   assert.match(await page.locator("#modelPoster").getAttribute("src"),/lungs-3d.svg/);
   assert.equal(await page.locator("#modelsCount").innerText(),"1","Model exploration counted");
   await page.locator("#modelMission").click();
   assert.match(await page.locator("#missionCode").innerText(),/MISSION \u002f 01/);
   for(let i=0;i<3;i++){
    await page.locator(".choice").nth(i===1?1:0).click();
    assert.match(await page.locator(".mission-feedback").innerText(),/إجابة|راجع/);
    await page.locator(".mission-console .button.primary").click();
   }
   assert.match(await page.locator(".mission-score").innerText(),/2 \/ 3/);
   assert.equal(await page.locator("#missionsCount").innerText(),"1","Completed mission counted");
   await page.locator("#mentorInput").fill("كيف يعمل القلب؟");
   await page.locator('#mentorForm button[type="submit"]').click();
   assert.match(await page.locator("#chatLog").innerText(),/أربع حجرات/);
   assert.equal(await page.locator("#mentorCount").innerText(),"1","Curated mentor topic counted");
   assert.equal(remote.length,0,"No remote tutor telemetry");
   await page.locator("#saveProgress").check();
   await page.reload({waitUntil:"domcontentloaded"});
   assert.equal(await page.locator("#modelsCount").innerText(),"1","Local progress persists with consent");
   assert.equal(await page.locator("#missionsCount").innerText(),"1");
   await page.locator("#langButton").click();
   assert.equal(await page.locator("html").getAttribute("dir"),"ltr","English direction");
   assert.match(await page.locator("#anatomyTitle").innerText(),/Anatomy/);
   await page.locator("#clearProgress").click();
   assert.equal(await page.locator("#modelsCount").innerText(),"0","Clear models");
   assert.equal(await page.locator("#missionsCount").innerText(),"0","Clear missions");
   assert.equal(await page.evaluate(()=>localStorage.getItem("nabd-infinity-progress-v1")),null,"No saved data after clear");
   const geometry=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(geometry.scrollWidth<=geometry.viewport+8,"No horizontal overflow: "+width+" "+JSON.stringify(geometry));
   assert.deepEqual(errors,[],"No runtime page errors at "+width);
   if(width===390){
    const worker=await page.evaluate(()=>Promise.race([navigator.serviceWorker.ready.then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),9000))]));
    assert.ok(worker,"Offline service worker activates on local secure origin");
    await context.setOffline(true);
    await page.reload({waitUntil:"domcontentloaded"});
    assert.equal(await page.locator(".model-btn").count(),6,"Offline local content remains visible");
    assert.equal(await page.locator("#chatLog .chat-bubble").count(),1,"Offline mentor welcome works");
    await context.setOffline(false);
   }
   await context.close();
  }
  console.log("NABD INFINITY browser acceptance passed: mobile, desktop, AR/EN, missions, mentor, opt-in privacy, offline.");
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
