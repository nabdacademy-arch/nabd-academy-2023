/* NABD UNIVERSITY 360 / DIRECTOR MISSION CONTROL.
 * Read-only academic metrics, human pilot gates, secure volunteer lecturer review.
 * No fake enrolments, certificates, grades, medical accreditations or automatic teaching assignments.
 */
(()=>{"use strict";
const register=window.NABD_ADMIN_REGISTER_MODULE;if(typeof register!=="function")return;
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const s={panel:null,db:null,user:null,metrics:{},applications:[],view:"overview",busy:false,epoch:0};
const metrics=[
 ["courses","courses","id","المقررات","academy.html"],
 ["enrolments","enrollments","id","الالتحاقات المسجلة","university-os.html"],
 ["faculty","nabd_os_faculty_assignments","course_id","المحاضرون المكلّفون","lecturers.html"],
 ["modules","nabd_os_course_modules","id","الوحدات التعليمية","university-os.html"],
 ["exams","nabd_os_exams","id","الاختبارات الحقيقية","university-os.html"],
 ["attempts","nabd_os_exam_attempts","id","محاولات الاختبارات","university-os.html"],
 ["sessions","nabd_global_sessions","id","المحاضرات الدولية","global-lectures.html"],
 ["tickets","nabd_support_tickets","id","تذاكر دعم الطلاب","nabd-connect.html"],
 ["volunteers","nabd_360_lecturer_applications","id","طلبات المحاضرين","nabd-360-lecturers.html"],
 ["plans","nabd_360_study_plans","user_id","خطط الدراسة المحفوظة","nabd-university-360.html"],
 ["verifiedSkills","nabd_skill_verifications","id","سجلات المهارات التعليمية","skill-passport.html"],
 ["certificates","certificates","id","سجلات شهادات قائمة","index.html#verify"]
];
const panels=[["overview","◈ مركز القيادة"],["pilot","◉ الدفعة التجريبية"],["faculty","✧ المحاضرون المتطوعون"],["quality","✓ الجودة والأمان"]];
const manual=[
 ["medical","مراجعة طبيب أو متخصص للحالات التعليمية","توثيق مراجعة سيناريوهات ATLAS وإخلاء المسؤولية"],
 ["staff","تأكيد محاضرين متطوعين فعليين وتكليفاتهم","موافقة المتحدث، التخصص، الجدول، وصلاحيات حساب المحاضر"],
 ["syllabus","مقررات ووحدات معتمدة أكاديميًا","أهداف تعلم ومراجع وحقوق نشر ومراجعة المحتوى"],
 ["staging","اختبار آمن بمستخدمين تجريبيين مخوّلين","تسجيل طالب واختبار وحضور وشهادة، دون التلاعب بسجلات الطلاب الحقيقيين"],
 ["security","اختبار أدوار وصلاحيات RLS والأمان","مراجعة تنبيهات Supabase، خصوصية البيانات، استعادة الحساب"],
 ["signoff","قرار إداري/أكاديمي مكتوب بالإطلاق","اعتماد بشري موثق قبل دعوة دفعة حقيقية أو إصدار مؤهل"]
];
const $=id=>s.panel?.querySelector("#"+id);
const a=(href,text)=>{const x=el("a","n360adm-link",text);x.href=href;return x};
const button=(text,fn,cls="n360adm-btn")=>{const b=el("button",cls,text);b.type="button";b.addEventListener("click",fn);return b};
function msg(text,bad=false){const x=$("n360adm-status");if(!x)return;x.textContent=text;x.classList.toggle("bad",!!bad)}
function layout(){
 s.panel.replaceChildren();s.panel.classList.add("n360adm");
 const h=el("div","n360adm-head");const intro=el("div");
 intro.append(el("small","n360adm-eyebrow","NABD UNIVERSITY 360 / COMMAND CENTRE"),el("h2","", "مركز القيادة الأكاديمية 360"),el("p","", "مؤشرات فعلية من قاعدة البيانات، وخط سير الدفعة التجريبية، ومراجعة طلبات المحاضرين. لا إعلان جاهزية دون أدلة بشرية."));
 const actions=el("div","n360adm-actions");actions.append(a("nabd-university-360.html","الحرم 360 ↗"),a("nabd-one.html","NABD ONE ↗"),a("nabd-connect.html","مراسلات الطلاب ↗"));h.append(intro,actions);
 s.panel.append(h);
 const nav=el("nav","n360adm-tabs");nav.setAttribute("aria-label","محاور مركز القيادة");
 for(const [id,label]of panels){const b=button(label,()=>{s.view=id;draw()},"n360adm-tab");b.dataset.page=id;nav.append(b)}
 s.panel.append(nav);
 const info=el("p","n360adm-status","");info.id="n360adm-status";info.setAttribute("role","status");s.panel.append(info);
 const content=el("div","n360adm-body");content.id="n360adm-body";s.panel.append(content)
}
function renderCounts(){
 const host=el("div","n360adm-metrics");for(const [key,table,col,label,href] of metrics){const count=s.metrics[key],card=el("article","n360adm-metric"),n=el("strong","",Number.isInteger(count)?String(count):"—");
  card.append(el("span","n360adm-metric-title",label),n,el("small","",Number.isInteger(count)?count?"سجلات موجودة · تحتاج مراجعة جودة":"لا توجد سجلات في هذه المرحلة":"تعذر التحقق من هذا المؤشر"),a(href,"افتح المساحة ↗"));host.append(card)}
 return host
}
function renderOverview(host){
 host.append(el("h3","", "أداء التشغيل الحالي — بيانات موثوقة فقط"),el("p","n360adm-hint","مؤشرات العدد لا تُثبت اعتمادًا طبيًا أو تشغيل برنامج متكامل. القيم غير القابلة للقراءة تُعرض — بدل اختراع الصفر."));
 host.append(renderCounts());
 const core=["courses","enrolments","faculty","modules","exams"];
 const missing=core.filter(key=>s.metrics[key]===0);
 const unknown=core.filter(key=>!Number.isInteger(s.metrics[key]));
 const hold=el("div","n360adm-hold");
 hold.append(el("strong","", "حالة إطلاق الدفعة: انتظار التحقق / HOLD"),el("p","",
  "مقومات بلا سجلات: "+(missing.length?missing.map(key=>metrics.find(m=>m[0]===key)[3]).join("، "):"لا نقص عددي معروف")+
  (unknown.length?" · تعذر التحقق: "+unknown.map(key=>metrics.find(m=>m[0]===key)[3]).join("، "):"")+
  ". يظل الاعتماد الطبي وأمن الصلاحيات وتجربة الطالب بحاجة لمراجعة بشرية."));host.append(hold);
 const row=el("div","n360adm-links");row.append(a("admin.html#launch-readiness","بوابة الإطلاق النهائي ↗"),a("university-os.html","المقررات والاختبارات ↗"),a("admin.html#nabd-one-operations","الإدارة اليومية والمحاضرات ↗"));host.append(row)
}
function renderPilot(host){
 host.append(el("h3","", "بروتوكول أول دفعة تجريبية — بلا بيانات وهمية"));
 const w=el("p","n360adm-hint","لا تُنشأ حسابات أو امتحانات أو شهادات تلقائيًا. تتطلب الخطوات التالية أدلة وموافقة صريحة من المختصين، ولا يمكن تفعيلها بمجرد الضغط هنا.");host.append(w);
 const checklist=el("ol","n360adm-checks");
 for(const [id,title,desc] of manual){const li=el("li","n360adm-check");
 li.append(el("span","n360adm-pending","بانتظار دليل وموافقة"),el("strong","",title),el("p","",desc));checklist.append(li)}
 host.append(checklist);
 const h=el("div","n360adm-hold");h.append(el("strong","", "NO-GO / لا إذن بالإطلاق الكامل"),el("p","", "آخر فحص لصلاحيات المستخدمين لا يغني عن اختبار تطبيقي بين حساب طالب ومحاضر ومدير. لا يغيّر هذا القسم سجلات إنتاج."));
 host.append(h,a("https://github.com/nabdacademy-arch/nabd-academy-2023/blob/main/docs/NABD_FINAL_LAUNCH_2026-11-08.md","دليل الإطلاق والاختبارات ↗"))
}
function renderFaculty(host){
 host.append(el("h3","", "طلبات المحاضرين — مراجعة فردية دون تكليف تلقائي"));
 const hint=el("p","n360adm-hint","الموافقة على الطلب لا تنشئ حساب محاضر ولا تكليفًا بالمقرر ولا محاضرة منشورة. تحقق من المؤهلات والموافقة ثم استخدم استوديو المحاضر وبرنامج المحاضرات لإكمال الخطوات.");host.append(hint);
 host.append(a("lecturers.html","استوديو المحاضرين ↗"),a("admin.html#nabd-one-operations","جدولة المحاضرات المدققة ↗"));
 const list=el("div","n360adm-applications");
 if(!s.applications.length)list.append(el("p","n360adm-empty","لا توجد طلبات محاضرين ظاهرة حتى الآن. لا نفترض وجود متطوعين دون تسجيلهم."));
 for(const app of s.applications){
  const box=el("article","n360adm-application"),name=el("h4","",app.full_name||"متقدم"),mail=el("p","",app.contact_email||"");
  box.append(el("small","",app.status+" · "+(app.created_at?new Date(app.created_at).toLocaleDateString("ar"):"")),name,mail);
  box.append(el("p","",app.expertise+" / "+app.institution+" / "+app.country));
  box.append(el("p","",app.offer_topic));
  box.append(el("small","", "التفرغ الأسبوعي: "+app.weekly_hours+" ساعة"));
  const row=el("div","n360adm-formline");const label=el("label","", "حالة المراجعة"),sel=el("select","n360adm-select");
  for(const [value,text] of [["pending","بانتظار المراجعة"],["reviewing","قيد التقييم"],["approved","مقبول للمراجعة الأكاديمية اللاحقة"],["declined","غير مقبول"]]){
   const opt=el("option","",text);opt.value=value;opt.selected=app.status===value;sel.append(opt)
  }
  label.append(sel);row.append(label);
  const label2=el("label","", "ملاحظة داخلية (لا تُنشر للطلاب)"),input=el("textarea","n360adm-textarea");input.rows=2;input.maxLength=600;input.value=app.admin_note||"";label2.append(input);
  const save=button("حفظ قرار المراجعة",()=>void reviewApplication(app,sel.value,input.value,save));
  row.append(label2,save);box.append(row);list.append(box)
 }
 host.append(list)
}
async function reviewApplication(app,status,adminNote,btn){
 if(s.busy)return;
 if(!["pending","reviewing","approved","declined"].includes(status)||adminNote.length>600){msg("القرار أو الملاحظة غير صالحين.",true);return}
 if(status==="approved"&&!confirm("هل تحققت من معلومات المتطوع وموافقته؟ هذه موافقة مراجعة فقط وليست تكليفًا تلقائيًا."))return;
 s.busy=true;btn.disabled=true;
 try{
  const result=await s.db.from("nabd_360_lecturer_applications").update({status,admin_note:adminNote||null,reviewed_at:new Date().toISOString()}).eq("id",app.id).select("id,status,admin_note").maybeSingle();
  if(result.error||!result.data)throw result.error||Error("No confirmed record");
  app.status=result.data.status;app.admin_note=result.data.admin_note;
  msg("حُفظ قرار المراجعة فعليًا دون أي تعيين أو إعلان.");
  draw()
 }catch(e){msg("لم يتأكد حفظ المراجعة؛ تحقق من صلاحيات الحساب والاتصال.",true)}
 finally{s.busy=false;btn.disabled=false}
}
function renderQuality(host){
 host.append(el("h3","","مؤشرات الثقة والمراجعة"));
 const detail=el("div","n360adm-checks");
 for(const [label,desc,href]of [
  ["المحتوى الطبي","كل حالات ATLAS تعليمية افتراضية حتى مراجعة مختص.","https://github.com/nabdacademy-arch/nabd-academy-2023/blob/main/docs/MEDVERSE_CONTENT_REVIEW.md"],
  ["الأمان","الصلاحيات الحقيقية عبر RLS، مع حماية حقول الدور الإداري في ملفات المستخدم.","https://supabase.com/docs/guides/database/postgres/row-level-security"],
  ["الأستاذ الشخصي","الخطة محفوظة لحساب الطالب؛ إجابات AI اختيارية، وقد تتعطل عند نفاد الحصة.","learning/"],
  ["الشهادات والمهارات","السجلات المعروضة تابعة لصاحبها فقط؛ لا إصدار آلي ولا اعتماد سريري.","skill-passport.html"],
  ["المراسلات والبيانات","صندوق خاص وموافقات ضرورية مع التزام فريق الإدارة بالاحتفاظ والرد.","nabd-connect.html"]
 ]){const x=el("article","n360adm-check");x.append(el("strong","",label),el("p","",desc),a(href,"التفاصيل ↗"));detail.append(x)}
 host.append(detail);
 const hold=el("p","n360adm-hold","المراجعة القانونية والسريرية وإجراء اختبارات مستخدمين حقيقيين ما زالت مسؤوليات بشرية. تبقى تحذيرات Supabase الأخرى للمراجعة المتخصصة.");
 host.append(hold)
}
function draw(){
 const host=$("n360adm-body");if(!host)return;host.replaceChildren();
 s.panel.querySelectorAll(".n360adm-tab").forEach(x=>{x.classList.toggle("active",x.dataset.page===s.view);x.setAttribute("aria-pressed",String(x.dataset.page===s.view))});
 if(s.view==="overview")renderOverview(host);else if(s.view==="pilot")renderPilot(host);else if(s.view==="faculty")renderFaculty(host);else renderQuality(host)
}
async function refresh(){
 const epoch=++s.epoch;msg("التحقق من بيانات الحساب المصرح بها…");
 const requests=metrics.map(async([key,table,col])=>{
  const {count,error}=await s.db.from(table).select(col,{count:"exact",head:true});
  if(error)throw error;return Number.isInteger(count)?count:null
 });
 requests.push(s.db.from("nabd_360_lecturer_applications").select("id,full_name,contact_email,expertise,institution,country,offer_topic,weekly_hours,status,admin_note,created_at").order("created_at",{ascending:false}).limit(70));
 const outcomes=await Promise.allSettled(requests);
 if(epoch!==s.epoch)return;
 metrics.forEach(([key],i)=>{const v=outcomes[i];s.metrics[key]=v.status==="fulfilled"?v.value:null});
 const apps=outcomes[outcomes.length-1];
 s.applications=apps.status==="fulfilled"&&!apps.value.error?apps.value.data||[]:[];
 msg(apps.status==="rejected"||apps.value?.error?"لم يتم التحقق من كل طلبات المحاضرين. راجع الصلاحيات والاتصال.":"تم التحقق من البيانات المتاحة؛ الأعمدة — تعني تعذّر التحقق.",apps.status==="rejected"||!!apps.value?.error);
 draw()
}
async function render(panel,{db,user}){
 s.panel=panel;s.db=db;s.user=user;s.epoch++;
 layout();
 if(!db||!user){panel.replaceChildren(el("p","n360adm-denied","الدخول الإداري مطلوب."));return}
 msg("التحقق من هوية المدير وصلاحيته الفعلية…");
 try{
  const [auth,profile]=await Promise.all([db.auth.getUser(),db.from("profiles").select("role").eq("id",user.id).maybeSingle()]);
  if(auth.error||auth.data?.user?.id!==user.id||profile.error||profile.data?.role!=="admin"){
   panel.replaceChildren(el("p","n360adm-denied","رفض الوصول: دور المدير لم يُثبت من قاعدة البيانات."));return
  }
  await refresh()
 }catch(e){panel.replaceChildren(el("p","n360adm-denied","تعذّر التحقق من جلسة المدير."))}
}
register({id:"nabd-university-360",title:"◌ UNIVERSITY 360",render});
})();