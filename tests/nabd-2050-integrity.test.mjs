import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),".."),read=p=>readFileSync(resolve(root,p),"utf8");
const html=read("nabd-2050.html"),js=read("assets/js/nabd-2050.js"),css=read("assets/css/nabd-2050.css"),home=read("index.html");
let count=0;function check(cond,message){assert.ok(cond,message);count++}
new Script(js,{filename:"assets/js/nabd-2050.js"});count++;
check(html.includes('lang="ar"')&&html.includes('dir="rtl"'),"Arabic-first document");
check(html.includes('id="time-lab"')&&html.includes('id="ar-lab"')&&html.includes('id="journey"'),"Connected 2050 learning stages");
for(const id of ["scenario","scenarioTitle","phaseQuestion","phaseMap","choiceList","next","feedback","completion","export","modelMenu","loadModel","activateAR","modelReset","modelHost","modelPoster","modelSource","language"]){check(html.includes('id="'+id+'"'),"Missing interactive element: "+id)}
check(html.includes("نموذج")&&html.includes("لا تُدخل بيانات مرضى حقيقيين"),"Visible fiction and patient-privacy disclaimer");
check(html.includes("skill-passport.html")&&html.includes("atlas/clinical-hub.html")&&html.includes("research-starter-lab.html"),"Connect existing research, hospital and skills");
check(html.includes('assets/js/nabd-2050.js?v=1')&&html.includes('assets/css/nabd-2050.css?v=1'),"Versioned local scripts and styles");
check(js.includes("circulation:")&&js.includes("breathing:")&&js.includes("fluid:"),"Three unique scenarios");
check((js.match(/at:"T \+ 24"/g)||[]).length===3,"Four temporal phases per scenario with distinct later observations");
check(js.includes("root.history[root.step]={option:index,points:s.options[index][1]}"),"User choices influence calculated feedback");
check(js.includes("score:total()")&&js.includes("root.history.map"),"Practice report contains actual learner choices");
check(js.includes("anonymous_educational_practice")&&js.includes("Not a clinical evaluation, student record, or credential."),"Export is anonymous and not a credential"); // exact "not linked" may exist in html only; revise if needed
check(!/localStorage|sessionStorage|service_role|sb_secret_|SUPABASE_SERVICE_ROLE_KEY|\.from\(/i.test(js+html),"No account persistence, privileged keys or backend access");
check(js.includes('ar-modes","webxr scene-viewer quick-look')&&js.includes("canActivateAR")&&js.includes("activateAR()"),"AR only on supported devices");
check(js.includes("navigator.onLine===false")&&js.includes("resetViewer()"),"Offline and failed 3D fallback exists");
check(js.includes("model-viewer/4.1.0/model-viewer.min.js"),"Pinned known viewer library");
check((js.match(/cdn\.3dassets\.dev\/assets\//g)||[]).length>=6,"Reuse six CC0 educational meshes");
check(js.includes("setAttribute(")&&!js.includes("innerHTML"),"No unsanitized HTML interpolation from interaction data");
check(css.includes("@media(max-width:450px)")&&css.includes("prefers-reduced-motion"),"Responsive and reduced-motion accessible");
check(home.includes('id="nabd-future-2050"')&&home.includes('href="nabd-2050.html"'),"Homepage has an accessible Future Lab launch");
check(read("assets/js/nabd-signature.js").includes('"nabd-2050.html"'),"Shared global search knows Future Lab");
check(read("assets/js/nabd-campus-navigator.js").includes('"nabd-2050.html"'),"Cross-campus route finder knows Future Lab");
for(const url of ["infinity/","atlas/clinical-hub.html","learning/","skill-passport.html","atlas/heart-lab.html","research-starter-lab.html"])check(html.includes('href="'+url+'"'),"Missing existing connected learning route "+url);
for(const file of ["v11/art/heart-3d.svg","v11/art/lungs-3d.svg","v11/art/brain-3d.svg","v11/art/renal-3d.svg","v11/art/digestive-3d.svg","v11/art/musculoskeletal-3d.svg"])check(existsSync(resolve(root,file)),"Missing fallback anatomy image "+file);
console.log("NABD 2050 integrity: "+count+" checks passed");