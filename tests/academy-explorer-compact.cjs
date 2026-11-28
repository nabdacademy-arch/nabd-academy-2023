const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
const root=process.cwd();
const html=fs.readFileSync("academy-full.html","utf8");
assert.ok(!fs.readFileSync("index.html","utf8").includes("academy-explorer-compact"));
assert.ok(!html.includes('src="assets/images/founder.jpg"'),"No personal portrait on directory");
assert.ok(!html.includes('class="nfs-actions"')&&!html.includes('id="nabd-hope-home-entry"'),"No duplicate promotional hero or scholarship banner");
assert.ok(html.includes('id="founder"')&&html.includes('id="verify"')&&html.includes('id="feedbackForm"'));
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 let enabled=false;
 await page.route("**/*",async route=>{
  const u=new URL(route.request().url());
  if(u.hostname!=="nabd.test")return route.abort();
  const file=path.resolve(root,"."+decodeURIComponent(u.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.abort();
  // Isolate layout from remote APIs and shared application initialization.
  if(file.endsWith(".js")&&(!enabled||!file.endsWith("academy-explorer-compact.js")))return route.fulfill({contentType:"application/javascript",body:""});
  await route.fulfill({path:file,contentType:file.endsWith(".html")?"text/html":file.endsWith(".css")?"text/css":file.endsWith(".js")?"application/javascript":undefined});
 });
 const snapshot=()=>page.evaluate(()=>({sections:[...document.querySelectorAll("main section[id]")].map(x=>x.id).sort(),links:[...document.querySelectorAll("a[href]")].map(x=>x.getAttribute("href")).sort(),fields:[...document.querySelectorAll("form input,form textarea,form select")].map(x=>x.id).sort(),height:document.documentElement.scrollHeight}));
 await page.goto("http://nabd.test/academy-full.html");await page.waitForLoadState("load");const before=await snapshot();
 enabled=true;await page.reload();await page.waitForFunction(()=>document.querySelector("main").dataset.explorerReady==="1");
 const after=await snapshot();
 assert.deepEqual(after.sections,before.sections);assert.deepEqual(after.links,before.links);assert.deepEqual(after.fields,before.fields);
 assert.equal(await page.locator(".explorer-group").count(),5);
 assert.equal(await page.locator(".explorer-group[open]").count(),0);
 assert.equal(await page.locator(".explorer-group summary svg.explorer-icon").count(),5);
 assert.equal(await page.locator(".explorer-description").count(),5);
 assert.ok(await page.evaluate(()=>new Set([...document.querySelectorAll(".explorer-group")].map(el=>getComputedStyle(el).getPropertyValue("--accent").trim())).size===5));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"No horizontal overflow");
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>[...document.querySelectorAll(".explorer-group>summary")].every(el=>el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>=120)));}
 await page.setViewportSize({width:390,height:844});
 assert.ok(after.height<before.height*0.5,"Default height should be less than half: "+JSON.stringify({before:before.height,after:after.height}));
 await page.evaluate(()=>{location.hash="verify"});await page.waitForFunction(()=>document.querySelector("#explorer-support").open);
 assert.ok(await page.locator("#certificateId").isVisible());
 await page.evaluate(()=>{document.documentElement.lang="ar";document.documentElement.dir="rtl"});
 await page.waitForFunction(()=>document.querySelector("#explorer-learning summary span").textContent==="التعليم والبوابات");
 await page.goto("http://nabd.test/academy-full.html?certificate=demo");await page.waitForFunction(()=>document.querySelector("#explorer-support").open);
 assert.ok(await page.locator("#feedbackForm").isVisible());
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({mobileBefore:before.height,mobileAfter:after.height,sections:after.sections.length,links:after.links.length,fields:after.fields.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
