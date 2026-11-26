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
   assert.equal(await page.locator("#directoryGrid a:visible").count(),40);
   const width=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(width.scroll<=width.client+2,"Directory must not overflow: "+JSON.stringify(width));
   assert.deepEqual(errors,[],"Directory scripts must not crash");
   results.push({page:"academy-directory.html",viewport,cards:40,errors});
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
   assert.equal(await page.locator(".nabd-institutional-link:visible").count(),8,"Only essential shortcuts should be visible by default");
   await page.locator(".nabd-institutional-mode").nth(1).click();
   assert.equal(await page.locator(".nabd-institutional-link:visible").count(),40,"All services reveals the full catalog");
   await page.locator(".nabd-institutional-mode").nth(0).click();
   assert.equal(await page.locator(".nabd-institutional-link:visible").count(),8,"Essentials returns to the compact view");
   await page.fill(".nabd-institutional-search","Motivation");
   assert.equal(await page.locator('.nabd-institutional-link[href$="/motivation-studio.html"]').isVisible(),true);
   assert.equal(await page.locator('.nabd-institutional-link[href$="/admin.html"]').isVisible(),false);
   await page.keyboard.press("Escape");
   assert.equal(await page.locator("#nabdInstitutionalPanel").isVisible(),false);
   assert.equal(await launcher.getAttribute("aria-expanded"),"false");
   results.push({page:pagePath,navigation:"passed"});
   await page.close();
  }
  // The section finder operates on existing tab buttons without needing credentials.
  const adminPage=await browser.newPage({viewport:{width:390,height:844}});
  await adminPage.goto(url("admin.html"),{waitUntil:"domcontentloaded"});
  const shownTabs=()=>adminPage.locator("#app .tabs [data-tab]:not([hidden])").evaluateAll(nodes=>nodes.map(node=>node.dataset.tab).sort());
  assert.deepEqual(await shownTabs(),["consultations","enrollments","executiveTasks","hopeScholarship","os-admin-suite","overview","students"]);
  for(const term of ["Hope Scholarship","منحة نبض الأمل","no-such-scholarship-code"]){
   await adminPage.locator("#nabdAdminSearch").evaluate((input,term)=>{
    input.value=term;
    input.dispatchEvent(new Event("input",{bubbles:true}));
   },term);
   assert.deepEqual(await shownTabs(),term==="no-such-scholarship-code"?[]:["hopeScholarship"]);
  }
  const allCount=await adminPage.evaluate(()=>{
   const area=document.getElementById("nabdAdminCategory");
   area.value="all";area.dispatchEvent(new Event("change",{bubbles:true}));
   return [...document.querySelectorAll("#app .tabs [data-tab]")].filter(n=>!n.hidden).length;
  });
  assert.ok(allCount>=17,"Director must still access every original module");
  const searchCount=await adminPage.evaluate(()=>{
   const search=document.getElementById("nabdAdminSearch");
   search.value="شهادات";search.dispatchEvent(new Event("input",{bubbles:true}));
   return [...document.querySelectorAll("#app .tabs [data-tab]")].filter(n=>!n.hidden).length;
  });
  assert.ok(searchCount>=1&&searchCount<allCount,"Arabic module search must filter the full list");
  await adminPage.close();
  const studentPage=await browser.newPage({viewport:{width:390,height:844}});
  await studentPage.goto(url("portal.html"),{waitUntil:"domcontentloaded"});
  assert.equal(await studentPage.locator("details.portal-more-actions").count(),1);
  assert.equal(await studentPage.locator("details.portal-more-actions .portal-more-links a").count(),3);
  assert.equal(await studentPage.locator("#logoutButton").count(),1);
  await studentPage.close();
  const facultyPage=await browser.newPage({viewport:{width:390,height:844}});
  await facultyPage.goto(url("lecturers.html"),{waitUntil:"domcontentloaded"});
  assert.equal(await facultyPage.locator("#studio-workspace .nabd-faculty-shortcuts a").count(),2);
  await facultyPage.close();
 }finally{await browser.close();}
 console.log(JSON.stringify(results));
}
main().catch(e=>{console.error(e);process.exitCode=1});
