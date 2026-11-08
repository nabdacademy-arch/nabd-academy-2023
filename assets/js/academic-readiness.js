/* NABD Academic Readiness: administrator-only read-only counts under existing RLS. */
(()=>{"use strict";
const register=window.NABD_ADMIN_REGISTER_MODULE;if(typeof register!=="function")return;
const sections=[
["courses","courses","id","المقررات","Courses","university-os.html"],
["enrollments","enrollments","id","التسجيلات","Enrolments","portal.html"],
["faculty","nabd_os_faculty_assignments","course_id","تكليفات المحاضرين","Faculty assignments","university-os.html"],
["modules","nabd_os_course_modules","id","الوحدات التعليمية","Learning modules","university-os.html"],
["exams","nabd_os_exams","id","الاختبارات","Exams","university-os.html"],
["questions","nabd_os_exam_questions","id","بنك الأسئلة","Exam questions","university-os.html"],
["attendance","nabd_os_attendance","id","سجلات الحضور","Attendance","university-os.html"],
["attempts","nabd_os_exam_attempts","id","محاولات الاختبارات","Exam attempts","university-os.html"],
["requests","nabd_os_certificate_requests","id","طلبات استحقاق الشهادات","Credential reviews","university-os.html"],
["certificates","certificates","id","الشهادات الرسمية","Issued certificates","admin.html"],
["research","nabd_os_research_proposals","id","المقترحات البحثية","Research proposals","university-os.html"]
];
let ticket=0;
const el=(tag,cls,content)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(content!==undefined)node.textContent=String(content);return node};
const tr=(a,e)=>document.documentElement.lang==="en"?e:a;
const tasks=[
["تأكد من إدراج المقررات ومراجعة توصيفها العلمي.","Confirm courses and their academic descriptions.","courses"],
["كلّف محاضرًا مخولًا لكل مقرر قبل نشر الوحدات.","Assign authorised lecturers before publishing learning modules.","faculty"],
["أضف محاضرات وأسئلة مدققة ثم انشر الاختبارات يدويًا.","Add reviewed lessons and questions before publishing exams.","modules"],
["اربط الطلاب الحقيقيين بمقرراتهم قبل تسجيل الحضور.","Enrol real learners before recording attendance.","enrollments"],
["راجع الاستحقاق قبل إصدار أي شهادة رسمية.","Review eligibility before issuing official credentials.","requests"]
];
function link(href,label){const a=el("a","nar-link",label);a.href=href;return a}
function draw(panel,stats,failures,db,user){
 panel.replaceChildren();
 const header=el("div","nar-head"),title=el("h2","",tr("جاهزية التشغيل الأكاديمي","Academic activation status")),sub=el("p","",tr("عدادات مباشرة من قاعدة البيانات وفق صلاحيات المدير. وجود سجلات لا يعني اعتمادًا أكاديميًا أو جاهزية نهائية.","Live database counts under administrator permissions. Records alone do not imply academic accreditation or launch readiness."));
 const reload=el("button","nar-refresh",tr("تحديث البيانات ↻","Refresh data ↻"));reload.type="button";
 reload.addEventListener("click",()=>void load(panel,db,user));
 const htxt=el("div");htxt.append(title,sub);header.append(htxt,reload);panel.append(header);
 const summary=el("div","nar-summary");
 const countPresent=sections.filter(x=>typeof stats[x[0]]==="number"&&stats[x[0]]>0).length;
 const countKnown=sections.filter(x=>typeof stats[x[0]]==="number").length;
 const totals=el("strong","",countPresent+" / "+countKnown);
 summary.append(totals,el("span","",tr("أنواع سجلات تحتوي على بيانات (ليس تقييم جودة)","record types populated (not a quality rating)")));
 panel.append(summary);
 if(failures.length){const err=el("p","nar-alert",tr("تعذّر التحقق من: ","Unavailable counts: ")+failures.join("، "));err.setAttribute("role","alert");panel.append(err)}
 const grid=el("div","nar-grid");
 for(const [id,table,,ar,en,href] of sections){
  const n=stats[id],card=el("article","nar-card"),label=el("h3","",tr(ar,en));
  const big=el("strong","nar-count",Number.isInteger(n)?n:"—");
  const status=el("p","nar-state "+(Number.isInteger(n)?n?"nar-filled":"nar-empty":"nar-unknown"),Number.isInteger(n)?n?tr("بيانات موجودة","Records present"):tr("لا توجد سجلات بعد","Not populated yet"):tr("تعذّر التحقق","Could not verify"));
  card.append(label,big,status,link(href,tr("فتح مساحة العمل ↗","Open workspace ↗")));grid.append(card);
 }
 panel.append(grid);
 const guide=el("section","nar-guide");guide.append(el("h3","",tr("تسلسل تشغيل مقترح","Suggested activation order")));
 const list=el("ol");
 for(const [ar,en,section] of tasks){const li=el("li","",tr(ar,en));const item=sections.find(x=>x[0]===section);if(item)li.append(" ",link(item[5],tr("افتح","Open")));list.append(li)}
 guide.append(list,el("p","nar-disclaimer",tr("هذه اللوحة للمتابعة فقط: لا تنشئ حسابات أو اختبارات أو نتائج أو شهادات. تأكيد التشغيل الفعلي يحتاج اختبارًا بحسابات مصرح بها.","Read-only monitoring: no accounts, exams, grades or certificates are created. Actual launch requires role-authorised end-to-end testing.")));panel.append(guide);
}
async function load(panel,db,user){
 const current=++ticket;panel.replaceChildren(el("p","nar-loading",tr("جارٍ التحقق من البيانات الحقيقية…","Checking real academic records…")));
 if(!db||!user){panel.replaceChildren(el("p","nar-alert",tr("هذه اللوحة تتطلب تسجيل دخول المدير.","Administrator sign-in required.")));return}
 try{
  const [session,profile]=await Promise.all([db.auth.getUser(),db.from("profiles").select("role").eq("id",user.id).maybeSingle()]);
  if(current!==ticket)return;
  if(session.error||session.data?.user?.id!==user.id||profile.error||profile.data?.role!=="admin"){panel.replaceChildren(el("p","nar-alert",tr("لم يتم التحقق من صلاحية المدير.","Administrator permission could not be verified.")));return}
  const results=await Promise.allSettled(sections.map(async([id,table,col])=>{const {count,error}=await db.from(table).select(col,{count:"exact",head:true});if(error)throw error;return [id,count]}));
  if(current!==ticket)return;
  const stats={},failures=[];results.forEach((r,i)=>{if(r.status==="fulfilled"&&Number.isInteger(r.value[1]))stats[r.value[0]]=r.value[1];else failures.push(sections[i][3])});
  draw(panel,stats,failures,db,user);
 }catch(e){if(current===ticket)panel.replaceChildren(el("p","nar-alert",tr("تعذّر التحقق من الصلاحيات أو اتصال قاعدة البيانات.","Unable to verify permission or reach the database.")))}
}
register({id:"academic-readiness",title:"جاهزية التعليم",render(panel,{db,user}){return load(panel,db,user)}});
})();