const { chromium } = require("playwright");
const fs=require("fs");
const path=require("path");
(async()=>{
  fs.mkdirSync("gateway-browser-results",{recursive:true});
  const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const cases=[
    ["portal.html","student"],["lecturers.html","faculty"],["admin.html","administration"],
    ["portal/","council"],["nabd-global-research.html","research"],
    ["nabd-connect.html","communications"],["university-os.html","academic"],
    ["nabd-360-lecturers.html","volunteer"],["research-office.html","researchoffice"]
  ];
  const profiles=[["mobile",390,844],["desktop",1365,860]];
  let failed=0;
  for(const [route,theme] of cases){
    for(const [profile,width,height] of profiles){
      const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,locale:"ar-PS",reducedMotion:"reduce"});
      page.on("pageerror",e=>{const m=e.message||"";if(/nabd-gateway-system/i.test(m))console.log("GATEWAY JS ERROR",route,m)});
      try{
        await page.route(/https?:\/\/(?!127\.0\.0\.1:8123)/,r=>r.abort());
        await page.goto("http://127.0.0.1:8123/"+route,{waitUntil:"domcontentloaded",timeout:18000});
        await page.locator(".nabd-gate--"+theme).waitFor({state:"visible",timeout:15000});
        await page.waitForTimeout(120);
        const result=await page.evaluate(()=>{
          const g=document.querySelector(".nabd-gate");
          const a=g?.querySelector(".ng-access"),c=g?.querySelector(".ng-copy");
          const d=g?.querySelector(".ng-access-link"),form=g?.querySelector("form");
          if(!g||!a||!c)return {error:"gateway missing structural nodes"};
          const x=g.getBoundingClientRect(),y=a.getBoundingClientRect(),z=c.getBoundingClientRect();
          const style=getComputedStyle(g),as=getComputedStyle(a);
          return {
            rootWidth:x.width,viewport:innerWidth,gridColumns:getComputedStyle(g.querySelector(".ng-inner")).gridTemplateColumns,
            cardWidth:y.width,copyWidth:z.width,cardVisible:as.display!=="none"&&y.height>80,
            overlap:(Math.min(y.right,z.right)-Math.max(y.left,z.left)>10)&&(Math.min(y.bottom,z.bottom)-Math.max(y.top,z.top)>10),
            horizOverflow:x.left< -3||x.right>innerWidth+3,
            title:g.querySelector(".ng-copy h2")?.innerText,
            features:g.querySelectorAll(".ng-points span").length,
            bg:style.backgroundImage,
            hasWorkingLink:!d || !!document.querySelector(d.getAttribute("href")),
            formPreserved:!!form
          };
        });
        let reasons=[];
        if(result.error)reasons.push(result.error);
        if(!result.cardVisible)reasons.push("card not visible");
        if(result.overlap)reasons.push("copy and card overlap");
        if(result.horizOverflow)reasons.push("gateway horizontal overflow");
        if(!result.title||result.title.length<12)reasons.push("gateway title missing");
        if(result.features!==3)reasons.push("feature chips missing");
        if(!result.hasWorkingLink)reasons.push("broken CTA anchor");
        if(reasons.length)failed++;
        const safe=route.replace(/[^a-z0-9]+/gi,"-");
        await page.screenshot({path:"gateway-browser-results/"+safe+"-"+profile+".png",fullPage:false,timeout:10000});
        console.log(JSON.stringify({case:route,profile,passed:!reasons.length,reasons,...result}));
      }catch(e){failed++;console.log(JSON.stringify({case:route,profile,passed:false,error:String(e).slice(0,650)}));}
      finally{await page.close();}
    }
  }
  await browser.close();
  if(failed){console.error("GATEWAY VISUAL CHECK FAILED cases="+failed);process.exitCode=1;}
  else console.log("GATEWAY VISUAL CHECK PASSED: "+(cases.length*profiles.length)+" mobile/desktop route renders.");
})().catch(e=>{console.error(e);process.exitCode=1});
