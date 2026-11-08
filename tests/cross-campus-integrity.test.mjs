import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
const nav=read("assets/js/nabd-campus-navigator.js");
const admin=read("assets/js/academic-readiness.js");
const signature=read("assets/js/nabd-signature.js");
let checks=0;
function check(value,msg){assert.ok(value,msg);checks++}
for(const [file,code] of [["nabd-campus-navigator.js",nav],["academic-readiness.js",admin],["nabd-signature.js",signature]]){new Script(code,{filename:file});checks++}
check(nav.includes('new URL(x[6],siteRoot)')&&nav.includes('new URL("../../",D.currentScript.src)'),"Nested page routing resolves against actual site root");
check(nav.includes('aria-modal')&&nav.includes('e.key==="Escape"'),"Keyboard dismissal and accessible dialog");
check(nav.includes('search.addEventListener("input",render)'),"All destination cards are actually searchable");
check(!/localStorage|service_role|sb_secret_|getUser|\.from\(/.test(nav),"Public navigator does not read account records or embed secrets");
for(const file of ["assets/css/nabd-campus-navigator.css","assets/css/academic-readiness.css"])check(existsSync(resolve(root,file)),"Missing scoped stylesheet: "+file);
for(const path of ["portal.html","university-os.html","nabd-campus.html","academy.html","lecturers.html","skill-passport.html","learning/","atlas/index.html","infinity/","nabd-medical-knowledge.html","global-lectures.html","nabd-global-research.html","research-starter-lab.html","research-office.html","admin.html","executive-application.html","application-status.html","nabd-partners.html","policies.html"]){
 check(nav.includes('"'+path+'"')||signature.includes('"'+path+'"'),"No cross-campus route "+path);
}
for(const path of ["admin.html","university-os.html","nabd-global-research.html","research-starter-lab.html","research-office.html","nabd-v10.html","nabd-ai-executive.html"]){
 const html=read(path);
 check(/assets\/js\/nabd-campus-navigator\.js\?v=\d+/.test(html)&&html.includes('assets/css/nabd-campus-navigator.css?v=1'),"Navigator missing from "+path);
}
for(const path of ["atlas/index.html","learning/index.html","infinity/index.html"]){
 const html=read(path);
 check(/\.\.\/assets\/js\/nabd-campus-navigator\.js\?v=\d+/.test(html)&&html.includes('../assets/css/nabd-campus-navigator.css?v=1'),"Nested navigator missing from "+path);
}
for(const path of ["index.html","academy.html","portal.html","lecturers.html","nabd-campus.html","campus.html","global-lectures.html","skill-passport.html","nabd-partners.html"]){
 check(read(path).includes("assets/js/nabd-signature.js"),"Shared signature router missing from "+path);
}
const adminPage=read("admin.html");
check(adminPage.includes("assets/js/academic-readiness.js")&&adminPage.includes("assets/css/academic-readiness.css"),"Administrative readiness monitor wired");
check(admin.includes('window.NABD_ADMIN_REGISTER_MODULE')&&admin.includes('profile.data?.role!=="admin"'),"Administrative monitor checks verified role");
check(admin.includes('{count:"exact",head:true}')&&admin.includes('nabd_os_exam_questions'),"Read-only real SQL aggregate monitoring");
check(!/\.insert\(|\.update\(|\.upsert\(|\.delete\(/.test(admin),"Academic monitor must not write production data");
check(!/service_role|sb_secret_|SUPABASE_SERVICE_ROLE_KEY/i.test(admin+nav),"No privileged keys on public pages");
check(signature.includes('"university-os.html"')&&signature.includes('"nabd-global-research.html"'),"Existing command palette expanded without duplication");
console.log("NABD Cross-Campus: "+checks+" integrity checks passed");