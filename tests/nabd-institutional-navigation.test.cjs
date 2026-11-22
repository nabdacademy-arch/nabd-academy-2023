"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const nav=read("assets/js/nabd-institutional-nav.js");
const dirJS=read("assets/js/academy-directory.js");
const navCSS=read("assets/css/nabd-institutional-nav.css");
const dirHTML=read("academy-directory.html");
const routes=["academy.html","portal.html","admin.html","nabd-moodle.html","student-exams.html","course.html","lecturers.html","quality-exams.html","research.html","research-office.html","research-news.html","research-manager.html","scholarships.html","scholarship-manager.html","councils.html","official-documents.html","nabd-campus.html","nabd-university-360.html","nabd-global-research.html","motivation-studio.html","nabd-connect.html","policies.html","nabd-hope.html","atlas/index.html","learning/index.html","learning/zero.html","global-lectures.html","nabd-360-lecturers.html","research-starter-lab.html","nabd-partners.html","nabd-2050.html","nabd-next-frontier.html","impact-lab/index.html","nabd-medical-knowledge.html","enroll.html","skill-passport.html","medical-consultations.html","application-status.html","council-documents.html","official-document-verify.html","council-verify.html","nabd-one.html","nabd-v10.html","nabd-science-immune.html","nabd-ai-executive.html","open-doors-ai.html","open-doors-masters.html","atlas/clinical-hub.html","atlas/heart-lab.html","atlas/hospital-3d.html","learning/crisis-evidence.html","campus.html","university-os.html","infinity/index.html","v11/index.html","mohammed-ai-twin/index.html"];
const catalog=JSON.parse(nav.match(/const catalog=(\[[\s\S]+?\]);\nconst categories=/)?.[1]||"null");
test("no alteration to the existing academy homepage",()=>{
 assert.ok(!read("index.html").includes("data-nabd-institutional-nav"));
 assert.ok(!read("academy-full.html").includes("data-nabd-institutional-nav"));
});
test("exactly targeted internal pages load the isolated navigation assets",()=>{
 assert.equal(routes.length,56);
 for(const page of routes){
  assert.ok(fs.existsSync(path.join(root,page)),page+" missing");
  const s=read(page);
  const prefix="../".repeat(page.split("/").length-1);
  assert.ok(s.includes('href="'+prefix+'assets/css/nabd-institutional-nav.css?v=1"'),page+" CSS");
  assert.ok(s.includes('data-nabd-institutional-nav src="'+prefix+'assets/js/nabd-institutional-nav.js?v=1"'),page+" JS");
  assert.equal((s.match(/data-nabd-institutional-nav/g)||[]).length,1,page+" duplicated");
 }
});
test("the complete directory catalog links to real pages and has unique targets",()=>{
 assert.ok(Array.isArray(catalog));
 assert.equal(catalog.length,39);
 const seen=new Set();
 for(const entry of catalog){
  const [page,ar,en,descAr,descEn,group,restricted,essential]=entry;
  assert.ok(fs.existsSync(path.join(root,page)),"missing catalog destination: "+page);
  assert.ok(!page.includes("..")&&!page.startsWith("http"));
  assert.ok(ar&&en&&descAr&&descEn&&group);
  assert.ok(!seen.has(page),"duplicate directory path: "+page);seen.add(page);
  assert.ok([0,1].includes(restricted)&&[0,1].includes(essential));
 }
});
test("institutional directory is concise, bilingual, categorized and searchable",()=>{
 for(const term of ['id="directoryGrid"','id="directorySearch"','id="directoryFilters"','id="directoryLang"',
   'data-filter="essential"','data-filter="learning"','data-filter="opportunities"',
   'data-filter="research"','data-filter="initiatives"','data-filter="management"',
   'data-filter="governance"','data-filter="all"']){
   assert.ok(dirHTML.includes(term),term);
 }
 assert.match(dirHTML,/lang="ar" dir="rtl"/);
 assert.match(dirJS,/if\(entry\.restricted\)/);
 assert.match(dirJS,/query\|\|filter==="all"/);
 assert.match(dirJS,/document\.documentElement\.dir=/);
});
test("navigation is privacy-preserving, accessible, and staff access is not implied",()=>{
 for(const value of ['aria-expanded','aria-modal','aria-controls','Escape','MutationObserver','prefers-reduced-motion','NABD_INSTITUTIONAL_DIRECTORY']){
  assert.ok(nav.includes(value),value);
 }
 assert.match(nav,/authorization is enforced by each destination/i);
 assert.match(nav,/Listing a service does not grant access/);
 assert.match(navCSS,/@media print/);
 assert.match(navCSS,/focus-visible/);
 assert.doesNotMatch(nav,/localStorage|sessionStorage|indexedDB|fetch\(|sendBeacon|document\.cookie|eval\(/);
 assert.doesNotMatch(dirJS,/localStorage|sessionStorage|indexedDB|fetch\(|sendBeacon|document\.cookie|eval\(/);
});
