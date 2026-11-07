import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),".."),read=p=>readFileSync(resolve(root,p),"utf8");
let n=0;function ok(condition,label){assert.ok(condition,label);n++}
const js=read("assets/js/operations-suite.js"),css=read("assets/css/operations-suite.css");
new Script(js,{filename:"operations-suite.js"});n++;
ok(css.includes(".os")&&css.includes(".os-home"),"Scoped and homepage CSS");
ok(css.includes("@media(max-width:650px)")&&css.includes("prefers-reduced-motion"),"Responsive and reduced motion");
ok(!/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage)\b/.test(js),"Local V16 tools do not upload or persist data");
ok(js.includes('index.html')&&js.includes('search.crossref.org')&&js.includes('pubmed.ncbi.nlm.nih.gov'),"Official verification and source links");
ok(js.includes('existing.querySelector')&&js.includes('[name="title"]'),"Faculty plan explicitly connects to existing editor without auto-save");
ok(!/\.from\(|\.insert\(|\.update\(|\.delete\(/.test(js),"V16 never alters database records");
const pages={
"lecturers.html":["os-lecturer-suite","os-lesson-form","os-lesson-title","os-lesson-course","os-lesson-length","os-lesson-objective","os-lesson-output","os-lesson-copy","os-lesson-download","os-lesson-to-editor","os-lesson-status"],
"admin.html":["os-admin-suite","os-course-form","os-course-name","os-course-code","os-course-weeks","os-course-hours","os-course-outcomes","os-course-output","os-course-copy","os-course-export","os-course-meter","os-admin-cert-meter","os-admin-governance-meter","os-admin-report","os-admin-status"],
"portal.html":["os-certificates-student","os-cert-form","os-cert-id","os-cert-link","os-cert-status","os-cert-meter"],
"nabd-global-research.html":["os-evidence-navigator","os-research-form","os-pico-p","os-pico-i","os-pico-c","os-pico-o","os-research-design","os-research-output","os-research-status","os-pubmed-link","os-crossref-link","os-research-download","os-research-copy","os-research-meter"]
};
for(const [path,ids] of Object.entries(pages)){
 const h=read(path);
 for(const id of ids)ok(h.includes('id="'+id+'"'),"Missing V16 "+id+" in "+path);
 ok(h.includes("assets/css/operations-suite.css?v=1")&&h.includes("assets/js/operations-suite.js?v=1"),path+" loads new style and behavior");
 const v=[...h.matchAll(/\bid="(os-[^"]+)"/g)].map(m=>m[1]);ok(v.length===new Set(v).size,"Unique V16 element IDs in "+path);
}
const lecturer=read("lecturers.html"),admin=read("admin.html"),portal=read("portal.html");
ok(lecturer.indexOf('id="os-lecturer-suite"')>lecturer.indexOf('id="studio-workspace"')&&lecturer.indexOf('id="os-lecturer-suite"')<lecturer.indexOf('id="studio-more"'),"Faculty module is inside authenticated workspace");
ok(admin.indexOf('id="os-admin-suite"')>admin.indexOf('<main id="app" class="wrap hidden">')&&admin.indexOf('id="os-admin-suite"')<admin.indexOf("</main>"),"Admin tools inside existing gated admin area");
ok(admin.includes('data-tab="os-admin-suite"')&&admin.includes('class="panel card hidden os os-light"'),"Admin tab visibility follows existing admin gated panel logic");
ok(portal.indexOf('id="os-certificates-student"')>portal.indexOf('id="dashboardSection"')&&portal.indexOf('id="os-certificates-student"')<portal.indexOf("</main>"),"Certificate helper resides in student dashboard");
ok(portal.includes('id="claimCertificateForm"')&&portal.includes('id="studentCertificates"'),"Existing claims and registry records preserved");
ok(admin.includes('id="claimsBody"')&&admin.includes('id="certBody"'),"Existing admin certificate tools preserved");
ok(lecturer.includes('id="studio-record"')&&lecturer.includes('assets/js/lecturers.js'),"Existing authenticated faculty record editor remains");
const home=read("index.html");
ok(home.includes('id="academy-operations-v16"'),"Academy home promotes V16");
for(const link of ["lecturers.html#os-lecturer-suite","nabd-global-research.html#os-evidence-navigator","portal.html","admin.html"])ok(home.includes('href="'+link+'"'),"Missing V16 home link "+link);
ok(home.includes('id="human-universe-v11"')&&home.includes('id="ncore-home-academic"'),"Older educational and academic editions remain");
for(const path of Object.keys(pages))ok(existsSync(resolve(root,path)),"Referenced existing page missing: "+path);
console.log("NABD V16 integrity passed: "+n+" assertions.");
