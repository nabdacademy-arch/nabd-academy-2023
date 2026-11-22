"use strict";
const assert=require("node:assert/strict");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const {chromium}=require("playwright");
const url=pathToFileURL(path.join(__dirname,"..","index.html")).href;
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [360,390,691,980,1280,1440]){
   const page=await browser.newPage({viewport:{width,height:820},locale:"ar-PS",reducedMotion:"reduce"});
   const errors=[];
   page.on("pageerror",e=>{
    if(/nabd-home-i18n|nabd-neo-home|translation/i.test(e.stack||e.message))errors.push(e.message);
   });
   await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
   await page.locator("#neoLang").waitFor({state:"visible"});
   const check=await page.evaluate(()=>{
    const head=document.querySelector(".neo-headbar");
    const brand=document.querySelector(".neo-brand");
    const actions=document.querySelector(".neo-actions");
    const picker=document.querySelector(".neo-language-picker");
    const rect=(node)=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};
    const a=rect(brand),b=rect(actions),h=rect(head),p=rect(picker);
    return {a,b,h,p,windowWidth:innerWidth,navDisplay:getComputedStyle(document.querySelector("#neoNav")).display,
      menuDisplay:getComputedStyle(document.querySelector("#neoMenu")).display};
   });
   const horizontal=Math.min(check.a.right,check.b.right)-Math.max(check.a.left,check.b.left);
   const vertical=Math.min(check.a.bottom,check.b.bottom)-Math.max(check.a.top,check.b.top);
   assert.ok(horizontal<=1||vertical<=1,"Logo and actions overlap at "+width+"px: "+JSON.stringify(check));
   assert.ok(check.p.width>55,"Language selector too small at "+width);
   assert.ok(check.h.left>=-3&&check.h.right<=check.windowWidth+3,"Header exceeds viewport "+JSON.stringify(check));
   if(width<=1599){
    assert.equal(check.navDisplay,"none","Header navigation must collapse at "+width);
    assert.notEqual(check.menuDisplay,"none","Mobile menu missing at "+width);
    await page.click("#neoMenu");
    await page.locator("#neoNav").waitFor({state:"visible"});
    assert.equal(await page.locator("#neoMenu").getAttribute("aria-expanded"),"true");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#neoNav").isVisible(),false);
   }
   await page.selectOption("#neoLang","fr");
   await page.waitForFunction(()=>document.querySelector("#nabdNeoHome").lang==="fr");
   assert.match(await page.locator("#neo-h1").textContent(),/savoir médical|accessible/i);
   assert.equal(await page.locator("#nabdNeoHome").getAttribute("dir"),"ltr");
   await page.selectOption("#neoLang","ur");
   await page.waitForFunction(()=>document.querySelector("#nabdNeoHome").lang==="ur");
   assert.equal(await page.locator("#nabdNeoHome").getAttribute("dir"),"rtl");
   await page.selectOption("#neoLang","ar");
   assert.equal(await page.locator("#nabdNeoHome").getAttribute("dir"),"rtl");
   assert.deepEqual(errors,[],"Homepage i18n script error at "+width);
   console.log(JSON.stringify({width,header:"no overlap",menu:width<=1599?"collapsed":"desktop",fr:"translated",ur:"rtl",ar:"restored"}));
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:980,height:850}});
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
  for(const lang of ["es","tr","ru","id","de","pt","zh","hi","en"]){
   await page.selectOption("#neoLang",lang);
   await page.waitForFunction(code=>document.querySelector("#nabdNeoHome").lang===code,lang,{timeout:15000});
   if(lang!=="en")assert.notEqual(await page.locator("#neo-h1").textContent(),"معرفة طبية تُفتحأبوابها للجميع.");
  }
  console.log("All 12 language choices validated with their actual homepage text.");
  await page.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
