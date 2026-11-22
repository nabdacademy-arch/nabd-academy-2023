"use strict";
const assert=require("node:assert/strict"),path=require("node:path"),fs=require("node:fs");
const {chromium}=require("playwright");
const URL="http://127.0.0.1:8123/index.html";
const langs=["fr","es","tr","ru","de","it","id","pt","zh","ur"];
async function main(){
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:360,height:780},{width:980,height:800}]){
   const page=await browser.newPage({viewport,locale:"ar-PS"});
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.route(/^https?:\/\/(?!127\.0\.0\.1:8123)/,route=>route.abort());
   await page.goto(URL,{waitUntil:"domcontentloaded"});
   await page.locator("#neoLang").click();
   assert.equal(await page.locator("#neoLangMenu:visible").count(),1,"12-language selector must open");
   for(const lang of langs){
    const original=JSON.parse(fs.readFileSync(path.join(__dirname,"..","assets/i18n/neo-home",lang+".json"),"utf8"));
    await page.locator('[data-home-lang="'+lang+'"]').click();
    await page.waitForFunction(code=>document.querySelector("#nabdNeoHome").lang===code,lang);
    assert.equal(await page.locator("#nabdNeoHome").getAttribute("dir"),lang==="ur"?"rtl":"ltr");
    assert.equal(await page.locator("#neo-h1 span").innerText(),original.translations[13],
     "Actual hero title did not translate correctly: "+lang);
    assert.equal(await page.locator("#neoLangLoading").isVisible(),false);
    await page.locator("#neoLang").click();
   }
   await page.locator('[data-home-lang="ar"]').click();
   assert.equal(await page.locator("#neo-h1 span").innerText(),"معرفة طبية تُفتح");
   const check=await page.evaluate(()=>{
    const header=document.querySelector(".neo-header");
    const nav=document.querySelector("#neoNav");
    const brand=document.querySelector(".neo-brand").getBoundingClientRect();
    const actions=document.querySelector(".neo-actions").getBoundingClientRect();
    return {navHidden:getComputedStyle(nav).display==="none",headerWidth:header.getBoundingClientRect().width,
      width:innerWidth,collide:brand.right>actions.left+1&&actions.right>brand.left+1};
   });
   assert.equal(check.navHidden,true,"Header must collapse links on narrow or desktop-site viewports");
   assert.ok(!check.collide,"Header overlaps: "+JSON.stringify(check));
   assert.deepEqual(errors,[],"Browser JavaScript errors");
   console.log("PASS language selection and header at "+viewport.width+"px");
   await page.close();
  }
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});