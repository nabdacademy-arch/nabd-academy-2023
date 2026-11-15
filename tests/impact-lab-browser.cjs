"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
(async()=>{
 fs.mkdirSync("gateway-browser-results",{recursive:true});
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1360,height:900},locale:"ar-PS",acceptDownloads:true,reducedMotion:"reduce"});
 const errors=[];page.on("pageerror",e=>errors.push(String(e)));
 await page.route(/https?:\/\/(?!127\.0\.0\.1:8123)/,r=>r.abort());
 try{
  await page.goto("http://127.0.0.1:8123/impact-lab/",{waitUntil:"domcontentloaded"});
  assert.equal(await page.locator("[data-module]").count(),6);
  assert.equal(await page.locator(".tool-panel").count(),6);
  assert.equal(await page.locator('.tool-panel:not([hidden])').count(),1);
  // AI reviewer worksheet must produce a scoped result and downloadable report.
  await page.locator("#ai-name").fill("Example model");
  await page.locator("#ai-prompt").fill("Explain how to review published research evidence.");
  await page.locator("#ai-response").fill("A response is only as strong as independently checked sources.");
  await page.locator('select[data-metric="accuracy"]').selectOption("3");
  await page.locator('select[data-metric="evidence"]').selectOption("3");
  await page.locator('select[data-metric="uncertainty"]').selectOption("4");
  await page.locator('select[data-metric="privacy"]').selectOption("4");
  await page.locator('select[data-metric="safety"]').selectOption("4");
  await page.locator('#ai-form button[type="submit"]').click();
  assert.equal(await page.locator("#ai-result").isVisible(),true);
  assert.match(await page.locator("#ai-result").innerText(),/90\/100/);
  const [aiDownload]=await Promise.all([page.waitForEvent("download"),page.locator("#ai-export").click()]);
  assert.match(aiDownload.suggestedFilename(),/nabd-ai-review\.md/);
  // Claim checking must be marked as non-published.
  await page.locator("#tab-truth").click();
  await page.locator("#truth-claim").fill("Does every study establish cause and effect?");
  await page.locator("#truth-link1").fill("https://www.who.int/");
  await page.locator("#truth-evidence").fill("A sample reviewer summary; requires real evidence review before publication.");
  await page.locator('#truth-form button[type="submit"]').click();
  assert.equal(await page.locator("#truth-result").isVisible(),true);
  assert.match(await page.locator("#truth-result").innerText(),/مسودة غير منشورة/);
  // A real browser cryptographic roundtrip, then a wrong-password rejection.
  await page.locator("#tab-vault").click();
  const original=Buffer.from("NABD world impact secure file round-trip 2026");
  await page.locator("#vault-input").setInputFiles({name:"sample.txt",mimeType:"text/plain",buffer:original});
  await page.locator("#vault-pass").fill("StrongPassphrase_2026_for_trial");
  const [encrypted]=await Promise.all([page.waitForEvent("download"),page.locator('#vault-encrypt button[type="submit"]').click()]);
  assert.match(encrypted.suggestedFilename(),/\.nabdvault$/);
  await page.locator("#vault-archive").setInputFiles(await encrypted.path());
  await page.locator("#vault-open-pass").fill("StrongPassphrase_2026_for_trial");
  const [decrypted]=await Promise.all([page.waitForEvent("download"),page.locator('#vault-decrypt button[type="submit"]').click()]);
  assert.equal((await fs.promises.readFile(await decrypted.path())).toString(),original.toString());
  // De-identified event worksheet.
  await page.locator("#tab-blackbox").click();
  await page.locator("#bb-description").fill("A fictional team handoff missed a non-identifying checklist item.");
  await page.locator('input[name="bb-factor"][value="handoff"]').check();
  await page.locator("#bb-action").fill("Introduce and audit a consistent handoff checklist.");
  await page.locator('#blackbox-form button[type="submit"]').click();
  assert.equal(await page.locator("#bb-result").isVisible(),true);
  // Sample missions must not pretend to register actual volunteers.
  await page.locator("#tab-hours").click();
  await page.locator("#hours-skill").selectOption("programming");
  await page.locator("#hours-amount").fill("4");
  await page.locator('#hours-form button[type="submit"]').click();
  assert.ok(await page.locator(".mission-card").count()>=2);
  const [proposal]=await Promise.all([page.waitForEvent("download"),page.locator(".mission-card button").first().click()]);
  assert.match(proposal.suggestedFilename(),/nabd-volunteer-proposal/);
  // Humanitarian phrasebook five languages / large display.
  await page.locator("#tab-lifeline").click();
  await page.locator("#phrase-lang").selectOption("fr");
  assert.equal(await page.locator(".phrase-card").count(),14);
  assert.match(await page.locator(".phrase-card strong").first().innerText(),/Bonjour/);
  await page.locator(".phrase-card button").nth(2).click();
  assert.equal(await page.locator("dialog").isVisible(),true);
  await page.locator("#phrase-dialog-close").click();
  await page.locator("#language").click();
  assert.equal(await page.locator("html").getAttribute("lang"),"en");
  assert.equal(await page.locator("html").getAttribute("dir"),"ltr");
  await page.screenshot({path:"gateway-browser-results/impact-desktop.png",fullPage:false});
  // Mobile should retain a single entry, tap targets and no horizontal overflow.
  await page.setViewportSize({width:390,height:844});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,"Mobile horizontal overflow: "+overflow+"px");
  await page.screenshot({path:"gateway-browser-results/impact-mobile.png",fullPage:false});
  assert.deepEqual(errors,[],"No browser exceptions");
  console.log("World Impact E2E PASS: 6 modules, report exports, AES-GCM roundtrip, language, mobile.");
 }finally{await page.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
