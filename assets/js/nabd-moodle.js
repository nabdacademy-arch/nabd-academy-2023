/* NABD Moodle · Integrated student learning hub.
   Uses the existing academy Supabase session and strict per-user database policies.
   No fabricated grades, courses, enrollment records or exam access. */
(function(){
"use strict";
if(!document.querySelector("[data-moodle-root]"))return;
const $=id=>document.getElementById(id);
const db=window.nabdSupabase;
const state={user:null,profile:null,courses:null,enrollments:null,exams:null,grades:null,language:"ar",loading:false};
const symbols={"medical-terminology":"ABC","general-anatomy":"♧",physiology:"♥",biochemistry:"⬡",pathology:"✚"};
const t=(ar,en)=>state.language==="ar"?ar:en;
function node(tag,className,value){
 const element=document.createElement(tag);
 if(className)element.className=className;
 if(value!==undefined)element.textContent=String(value);
 return element;
}
function notice(id,msg,kind){
 const box=$(id);if(!box)return;
 box.hidden=!msg;box.textContent=msg||"";
 box.className="mdl-alert"+(kind?" "+kind:"");
}
function dateStr(value,withTime=false){
 if(!value)return "—";
 try{return new Intl.DateTimeFormat(state.language==="ar"?"ar-PS":"en-GB",
   withTime?{dateStyle:"medium",timeStyle:"short"}:{dateStyle:"medium"}).format(new Date(value));}
 catch{return "—"}
}
}
function applyLanguage(l){
 state.language=l==="en"?"en":"ar";
 document.documentElement.lang=state.language;
 document.documentElement.dir=state.language==="ar"?"rtl":"ltr";
 $("mdl-language").textContent=state.language==="ar"?"EN":"عربي";
 document.querySelectorAll("[data-ar][data-en]").forEach(el=>{
   const text=el.getAttribute("data-"+state.language);
   if(text!==null)el.textContent=text;
 });
 try{localStorage.setItem("nabdMoodleLanguage",state.language)}catch(_){}
 render();
}
function showLogin(message=""){
 $("mdl-app").hidden=true;$("mdl-denied").hidden=true;$("mdl-login").hidden=false;
 notice("mdl-login-message",message,message?"error":"");
}
function showDenied(){
 $("mdl-app").hidden=true;$("mdl-denied").hidden=false;$("mdl-login").hidden=true;
}
function showApp(){
 $("mdl-app").hidden=false;$("mdl-denied").hidden=true;$("mdl-login").hidden=true;
}
async function authenticate(){
 if(!db)return showLogin(t("الاتصال بنظام الحسابات غير متاح حاليًا.","Account service is unavailable."));
 const {data,error}=await db.auth.getUser();
 const user=data?.user;
 if(error||!user){state.user=null;state.profile=null;return showLogin();}
 const profileResult=await db.from("profiles").select("id,full_name,email,role").eq("id",user.id).maybeSingle();
 if(profileResult.error||!profileResult.data){
   return showLogin(t("تعذر التحقق من ملف الطالب. راجع حسابك في بوابة الطلاب.","Could not verify your student profile."));
 }
 if(profileResult.data.role!=="student")return showDenied();
 state.user=user;state.profile=profileResult.data;showApp();
 await refreshAll();
}
$("mdl-login-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!db)return;
 const email=$("mdl-email").value.trim(),password=$("mdl-password").value;
 if(!email||!password)return;
 const button=$("mdl-sign-in");button.disabled=true;
 notice("mdl-login-message",t("جارٍ تسجيل الدخول والتحقق من الحساب…","Signing in and verifying your account…"));
 const {error}=await db.auth.signInWithPassword({email,password});
 $("mdl-password").value="";button.disabled=false;
 if(error)return notice("mdl-login-message",t("فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.","Sign-in failed. Check your email and password."),"error");
 await authenticate();
});
async function signOut(){
 if(db)await db.auth.signOut();
 state.user=null;state.profile=null;state.courses=null;state.enrollments=null;state.exams=null;state.grades=null;
 showLogin();
}
$("mdl-sign-out").addEventListener("click",signOut);
$("mdl-change-account").addEventListener("click",signOut);
$("mdl-refresh").addEventListener("click",()=>refreshAll(true));
$("mdl-language").addEventListener("click",()=>applyLanguage(state.language==="ar"?"en":"ar"));
async function refreshAll(manual=false){
 if(!state.user||state.loading)return;
 state.loading=true;$("mdl-refresh").disabled=true;
 if(manual)notice("mdl-load-message",t("جارٍ تحديث بيانات حسابك…","Refreshing your account data…"));
 const [courses,enrollments,exams,grades]=await Promise.all([
   db.from("courses").select("id,slug,code,title_ar,title_en,description_ar,description_en,hours,status")
     .eq("status","active").order("title_ar").limit(50),
   db.from("enrollments").select("id,course_id,status,progress,enrolled_at")
     .eq("student_id",state.user.id).limit(100),
   db.rpc("nabd_quality_active_exams"),
   db.rpc("nabd_quality_student_history")
 ]);
 const failures=[];
 if(courses.error){state.courses=null;failures.push(t("الدورات","Courses"));}else state.courses=courses.data||[];
 if(enrollments.error){state.enrollments=null;failures.push(t("التسجيلات","Enrollments"));}else state.enrollments=enrollments.data||[];
 if(exams.error){state.exams=null;failures.push(t("الامتحانات","Exams"));}else state.exams=exams.data||[];
 if(grades.error){state.grades=null;failures.push(t("الدرجات","Grades"));}else state.grades=grades.data||[];
 if(failures.length)notice("mdl-load-message",t("تعذر تحميل: ","Unable to load: ")+failures.join("، ")+".", "error");
 else notice("mdl-load-message","");
 state.loading=false;$("mdl-refresh").disabled=false;
 render();
}
function stat(id,value){$(id).textContent=value===null?"—":String(value)}
function render(){
 if(!state.user||!state.profile)return;
 const name=state.profile.full_name?.trim()||state.user.email?.split("@")[0]||t("طالب الأكاديمية","Academy Student");
 $("mdl-student-name").textContent=name;
 $("mdl-student-email").textContent=state.user.email||"";
 $("mdl-avatar").textContent=name.trim().charAt(0)||"N";
 stat("mdl-live-count",state.exams===null?null:state.exams.length);
 stat("mdl-enrolled-count",state.enrollments===null?null:state.enrollments.length);
 stat("mdl-graded-count",state.grades===null?null:state.grades.filter(g=>g.human_score!==null).length);
 stat("mdl-pending-count",state.grades===null?null:state.grades.filter(g=>g.human_score===null).length);
 $("mdl-course-total").textContent=state.courses===null?"—":state.courses.length+" "+t("دورات","courses");
 renderExams();renderCourses();renderGrades();
}
function renderExams(){
 const box=$("mdl-exams");box.replaceChildren();
 if(state.exams===null){
   box.append(node("p","mdl-empty",t("تعذر تحميل الامتحانات. حاول تحديث الصفحة.","Could not load examinations.")));return;
 }
 if(state.exams.length===0){
   box.append(node("p","mdl-empty",t("لا توجد امتحانات مفتوحة حاليًا. ستظهر هنا فور اعتمادها من مدير الأكاديمية، وتختفي تلقائيًا بعد انتهاء وقتها.","No exams are open now. Director-approved exams will appear here during their active window.")));return;
 }
 const gradeIds=new Set((state.grades||[]).map(g=>g.exam_id));
 for(const exam of state.exams){
   const card=node("article","mdl-exam-card"),head=node("div","mdl-exam-head");
   head.append(node("span","mdl-pill",t("● متاح الآن","● Open now")));
   const timer=node("strong","mdl-exam-timer","--:--");timer.dataset.deadline=exam.closes_at||"";head.append(timer);card.append(head);
   card.append(node("h3","",exam.title||t("امتحان الأكاديمية","Academy exam")));
   const meta=node("div","mdl-exam-meta");
   meta.append(node("span","",String(exam.question_count??0)+" "+t("سؤال","questions")),
     node("span","",String(exam.duration_minutes||60)+" "+t("دقيقة","min")),
     node("span","",exam.course_title||t("جميع الدورات","All courses")));
   card.append(meta);
   if(gradeIds.has(exam.id)){
     card.append(node("p","mdl-pill pending",t("سبق تسليم هذا الامتحان — راجع درجاتي","Already submitted — see My grades")));
     const gradesLink=node("a","mdl-outline",t("عرض نتيجتي","View my result"));
     gradesLink.href="#mdl-grades-section";card.append(gradesLink);
   }else{
     const link=node("a","mdl-primary",t("بدء وحلّ الامتحان","Start examination"));
     link.href="student-exams.html?exam="+encodeURIComponent(exam.id);
     card.append(link);
   }
   box.append(card);
 }
 updateTimers();
}
function updateTimers(){
 document.querySelectorAll(".mdl-exam-timer[data-deadline]").forEach(elem=>{
   const end=Date.parse(elem.dataset.deadline||"");
   const remain=Number.isFinite(end)?end-Date.now():0;
   if(remain<=0){
     elem.textContent="00:00";elem.classList.add("urgent");
     const card=elem.closest(".mdl-exam-card"),start=card?.querySelector('a[href^="student-exams.html?exam="]');
     if(start){start.removeAttribute("href");start.textContent=t("انتهى وقت الامتحان","Exam closed");start.setAttribute("aria-disabled","true");}
   }else{
     const seconds=Math.ceil(remain/1000);
     const mins=Math.floor(seconds/60);
     elem.textContent=String(mins).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
     elem.classList.toggle("urgent",remain<60000);
   }
 });
}
function courseStatus(enrollment){
 if(!enrollment)return null;
 if(enrollment.status==="completed")return t("الدورة مكتملة","Completed");
 if(enrollment.status==="active"||enrollment.status==="enrolled")return t("مسجّل بالدورة","Enrolled");
 return t("حالة التسجيل: ","Enrollment: ")+String(enrollment.status||"—");
}
function renderCourses(){
 const box=$("mdl-courses");box.replaceChildren();
 if(state.courses===null||state.enrollments===null){
   box.append(node("p","mdl-empty",t("تعذر التحقق من الدورات أو تسجيلاتك. جرّب التحديث.","Unable to verify courses or your enrollments.")));return;
 }
 if(state.courses.length===0){
   box.append(node("p","mdl-empty",t("لا توجد دورات مفتوحة للتسجيل حاليًا.","There are no open courses right now.")));return;
 }
 const byCourse=new Map(state.enrollments.map(e=>[e.course_id,e]));
 for(const course of state.courses){
   const enrol=byCourse.get(course.id);
   const card=node("article","mdl-course");card.dataset.course=course.slug||"";
   const banner=node("div","mdl-course-banner");
   banner.append(node("span","",course.code||"NABD COURSE"),
     node("strong","mdl-course-icon",symbols[course.slug]||"✦"));card.append(banner);
   const content=node("div","mdl-course-main");
   const title=node("h3","",state.language==="en"?(course.title_en||course.title_ar):(course.title_ar||course.title_en));
   title.append(node("small","",course.code||""));content.append(title);
   content.append(node("p","mdl-course-desc",
      state.language==="en"?(course.description_en||course.description_ar||""):
        (course.description_ar||course.description_en||"")));
   content.append(node("div","mdl-course-info",
      String(course.hours||0)+" "+t("ساعة تعليمية","learning hours")));
   const actions=node("div","mdl-course-actions");
   if(enrol){
     actions.append(node("span","mdl-pill "+(enrol.status==="completed"?"graded":""),courseStatus(enrol)));
     const enter=node("a","",t("افتح مساحة التعلم","Open learning"));
     enter.href="learning/";actions.append(enter);
   }else{
     const button=node("button","mdl-primary",t("التسجيل في الدورة","Enroll now"));button.type="button";
     button.addEventListener("click",()=>enroll(course,button));
     actions.append(button);
   }
   content.append(actions);card.append(content);box.append(card);
 }
}
async function enroll(course,button){
 if(!state.user||!db)return;
 const courseLabel=state.language==="ar"?course.title_ar:course.title_en;
 if(!window.confirm(t("تأكيد التسجيل في دورة ","Confirm enrollment in ")+courseLabel+"؟"))return;
 button.disabled=true;button.textContent=t("جارٍ التسجيل…","Enrolling…");
 const {data,error}=await db.rpc("nabd_moodle_self_enroll",{p_course_id:course.id});
 if(error||!Array.isArray(data)||data.length===0){
   button.disabled=false;button.textContent=t("التسجيل في الدورة","Enroll now");
   notice("mdl-course-message",t("تعذر تسجيلك في الدورة. تحقق من حالة حساب الطالب وجرب مرة أخرى.","Enrollment could not be completed. Check your student account and try again."),"error");
   return;
 }
 notice("mdl-course-message",t("تم تسجيلك بنجاح في دورة ","Successfully enrolled in ")+courseLabel+".","success");
 await refreshAll();
}
function renderGrades(){
 const tbody=$("mdl-grade-rows"),notes=$("mdl-grade-notes");tbody.replaceChildren();notes.replaceChildren();
 if(state.grades===null){
   const tr=node("tr");const td=node("td","",t("تعذر تحميل الدرجات. جرّب تحديث الصفحة.","Could not load grades."));td.colSpan=4;tr.append(td);tbody.append(tr);return;
 }
 if(!state.grades.length){
   const tr=node("tr");const td=node("td","",t("لم تسلّم أي امتحان بعد. عندما تسلّم امتحانًا ستظهر حالته ودرجته هنا بعد التصحيح.","No exam submissions yet. Your results appear here after human grading."));td.colSpan=4;tr.append(td);tbody.append(tr);return;
 }
 for(const item of state.grades){
   const graded=item.human_score!==null;
   const tr=node("tr"),title=node("td","",item.title||"—");
   const submitted=node("td","",dateStr(item.submitted_at,true));
   const score=node("td");
   score.append(node("strong","",graded?String(item.human_score)+" / 100":"—"));
   const status=node("td");
   status.append(node("span","mdl-pill "+(graded?"graded":"pending"),
     graded?t("تم التصحيح","Graded"):t("بانتظار التصحيح البشري","Awaiting human grading")));
   tr.append(title,submitted,score,status);tbody.append(tr);
   if(item.grade_notes){
     const card=node("article");card.append(node("strong","",item.title||""));
     card.append(node("p","",t("ملاحظة المصحّح: ","Reviewer's note: ")+item.grade_notes));
     notes.append(card);
   }
 }
}
let startLang="ar";try{if(localStorage.getItem("nabdMoodleLanguage")==="en")startLang="en"}catch(_){}
state.language=startLang;
$("mdl-language").textContent=startLang==="ar"?"EN":"عربي";
applyLanguage(startLang);
authenticate();
setInterval(()=>{if(state.user&&document.visibilityState==="visible")updateTimers()},1000);
setInterval(()=>{if(state.user&&document.visibilityState==="visible")refreshAll()},60000);
document.addEventListener("visibilitychange",()=>{if(state.user&&document.visibilityState==="visible")refreshAll()});
})();