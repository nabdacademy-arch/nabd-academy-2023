"use strict";
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {resolve}=require("node:path");
const {chromium}=require("playwright");
const studentId="22222222-2222-4222-8222-222222222222";
const courseId="11111111-1111-4111-8111-111111111111";
const examId="33333333-3333-4333-8333-333333333333";
const questionId="44444444-4444-4444-8444-444444444444";
const initMock=({role})=>{
 const uid=role==="admin"?"55555555-5555-4555-8555-555555555555":"22222222-2222-4222-8222-222222222222";
 const course="11111111-1111-4111-8111-111111111111",exam="33333333-3333-4333-8333-333333333333";
 const dataset={
  profiles:[{id:uid,full_name:role==="admin"?"Admin Test":"Student Test",role}],
  courses:[{id:course,title_ar:"فسيولوجيا القلب",title_en:"Cardiac Physiology",code:"CARD-101",status:"active",hours:24}],
  enrollments:role==="admin"?[]:[{id:"11111111-3333-4333-8333-333333333333",student_id:uid,course_id:course,status:"enrolled",progress:20,enrolled_at:"2026-11-01T00:00:00Z"}],
  nabd_os_course_modules:[{id:"99999999-9999-4999-8999-999999999999",course_id:course,title_ar:"القلب",title_en:"Heart",summary_ar:"شرح تمهيدي",resource_url:"https://example.org/reference",status:"published",position:1}],
  nabd_os_attendance:[],
  nabd_os_exams:[{id:exam,course_id:course,title_ar:"اختبار القلب",title_en:"Heart quiz",status:"published",passing_percent:60,opens_at:null,closes_at:null}],
  nabd_os_exam_questions:[{id:"44444444-4444-4444-8444-444444444444",exam_id:exam,prompt_ar:"كم حجرة في القلب؟",prompt_en:"How many chambers?",options_ar:["أربع حجرات","حجرتان"],options_en:["Four chambers","Two chambers"],points:1,position:1}],
  nabd_os_exam_attempts:[],nabd_os_faculty_assignments:[],nabd_os_certificate_requests:[],nabd_os_research_proposals:[],nabd_os_audit_events:[]
 };
 window.__mockData=dataset;window.__rpcCalls=[];
 const query=(name)=>{
  let filters=[],op="select";
  const run=()=>{let rows=dataset[name]||[];for(const [key,val] of filters)rows=rows.filter(row=>row[key]===val);return rows.map(r=>({...r}))};
  const b={
   select(){return this},
   eq(key,val){filters.push([key,val]);return this},
   order(){return this},limit(){return this},
   insert(row){op="insert";const item={id:"99999999-8888-4888-8888-"+String(Math.floor(Math.random()*1000000000000)).padStart(12,"0"),...(Array.isArray(row)?row[0]:row)};(dataset[name]||=[]).push(item);filters=[["id",item.id]];return this},
   upsert(row){op="upsert";(dataset[name]||=[]).push({...row,id:"77777777-7777-4777-8777-777777777777"});filters=[];return this},
   update(row){op="update";this.__patch=row;return this},
   async single(){let rows=run();if(op==="update"){rows.forEach(r=>{const obj=dataset[name].find(o=>o.id===r.id);Object.assign(obj,this.__patch,r=this.__patch)});rows=run()}return {data:rows[0]||null,error:null}},
   async maybeSingle(){return {data:run()[0]||null,error:null}},
   then(resolve,reject){if(op==="update"){let rows=run();rows.forEach(r=>Object.assign(dataset[name].find(o=>o.id===r.id),this.__patch))}return Promise.resolve({data:run(),error:null}).then(resolve,reject)}
  };return b
 };
 window.supabase={createClient:()=>({
  auth:{getUser:async()=>({data:{user:{id:uid,email:"testing@example.invalid"}},error:null}),signInWithPassword:async()=>({data:{user:{id:uid}},error:null}),signOut:async()=>({error:null})},
  from:name=>query(name),
  rpc:async (name,args)=>{window.__rpcCalls.push({name,args});if(name==="nabd_os_submit_exam"){dataset.nabd_os_exam_attempts.push({id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",exam_id:args.p_exam_id,student_id:uid,score:1,max_score:1,passed:true,submitted_at:new Date().toISOString()});return {data:{score:1,max_score:1,passed:true,attempt_id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"},error:null}}if(name==="nabd_os_publish_exam"){const row=dataset.nabd_os_exams.find(x=>x.id===args.p_exam_id);if(row)row.status="published";return {data:true,error:null}}if(name==="nabd_os_add_exam_question")return {data:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",error:null};if(name==="nabd_os_assign_faculty")return {data:true,error:null};return {data:null,error:null}}
 })};
};
async function run(){
 const port=8893,base="http://127.0.0.1:"+port,server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:resolve(__dirname,".."),stdio:"ignore"});
 let browser;
 try{
  let started=false;for(let i=0;i<45;i++){try{if((await fetch(base+"/university-os.html")).ok){started=true;break}}catch(e){}await new Promise(r=>setTimeout(r,250))}
  assert.ok(started,"Local server is running");
  browser=await chromium.launch({headless:true});
  for(const width of [390,1440]){
   const anon=await browser.newContext({viewport:{width,height:850},reducedMotion:"reduce"});
   await anon.route(/^https:\/\//,r=>r.abort());
   let page=await anon.newPage();
   await page.goto(base+"/university-os.html",{waitUntil:"domcontentloaded"});
   await page.locator("#osGate").waitFor({state:"visible"});
   assert.ok(await page.locator("#osApp").isHidden(),"Unauthenticated user cannot see academic workspace");
   assert.ok(await page.locator("[data-role='admin']").first().isHidden(),"Privileged tools hidden");
   await anon.close();
   const student=await browser.newContext({viewport:{width,height:850},reducedMotion:"reduce"});
   await student.route(/^https:\/\//,r=>r.abort());await student.addInitScript(initMock,{role:"student"});
   page=await student.newPage();
   await page.goto(base+"/university-os.html",{waitUntil:"domcontentloaded"});
   await page.locator("#osCourses .os-mini-card").first().waitFor();
   assert.ok(await page.locator("#osGate").isHidden(),"Student session accepted");
   assert.equal(await page.locator("[data-os-view='admin']").isHidden(),true,"Student cannot see admin controls");
   assert.equal(await page.locator("[data-os-view='faculty']").isHidden(),true,"Student cannot see faculty controls");
   assert.match(await page.locator("#osCourses").innerText(),/فسيولوجيا القلب/);
   await page.locator("[data-os-view='exams']").click();
   await page.locator("#osExamList button").click();
   await page.locator("#osExamQuestions input[type=radio]").first().check();
   page.once("dialog",dialog=>dialog.accept());
   await page.locator("#osSubmitExam").click();
   await page.locator("#osGrades .os-list-row").first().waitFor();
   assert.match(await page.locator("#osGrades").innerText(),/1\/1/,"Server-returned grade displayed");
   const rpcNames=await page.evaluate(()=>window.__rpcCalls.map(x=>x.name));
   assert.ok(rpcNames.includes("nabd_os_submit_exam"),"Grade submission uses RPC");
   await page.locator("#osLang").click();
   assert.equal(await page.locator("html").getAttribute("lang"),"en","Bilingual toggle works");
   await page.locator("[data-os-view='credentials']").click();
   assert.ok(await page.locator("#osCredentialForm").isVisible(),"Credential review view");
   const scroll=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(scroll<=4,"Student UI has no horizontal overflow at "+width+"px: "+scroll);
   await student.close();
   const admin=await browser.newContext({viewport:{width,height:850},reducedMotion:"reduce"});
   await admin.route(/^https:\/\//,r=>r.abort());await admin.addInitScript(initMock,{role:"admin"});
   page=await admin.newPage();
   await page.goto(base+"/university-os.html",{waitUntil:"domcontentloaded"});
   await page.locator("#osApp").waitFor({state:"visible"});
   assert.equal(await page.locator("[data-os-view='admin']").isHidden(),false,"Admin role can see course tools");
   assert.equal(await page.locator("[data-os-view='bank']").isHidden(),false,"Admin can see exam authoring");
   await page.locator("[data-os-view='admin']").click();
   await page.locator("#osCourseCode").fill("ANAT-120");
   await page.locator("#osCourseSlug").fill("human-anatomy-test");
   await page.locator("#osCourseAr").fill("التشريح التطبيقي");
   await page.locator("#osCourseEn").fill("Applied Anatomy");
   await page.locator('#osCreateCourseForm button[type="submit"]').click();
   await page.getByText("التشريح التطبيقي",{exact:true}).first().waitFor();
   await page.locator("[data-os-view='quality']").click();
   assert.ok(await page.locator("#osQualityList").isVisible(),"Admin quality workspace");
   const adminScroll=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(adminScroll<=4,"Admin UI has no horizontal overflow at "+width+"px: "+adminScroll);
   await admin.close();
  }
  console.log("NABD University OS browser: unauthenticated privacy gate, student learning and mock server grade, admin authoring, responsive RTL/LTR at 390 and 1440 px PASS.");
 }finally{if(browser)await browser.close();server.kill()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
