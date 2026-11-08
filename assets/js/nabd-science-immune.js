/* NABD SCIENCE IMMUNE V1 — human review, RLS authoritative, no automatic medical edits. */
(()=>{"use strict";
const $=id=>document.getElementById(id),K={ar:"ar",en:"en"},S={lang:"ar",db:null,user:null,admin:false,changes:[],impacts:[],adminChanges:[],adminImpacts:[],events:[],loaded:false,busy:false};
const tr=(ar,en)=>S.lang==="ar"?ar:en,element=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n};
const fmt=v=>{const x=new Date(v);return Number.isFinite(x.valueOf())?new Intl.DateTimeFormat(S.lang==="ar"?"ar":"en",{dateStyle:"medium"}).format(x):"—"};
const urlOk=u=>typeof u==="string"&&/^https:\/\/[^<>"\s]+$/i.test(u)&&u.length<=600;
const pathOk=p=>typeof p==="string"&&p.length>=5&&p.length<=260&&/^[a-z0-9_-]+(\/[a-z0-9_-]+)*(\.html)?(#[a-z0-9_-]+)?$/.test(p)&&!p.includes("..");
const states={draft:["مسودة","Draft"],review:["قيد المراجعة","Under review"],published:["منشور بعد المراجعة","Verified and published"],withdrawn:["مسحوب","Withdrawn"]};
const fixes={needs_review:["يلزم فحص المادة","Needs review"],revised:["رُوجعت المادة","Reviewed"],retired:["أُحيلت للتقاعد","Retired"],unaffected:["لم تتأثر","Unaffected"]};
const priorities={review:["مراجعة دورية","Routine"],significant:["أهمية مرتفعة","Significant"],urgent:["مراجعة عاجلة","Urgent"]};
function msg(id,ar,en,bad=false){const n=$(id);if(n){n.textContent=tr(ar,en);n.classList.toggle("bad",bad)}}
function empty(parent,ar,en){parent.append(element("p","nsi-empty",tr(ar,en)))}
function badge(t,cls=""){return element("span","nsi-badge "+cls,t)}
function toggleLanguage(){document.documentElement.lang=S.lang;document.documentElement.dir=S.lang==="ar"?"rtl":"ltr";$("nsi-lang").textContent=tr("EN","عربي");document.querySelectorAll("[data-ar][data-en]").forEach(n=>{n.textContent=n.dataset[S.lang]});if(S.loaded)drawPublic();if(S.admin)drawAdmin()}
function safeLink(url,label){if(!urlOk(url))return null;const a=element("a","",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
function routeLink(path,label){if(!pathOk(path))return null;const a=element("a","",label);a.href=new URL(path,location.href).href;return a}
async function query(q){try{const r=await q;return r.error?null:r.data||[]}catch{return null}}
async function publicLoad(){
 if(!S.db){msg("nsi-status","تعذر الاتصال بقاعدة البيانات، لا يمكن تأكيد عدد السجلات.","No database connection; records cannot be verified.",true);return}
 const [c,i]=await Promise.all([
  query(S.db.from("nsi_changes").select("id,title_ar,title_en,topic,previous_claim,current_evidence,source_title,source_url,source_date,severity,status,review_note,reviewed_at,created_at").eq("status","published").order("created_at",{ascending:false}).limit(80)),
  query(S.db.from("nsi_impacts").select("id,change_id,resource_kind,resource_title,resource_path,action_status").order("created_at",{ascending:false}).limit(250))
 ]);
 if(!c||!i){msg("nsi-status","تعذر التحقق من بيانات النشر؛ يرجى المحاولة لاحقًا.","Unable to verify the published data.",true);return}
 S.changes=c;S.impacts=i;S.loaded=true;msg("nsi-status","عرض التنبيهات التي اعتمدها مراجع بشري فقط.","Showing human-reviewed published notices only.");drawPublic();
}
function drawPublic(){
 if(!S.loaded)return;const host=$("nsi-list");host.replaceChildren();const published=S.changes.filter(x=>x.status==="published"),impacts=S.impacts.filter(x=>published.some(c=>c.id===x.change_id));
 $("nsi-count-changes").textContent=published.length;$("nsi-count-impacts").textContent=impacts.length;$("nsi-count-pending").textContent=impacts.filter(x=>x.action_status==="needs_review").length;
 if(!published.length){empty(host,"لا توجد تنبيهات علمية منشورة بعد. تراجع الإدارة المصادر قبل الإتاحة.","No verified change notices published yet. Staff must review sources first.");return}
 published.forEach(c=>{
  const card=element("article","nsi-notice"),header=element("div","nsi-notice-head");header.append(element("h3","",tr(c.title_ar,c.title_en)),badge(tr(...(priorities[c.severity]||priorities.review)),c.severity));card.append(header);
  card.append(element("small","",c.topic+" · "+tr("تاريخ المصدر: ","Source date: ")+fmt(c.source_date)));
  const cols=element("div","nsi-evidence-grid");
  [[tr("الصياغة السابقة","Previous teaching"),c.previous_claim],[tr("الأدلة الحالية","Current evidence"),c.current_evidence]].forEach(([title,text])=>{const n=element("div");n.append(element("strong","",title),element("p","",text));cols.append(n)});card.append(cols);
  card.append(element("p","",tr("تعليل المراجع: ","Reviewer rationale: ")+c.review_note));const original=safeLink(c.source_url,tr("المصدر الأصلي: ","Original source: ")+c.source_title);if(original)card.append(original);
  card.append(element("small","",tr("تاريخ الاعتماد: ","Reviewed: ")+fmt(c.reviewed_at)));
  const block=element("div","nsi-impact-list");block.append(element("h4","",tr("المواد التعليمية المتأثرة","Affected learning resources")));const related=impacts.filter(x=>x.change_id===c.id);
  if(!related.length)block.append(element("small","",tr("لا توجد روابط مواد متاحة.","No resource mappings available.")));
  related.forEach(i=>{const row=element("div","nsi-impact-item"),a=routeLink(i.resource_path,i.resource_title);row.append(a||element("span","",i.resource_title),badge(tr(...(fixes[i.action_status]||[i.action_status,i.action_status]))));block.append(row)});card.append(block);host.append(card)
 });
}
async function adminLoad(){
 if(!S.db||!S.admin)return;
 const [c,i,e]=await Promise.all([
  query(S.db.from("nsi_changes").select("*").order("created_at",{ascending:false}).limit(100)),
  query(S.db.from("nsi_impacts").select("*").order("created_at",{ascending:false}).limit(250)),
  query(S.db.from("nsi_events").select("id,change_id,entity,entity_id,action,old_state,new_state,happened_at").order("happened_at",{ascending:false}).limit(80))
 ]);
 if(!c||!i||!e){msg("nsi-admin-status","تعذر جلب قائمة القرارات أو السجل.","Failed to verify the review queue or audit trail.",true);return}
 S.adminChanges=c;S.adminImpacts=i;S.events=e;msg("nsi-admin-status","حساب الإدارة مؤكد؛ لا يتم النشر دون مراجعة بشرية.","Administrator verified; publishing requires human review.");drawAdmin();
}
function drawAdmin(){
 if(!S.admin)return;
 const select=$("nsi-change-select"),selected=select.value;select.replaceChildren();const first=element("option","",tr("اختر السجل","Select a notice"));first.value="";select.append(first);
 S.adminChanges.forEach(c=>{const x=element("option","",tr(c.title_ar,c.title_en)+" · "+tr(...states[c.status]));x.value=c.id;select.append(x)});if(S.adminChanges.some(c=>c.id===selected))select.value=selected;
 const queue=$("nsi-queue");queue.replaceChildren();if(!S.adminChanges.length)empty(queue,"لا توجد مسودات بعد.","No draft notices yet.");
 S.adminChanges.forEach(c=>{
  const card=element("article","nsi-queue-card");card.append(element("h4","",tr(c.title_ar,c.title_en)),element("small","",c.topic+" · "+tr(...states[c.status])+" · "+c.source_title));
  const related=S.adminImpacts.filter(x=>x.change_id===c.id);card.append(element("p","",tr("الموارد المرتبطة: ","Mapped resources: ")+related.length));
  related.forEach(item=>{
   const wrap=element("div","nsi-review-controls");wrap.append(element("small","",item.resource_title+" · "+item.resource_path));
   const status=element("select");status.setAttribute("aria-label",tr("حالة مراجعة المادة","Resource review status"));Object.entries(fixes).forEach(([value,labels])=>{const o=element("option","",tr(...labels));o.value=value;status.append(o)});status.value=item.action_status;wrap.append(status);
   const note=element("textarea");note.value=item.action_note||"";note.placeholder=tr("اكتب توثيق القرار.","Record a review rationale.");wrap.append(note);
   const b=element("button","nsi-btn nsi-outline",tr("حفظ حالة المادة","Save resource status"));b.type="button";b.addEventListener("click",()=>saveImpact(item,status.value,note.value,b));wrap.append(b);card.append(wrap);
  });
  if(c.status!=="withdrawn"){
   const controls=element("div","nsi-review-controls"),note=element("textarea");note.placeholder=tr("تعليل علمي من المراجع، 20 حرفًا على الأقل قبل النشر","Human reviewer rationale: 20+ characters required to publish");note.value=c.review_note||"";controls.append(note);
   const next=c.status==="draft"?["review",tr("إرسال للمراجعة","Mark for review")]:c.status==="review"?["published",tr("اعتماد ونشر","Approve and publish")]:["withdrawn",tr("سحب النشر","Withdraw publication")];
   const b=element("button","nsi-btn "+(next[0]==="published"?"nsi-primary":"nsi-outline"),next[1]);b.type="button";b.addEventListener("click",()=>saveChange(c,next[0],note.value,b));controls.append(b);card.append(controls)
  }queue.append(card);
 });
 const log=$("nsi-audit");log.replaceChildren();if(!S.events.length)empty(log,"لم تسجل تغييرات بعد.","No audit events recorded yet.");
 S.events.forEach(e=>{const item=element("div","nsi-audit-item");item.append(element("strong","",e.entity+" · "+e.action),element("div","",(e.old_state||"—")+" → "+(e.new_state||"—")),element("small","",fmt(e.happened_at)+" · "+String(e.entity_id).slice(0,8)));log.append(item)});
}
async function write(table,work,button){
 if(S.busy)return;S.busy=true;button.disabled=true;
 try{const result=await work;if(result.error)throw result.error;msg("nsi-admin-status","تم تأكيد العملية في قاعدة البيانات.","Server confirmed the operation.");await Promise.all([adminLoad(),publicLoad()]);return true}
 catch{msg("nsi-admin-status","لم يتم تأكيد العملية؛ تحقق من الصلاحيات والقواعد.","Operation not confirmed; check server permissions and guards.",true);return false}
 finally{S.busy=false;button.disabled=false}
}
function saveChange(c,status,note,button){
 if(!S.admin||!S.user||S.busy)return;
 const payload={status};
 if(status==="published"){
  if(note.trim().length<20){msg("nsi-admin-status","تعليل علمي لا يقل عن 20 حرفًا مطلوب.","Detailed reviewer rationale (20+ characters) required.",true);return}
  if(!S.adminImpacts.some(x=>x.change_id===c.id)){msg("nsi-admin-status","اربط على الأقل مادة تعليمية واحدة قبل النشر.","Map at least one teaching resource before publishing.",true);return}
  if(!confirm(tr("هل تحققت من المصدر والمواد المتأثرة قبل النشر؟","Have you checked the source and affected materials?")))return;
  Object.assign(payload,{review_note:note.trim(),reviewed_by:S.user.id,reviewed_at:new Date().toISOString()})
 }
 if(status==="withdrawn"&&!confirm(tr("هل تريد سحب التنبيه من العرض العام؟","Withdraw this public notice?")))return;
 void write("nsi_changes",S.db.from("nsi_changes").update(payload).eq("id",c.id).eq("status",c.status).select("id,status").maybeSingle(),button)
}
function saveImpact(item,status,note,button){
 if(!S.admin||S.busy||!Object.hasOwn(fixes,status))return;
 if(status!=="needs_review"&&note.trim().length<20){msg("nsi-admin-status","أضف مبررًا للتحديث (20 حرفًا).","Provide a 20-character reviewer note.",true);return}
 void write("nsi_impacts",S.db.from("nsi_impacts").update({action_status:status,action_note:note.trim(),reviewed_at:status==="needs_review"?null:new Date().toISOString()}).eq("id",item.id).select("id").maybeSingle(),button)
}
async function submit(e,kind){
 e.preventDefault();if(!S.admin||!S.db||S.busy||!S.user)return;
 const form=e.currentTarget,values=Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,String(v).trim()]));
 if(kind==="change"&&!urlOk(values.source_url)){msg("nsi-admin-status","مصدر HTTPS غير صالح.","A valid HTTPS source is required.",true);return}
 if(kind==="impact"&&!pathOk(values.resource_path)){msg("nsi-admin-status","استخدم مسار صفحة من داخل نبض فقط، مثل atlas/index.html.","Use a safe local route such as atlas/index.html.",true);return}
 const button=form.querySelector("button[type=submit]");
 if(kind==="change"){
  if(!values.evidence_source_id)delete values.evidence_source_id;
  if(!values.next_review_on)delete values.next_review_on;
  values.created_by=S.user.id;values.status="draft"
 }else{if(!S.adminChanges.some(c=>c.id===values.change_id)){msg("nsi-admin-status","اختر سجلًا موجودًا.","Select an existing notice.",true);return}values.action_status="needs_review"}
 if(await write(kind==="change"?"nsi_changes":"nsi_impacts",S.db.from(kind==="change"?"nsi_changes":"nsi_impacts").insert(values).select("id").single(),button))form.reset()
}
async function start(){
 $("nsi-lang").addEventListener("click",()=>{S.lang=S.lang==="ar"?"en":"ar";toggleLanguage()});
 $("nsi-form").addEventListener("submit",e=>submit(e,"change"));
 $("nsi-impact-form").addEventListener("submit",e=>submit(e,"impact"));
 if(!window.supabase?.createClient||!window.NABD_CONFIG?.supabaseUrl||!window.NABD_CONFIG?.supabaseAnonKey){msg("nsi-status","الاتصال بقاعدة البيانات غير مهيأ.","Database is not configured.",true);return}
 try{
  S.db=window.supabase.createClient(window.NABD_CONFIG.supabaseUrl,window.NABD_CONFIG.supabaseAnonKey);
  const res=await S.db.auth.getUser();S.user=res.error?null:res.data?.user||null;
  if(S.user){
   const profile=await S.db.from("profiles").select("role").eq("id",S.user.id).maybeSingle();
   S.admin=!profile.error&&profile.data?.role==="admin";
  }
  $("nsi-admin").hidden=!S.admin;
  await publicLoad();if(S.admin)await adminLoad();
 }catch{msg("nsi-status","تعذر التحقق من قاعدة البيانات.","Database verification failed.",true)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else void start();
})();