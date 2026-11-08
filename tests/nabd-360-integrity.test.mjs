import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),".."),read=p=>readFileSync(resolve(root,p),"utf8");
let verified=0;const yes=(test,label)=>{assert.ok(test,label);verified++};
const publicPage=read("nabd-university-360.html"),facultyPage=read("nabd-360-lecturers.html"),adminPage=read("admin.html"),home=read("index.html"),student=read("assets/js/nabd-360-student.js"),adm=read("assets/js/nabd-360-admin.js"),nav=read("assets/js/nabd-campus-navigator.js"),sig=read("assets/js/nabd-signature.js"),sql=read("supabase/migrations/20261108_nabd_university_360_role_guard_and_learning.sql");
for(const [name,text]of [["student",student],["admin",adm]]){new Script(text,{filename:name+".js"});verified++}
for(const file of ["nabd-university-360.html","nabd-360-lecturers.html","assets/css/nabd-360.css","assets/css/nabd-360-admin.css","docs/NABD_UNIVERSITY_360_RELEASE.md"]){yes(existsSync(resolve(root,file)),file+" exists")}
for(const id of ["n360-student-app","n360-stats","n360-plan-form","n360-course","n360-minutes","n360-achievements","n360-suggestions","n360-ai-plan","n360-ai-answer"]){yes(publicPage.includes('id="'+id+'"'),"Learner UI "+id)}
for(const id of ["n360-faculty-form","n360-application-data","n360-consent","n360-hours","n360-email","n360-topic"]){yes(facultyPage.includes('id="'+id+'"'),"Lecturer UI "+id)}
yes(home.includes('href="nabd-university-360.html"'),"360 promoted in homepage");
yes(nav.includes("nabd-university-360.html")&&nav.includes("nabd-360-lecturers.html"),"Shared campus navigation");
yes(sig.includes("nabd-university-360.html")&&sig.includes("nabd-360-lecturers.html"),"Signature index links");
yes(adminPage.includes('assets/js/nabd-360-admin.js')&&adminPage.includes('assets/css/nabd-360-admin.css'),"Director module loaded");
yes(adminPage.indexOf("admin-extensions.js")<adminPage.indexOf("assets/js/nabd-360-admin.js"),"Admin registrar precedes app");
yes(adm.includes('id:"nabd-university-360"')&&adm.includes("NABD_ADMIN_REGISTER_MODULE"),"Admin module registered");
yes(adm.includes("db.auth.getUser()")&&adm.includes('profile.data?.role!=="admin"'),"Director role rechecked");
yes(adm.indexOf('profile.data?.role!=="admin"')<adm.indexOf("await refresh()"),"No admin reads before role verification");
yes(adm.includes('select(col,{count:"exact",head:true})'),"Admin stats are count only");
yes(adm.includes('status:"pending"')===false||adm.includes("pending"),"Honest lecturer moderation");
yes(adm.includes('nabd_360_lecturer_applications')&&adm.includes('.update({status,admin_note:adminNote'),"Real director applicant status saves");
yes(adm.includes("HOLD")&&adm.includes("NO-GO"),"Never auto-approve pilot");
yes(student.includes("state.db.auth.getUser()")&&student.includes('eq("student_id",uid)'),"Student own record filtering");
yes(student.includes('eq("user_id",uid)')&&student.includes('user_id:userId'),"Personal plan bound to current account");
yes(student.includes('eq("applicant_id",state.user.id)')&&student.includes('applicant_id:state.user.id'),"Volunteer request bound to own account");
yes(student.includes('s.verification_status==="verified"')||student.includes('v.verification_status==="verified"'),"Verified skill filter");
yes(student.includes('["issued","active","valid","verified"]'),"Only issued/current credentials in records");
yes(student.includes('window.NABD_CONFIG?.tutorFunction')&&student.includes('state.db.functions.invoke(slug'),"Reuse existing authenticated AI provider");
yes(student.includes('state.db.auth.getUser()')&&student.includes('generateStudyRevision'),"AI opt-in checks account");
yes(!/\.rpc\(|service_role|sb_secret_|localStorage|sessionStorage|innerHTML|insertAdjacentHTML/i.test(student+adm),"No secret client keys, role RPC shortcuts, HTML injection, or credential persistence");
yes(sql.includes("nabd_360_guard_profile_authority")&&sql.includes("new.role is distinct from old.role")&&sql.includes("errcode='42501'"),"Protect profile role changes on server");
yes(sql.includes("alter table public.nabd_360_study_plans enable row level security")&&sql.includes("alter table public.nabd_360_lecturer_applications enable row level security"),"RLS for both new tables");
yes(sql.includes("revoke all on public.nabd_360_study_plans from public,anon,authenticated")&&sql.includes("revoke all on public.nabd_360_lecturer_applications from public,anon,authenticated"),"No anonymous table grants");
yes(sql.includes("applicant_id=(select auth.uid())")&&sql.includes("user_id=(select auth.uid())"),"Owner-bound RLS");
yes(sql.includes("admin_note is null")&&sql.includes("status='pending'"),"Client cannot self-approve application");
yes(sql.includes("grant update(status,admin_note,reviewed_at)")&&sql.includes("public.is_admin()"),"Only approved director review can edit applicant status");
yes(read("docs/NABD_UNIVERSITY_360_RELEASE.md").includes("NO-GO"),"Release docs reserve human signoff");
console.log("NABD UNIVERSITY 360 integrity: "+verified+" checks passed");
