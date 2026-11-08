"use strict";
const assert=require("node:assert/strict"),{spawn}=require("node:child_process"),{resolve}=require("node:path"),{chromium}=require("playwright");
const port=8898,base="http://127.0.0.1:"+port,delay=ms=>new Promise(r=>setTimeout(r,ms));
async function run(){
 const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:resolve(__dirname,".."),stdio:"ignore"});let browser;
 try{
  let ready=false;for(let i=0;i<65;i++){try{ready=(await fetch(base+"/nabd-next-frontier.html")).ok;if(ready)break}catch{}await delay(150)}
  assert.ok(ready,"Static test server starts");browser=await chromium.launch({headless:true});
  for(const width of [390,1420]){
   const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
   await ctx.route(/^https:\/\//,route=>route.abort());
   await ctx.addInitScript(()=>{
    window.__dbWrites=[];window.__login=null;
    window.__records={
     nfx_evidence_entries:[{id:"e1",claim_ar:"توثيق علمي للمعلومة التعليمية من مرجع منشور معروف",claim_en:"A verified educational medical claim supported by source",topic:"Basics",source_title:"Academic reference",source_url:"https://www.who.int/data/gho",relation:"context",status:"published",reviewed_at:"2099-01-01"}],
     nfx_congress_submissions:[],nfx_manuscripts:[],nfx_mentor_requests:[],nfx_innovation_projects:[],nfx_badge_requests:[],nfx_quest_attempts:[],
     nfx_mentor_profiles:[{user_id:"mentor-1",display_name:"Volunteer Mentor",expertise:"Research methods",bio:"Mentoring early-stage students in evidence-based scientific research.",status:"approved"}],
     nfx_observatory_records:[{id:"obs-1",indicator_ar:"مؤشر صحي تجريبي المصدر",indicator_en:"Sourced health indicator",location_label:"Fixture region",period_label:"2099",figure:37,units:"%",source_title:"WHO published source",source_url:"https://www.who.int/data/gho",status:"published"}],
     certificates:[{id:"c1",certificate_id:"C-TEST",course_title:"Test course issued",status:"issued",issue_date:"2099-01-01"}],
     nabd_skill_verifications:[{id:"s1",level:"theoretical",verification_status:"verified",public_reference:"SKILL-TEST",issued_at:"2099-01-01",expires_at:null}]
    };
    window.supabase={createClient:()=>({
     auth:{getUser:async()=>({data:{user:window.__login},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
     from(table){return {
      select(){return this},eq(){return this},order(){return this},
      limit(){return Promise.resolve({data:window.__records[table]||[],error:null})},
      insert(payload){window.__dbWrites.push({table,payload});return Promise.resolve({error:null})}
     }}
    })}
   });
   const page=await ctx.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto(base+"/nabd-next-frontier.html",{waitUntil:"domcontentloaded"});
   await page.locator("#nf-evidence-list .nf-card").first().waitFor();
   assert.equal(await page.locator(".nf-tab").count(),8,"Eight interactive programmes");
   assert.equal(await page.locator("#nf-evidence-list .nf-card").count(),1,"Medical evidence is database-backed");
   assert.equal(await page.locator("#nf-congress-form").isVisible(),false,"Guest cannot submit research");
   await page.locator("#nf-tab-observatory").click();
   await page.locator("#nf-observatory-list .nf-card").first().waitFor();
   assert.match(await page.locator("#nf-observatory-list").innerText(),/37/,"Sourced health figure is visible");
   assert.match(await page.locator("#nf-observatory-list").innerText(),/WHO published source/);
   await page.locator("#nf-tab-quest").click();
   assert.equal(await page.locator("#nf-quest-board .nf-question").count(),3,"Three self-practice questions");
   for(let i=0;i<3;i++)await page.locator('.nf-question input[name="q'+i+'"][value="'+[0,1,1][i]+'"]').check();
   await page.locator('#nf-quest-board button[type="submit"]').click();
   assert.match(await page.locator("#nf-quest-result").innerText(),/3\/3/,"Practice answers scored locally");
   assert.equal(await page.evaluate(()=>window.__dbWrites.length),0,"Guest scores never sent to production");
   await page.locator("#nf-lang").click();
   assert.equal(await page.locator("html").getAttribute("lang"),"en");
   assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
   assert.match(await page.locator("h1").innerText(),/Science is not a page you read/,"Bilingual flagship hero");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=5,"No horizontal scroll at "+width+": "+overflow);
   assert.deepEqual(errors.filter(e=>/nabd-frontier/i.test(e)),[],"No frontend exceptions");
   await ctx.close();
  }
  {
   const ctx=await browser.newContext({viewport:{width:420,height:900}});
   await ctx.route(/^https:\/\//,route=>route.abort());
   await ctx.addInitScript(()=>{
    window.__writes=[];window.supabase={createClient:()=>({
     auth:{getUser:async()=>({data:{user:{id:"fixture-student"}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
     from(table){return {
      select(){return this},eq(){return this},order(){return this},
      limit(){return Promise.resolve({data:[],error:null})},
      insert(payload){window.__writes.push({table,payload});return Promise.resolve({error:null})}
     }}
    })}
   });
   const page=await ctx.newPage();await page.goto(base+"/nabd-next-frontier.html",{waitUntil:"domcontentloaded"});
   await page.locator("#nf-tab-congress").click();
   await page.locator("#nf-congress-form").waitFor({state:"visible"});
   await page.locator('#nf-congress-form [name="display_name"]').fill("Student Presenter");
   await page.locator('#nf-congress-form [name="title"]').fill("Cardiovascular teaching methods");
   await page.locator('#nf-congress-form [name="abstract"]').fill("This poster explores how students learn cardiovascular anatomy through evidence-based educational methods with clear learning outcomes.");
   await page.locator('#nf-congress-form [name="public_consent"]').check();
   await page.locator('#nf-congress-form button[type="submit"]').click();
   await page.waitForFunction(()=>window.__writes?.length===1);
   const submitted=await page.evaluate(()=>window.__writes[0]);
   assert.equal(submitted.table,"nfx_congress_submissions");
   assert.equal(submitted.payload.user_id,"fixture-student","Ticket tied to authenticated user");
   assert.equal(submitted.payload.public_consent,true,"Publication consent explicit");
   assert.equal("status" in submitted.payload,false,"Client cannot set acceptance status");
   await page.locator("#nf-tab-quest").click();
   for(let i=0;i<3;i++)await page.locator('.nf-question input[name="q'+i+'"][value="'+[0,1,1][i]+'"]').check();
   await page.locator('#nf-quest-board button[type="submit"]').click();
   await page.waitForFunction(()=>window.__writes?.length===2);
   const score=await page.evaluate(()=>window.__writes[1]);
   assert.equal(score.table,"nfx_quest_attempts");
   assert.equal(score.payload.correct_count,3);
   assert.equal(score.payload.user_id,"fixture-student");
   await ctx.close();
  }
  {
   const ctx=await browser.newContext({viewport:{width:1024,height:760}});
   const page=await ctx.newPage();
   await page.setContent('<html><body><main id="adminHost"></main></body></html>');
   await page.evaluate(()=>{
    window.__reads=[];window.__role="student";
    window.__db={auth:{getUser:async()=>({data:{user:{id:"staff-fixture"}},error:null})},
     from(table){window.__reads.push(table);return {
      select(){return this},eq(){return this},
      maybeSingle(){return Promise.resolve({data:{role:window.__role},error:null})},
      order(){return this},limit(){return Promise.resolve({data:[],error:null})},
      then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}
     }}
    };
    window.NABD_ADMIN_REGISTER_MODULE=module=>{window.__module=module;return true}
   });
   await page.addScriptTag({path:resolve(__dirname,"../assets/js/nabd-frontier-admin.js")});
   assert.equal(await page.evaluate(()=>window.__module?.id),"nabd-next-frontier","Frontier admin tab registered");
   await page.evaluate(()=>window.__module.render(document.querySelector("#adminHost"),{db:window.__db,user:{id:"staff-fixture"}}));
   await page.waitForFunction(()=>document.querySelector("#adminHost")?.textContent?.includes("تم منع قراءة"));
   assert.deepEqual(await page.evaluate(()=>window.__reads),["profiles"],"Non-admin blocked before records accessed");
   await ctx.close();
  }
  console.log("NABD NEXT FRONTIER browser: guest+student+director privacy, projects, scored quests and responsive bilingual PASS");
 }finally{if(browser)await browser.close();server.kill()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
