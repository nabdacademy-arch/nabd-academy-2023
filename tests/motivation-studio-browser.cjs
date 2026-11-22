"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const {chromium}=require("playwright");
const url=pathToFileURL(path.resolve(__dirname,"..","motivation-studio.html")).href;

async function main(){
 const browser=await chromium.launch({headless:true});
 const results=[];
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport,locale:"ar-PS",acceptDownloads:true});
   // Local file:// test cannot pass Cloudflare's approved-hostname check.
   // Mock only the external challenge widget, never the page's real own UI code.
   // Production CAPTCHA verification is tested server-side by the endpoint's guards.
   await page.route("https://challenges.cloudflare.com/**",route=>
     route.fulfill({status:200,contentType:"application/javascript",
       body:"window.turnstile={render:()=>123,getResponse:()=>'synthetic_test_token_never_valid',reset:()=>{}};"}));
   const errors=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.goto(url,{waitUntil:"domcontentloaded"});
   await page.waitForSelector("#letterForm");
   assert.equal(await page.locator('[data-step="1"]').isVisible(),true);
   await page.click('[data-next="2"]');
   assert.equal(await page.locator('[data-step="1"]').isVisible(),true,"required opportunity should block next");
   await page.fill("#opportunity","Computer Science Scholarship 2027");
   // Every application goal changes actual guidance and relevant examples.
   const uniqueHints=new Set();
   for(const kind of ["scholarship","university","job","internship","research",
     "volunteer","exchange","fellowship","other"]){
     await page.click('[data-kind="'+kind+'"]');
     uniqueHints.add(await page.locator("#kindContext").textContent());
   }
   assert.equal(uniqueHints.size,9,"Nine goals must offer distinct advice");
   await page.click('[data-kind="university"]');
   assert.equal(await page.locator("#kindInput").inputValue(),"university");
   await page.click('[data-next="2"]');
   assert.equal(await page.locator('[data-step="2"]').isVisible(),true);
   await page.fill("#about","I am a student who independently developed software learning tools and organized several volunteer education projects.");
   await page.fill("#achievements","Designed an open educational platform, with a team of volunteer tutors.");
   await page.fill("#moment","I noticed students could not access lessons on a weak connection, so I adapted our learning materials.");
   await page.fill("#future","Help make technical education accessible to people with limited internet.");
   await page.click('[data-next="3"]');
   assert.equal(await page.locator('[data-step="3"]').isVisible(),true);
   await page.fill("#why","This specific opportunity would help me study software engineering and create useful tools for learners.");
   await page.fill("#fit","My previous software projects align with its community impact goals.");
   await page.fill("#wordLimit","150");
   await page.fill("#mustInclude","I developed a real technical learning project with collaborators.");
   assert.equal(await page.locator("#qualityValue").textContent(),"100%");
   assert.match(await page.locator("#qualityAdvice").textContent(),/اكتمال|العناصر/);
   await page.click("#uiSwitch");
   assert.equal(await page.locator("html").getAttribute("lang"),"en");
   assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
   assert.match(await page.locator("#kindContext").textContent(),/For admission/);
   assert.match(await page.locator("#qualityAdvice").textContent(),/not an admission score/);
   await page.click("#uiSwitch");
   assert.equal(await page.locator("html").getAttribute("lang"),"ar");
   // The model response is mocked ONLY in this local UI test. Production protection
   // and validation are separately tested against the real deployed service.
   let mockedCalls=0;
   await page.route("https://zsmmmljgguycrvyrmakl.supabase.co/functions/v1/nabd-motivation-studio",async route=>{
     const body=route.request().postDataJSON();
     assert.equal(body.wordLimit,150);
     assert.equal(body.moment.length>20,true);
     mockedCalls++;
     const one="A genuine software project taught me to document changes, listen to users, and improve access for learners. ".repeat(21);
     const two="I designed a volunteer educational initiative and tested software with real collaborators. ".repeat(17);
     await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
       ok:true,letter:mockedCalls===1?one:two,
       notes:["The sample contains real project context."],
       missing:["Confirm the official criteria."]})});
   });
   await page.check("#aiConsent");
   await page.click("#generateBtn");
   await page.waitForSelector("#resultPanel:not([hidden])");
   assert.equal(await page.locator("#draftTabs button").count(),1);
   assert.match(await page.locator("#wordLimitStatus").textContent(),/150/);
   assert.equal(await page.locator("#wordLimitStatus").evaluate(el=>el.classList.contains("over-limit")),true);
   await page.fill("#generatedLetter","This edited draft must stay in memory when switching.");
   await page.click("#newVariantBtn");
   await page.click("#generateBtn");
   await page.locator("#draftTabs button").nth(1).waitFor({state:"visible",timeout:12000});
   assert.equal(await page.locator("#draftTabs button").count(),2);
   assert.equal(await page.locator("#compareBtn").isVisible(),true);
   await page.click("#compareBtn");
   assert.equal(await page.locator("#comparePanel").isVisible(),true);
   assert.equal(await page.locator("#compareColumns section").count(),2);
   await page.click("#closeCompareBtn");
   await page.locator("#draftTabs button").first().click();
   assert.equal(await page.locator("#generatedLetter").inputValue(),
     "This edited draft must stay in memory when switching.");
   // Export is explicitly initiated by the user; nothing is silently persisted.
   page.once("dialog",d=>d.accept());
   const [download]=await Promise.all([page.waitForEvent("download"),page.click("#saveBrief")]);
   assert.equal(download.suggestedFilename(),"NABD-Application-Brief.json");
   const imported={
     format:"NABD_MOTIVATION_BRIEF",version:1,kind:"job",
     fields:{opportunity:"Software Engineer vacancy",about:"I built and tested a practical software tool with an education team.",
       why:"I would like to help improve reliable technology.",language:"en",tone:"confident",
       length:"standard",wordLimit:"250",moment:"A meaningful engineering challenge."}
   };
   await page.locator("#briefFile").setInputFiles({
     name:"nabd-brief.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(imported))
   });
   await page.waitForFunction(()=>document.querySelector("#opportunity").value==="Software Engineer vacancy",null,{timeout:12000});
   assert.equal(await page.locator("#opportunity").inputValue(),"Software Engineer vacancy");
   assert.equal(await page.locator("#kindInput").inputValue(),"job");
   assert.equal(await page.locator("#wordLimit").inputValue(),"250");
   assert.equal(await page.locator("#aiConsent").isChecked(),false);
   assert.equal(await page.locator("#resultPanel").isVisible(),false);
   assert.equal(mockedCalls,2);
   const widths=await page.evaluate(()=>{
     const screen=document.documentElement.clientWidth,scroll=document.documentElement.scrollWidth;
     const outliers=[...document.querySelectorAll("body *")].map(el=>{
       const r=el.getBoundingClientRect();
       return {tag:el.tagName,id:el.id,cl:String(el.className||"").slice(0,75),left:r.left,right:r.right};
     }).filter(x=>x.right>innerWidth+2||x.left<-2);
     // ScrollWidth may include clipped decorative transform effects in Chromium RTL.
     // Verify actual horizontal scrolling is impossible and no elements are visible outside.
     window.scrollTo({left:9999,top:window.scrollY,behavior:"instant"});
     const positive=window.scrollX;
     window.scrollTo({left:-9999,top:window.scrollY,behavior:"instant"});
     const negative=window.scrollX;
     window.scrollTo({left:0,top:window.scrollY,behavior:"instant"});
     return {screen,scroll,positive,negative,outliers:outliers.slice(0,10)};
   });
   if(widths.scroll>widths.screen+2)console.log("CLIPPED_WIDTH_DIAGNOSTICS "+JSON.stringify(widths));
   assert.deepEqual(widths.outliers,[],"Visible content exceeds viewport");
   assert.ok(Math.abs(widths.positive)<=2&&Math.abs(widths.negative)<=2,
     "Actual mobile horizontal scrolling: "+JSON.stringify(widths));
   assert.deepEqual(errors,[],"Uncaught browser exceptions");
   results.push({viewport,widths,checks:"passed"});
   await page.close();
  }
 }finally{await browser.close();}
 fs.mkdirSync("audit",{recursive:true});
 fs.writeFileSync("audit/motivation-studio-browser.json",JSON.stringify(results,null,2));
 console.log(JSON.stringify(results));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
