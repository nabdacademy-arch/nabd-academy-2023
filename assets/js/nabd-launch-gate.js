/* NABD FINAL LAUNCH / Operations Gate
 * Administrator-only, read-only live Supabase counts and honest human review blockers.
 * This never changes students, roles, certificates, assessments or clinical content.
 */
(()=>{"use strict";
const register=window.NABD_ADMIN_REGISTER_MODULE;
if(typeof register!=="function")return;
const nodes=[
 {id:"courses",table:"courses",column:"id",name:["المقررات","Course catalogue"],where:"academy.html",group:"core",required:true},
 {id:"enrollments",table:"enrollments",column:"id",name:["الالتحاقات الفعلية","Enrolments"],where:"university-os.html",group:"core",required:true},
 {id:"faculty",table:"nabd_os_faculty_assignments",column:"course_id",name:["تكليفات أعضاء التدريس","Assigned faculty"],where:"university-os.html",group:"core",required:true},
 {id:"modules",table:"nabd_os_course_modules",column:"id",name:["الوحدات التعليمية","Published learning units"],where:"university-os.html",group:"core",required:true},
 {id:"exams",table:"nabd_os_exams",column:"id",name:["اختبارات النظام","OS examinations"],where:"university-os.html",group:"core",required:true},
 {id:"questions",table:"nabd_os_exam_questions",column:"id",name:["أسئلة الاختبارات","Exam question bank"],where:"university-os.html",group:"core",required:true},
 {id:"skillCatalog",table:"nabd_skill_catalog",column:"id",name:["مهارات التعلم المتاحة","Available learning skills"],where:"skill-passport.html",group:"optional"},
 {id:"lectures",table:"nabd_global_sessions",column:"id",name:["محاضرات دولية مجدولة","Scheduled global sessions"],where:"global-lectures.html",group:"optional"},
 {id:"research",table:"nabd_os_research_proposals",column:"id",name:["مقترحات بحث طلابية","Student research proposals"],where:"research-starter-lab.html",group:"optional"},
 {id:"requests",table:"nabd_os_certificate_requests",column:"id",name:["طلبات استحقاق الشهادات","Credential eligibility reviews"],where:"university-os.html",group:"post"},
 {id:"certificates",table:"certificates",column:"id",name:["شهادات النظام السابق/الحالي","Existing certificates"],where:"index.html#verify",group:"post"}
];
const human=[
 ["content","مراجعة اختصاصي للمحاكاة الطبية ومحتوى المقررات","Clinical expert review of medical cases and course material","docs/MEDVERSE_CONTENT_REVIEW.md"],
 ["permissions","اختبار صلاحيات الطالب والمحاضر والمدير وسلامة RLS","Verified learner, lecturer and admin permission tests with RLS","https://supabase.com/docs/guides/database/postgres/row-level-security"],
 ["accounts","اختبار التسجيل وإعادة ضبط كلمة المرور وحذف البيانات","Test registration, password reset and account/data deletion","policies.html"],
 ["tutor","اختبار توليد المساعد فعليًا بمفتاح وحصة صالحة","Verify actual authenticated AI Tutor generation and quota","learning/"],
 ["lecturer","تأكيد المحاضرين والجداول وموافقات المحاضرات","Confirm real instructors, timetables and content consent","global-lectures.html"],
 ["journey","اختبار الطالب الفعلي من التقديم حتى التحقق من الشهادة","End-to-end student-to-credential verification in a safe test environment","university-os.html"],
 ["security","مراجعة تحذيرات الأمان في Supabase والحماية من كلمات المرور المسربة","Review Supabase security advisors and leaked-password protection","https://supabase.com/dashboard"],
 ["mobile","تجربة أندرويد فعلي واتصال ضعيف قبل توسيع الاستخدام","Test on physical Android and unreliable networks","atlas/"]
];
let epoch=0;
let last=null;
const $=(id)=>document.getElementById(id);
let uiLang="ar";const lang=()=>uiLang;
const t=(ar,en)=>lang()==="en"?en:ar;
const elem=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e};
function addLink(parent,url,label){const a=elem("a","nlg-link",label);a.href=url;if(url.startsWith("https://")){a.rel="noopener noreferrer";a.target="_blank"}parent.append(a);return a}
function gateStatus(count){if(!Number.isInteger(count))return "unknown";return count>0?"seeded":"blocked"}
function snapshot(stats){
 const gates=nodes.filter(n=>n.required).map(n=>({id:n.id,table:n.table,records:Number.isInteger(stats[n.id])?stats[n.id]:null,status:gateStatus(stats[n.id])}));
 const blocked=gates.filter(x=>x.status==="blocked").length,unknown=gates.filter(x=>x.status==="unknown").length;
 return {version:1,kind:"NABD_FINAL_LAUNCH_GATE",verifiedAt:new Date().toISOString(),automatic:{total:gates.length,withRecords:gates.filter(x=>x.status==="seeded").length,blocked,unknown,gates},manualReviews:human.map(x=>({id:x[0],state:"pending_human_review"})),overall:"HOLD_FOR_VERIFICATION",explanation:"Counts indicate only presence of records, not academic, medical, security or teaching approval. No student data is exported."};
}
function draw(panel,stats,db,user,verifiedAt){
 panel.setAttribute("dir",lang()==="en"?"ltr":"rtl");
 panel.replaceChildren();
 const info=snapshot(stats);if(verifiedAt)info.verifiedAt=verifiedAt;last=info;
 const heading=elem("div","nlg-head"),copy=elem("div"),title=elem("h2","",t("NABD FINAL LAUNCH · غرفة جاهزية الإطلاق","NABD FINAL LAUNCH · Operations readiness gate"));
 const intro=elem("p","",t("تقرير مباشر للمدير فقط: نميّز بين وجود سجلات وبين اعتماد المحتوى والأمان. لا توجد تغييرات على قاعدة البيانات.","Administrator-only live report. Database records are not proof of security, clinical review or full launch readiness. No database records are changed."));
 const refresh=elem("button","nlg-button",t("تحديث التحقق ↻","Refresh verification ↻"));refresh.type="button";refresh.addEventListener("click",()=>{void load(panel,db,user)});
 const exportBtn=elem("button","nlg-button nlg-secondary",t("تنزيل تقرير دون بيانات شخصية","Export non-personal readiness report"));exportBtn.type="button";exportBtn.addEventListener("click",exportReport);
 const actions=elem("div","nlg-actions");
 const toggle=elem("button","nlg-button nlg-secondary",lang()==="ar"?"EN / عربي":"عربي / EN");toggle.type="button";toggle.setAttribute("aria-label",t("تغيير لغة التقرير","Switch report language"));toggle.addEventListener("click",()=>{uiLang=uiLang==="ar"?"en":"ar";draw(panel,stats,db,user,info.verifiedAt)});
 actions.append(toggle,refresh,exportBtn);copy.append(title,intro);heading.append(copy,actions);panel.append(heading);
 const headline=elem("div","nlg-status");
 headline.append(elem("div","nlg-hold",t("إيقاف الإطلاق العام حتى التحقق","HOLD — full launch not verified")));
 headline.append(elem("strong","",info.automatic.withRecords+" / "+info.automatic.total));
 headline.append(elem("p","",t("مقومات تشغيل مسجلة · وجود البيانات ليس موافقة على فتح الدراسة رسميًا","Core areas with records · not an approval to open official teaching")));
 panel.append(headline);
 const meta=elem("p","nlg-meta",t("تم فحص وجود السجلات: ","Record-presence check: ")+info.verifiedAt.replace("T"," ").replace("Z"," UTC")+" · "+t("حساب المدير فقط، دون أسماء أو تفاصيل الطلاب","verified admin only, no student details"));
 panel.append(meta);
 const partA=elem("section","nlg-group");partA.append(elem("h3","",t("1. متطلبات التشغيل الأساسية","1. Core operating prerequisites")),elem("p","",t("الأرقام من الجداول الحقيقية وفق RLS، ولا تقيس جودة المحتوى.","Counts use the live database under RLS; they do not measure the quality of teaching.")));
 const cards=elem("div","nlg-cards");
 for(const n of nodes.filter(x=>x.required)){
  const status=gateStatus(stats[n.id]),card=elem("article","nlg-card"),first=elem("div","nlg-card-top");
  first.append(elem("h4","",n.name[lang()==="en"?1:0]),elem("strong","nlg-count",Number.isInteger(stats[n.id])?stats[n.id]:"—"));
  const badge=elem("span","nlg-state "+status,status==="blocked"?t("لا توجد سجلات","No records"):status==="seeded"?t("سجلات موجودة","Records found"):t("تعذر التحقق","Unverified"));
  card.append(first,badge);addLink(card,n.where,t("افتح مساحة العمل ←","Open workspace →"));cards.append(card);
 }
 partA.append(cards);panel.append(partA);
 const partB=elem("section","nlg-group");partB.append(elem("h3","",t("2. اعتماد بشري مطلوب — غير محسوم آليًا","2. Human approvals required — not automatically verifiable")));
 const checklist=elem("ol","nlg-human");for(const [id,ar,en,url] of human){const li=elem("li",""),status=elem("strong","nlg-human-state",t("بانتظار المراجعة","Requires review"));li.append(status,elem("span","",t(ar,en)));addLink(li,url,t("التعليمات ↗","Review ↗"));checklist.append(li)}partB.append(checklist);
 partB.append(elem("p","nlg-note",t("لا يمكن اعتبار المراجعات البشرية ناجحة لمجرد الضغط على زر أو وجود ملف. تتطلب أدلة وموافقة بشرية صريحة.","Human review cannot be passed by clicking a button or uploading a file. Evidence and explicit authorised approval are required.")));
 panel.append(partB);
 const partC=elem("section","nlg-group");partC.append(elem("h3","",t("3. مؤشرات إضافية للمتابعة","3. Supporting system indicators")));const extras=elem("div","nlg-extras");for(const n of nodes.filter(x=>!x.required)){const row=elem("div","nlg-extra");row.append(elem("span","",n.name[lang()==="en"?1:0]),elem("strong","",Number.isInteger(stats[n.id])?stats[n.id]:"—"));extras.append(row)}partC.append(extras);
 const caveat=elem("p","nlg-note",t("الشهادات المسجلة قد تكون من النظام السابق؛ لا تستنتج منها أن رحلة امتحانات V22 مكتملة. هذا التقرير لا يكشف بيانات الطلاب أو أسماء المسجلين.","Existing certificates may belong to legacy workflows and do not prove the V22 exam-to-certificate path works. No student identities are shown."));partC.append(caveat);
 addLink(partC,"https://github.com/nabdacademy-arch/nabd-academy-2023/actions",t("فحوصات GitHub Actions ↗","GitHub Actions checks ↗"));panel.append(partC);
}
function exportReport(){
 if(!last)return;
 const safe={...last};
 const blob=new Blob([JSON.stringify(safe,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),a=elem("a");
 a.href=url;a.download="nabd-final-launch-readiness.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function load(panel,db,user){
 const ticket=++epoch;last=null;
 panel.replaceChildren(elem("p","nlg-wait",t("التحقق من جلسة المدير وقاعدة البيانات…","Verifying admin identity and academic tables…")));
 if(!db||!user){panel.replaceChildren(elem("p","nlg-error",t("تسجيل دخول المدير مطلوب.","Administrator sign-in required.")));return}
 try{
  const [auth,profile]=await Promise.all([db.auth.getUser(),db.from("profiles").select("role").eq("id",user.id).maybeSingle()]);
  if(ticket!==epoch)return;
  if(auth.error||!auth.data?.user||auth.data.user.id!==user.id||profile.error||profile.data?.role!=="admin"){
   panel.replaceChildren(elem("p","nlg-error",t("لم تؤكد قاعدة البيانات صلاحيات المدير؛ لا يمكن عرض التقرير.","Database administrator authorisation could not be verified.")));return
  }
  const results=await Promise.allSettled(nodes.map(async n=>{
   const {count,error}=await db.from(n.table).select(n.column,{count:"exact",head:true});
   if(error)throw error;return [n.id,count];
  }));
  if(ticket!==epoch)return;
  const stats={};results.forEach((r,i)=>{stats[nodes[i].id]=r.status==="fulfilled"&&Number.isInteger(r.value[1])?r.value[1]:null});
  draw(panel,stats,db,user);
 }catch(e){if(ticket===epoch)panel.replaceChildren(elem("p","nlg-error",t("تعذّر الوصول إلى قاعدة البيانات أو التحقق من الهوية.","Unable to verify admin permission or database connectivity.")))}
}
register({id:"launch-readiness",title:"🚀 الإطلاق النهائي",render(panel,{db,user}){return load(panel,db,user)}});
})();