"use strict";
const assert=require("node:assert/strict"),{spawn}=require("node:child_process"),{resolve}=require("node:path"),{chromium}=require("playwright");
async function test(){
 const port=8897,base="http://127.0.0.1:"+port;
 const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:resolve(__dirname,".."),stdio:"ignore"});
 let browser;
 try{
  let ok=false;for(let n=0;n<48;n++){try{ok=(await fetch(base+"/nabd-global-research.html")).ok;if(ok)break}catch(e){}await new Promise(r=>setTimeout(r,180))}
  assert.ok(ok,"Local test server started");
  browser=await chromium.launch({headless:true});
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:870},reducedMotion:"reduce"});
   await context.route(/^https:\/\//,r=>r.abort());
   let page=await context.newPage();
   await page.goto(base+"/nabd-global-research.html",{waitUntil:"domcontentloaded"});
   await page.locator("#ncn-open").waitFor({state:"visible"});
   await page.locator("#ncn-open").click();
   await page.locator('#ncn-dialog').waitFor({state:"visible"});
   assert.equal(await page.locator('#ncn-dialog').getAttribute("aria-modal"),"true","Accessible modal");
   await page.locator("#ncn-search").fill("بوابة الطالب");
   await page.locator('a[data-route="portal"]').waitFor();
   assert.equal(await page.locator(".ncn-link").count(),1,"Search narrows routes");
   const href=await page.locator('a[data-route="portal"]').getAttribute("href");
   assert.ok(href.endsWith("/portal.html"),"Root route resolves");
   await page.keyboard.press("Escape");
   assert.equal(await page.locator("#ncn-overlay").isHidden(),true,"Escape closes navigator");
   await page.evaluate(()=>document.documentElement.lang="en");
   await page.locator("#ncn-open").click();
   await page.locator("#ncn-search").fill("Research starter");
   assert.ok(await page.locator('a[data-route="starter"]').isVisible(),"English search works");
   await page.keyboard.press("Escape");
   const over=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(over<=5,"Cross-campus global nav does not overflow "+width+"px");
   await page.goto(base+"/atlas/index.html",{waitUntil:"domcontentloaded"});
   await page.locator("#ncn-open").waitFor({state:"visible"});
   await page.locator("#ncn-open").click();
   const nestedHref=await page.locator('a[data-route="portal"]').getAttribute("href");
   assert.ok(nestedHref.endsWith("/portal.html")&&!nestedHref.includes("/atlas/portal.html"),"Nested ATLAS routing is correct");
   await page.goto(base+"/academy.html",{waitUntil:"domcontentloaded"});
   await page.waitForFunction(()=>typeof window.NABDOpenSearch==="function");
   await page.evaluate(()=>window.NABDOpenSearch());
   assert.ok(await page.locator(".nfs-command").isVisible(),"Existing shared search remains operational");
   assert.ok(await page.locator('.nfs-command-results a[href="university-os.html"]').count()===1,"Shared search knows University OS");
   await context.close();
  }
  console.log("NABD Cross-Campus browser: search, keyboard, bilingual navigation and nested routes PASS.");
 }finally{if(browser)await browser.close();server.kill()}
}
test().catch(e=>{console.error(e);process.exitCode=1});