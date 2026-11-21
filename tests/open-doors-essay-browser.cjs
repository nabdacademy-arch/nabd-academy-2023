"use strict";
const {chromium}=require("playwright");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const fakeModule=String.raw`
const MOCK_QUESTION={id:"TEST-001",subject:"chemistry",topic:"Stoichiometry",difficulty:"advanced",
 kind:"written",question:"Explain how to calculate water mass from 2 mol oxygen.",
 explanation:"4 mol water is 72 g.",rubric:"Balanced equation, steps, units",origin:"authored",
 source_note:"Independent practice",options:[],answers:[],points:10};
const SAMPLE=(table)=>{
 if(table==="open_doors_questions")return [MOCK_QUESTION];
 if(table==="open_doors_sources"||table==="open_doors_patterns"||table==="open_doors_attempts")return [];
 return [];
};
function query(table){
 let filters={};
 const self={
  select(){return self},
  eq(key,value){filters[key]=value;return self},
  in(){return self},
  order(){return self},
  limit(){return Promise.resolve({data:SAMPLE(table).filter(x=>!filters.kind||x.kind===filters.kind),error:null})},
  then(resolve,reject){return Promise.resolve({data:SAMPLE(table).filter(x=>!filters.kind||x.kind===filters.kind),error:null}).then(resolve,reject)}
 };
 return self;
}
export function createClient(){
 return {
  auth:{
   getUser:async()=>({data:{user:null},error:null}),
   signOut:async()=>({error:null}),
   signInWithPassword:async()=>{throw Error("GUEST_MUST_NOT_SIGN_IN") }
  },
  from:query,
  functions:{invoke:async(name,{body})=>{
   if(name!=="open-doors-essay-grade")return {data:null,error:{message:"unexpected function"}};
   window.__essayMockInvocations=(window.__essayMockInvocations||0)+1;
   window.__essayMockBody=body;
   return {data:{ok:true,result:{
    readable:true,
    score:7,
    criteria:[{score:3,feedback_ar:"خطوة صحيحة",feedback_en:"Correct conceptual reasoning"},
      {score:2,feedback_ar:"خطوة جزئية",feedback_en:"Partial step"},
      {score:1,feedback_ar:"الوحدات",feedback_en:"Check units"},
      {score:1,feedback_ar:"نقطة ناقصة",feedback_en:"A limitation was missing"}],
    recognized_text:body.image?"Handwritten student answer sample":"",
    reason_ar:"الخطوات الأساسية صحيحة، راجع الوحدات.",
    reason_en:"Correct main idea, review units.",
    missing_ar:["تفصيل الوحدات"],missing_en:["Explain units"],
    strengths_ar:["تحديد المفهوم"],strengths_en:["Correct principle"],
    confidence:"medium"
   }},error:null};
  }}
 }
}
`;
(async()=>{
 fs.mkdirSync("essay-browser-results",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1280,height:850},acceptDownloads:true});
 const errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2*/+esm",r=>r.fulfill({
  status:200,contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fakeModule
 }));
 await page.route(/https?:\/\/(?!127\.0\.0\.1:8123|cdn\.jsdelivr\.net)/,r=>r.abort());
 try{
  await page.goto("http://127.0.0.1:8123/open-doors-ai.html",{waitUntil:"domcontentloaded"});
  await page.locator("#appView").waitFor({state:"visible",timeout:15000});
  assert.equal(await page.locator("[data-tab=essayLab]").count(),1);
  assert.equal(await page.locator("#essayLab").isVisible(),false);
  await page.locator('[data-tab="essayLab"]').click();
  assert.equal(await page.locator("#essayLab").isVisible(),true);
  assert.equal(await page.locator("#trainer").isVisible(),false);
  await page.locator("#essaySubject").selectOption("chemistry");
  await page.locator("#essayMode").selectOption("single");
  await page.locator("#essayStart").click();
  await page.locator("#essayQuestionEn").waitFor({state:"visible"});
  assert.match(await page.locator("#essayQuestionEn").innerText(),/.{40,}/s);
  assert.match(await page.locator("#essayOrigin").innerText(),/NABD/);
  const n=await page.locator("#essayBankSize").innerText();
  assert.equal(n,"19","mock archive + 18 original authored questions");
  await page.locator("#essayTranslate").click();
  assert.equal(await page.locator("#essayQuestionAr").isVisible(),true);
  await page.locator("#essayTranslate").click();
  assert.equal(await page.locator("#essayQuestionAr").isVisible(),false);
  // Public guest may use typed and photographed answers for self-review.
  // No paid AI grading call is sent from the public portal.
  assert.equal(await page.locator("#essayGrade").isVisible(),false);
  await page.locator("#essayAnswer").fill("Balance the chemistry equation and show stoichiometric units and reasoning.");
  await page.locator("#essayReveal").click();
  assert.equal(await page.locator("#essaySelfRubric input[type=checkbox]").count(),4);
  await page.locator("#essaySelfRubric input[type=checkbox]").first().check();
  await page.locator("#essaySelfRubric button").click();
  assert.match(await page.locator("#essayFeedback").innerText(),/3\/10/);
  assert.equal(await page.evaluate(()=>window.__essayMockInvocations||0),0);
  const [download]=await Promise.all([
    page.waitForEvent("download"),page.locator("#essayFeedback button").click()
  ]);
  assert.match(download.suggestedFilename(),/nabd-open-doors-essay-.*\.txt/);
  await page.locator("#essayStart").click();
  const image=await page.evaluate(()=>{
   const canvas=document.createElement("canvas");canvas.width=600;canvas.height=350;
   const c=canvas.getContext("2d");c.fillStyle="#fff";c.fillRect(0,0,600,350);
   c.fillStyle="#111";c.font="bold 26px serif";c.fillText("H2 + O2 gives water",50,120);
   return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#essayImage").setInputFiles({name:"handwriting.png",mimeType:"image/png",buffer:Buffer.from(image,"base64")});
  assert.equal(await page.locator("#essayPreview").isVisible(),true);
  assert.match(await page.locator("#essayPhotoInfo").innerText(),/handwriting.png/);
  await page.locator("#essayReveal").click();
  assert.equal(await page.locator("#essaySelfRubric input[type=checkbox]").count(),4);
  assert.equal(await page.evaluate(()=>window.__essayMockInvocations||0),0);
  await page.screenshot({path:"essay-browser-results/essay-desktop.png"});
  // Multi-task question navigation and rounds.
  await page.locator("#essayMode").selectOption("three");
  await page.locator("#essayStart").click();
  assert.match(await page.locator("#essayNumber").innerText(),/1\/3/);
  await page.locator("#essayReveal").click();
  await page.locator("#essaySelfRubric button").click();
  await page.locator("#essayNext").click();
  assert.match(await page.locator("#essayNumber").innerText(),/2\/3/);
  await page.setViewportSize({width:390,height:840});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,"Mobile layout horizontal overflow: "+overflow);
  await page.screenshot({path:"essay-browser-results/essay-mobile.png"});
  assert.deepEqual(errors,[],"No runtime errors in the existing Open Doors page or new essay lab");
  console.log("PASS: Open Doors public essay practice — guest, archive, bilingual questions, typed/photo self-review, no paid AI requests and mobile.");
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
