import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
const html=read("nabd-one.html"),con=read("nabd-connect.html"),home=read("index.html"),admin=read("admin.html");
const publicJs=read("assets/js/nabd-one-public.js"),connectJs=read("assets/js/nabd-connect.js"),adminJs=read("assets/js/nabd-one-admin.js"),bot=read("assets/js/nabd-assistant.js");
const sql=read("supabase/migrations/20261108_nabd_one_connect_secure_tickets_v1.sql");
let total=0;function check(value,message){assert.ok(value,message);total++}
for(const [name,script] of [["public hub",publicJs],["student inbox",connectJs],["director console",adminJs],["smart messenger",bot]]){
 new Script(script,{filename:name});total++
}
for(const id of ["one-course-list","one-live-list","one-live-status","one-course-status","one-lang","one-courses","one-ai","one-quality"])
 check(html.includes('id="'+id+'"'),"NABD ONE hub missing "+id);
for(const id of ["nc-auth-message","nc-app","nc-list","nc-create","nc-category","nc-subject","nc-body","nc-thread-title","nc-messages","nc-reply-form","nc-reply","nc-status"])
 check(con.includes('id="'+id+'"'),"NABD CONNECT missing "+id);
check(html.includes('data-one-page="hub"')&&con.includes('data-one-page="connect"'),"Pages mount independent modules");
check(home.includes('id="nabd-one-home"')&&home.includes('href="nabd-one.html"')&&home.includes('href="nabd-connect.html"'),"Real homepage routes");
check(admin.includes("assets/js/nabd-one-admin.js")&&admin.includes("assets/css/nabd-one-admin.css"),"Director console wired");
check(admin.indexOf("admin-extensions.js")<admin.indexOf('assets/js/nabd-one-admin.js'),"Administrator plugin register executes first");
check(adminJs.includes('window.NABD_ADMIN_REGISTER_MODULE')&&adminJs.includes('id:"nabd-one-operations"'),"Shared admin framework registers the console");
check(adminJs.includes("db.auth.getUser()")&&adminJs.includes('profile.data?.role!=="admin"'),"Verified director role");
check(adminJs.indexOf('profile.data?.role!=="admin"')<adminJs.indexOf("await refresh()"),"No director inbox reads before role validation");
check(adminJs.includes('S.db.from("nabd_support_messages").insert')&&adminJs.includes('S.db.from("nabd_support_tickets").update'),"Actual reply and ticket update");
check(adminJs.includes('status:"draft"')&&adminJs.includes('status:"published"')&&adminJs.includes("confirm("),"Lecture creation uses draft/explicit approval");
check(adminJs.includes("scheduled_at:date.toISOString()")&&adminJs.includes("Number.isFinite(date.getTime())"),"Validates real dates");
check(adminJs.includes('window.NABD_CONFIG.tutorFunction')&&adminJs.includes('.functions.invoke'),"AI probe reuses backend");
check(connectJs.includes('S.db.auth.getUser()')&&connectJs.includes('student_id:S.user.id'),"Student session ownership enforced");
check(connectJs.includes('"nabd_support_tickets"')&&connectJs.includes('"nabd_support_messages"'),"Private real DB tables");
check(connectJs.includes(".insert(")&&connectJs.includes('loadTickets(newId)'),"Actual ticket is persisted and accessible");
check(connectJs.includes("textContent")&&!connectJs.includes("innerHTML"),"Student content rendered as text");
check(adminJs.includes("textContent")&&!adminJs.includes("innerHTML"),"Staff content rendered as text");
check(!/localStorage|sessionStorage|service_role|sb_secret_|\.rpc\(/i.test(connectJs+adminJs+publicJs),"No browser secret key, local chat history or privileged RPC");
check(publicJs.includes('"published"')&&publicJs.includes('new Date().toISOString()'),"Live calendar filters only published future sessions");
check(publicJs.includes('"nabd_global_session_signups"')&&publicJs.includes("db.auth.getUser"),"Authenticated RSVP");
check(bot.includes('"nb-chat-connect"')&&bot.includes('"nabd-connect.html"'),"Messenger opens real support portal");
for(const file of ["assets/css/nabd-one.css","assets/css/nabd-one-admin.css","docs/NABD_ONE_RELEASE_2026-11-08.md"])
 check(existsSync(resolve(root,file)),file+" exists");
check(sql.includes("enable row level security")&&sql.includes("revoke all")&&sql.includes("anon,authenticated"),"New support tables have strict RLS and grants");
check(sql.includes("student_id=(select auth.uid())")&&sql.includes("sender_id=(select auth.uid())"),"Ownership and sender policies");
check(sql.includes("status='open'")&&sql.includes("t.status<>'resolved'"),"Student ticket state protections");
check(!/grant all .* to anon/i.test(sql),"No anonymous support access");
check(read("assets/js/nabd-campus-navigator.js").includes('nabd-one.html')&&read("assets/js/nabd-signature.js").includes('nabd-connect.html'),"Global navigator routes both new spaces");
check(read("docs/NABD_ONE_RELEASE_2026-11-08.md").includes("No staffed live chat"),"Release documentation avoids false claims");
console.log("NABD ONE integrity: "+total+" checks passed");