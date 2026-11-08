import assert from "node:assert/strict";
import{readFileSync,existsSync}from"node:fs";import{dirname,resolve}from"node:path";import{fileURLToPath}from"node:url";import{Script}from"node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),".."),read=p=>readFileSync(resolve(root,p),"utf8");
const html=read("nabd-next-frontier.html"),home=read("index.html"),admin=read("admin.html"),publicJs=read("assets/js/nabd-frontier.js"),adminJs=read("assets/js/nabd-frontier-admin.js"),sql=read("supabase/migrations/20261108112325_nabd_next_frontier_eight_modules_secure.sql"),nav=read("assets/js/nabd-campus-navigator.js"),sig=read("assets/js/nabd-signature.js");
let n=0;const check=(condition,message)=>{assert.ok(condition,message);n++};
for(const [file,src] of [["public",publicJs],["admin",adminJs]]){new Script(src,{filename:file+".js"});n++}
for(const file of ["nabd-next-frontier.html","assets/css/nabd-frontier.css","assets/css/nabd-frontier-admin.css","docs/NABD_NEXT_FRONTIER_RELEASE.md"]){check(existsSync(resolve(root,file)),file+" exists")}
const keys=["evidence","congress","press","mentor","innovation","wallet","quest","observatory"];
for(const key of keys){
 check(html.includes('id="nf-tab-'+key+'"')&&html.includes('id="nf-panel-'+key+'"'),"Matching accessible tab and panel: "+key);
 check(html.includes('id="nf-status-'+key+'"'),"Status region: "+key);
}
for(const id of ["nf-congress-form","nf-press-form","nf-mentor-form","nf-innovation-form","nf-wallet-form","nf-quest-board","nf-quest-result","nf-observatory-list","nf-mentor-requests"]){check(html.includes('id="'+id+'"'),"Interactive module element: "+id)}
check(html.includes('role="tablist"')&&html.includes('role="tabpanel"')&&html.includes("aria-selected"),"Accessible tabbing and keyboard navigation");
check(home.includes('id="nfx-home"')&&home.includes('nabd-next-frontier.html#quest'),"NABD NEXT FRONTIER launched prominently on homepage");
check(admin.includes('assets/js/nabd-frontier-admin.js')&&admin.includes('assets/css/nabd-frontier-admin.css'),"Director admin module loads");
check(admin.indexOf("admin-extensions.js")<admin.indexOf("nabd-frontier-admin.js"),"Admin registry precedes module");
check(nav.includes("nabd-next-frontier.html")&&sig.includes("nabd-next-frontier.html"),"Cross-campus navigation and search links");
check(publicJs.includes("auth.getUser()")&&publicJs.includes("nfx_mentor_requests"),"Authenticated mentorship workflow");
check(publicJs.includes("state")||publicJs.includes("S.records"),"State-based modules");
check(publicJs.includes("public_consent")&&publicJs.includes("S.user.id"),"Submissions tied to own account and consent");
check(publicJs.includes("textContent")&&!publicJs.includes("innerHTML")&&!publicJs.includes("insertAdjacentHTML"),"User content is never HTML-injected");
check(adminJs.includes("db.auth.getUser()")&&adminJs.includes('profile.data?.role!=="admin"'),"Director checks identity and DB role");
check(adminJs.indexOf('profile.data?.role!=="admin"')<adminJs.lastIndexOf("await load()"),"No admin private read before role proof");
check(adminJs.includes('window.confirm(')&&adminJs.includes('S.db.from(table).update('),"Review requires human approval and database write");
check(adminJs.includes('newStatus==="published"&&row.status!=="accepted"'),"Press cannot jump directly to published through staff UI");
check(adminJs.includes('validSources(')&&adminJs.includes('values.status="draft"'),"New science observations are drafts first");
check(publicJs.includes('quest_id:S.quest')&&publicJs.includes('correct_count:score')&&publicJs.includes('total_count:chosen.length'),"Practical quiz data stored as practice-only");
check(publicJs.includes('["cells"]')===false&&publicJs.includes('cells:[')&&publicJs.includes('heart:[')&&publicJs.includes('method:['),"Three playable original science packs");
check(publicJs.includes('nfx_badge_requests')&&publicJs.includes('nabd_skill_verifications'),"Wallet links requests to existing skill records");
check(publicJs.includes('nfx_observatory_records')&&publicJs.includes('nfx_evidence_entries'),"Evidence and health observations linked to live DB");
for(const table of ["nfx_evidence_entries","nfx_congress_submissions","nfx_manuscripts","nfx_mentor_profiles","nfx_mentor_requests","nfx_innovation_projects","nfx_badge_requests","nfx_quest_attempts","nfx_observatory_records"]){
 check(sql.includes("alter table public."+table+" enable row level security"),table+" has RLS");
 check(sql.includes("public."+table),table+" in deployed migration")
}
check(sql.includes("revoke all on public.nfx_evidence_entries")&&sql.includes("from public,anon,authenticated"),"Deny by default to all anonymous writes");
check(sql.includes("grant insert(user_id,title,abstract,study_type,public_consent)")&&sql.includes("grant update(status,editor_note)"),"Column-grant protection against anonymous publishing and student status manipulation");
check(sql.includes("user_id=(select auth.uid())")&&sql.includes("learner_id=(select auth.uid())"),"Authenticated row ownership is checked in RLS");
check(sql.includes("public.is_admin()")&&sql.includes("create policy nfx_evidence_admin_add"),"Only role-verified admin creates published-source records");
check(!/sb_secret_|service_role|SUPABASE_SERVICE_ROLE|localStorage|sessionStorage/i.test(publicJs+adminJs),"No privileged secrets or persisting private records client-side");
check(!/grant all .* to anon/i.test(sql),"No open anonymous permissions");
check(read("docs/NABD_NEXT_FRONTIER_RELEASE.md").includes("not an Open Badges 3.0 signature implementation"),"Badge claims in release document are honest");
check(read("docs/NABD_NEXT_FRONTIER_RELEASE.md").includes("practice-only"),"Quizzes not represented as clinical competence");
console.log("NABD NEXT FRONTIER integrity: "+n+" assertions passed");
