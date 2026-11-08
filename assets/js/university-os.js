/* NABD UNIVERSITY OS V17–V22
 * All grade computation and authorisation happens in Supabase with RLS and authenticated RPCs.
 * No answer keys, service keys, privileged claims or student data are embedded in this JS.
 */
(()=>{"use strict";
const d=document,$=id=>d.getElementById(id),db=window.nabdSupabase;
const S={user:null,profile:null,isAdmin:false,isFaculty:false,language:"ar",view:"study",courses:[],enrollments:[],modules:[],attendance:[],exams:[],attempts:[],faculty:[],requests:[],proposals:[],audit:[],questions:[],chosenExam:null,answers:{},busy:false,roster:[],rosterRequest:0};
const tr=(ar,en)=>S.language==="ar"?ar:en;
const loc=(ar,en)=>S.language==="ar"?(ar||en||""):(en||ar||"");
const elt=(tag,cl,text)=>{const x=d.createElement(tag);if(cl)x.className=cl;if(text!==undefined&&text!==null)x.textContent=String(text);return x};
const clear=x=>x.replaceChildren();
const errMessage=e=>S.isAdmin&&e?.code?tr("تعذّر الطلب (","Request failed (")+e.code+").":tr("تعذّر الطلب. راجع الصلاحيات واتصال الإنترنت، ثم أعد المحاولة.","Request failed. Check your permissions and connection.");
const q=async p=>{const result=await p;if(result.error)throw result.error;return result.data??[]};
const safeDate=value=>{try{return value?new Intl.DateTimeFormat(S.language==="ar"?"ar":"en",{dateStyle:"medium"}).format(new Date(value)):""}catch(e){return ""}};
function report(message,bad=false){const x=$("osGlobalStatus");x.textContent=message;x.classList.toggle("error",bad)}
function empty(target,ar,en){clear(target);target.append(elt("p","os-empty",tr(ar,en)))}
function titleOfCourse(id){const c=S.courses.find(x=>x.id===id);return c?loc(c.title_ar,c.title_en):id?.slice(0,8)+"…"}
function labelStatus(status){const map={draft:["مسودة","Draft"],published:["منشور","Published"],upcoming:["لم يبدأ","Upcoming"],closed:["مغلق","Closed"],enrolled:["مسجل","Enrolled"],active:["نشط","Active"],completed:["مكتمل","Completed"],pending:["بانتظار المراجعة","Pending"],under_review:["قيد المراجعة","Under review"],eligible:["مؤهل للمراجعة النهائية","Eligibility reviewed"],declined:["مرفوض","Declined"],submitted:["مقدم","Submitted"],in_review:["قيد التقييم","In review"],accepted:["معتمد إداريًا","Admin reviewed"],present:["حاضر","Present"],absent:["غائب","Absent"],excused:["بعذر","Excused"],late:["متأخر","Late"]};return tr(...(map[status]||[status,status]))}
function formatPercent(a,b){return b>0?Math.round(a/b*100)+"%":"—"}
function newChip(status){const c=elt("span","os-chip"+(["pending","in_review","draft","upcoming"].includes(status)?" gold":""),labelStatus(status));return c}
function newRow(heading,description,tag){const row=elt("article","os-list-row"),body=elt("div");if(tag)body.append(newChip(tag));body.append(elt("h5","",heading),elt("p","",description));row.append(body);return {row,body}}
function runButton(text,fn,variant="secondary"){const b=elt("button","os-button "+variant,text);b.type="button";b.addEventListener("click",async()=>{if(b.disabled)return;b.disabled=true;try{await fn()}catch(e){report(errMessage(e),true)}finally{b.disabled=false}});return b}
function updateSelect(id,rows,selected){const el=$(id);if(!el)return;const old=selected??el.value;clear(el);if(!rows.length){const opt=elt("option","",tr("لا توجد خيارات متاحة","No available options"));opt.value="";el.append(opt);el.disabled=true;return}el.disabled=false;rows.forEach(([value,label])=>{const op=elt("option","",label);op.value=value;el.append(op)});if(rows.some(x=>x[0]===old))el.value=old}
function resetPrivateState(){
 S.user=null;S.profile=null;S.isAdmin=false;S.isFaculty=false;S.view="study";
 for(const k of ["courses","enrollments","modules","attendance","exams","attempts","faculty","requests","proposals","audit","questions","roster"])S[k]=[];
 S.chosenExam=null;S.answers={};S.rosterRequest++;
 $("osExamPlayer").hidden=true;$("osExamResult").textContent="";
 for(const id of ["osMetrics","osCourses","osModules","osAttendance","osExamList","osGrades","osExamQuestions","osCredentialRequests","osResearchList","osFacultyAssignments","osAdminCourses","osAdminExams","osAdminCerts","osAdminResearch","osQualityList"])clear($(id));
 for(const id of ["osAttendanceStudent","osAttendanceModule","osModuleCourse","osCredentialCourse","osAssignCourse","osExamCourse","osQuestionExam"])updateSelect(id,[]);
 $("osIdentity").textContent="";$("osRosterStatus").textContent="";
 $("osApp").hidden=true;$("osGate").hidden=false;roleTabs();
}
function examAvailability(exam,now=Date.now()){
 const start=exam.opens_at?Date.parse(exam.opens_at):NaN,end=exam.closes_at?Date.parse(exam.closes_at):NaN;
 if(Number.isFinite(start)&&now<start)return "upcoming";
 if(Number.isFinite(end)&&now>end)return "closed";
 return "open";
}
function safeDateTime(value){if(!value)return "";try{return new Intl.DateTimeFormat(S.language==="ar"?"ar":"en",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))}catch(e){return ""}}
function roleTabs(){d.querySelectorAll("[data-role='admin']").forEach(x=>x.hidden=!S.isAdmin);d.querySelectorAll("[data-role='faculty']").forEach(x=>x.hidden=!(S.isFaculty||S.isAdmin))}
function navigate(view){const button=d.querySelector('[data-os-view="'+view+'"]');if(!button||button.hidden)return;S.view=view;d.querySelectorAll("[data-os-panel]").forEach(x=>x.hidden=x.dataset.osPanel!==view);d.querySelectorAll("[data-os-view]").forEach(x=>{x.classList.toggle("active",x.dataset.osView===view);x.setAttribute("aria-current",x.dataset.osView===view?"page":"false")});if(innerWidth<800)byViewFocus()}
function byViewFocus(){d.querySelector('[data-os-panel="'+S.view+'"]')?.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}
async function getSession(){
 if(!db){resetPrivateState();report(tr("خدمة تسجيل الدخول غير متاحة في المتصفح. افتح الصفحة باتصال إنترنت.","Account connection unavailable. Reload with internet access."),true);return false}
 const {data,error}=await db.auth.getUser();
 if(error||!data?.user){resetPrivateState();report(tr("سجّل الدخول لعرض مساحة الدراسة الخاصة بك.","Sign in to view your personal workspace."));return false}
 if(S.user&&S.user.id!==data.user.id)resetPrivateState();
 S.user=data.user;
 const prof=await q(db.from("profiles").select("id,full_name,role").eq("id",S.user.id).maybeSingle());
 if(!prof?.id){resetPrivateState();report(tr("تعذّر التحقق من ملف الحساب؛ لا يمكن عرض بيانات خاصة.","Unable to verify your profile. Private data remains hidden."),true);return false}
 S.profile=prof;S.isAdmin=prof.role==="admin";
 $("osApp").hidden=false;$("osGate").hidden=true;
 $("osIdentity").textContent=(prof.full_name||S.user.email||"")+" · "+(S.isAdmin?"ADMIN":prof.role?.toUpperCase()||"STUDENT");
 return true
}
async function loadCollections(){
 const userId=S.user.id;
 if(!S.isAdmin)S.audit=[];
 // Every query below is subject to RLS; no blanket service token is used.
 const tasks=[
 ["courses",db.from("courses").select("id,code,title_ar,title_en,status,hours").order("created_at",{ascending:false}).limit(200)],
 ["enrollments",db.from("enrollments").select("id,course_id,student_id,status,progress,enrolled_at").eq("student_id",userId).limit(300)],
 ["modules",db.from("nabd_os_course_modules").select("id,course_id,title_ar,title_en,summary_ar,resource_url,status,position,created_at").order("position").limit(300)],
 ["attendance",db.from("nabd_os_attendance").select("id,module_id,course_id,student_id,status,recorded_at").order("recorded_at",{ascending:false}).limit(150)],
 ["exams",db.from("nabd_os_exams").select("id,course_id,title_ar,title_en,status,passing_percent,opens_at,closes_at").order("created_at",{ascending:false}).limit(150)],
 ["attempts",db.from("nabd_os_exam_attempts").select("id,exam_id,student_id,score,max_score,passed,submitted_at").order("submitted_at",{ascending:false}).limit(200)],
 ["faculty",db.from("nabd_os_faculty_assignments").select("course_id,lecturer_id,active,created_at").order("created_at",{ascending:false}).limit(200)],
 ["requests",db.from("nabd_os_certificate_requests").select("id,course_id,student_id,status,reviewer_note,created_at,reviewed_at").order("created_at",{ascending:false}).limit(200)],
 ["proposals",db.from("nabd_os_research_proposals").select("id,author_id,title,question,methodology,status,reviewer_note,created_at").order("created_at",{ascending:false}).limit(150)]
 ];
 if(S.isAdmin)tasks.push(["audit",db.from("nabd_os_audit_events").select("id,actor_id,event_type,object_type,object_id,detail,created_at").order("created_at",{ascending:false}).limit(50)]);
 const results=await Promise.allSettled(tasks.map(async([name,promise])=>[name,await q(promise)]));
 const failed=[];
 results.forEach((result,i)=>{const name=tasks[i][0];if(result.status==="fulfilled"){const data=result.value[1];S[name]=Array.isArray(data)?data:[]}else{S[name]=[];failed.push(name)}});
 if(failed.length){report(tr("تعذّر تحميل بعض الأقسام: ","Some sections could not load: ")+failed.join("، "),true)}
 S.isFaculty=S.faculty.some(a=>a.lecturer_id===userId&&a.active);
 roleTabs();
 renderAll();
 // Keep the selected role view visible after every data refresh.
 const targetView=S.isAdmin&&S.view==="study"?"admin":S.isFaculty&&S.view==="study"&&S.enrollments.length===0?"faculty":S.view;
 const allowed=["study","exams","credentials","research",...(S.isFaculty||S.isAdmin?["faculty"]:[]),...(S.isAdmin?["admin","bank","review","quality"]:[])];
 navigate(allowed.includes(targetView)?targetView:"study");
 if(!failed.length)report(tr("تم تحديث بياناتك من قاعدة الأكاديمية بنجاح.","Workspace synchronised with the academy database."));
}
async function bootstrap(){if(S.busy)return;S.busy=true;try{if(await getSession())await loadCollections()}catch(e){report(errMessage(e),true);$("osApp").hidden=true;$("osGate").hidden=false}finally{S.busy=false}}
function metric(number,label){const card=elt("div","os-metric");card.append(elt("b","",number),elt("span","",label));return card}
function renderMetrics(){const host=$("osMetrics");clear(host);const stats=S.isAdmin?[[S.courses.length,tr("مقررات في النتيجة","Courses loaded")],[S.exams.length,tr("اختبارات","Exams")],[S.requests.filter(x=>x.status==="pending").length,tr("طلبات شهادات جديدة","New credential requests")],[S.proposals.filter(x=>x.status==="submitted").length,tr("مقترحات بحث جديدة","New proposals")]]:[[S.enrollments.length,tr("مقرراتي المسجّلة","My enrolments")],[S.exams.filter(x=>x.status==="published"&&examAvailability(x)==="open"&&S.enrollments.some(e=>e.course_id===x.course_id)&&!S.attempts.some(a=>a.student_id===S.user.id&&a.exam_id===x.id)).length,tr("اختبارات متاحة","Available exams")],[S.attempts.filter(x=>x.student_id===S.user.id).length,tr("محاولاتي المسجلة","Submitted exams")],[S.requests.filter(x=>x.student_id===S.user.id).length,tr("طلبات الشهادات","Credential requests")]];stats.forEach(x=>host.append(metric(...x)))}
function renderCourses(){const out=$("osCourses");clear(out);if(!S.enrollments.length){empty(out,"لا توجد تسجيلات للمقررات على حسابك حاليًا. إدارة التسجيل تتم عبر بوابة الأكاديمية.","No enrolled courses found. Enrolment is managed through the academy.");return}
 S.enrollments.forEach(e=>{const card=elt("article","os-mini-card");card.append(newChip(e.status),elt("strong","",titleOfCourse(e.course_id)),elt("p","",tr("التقدم المسجّل: ","Recorded progress: ")+(Math.round(Number(e.progress||0))||0)+"%"));out.append(card)})}
function renderModules(){const out=$("osModules");clear(out);const studentCourseIds=new Set(S.enrollments.map(e=>e.course_id));
 const visible=S.modules.filter(m=>studentCourseIds.has(m.course_id)&&m.status==="published");
 if(!visible.length){empty(out,"لا توجد وحدات منشورة في مقرراتك بعد.","No published units in your enrolled courses yet.");return}
 visible.forEach(m=>{const {row,body}=newRow(loc(m.title_ar,m.title_en),titleOfCourse(m.course_id)+(m.summary_ar?" · "+m.summary_ar:""),m.status);if(m.resource_url){try{const url=new URL(m.resource_url);if(url.protocol==="https:"){const a=elt("a","os-button secondary",tr("المصدر ↗","Source ↗"));a.href=url.href;a.target="_blank";a.rel="noopener noreferrer";row.append(a)}}catch(e){}}out.append(row)})}
function renderAttendance(){const out=$("osAttendance");clear(out);const own=S.attendance.filter(a=>a.student_id===S.user.id);if(!own.length){empty(out,"لا توجد سجلات حضور مرتبطة بحسابك.","No recorded attendance for your account.");return}
 own.forEach(a=>{const m=S.modules.find(x=>x.id===a.module_id);out.append(newRow(m?loc(m.title_ar,m.title_en):titleOfCourse(a.course_id),labelStatus(a.status)+" · "+safeDate(a.recorded_at),a.status).row)})}
function renderExamList(){
 const out=$("osExamList");clear(out);
 const enrolled=new Set(S.enrollments.map(x=>x.course_id)),published=S.exams.filter(x=>x.status==="published"&&enrolled.has(x.course_id));
 if(!published.length){empty(out,"لا توجد اختبارات منشورة لمقرراتك حاليًا. يمكن للإدارة إنشاء الاختبارات ومراجعتها قبل النشر.","No published exams for your courses yet. Admins can author and review exams before publication.");return}
 published.forEach(x=>{
  const ownAttempt=S.attempts.find(a=>a.exam_id===x.id&&a.student_id===S.user.id),windowState=examAvailability(x);
  const when=windowState==="upcoming"?tr("يفتح: ","Opens: ")+safeDateTime(x.opens_at):windowState==="closed"?tr("انتهى: ","Closed: ")+safeDateTime(x.closes_at):tr("الاختبار متاح الآن","Exam is available now");
  const {row}=newRow(loc(x.title_ar,x.title_en),titleOfCourse(x.course_id)+" · "+tr("النجاح: ","Passing score: ")+x.passing_percent+"% · "+when,ownAttempt?"completed":windowState==="open"?"published":windowState);
  const actions=elt("div","os-actions");
  if(ownAttempt)actions.append(elt("span","os-chip",tr("النتيجة ","Score ")+ownAttempt.score+"/"+ownAttempt.max_score));
  else if(windowState==="open")actions.append(runButton(tr("بدء الاختبار","Start exam"),()=>openExam(x.id),"primary"));
  else actions.append(elt("span","os-chip gold",windowState==="upcoming"?tr("لم يبدأ بعد","Not started"):tr("انتهى الموعد","Closed")));
  row.append(actions);out.append(row);
 });
}
function renderGrades(){const out=$("osGrades");clear(out);const own=S.attempts.filter(a=>a.student_id===S.user.id);if(!own.length){empty(out,"لا توجد درجات اختبار مسجلة بعد.","No exam grades are recorded yet.");return}
 own.forEach(a=>{const x=S.exams.find(e=>e.id===a.exam_id);out.append(newRow(x?loc(x.title_ar,x.title_en):a.exam_id?.slice(0,8),tr("الدرجة: ","Score: ")+a.score+"/"+a.max_score+" · "+formatPercent(a.score,a.max_score)+" · "+safeDate(a.submitted_at),a.passed?"completed":"closed").row)})}
async function openExam(id){const exam=S.exams.find(e=>e.id===id);if(!exam)return;
 if(examAvailability(exam)!=="open"||!S.enrollments.some(e=>e.course_id===exam.course_id)||S.attempts.some(a=>a.exam_id===id&&a.student_id===S.user.id)){report(tr("هذا الاختبار غير متاح لحسابك الآن.","This exam is not available to your account now."),true);return}
 const questions=await q(db.from("nabd_os_exam_questions").select("id,prompt_ar,prompt_en,options_ar,options_en,points,position").eq("exam_id",id).order("position"));
 if(!questions.length){report(tr("هذا الاختبار غير جاهز؛ لا توجد أسئلة متاحة.","This exam has no available questions."),true);return}
 S.questions=questions;S.chosenExam=exam;S.answers={};$("osExamPlayer").hidden=false;$("osExamTitle").textContent=loc(exam.title_ar,exam.title_en);$("osExamResult").textContent="";renderExamQuestions();
 $("osExamPlayer").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderExamQuestions(){const box=$("osExamQuestions");clear(box);if(!S.chosenExam)return;$("osExamProgress").textContent=tr("عدد الأسئلة: ","Questions: ")+S.questions.length+" · "+tr("تسليم واحد لكل طالب","One submission per student");
 S.questions.forEach((q,i)=>{const item=elt("fieldset","os-question");item.append(elt("legend","",String(i+1)+". "+loc(q.prompt_ar,q.prompt_en)));const options=S.language==="ar"?q.options_ar:q.options_en;const list=elt("div","os-choices");(Array.isArray(options)?options:[]).forEach((answer,idx)=>{const label=elt("label","os-choice"),r=d.createElement("input");r.type="radio";r.name="answer-"+q.id;r.value=String(idx);r.checked=S.answers[q.id]===idx;r.addEventListener("change",()=>{S.answers[q.id]=idx});label.append(r,elt("span","",String(answer)));list.append(label)});item.append(list);box.append(item)})}
async function submitExam(){if(!S.chosenExam||!S.user)return;
 if(S.questions.some(q=>!Number.isInteger(S.answers[q.id]))){$("osExamResult").textContent=tr("أجب عن كل الأسئلة قبل التسليم.","Answer every question before submitting.");return}
 if(!confirm(tr("هل تريد تسليم الاختبار نهائيًا؟ لا يمكنك إعادته.","Submit this attempt permanently? It cannot be repeated.")))return;
 const btn=$("osSubmitExam");btn.disabled=true;
 try{const result=await q(db.rpc("nabd_os_submit_exam",{p_exam_id:S.chosenExam.id,p_answers:S.answers}));$("osExamResult").textContent=tr("تم تسجيل الدرجة: ","Grade recorded: ")+result.score+"/"+result.max_score+" · "+(result.passed?tr("ناجح","Passed"):tr("لم يحقق الحد","Below passing threshold"));$("osExamPlayer").hidden=true;S.chosenExam=null;S.questions=[];S.answers={};await loadCollections();report(tr("تم تسليم الاختبار وتصحيحه وحفظ درجتك.","Exam submitted, graded and saved."))}catch(e){$("osExamResult").textContent=errMessage(e);report(errMessage(e),true)}finally{btn.disabled=false}}
function renderCredentials(){updateSelect("osCredentialCourse",S.enrollments.map(x=>[x.course_id,titleOfCourse(x.course_id)]));
 const out=$("osCredentialRequests");clear(out);const own=S.requests.filter(x=>x.student_id===S.user.id);if(!own.length){empty(out,"لم ترسل طلبات مراجعة شهادات بعد.","No credential eligibility requests yet.");return}
 own.forEach(x=>out.append(newRow(titleOfCourse(x.course_id),safeDate(x.created_at)+(x.reviewer_note?" · "+x.reviewer_note:""),x.status).row))}
function renderResearch(){const out=$("osResearchList");clear(out);const own=S.proposals.filter(x=>x.author_id===S.user.id);if(!own.length){empty(out,"لا توجد مقترحات بحث باسم حسابك بعد.","No research proposals for your account yet.");return}
 own.forEach(x=>out.append(newRow(x.title,x.question+(x.reviewer_note?" · "+x.reviewer_note:""),x.status).row))}
function facultyCourseIds(){return S.isAdmin?S.courses.map(c=>c.id):S.faculty.filter(x=>x.active&&x.lecturer_id===S.user.id).map(x=>x.course_id)}
function renderFaculty(){const ids=facultyCourseIds(),out=$("osFacultyAssignments");clear(out);if(!ids.length){empty(out,"لا توجد مقررات مكلف بها حاليًا. يحتاج التكليف إلى موافقة الإدارة.","No assigned courses. An administrator must approve your assignment.");return}
 ids.forEach(id=>out.append(newRow(titleOfCourse(id),tr("يمكنك إضافة وحدات وحضور ضمن صلاحيتك.","You may manage units and attendance within your permissions."),"active").row));
 updateSelect("osModuleCourse",ids.map(id=>[id,titleOfCourse(id)]));updateAttendanceModules();
}
function updateAttendanceModules(){
 const allowed=new Set(facultyCourseIds()),rows=S.modules.filter(m=>allowed.has(m.course_id));
 updateSelect("osAttendanceModule",rows.map(x=>[x.id,titleOfCourse(x.course_id)+" · "+loc(x.title_ar,x.title_en)]));
 void refreshRoster();
}
async function refreshRoster(){
 const ticket=++S.rosterRequest;
 const unit=S.modules.find(m=>m.id===$("osAttendanceModule").value);
 S.roster=[];updateSelect("osAttendanceStudent",[]);
 if(!S.user||!unit||!facultyCourseIds().includes(unit.course_id)){
  $("osRosterStatus").textContent=tr("لا توجد وحدة مختارة أو تكليف تدريس متاح.","No selected unit or faculty assignment.");
  return;
 }
 $("osRosterStatus").textContent=tr("جارٍ تحميل طلاب المقرر المصرح لك بعرضهم.","Loading the authorised course roster.");
 try{
  const rows=await q(db.rpc("nabd_os_course_roster",{p_course_id:unit.course_id}));
  if(ticket!==S.rosterRequest||!S.user||$("osAttendanceModule").value!==unit.id)return;
  S.roster=Array.isArray(rows)?rows.filter(r=>r.student_id&&typeof r.full_name==="string"):[];
  updateSelect("osAttendanceStudent",S.roster.map(r=>[r.student_id,r.full_name]));
  $("osRosterStatus").textContent=tr("الطلاب المسجلون المتاحون: ","Available enrolled students: ")+S.roster.length;
 }catch(error){
  if(ticket!==S.rosterRequest)return;
  S.roster=[];updateSelect("osAttendanceStudent",[]);
  $("osRosterStatus").textContent=tr("تعذر تحميل القائمة؛ راجع تكليف المحاضر وصلاحياته.","Unable to load roster; check faculty assignment and permissions.");
 }
}
function renderAdminCourses(){const out=$("osAdminCourses");clear(out);S.courses.forEach(c=>{const card=elt("article","os-mini-card");card.append(newChip(c.status),elt("strong","",loc(c.title_ar,c.title_en)),elt("p","",c.code+" · "+tr("ساعات: ","Hours: ")+c.hours));out.append(card)});
 const options=S.courses.map(c=>[c.id,loc(c.title_ar,c.title_en)+" · "+c.code]);["osAssignCourse","osExamCourse"].forEach(id=>updateSelect(id,options));
}
function renderAdminExams(){const draft=S.exams.filter(x=>x.status==="draft"),out=$("osAdminExams");clear(out);
 updateSelect("osQuestionExam",draft.map(x=>[x.id,loc(x.title_ar,x.title_en)+" · "+titleOfCourse(x.course_id)]));
 if(!S.exams.length){empty(out,"لا توجد اختبارات بعد؛ ابدأ بإنشاء مسودة.","No exams yet. Create a draft first.");return}
 S.exams.forEach(exam=>{const {row}=newRow(loc(exam.title_ar,exam.title_en),titleOfCourse(exam.course_id)+" · "+tr("نسبة النجاح ","Passing ")+exam.passing_percent+"%",exam.status);if(exam.status==="draft"){const acts=elt("div","os-actions");acts.append(runButton(tr("نشر بعد المراجعة","Publish after review"),async()=>{if(!confirm(tr("هل راجعت كل الأسئلة والإجابات علميًا وتريد نشر الاختبار؟","Have you reviewed all questions and answers and want to publish?")))return;await q(db.rpc("nabd_os_publish_exam",{p_exam_id:exam.id}));await loadCollections()}, "primary"));row.append(acts)}out.append(row)})}
function reviewActions(row,items){const holder=elt("div","os-review-actions");items.forEach(item=>{const b=elt("button","",item[0]);b.type="button";b.addEventListener("click",async()=>{if(b.disabled)return;b.disabled=true;try{await item[1]()}catch(e){report(errMessage(e),true)}finally{b.disabled=false}});holder.append(b)});row.append(holder)}
function renderReview(){const certs=$("osAdminCerts"),research=$("osAdminResearch");clear(certs);clear(research);
 if(!S.requests.length)empty(certs,"لا توجد طلبات شهادات بعد.","No credential requests yet.");
 else S.requests.forEach(x=>{const {row}=newRow(titleOfCourse(x.course_id),tr("معرّف الطالب: ","Student ID: ")+x.student_id+" · "+safeDate(x.created_at),x.status);
 if(x.status==="pending"||x.status==="under_review")reviewActions(row,[[tr("قيد المراجعة","Review"),()=>reviewCertificate(x,"under_review")],[tr("مؤهل للمراجعة النهائية","Mark eligible"),()=>reviewCertificate(x,"eligible")],[tr("رفض","Decline"),()=>reviewCertificate(x,"declined")]]);certs.append(row)});
 if(!S.proposals.length)empty(research,"لا توجد مقترحات واردة بعد.","No proposals submitted yet.");
 else S.proposals.forEach(x=>{const {row}=newRow(x.title,x.question+" · "+tr("المالك: ","Author: ")+x.author_id,x.status);
 if(["submitted","in_review"].includes(x.status))reviewActions(row,[[tr("قيد التقييم","Review"),()=>reviewProposal(x,"in_review")],[tr("اعتماد إداري","Admin accept"),()=>reviewProposal(x,"accepted")],[tr("رفض","Decline"),()=>reviewProposal(x,"declined")]]);research.append(row)})}
function renderQuality(){const out=$("osQualityList");clear(out);if(!S.audit.length){empty(out,"لا توجد أحداث تدقيق مسجلة بعد. سيسجل النظام محاولات الاختبار ونشره وإنشاء أسئلته.","No logged audit events yet. The system logs exam submissions, publishing and question creation.");return}
 S.audit.forEach(x=>out.append(newRow(x.event_type,x.object_type+" · "+(x.object_id||"")+" · "+safeDate(x.created_at),"active").row))}
function renderAll(){renderMetrics();renderCourses();renderModules();renderAttendance();renderExamList();renderGrades();renderCredentials();renderResearch();renderFaculty();if(S.isAdmin){renderAdminCourses();renderAdminExams();renderReview();renderQuality()}else{for(const id of ["osAdminCourses","osAdminExams","osAdminCerts","osAdminResearch","osQualityList"])clear($(id))}if(S.chosenExam)renderExamQuestions()}
async function createCourse(e){e.preventDefault();if(!S.isAdmin)return;
 const input={slug:$("osCourseSlug").value.trim(),code:$("osCourseCode").value.trim().toUpperCase(),title_ar:$("osCourseAr").value.trim(),title_en:$("osCourseEn").value.trim(),hours:Number($("osCourseHours").value),status:"draft"};
 await q(db.from("courses").insert(input).select("id").single());e.target.reset();report(tr("أُنشئت مسودة المقرر في قاعدة البيانات، ولم تُفتح للتسجيل بعد.","Course draft saved to the database; enrolment is not open."));await loadCollections()}
async function assignFaculty(e){e.preventDefault();if(!S.isAdmin)return;const id=$("osAssignCourse").value,lecturer=$("osAssignLecturer").value.trim();
 await q(db.rpc("nabd_os_assign_faculty",{p_course_id:id,p_lecturer_id:lecturer,p_active:true}));e.target.reset();report(tr("حُفظ التكليف وربط باستوديو المحاضر.","Faculty assignment saved and synchronised with the teaching studio."));await loadCollections()}
async function saveModule(e){e.preventDefault();const id=$("osModuleCourse").value;if(!facultyCourseIds().includes(id))return;
 const m={course_id:id,title_ar:$("osModuleTitle").value.trim(),title_en:$("osModuleTitleEn").value.trim(),summary_ar:$("osModuleSummary").value.trim(),resource_url:$("osModuleLink").value.trim(),status:$("osModuleStatus").value,created_by:S.user.id};
 if(m.resource_url&&!m.resource_url.startsWith("https://")){report(tr("يجب أن يستخدم رابط المصدر HTTPS.","Resource links must use HTTPS."),true);return}
 await q(db.from("nabd_os_course_modules").insert(m).select("id").single());e.target.reset();report(tr("تم حفظ الوحدة التعليمية وفق الصلاحيات.","Learning unit saved under your role permissions."));await loadCollections()}
async function saveAttendance(e){e.preventDefault();const moduleId=$("osAttendanceModule").value,module=S.modules.find(m=>m.id===moduleId);if(!module||!facultyCourseIds().includes(module.course_id))return;
 const studentId=$("osAttendanceStudent").value;if(!S.roster.some(r=>r.student_id===studentId)){report(tr("اختر طالبًا من القائمة المصرح بها.","Select an enrolled student from the authorised roster."),true);return}
 const payload={course_id:module.course_id,module_id:moduleId,student_id:studentId,status:$("osAttendanceStatus").value,recorded_by:S.user.id};
 await q(db.from("nabd_os_attendance").upsert(payload,{onConflict:"module_id,student_id"}).select("id").single());e.target.reset();report(tr("تم تسجيل الحضور بالاعتماد على بيانات التسجيل.","Attendance recorded after enrolment and permissions checks."));await loadCollections()}
async function createExam(e){e.preventDefault();if(!S.isAdmin)return;await q(db.from("nabd_os_exams").insert({course_id:$("osExamCourse").value,title_ar:$("osExamAr").value.trim(),title_en:$("osExamEn").value.trim(),passing_percent:Number($("osExamPass").value),created_by:S.user.id,status:"draft"}).select("id").single());e.target.reset();report(tr("أُنشئت مسودة اختبار. أضف الأسئلة ثم انشرها يدويًا.","Exam draft created. Add questions and publish only after review."));await loadCollections()}
async function createQuestion(e){e.preventDefault();if(!S.isAdmin)return;
 const ar=$("osOptionsAr").value.split("\n").map(x=>x.trim()).filter(Boolean),en=$("osOptionsEn").value.split("\n").map(x=>x.trim()).filter(Boolean),idx=Number($("osCorrectIndex").value)-1;
 if(ar.length<2||ar.length>6||en.length!==ar.length||idx<0||idx>=ar.length){report(tr("أدخل 2–6 خيارات بالعربية والإنجليزية بنفس العدد وحدد الإجابة الصحيحة.","Use 2–6 matching Arabic/English choices and select a valid answer."),true);return}
 await q(db.rpc("nabd_os_add_exam_question",{p_exam_id:$("osQuestionExam").value,p_prompt_ar:$("osQuestionAr").value.trim(),p_prompt_en:$("osQuestionEn").value.trim(),p_options_ar:ar,p_options_en:en,p_correct_index:idx,p_points:Number($("osQuestionPoints").value)}));
 e.target.reset();report(tr("تم حفظ السؤال ومفتاح الإجابة الخاص به بأمان على الخادم.","Question and private answer key saved atomically on the server."));await loadCollections()}
async function requestCredential(e){e.preventDefault();const courseId=$("osCredentialCourse").value;if(!S.enrollments.some(x=>x.course_id===courseId))return;
 await q(db.from("nabd_os_certificate_requests").insert({student_id:S.user.id,course_id:courseId,status:"pending"}).select("id").single());report(tr("تم تسجيل طلب مراجعة الاستحقاق، وليس إصدار شهادة.","Eligibility review requested; no certificate was issued."));await loadCollections()}
async function sendProposal(e){e.preventDefault();
 const p={author_id:S.user.id,title:$("osResearchTitle").value.trim(),question:$("osResearchQuestion").value.trim(),methodology:$("osResearchMethod").value.trim(),status:"submitted"};
 await q(db.from("nabd_os_research_proposals").insert(p).select("id").single());e.target.reset();report(tr("تم تسجيل المقترح للمراجعة الإدارية، دون اعتماد أخلاقي تلقائي.","Proposal submitted for administrative review; no ethics approval implied."));await loadCollections()}
async function reviewCertificate(entry,status){if(!S.isAdmin)return;const detail=prompt(tr("ملاحظة المراجع (اختيارية، دون بيانات شخصية):","Reviewer note (optional; no personal data):"),"");if(detail===null)return;
 if(status==="eligible"&&!confirm(tr("هل تحققت من الإنجاز والتسجيل والدليل؟ هذا ليس إصدار شهادة.","Have you verified enrolment and completion evidence? This does not issue a certificate.")))return;
 await q(db.from("nabd_os_certificate_requests").update({status,reviewer_id:S.user.id,reviewer_note:detail.slice(0,1000),reviewed_at:new Date().toISOString()}).eq("id",entry.id).select("id").single());report(tr("تم تحديث حالة المراجعة. إصدار الشهادة خطوة إدارية منفصلة.","Review status updated. Official issuance is a separate admin action."));await loadCollections()}
async function reviewProposal(entry,status){if(!S.isAdmin)return;const detail=prompt(tr("ملاحظة مراجعة بحثية (اختيارية):","Research review note (optional):"),"");if(detail===null)return;
 await q(db.from("nabd_os_research_proposals").update({status,reviewer_id:S.user.id,reviewer_note:detail.slice(0,1500),updated_at:new Date().toISOString()}).eq("id",entry.id).select("id").single());report(tr("تمت مراجعة المقترح إداريًا. أي دراسة بمشاركين تحتاج موافقة أخلاقيات منفصلة.","Administrative review recorded. Human-subject studies require separate ethics approval."));await loadCollections()}
function bind(){
 $("osLang").addEventListener("click",()=>{S.language=S.language==="ar"?"en":"ar";d.documentElement.lang=S.language;d.documentElement.dir=S.language==="ar"?"rtl":"ltr";d.querySelectorAll("[data-ar][data-en]").forEach(e=>{e.textContent=e.getAttribute("data-"+S.language)});$("osLang").textContent=S.language==="ar"?"EN":"عربي";if(S.user)renderAll()});
 $("osLoginForm").addEventListener("submit",async e=>{e.preventDefault();if(!db)return;const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;try{const {error}=await db.auth.signInWithPassword({email:$("osEmail").value.trim(),password:$("osPassword").value});$("osPassword").value="";if(error)throw error;await bootstrap()}catch(err){report(tr("فشل الدخول. تحقق من بيانات الحساب.","Sign-in failed; verify account credentials."),true)}finally{btn.disabled=false}});
 $("osLogout").addEventListener("click",async()=>{try{if(db)await db.auth.signOut()}finally{resetPrivateState();report(tr("تم تسجيل الخروج.","Signed out."))}});
 $("osRefresh").addEventListener("click",bootstrap);
 d.querySelectorAll("[data-os-view]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.osView)));
 $("osCloseExam").addEventListener("click",()=>{$("osExamPlayer").hidden=true;S.chosenExam=null;S.questions=[];S.answers={}});
 $("osSubmitExam").addEventListener("click",submitExam);
 const forms=[["osCreateCourseForm",createCourse],["osAssignForm",assignFaculty],["osModuleForm",saveModule],["osAttendanceForm",saveAttendance],["osCreateExamForm",createExam],["osQuestionForm",createQuestion],["osCredentialForm",requestCredential],["osResearchForm",sendProposal]];
 forms.forEach(([id,handler])=>$(id).addEventListener("submit",async e=>{e.preventDefault();const b=e.target.querySelector('button[type="submit"]');if(!S.user||b?.disabled)return;if(b)b.disabled=true;try{await handler(e)}catch(err){report(errMessage(err),true)}finally{if(b)b.disabled=false}}));
 $("osModuleCourse").addEventListener("change",updateAttendanceModules);
 $("osAttendanceModule").addEventListener("change",()=>{void refreshRoster()});
 if(db?.auth?.onAuthStateChange)db.auth.onAuthStateChange((event,session)=>{
  if(event==="SIGNED_OUT"){resetPrivateState();report(tr("تم تسجيل الخروج.","Signed out."))}
  else if(event==="SIGNED_IN"&&session?.user?.id&&S.user&&session.user.id!==S.user.id){resetPrivateState();setTimeout(()=>{void bootstrap()},0)}
 });
 bootstrap();
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",bind);else bind();
})();