// Run with a local HTTP server on port 8000 and Playwright installed.
const {chromium}=require('playwright');const assert=require('node:assert/strict');
const {existsSync}=require('node:fs');
const chromiumPath=existsSync('/usr/bin/chromium')?'/usr/bin/chromium':existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':'/usr/bin/chromium';
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath,args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
 await page.goto('http://127.0.0.1:8000/learning/');await page.locator('.hero-panel').waitFor();
 await page.waitForTimeout(200);
 const routes=['universe','learn','tutor','library','graph','rounds','scholarships','community','offline','account'];
 for(const language of ['ar','en']){
  if(await page.locator('html').getAttribute('lang')!==language)await page.locator('#language').click();
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:950});
   for(const route of routes){
    await page.goto('http://127.0.0.1:8000/learning/#'+route);await page.waitForFunction(()=>document.getElementById('view').children.length>0);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false,language+'/'+width+'/'+route);
    assert((await page.locator('#page-title').textContent()).trim());
   }
  }
 }
 await page.setViewportSize({width:1440,height:1000});if(await page.locator('html').getAttribute('lang')!=='ar')await page.locator('#language').click();
 await page.goto('http://127.0.0.1:8000/learning/#lesson/medical-words');
 await page.locator('[name=w1][value="0"]').check();await page.locator('[name=w2][value="1"]').check();await page.locator('[name=w3][value="1"]').check();await page.locator('#practice-quiz button').click();assert((await page.locator('#practice-result').textContent()).includes('3/3'));
 await page.locator('[data-read="medical-words"]').click();await page.locator('[data-read="medical-words"]').click();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('nabd-learning-practice-v1')));assert.equal(stored['medical-words'].score,3);assert.equal(stored['medical-words'].completed,true);
 await page.goto('http://127.0.0.1:8000/learning/#universe');await page.screenshot({path:'/tmp/nabd-student-universe-desktop.png',fullPage:true});
 await page.goto('http://127.0.0.1:8000/learning/#learn');await page.locator('#search').fill('الدم');assert.equal(await page.locator('.lesson-card').count(),1);await page.locator('#search').fill('no-match-999');assert.equal(await page.locator('.lesson-card').count(),0);
 await page.goto('http://127.0.0.1:8000/learning/#library');await page.locator('[data-bookmark=openstax]').click();await page.locator('#library-topic').selectOption('saved');assert.equal(await page.locator('.library-card').count(),1);
 await page.goto('http://127.0.0.1:8000/learning/#graph');await page.locator('button[data-node=hemoglobin]').first().click();assert((await page.locator('.graph-detail h2').textContent()).includes('الهيموغلوبين'));
 await page.goto('http://127.0.0.1:8000/learning/#tutor');await page.locator('[data-suggest]').first().click();await page.locator('#tutor-form button[value=reference]').click();assert((await page.locator('#tutor-result').textContent()).includes('مقتطفات'));assert.equal(await page.locator('#tutor-result .nabd-visual-card').count(),1);
 assert.equal(await page.locator('.nabd-organ-choice').count(),19);
 await page.locator('.nabd-visual-zoom').first().click();
 await page.locator('dialog.nabd-anatomy-lightbox[open]').waitFor();
 await page.locator('.nabd-lightbox-tools button').nth(1).click();
 assert.equal(await page.locator('.nabd-lightbox-scale').textContent(),'125%');
 await page.keyboard.press('Escape');
 await page.locator('dialog.nabd-anatomy-lightbox').waitFor({state:'detached'});
 assert.equal(await page.locator('dialog.nabd-anatomy-lightbox').count(),0);
 await page.locator('.nabd-signature-launch').click();
 assert.equal(await page.locator('.nabd-signature-lab[open]').count(),1);
 await page.locator('.nabd-signature-stage[data-renderer="webgl"]').waitFor({timeout:15000});
 assert.equal(await page.locator('.nabd-signature-canvas').count(),1);
 assert((await page.locator('.nabd-signature-kicker').textContent()).includes('ATLAS'));
 await page.locator('[data-atlas-action="route-blue"]').click();
 assert.equal(await page.locator('[data-atlas-action="route-blue"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-atlas-action="focus-lv"]').click();
 assert((await page.locator('.nabd-chamber-explanation').textContent()).includes('الأبهر'));
 await page.locator('[data-atlas-action="next-step"]').click();
 assert((await page.locator('.nabd-tour-count').textContent()).includes('2'));
 await page.locator('[data-atlas-action="zoom-in"]').click();
 await page.locator('[data-atlas-action="orbit"]').click();
 assert.equal(await page.locator('[data-atlas-action="orbit"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-atlas-action="orbit"]').click();
 await page.locator('[data-atlas-action="play"]').click();
 assert.equal(await page.locator('[data-atlas-action="play"]').getAttribute('aria-pressed'),'false');
 await page.locator('[data-atlas-action="play"]').click();
 await page.locator('[data-atlas-action="fullscreen"]').click();
 await page.locator('.nabd-signature-dialog[open]').waitFor();
 assert.equal(await page.locator('.nabd-signature-dialog .nabd-signature-canvas').count(),1);
 await page.locator('.nabd-signature-dialog-close').click();
 await page.locator('.nabd-signature-dialog').waitFor({state:'detached'});
 assert.equal(await page.locator('.nabd-signature-lab .nabd-signature-canvas').count(),1);
 assert.equal(await page.locator('#tutor-result .nabd-visual-path li').count(),7);
  await page.locator('.nabd-organ-browser summary').click();
 await page.locator('[data-organ-choice="eye"]').click();
 assert.equal(await page.locator('#tutor-result [data-organ="eye"]').count(),1);
 assert((await page.locator('#tutor-result .nabd-visual-card figcaption').textContent()).includes('Wikimedia Commons'));assert.equal(await page.locator('#tutor-result .nabd-visual-path li').count(),4);await page.locator('#tutor-form button[value=ai]').click();assert((await page.locator('#tutor-result').textContent()).includes('اربط حسابك'));
 await page.goto('http://127.0.0.1:8000/learning/#rounds');await page.locator('[data-discussion]').click();await page.locator('[data-discussion]').click();assert((await page.locator('.discussion h2').textContent()).includes('المراجع'));
 await page.goto('http://127.0.0.1:8000/learning/#scholarships');assert.equal(await page.locator('.scholarship-card').count(),5);await page.locator('[data-checklist=cv]').check();
 await page.goto('http://127.0.0.1:8000/learning/#offline');
 const downloadPromise=page.waitForEvent('download');await page.locator('#export-pack').click();const file=await downloadPromise;assert.equal(file.suggestedFilename(),'nabd-foundation-reading.html');
 await page.locator('#save-offline').click();await page.waitForFunction(async()=>!!(await caches.keys()).find(k=>k==='nabd-learning-public-v4'));
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 const cachePaths=await page.evaluate(async()=>{const c=await caches.open('nabd-learning-public-v4');return (await c.keys()).map(r=>new URL(r.url).pathname)});assert(cachePaths.length>=15);assert(cachePaths.every(x=>x.startsWith('/learning/')));assert(!cachePaths.some(x=>/portal|supabase|account|admin/.test(x)));
 await context.setOffline(true);await page.reload();await page.locator('#view h2').first().waitFor();assert((await page.locator('#connectivity').textContent()).includes('دون اتصال'));
 await page.locator('#navigation a[href="#learn"]').click();await page.locator('.lesson-card').first().click();await page.locator('#practice-quiz').waitFor();assert.equal(await page.locator('#practice-quiz').count(),1);await page.screenshot({path:'/tmp/nabd-learning-offline-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:8000/learning/#universe');await page.screenshot({path:'/tmp/nabd-student-universe-mobile.png',fullPage:true});
 await context.setOffline(false);await page.goto('http://127.0.0.1:8000/learning/#offline');await page.locator('#remove-offline').click();await page.waitForFunction(async()=>!(await caches.keys()).some(k=>k.startsWith('nabd-learning-public-')));
 assert.deepEqual(errors,[]);await context.close();console.log('PASS: 10 routes × 4 widths × 2 languages, practice grading/persistence, search, bookmarks, graph, tutor fallback, discussion, scholarship checklist, export, public-only offline pack, actual offline reload and cleanup.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
