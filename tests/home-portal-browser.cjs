const {chromium}=require("playwright");
const fs=require("node:fs");

(async()=>{
 fs.mkdirSync("gateway-browser-results",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const cases=[["small",320,760],["mobile",390,844],["tablet",820,950],["desktop-site",980,800],["narrow-desktop",1190,850],["desktop",1440,900]];
 let failures=[];
 for(const [name,width,height] of cases){
  const page=await browser.newPage({viewport:{width,height},locale:"ar-PS",reducedMotion:"reduce"});
  await page.route(/https?:\/\/(?!127\.0\.0\.1:8123)/,r=>r.abort());
  try{
   await page.goto("http://127.0.0.1:8123/index.html",{waitUntil:"domcontentloaded",timeout:20000});
   await page.locator("#nabdNeoHome").waitFor({state:"visible"});
   const before=await page.evaluate(()=>{
    const root=document.querySelector("#nabdNeoHome");
    const cards=[...root.querySelectorAll(".neo-programs > a.neo-program")];
    const details=root.querySelector(".neo-staff-services");
    const shortcuts=root.querySelector(".neo-student-shortcuts");
    return {
     visible:getComputedStyle(root).display!=="none",
     legacyHidden:getComputedStyle(document.querySelector("#nabdLegacyShell")).display==="none",
     routes:cards.map(a=>a.getAttribute("href")),
     shortcuts:shortcuts?.querySelectorAll("a").length,
     staffLinks:details?.querySelectorAll("a").length,
     staffInitiallyClosed:!details?.open,
     contained:root.getBoundingClientRect().width<=innerWidth+2
    };
   });
   const expected=["academy.html","nabd-moodle.html","nabd-global-research.html","scholarships.html"];
   if(JSON.stringify(before.routes)!==JSON.stringify(expected))throw Error("Unexpected primary cards: "+before.routes);
   if(!before.visible||!before.legacyHidden||before.shortcuts<3||before.staffLinks<3||!before.staffInitiallyClosed||!before.contained)
    throw Error("Broken home structure or responsive containment: "+JSON.stringify(before));
   await page.locator(".neo-staff-services summary").click();
   if(!(await page.locator(".neo-staff-services").evaluate(el=>el.open)))throw Error("Staff links do not expand");
   const geometry=await page.evaluate(()=>{
    const header=document.querySelector(".neo-headbar");
    const brand=header.querySelector(".neo-brand").getBoundingClientRect();
    const language=header.querySelector(".neo-locale").getBoundingClientRect();
    const menu=header.querySelector(".neo-menu").getBoundingClientRect();
    const openNav=header.querySelector("#neoNav");
    const overlaps=(x,y)=>Math.max(x.left,y.left)<Math.min(x.right,y.right)-1&&
      Math.max(x.top,y.top)<Math.min(x.bottom,y.bottom)-1;
    const menuVisible=getComputedStyle(header.querySelector(".neo-menu")).display!=="none";
    return {screen:innerWidth,scroll:document.documentElement.scrollWidth,
      headerRight:header.getBoundingClientRect().right,
      headerLeft:header.getBoundingClientRect().left,
      navHidden:getComputedStyle(openNav).display==="none",menuVisible,
      brandLangOverlap:overlaps(brand,language),
      brandMenuOverlap:menuVisible&&overlaps(brand,menu),
      langMenuOverlap:menuVisible&&overlaps(language,menu)};
   });
   if(geometry.brandLangOverlap||geometry.brandMenuOverlap||geometry.langMenuOverlap)
    throw Error("Header controls overlap: "+JSON.stringify(geometry));
   if(width<=1240&&(!geometry.navHidden||!geometry.menuVisible))
    throw Error("The intermediate-width header must use its compact menu: "+JSON.stringify(geometry));
   if(geometry.scroll>geometry.screen+2)
    throw Error("Horizontal overflow: "+JSON.stringify(geometry));
   await page.locator("#neoLang").click();
   if(!(await page.locator("#neoLangMenu").isVisible()))throw Error("Language list did not open");
   if((await page.locator("#neoLangMenu button[data-home-lang]").count())!==12)
    throw Error("Expected 12 actual language choices");
   await page.locator('[data-home-lang="en"]').click();
   if((await page.locator("#nabdNeoHome").getAttribute("lang"))!=="en")throw Error("English switch failed");
   if(!(await page.locator("#neo-program-heading").innerText()).includes("Four pathways"))throw Error("Pathway title not translated");
   await page.locator("#neoLang").click();
   await page.locator('[data-home-lang="ar"]').click();
   if((await page.locator("#nabdNeoHome").getAttribute("lang"))!=="ar")throw Error("Arabic switch failed");
   if(width<=1240){
    await page.locator("#neoMenu").click();
    if((await page.locator("#neoMenu").getAttribute("aria-expanded"))!=="true")throw Error("Mobile menu did not expand");
    await page.locator('#neoNav a[href="#neo-programs"]').click();
    if((await page.locator("#neoMenu").getAttribute("aria-expanded"))!=="false")throw Error("Mobile menu did not close after navigation");
   }
   await page.screenshot({path:"gateway-browser-results/home-"+name+".png",fullPage:false});
   console.log("PASS "+name+" homepage, non-overlapping header, language chooser, responsive nav");
  }catch(e){failures.push(name+": "+String(e));console.error("FAIL "+name+": "+String(e))}
  finally{await page.close()}
 }
 await browser.close();
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
