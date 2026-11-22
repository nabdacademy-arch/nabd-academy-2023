"use strict";
const assert=require("node:assert/strict");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const url=page=>pathToFileURL(path.join(root,page)).href;
const results=[];
async function main(){
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport,locale:"ar-PS"});
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto(url("academy-directory.html"),{waitUntil:"domcontentloaded"});
   await page.locator("#directoryGrid a").first().waitFor({state:"visible"});
   assert.equal(await page.locator("#directoryGrid a:visible").count(),8,"Essential view should be short");
   assert.equal(await page.locator('a[href$="/admin.html"]:visible').count(),0,"Staff tools must not clutter essential list");
   await page.fill("#directorySearch","research");
   assert.ok(await page.locator("#directoryGrid a:visible").count()>=3,"Global search must span groups");
   await page.fill("#directorySearch","not-a-matching-academy-service");
   assert.equal(await page.locator("#directoryEmpty").isVisible(),true);
   await page.click('[data-filter="management"]');
   assert.ok(await page.locator("#directoryGrid a:visible").count()>=5);
   assert.equal(await page.locator(".directory-item-restricted:visible").count()>=5,true);
   await page.click("#directoryLang");
   assert.equal(await page.locator("html").getAttribute("lang"),"en");
   assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
   assert.match(await page.locator("#directoryHeading").textContent(),/Management|Operations/);
   await page.click('[data-filter="all"]');
   assert.equal(await page.locator("#directoryGrid a:visible").count(),39);
   const width=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(width.scroll<=width.client+2,"Directory must not overflow: "+JSON.stringify(width));
   assert.deepEqual(errors,[],"Directory scripts must not crash");
   results.push({page:"academy-directory.html",viewport,cards:39,errors});
   await page.close();
  }
  for(const pagePath of ["academy.html","scholarships.html","portal.html","atlas/index.html","admin.html"]){
   const page=await browser.newPage({viewport:{width:390,height:844}});
   await page.goto(url(pagePath),{waitUntil:"domcontentloaded"});
   const launcher=page.locator("#nabdInstitutionalLauncher");
   await launcher.waitFor({state:"visible",timeout:12000});
   assert.equal(await launcher.getAttribute("aria-expanded"),"false");
   await launcher.click();
   await page.locator("#nabdInstitutionalPanel").waitFor({state:"visible"});
   assert.equal(await launcher.getAttribute("aria-expanded"),"true");
   await page.fill(".nabd-institutional-search","Motivation");
   assert.equal(await page.locator('.nabd-institutional-link[href$="/motivation-studio.html"]').isVisible(),true);
   assert.equal(await page.locator('.nabd-institutional-link[href$="/admin.html"]').isVisible(),false);
   await page.keyboard.press("Escape");
   assert.equal(await page.locator("#nabdInstitutionalPanel").isVisible(),false);
   assert.equal(await launcher.getAttribute("aria-expanded"),"false");
   results.push({page:pagePath,navigation:"passed"});
   await page.close();
  }
 }finally{await browser.close();}
 console.log(JSON.stringify(results));
}
main().catch(e=>{console.error(e);process.exitCode=1});
