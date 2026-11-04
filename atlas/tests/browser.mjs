import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {resolve,extname,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";
import {clinicalCases} from "../clinical-cases.mjs";

const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const server=createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    const path=resolve(root,"."+ (pathname==="/"?"/index.html":pathname));
    if(path!==root && !path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    const body=readFileSync(path);
    res.writeHead(200,{"Content-Type":types[extname(path)]||"application/octet-stream","Cache-Control":"no-cache"});
    res.end(body);
  }catch{res.writeHead(404);res.end();}
});
await new Promise((ok,fail)=>server.once("error",fail).listen(0,"127.0.0.1",ok));
let browser;
try{
  const url="http://127.0.0.1:"+server.address().port;
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:"allow"});
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",e=>pageErrors.push(e.message));
  const initialResponse=await page.goto(url+"/index.html");
  assert.equal(initialResponse?.status(),200,"The browser test server must serve index.html");
  assert.match(await page.title(),/NABD ATLAS/);
  assert.equal(await page.locator('[data-view-button="case"]').count(),1);
  await page.locator('[data-view-button="case"]').click();
  for(let i=0;i<3;i++){
    assert.equal(await page.locator("#answers button").count(),3);
    await page.locator("#answers button").first().click();
    await page.locator("#nextBtn").click();
  }
  assert.equal(await page.locator(".report-score").textContent(),"6 / 6");
  await page.locator("#langBtn").click();
  assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
  assert.equal(await page.locator("#view-case .inner-title").textContent(),"Virtual emergency department");
  await page.locator('a[href="./heart-lab.html"]').first().click();
  assert.match(await page.title(),/Heart Lab/);
  assert.equal(await page.locator("#chambers button").count(),4);
  await page.locator("#chambers button").nth(3).click();
  assert.match(await page.locator("#chamberInfo").textContent(),/الأبهر/);
  await page.locator("#answers button").nth(3).click();
  assert.match(await page.locator("#feedback").textContent(),/صحيح/);
  await page.locator("#switchLanguage").click();
  assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
  assert.match(await page.locator("#feedback").textContent(),/Correct/);

  // Virtual hospital multi-case flow, resume, replay, local history and report.
  await page.goto(url+"/clinical-hub.html");
  assert.match(await page.title(),/Virtual Hospital/);
  assert.equal(await page.locator("#caseList button").count(),22);
  assert.equal(await page.locator("#totalCases").textContent(),"22");
  await page.locator("#departmentFilter").selectOption("pediatrics");
  assert.equal(await page.locator("#caseList button").count(),2);
  await page.locator("#levelFilter").selectOption("advanced");
  assert.equal(await page.locator("#caseList button").count(),1);
  await page.locator("#searchCases").fill("infant");
  assert.equal(await page.locator("#caseList button").count(),1);
  await page.locator("#searchCases").fill("not-a-real-case-xyz");
  assert.equal(await page.locator("#caseList button").count(),0);
  await page.locator("#searchCases").fill("");
  await page.locator("#departmentFilter").selectOption("all");
  await page.locator("#levelFilter").selectOption("all");
  assert.equal(await page.locator("#caseList button").count(),22);
  await page.locator("#caseList button").nth(1).click();
  assert.equal(await page.locator("#optionList button").count(),3);
  await page.locator("#optionList button").first().click();
  await page.locator("#nextStep").click();
  await page.reload();
  assert.match(await page.locator("#stepCounter").textContent(),/2/);
  for(let i=1;i<3;i++){
    await page.locator("#optionList button").first().click();
    await page.locator("#nextStep").click();
  }
  assert.equal(await page.locator("#finalScore").textContent(),"6 / 6");
  assert.equal(await page.locator("#totalAttempts").textContent(),"1");
  await page.locator("#decisionHistory button").first().click();
  await page.locator("#optionList button").nth(1).click();
  await page.locator("#nextStep").click();
  assert.equal(await page.locator("#finalScore").textContent(),"4 / 6");
  assert.match(await page.locator("#compareMessage").textContent(),/6/);
  assert.equal(await page.locator("#totalAttempts").textContent(),"2");
  await page.locator("#languageToggle").click();
  assert.equal(await page.locator("html").getAttribute("dir"),"rtl");
  assert.match(await page.locator("#caseTitle").textContent(),/عصبية/);
  await page.locator("#languageToggle").click();
  assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
  // Four-stage nuanced scenario, with a competency report.
  await page.locator("#caseList button").nth(2).click();
  const sample=clinicalCases[2];
  assert.equal(sample.steps.length,4);
  for(const stage of sample.steps){
    const bestIndex=stage.options.findIndex(o=>o.points===2);
    await page.locator("#optionList button").nth(bestIndex).click();
    await page.locator("#nextStep").click();
  }
  assert.equal(await page.locator("#finalScore").textContent(),"8 / 8");
  assert.equal(await page.locator("#skillReport .skill-row").count(),4);
  assert.equal(await page.locator("#totalAttempts").textContent(),"3");
  // Zero-dependency interactive 3D campus, wing entry and linked clinical catalog.
  await page.goto(url+"/hospital-3d.html");
  await page.waitForFunction(()=>document.querySelector("#hospitalCanvas")?.width>280);
  assert.equal(await page.locator("#wingList button").count(),13);
  await page.locator("#wingList button").nth(7).click();
  assert.match(await page.locator("#selectedTitle").textContent(),/Pediatrics|الأطفال/);
  assert.match(await page.locator("#openCases").getAttribute("href"),/department=pediatrics/);
  await page.locator("#openWing").click();
  assert.equal(await page.locator("#viewStatus").textContent(),"WING");
  await page.locator("#openWing").click();
  assert.equal(await page.locator("#viewStatus").textContent(),"CAMPUS");
  await page.locator("#toggleLanguage").click();
  assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
  await page.locator("#openCases").click();
  assert.equal(await page.locator("#departmentFilter").inputValue(),"pediatrics");
  assert.equal(await page.locator("#caseList button").count(),2);
  await page.goto(url+"/index.html");
  await page.locator('[data-view-button="offline"]').click();
  await page.locator("#downloadBtn").click();
  await page.waitForFunction(()=>document.querySelector("#cacheBadge")?.textContent?.includes("Offline pack ready"),{timeout:30000});
  await context.setOffline(true);
  await page.reload();
  assert.match(await page.title(),/NABD ATLAS/);
  await page.locator('[data-view-button="case"]').click();
  assert.equal(await page.locator("#answers button").count(),3);
  await page.goto(url+"/heart-lab.html");
  assert.equal(await page.locator("#chambers button").count(),4);
  await page.goto(url+"/clinical-hub.html");
  assert.equal(await page.locator("#caseList button").count(),22);
  await page.goto(url+"/hospital-3d.html");
  assert.equal(await page.locator("#wingList button").count(),13);
  assert.equal(await page.locator("#totalAttempts").textContent(),"3");
  assert.deepEqual(pageErrors,[]);
  console.log("NABD ATLAS mobile browser, bilingual, simulation, anatomy and offline checks passed.");
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}