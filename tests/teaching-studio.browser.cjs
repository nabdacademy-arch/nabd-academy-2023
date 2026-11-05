/* Run against python -m http.server 8000. Uses isolated fake Supabase data. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[];
 for(const mode of ['lecturer','student','admin','missing','guest']){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',route=>route.abort());
  await page.route('**/assets/js/supabase-client.js',route=>route.fulfill({contentType:'application/javascript',body:`
   window.testWrites=[];window.testMode=${JSON.stringify(mode)};
   const item={id:'r1',lecturer_id:'u1',course_id:'c1',kind:'session',title:'جلسة القلب <img src=x onerror=alert(1)>',objective:'شرح الدورة الدموية',description:'تعلم موثق',reference:'مرجع',resource_url:'javascript:alert(1)',status:'published',starts_at:null};
   const tables={courses:[{id:'c1',title_ar:'القلب'}],nabd_teaching_assignments:window.testMode==='student'?[]:[{lecturer_id:'u1',course_id:'c1',display_name:'محاضر',active:true}],nabd_teaching_records:[item]};
   window.nabdSupabase={auth:{getUser:async()=>({data:{user:window.testMode==='guest'?null:{id:'u1'}}}),onAuthStateChange:()=>{},signOut:async()=>({}),signInWithPassword:async()=>({})},rpc:async()=>({data:window.testMode==='admin',error:window.testMode==='missing'?{code:'PGRST202'}:null}),from:table=>{let write=false;const q={};['select','order','range','eq','single'].forEach(k=>q[k]=()=>q);['insert','update','upsert'].forEach(k=>q[k]=data=>{write=true;window.testWrites.push({table,kind:k,data});return q});q.then=(resolve,reject)=>Promise.resolve({data:write?item:tables[table]||[],error:null}).then(resolve,reject);return q}};
  `}));
  await page.goto('http://127.0.0.1:8000/lecturers.html');
  if(mode==='missing'){await page.getByRole('status').filter({hasText:'تحتاج'}).waitFor();assert.equal(await page.locator('#studio-workspace').isVisible(),false)}
  else if(mode==='guest'){await page.locator('#studio-login').waitFor({state:'visible'});assert.equal(await page.locator('#studio-workspace').isVisible(),false)}
  else{
   await page.locator('.nw-record').waitFor();
   assert.equal(await page.locator('#studio-records img').count(),0,'escape HTML');
   assert.equal(await page.locator('#studio-records a').count(),0,'reject script URL');
   assert.equal(await page.locator('#studio-admin').isVisible(),mode==='admin');
   assert.equal(await page.locator('#studio-editor').isVisible(),mode!=='student');
   if(mode==='student')assert.equal(await page.locator('[data-edit]').count(),0);
   if(mode==='lecturer'){
    await page.locator('[data-edit]').click();await page.locator('[name=title]').fill('جلسة محدّثة');await page.locator('[name=resource_url]').fill('https://example.org/lesson');
    await page.locator('#studio-record button[type=submit], #studio-record button:not([type])').first().click();
    await page.waitForFunction(()=>window.testWrites.length===1);
    assert.equal((await page.evaluate(()=>window.testWrites[0])).data.title,'جلسة محدّثة');
   }
   await page.locator('#studio-search').fill('نتيجة غير موجودة');assert.equal(await page.locator('.nw-record').count(),0);
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'mobile overflow '+mode);
  await context.close();
 }
 const page=await browser.newPage();await page.route('https://**/*',r=>r.abort());
 await page.goto('http://127.0.0.1:8000/academy.html');assert.equal(await page.locator('.nw-path').count(),6);
 for(const width of [390,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
 await page.screenshot({path:'/tmp/nabd-pathways-desktop.png',fullPage:true});
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: five account states, edit/save, HTML/URL safety, search, six pathways, mobile/desktop layout');
})().catch(e=>{console.error(e);process.exit(1)});
