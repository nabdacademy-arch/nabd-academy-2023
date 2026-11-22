"use strict";
const {chromium}=require("playwright");
const fs=require("node:fs");
const base="https://nabdacademy-arch.github.io/nabd-academy-2023/";
const pages=[
 "index.html","portal.html","admin.html","nabd-moodle.html",
 "scholarships.html","scholarship-manager.html","quality-exams.html",
 "student-exams.html","open-doors-masters.html","learning/index.html",
 "nabd-university-360.html","nabd-connect.html","research.html","course.html"
];
async function main(){
 const browser=await chromium.launch({headless:true});
 const results=[];
 try{
  for(const route of pages){
   const page=await browser.newPage({viewport:{width:1280,height:800},locale:"en-US"});
   const errors=[],assets=[];
   page.on("pageerror",error=>errors.push(String(error.message||error).slice(0,220)));
   page.on("response",response=>{
    if(response.status()!==404)return;
    try{
     const url=new URL(response.url());
     if(url.hostname==="nabdacademy-arch.github.io" && /\.(?:js|mjs|css)(?:$|\?)/i.test(url.pathname))
      assets.push(url.pathname+" -> 404");
    }catch{}
   });
   let status=0,title="",textLength=0,loaded=false;
   try{
    const response=await page.goto(new URL(route,base).href,{waitUntil:"domcontentloaded",timeout:30000});
    status=response?.status()||0;
    await page.waitForTimeout(1000);
    const details=await page.evaluate(()=>({
     title:document.title,
     content:(document.body?.innerText||"").trim().length,
     loaded:!!document.body
    }));
    title=details.title;textLength=details.content;loaded=details.loaded;
   }catch(error){errors.push("Navigation: "+error.message.slice(0,200))}
   const item={route,status,title,textLength,loaded,uncaughtErrors:[...new Set(errors)],missingAssets:[...new Set(assets)]};
   results.push(item);
   console.log(JSON.stringify(item));
   await page.close();
  }
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  for(const route of ["index.html","portal.html","nabd-moodle.html","scholarships.html","open-doors-masters.html"]){
   const response=await mobile.goto(new URL(route,base).href,{waitUntil:"domcontentloaded",timeout:30000});
   const content=await mobile.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body?.innerText.length||0}));
   console.log("MOBILE "+route+" "+JSON.stringify({status:response?.status(),...content}));
   if(response?.status()!==200||content.body<25)results.push({route:route+" mobile",status:response?.status()||0,loaded:false});
  }
  await mobile.close();
 }finally{await browser.close()}
 fs.mkdirSync("audit",{recursive:true});
 fs.writeFileSync("audit/live-browser-report.json",JSON.stringify(results,null,2));
 const failed=results.filter(r=>r.status!==200||!r.loaded||r.textLength<25||r.uncaughtErrors?.length||r.missingAssets?.length);
 console.log("LIVE BROWSER SUMMARY: "+(results.length-failed.length)+"/"+results.length+" pass");
 if(failed.length)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1});
