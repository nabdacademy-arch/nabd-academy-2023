import assert from "node:assert/strict";
import {readFileSync,existsSync,statSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
let passed=0;const check=(condition,message)=>{assert.ok(condition,message);passed++};
const js=read("assets/js/academic-core.js"),css=read("assets/css/academic-core.css");
new Script(js,{filename:"academic-core.js"});passed++;
check(css.includes(".ncore")&&css.includes(".ncore-home"),"Scoped style for both modules and homepage");
check(css.includes("@media(max-width:570px)")&&css.includes("prefers-reduced-motion"),"Mobile and reduced-motion CSS");
check(!/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage)\b/.test(js),"New app has no network uploads or browser persistence");
check(js.includes('nabd-global-research.html')&&js.includes('portal.html')&&js.includes('global-lectures.html'),"Actual academy pathways remain connected");
check((js.match(/\{area:"(?:base|research)"/g)||[]).length===8,"Eight learning checks implemented");
const pages={
"academy.html":["nc-route-query","nc-route-role","nc-route-grid","nc-route-count","nc-route-plan","nc-build-route","nc-route-empty"],
"nabd-campus.html":["nc-route-query","nc-route-role","nc-route-grid","nc-route-count","nc-route-plan","nc-build-route","nc-route-empty"],
"global-lectures.html":["nc-lecture-form","nc-lecture-track","nc-lecture-goal","nc-lecture-preview","nc-copy-lecture","nc-download-lecture","nc-lecture-status"],
"nabd-medical-knowledge.html":["nc-quiz","nc-quiz-filters","nc-quiz-question","nc-quiz-answers","nc-quiz-feedback","nc-quiz-next","nc-quiz-progress"]
};
for(const [path,ids] of Object.entries(pages)){
 const html=read(path);
 check(html.includes('assets/css/academic-core.css?v=1')&&html.includes('assets/js/academic-core.js?v=1'),path+" includes academic UI sources");
 for(const id of ids)check(html.includes('id="'+id+'"'),"Missing "+id+" on "+path);
 const found=[...html.matchAll(/\bid="(nc-[^"]+)"/g)].map(x=>x[1]);check(found.length===new Set(found).size,path+" has unique module IDs");
 check(html.includes('class="ncore"'),path+" has integrated substantive new module");
}
const home=read("index.html");
check(home.includes('id="ncore-home-academic"')&&home.includes('href="academy.html#academic-pathfinder"'),"Homepage exposes academy upgrades");
check(home.includes('href="global-lectures.html#lecture-workbench"')&&home.includes('href="nabd-medical-knowledge.html#knowledge-revision-lab"'),"Homepage links to real lecture and knowledge tools");
check(home.includes('id="human-universe-v11"')&&home.includes('id="nabd-unified-campus"'),"Existing important homepage portals remain intact");
check(read("global-lectures.html").includes("قيد الإعداد"),"Lecture programme makes no availability claim");
for(const path of ["portal.html","lecturers.html","skill-passport.html","research-starter-lab.html","nabd-global-research.html","application-status.html","nabd-partners.html","learning/index.html","atlas/index.html","infinity/index.html"])check(existsSync(resolve(root,path)),"Missing referenced service "+path);
console.log("NABD Academic Core integrity passed: "+passed+" assertions.");
