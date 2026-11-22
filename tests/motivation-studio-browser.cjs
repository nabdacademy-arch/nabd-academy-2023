"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const {chromium}=require("playwright");
const url=pathToFileURL(path.resolve(__dirname,"..","motivation-studio.html")).href;

async function main(){
 const browser=await chromium.launch({headless:true});
 const results=[];
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport,locale:"ar-PS"});
   // Local file:// test cannot pass Cloudflare's approved-hostname check.
   // Mock only the external challenge widget, never the page's real own UI code.
   // Production CAPTCHA verification is tested server-side by the endpoint's guards.
   await page.route("https://challenges.cloudflare.com/**",route=>
     route.fulfill({status:200,contentType:"application/javascript",
       body:"window.turnstile={render:()=>123,getResponse:()=>'',reset:()=>{}};"}));
   const errors=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.goto(url,{waitUntil:"domcontentloaded"});
   await page.waitForSelector("#letterForm");
   assert.equal(await page.locator('[data-step="1"]').isVisible(),true);
   await page.click('[data-next="2"]');
   assert.equal(await page.locator('[data-step="1"]').isVisible(),true,"required opportunity should block next");
   await page.fill("#opportunity","Computer Science Scholarship 2027");
   await page.click('[data-kind="university"]');
   assert.equal(await page.locator("#kindInput").inputValue(),"university");
   await page.click('[data-next="2"]');
   assert.equal(await page.locator('[data-step="2"]').isVisible(),true);
   await page.fill("#about","I am a student who independently developed software learning tools and organized several volunteer education projects.");
   await page.fill("#achievements","Designed an open educational platform, with a team of volunteer tutors.");
   await page.fill("#future","Help make technical education accessible to people with limited internet.");
   await page.click('[data-next="3"]');
   assert.equal(await page.locator('[data-step="3"]').isVisible(),true);
   await page.fill("#why","This specific opportunity would help me study software engineering and create useful tools for learners.");
   await page.fill("#fit","My previous software projects align with its community impact goals.");
   assert.equal(await page.locator("#qualityValue").textContent(),"100%");
   await page.click("#uiSwitch");
   assert.equal(await page.locator("html").getAttribute("lang"),"en");
   assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
   await page.click("#uiSwitch");
   assert.equal(await page.locator("html").getAttribute("lang"),"ar");
   const widths=await page.evaluate(()=>({screen:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(widths.scroll<=widths.screen+2,"Horizontal overflow: "+JSON.stringify(widths));
   assert.deepEqual(errors,[],"Uncaught browser exceptions");
   results.push({viewport,widths,checks:"passed"});
   await page.close();
  }
 }finally{await browser.close();}
 fs.mkdirSync("audit",{recursive:true});
 fs.writeFileSync("audit/motivation-studio-browser.json",JSON.stringify(results,null,2));
 console.log(JSON.stringify(results));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
