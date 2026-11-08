"use strict";
const assert=require("node:assert/strict"),{spawn}=require("node:child_process"),{resolve}=require("node:path"),{chromium}=require("playwright");
const port=8924,base="http://127.0.0.1:"+port,sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function test(){
 const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:resolve(__dirname,".."),stdio:"ignore"});
 let browser;
 try{
  let ready=false;for(let i=0;i<65;i++){try{ready=(await fetch(base+"/nabd-science-immune.html")).ok;if(ready)break}catch{}await sleep(150)}assert.ok(ready,"static server ready");
  browser=await chromium.launch({headless:true});
  for(const admin of [false,true]){
   const context=await browser.newContext({viewport:{width:admin?1180:390,height:900},reducedMotion:"reduce"});
   await context.route(/^https:\/\//,route=>route.abort());
   await context.addInitScript(({admin})=>{
    window.__writes=[];
    const published={id:"n1",title_ar:"تحديث مراجعة الأدلة العلمية",title_en:"A scientific evidence update",topic:"Cardiology",previous_claim:"Previous educational teaching recommendation.",current_evidence:"An updated research publication suggests revisiting the teaching note.",source_title:"Example academic publication",source_url:"https://example.org/publication",source_date:"2026-11-01",severity:"review",status:"published",review_note:"A specialist reviewed the reference and confirmed a teaching check is appropriate.",reviewed_at:"2026-11-08",created_at:"2026-11-08"};
    const draft={...published,id:"n2",title_ar:"مسودة خاصة غير منشورة",title_en:"Private unpublished draft",status:"draft",created_at:"2026-11-07"};
    const impact={id:"i1",change_id:"n1",resource_kind:"simulation",resource_title:"ATLAS fictional scenarios",resource_path:"atlas/index.html",action_status:"needs_review",action_note:"",created_at:"2026-11-08"};
    const tables={nsi_changes:admin?[published,draft]:[published],nsi_impacts:[impact],nsi_events:[{id:1,entity:"change",entity_id:"n1",action:"UPDATE",old_state:"review",new_state:"published",happened_at:"2026-11-08"}]};
    const client={
      auth:{getUser:async()=>({data:{user:admin?{id:"admin-fixture"}:null},error:null})},
      from(table){
       const q={_payload:null,_mode:"select",select(){return this},eq(){return this},order(){return this},update(p){this._payload=p;this._mode="update";return this},insert(p){this._payload=p;this._mode="insert";return this},limit(){return Promise.resolve({data:tables[table]||[],error:null})},maybeSingle(){
        if(table==="profiles")return Promise.resolve({data:{role:admin?"admin":"student"},error:null});
        window.__writes.push({table,method:this._mode,payload:this._payload});return Promise.resolve({data:{id:"n2",status:this._payload?.status||"draft"},error:null});
       },single(){window.__writes.push({table,method:this._mode,payload:this._payload});return Promise.resolve({data:{id:"n2"},error:null})}};
       return q;
      }
    };
    window.supabase={createClient:()=>client};
   },{admin});
   const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto(base+"/nabd-science-immune.html",{waitUntil:"domcontentloaded"});
   await page.locator("#nsi-list .nsi-notice").first().waitFor();
   assert.equal(await page.locator("#nsi-count-changes").textContent(),"1","only published visible");
   assert.equal(await page.locator("#nsi-list .nsi-notice").count(),1,"one public record");
   assert.equal(await page.locator("#nsi-list").textContent().then(s=>s.includes("مسودة خاصة غير منشورة")),false,"draft never rendered public");
   assert.equal(await page.locator("#nsi-list .nsi-impact-item a").getAttribute("href"),base+"/atlas/index.html","safe academy route");
   assert.equal(await page.locator("#nsi-admin").isVisible(),admin,"admin access enforced in UI");
   await page.locator("#nsi-lang").click();
   assert.equal(await page.locator("html").getAttribute("lang"),"en");
   assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
   assert.match(await page.locator("#nsi-list").textContent(),/scientific evidence update/i);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=6,"mobile responsive");
   if(admin){
    await page.locator("#nsi-queue .nsi-queue-card").first().waitFor();
    assert.equal(await page.locator("#nsi-queue .nsi-queue-card").count(),2,"admin sees published and private draft");
    await page.locator('#nsi-form [name="title_ar"]').fill("تحديث علمي موثوق للدرس");
    await page.locator('#nsi-form [name="title_en"]').fill("Scientific evidence review");
    await page.locator('#nsi-form [name="topic"]').fill("Cardiology");
    await page.locator('#nsi-form [name="previous_claim"]').fill("Previously taught claim requiring source review.");
    await page.locator('#nsi-form [name="current_evidence"]').fill("Newer scholarly evidence requiring editorial review.");
    await page.locator('#nsi-form [name="source_title"]').fill("Journal source");
    await page.locator('#nsi-form [name="source_url"]').fill("https://example.org/source");
    await page.locator('#nsi-form [name="source_date"]').fill("2026-11-01");
    await page.locator('#nsi-form button[type=submit]').click();
    await page.waitForFunction(()=>window.__writes.length>0);
    const w=await page.evaluate(()=>window.__writes[0]);
    assert.equal(w.table,"nsi_changes");
    assert.equal(w.method,"insert");
    assert.equal(w.payload.status,"draft","student-facing client never creates a published record");
    assert.equal(w.payload.created_by,"admin-fixture");
   }
   assert.deepEqual(errors.filter(x=>/science.immune|nsi/i.test(x)),[],"no science immune errors");
   await context.close();
  }
  console.log("NABD Science Immune browser: guest/public privacy, admin, bilingual, responsive, source-linked, draft write PASS");
 }finally{if(browser)await browser.close();server.kill()}
}
test().catch(e=>{console.error(e);process.exitCode=1});
