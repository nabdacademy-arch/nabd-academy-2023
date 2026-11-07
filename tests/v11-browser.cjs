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
      assert.equal(await page.locator(".deck-system").count(),8,"Eight reference dashboard systems");
      assert.equal(await page.locator(".deck-tile").count(),5,"Five integrated bottom shortcuts");
      assert.ok(await page.locator("#deckOrganImage").evaluate(async i=>{try{await i.decode();return i.naturalWidth>=700}catch(e){return false}}),"Main organ asset is sharp vector artwork");

      // High-definition anatomy gallery: eight images, bilingual labels, zoom and contextual learning.
      await page.locator(".a3d-item").first().waitFor();
      assert.equal(await page.locator(".a3d-item").count(),8,"Eight anatomy illustrations");
      assert.ok(await page.locator("#a3dImage").evaluate(async image=>{try{await image.decode();return image.naturalWidth>=700&&image.naturalHeight>=700}catch(e){return false}}),"Vector anatomy image must decode sharply");
      assert.equal(await page.locator("#a3dTrue3D").isVisible(),true,"Real heart mesh is an explicit opt-in control");
      assert.equal(await page.locator("#a3dAttribution").isVisible(),false,"3D model attribution is shown only with the 3D asset");
      await page.locator('.a3d-item[data-organ="brain"]').click();
      assert.equal(await page.locator("#a3dTrue3D").isVisible(),false,"Real heart mesh is not advertised for other organs");
      assert.ok((await page.locator("#a3dImage").getAttribute("src")).endsWith("brain-3d.svg"),"Brain visual selected");
      assert.match(await page.locator("#a3dName").innerText(),/الدماغ/);
      await page.locator("#a3dZoom").evaluate(input=>{input.value="180";input.dispatchEvent(new Event("input",{bubbles:true}))});
      assert.equal(await page.locator("#a3dZoomText").innerText(),"180%");
      assert.match(await page.locator("#a3dImage").getAttribute("style"),/scale\(1\.8\)/);
      await page.locator("#a3dReset").click();
      assert.equal(await page.locator("#a3dZoomText").innerText(),"100%");
      if(width===390){
        await page.locator('.a3d-item[data-organ="heart"]').click();
        await page.locator("#a3dTrue3D").click();
        await page.waitForFunction(()=>{const text=document.querySelector("#a3dModelStatus")?.textContent||"";return text.includes("لم يتوفر")||text.includes("تعذّر تحميل")},{timeout:15000}).catch(()=>{});
        assert.equal(await page.locator('#a3dViewport[data-mode="mesh"]').count(),0,"External CDN failure should preserve SVG fallback");
        assert.ok(await page.locator("#a3dImage").isVisible(),"Fallback remains visible");
        await page.locator('.a3d-item[data-organ="brain"]').click();
      }
      await page.locator("#a3dLessonLink").click();
      assert.match(await page.locator("#systemHeading").innerText(),/العصبي/);

      assert.equal(await page.locator("html").getAttribute("dir"),"rtl");
      await page.locator('.deck-system[data-deck-system="respiratory"]').click();
      assert.match(await page.locator("#deckTitle").innerText(),/التنفسي/,"Dashboard system change");
      await page.locator("#deckZoomIn").click();
      assert.equal(await page.locator("#deckZoomValue").innerText(),"115%","Reference dashboard zoom works");
      await page.locator('[data-layer="vessels"]').check();
      assert.equal(await page.locator("#deckVesselLayer").isVisible(),true,"Vessel overlay toggles visibly");
      await page.locator("#deckReset").click();
      assert.equal(await page.locator("#deckZoomValue").innerText(),"100%","Reset restores zoom");
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
      assert.match(await page.locator("#heroTitle").textContent(),/[Uu]niverse/);
      assert.match(await page.locator("#deckTitle").innerText(),/Respiratory/,"Dashboard translates current system");
      assert.match(await page.locator("#a3dName").innerText(),/Heart/,"Anatomy captions respond to language change");
      await page.locator("#clearProgress").click();
      assert.equal(await page.locator("#quizStat").innerText(),"0","Clear deletes mastery");
      assert.equal(await page.locator("#missionStat").innerText(),"0","Clear deletes missions");
      assert.equal(await page.evaluate(()=>localStorage.getItem("nabd-v11-progress-v1")),null,"No saved data after clearing");
      const geometry=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,offenders:[...document.querySelectorAll("body *")].map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,cls:typeof e.className==="string"?e.className.slice(0,70):"",left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}}).filter(x=>x.left < -9 || x.right > innerWidth+9).slice(0,18)}));
      assert.ok(geometry.scrollWidth<=geometry.viewport+8,"No horizontal overflow at "+width+" "+JSON.stringify(geometry));
      assert.deepEqual(errors,[],"No page errors at "+width);
      if(width===390){
        const swState=await page.evaluate(async()=>{
          if(!("serviceWorker" in navigator))return {ready:false,reason:"unsupported"};
          const ready=await Promise.race([
            navigator.serviceWorker.ready.then(r=>({ready:true,scope:r.scope})).catch(e=>({ready:false,reason:String(e)})),
            new Promise(resolve=>setTimeout(()=>resolve({ready:false,reason:"SW readiness timed out after 8 seconds"}),8000))
          ]);
          if(!ready.ready){const registrations=await navigator.serviceWorker.getRegistrations();ready.registrations=registrations.map(r=>({scope:r.scope,installing:r.installing?.state,waiting:r.waiting?.state,active:r.active?.state}));}
          return ready;
        });
        assert.ok(swState.ready,"V11 service worker must activate: "+JSON.stringify(swState));
        await context.setOffline(true);
        await page.reload({waitUntil:"domcontentloaded"});
        assert.equal(await page.locator(".system-option").count(),8,"V11 shell available offline after installation");
        assert.ok(await page.locator("#a3dImage").evaluate(async image=>{try{await image.decode();return image.naturalWidth>=700}catch(e){return false}}),"Anatomy illustration is available offline");
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
