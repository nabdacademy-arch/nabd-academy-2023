import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {resolve,extname,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const root=fileURLToPath(new URL("../",import.meta.url));
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
  await page.goto(url+"/index.html");
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
  assert.deepEqual(pageErrors,[]);
  console.log("NABD ATLAS mobile browser, bilingual, simulation, anatomy and offline checks passed.");
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}