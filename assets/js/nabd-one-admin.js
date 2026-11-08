/* NABD ONE — admin operations console: support inbox, real lecture schedule, academic checks.
 * Uses existing admin module registry and signed-in Supabase client. All writes RLS-protected.
 * No fictitious teachers, lectures, grades, AI keys or accredited-medical claims.
 */
(()=>{"use strict";
const register=window.NABD_ADMIN_REGISTER_MODULE;if(typeof register!=="function")return;
const $=(id,root=document)=>root.querySelector("#"+id),make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n};
const today=t=>{const d=new Date(t);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat("ar",{dateStyle:"short",timeStyle:"short"}).format(d):""};
const S={db:null,user:null,container:null,tickets:[],sessions:[],tab:"tickets",current:null,request:0,canEdit:false,busy:false};
function note(text,error=false){const x=$("no-status",S.container);if(x){x.textContent=text;x.classList.toggle("no-error",error)}}
function link(url,text){const x=make("a","no-link",text);x.href=url;return x}
function field(label,id,{kind="text",min=0,max=0,placeholder=""}={}){
 const l=make("label","no-label",label),i=make(kind==="textarea"?"textarea":"input","no-input");i.id=id;
 if(kind!=="textarea")i.type=kind;i.placeholder=placeholder;i.required=true;
 if(min){if(kind==="number")i.min=String(min);else i.minLength=min}
 if(max){if(kind==="number")i.max=String(max);else i.maxLength=max}
 l.append(i);return l;
}
function button(text,func,cls="no-btn"){
 const b=make("button",cls,text);b.type="button";b.addEventListener("click",func);return b
}
function scaffold(panel){
 panel.replaceChildren();panel.classList.add("no-console");const head=make("div","no-head");
 const title=make("div");title.append(make("span","no-kicker","NABD ONE / OPERATIONS"),make("h2","", "مركز التشغيل الأكاديمي والرسائل"));
 title.append(make("p","", "التذاكر الفعلية، وجدول المحاضرات، وفحص المقررات، والأستاذ الذكي. لا يتم نشر أي محاضرة دون قرار من الإدارة وتأكيد موافقة المحاضر."));
 const actions=make("div","no-actions");actions.append(link("nabd-one.html","الحرم المتصل ↗"),link("nabd-connect.html","مراسلات الطلاب ↗"),link("university-os.html","النظام الأكاديمي ↗"));
 head.append(title,actions);panel.append(head);
 const nav=make("div","no-tabs");
 for(const [id,label] of [["tickets","✉ صندوق المراسلات"],["live","▣ المحاضرات المباشرة"],["academic","◈ الدراسة والجودة"],["ai","✦ الأستاذ الذكي"]]){
  const b=button(label,()=>{S.tab=id;draw()});b.className="no-tab";b.dataset.id=id;nav.append(b)
 }
 panel.append(nav,make("p","no-status",""));const content=make("div","no-content");content.id="no-content";panel.append(content)
}
function draw(){
 if(!S.container)return;
 S.container.querySelectorAll(".no-tab").forEach(b=>{b.classList.toggle("selected",b.dataset.id===S.tab);b.setAttribute("aria-pressed",String(b.dataset.id===S.tab))});
 const host=$("no-content",S.container);host.replaceChildren();
 if(S.tab==="tickets")renderTickets(host);
 else if(S.tab==="live")renderLive(host);
 else if(S.tab==="academic")renderAcademic(host);
 else renderAI(host)
}
async function refresh(){
 if(!S.db||!S.user)return;
 note("جارٍ جلب البيانات المصرح بها…");
 try{
  const [t,l]=await Promise.all([
   S.db.from("nabd_support_tickets").select("id,student_id,category,subject,status,created_at,updated_at").order("updated_at",{ascending:false}).limit(160),
   S.db.from("nabd_global_sessions").select("id,title_ar,title_en,topic_ar,topic_en,speaker_name,speaker_affiliation,scheduled_at,duration_minutes,status").order("scheduled_at",{ascending:false}).limit(100)
  ]);
  S.tickets=t.error?[]:t.data||[];S.sessions=l.error?[]:l.data||[];
  note((t.error?"تعذّر فحص التذاكر. ":"")+ (l.error?"تعذّر فحص المحاضرات. ":"")+(!t.error&&!l.error?"تم التحقق من بيانات الحساب المصرح بها.":""));
  draw()
 }catch(e){note("تعذّر الوصول إلى قاعدة البيانات؛ لم تُحمّل بيانات التشغيل.",true)}
}
function renderTickets(host){
 const line=make("div","no-row");line.append(make("h3","","صندوق المراسلات الحقيقي · "+S.tickets.length),button("تحديث التذاكر ↻",()=>{void refresh()}));host.append(line);
 const grid=make("div","no-inbox"),list=make("div","no-ticket-list"),detail=make("section","no-ticket-detail");detail.id="no-ticket-detail";grid.append(list,detail);host.append(grid);
 if(!S.tickets.length){list.append(make("p","no-empty","لا توجد تذاكر ظاهرة وفق صلاحياتك. إذا تعذّر الاتصال ستظهر رسالة فوق."));return}
 for(const ticket of S.tickets){
  const b=make("button","no-ticket");b.type="button";b.setAttribute("aria-current",String(S.current===ticket.id));
  b.append(make("strong","",ticket.subject),make("small","",ticket.status+" · "+today(ticket.updated_at)),make("small","",ticket.id.slice(0,8)));
  b.addEventListener("click",()=>{S.current=ticket.id;S.request++;draw()});list.append(b)
 }
 if(S.current&&S.tickets.some(t=>t.id===S.current))void showTicket(S.current);
 else detail.append(make("p","no-empty","اختر تذكرة لقراءة الرسائل والرد عليها."))
}
async function showTicket(id){
 const ticket=S.tickets.find(t=>t.id===id),dest=$("no-ticket-detail",S.container);if(!ticket||!dest||S.tab!=="tickets")return;
 const ticketReq=++S.request;
 dest.replaceChildren(make("p","no-empty","جارٍ فتح الرسائل الخاصة…"));
 try{
  const {data,error}=await S.db.from("nabd_support_messages").select("id,ticket_id,sender_id,body,created_at").eq("ticket_id",id).order("created_at",{ascending:true}).limit(200);
  if(ticketReq!==S.request||S.tab!=="tickets"||!dest.isConnected)return;
  if(error)throw error;
  dest.replaceChildren();
  const h=make("h3","",ticket.subject);const info=make("p","no-meta","الطلب: "+ticket.id+" · الحالة: "+ticket.status+" · مقدم الطلب: "+ticket.student_id.slice(0,8)+"…");dest.append(h,info);
  const feed=make("div","no-messages");
  if(!data?.length)feed.append(make("p","no-empty","لا توجد رسائل في هذه التذكرة بعد."));
  else for(const msg of data){const m=make("article","no-message"+(msg.sender_id===S.user.id?" staff":"")),who=msg.sender_id===S.user.id?"أنت (الإدارة)":"صاحب الطلب / مستخدم آخر";
   m.append(make("strong","",who),make("p","",msg.body),make("small","",today(msg.created_at)));feed.append(m)}
  dest.append(feed);
  const f=make("form","no-reply"),label=field("رد إداري جديد (دون بيانات حساسة)","no-reply-text",{kind:"textarea",max:2000});
  const send=make("button","no-btn","إرسال الرد إلى الطالب");send.type="submit";f.append(label,send);
  f.addEventListener("submit",e=>{e.preventDefault();void sendReply(ticket,f,send)});
  dest.append(f);
  const controls=make("div","no-status-controls"),lbl=make("label","no-label","تحديث حالة التذكرة");
  const select=make("select","no-input");for(const [v,t] of [["open","مفتوحة"],["waiting","بانتظار الطالب"],["resolved","تم حلها"]]){const o=make("option","",t);o.value=v;o.selected=ticket.status===v;select.append(o)}
  lbl.append(select);controls.append(lbl,button("حفظ الحالة",()=>{void setStatus(ticket,select.value)}));
  dest.append(controls);
 }catch(e){if(ticketReq!==S.request)return;dest.replaceChildren(make("p","no-empty","تعذّر قراءة الرسائل. تحقق من الشبكة والصلاحيات."));note("خطأ في قراءة رسائل التذكرة.",true)}
}
async function sendReply(ticket,f,btn){
 const text=$("no-reply-text",f)?.value.trim();if(!text||text.length>2000||S.busy)return;
 S.busy=true;btn.disabled=true;note("جارٍ إرسال رد فعلي…");
 try{
  const {error}=await S.db.from("nabd_support_messages").insert({ticket_id:ticket.id,sender_id:S.user.id,body:text});
  if(error)throw error;
  note("تم إرسال رد الإدارة، وسيظهر للطالب عند فتح مراسلاته.");
  S.current=ticket.id;await showTicket(ticket.id)
 }catch(e){note("لم يُؤكد إرسال الرد؛ تحقق من الصلاحيات والاتصال.",true)}
 finally{S.busy=false;btn.disabled=false}
}
async function setStatus(ticket,newStatus){
 if(!["open","waiting","resolved"].includes(newStatus)||S.busy)return;
 if(ticket.status===newStatus){note("الحالة محفوظة بالفعل.");return}
 S.busy=true;
 try{
  const {data,error}=await S.db.from("nabd_support_tickets").update({status:newStatus,updated_at:new Date().toISOString()}).eq("id",ticket.id).select("id,status").maybeSingle();
  if(error||!data)throw error||Error("Not confirmed");
  ticket.status=data.status;note("تم تغيير الحالة فعليًا.");draw()
 }catch(e){note("لم يتأكد تحديث الحالة؛ لا تفترض نجاحه.",true)}
 finally{S.busy=false}
}
function renderLive(host){
 const head=make("div","no-row");head.append(make("h3","","قاعات المحاضرات · جدول حقيقي"),button("تحديث ↻",()=>void refresh()));host.append(head);
 host.append(make("p","no-meta","يُحفظ الموعد أولًا كمسودة. نشره قرار إداري صريح بعد التحقق من اسم المتحدث وموافقته ووسيلة اللقاء. روابط الفيديو الخاصة لا تُنشر هنا."));
 const form=make("form","no-form");form.id="no-live-form";
 for(const [label,id,kind] of [
 ["عنوان عربي للمحاضرة","no-title-ar","text"],["English lecture title","no-title-en","text"],
 ["الموضوع بالعربي","no-topic-ar","text"],["English topic","no-topic-en","text"],
 ["اسم المحاضر المصرّح","no-speaker","text"],["جهة المحاضر (بموافقته)","no-affiliation","text"],
 ["موعد المحاضرة وتوقيتها المحلي","no-time","datetime-local"],["المدة بالدقائق (30–180)","no-duration","number"]
 ]){const ctrl=field(label,id,{kind,min:id==="no-duration"?30:0,max:id==="no-duration"?180:180});form.append(ctrl)}
 $("no-duration",form).value="60";
 const consent=make("label","no-consent");const checkbox=make("input");checkbox.type="checkbox";checkbox.id="no-speaker-ok";checkbox.required=true;
 consent.append(checkbox,make("span","","أؤكد أن بيانات المتحدث حقيقية ومصرّح بعرضها وأن هذه المسودة ليست إعلانًا رسميًا."));form.append(consent);
 const submit=make("button","no-btn","حفظ مسودة محاضرة");submit.type="submit";form.append(submit);
 form.addEventListener("submit",e=>{e.preventDefault();void createSession(form,submit)});
 host.append(form);
 const list=make("div","no-session-list");list.append(make("h3","","المحاضرات في القاعدة · "+S.sessions.length));
 if(!S.sessions.length)list.append(make("p","no-empty","لا توجد محاضرات بعد. لن تظهر بيانات وهمية للطلاب."));
 for(const row of S.sessions){
  const article=make("article","no-session");
  article.append(make("strong","",row.title_ar+" / "+row.title_en),make("span","no-meta",row.speaker_name+" · "+today(row.scheduled_at)+" · "+row.duration_minutes+" دقيقة"),make("span","no-state",row.status));
  if(row.status==="draft"){const publish=button("نشر رسمي بعد التحقق",()=>{void publishSession(row,publish)});publish.classList.add("no-publish");article.append(publish)}
  else if(row.status==="published"){const cancel=button("إلغاء الإعلان",()=>{void cancelSession(row,cancel)});cancel.classList.add("no-cancel");article.append(cancel)}
  list.append(article);
 }
 host.append(list);
}
async function createSession(form,submit){
 if(S.busy)return;
 const val=id=>$(id,form)?.value.trim()||"";
 const date=new Date(val("no-time"));const duration=Number(val("no-duration"));
 if(!Number.isFinite(date.getTime())){note("أدخل موعدًا صالحًا للمحاضرة.",true);return}
 const fields={title_ar:val("no-title-ar"),title_en:val("no-title-en"),topic_ar:val("no-topic-ar"),topic_en:val("no-topic-en"),speaker_name:val("no-speaker"),speaker_affiliation:val("no-affiliation"),scheduled_at:date.toISOString(),duration_minutes:duration,status:"draft"};
 if(!$("no-speaker-ok",form).checked||Object.values(fields).some(v=>v===null||v==="")||!Number.isFinite(date.getTime())||date<=new Date()||duration<30||duration>180||fields.title_ar.length<4||fields.title_en.length<4){note("راجع البيانات والوقت وموافقة عرض معلومات المحاضر.",true);return}
 S.busy=true;submit.disabled=true;note("جارٍ حفظ المسودة في جدول المحاضرات…");
 try{
  const {data,error}=await S.db.from("nabd_global_sessions").insert(fields).select("id,status").single();
  if(error||!data?.id)throw error||Error("Not confirmed");note("حُفظت المسودة فعليًا. لن تُعرض للطلاب قبل النشر الصريح.");await refresh()
 }catch(e){note("تعذّر حفظ المسودة؛ لم نُنشئ محاضرة. راجع الصلاحيات والحقول.",true)}
 finally{S.busy=false;submit.disabled=false}
}
async function publishSession(row,b){
 if(S.busy||row.status!=="draft")return;
 if(!confirm("هل تحققت من موافقة المحاضر وموعده وحقوق المعلومات؟ نشر المحاضرة سيظهر للطلاب."))return;
 S.busy=true;b.disabled=true;
 try{
  const {data,error}=await S.db.from("nabd_global_sessions").update({status:"published",updated_at:new Date().toISOString()}).eq("id",row.id).eq("status","draft").select("id,status").maybeSingle();
  if(error||!data)throw error||Error("No record");note("تم نشر محاضرة موثقة في قاعدة البيانات. تحقق من جدول الطلاب.");await refresh()
 }catch(e){note("تعذّر تأكيد النشر. لا تفترض ظهور المحاضرة.",true)}
 finally{S.busy=false;b.disabled=false}
}
async function cancelSession(row,b){
 if(S.busy||row.status!=="published")return;
 if(!confirm("هل تؤكد إلغاء المحاضرة المنشورة؟ ينبغي إعلام المسجلين خارج هذا النظام."))return;
 S.busy=true;b.disabled=true;
 try{
  const {data,error}=await S.db.from("nabd_global_sessions").update({status:"cancelled",updated_at:new Date().toISOString()}).eq("id",row.id).eq("status","published").select("id,status").maybeSingle();
  if(error||!data)throw error||Error("No record");note("تم إلغاء المحاضرة في النظام. لا تُرسل إشعارات تلقائية للمسجلين؛ تواصل معهم رسميًا.");await refresh()
 }catch(e){note("تعذّر تأكيد إلغاء المحاضرة.",true)}
 finally{S.busy=false;b.disabled=false}
}
async function renderAcademic(host){
 host.append(make("h3","","التشغيل الأكاديمي — لا نجاح دون بيانات معتمدة"));
 const tasks=[
 ["المقررات","courses","id","academy.html"],
 ["تكليفات المحاضرين","nabd_os_faculty_assignments","course_id","lecturers.html"],
 ["الوحدات المنشورة","nabd_os_course_modules","id","university-os.html"],
 ["الاختبارات","nabd_os_exams","id","university-os.html"],
 ["أسئلة الاختبارات","nabd_os_exam_questions","id","university-os.html"],
 ["طلبات الشهادات","nabd_os_certificate_requests","id","university-os.html"]
 ];
 const list=make("div","no-metrics");host.append(make("p","no-meta","هذا الفحص يقرأ عدد السجلات فقط؛ لا يجيز نشر محتوى أو إصدار شهادة."));
 host.append(list);
 const checks=await Promise.allSettled(tasks.map(async ([title,table,col])=>{const x=await S.db.from(table).select(col,{head:true,count:"exact"});return x.error?null:x.count}));
 if(S.tab!=="academic"||!host.isConnected)return;
 tasks.forEach(([title,table,col,href],i)=>{const row=make("article","no-metric"),count=checks[i].status==="fulfilled"?checks[i].value:null;
 row.append(make("strong","",title),make("span",count===null?"تعذر التحقق":String(count)),link(href,"افتح البوابة ↗"));list.append(row)});
 const instructions=make("p","no-warning","المقررات والمحاضرون والاختبارات الرسمية تحتاج أشخاصًا حقيقيين ومراجعة علمية. لا نملأها ببيانات افتراضية. اختبار الأدوار والأمان يحتاج بيئة اختبار وموافقات.");
 host.append(instructions,link("admin.html#launch-readiness","لوحة الإطلاق النهائي ↗"),link("https://github.com/nabdacademy-arch/nabd-academy-2023/blob/main/docs/NABD_FINAL_LAUNCH_2026-11-08.md","معايير التشغيل ↗"))
}
function renderAI(host){
 host.append(make("h3","","فحص الأستاذ الذكي — سؤال تجريبي عبر حساب المدير"));
 host.append(make("p","no-warning","هذا الفحص الاختياري يرسل سؤالًا علميًا غير شخصي إلى دالة نبض الحالية. نجاح ظهور الدالة في Supabase لا يثبت أن مزود الذكاء الاصطناعي يعمل أو أن المحتوى معتمد."));
 const b=button("اختبر إجابة المعلم الذكي بموافقتي",()=>{void probeAI(b)});host.append(b);
 const answer=make("p","no-ai-result","لم يُجر اختبار توليد بعد.");answer.id="no-ai-result";host.append(answer);
 host.append(link("learning/","بوابة الأستاذ الذكي ↗"),link("https://supabase.com/dashboard","فحص الخدمة من لوحة Supabase ↗"))
}
async function probeAI(b){
 if(S.busy)return;
 if(!window.NABD_CONFIG?.tutorFunction){$("no-ai-result",S.container).textContent="إعدادات دالة الذكاء الاصطناعي غير موجودة في هذا الموضع؛ لا يمكن التأكيد.";return}
 S.busy=true;b.disabled=true;const result=$("no-ai-result",S.container);result.textContent="جارٍ الاتصال بمزود التوليد عبر حساب المدير…";
 try{
  const {data,error}=await S.db.functions.invoke(window.NABD_CONFIG.tutorFunction,{body:{question:"Explain the heart's four chambers for preclinical learning in two sentences. Do not offer medical advice.",language:"en",image:null}});
  if(error||typeof data?.answer!=="string"||!data.answer.trim())throw error||Error("No answer");
  result.textContent="✅ أجاب المزوّد عن السؤال التجريبي (ليس اعتمادًا علميًا): "+data.answer.slice(0,1200)
 }catch(e){result.textContent="لم يثبت نجاح التوليد: الخدمة قد تحتاج تفعيل مفتاح أو حصة أو مراجعة صلاحيات. راجع سجلات Edge Functions الخاصة."}
 finally{S.busy=false;b.disabled=false}
}
async function render(panel,{db,user}){
 S.container=panel;S.db=db;S.user=user;S.current=null;S.request++;scaffold(panel);
 if(!db||!user){panel.replaceChildren(make("p","no-error","الدخول الإداري مطلوب."));return}
 note("جارٍ التحقق من دور المدير قبل قراءة البيانات…");
 try{
  const [auth,profile]=await Promise.all([db.auth.getUser(),db.from("profiles").select("role").eq("id",user.id).maybeSingle()]);
  if(auth.error||auth.data?.user?.id!==user.id||profile.error||profile.data?.role!=="admin"){panel.replaceChildren(make("p","no-error","رفض عرض بيانات المراسلات: لم يتم إثبات صلاحية المدير."));return}
  await refresh()
 }catch(e){panel.replaceChildren(make("p","no-error","تعذر التحقق من الجلسة والصلاحيات."))}
}
register({id:"nabd-one-operations",title:"✦ NABD ONE · العمليات",render});
})();