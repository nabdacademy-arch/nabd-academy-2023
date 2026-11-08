import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),".."),read=p=>readFileSync(resolve(root,p),"utf8");
const html=read("nabd-science-immune.html"),js=read("assets/js/nabd-science-immune.js"),css=read("assets/css/nabd-science-immune.css"),sql=read("supabase/migrations/20261108150000_nabd_science_immune_workflow_v1.sql"),home=read("index.html"),admin=read("admin.html"),sig=read("assets/js/nabd-signature.js"),nav=read("assets/js/nabd-campus-navigator.js");
const check=(ok,note)=>{assert.ok(ok,note);return 1};let n=0;
new Script(js);n++;
for(const path of ["nabd-science-immune.html","assets/css/nabd-science-immune.css","assets/js/nabd-science-immune.js","docs/NABD_SCIENCE_IMMUNE_RELEASE.md"]){n+=check(existsSync(resolve(root,path)),path)}
for(const id of ["nsi-list","nsi-status","nsi-admin","nsi-admin-status","nsi-form","nsi-impact-form","nsi-queue","nsi-audit","nsi-count-changes","nsi-count-pending","nsi-lang"]){n+=check(html.includes('id="'+id+'"'),id)}
n+=check(html.includes('data-ar="')&&html.includes('data-en="'),"Bilingual markup");
n+=check(js.includes("auth.getUser()")&&js.includes('select("role")')&&js.includes('==="admin"'),"Verified server-account/admin role");
n+=check(js.includes("textContent")&&!js.includes("innerHTML")&&!js.includes("insertAdjacentHTML"),"Untrusted content not injected as HTML");
n+=check(js.includes("status")==true&&js.includes("source_url")&&js.includes("nsi_events"),"Review, citations and audit connected");
n+=check(js.includes("window.confirm")===false&&js.includes("confirm("),"Explicit reviewer confirmation");
n+=check(!/service_role|SUPABASE_SERVICE_ROLE|sb_secret_|localStorage|sessionStorage/.test(js),"No private credentials or sensitive browser storage");
for(const table of ["nsi_changes","nsi_impacts","nsi_events"]){n+=check(sql.includes("alter table public."+table+" enable row level security"),"RLS "+table);n+=check(sql.includes("revoke all on public.")||sql.includes("revoke all on sequence public."),"Deny initial defaults");}
n+=check(sql.includes("status='published' or (select public.is_admin())"),"Only published notices visible to public");
n+=check(sql.includes("nsi_changes_admin_insert")&&sql.includes("created_by=(select auth.uid())"),"Admin-only creation with owner check");
n+=check(sql.includes("nsi_published_review")&&sql.includes("Human review is required before publication."),"Publication needs human review");
n+=check(sql.includes("nsi_audit_changes")&&sql.includes("nsi_audit_impacts"),"Server-side append-only audit trail");
n+=check(!/grant (?:all|insert|update|delete)[^;\n]* to anon/i.test(sql),"No anonymous modifications");
n+=check(html.includes("nabd-science-immune.js")&&html.includes("nabd-science-immune.css"),"Assets loaded");
n+=check(home.includes('id="nsi-home"')&&home.includes('href="nabd-science-immune.html"'),"Homepage flagship");
n+=check(admin.includes('nabd-science-immune.html#nsi-admin'),"Director launcher");
n+=check(sig.includes('["nabd-science-immune.html"'),"Site-wide navigation");
n+=check(nav.includes('"science-immune"'),"Campus search integration");
n+=check(css.includes("@media(max-width:680px)")&&css.includes("prefers-reduced-motion"),"Responsive and motion-safe styles");
console.log("NABD Science Immune integrity: "+n+" assertions passed");
