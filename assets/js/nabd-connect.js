/* NABD CONNECT — authenticated user ticket inbox. Supabase RLS remains the sole access boundary. */
(()=>{"use strict";if(document.body.dataset.onePage!=="connect")return;
const $=id=>document.getElementById(id),S={lang:"ar",db:null,user:null,tickets:[],ticket:null,busy:false,serial:0};
const tr=(ar,en)=>S.lang==="ar"?ar:en;
const make=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x};
const when=ts=>{const d=new Date(ts);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat(S.lang==="ar"?"ar":"en",{dateStyle:"medium",timeStyle:"short"}).format(d):""};
const status=code=>({open:[ "مفتوحة","Open"],waiting:["بانتظار المتابعة","Awaiting follow-up"],resolved:["مغلقة","Resolved"]}[code]||["غير معروف","Unknown"])[S.lang==="ar"?0:1];
function notify(text,bad=false,id="nc-status"){const node=$(id);node.textContent=text;node.classList.toggle("one-status-bad",!!bad)}
function authMessage(text,bad=false){notify(text,bad,"nc-auth-message")}
function translate(){
 document.documentElement.lang=S.lang;document.documentElement.dir=S.lang==="ar"?"rtl":"ltr";
 $("one-lang").textContent=S.lang==="ar"?"EN":"عربي";document.querySelectorAll("[data-ar][data-en]").forEach(node=>node.textContent=node.dataset[S.lang]);
 renderTickets();
 if(S.ticket){$("nc-thread-title").textContent=S.ticket.subject;$("nc-thread-status").textContent=status(S.ticket.status)}
}
function setBusy(b,which){
 S.busy=b;$(which).disabled=b;
}
async function ensureClient(){
 if(!window.supabase?.createClient||!window.NABD_CONFIG?.supabaseUrl||!window.NABD_CONFIG?.supabaseAnonKey)throw Error("service unavailable");
 return window.supabase.createClient(window.NABD_CONFIG.supabaseUrl,window.NABD_CONFIG.supabaseAnonKey)
}
function renderTickets(){
 const host=$("nc-list");host.replaceChildren();
 if(!S.tickets.length){host.append(make("p","nc-empty",tr("لا تذاكر في حسابك بعد. أنشئ تذكرتك الأولى أدناه.","No support tickets in your account yet. Create the first one below.")));return}
 for(const ticket of S.tickets){
  const b=make("button","nc-ticket");b.type="button";b.dataset.id=ticket.id;
  b.setAttribute("aria-current",String(S.ticket?.id===ticket.id));
  b.append(make("strong","",ticket.subject),make("small","",status(ticket.status)+" · "+when(ticket.updated_at||ticket.created_at)));
  b.addEventListener("click",()=>{void openTicket(ticket.id)});host.append(b)
 }
}
function showMsg(row){
 const node=make("article","nc-msg"+(row.sender_id===S.user.id?" own":""));
 node.append(make("strong","",row.sender_id===S.user.id?tr("أنت","You"):tr("رد إدارة الأكاديمية","Academy staff reply")));
 node.append(make("p","",row.body),make("small","",when(row.created_at)));return node;
}
async function openTicket(id){
 const ticket=S.tickets.find(x=>x.id===id);if(!ticket)return;S.ticket=ticket;const serial=++S.serial;
 $("nc-thread-title").textContent=ticket.subject;$("nc-thread-status").textContent=status(ticket.status);$("nc-reply-form").hidden=ticket.status==="resolved";renderTickets();
 const host=$("nc-messages");host.replaceChildren(make("p","nc-empty",tr("جارٍ تحميل الرسائل…","Loading messages…")));
 try{
  const {data,error}=await S.db.from("nabd_support_messages").select("id,ticket_id,sender_id,body,created_at").eq("ticket_id",ticket.id).order("created_at",{ascending:true}).limit(150);
  if(serial!==S.serial||S.ticket?.id!==ticket.id)return;
  if(error)throw error;
  host.replaceChildren();
  if(!data?.length)host.append(make("p","nc-empty",tr("لا توجد رسائل بعد.","No messages yet.")));
  else for(const row of data)host.append(showMsg(row));
  notify("");
 }catch(err){if(serial!==S.serial)return;host.replaceChildren(make("p","nc-empty",tr("لم يُسمح بجلب الرسائل أو فشل الاتصال.","Messages are unavailable or access was denied.")));notify(tr("تعذّر تحميل الرسائل.","Could not load messages."),true)}
}
async function loadTickets(preferred){
 if(!S.db||!S.user)return;
 const {data,error}=await S.db.from("nabd_support_tickets").select("id,student_id,category,subject,status,created_at,updated_at").eq("student_id",S.user.id).order("updated_at",{ascending:false}).limit(50);
 if(error){notify(tr("تعذّر عرض تذاكرك. تحقق من صلاحيات الحساب والاتصال.","Could not load your tickets. Check account permissions and connection."),true);return}
 S.tickets=data||[];S.ticket=null;renderTickets();
 const id=preferred||S.tickets[0]?.id;if(id)await openTicket(id);
 else {$("nc-thread-title").textContent=tr("اختر تذكرة لعرض الرسائل","Select a ticket to view replies");$("nc-thread-status").textContent="";$("nc-messages").replaceChildren(make("p","nc-empty",tr("مراسلاتك محمية بحسابك.","Your messages are protected by your account.")));$("nc-reply-form").hidden=true}
}
function basicGuard(...inputs){
 const text=inputs.join(" ").toLowerCase();
 if(/(?:\S+@\S+\.\S+)|(?:\+?\d[\s-]?){8,}|\bpassword\b|كلمة\s*(?:المرور|السر)|رقم\s*الهوية|بيانات\s*مريض|patient\s*(?:name|record|id)/iu.test(text))return false;
 return true;
}
async function createTicket(e){
 e.preventDefault();if(S.busy||!S.user||!S.db)return;
 const category=$("nc-category").value,subject=$("nc-subject").value.trim(),body=$("nc-body").value.trim();
 if(!["general","registration","technical","academic","certificate"].includes(category)||subject.length<6||subject.length>160||body.length<1||body.length>2000)return;
 if(!basicGuard(subject,body)){notify(tr("يبدو أن الرسالة تحتوي على معلومات شخصية أو بيانات مرضى. لا ترسلها هنا.","Your message may contain sensitive details or patient data. Do not send it here."),true);return}
 setBusy(true,"nc-create-btn");notify(tr("جارٍ إنشاء التذكرة…","Creating ticket…"));
 let newId=null;
 try{
  const {data,error}=await S.db.from("nabd_support_tickets").insert({student_id:S.user.id,category,subject,status:"open"}).select("id").single();
  if(error||!data?.id)throw error||Error("Ticket creation did not return ID");
  newId=data.id;
  const reply=await S.db.from("nabd_support_messages").insert({ticket_id:newId,sender_id:S.user.id,body});
  if(reply.error)throw reply.error;
  $("nc-create").reset();notify(tr("تم إنشاء تذكرة حقيقية وإرسال رسالتك إلى صندوق الإدارة.","A real ticket was created and your message added to the staff inbox."));
  await loadTickets(newId);
 }catch(err){
  if(newId){notify(tr("حُفظت التذكرة لكن تعذّر إرسال النص. افتح التذكرة وأرسل رسالة متابعة.","Ticket was created, but the initial message failed. Open it and retry sending."),true);await loadTickets(newId)}
  else notify(tr("لم تُنشأ التذكرة؛ تحقق من صلاحية الحساب والاتصال.","Ticket creation failed. Check your account and connection."),true)
 }finally{setBusy(false,"nc-create-btn")}
}
async function sendReply(e){
 e.preventDefault();if(S.busy||!S.ticket||!S.user||!S.db)return;
 if(S.ticket.status==="resolved"){notify(tr("هذه التذكرة مغلقة. أنشئ تذكرة جديدة لمتابعة الموضوع.","This ticket is resolved. Open a new ticket for further assistance."),true);return}
 const body=$("nc-reply").value.trim();if(!body||body.length>2000)return;
 if(!basicGuard(body)){notify(tr("تجنّب مشاركة بيانات حساسة في الرسائل.","Please avoid sharing sensitive details in messages."),true);return}
 const ticketId=S.ticket.id;setBusy(true,"nc-reply-btn");notify(tr("جارٍ إرسال المتابعة…","Sending follow-up…"));
 try{
  const {error}=await S.db.from("nabd_support_messages").insert({ticket_id:ticketId,sender_id:S.user.id,body});
  if(error)throw error;
  $("nc-reply").value="";notify(tr("تم إرسال رسالتك بنجاح.","Your reply was sent."));await openTicket(ticketId)
 }catch(err){notify(tr("لم يُؤكد إرسال الرد. تحقق من حالة التذكرة واتصالك.","Reply not confirmed. Check the ticket status and your connection."),true)}
 finally{setBusy(false,"nc-reply-btn")}
}
async function init(){
 try{
  S.db=await ensureClient();
  const {data,error}=await S.db.auth.getUser();
  if(error||!data?.user){authMessage(tr("تحتاج إلى تسجيل الدخول بحساب نبض أولًا. افتح بوابة الطالب أو مساحة التعلم، ثم عد إلى هذه الصفحة.","Please sign in to NABD first through your Student Portal or Learning Space, then return here."),true);const a=make("a","one-btn secondary",tr("تسجيل الدخول ↗","Sign in ↗"));a.href="learning/#account";$("nc-auth-message").append(" ",a);return}
  S.user=data.user;$("nc-app").hidden=false;authMessage(tr("تم التحقق من حسابك. الرسائل التي تظهر تخصّك فقط.","Authenticated. Only your own ticket messages are displayed."));
  await loadTickets();
 }catch(err){authMessage(tr("تعذّر الاتصال بالخدمة. جرّب مجددًا بعد التحقق من الإنترنت.","Could not connect to the service. Check your connection and retry."),true)}
}
$("one-lang").addEventListener("click",()=>{S.lang=S.lang==="ar"?"en":"ar";translate()});
$("nc-create").addEventListener("submit",e=>{void createTicket(e)});
$("nc-reply-form").addEventListener("submit",e=>{void sendReply(e)});
$("nc-refresh").addEventListener("click",()=>{void loadTickets(S.ticket?.id)});
translate();authMessage(tr("جارٍ التحقق من الحساب…","Verifying your account…"));void init();
})();