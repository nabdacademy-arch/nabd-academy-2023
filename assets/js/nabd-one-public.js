/* NABD ONE public academic and live-campus directory: real data only, no simulated schedules. */
(()=>{"use strict";
if(document.body.dataset.onePage!=="hub")return;
const $=id=>document.getElementById(id),S={lang:"ar",courses:[],sessions:[],db:null,user:null};
const tr=(ar,en)=>S.lang==="ar"?ar:en;
const loc=(ar,en)=>S.lang==="ar"?ar||en||"":en||ar||"";
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
function message(id,text,bad=false){const e=$(id);e.textContent=text;e.classList.toggle("one-status-bad",bad)}
function link(href,ar,en){const a=make("a","one-btn secondary",tr(ar,en));a.href=href;return a}
function date(value){const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat(S.lang==="ar"?"ar":"en",{dateStyle:"medium",timeStyle:"short"}).format(d):tr("موعد غير صالح","Invalid time")}
function translate(){
 document.documentElement.lang=S.lang;document.documentElement.dir=S.lang==="ar"?"rtl":"ltr";
 $("one-lang").textContent=S.lang==="ar"?"EN":"عربي";
 document.querySelectorAll("[data-ar][data-en]").forEach(e=>e.textContent=e.getAttribute("data-"+S.lang));
 renderCourses();renderSessions();
}
function renderCourses(){
 const host=$("one-course-list");host.replaceChildren();
 if(!S.courses.length)return;
 for(const course of S.courses){
  const card=make("article","one-card");
  card.append(make("span","one-kicker","ACADEMIC / "+(course.code||"NABD")));
  card.append(make("h3","",loc(course.title_ar,course.title_en)));
  card.append(make("p","",tr("مقرر ظاهر من قاعدة الأكاديمية؛ التفاصيل والتسجيل من النظام المخوّل.","Listed in the academy catalogue. Details and enrolment require the authorised system.")));
  card.append(link("university-os.html", "افتح النظام الأكاديمي ↗","Open Academic OS ↗"));host.append(card)
 }
}
function renderSessions(){
 const host=$("one-live-list");host.replaceChildren();
 if(!S.sessions.length)return;
 for(const session of S.sessions){
  const card=make("article","one-card"),label=make("span","one-kicker",date(session.scheduled_at));
  card.append(label,make("h3","",loc(session.title_ar,session.title_en)));
  card.append(make("p","",loc(session.topic_ar,session.topic_en)));
  card.append(make("div","one-meta",(session.speaker_name||"")+" · "+(session.speaker_affiliation||"")));
  card.append(make("span","one-meta",tr("مدة اللقاء: ","Duration: ")+session.duration_minutes+tr(" دقيقة"," min")));
  const b=make("button","one-btn primary",tr("تسجيل اهتمامي بالمحاضرة","Register interest"));b.type="button";
  b.addEventListener("click",()=>{void signup(session,b)});card.append(b);host.append(card);
 }
}
async function signup(session,b){
 if(!S.db){message("one-live-status",tr("قاعدة البيانات غير متصلة. لا يمكن تأكيد التسجيل.","Database is unavailable; registration cannot be confirmed."),true);return}
 b.disabled=true;message("one-live-status",tr("التحقق من الحساب…","Checking your account…"));
 try{
  const auth=await S.db.auth.getUser();
  if(auth.error||!auth.data?.user){message("one-live-status",tr("سجّل الدخول إلى مساحة التعلّم أولًا، ثم عد لتسجيل اهتمامك.","Please sign in from the Learning Space before registering interest."),true);return}
  const {error}=await S.db.from("nabd_global_session_signups").insert({session_id:session.id,student_id:auth.data.user.id});
  if(error){message("one-live-status",error.code==="23505"?tr("أنت مسجل لهذه المحاضرة مسبقًا.","You already registered for this session."):tr("لم يؤكد النظام التسجيل. راجع تاريخ المحاضرة وصلاحية الحساب.","Registration was not confirmed. Check the session date and account permissions."),error.code!=="23505");return}
  message("one-live-status",tr("تم تسجيل اهتمامك بالمحاضرة في النظام. راجع الإعلان الرسمي لرابط اللقاء.","Your interest was recorded. Check the official announcement for the meeting link."));
 }catch(err){message("one-live-status",tr("تعذّر الاتصال بالخدمة؛ لم يتم تأكيد التسجيل.","Connection failed; registration was not confirmed."),true)}
 finally{b.disabled=false}
}
async function load(){
 if(!window.supabase?.createClient||!window.NABD_CONFIG?.supabaseUrl){message("one-course-status",tr("المكتبة غير متاحة. يمكن استخدام روابط النظام الأكاديمي.","Connection unavailable. Use the Academic OS links."),true);message("one-live-status",tr("لا يمكن جلب الجدول الآن.","Could not load schedule."),true);return}
 try{
  S.db=window.supabase.createClient(window.NABD_CONFIG.supabaseUrl,window.NABD_CONFIG.supabaseAnonKey);
  const [a,b]=await Promise.allSettled([
   S.db.from("courses").select("id,code,title_ar,title_en,status").eq("status","active").limit(30),
   S.db.from("nabd_global_sessions").select("id,title_ar,title_en,topic_ar,topic_en,speaker_name,speaker_affiliation,scheduled_at,duration_minutes,status").eq("status","published").gte("scheduled_at",new Date().toISOString()).order("scheduled_at",{ascending:true}).limit(30)
  ]);
  if(a.status==="fulfilled"&&!a.value.error){
   S.courses=a.value.data||[];message("one-course-status",S.courses.length?tr("المقررات المنشورة المتاحة حاليًا: ","Published catalogue courses: ")+S.courses.length:tr("لا توجد مقررات منشورة للعرض الآن.","No published catalogue courses are available yet."));
  }else message("one-course-status",tr("تعذّر التحقق من المقررات؛ لا تعني المشكلة عدم وجودها.","Unable to verify the course catalogue. This does not mean courses are absent."),true);
  if(b.status==="fulfilled"&&!b.value.error){
   S.sessions=b.value.data||[];message("one-live-status",S.sessions.length?tr("محاضرات منشورة بمواعيد قادمة: ","Upcoming published sessions: ")+S.sessions.length:tr("لا توجد محاضرات قادمة منشورة بعد؛ سيتم عرضها هنا عند إعلانها رسميًا.","No upcoming published sessions yet. Verified announcements will appear here."));
  }else message("one-live-status",tr("تعذّر تحميل جدول المحاضرات الآن؛ لا يمكن تأكيد المواعيد.","Could not verify the schedule right now."),true);
  renderCourses();renderSessions()
 }catch(e){message("one-course-status",tr("تعذّر الاتصال بقاعدة البيانات.","Database unavailable."),true);message("one-live-status",tr("لا يمكن التحقق من المحاضرات.","Unable to verify live sessions."),true)}
}
$("one-lang").addEventListener("click",()=>{S.lang=S.lang==="ar"?"en":"ar";translate()});
translate();message("one-course-status",tr("جارٍ جلب المقررات الحقيقية…","Loading real courses…"));message("one-live-status",tr("جارٍ جلب المحاضرات المنشورة…","Loading published sessions…"));void load();
})();