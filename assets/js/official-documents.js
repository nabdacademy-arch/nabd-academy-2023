/* NABD official document center — immutable templates, signed-in authorized operators. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const E=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const defs=[
 {id:"statement",name:"إفادة قيد بيانات",en:"Institutional Statement",icon:"▤",hint:"إثبات قيد الاسم داخل منصة نبض.",lines:["تفيد أكاديمية نبض للعلوم الطبية بأن صاحب المستند الموضح اسمه أعلاه مُدرج في سجل حسابات المنصة المؤسسية التابعة للأكاديمية، وذلك وفق بيانات الحساب المتاحة بتاريخ إصدار هذه الإفادة.","أُصدرت هذه الإفادة بطلب إداري لتأكيد وجود بيانات الحساب فقط، ولا تثبت حضور دورة أو اجتياز اختبار أو الحصول على اعتماد أكاديمي."]},
 {id:"permit",name:"تصريح مشاركة تنظيمي",en:"Participation Permission",icon:"♙",hint:"تصريح مؤسسي محدود لأنشطة الأكاديمية.",lines:["تُصدر أكاديمية نبض هذا التصريح التنظيمي لصاحب الاسم الموضح أعلاه للمشاركة في الأنشطة الداخلية التي توافق عليها إدارة الأكاديمية، شريطة الالتزام بالتعليمات والأنظمة المؤسسية ذات الصلة.","هذا التصريح صالح لأغراض التنظيم الداخلي فقط، ولا يُعد تصريح سفر أو دخول رسمي أو مزاولة مهنة أو ممارسة طبية."]},
 {id:"report",name:"تقرير إداري",en:"Administrative Report",icon:"▥",hint:"تقرير سجل مؤسسي غير طبي.",lines:["يُثبت هذا التقرير الإداري أن صاحب المستند الموضح أعلاه مسجل في قاعدة حسابات أكاديمية نبض، وقد أُنشئ السجل الإلكتروني بتاريخ الإصدار لغرض التوثيق المؤسسي.","لا يتضمن هذا التقرير تشخيصًا أو نتائج طبية أو تقييمًا أكاديميًا، ولا يُستخدم بدلًا عن التقارير المهنية الصادرة من الجهات المؤهلة."]},
 {id:"treatment_request",name:"نموذج طلب علاج / إحالة",en:"Treatment Request Form",icon:"♡",hint:"طلب تنسيق فقط، ليس وصفة دوائية.",lines:["يُصدر هذا النموذج الإداري لتوثيق طلب تنسيق إحالة صاحب الاسم المذكور أعلاه إلى الجهة الطبية المختصة، وفق الإجراءات المتبعة وبموافقة صاحب العلاقة.","هذا النموذج ليس وصفة علاجية أو تشخيصًا طبيًا ولا يجيز صرف دواء أو إجراء تدخل طبي. يُترك القرار الطبي والتقييم والعلاج حصريًا لممارس صحي مرخّص ومستقل عن نظام الطباعة."]},
 {id:"consultation_request",name:"نموذج طلب استشارة",en:"Consultation Request",icon:"✧",hint:"طلب تنسيق استشارة، دون رأي علاجي.",lines:["تسجل أكاديمية نبض بموجب هذا النموذج طلب استشارة مؤسسية أو تعليمية لصاحب المستند المذكور، ويُحال الطلب عند الحاجة إلى القسم المختص وفق الصلاحيات المتاحة.","لا يتضمن هذا النموذج أي استشارة طبية فعلية أو توصية علاجية، ولا يمثل رأيًا صادرًا عن طبيب أو مختص مرخص."]},
 {id:"complaint",name:"استمارة تقديم شكوى",en:"Complaint Form",icon:"☷",hint:"استمارة موحدة لتقديم الملاحظات والشكاوى.",lines:["استمارة إدارية موحدة لتوثيق رغبة صاحب الاسم المذكور أعلاه في تقديم شكوى أو ملاحظة إلى أكاديمية نبض للعلوم الطبية؛ ويُستكمل وصف الموضوع من مقدم الشكوى عند التسليم إلى الجهة المختصة.","موضوع الشكوى: ................................................................................","الجهة أو القسم المعني: .........................................................................","توقيع مقدم الشكوى عند التسليم (اختياري): ......................................................"]}
];
const docName=id=>defs.find(t=>t.id===id)?.name||"مستند غير معروف";
const kinds={student:"طالب",member:"عضو مجلس",other:"حساب بالأكاديمية"};
const db=window.nabdSupabase;
const state={allowed:[],admin:false,type:"statement",person:null,issuer:null,items:[],doc:null,ready:false,busy:false};
function message(m="",error=false){const n=$("feedback");n.textContent=m;n.classList.toggle("error",error);n.hidden=!m;}
async function call(action,args={}){
 if(!db)throw Error("خدمة قاعدة بيانات نبض غير متاحة");
 const {data,error}=await db.functions.invoke("nabd-official-documents",{body:{action,...args}});
 if(error){let details=null;try{details=await error.context?.json?.();}catch(_){}throw Error(details?.error||error.message||"فشل طلب الخدمة");}
 if(data?.error)throw Error(data.error);
 return data;
}
function chooseType(id){
 if(!state.allowed.includes(id))return;
 state.type=id;
 $("template-grid").querySelectorAll("[data-type]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.type===id)));
 $("issue").disabled=!state.person;
}
function renderTypes(){
 $("template-grid").innerHTML=defs.map(t=>{
 const forbidden=!state.allowed.includes(t.id);
 return '<button type="button" class="template-card" data-type="'+t.id+'" '+(forbidden?'disabled title="ليست لديك صلاحية إصدار هذا النوع"':'')+' aria-pressed="false"><span class="template-symbol" aria-hidden="true">'+t.icon+'</span><span class="template-info"><strong>'+E(t.name)+'</strong><small>'+E(t.hint)+'</small></span></button>';
 }).join("");
 $("template-grid").querySelectorAll("[data-type]").forEach(b=>b.addEventListener("click",()=>chooseType(b.dataset.type)));
 chooseType(state.allowed[0]||"statement");
}
function selectPerson(p,issuer=false){
 if(issuer){
  state.issuer=p;
  $("issuer-name").textContent=p.name||"—";$("issuer-selected").hidden=false;
  $("save-issuer").disabled=false;
  $("issuer-results").replaceChildren();
  return;
 }
 state.person=p;
 $("selected-name").textContent=p.name||"—";
 $("selected-kind").textContent=p.role==="student"?"حساب طالب":"حساب مرتبط بالأكاديمية";
 $("selected-subject").hidden=false;
 $("issue").disabled=!state.allowed.includes(state.type);
 $("search-results").replaceChildren();
}
async function doSearch(issuer=false){
 const field=$(issuer?"issuer-query":"subject-query");
 const target=$(issuer?"issuer-results":"search-results");
 const query=field.value.trim();
 if(query.length<2){message("اكتب حرفين على الأقل للبحث.",true);return;}
 target.textContent="جارٍ البحث في حسابات نبض...";
 try{
  const data=await call("search_subjects",{query});
  const list=data.subjects||[];
  target.innerHTML=list.length?list.map(s=>'<div class="search-result"><div><strong>'+E(s.name||"دون اسم")+'</strong><small>'+E(s.role==="student"?"طالب أو حساب عام":"حساب بالأكاديمية")+'</small></div><button type="button" data-id="'+E(s.id)+'">اختيار</button></div>').join(""):'<div class="no-results">لم يُعثر على حساب بهذا الاسم.</div>';
  target.querySelectorAll("[data-id]").forEach(btn=>btn.addEventListener("click",()=>selectPerson(list.find(p=>p.id===btn.dataset.id),issuer)));
 }catch(e){target.textContent="";message("تعذر البحث: "+e.message,true);}
}
function fmt(date){try{return new Intl.DateTimeFormat("ar-PS",{year:"numeric",month:"long",day:"numeric"}).format(new Date(date));}catch{return "—";}}
function viewUrl(token){return new URL("official-document-verify.html?token="+encodeURIComponent(token),location.href).href;}
function qr(parent,url){
 parent.replaceChildren();
 if(typeof QRCode!=="function")return false;
 try{new QRCode(parent,{text:url,width:180,height:180,correctLevel:QRCode.CorrectLevel?.M});return true;}catch(_){return false;}
}
function printDoc(row){
 state.doc=row;
 const t=defs.find(x=>x.id===row.doc_type);
 if(!t){message("نوع المستند غير معروف",true);return;}
 $("sheet-kicker").textContent=t.en;
 $("sheet-title").textContent=t.name;
 $("sheet-subtitle").textContent=t.en.toUpperCase();
 $("sheet-name").textContent=row.subject_name;
 $("sheet-date").textContent=fmt(row.issued_at);
 $("sheet-issuer").textContent=row.issuer_name;
 $("sheet-number").textContent=row.number;
 const body=$("sheet-body");body.replaceChildren(...t.lines.map(line=>{const p=document.createElement("p");p.textContent=line;return p;}));
 $("sheet-note").textContent=row.doc_type==="complaint"?
    "يُقدّم هذا النموذج في القنوات الداخلية للأكاديمية. لا تُدرج بيانات صحية أو تفاصيل خاصة عند مشاركة رمز التحقق.":
    "تُعتمد هذه الصيغة الرسمية كما هي في سجل أكاديمية نبض. أي تغيير في محتوى المستند يتطلب إصدار نسخة جديدة من القالب المعتمد.";
 const valid=row.status==="issued";
 const link=viewUrl(row.verify_token);
 $("verify-document").href=link;
 const ok=qr($("sheet-qr"),link);
 $("print-button").disabled=!valid||!ok;
 $("workspace").hidden=true;
 $("print-area").hidden=false;
 window.scrollTo(0,0);
 message(valid?(ok?"المستند جاهز للطباعة.":"تعذر تحميل QR؛ الطباعة معطلة حتى يصبح المستند قابلًا للتحقق."):"هذا المستند ملغى ولا يجوز طباعته على أنه ساري.",!valid||!ok);
}
async function issue(){
 if(state.busy||!state.person||!state.allowed.includes(state.type))return;
 state.busy=true;$("issue").disabled=true;
 message("جارٍ إصدار المستند برقم وتاريخ معتمدين...");
 try{const result=await call("issue",{doc_type:state.type,subject_user_id:state.person.id});if(!result.document)throw Error("لم يؤكد الخادم الإصدار");printDoc(result.document);await loadHistory(true);}
 catch(e){message("تعذر إصدار المستند: "+e.message,true);}
 finally{state.busy=false;$("issue").disabled=!state.person;}
}
async function loadHistory(silent=false){
 try{
  const data=await call("list");state.items=data.documents||[];
  $("history-list").innerHTML=state.items.length?state.items.map(r=>{
   const status=r.status==="issued"?"ساري":"ملغى";
   const btn='<button type="button" class="secondary" data-open="'+r.id+'">فتح المستند</button>';
   const cancel=state.admin&&r.status==="issued"?'<button type="button" class="secondary" data-void="'+r.id+'">إلغاء المستند</button>':"";
   return '<div class="history-item"><div><strong>'+E(docName(r.doc_type))+' · '+E(r.subject_name)+'</strong><small dir="ltr">'+E(r.number)+'</small><small>'+E(fmt(r.issued_at))+' · '+E(status)+'</small></div><div class="row-actions">'+btn+cancel+'</div></div>';
  }).join(""):'<div class="no-results">لا توجد مستندات صادرة من حسابك بعد.</div>';
  document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>open(Number(b.dataset.open))));
  document.querySelectorAll("[data-void]").forEach(b=>b.addEventListener("click",()=>voidDoc(Number(b.dataset.void))));
  if(!silent)message("تم تحديث سجل المستندات.");
 }catch(e){message("تعذر تحميل السجل: "+e.message,true);}
}
async function open(id){try{const d=await call("get",{id});printDoc(d.document);}catch(e){message("تعذر فتح المستند: "+e.message,true);}}
async function voidDoc(id){
 if(!state.admin||!confirm("هل تريد إلغاء المستند نهائيًا؟ سيظهر عبر QR أنه ملغى."))return;
 try{await call("void",{id});message("تم إلغاء المستند في السجل الرسمي.");await loadHistory(true);}
 catch(e){message("تعذر الإلغاء: "+e.message,true);}
}
function renderScopes(){
 $("issuer-scopes").innerHTML=defs.map(t=>'<label><input type="checkbox" value="'+t.id+'"> '+E(t.name)+'</label>').join("");
}
async function grant(){
 if(!state.issuer)return;
 const allowed_types=Array.from($("issuer-scopes").querySelectorAll("input:checked")).map(b=>b.value);
 const active=$("issuer-enabled").checked;
 try{
  const data=await call("grant_issuer",{user_id:state.issuer.id,allowed_types,active});
  if(!data.ok)throw Error("لم يؤكد الخادم عملية التفويض");
  message("تم تحديث تفويض الإصدار لهذا الحساب.");
  loadIssuers();
 }catch(e){message("تعذر التفويض: "+e.message,true);}
}
async function loadIssuers(){
 if(!state.admin)return;
 try{
  const d=await call("list_issuers");
  $("issuer-roster").innerHTML=(d.issuers||[]).length?d.issuers.map(p=>
   '<div class="history-item"><div><strong>'+E(p.name||p.user_id)+'</strong><small>'+E(p.allowed_types.map(docName).join("، ")||"دون صلاحيات")+'</small><small>'+E(p.active?"مخوّل":"التفويض معطّل")+'</small></div><button type="button" class="secondary" data-edit="'+E(p.user_id)+'">تعديل</button></div>').join(""):'<p class="muted">لا توجد تفويضات مسجلة بعد.</p>';
  $("issuer-roster").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>{
   const p=(d.issuers||[]).find(x=>x.user_id===b.dataset.edit);if(!p)return;
   selectPerson({id:p.user_id,name:p.name},true);
   $("issuer-enabled").checked=p.active;
   $("issuer-scopes").querySelectorAll("input").forEach(i=>i.checked=p.allowed_types.includes(i.value));
   $("permissions-panel").scrollIntoView({behavior:"smooth"});
  }));
 }catch(e){message("تعذر تحميل التفويضات: "+e.message,true);}
}
function init(){
 $("search-subject").addEventListener("click",()=>doSearch(false));
 $("issuer-search-button").addEventListener("click",()=>doSearch(true));
 $("subject-query").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();doSearch(false);}});
 $("issuer-query").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();doSearch(true);}});
 $("issue").addEventListener("click",issue);
 $("refresh-list").addEventListener("click",()=>loadHistory());
 $("save-issuer").addEventListener("click",grant);
 $("print-button").addEventListener("click",()=>{if(state.doc?.status==="issued"&&!$("print-button").disabled)window.print();});
 $("back-to-workspace").addEventListener("click",()=>{$("print-area").hidden=true;$("workspace").hidden=false;message("يمكنك اختيار مستند جديد.");window.scrollTo(0,0);});
 renderScopes();
 (async()=>{try{
  if(!db)throw Error("اتصال نبض غير متاح");
  const {data,error}=await db.auth.getUser();
  if(error||!data?.user)throw Error("سجل الدخول من حساب المدير أو الحساب المفوّض أولًا.");
  const auth=await call("whoami");
  if(!auth.can_issue)throw Error("حسابك ليس مخوّلًا لإصدار المستندات. اطلب التفويض من المدير العام.");
  state.allowed=auth.allowed_types||[];state.admin=auth.is_admin;
  $("workspace").hidden=false;$("permissions-panel").hidden=!state.admin;
  renderTypes();message("تم التحقق من صلاحياتك. يمكنك إصدار المستندات ضمن القوالب المصرح بها.");
  loadHistory(true);if(state.admin)loadIssuers();
 }catch(e){message(e.message,true);}})();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();