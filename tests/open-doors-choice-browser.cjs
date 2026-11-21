"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
// No authorized user: the public training must still load its question bank.
const fakeModule=String.raw`
const ITEMS={
 open_doors_questions:[{id:101,subject:"chemistry",topic:"Stoichiometry",difficulty:"basic",kind:"single",
 question:"What is the molar mass of water (H2O)?",options:["18 g/mol","16 g/mol","20 g/mol","34 g/mol"],
 answers:["A"],explanation:"Water contains two hydrogen atoms and one oxygen atom.",rubric:"",
 points:1,origin:"NABD_ORIGINAL",source_note:"Original practice"}],
 open_doors_sources:[],open_doors_patterns:[],open_doors_attempts:[]
};
function query(table){
 let filters={};
 const q={
  select:()=>q,order:()=>q,limit:()=>Promise.resolve(result()),
  in:()=>q,eq:(field,value)=>{filters[field]=value;return q},
  then:(resolve,reject)=>Promise.resolve(result()).then(resolve,reject)
 };
 function result(){return {data:(ITEMS[table]||[]).filter(x=>!filters.kind||x.kind===filters.kind),error:null}}
 return q;
}
export function createClient(){
 return {auth:{
   getUser:async()=>({data:{user:null},error:null}),
   signInWithPassword:async()=>{throw Error("GUEST_MUST_NOT_SIGN_IN")}
  },
  from:query,
  functions:{invoke:async()=>({data:null,error:{message:"NO_PAID_AI_FOR_GUESTS"}})}
 };
}
`;
(async()=>{
 fs.mkdirSync("choice-browser-results",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1180,height:780},acceptDownloads:true});
 const errors=[];page.on("pageerror",e=>errors.push(String(e)));
 await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2*/+esm",r=>
  r.fulfill({status:200,contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fakeModule}));
 await page.route(/https?:\/\/(?!127\.0\.0\.1:8123|cdn\.jsdelivr\.net)/,r=>r.abort());
 try{
  await page.goto("http://127.0.0.1:8123/open-doors-ai.html",{waitUntil:"domcontentloaded"});
  await page.locator("#appView").waitFor({state:"visible",timeout:20000});
  assert.equal(await page.locator("input[type=email]").count(),0);
  assert.equal(await page.locator("input[type=password]").count(),0);
  assert.equal(await page.locator("#authView").isVisible(),false);
  assert.equal(await page.locator("#kQuestions").innerText(),"1");
  await page.locator('[data-tab="choiceSingle"]').click();
  await page.locator("#choiceSingleSource").selectOption("new");
  await page.locator("#choiceSingleStart").click();
  await page.locator("#choiceSinglePanel").waitFor({state:"visible",timeout:10000});
  assert.equal(await page.locator("#choiceSingleOptions input[type=radio]").count(),4);
  assert.match(await page.locator("#choiceSinglePrompt").innerText(),/.{15,}/);
  await page.locator("#choiceSingleTranslate").click();
  assert.equal(await page.locator("#choiceSinglePromptArabic").isVisible(),true);
  await page.locator("#choiceSingleOptions input[type=radio]").first().check();
  await page.locator("#choiceSingleCheck").click();
  assert.equal(await page.locator("#choiceSingleResult").isVisible(),true);
  assert.equal(await page.locator("#choiceSingleNext").isVisible(),true);
  await page.locator('[data-tab="choiceMulti"]').click();
  await page.locator("#choiceMultiSource").selectOption("new");
  await page.locator("#choiceMultiStart").click();
  await page.locator("#choiceMultiPanel").waitFor({state:"visible"});
  assert.equal(await page.locator("#choiceMultiOptions input[type=checkbox]").count(),4);
  await page.locator("#choiceMultiOptions input[type=checkbox]").first().check();
  await page.locator("#choiceMultiCheck").click();
  assert.equal(await page.locator("#choiceMultiResult").isVisible(),true);
  assert.deepEqual(errors,[],"Guest study must have no page errors");
  await page.setViewportSize({width:390,height:844});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=5,"Guest Open Doors mobile page overflow: "+overflow);
  await page.screenshot({path:"choice-browser-results/public-guest-choices-mobile.png",fullPage:true});
  console.log("PASS: Public Open Doors choice exams, translation, scoring, guest access, mobile layout");
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
