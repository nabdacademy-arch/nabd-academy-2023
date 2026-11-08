"use strict";
const assert=require("node:assert/strict"),{spawn}=require("node:child_process"),{resolve}=require("node:path"),{chromium}=require("playwright");
const port=8897,base="http://127.0.0.1:"+port,delay=ms=>new Promise(r=>setTimeout(r,ms));
async function run(){
 const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:resolve(__dirname,".."),stdio:"ignore"});let browser;
 try{
  let ready=false;for(let i=0;i<65;i++){try{ready=(await fetch(base+"/nabd-university-360.html")).ok;if(ready)break}catch{}await delay(160)}
  assert.ok(ready,"Static test server starts");browser=await chromium.launch({headless:true});
  for(const width of [390,1365]){
   const context=await browser.newContext({viewport:{width,height:830},reducedMotion:"reduce"});
   await context.route(/^https:\/\//,route=>route.abort());
   await context.addInitScript(()=>{
    window.__plans=[],window.__aiCalls=[];
    window.supabase={createClient:()=>({
     auth:{getUser:async()=>({data:{user:{id:"student-fixture"}},error:null})},
     from(table){
      const q={select(){return this},eq(){return this},order(){return this},
       limit(){
        const records={
         enrollments:[{id:"en1",course_id:"a111",status:"active",progress:40,enrolled_at:"2099-02-01"}],
         nabd_os_exam_attempts:[{id:"at1",exam_id:"ex1",score:6,max_score:10,passed:false,submitted_at:"2099-02-01"}],
         nabd_os_course_modules:[],
         nabd_skill_verifications:[{id:"skillv1",skill_id:"s1",level:"theoretical",verification_status:"verified",issued_at:"2099-01-05",expires_at:null}],
         certificates:[{id:"cert1",certificate_id:"demo-cert",course_title:"Medical foundations",status:"issued",issue_date:"2099-01-01"}],
         courses:[{id:"a111",code:"MED101",title_ar:"أساسيات طبية",title_en:"Medical Foundations",status:"active"}]
        };
        return Promise.resolve({data:records[table]||[],error:null})
       },
       maybeSingle(){return Promise.resolve({data:window.__plans.length?window.__plans[window.__plans.length-1]:null,error:null})},
       update(fields){this._updating=fields;return this},
       insert(fields){this._inserting=fields;return this},
       single(){
        const payload={user_id:"student-fixture",...(this._inserting||this._updating||{})};window.__plans.push(payload);
        return Promise.resolve({data:payload,error:null})
       }
      };return q
     },
     functions:{invoke:async(slug,opts)=>{window.__aiCalls.push({slug,body:opts.body});return {data:{answer:"Personalised weekly revision: 3 tasks and 2 questions."},error:null}}}
    })}
   });
   const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto(base+"/nabd-university-360.html",{waitUntil:"domcontentloaded"});
   await page.locator("#n360-student-app").waitFor({state:"visible"});
   assert.equal(await page.locator("#n360-stats .n360-stat").count(),4,"Four evidence-based student stats");
   assert.match(await page.locator("#n360-achievements").innerText(),/Medical foundations|Medical Foundations/,"Authenticated issued record visible");
   await page.locator("#n360-course").selectOption("a111");
   await page.locator("#n360-minutes").fill("240");
   await page.locator("#n360-focus").fill("Cardiovascular review");
   await page.locator("#n360-save-plan").click();
   await page.waitForFunction(()=>window.__plans?.length===1);
   assert.match(await page.locator("#n360-plan-status").innerText(),/حُفظ|saved/,"Plan stored, not local only");
   await page.locator("#n360-ai-plan").click();
   await page.waitForFunction(()=>window.__aiCalls?.length===1);
   await page.waitForFunction(()=>document.querySelector("#n360-ai-answer")?.textContent?.includes("Personalised weekly revision"));
   const call=await page.evaluate(()=>window.__aiCalls[0]);
   assert.equal(call.slug,"smart-processor","Existing secured AI tutor used");
   assert.equal(call.body.language,"ar","AI request respects learner language");
   assert.ok(call.body.question.includes("240")&&call.body.question.includes("Cardiovascular review"),"Opt-in question is genuinely personalised");
   assert.ok(!call.body.question.includes("student-fixture"),"No student identifier sent to model");
   await page.locator("#n360-lang").click();
   assert.equal(await page.locator("html").getAttribute("lang"),"en");
   assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
   assert.match(await page.locator("h1").first().innerText(),/University-scale ambition/);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=5,"No horizontal scrolling at "+width+": "+overflow);
   assert.deepEqual(errors.filter(e=>/nabd-360-student/i.test(e)),[],"No script exceptions");
   await context.close();
  }
  {
   const ctx=await browser.newContext({viewport:{width:390,height:800},reducedMotion:"reduce"});
   await ctx.route(/^https:\/\//,route=>route.abort());
   await ctx.addInitScript(()=>{
    window.__faculty=[];
    window.supabase={createClient:()=>({
     auth:{getUser:async()=>({data:{user:{id:"volunteer-fixture"}},error:null})},
     from(table){return {
      select(){return this},eq(){return this},
      maybeSingle(){return Promise.resolve({data:null,error:null})},
      insert(p){window.__faculty.push(p);return this},
      single(){return Promise.resolve({data:{id:"application-fixture",applicant_id:"volunteer-fixture",expertise:"Physiology",status:"pending",created_at:"2099-01-01"},error:null})}
     }}
    })}
   });
   const page=await ctx.newPage();await page.goto(base+"/nabd-360-lecturers.html",{waitUntil:"domcontentloaded"});
   await page.locator("#n360-application").waitFor({state:"visible"});
   for(const [selector,value]of [["#n360-fullname","Dr Volunteer Fixture"],["#n360-email","faculty@example.org"],["#n360-expertise","Human Physiology"],["#n360-institution","Example Medical School"],["#n360-country","Exampleland"],["#n360-topic","Introduction to cardiac physiology for beginners"]])await page.locator(selector).fill(value);
   await page.locator("#n360-hours").fill("2");await page.locator("#n360-consent").check();await page.locator("#n360-apply-submit").click();
   await page.waitForFunction(()=>window.__faculty?.length===1);
   assert.equal(await page.locator("#n360-application-status").isVisible(),true,"Volunteer can track own submitted request");
   assert.equal(await page.locator("#n360-application").isVisible(),false,"No duplicate application UI");
   const payload=await page.evaluate(()=>window.__faculty[0]);
   assert.equal(payload.applicant_id,"volunteer-fixture");
   assert.equal(payload.status,"pending","Never self-approve");
   assert.equal(payload.consent,true,"Explicit informed consent");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=5,"No faculty form overflow");
   await ctx.close();
  }
  {
   const ctx=await browser.newContext({viewport:{width:430,height:800}});await ctx.route(/^https:\/\//,route=>route.abort());
   await ctx.addInitScript(()=>{
    window.supabase={createClient:()=>({auth:{getUser:async()=>({data:{user:null},error:null})}})}
   });const page=await ctx.newPage();
   await page.goto(base+"/nabd-university-360.html",{waitUntil:"domcontentloaded"});
   assert.equal(await page.locator("#n360-student-app").isVisible(),false,"Guest cannot view private learner records");
   assert.ok((await page.locator("#n360-auth").innerText()).includes("سجّل الدخول"),"Prompt guest login");
   await ctx.close();
  }
  {
   const ctx=await browser.newContext({viewport:{width:1070,height:820}});
   const page=await ctx.newPage();
   await page.setContent('<!doctype html><html lang="ar"><body><main id="app"><nav class="tabs"></nav><section id="adminHost"></section></main></body></html>');
   await page.evaluate(()=>{
    window.__role="student";window.__read=[];
    window.__adminDb={auth:{getUser:async()=>({data:{user:{id:"admin-fixture"}},error:null})},
     from(table){window.__read.push(table);const q={
      select(_,opts){this.opts=opts;return this},
      eq(){return this},order(){return this},
      maybeSingle(){return Promise.resolve({data:{role:window.__role},error:null})},
      limit(){return Promise.resolve({data:[],error:null})},
      then(resolve){return Promise.resolve({count:table==="courses"?5:0,error:null}).then(resolve)}
     };return q}
    };
    window.NABD_ADMIN_REGISTER_MODULE=module=>{window.__mission=module;return true}
   });
   await page.addScriptTag({path:resolve(__dirname,"../assets/js/nabd-360-admin.js")});
   assert.equal(await page.evaluate(()=>window.__mission?.id),"nabd-university-360","Director mission control registered");
   await page.evaluate(()=>window.__mission.render(document.querySelector("#adminHost"),{db:window.__adminDb,user:{id:"admin-fixture"}}));
   await page.waitForFunction(()=>document.querySelector("#adminHost")?.textContent?.includes("رفض الوصول"));
   assert.deepEqual(await page.evaluate(()=>window.__read),["profiles"],"No protected metrics read for ordinary learner");
   await page.evaluate(()=>{window.__role="admin";window.__read=[];window.__mission.render(document.querySelector("#adminHost"),{db:window.__adminDb,user:{id:"admin-fixture"}})});
   await page.locator(".n360adm-metric").first().waitFor();
   assert.equal(await page.locator(".n360adm-metric").count(),12,"Real admin metrics displayed");
   assert.match(await page.locator(".n360adm-hold").first().innerText(),/HOLD/,"Pilot remains on hold");
   await page.locator(".n360adm-tab[data-page='pilot']").click();
   assert.equal(await page.locator(".n360adm-check").count(),6,"Human-only pilot gates");
   await ctx.close();
  }
  console.log("NABD UNIVERSITY 360 browser PASS: learner privacy, saved plan, AI opt-in, volunteer application, non-admin denial, bilingual phone and desktop");
 }finally{if(browser)await browser.close();server.kill()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
