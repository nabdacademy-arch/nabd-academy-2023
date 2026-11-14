/* NABD Exams & Quality: director-only transparent proctor monitor dashboard. */
(function(){
"use strict";
const panel=document.getElementById("ql-proctor-panel");
const client=window.nabdSupabase;
if(!panel||!client)return;
const $=id=>document.getElementById(id);
const select=$("ql-proctor-exam"),start=$("ql-proctor-start"),stop=$("ql-proctor-stop"),
  refreshButton=$("ql-proctor-refresh"),log=$("ql-proctor-log");
const labels={
 tab_hidden:"اختفاء صفحة الامتحان / احتمال تبديل تبويب أو تطبيق",
 window_blur:"فقدان تركيز نافذة الامتحان",
 printscreen_key:"رُصد ضغط مفتاح Print Screen (لا يثبت تصوير الشاشة)",
 print_shortcut:"اختصار الطباعة Ctrl/⌘ + P",
 copy_attempt:"محاولة نسخ محتوى من صفحة الامتحان"
};
let director=null,exams=[],selected=null,currentState=null,busy=false,refreshing=false;
const dom=(tag,cls,text)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(text!==undefined)node.textContent=String(text);
 return node;
};
const formatDate=value=>{
 if(!value)return "—";
 try{return new Intl.DateTimeFormat("ar-PS",{dateStyle:"medium",timeStyle:"medium"}).format(new Date(value));}
 catch{return String(value);}
};
function message(text,kind=""){
 const node=$("ql-proctor-status");
 node.hidden=!text;node.textContent=text||"";node.className="ql-status"+(kind?" "+kind:"");
}
function active(exam){
 if(!exam||exam.status!=="published")return false;
 const now=Date.now();
 return Date.parse(exam.opens_at)<=now&&Date.parse(exam.closes_at)>now;
}
function updateButtons(){
 const exam=exams.find(item=>item.id===selected);
 const online=Boolean(currentState?.enabled&&exam&&active(exam));
 const badge=$("ql-proctor-state");
 badge.textContent=online?"يعمل لهذا الامتحان":currentState?.enabled?"الامتحان انتهى":"متوقف";
 badge.className="ql-tag"+(online?" ql-tag-green":"");
 start.disabled=busy||!director||!active(exam)||Boolean(currentState?.enabled);
 stop.disabled=busy||!director||!selected||!Boolean(currentState?.enabled);
 refreshButton.disabled=busy||refreshing||!director;
 select.disabled=busy||!director;
}
async function identity(){
 try{
   const {data:{user},error}=await client.auth.getUser();
   if(error||!user){director=null;reset();return;}
   const {data:owner,error:ownerError}=await client.from("nabd_exam_owner")
     .select("user_id").eq("user_id",user.id).maybeSingle();
   if(ownerError||owner?.user_id!==user.id){director=null;reset();return;}
   if(director?.id===user.id)return;
   director=user;await loadExams();
 }catch{
   director=null;reset();
 }
}
function reset(){
 selected=null;currentState=null;exams=[];
 select.replaceChildren(new Option("سجّل الدخول بحساب المدير",""));
 log.replaceChildren(dom("p","ql-empty","المراقبة متاحة فقط لمدير الامتحانات."));
 $("ql-proctor-count").textContent="0";
 $("ql-proctor-updated").textContent="—";
 message("");
 updateButtons();
}
async function loadExams(){
 if(!director)return;
 const {data,error}=await client.from("nabd_quality_exams")
   .select("id,title,status,opens_at,closes_at")
   .eq("created_by",director.id).in("status",["published","closed"])
   .order("created_at",{ascending:false}).limit(100);
 if(error){message("تعذر تحميل الامتحانات. تحقق من الاتصال.","error");return;}
 exams=data||[];
 const old=selected;
 select.replaceChildren(new Option("اختر الامتحان",""));
 for(const item of exams){
   const option=new Option(item.title+(active(item)?" · نشط": " · منتهٍ"),item.id);
   select.append(option);
 }
 selected=exams.some(item=>item.id===old)?old:(exams.find(active)?.id||exams[0]?.id||null);
 select.value=selected||"";
 if(!selected){
   currentState=null;log.replaceChildren(dom("p","ql-empty","لا توجد امتحانات منشورة بعد. انشر امتحانًا أولًا، ثم شغّل المراقبة خلال مدته."));
   $("ql-proctor-count").textContent="0";
   $("ql-proctor-updated").textContent="—";
   updateButtons();return;
 }
 await loadDashboard();
}
function render(events){
 log.replaceChildren();
 if(!events.length){
   log.append(dom("p","ql-empty","لا توجد إشارات مسجّلة لهذا الامتحان حتى الآن."));
   return;
 }
 const table=dom("table","ql-proctor-table");
 const head=dom("thead"),tr=dom("tr");
 for(const heading of ["اسم الطالب","معرّف حساب الطالب","نوع الإشارة","وقت الخادم (محلي)"])
   tr.append(dom("th","",heading));
 head.append(tr);table.append(head);
 const body=dom("tbody");
 for(const entry of events){
   const row=dom("tr");
   row.append(dom("td","ql-proctor-name",entry.student_name||"طالب"));
   const identity=dom("td","ql-proctor-identity",entry.student_id||"—");
   identity.title="معرّف الحساب الفعلي؛ لا يوجد رقم جامعي مستقل مخزّن في ملف الطالب";
   row.append(identity);
   row.append(dom("td","",labels[entry.signal_type]||"إشارة غير معروفة"));
   row.append(dom("td","ql-proctor-time",formatDate(entry.detected_at)));
   body.append(row);
 }
 table.append(body);log.append(table);
}
async function loadDashboard(){
 if(!director||!selected||refreshing)return;
 const exam=selected;refreshing=true;updateButtons();
 try{
   const {data,error}=await client.rpc("nabd_quality_proctor_dashboard",{p_exam:exam});
   if(error||!data)throw Error(error?.message||"تعذّر تحميل سجل المراقبة.");
   if(exam!==selected)return;
   currentState=data;
   $("ql-proctor-count").textContent=String(data.total??0);
   $("ql-proctor-updated").textContent=formatDate(data.updated_at);
   render(Array.isArray(data.events)?data.events:[]);
 }catch(error){message("خطأ في سجل المراقبة: "+String(error?.message||error).slice(0,160),"error");}
 finally{refreshing=false;updateButtons();}
}
async function toggle(enabled){
 if(!director||!selected||busy)return;
 const exam=exams.find(item=>item.id===selected);
 if(enabled&&!active(exam))return message("المراقبة لا تبدأ إلا خلال فترة امتحان منشور ونشط.","error");
 if(!window.confirm(enabled?
   "تشغيل المراقبة لهذا الامتحان؟ سيتم تسجيل إشارات المتصفح فقط، دون تصوير أو تسجيل شاشة، ولن تتغير درجات الطلاب تلقائيًا.":
   "هل تريد إيقاف مراقبة هذا الامتحان؟ لن تُسجّل إشارات جديدة بعد إيقافها. سيبقى السجل السابق للمراجعة وفق مدة الاحتفاظ."))return;
 busy=true;updateButtons();
 message(enabled?"جارٍ تشغيل المراقبة على الخادم…":"جارٍ إيقاف المراقبة على الخادم…");
 try{
   const {data,error}=await client.rpc("nabd_quality_proctor_toggle",{p_exam:selected,p_enabled:enabled});
   if(error||data?.enabled!==enabled)throw Error(error?.message||"لم يؤكد الخادم تغيير الحالة.");
   currentState={...(currentState||{}),enabled};
   message(enabled?"تم تشغيل المراقبة لهذا الامتحان. ستظهر إشارات الطلاب المتصلين بعد تفعيلها لديهم.":
     "تم إيقاف المراقبة؛ لا يجري استقبال إشارات جديدة.","success");
 }catch(error){message("لم يتغير وضع المراقبة: "+String(error?.message||error).slice(0,160),"error");}
 finally{busy=false;updateButtons();await loadDashboard();}
}
select.addEventListener("change",()=>{selected=select.value||null;currentState=null;updateButtons();if(selected)loadDashboard();});
start.addEventListener("click",()=>toggle(true));
stop.addEventListener("click",()=>toggle(false));
refreshButton.addEventListener("click",()=>{if(director)loadExams();});
client.auth.onAuthStateChange(()=>{setTimeout(identity,0);});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&director)loadExams();});
setInterval(()=>{if(director&&!document.hidden)loadExams();},30000);
reset();identity();
})();
