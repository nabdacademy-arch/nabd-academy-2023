"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const fakeModule=String.raw`
const QUESTIONS=[{
 id:"NABD-TEST-001",subject:"chemistry",topic:"Moles",difficulty:"basic",
 kind:"single",question:"What is the molar mass of water?",
 options:["18 g/mol","16 g/mol","20 g/mol","34 g/mol"],
 answers:["A"],explanation:"Two H atoms and one O atom",rubric:"",
 points:1,origin:"NABD_ORIGINAL",source_note:"Practice"
}];
const TABLES={open_doors_questions:QUESTIONS,open_doors_sources:[],open_doors_patterns:[],open_doors_question_translations:[]};
function query(table){
 let criteria={};
 const q={
  select:()=>q,
  order:()=>q,
  limit:()=>Promise.resolve(result()),
  in:()=>q,
  eq:(key,value)=>{criteria[key]=value;return q},
  maybeSingle:()=>Promise.resolve({data:null,error:null}),
  then:(yes,no)=>Promise.resolve(result()).then(yes,no)
 };
 function result(){
  return {data:(TABLES[table]||[]).filter(v=>Object.entries(criteria).every(([k,x])=>v[k]===x)),error:null};
 }
 return q;
}
export function createClient(){
 return {from:query,
  auth:{
   getUser:async()=>({data:{user:null},error:null}),
   signInWithPassword:async()=>{throw Error("PUBLIC_GUEST_CANNOT_SIGN_IN")}
  },
  functions:{invoke:async()=>({error:{message:"PAID_AI_NOT_GUEST"},data:null})}
 };
}
`;
(async()=>{
 fs.mkdirSync("guest-browser-results",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const errors=[];
 try{
  const offline=await browser.newPage({viewport:{width:390,height:844}});
  offline.on("pageerror",e=>errors.push("offline: "+e.message));
  await offline.route(/^https:\/\//,r=>r.abort());
  await offline.goto("http://127.0.0.1:8123/open-doors-ai.html",{waitUntil:"domcontentloaded"});
  await offline.locator("#appView").waitFor({state:"visible",timeout:14000});
  assert.equal(await offline.locator("#authView").isVisible(),false);
  assert.equal(await offline.locator("input[type=password],input[type=email]").count(),0);
  const fallbackSize=Number((await offline.locator("#kQuestions").innerText()).trim());
  assert.ok(fallbackSize>=30,"local authored subset should survive loss of Supabase CDN");
  assert.match(await offline.locator("#guestBankStatus").innerText(),/وضع التدريب المحدود/);
  await offline.locator('[data-tab="choiceSingle"]').click();
  await offline.locator("#choiceSingleSource").selectOption("new");
  await offline.locator("#choiceSingleStart").click();
  await offline.locator("#choiceSinglePanel").waitFor({state:"visible",timeout:6000});
  assert.equal(await offline.locator("#choiceSingleOptions input[type=radio]").count(),4);
  await offline.locator("#choiceSingleOptions input[type=radio]").first().check();
  await offline.locator("#choiceSingleCheck").click();
  assert.equal(await offline.locator("#choiceSingleResult").isVisible(),true);
  await offline.screenshot({path:"guest-browser-results/offline-mobile.png",fullPage:true});
  await offline.locator('[data-tab="essayLab"]').click();
  await offline.locator("#essaySubject").selectOption("chemistry");
  await offline.locator("#essayMode").selectOption("single");
  await offline.locator("#essayStart").click();
  await offline.locator("#essayQuestionEn").waitFor({state:"visible",timeout:7000});
  assert.match(await offline.locator("#essayQuestionEn").innerText(),/.{18,}/s);
  await offline.close();

  const online=await browser.newPage({viewport:{width:1140,height:820}});
  online.on("pageerror",e=>errors.push("mock-online: "+e.message));
  await online.route(/^https:\/\//,r=>r.abort());
  // Playwright applies later, more-specific routes before the generic network block.
  await online.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.57\.0\/\+esm/,r=>
   r.fulfill({status:200,contentType:"text/javascript",
    headers:{"Access-Control-Allow-Origin":"*"},body:fakeModule}));
  await online.goto("http://127.0.0.1:8123/open-doors-ai.html",{waitUntil:"domcontentloaded"});
  await online.locator("#appView").waitFor({state:"visible",timeout:15000});
  assert.equal(await online.locator("#kQuestions").innerText(),"1");
  assert.equal(await online.locator("#authView").isVisible(),false);
  await online.locator("#modeSel").selectOption("mock");
  await online.locator("#startBtn").click();
  await online.locator("#examStage").waitFor({state:"visible",timeout:6000});
  assert.match(await online.locator("#timer").innerText(),/2:59|3:00/);
  await online.evaluate(()=>{
    const original=Date.now;
    Date.now=()=>original()+181*60*1000;
  });
  await online.locator("#checkBtn").click();
  await online.locator("#examDone").waitFor({state:"visible",timeout:3000});
  assert.equal(await online.locator("#examStage").isVisible(),false);
  await online.screenshot({path:"guest-browser-results/mock-timer-expired.png",fullPage:true});
  await online.close();
  assert.deepEqual(errors,[],"guest pages must have no uncaught JavaScript errors");
  console.log("PASS: public guest CDN outage fallback, mobile single-choice scoring, essay practice, online bank, hard deadline enforcement.");
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1});
