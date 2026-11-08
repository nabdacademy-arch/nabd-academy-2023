"use strict";
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {resolve}=require("node:path");
const {chromium}=require("playwright");
const port=8895,base="http://127.0.0.1:"+port,delay=ms=>new Promise(r=>setTimeout(r,ms));
async function serve(){
 const p=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:resolve(__dirname,".."),stdio:"ignore"});
 let ready=false;for(let i=0;i<55;i++){try{ready=(await fetch(base+"/nabd-one.html")).ok;if(ready)break}catch{}await delay(150)}
 assert.ok(ready,"Static fixture available");return p
}
async function run(){
 const server=await serve();let browser;
 try{
  browser=await chromium.launch({headless:true});
  // Real course and session cards are sourced exclusively from the mock database, not fabricated markup.
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:850},reducedMotion:"reduce"});
   await context.route(/^https:\/\//,route=>route.abort());
   await context.addInitScript(()=>{
    window.__registered=[];
    window.supabase={createClient:()=>({
      auth:{getUser:async()=>({data:{user:{id:"learner-1"}},error:null})},
      from(table){return {
        select(){return this},eq(){return this},gte(){return this},order(){return this},
        limit(){return Promise.resolve({data:table==="courses"?[{id:"c1",code:"MED101",title_ar:"العلوم الطبية",title_en:"Medical science"}]:table==="nabd_global_sessions"?[{id:"s1",title_ar:"مبادئ القلب",title_en:"Heart basics",topic_ar:"الفسيولوجيا",topic_en:"Physiology",speaker_name:"Verified Test Speaker",speaker_affiliation:"Fictional browser fixture",scheduled_at:"2099-05-09T12:00:00Z",duration_minutes:45,status:"published"}]:[],error:null})},
        insert(row){window.__registered.push({table,row});return Promise.resolve({error:null})}
      }}
    })}
   });
   const page=await context.newPage();const errs=[];page.on("pageerror",e=>errs.push(e.message));
   await page.goto(base+"/nabd-one.html",{waitUntil:"domcontentloaded"});
   await page.locator("#one-course-list .one-card").first().waitFor();
   assert.equal(await page.locator("#one-course-list .one-card").count(),1);
   assert.equal(await page.locator("#one-live-list .one-card").count(),1);
   assert.match(await page.locator("#one-live-list").innerText(),/Verified Test Speaker/);
   await page.getByRole("button",{name:"تسجيل اهتمامي بالمحاضرة"}).click();
   await page.waitForFunction(()=>window.__registered?.length===1);
   const entry=await page.evaluate(()=>window.__registered[0]);
   assert.equal(entry.table,"nabd_global_session_signups");
   assert.equal(entry.row.student_id,"learner-1");
   await page.locator("#one-lang").click();
   assert.equal(await page.locator("html").getAttribute("lang"),"en");
   assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
   assert.match(await page.locator("#one-course-list").innerText(),/Medical science/);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=5,"No horizontal overflow at "+width+": "+overflow);
   assert.deepEqual(errs.filter(e=>/nabd-one-public/i.test(e)),[]);
   await context.close();
  }
  const ctx=await browser.newContext({viewport:{width:390,height:820},reducedMotion:"reduce"});
  await ctx.route(/^https:\/\//,route=>route.abort());
  await ctx.addInitScript(()=>{
   window.__tickets=[];window.__messages=[];
   window.supabase={createClient:()=>({
     auth:{getUser:async()=>({data:{user:{id:"learner-1"}},error:null})},
     from(table){const q={filter:null,
      select(){return this},eq(k,v){this.filter=[k,v];return this},order(){return this},
      limit(){return Promise.resolve({data:table==="nabd_support_tickets"?window.__tickets.filter(t=>t.student_id==="learner-1"):window.__messages.filter(m=>m.ticket_id===q.filter?.[1]),error:null})},
      insert(row){
       if(table==="nabd_support_tickets"){
        window.__tickets.push({...row,id:"ticket-browser-1",created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
        return {select(){return this},single(){return Promise.resolve({data:{id:"ticket-browser-1"},error:null})}}
       }
       window.__messages.push({...row,id:"message-"+(window.__messages.length+1),created_at:new Date().toISOString()});return Promise.resolve({error:null})
      }
     };return q}
   })}
  });
  const p=await ctx.newPage();const errors=[];p.on("pageerror",e=>errors.push(e.message));
  await p.goto(base+"/nabd-connect.html",{waitUntil:"domcontentloaded"});
  await p.locator("#nc-app").waitFor({state:"visible"});
  assert.equal(await p.locator(".nc-ticket").count(),0,"Clean test account has no existing messages");
  await p.locator("#nc-category").selectOption("academic");
  await p.locator("#nc-subject").fill("مساعدة في المقرر");
  await p.locator("#nc-body").fill("أحتاج توضيح موعد الوحدة التعليمية.");
  await p.locator("#nc-create-btn").click();
  await p.locator(".nc-ticket").first().waitFor();
  await p.waitForFunction(()=>window.__messages.length===1);
  assert.equal(await p.locator(".nc-msg").count(),1,"Initial message appears in real ticket thread");
  assert.equal(await p.locator("#nc-reply-form").isVisible(),true);
  await p.locator("#nc-reply").fill("هذه متابعة لاختبار واجهة المراسلات فقط.");
  await p.locator("#nc-reply-btn").click();
  await p.waitForFunction(()=>window.__messages.length===2);
  await p.locator("#nc-messages .nc-msg").nth(1).waitFor();
  assert.match(await p.locator("#nc-messages").innerText(),/هذه متابعة/);
  await p.locator("#one-lang").click();
  assert.equal(await p.locator("html").getAttribute("lang"),"en");
  assert.ok((await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=5,"Connect mobile no overflow");
  assert.deepEqual(errors.filter(e=>/nabd-connect/i.test(e)),[],"No support client exceptions");
  await ctx.close();
  // Admin module must deny a learner before making any support reads.
  const ac=await browser.newContext({viewport:{width:960,height:830}});
  const ap=await ac.newPage();
  await ap.setContent('<!doctype html><html lang="ar"><body><main id="app"><nav class="tabs"></nav><section id="root"></section></main></body></html>');
  await ap.evaluate(()=>{
   window.__role="student";window.__reads=[];
   window.__mockdb={
     auth:{getUser:async()=>({data:{user:{id:"director-1"}},error:null})},
     from(table){window.__reads.push(table);return {
       select(){return this},eq(){return this},order(){return this},limit(){return Promise.resolve({data:table==="nabd_support_tickets"?[{id:"test-ticket",student_id:"learner-1",category:"academic",subject:"Academic test",status:"open",created_at:"2099-01-01T00:00:00Z",updated_at:"2099-01-01T00:00:00Z"}]:[],error:null})},
       maybeSingle(){return Promise.resolve({data:{role:window.__role},error:null})}
     }}
   };
   window.NABD_ADMIN_REGISTER_MODULE=m=>{window.__adminModule=m;return true};
  });
  await ap.addScriptTag({path:resolve(__dirname,"../assets/js/nabd-one-admin.js")});
  assert.equal(await ap.evaluate(()=>window.__adminModule.id),"nabd-one-operations");
  await ap.evaluate(()=>window.__adminModule.render(document.querySelector("#root"),{db:window.__mockdb,user:{id:"director-1"}}));
  await ap.waitForFunction(()=>document.querySelector("#root")?.textContent?.includes("رفض عرض بيانات المراسلات"));
  assert.deepEqual(await ap.evaluate(()=>window.__reads),["profiles"],"Non-admin blocked before reading support");
  await ap.evaluate(()=>{window.__role="admin";window.__reads=[];window.__adminModule.render(document.querySelector("#root"),{db:window.__mockdb,user:{id:"director-1"}})});
  await ap.locator(".no-ticket").first().waitFor();
  assert.equal(await ap.locator(".no-ticket").count(),1,"Verified director can access inbox fixture");
  await ac.close();
  console.log("NABD ONE browser: courses, authenticated RSVP, student tickets/replies, protected admin access, mobile bilingual PASS");
 }finally{if(browser)await browser.close();server.kill()}
}
run().catch(e=>{console.error(e);process.exitCode=1});