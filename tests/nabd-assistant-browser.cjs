"use strict";
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {resolve}=require("node:path");
const {chromium}=require("playwright");
const port=8894,base="http://127.0.0.1:"+port;
async function run(){
 const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:resolve(__dirname,".."),stdio:"ignore"});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<70;i++){try{ready=(await fetch(base+"/nabd-2050.html")).ok;if(ready)break}catch{}await new Promise(r=>setTimeout(r,190))}
  assert.ok(ready,"Fixture server available");
  browser=await chromium.launch({headless:true});
  for(const [path,width] of [["/nabd-2050.html",390],["/atlas/index.html",1440],["/index.html",430]]){
   const context=await browser.newContext({viewport:{width,height:850},reducedMotion:"reduce"});
   await context.route(/^https:\/\//,route=>route.abort());
   const page=await context.newPage();
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto(base+path,{waitUntil:"domcontentloaded"});
   await page.locator("#nb-chat-launch").waitFor({timeout:12000});
   assert.equal(await page.locator("#nabd-chat-root").count(),1,"Exactly one chatbot on "+path);
   const position=await page.locator("#nb-chat-launch").evaluate(el=>({position:getComputedStyle(el).position,right:getComputedStyle(el).right,rect:el.getBoundingClientRect().right,screen:innerWidth}));
   assert.equal(position.position,"fixed");
   assert.ok(Math.abs(position.screen-position.rect)<=22,"Right-hand launcher: "+JSON.stringify(position));
   await page.locator("#nb-chat-launch").click();
   await assertVisible(page,"#nb-chat-panel");
   assert.equal(await page.evaluate(()=>document.activeElement?.id==="nb-chat-input"),true,"Focus on composer upon opening");
   if((await page.locator("#nb-chat-panel").getAttribute("dir"))==="ltr")await page.locator("#nb-chat-lang").click();
   assert.equal(await page.locator("#nb-chat-panel").getAttribute("dir"),"rtl","Start Arabic guide checks in Arabic");
   await page.locator("#nb-chat-input").fill("شهادة");
   await page.locator("#nb-chat-send").click();
   await page.locator('.nb-chat-bot .nb-chat-link[href*="#verify"]').last().waitFor();
   assert.match(await page.locator("#nb-chat-stream").innerText(),/الشهادات/,"Verified local certificate answer");
   await page.locator("#nb-chat-input").fill("مستشفى");
   await page.locator("#nb-chat-send").click();
   await page.locator('.nb-chat-bot .nb-chat-link[href*="atlas/clinical-hub.html"]').last().waitFor();
   await page.locator("#nb-chat-input").fill("test.user@example.com");
   await page.locator("#nb-chat-send").click();
   assert.match(await page.locator("#nb-chat-stream").innerText(),/بيانات خاصة/,"Personal info blocked locally");
   await page.locator("#nb-chat-lang").click();
   assert.equal(await page.locator("#nb-chat-panel").getAttribute("dir"),"ltr");
   assert.match(await page.locator("#nb-chat-input").getAttribute("placeholder"),/Ask about/);
   await page.locator("#nb-chat-ai").click();
   await page.locator("#nb-chat-input").fill("How does the heart pump blood?");
   await page.locator("#nb-chat-send").click();
   await page.locator('.nb-chat-bot').last().waitFor();
   await page.waitForFunction(()=>document.querySelector("#nb-chat-stream")?.textContent?.includes("Sign in")||document.querySelector("#nb-chat-stream")?.textContent?.includes("configuration"),null,{timeout:12000});
   assert.equal(await page.locator("#nb-chat-support").getAttribute("href"),base+"/nabd-connect.html","Real authenticated support inbox");
   await page.keyboard.press("Escape");
   assert.equal(await page.locator("#nb-chat-panel").isVisible(),false,"Escape dismisses panel");
   assert.equal(await page.locator("#nb-chat-launch").getAttribute("aria-expanded"),"false");
   assert.equal(await page.evaluate(()=>document.body.style.overflow),"","Body scroll restored");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=5,"No horizontal overflow "+width+": "+overflow);
   // Existing homepage may contain third-party errors when external assets are intentionally blocked.
   const chatErrors=errors.filter(x=>/nabd-assistant/i.test(x));assert.deepEqual(chatErrors,[],"No assistant exceptions");
   await context.close();
  }
  const context=await browser.newContext({viewport:{width:1000,height:850}});
  await context.route(/^https:\/\//,route=>route.abort());
  const page=await context.newPage();
  await page.goto(base+"/nabd-2050.html",{waitUntil:"domcontentloaded"});
  await page.locator("#nb-chat-launch").click();
  if((await page.locator("#nb-chat-panel").getAttribute("dir"))==="ltr")await page.locator("#nb-chat-lang").click();
  await page.evaluate(()=>{
   window.NABD_CONFIG={supabaseUrl:"https://example.supabase.co",supabaseAnonKey:"pub_test",tutorFunction:"smart-processor"};
   window.__asked=[];
   window.nabdSupabase={auth:{getUser:async()=>({data:{user:{id:"learner-test"}},error:null})},functions:{invoke:async(slug,opts)=>{window.__asked.push({slug,body:opts.body});return {data:{answer:"The heart pumps blood through two circulatory circuits."},error:null}}}};
  });
  await page.locator("#nb-chat-ai").click();
  await page.locator("#nb-chat-input").fill("What are the two circulations?");
  await page.locator("#nb-chat-send").click();
  await page.waitForFunction(()=>document.querySelector("#nb-chat-stream")?.textContent?.includes("two circulatory circuits"));
  assert.deepEqual(await page.evaluate(()=>window.__asked),[{slug:"smart-processor",body:{question:"What are the two circulations?",language:"ar",image:null}}],"AI calls existing authorised endpoint with educational prompt");
  await page.locator("#nb-chat-clear").click();
  assert.equal(await page.locator(".nb-chat-user").count(),0,"Clear erases messages");
  assert.equal(await page.locator("#nb-chat-input").isEnabled(),true,"After clear input works");
  await context.close();
  console.log("NABD messenger browser: home+nested routes, right position, topics, privacy, RTL/LTR, support, AI auth and clear PASS");
 }finally{if(browser)await browser.close();server.kill()}
}
async function assertVisible(page,sel){assert.ok(await page.locator(sel).isVisible(),sel+" is visible")}
run().catch(e=>{console.error(e);process.exitCode=1});