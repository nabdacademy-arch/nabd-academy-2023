import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
const dir=resolve(dirname(fileURLToPath(import.meta.url)),".."),read=x=>readFileSync(resolve(dir,x),"utf8");
const admin=read("admin.html"),panel=read("assets/js/nabd-launch-gate.js"),css=read("assets/css/nabd-launch-gate.css"),extensions=read("admin-extensions.js"),docs=read("docs/NABD_FINAL_LAUNCH_2026-11-08.md");
let checks=0;function check(ok,why){assert.ok(ok,why);checks++}
new Script(panel,{filename:"nabd-launch-gate.js"});checks++;
check(admin.includes("assets/js/nabd-launch-gate.js?v=1"),"Admin must load launch gate script");
check(admin.includes("assets/css/nabd-launch-gate.css?v=1"),"Admin must load launch styles");
check(admin.indexOf("admin-extensions.js")<admin.indexOf("assets/js/nabd-launch-gate.js"),"Module registrar precedes launch module");
check(extensions.includes("window.NABD_ADMIN_REGISTER_MODULE")&&extensions.includes("panel.dispatchEvent"),"Use existing secured admin module framework");
check(panel.includes('id:"launch-readiness"')&&panel.includes("NABD FINAL LAUNCH"),"Director launch tab registered");
check(panel.includes("db.auth.getUser()"),"Verify identity from server");
check(panel.includes('db.from("profiles").select("role").eq("id",user.id).maybeSingle()'),"Role proof via RLS");
check(panel.includes('profile.data?.role!=="admin"'),"Only verified admin may see counts");
check(panel.indexOf('profile.data?.role!=="admin"')<panel.indexOf("Promise.allSettled(nodes.map"),"No privileged table reads before authorisation");
check(panel.includes('{count:"exact",head:true}'),"Count-only reads");
check(panel.includes('db.from(n.table).select(n.column'),"DB client uses RLS and no broad row reads");
check(!/\.(insert|update|delete|upsert)\s*\(|\.rpc\s*\(|service_role|sb_secret_|functions\.invoke|\.storage\.from/i.test(panel),"No writes, privileged keys or tutor calls");
check(!/localStorage|sessionStorage|indexedDB|document\.cookie|innerHTML/i.test(panel),"No browser persistence or HTML injection");
check(panel.includes('status:"HOLD_FOR_VERIFICATION"')||panel.includes('overall:"HOLD_FOR_VERIFICATION"'),"Never claim automatic ready status");
check(panel.includes('pending_human_review'),"Manual sign-off cannot be silently passed");
check(panel.includes("Number.isInteger")&&panel.includes("null"),"Unknown count distinct from missing records");
check(panel.includes('anonymous readiness JSON')||panel.includes("nabd-final-launch-readiness.json"),"Export anonymous structured status");
check(panel.includes("uiLang=")&&panel.includes("Switch report language"),"Bilingual language toggle");
check(css.includes("max-width:650px")&&css.includes("focus-visible"),"Responsive accessibility");
check(docs.includes("NO-GO")&&docs.includes("MEDVERSE_CONTENT_REVIEW.md")&&docs.includes("Supabase"),"Release runbook honest about blockers");
for(const entry of ["courses","enrollments","nabd_os_faculty_assignments","nabd_os_course_modules","nabd_os_exams","nabd_os_exam_questions","nabd_skill_catalog","nabd_global_sessions"]){check(panel.includes('"'+entry+'"'),"Missing real table: "+entry)}
for(const route of ["academy.html","university-os.html","skill-passport.html","global-lectures.html","index.html#verify","policies.html"]){check(panel.includes('"'+route+'"'),"Missing real workspace route: "+route)}
check(existsSync(resolve(dir,"docs/MEDVERSE_CONTENT_REVIEW.md")),"Clinical review guide exists");
console.log("NABD FINAL LAUNCH gate integrity: "+checks+" checks passed");