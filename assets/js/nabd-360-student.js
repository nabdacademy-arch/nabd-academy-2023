/* NABD UNIVERSITY 360 — authenticated private study plan, actual achievements, voluntary lecturer requests.
   Public pages never read another user's private data or issue credentials.
*/
(()=>{"use strict";
const D=document,mode=D.body?.dataset.n360;if(!["student","faculty"].includes(mode))return;
const $=id=>D.getElementById(id),node=(tag,cl,value)=>{const x=D.createElement(tag);if(cl)x.className=cl;if(value!==undefined)x.textContent=String(value);return x};
const state={lang:"ar",db:null,user:null,plans:null,enrollments:null,attempts:null,modules:null,skills:null,certificates:null,courses:null,app:null,busy:false,serial:0};
const tr=(ar,en)=>state.lang==="ar"?ar:en,local=(ar,en)=>state.lang==="ar"?(ar||en||""):(en||ar||"");
const privatePattern=/(?:\S+@\S+\.\S+)|(?:\+?\d[\s\-]?){8,}|(?:password|passport|patient\s*(?:id|name|record)|كلمة\s*(?:السر|المرور)|اسم\s*المريض|رقم\s*الهويه|رقم\s*الهوية)/iu;
function date(value){const t=new Date(value);return Number.isFinite(t.getTime())?new Intl.DateTimeFormat(state.lang==="ar"?"ar":"en",{dateStyle:"medium"}).format(t):""}
function note(id,ar,en,isError=false){const el=$(id);if(!el)return;el.textContent=tr(ar,en);el.classList.toggle("bad",!!isError)}
function authError(ar,en){note("n360-auth",ar,en,true);const a=node("a","",tr("تسجيل الدخول ↗","Sign in ↗"));a.href="learning/#account";$("n360-auth").append(" ",a)}
function translate(){
 D.documentElement.lang=state.lang;D.documentElement.dir=state.lang==="ar"?"rtl":"ltr";
 $("n360-lang").textContent=tr("EN","عربي");D.querySelectorAll("[data-ar][data-en]").forEach(x=>x.textContent=x.dataset[state.lang]);
 if(mode==="student"&&state.user){renderStats();renderRecommendations();renderAchievements()}
 if(mode==="faculty"&&state.app)renderApplication()
}
function makeLink(href,ar,en){const a=node("a","",tr(ar,en)+" ↗");a.href=href;return a}
function visible(x){return Array.isArray(x)}
function metric(count,ar,en){const c=node("article","n360-stat");c.append(node("strong","",count===null?"—":String(count)),node("span","",tr(ar,en)));return c}
function renderStats(){
 const box=$("n360-stats");if(!box)return;box.replaceChildren(
  metric(visible(state.enrollments)?state.enrollments.length:null,"مقررات مسجلة","Enrolled courses"),
  metric(visible(state.attempts)?state.attempts.length:null,"محاولات اختبارات مسجلة","Recorded exam attempts"),
  metric(visible(state.modules)?state.modules.length:null,"وحدات تعليمية مرئية","Visible teaching modules"),
  metric(visible(state.skills)?state.skills.filter(v=>v.verification_status==="verified"&&(!v.expires_at||new Date(v.expires_at)>new Date())).length:null,"مهارات تعليمية موثقة وسارية","Current verified learning skills")
 )
}
function suggestion(titleAR,titleEN,detailAR,detailEN,href,labelAR,labelEN){
 const card=node("article","n360-suggestion");card.append(node("strong","",tr(titleAR,titleEN)),node("span","",tr(detailAR,detailEN)),makeLink(href,labelAR,labelEN));return card
}
function renderRecommendations(){
 const host=$("n360-suggestions");if(!host)return;host.replaceChildren();
 if(!visible(state.enrollments)){host.append(node("p","n360-hint",tr("تعذّر التحقق من سجلات التسجيل؛ لا يمكن احتساب خطة شخصية موثوقة.","Enrolment data could not be verified. Personalised suggestions are unavailable.")));return}
 if(state.enrollments.length===0){
  host.append(suggestion("ابدأ من مقرراتك","Start with your courses","لم يظهر تسجيل في مقرر مرتبط بحسابك.","No authorised enrolment was found for this account.","academy.html","استعرض المقررات","Browse courses"))
 }else{
  const chosen=state.plans?.course_id;
  const enrolled=state.enrollments.find(e=>e.course_id===chosen)||state.enrollments[0];
  const course=(state.courses||[]).find(c=>c.id===enrolled.course_id);
  host.append(suggestion("مسارك: "+(course?local(course.title_ar,course.title_en):tr("مقرر مسجل","Enrolled course")),"Your enrolled course",
   "راجع محتوى المقرر ووحداته المعتمدة من نظام الجامعة.","Review the course and approved learning units within the Academic OS.","university-os.html","مساحة المقرر","Open course"));
  if(visible(state.modules)&&state.modules.filter(m=>m.course_id===enrolled.course_id).length===0)host.append(suggestion("بداية آمنة","Safe starting point","لم تظهر وحدات منشورة لهذا المقرر؛ استخدم مواد التعلم العامة لحين تفعيلها.","No published modules are available for this course; use general learning materials until authorised content is ready.","learning/","مكتبة التعلم","Learning library"))
 }
 if(visible(state.attempts)&&state.attempts.length===0)host.append(suggestion("التدرّب لا يساوي درجة","Practice is not a grade","لا تظهر محاولات اختبار رسمية. استخدم أسئلة التدريب التعليمية، وليس درجات وهمية.","No official exam attempt is visible; practise in the learning library without inventing marks.","learning/","أسئلة تدريبية","Practice questions"));
 host.append(suggestion("المعلم الذكي عند الحاجة","Opt-in learning tutor","يمكنك طرح سؤال علمي عام بعد تسجيل الدخول؛ لا تُرسل بيانات مرضى أو أسرارًا.","Ask general scientific questions after sign-in. Do not submit patient details or secrets.","learning/","افتح المعلم","Open tutor"))
}
function renderAchievements(){
 const host=$("n360-achievements");if(!host)return;host.replaceChildren();
 if(!visible(state.skills)||!visible(state.certificates)){host.append(node("p","n360-hint",tr("تعذّر فحص بعض سجلات الإنجازات. لا يمكن اعتبارها صفرًا.","Some achievement records could not be verified; they are not assumed to be empty.")));return}
 const filtered=state.skills.filter(v=>v.verification_status==="verified"&&(!v.expires_at||new Date(v.expires_at)>new Date()));
 const certs=state.certificates.filter(v=>["issued","active","valid","verified"].includes(String(v.status||"").toLowerCase()));
 if(filtered.length===0&&certs.length===0){host.append(node("p","n360-hint",tr("لا توجد في حسابك حاليًا مهارات موثقة سارية أو شهادات صادرة ظاهرة عبر صلاحياتك. هذا لا يعني إلغاء أي وثائق خارج النظام.","There are no currently visible verified skills or issued credential records for this account. Other legacy documents may exist outside this view.")));return}
 for(const s of filtered){
  const c=node("article","n360-achievement");
  c.append(node("small","","VERIFIED EDUCATIONAL SKILL"),node("strong","",tr("مهارة تعليمية موثقة","Verified educational skill")),node("p","",tr("المستوى: ","Level: ")+(s.level||"—")),node("small","",tr("التوثيق: ","Verified on: ")+date(s.issued_at)));
  if(s.public_reference)c.append(node("small","",tr("مرجع: ","Reference: ")+s.public_reference));host.append(c);
 }
 for(const s of certs){
  const c=node("article","n360-achievement");c.append(node("small","","EXISTING CREDENTIAL RECORD"),node("strong","",s.course_title||tr("سجل شهادة","Credential record")),node("p","",tr("حالة السجل: ","Record status: ")+s.status),node("small","",tr("تاريخ الإصدار: ","Issued: ")+date(s.issue_date)));
  host.append(c)
 }
}
function planControls(){
 const sel=$("n360-course");sel.replaceChildren();const empty=node("option","",tr("خطة عامة","General plan"));empty.value="";sel.append(empty);
 for(const e of state.enrollments||[]){
  if(sel.querySelector('[value="'+e.course_id+'"]'))continue;
  const course=(state.courses||[]).find(c=>c.id===e.course_id);
  const option=node("option","",course?local(course.title_ar,course.title_en):tr("المقرر المسجل","Enrolled course")+" "+e.course_id.slice(0,8));
  option.value=e.course_id;sel.append(option)
 }
 sel.value=state.plans?.course_id||"";
 $("n360-minutes").value=String(state.plans?.weekly_goal_minutes??180);
 $("n360-focus").value=state.plans?.focus_note||"";
}
async function loadStudent(){
 const uid=state.user.id;
 const targets=[
 ["enrollments",state.db.from("enrollments").select("id,course_id,status,progress,enrolled_at").eq("student_id",uid).limit(100)],
 ["attempts",state.db.from("nabd_os_exam_attempts").select("id,exam_id,score,max_score,passed,submitted_at").eq("student_id",uid).limit(100)],
 ["modules",state.db.from("nabd_os_course_modules").select("id,course_id,title_ar,title_en,status").eq("status","published").limit(200)],
 ["skills",state.db.from("nabd_skill_verifications").select("id,skill_id,level,verification_status,issued_at,expires_at,public_reference").eq("student_id",uid).limit(150)],
 ["certificates",state.db.from("certificates").select("id,certificate_id,course_title,status,issue_date").eq("student_id",uid).limit(100)],
 ["courses",state.db.from("courses").select("id,code,title_ar,title_en,status").limit(200)],
 ["plans",state.db.from("nabd_360_study_plans").select("user_id,course_id,weekly_goal_minutes,focus_note").eq("user_id",uid).maybeSingle()]
 ];
 const serial=++state.serial;
 const outcomes=await Promise.allSettled(targets.map(x=>x[1]));
 if(serial!==state.serial)return;
 outcomes.forEach((v,i)=>{
  const key=targets[i][0];state[key]=v.status==="fulfilled"&&!v.value.error?(key==="plans"?v.value.data:v.value.data||[]):null
 });
 $("n360-student-app").hidden=false;
 note("n360-auth","تم التحقق من حسابك؛ معروضة سجلاتك المخولة فقط.","Authenticated. Only records authorised for your account are shown.");
 planControls();renderStats();renderRecommendations();renderAchievements()
}
async function savePlan(e){
 e.preventDefault();if(state.busy||!state.user||!state.db)return;
 const userId=state.user.id,courseId=$("n360-course").value||null,goal=Number($("n360-minutes").value),focus=$("n360-focus").value.trim();
 if(!Number.isInteger(goal)||goal<30||goal>900||focus.length>240||(courseId&&!(state.enrollments||[]).some(x=>x.course_id===courseId))){note("n360-plan-status","تحقق من المقرر والهدف الأسبوعي.","Verify the selected course and weekly goal.",true);return}
 if(privatePattern.test(focus)){note("n360-plan-status","لا تضع معلومات شخصية أو بيانات مرضى في هدفك.","Don't include personal or patient information in a study goal.",true);return}
 state.busy=true;$("n360-save-plan").disabled=true;
 try{
  const payload={course_id:courseId,weekly_goal_minutes:goal,focus_note:focus,updated_at:new Date().toISOString()};
  const query=state.plans?state.db.from("nabd_360_study_plans").update(payload).eq("user_id",userId).select("user_id,course_id,weekly_goal_minutes,focus_note").maybeSingle():state.db.from("nabd_360_study_plans").insert({user_id:userId,...payload}).select("user_id,course_id,weekly_goal_minutes,focus_note").single();
  const {data,error}=await query;if(error||!data||data.user_id!==userId)throw error||Error("No row returned");
  state.plans=data;note("n360-plan-status","حُفظ هدفك في حسابك فعلًا.","Your private study goal was saved.");renderRecommendations()
 }catch(err){note("n360-plan-status","لم يُؤكد حفظ الخطة. تحقق من الاتصال والصلاحيات.","Plan could not be saved. Check connectivity and account permissions.",true)}
 finally{state.busy=false;$("n360-save-plan").disabled=false}
}
function renderApplication(){
 const box=$("n360-application-status"),form=$("n360-application");
 if(!box||!form)return;
 box.hidden=!state.app;form.hidden=!!state.app;
 if(!state.app)return;
 const statuses={pending:["بانتظار المراجعة","Awaiting review"],reviewing:["قيد التقييم","Under review"],approved:["وافق المسؤول على الطلب — التكليف والتوقيت منفصلان","Staff approved review — scheduling and assignment are separate"],declined:["لم تتم الموافقة على الطلب","Application not approved"]};
 const d=$("n360-application-data");d.replaceChildren(node("strong","",(statuses[state.app.status]||[state.app.status,state.app.status])[state.lang==="ar"?0:1]));
 d.append(node("p","",tr("التخصص: ","Specialty: ")+state.app.expertise),node("small","",tr("تاريخ التقديم: ","Submitted: ")+date(state.app.created_at)));
}
async function loadFaculty(){
 const {data,error}=await state.db.from("nabd_360_lecturer_applications").select("id,applicant_id,expertise,status,created_at").eq("applicant_id",state.user.id).maybeSingle();
 if(error){note("n360-auth","تعذر قراءة الطلب. لن نفترض عدم وجوده.","Could not verify your existing application.",true);return}
 state.app=data||null;$("n360-application").hidden=!!state.app;
 renderApplication();note("n360-auth","حسابك موثّق. يمكنك متابعة طلبك أو التقديم.","Authenticated: you may submit or track an application.")
}
async function submitFaculty(e){
 e.preventDefault();if(state.busy||!state.user||!state.db||state.app)return;
 const val=id=>$(id).value.trim(),hours=Number(val("n360-hours")),email=val("n360-email"),topic=val("n360-topic");
 const payload={
  applicant_id:state.user.id,full_name:val("n360-fullname"),contact_email:email,
  expertise:val("n360-expertise"),institution:val("n360-institution"),
  country:val("n360-country"),offer_topic:topic,weekly_hours:hours,consent:$("n360-consent").checked,status:"pending"
 };
 if(!payload.consent||!Number.isInteger(hours)||hours<1||hours>12||topic.length<10||topic.length>800||!email.includes("@")||privatePattern.test(topic)){
  note("n360-auth","تحقق من الحقول والموافقة وتجنب إدخال بيانات خاصة بالمرضى.","Check your details and consent; do not include patient information.",true);return
 }
 state.busy=true;$("n360-apply-submit").disabled=true;
 try{
  const {data,error}=await state.db.from("nabd_360_lecturer_applications").insert(payload).select("id,applicant_id,expertise,status,created_at").single();
  if(error||!data?.id)throw error||Error("No confirmed application");
  state.app=data;renderApplication();note("n360-auth","حُفظ طلبك الحقيقي بنجاح، وهو الآن بانتظار مراجعة الإدارة.","Your application was saved and awaits staff review.")
 }catch(err){note("n360-auth","تعذّر تأكيد الطلب؛ قد يكون لديك طلب سابق أو أن الاتصال غير متاح.","The application could not be confirmed. You may already have a request or the network is unavailable.",true)}
 finally{state.busy=false;$("n360-apply-submit").disabled=false}
}
async function generateStudyRevision(){
 if(state.busy||!state.user||!state.db)return;
 const answer=$("n360-ai-answer");if(!state.plans){answer.textContent=tr("احفظ هدفك الدراسي أولًا قبل طلب المراجعة.","Save your weekly study goal before requesting AI revision.");return}
 const course=(state.courses||[]).find(c=>c.id===state.plans.course_id);
 const title=course?local(course.title_ar,course.title_en):tr("مراجعة علوم طبية عامة","General medical-science learning");
 const focus=state.plans.focus_note||tr("المفاهيم الأساسية","Core concepts");
 if(privatePattern.test(title+" "+focus)){answer.textContent=tr("تجنب إدراج أي معلومات شخصية أو بيانات مرضى.","Please remove personal or patient information from your study goal.");return}
 const prompt="Create a general educational weekly study plan (not clinical advice) in "+(state.lang==="ar"?"Arabic":"English")+". Course: "+title.slice(0,150)+". Study budget: "+state.plans.weekly_goal_minutes+" minutes per week. Focus: "+focus.slice(0,240)+". Provide 4 practical revision tasks, a suggested time allocation, and two self-check questions. Do not invent actual course content, credentials, grades, or medical facts without citations.";
 state.busy=true;$("n360-ai-plan").disabled=true;answer.textContent=tr("يجري إرسال سؤالك التعليمي فقط إلى خدمة نبض بعد طلبك الصريح…","Sending only your educational revision prompt to the NABD AI service by your request…");
 try{
  const auth=await state.db.auth.getUser();
  if(auth.error||auth.data?.user?.id!==state.user.id)throw Error("AUTH");
  const slug=window.NABD_CONFIG?.tutorFunction||"smart-processor";
  const {data,error}=await state.db.functions.invoke(slug,{body:{question:prompt,language:state.lang,image:null}});
  if(error||typeof data?.answer!=="string"||!data.answer.trim())throw error||Error("NO_ANSWER");
  answer.textContent=tr("خطة مراجعة مولّدة، تحتاج التحقق من المصادر:\n","Generated revision plan — verify the sources:\n")+data.answer.slice(0,4500);
 }catch(err){answer.textContent=tr("تعذّر توليد الخطة الآن؛ قد يلزم تفعيل المزوّد أو مراجعة الحصة. استخدم توصيات المقررات الموجودة أعلاه.","AI revision could not be generated. Provider configuration or quota may need attention; use the verified course suggestions above.")}
 finally{state.busy=false;$("n360-ai-plan").disabled=false}
}
function clearPrivate(){
 state.serial++;state.user=null;state.plans=null;state.enrollments=null;state.attempts=null;state.modules=null;state.skills=null;state.certificates=null;state.courses=null;state.app=null;
 if($("n360-student-app"))$("n360-student-app").hidden=true;
 if($("n360-achievements"))$("n360-achievements").replaceChildren(node("p","n360-hint",tr("سجّل الدخول لعرض ملفك.","Sign in to view your record.")));
 if($("n360-application"))$("n360-application").hidden=true;
 if($("n360-application-status"))$("n360-application-status").hidden=true
}
async function boot(){
 clearPrivate();
 if(!window.supabase?.createClient||!window.NABD_CONFIG?.supabaseUrl||!window.NABD_CONFIG?.supabaseAnonKey){
  authError("تعذر تهيئة خدمة الحساب. افحص الإنترنت.","Account service unavailable. Check your connection.");return
 }
 try{
  if(!state.db){state.db=window.supabase.createClient(window.NABD_CONFIG.supabaseUrl,window.NABD_CONFIG.supabaseAnonKey);
   if(state.db.auth.onAuthStateChange)state.db.auth.onAuthStateChange((event)=>{
    if(event==="SIGNED_OUT"){clearPrivate();authError("سجّل الدخول لعرض بياناتك.","Sign in to view private data.")}
    else if(event==="SIGNED_IN")setTimeout(()=>{void boot()},0)
   });
  }
  const {data,error}=await state.db.auth.getUser();
  if(error||!data?.user?.id){authError("سجّل الدخول إلى حسابك أولًا لعرض بياناتك الخاصة.","Sign in first to view private records.");return}
  state.user=data.user;
  if(mode==="student")await loadStudent();else await loadFaculty()
 }catch(err){authError("تعذر التحقق من الحساب أو قاعدة البيانات.","Could not verify your account or database.")}
}
$("n360-lang").addEventListener("click",()=>{state.lang=state.lang==="ar"?"en":"ar";translate()});
if(mode==="student"){$("n360-plan-form").addEventListener("submit",e=>{void savePlan(e)});$("n360-ai-plan").addEventListener("click",()=>{void generateStudyRevision()})}
else $("n360-faculty-form").addEventListener("submit",e=>{void submitFaculty(e)});
translate();void boot();
})();