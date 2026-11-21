/* NABD / Director council account management. Server is the only authority. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const E=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const councils=[
 {code:"trustees",tag:"NCN-TRU",ar:"المجلس الأعلى للأمناء",icon:"♛"},
 {code:"academic",tag:"NCN-ACA",ar:"المجلس العلمي والأكاديمي",icon:"✺"},
 {code:"research",tag:"NCN-RES",ar:"مجلس البحث العلمي والابتكار",icon:"⌬"},
 {code:"students",tag:"NCN-STU",ar:"المجلس الطلابي الأعلى",icon:"◈"},
 {code:"international",tag:"NCN-INT",ar:"مجلس العلاقات والشراكات الدولية",icon:"◎"},
 {code:"quality",tag:"NCN-QUA",ar:"مجلس الجودة والنزاهة الأكاديمية",icon:"⬡"},
 {code:"digital",tag:"NCN-DIG",ar:"مجلس الذكاء الاصطناعي والتحول الرقمي",icon:"✧"},
 {code:"humanitarian",tag:"NCN-HUM",ar:"مجلس العمل الإنساني والاستدامة",icon:"♡"}
];
const labels={member:"عضو مجلس",chair:"رئيس المجلس",vice_chair:"نائب الرئيس",secretary:"مقرر المجلس"};
const state={code:"trustees",mode:"new",selected:null,members:[],credential:null,busy:false,initialized:false};
const link=code=>new URL("councils.html?council="+encodeURIComponent(code),location.href).href;
function status(message,fail=false) {
 const n=$("ncg-status");
 n.textContent=message;n.classList.toggle("error",fail);n.hidden=!message;
}
function clearCredential(){
 state.credential=null;
 $("ncg-credentials-email").textContent="";
 $("ncg-credentials-password").textContent="";
 $("ncg-credentials").hidden=true;
}
function selectCouncil(code){
 if(!councils.some(c=>c.code===code))return;
 clearCredential();
 state.code=code;
 const c=councils.find(c=>c.code===code);
 $("ncg-selected-name").textContent=c.ar;
 $("ncg-selected-code").textContent=c.tag;
 $("ncg-councils").querySelectorAll("[data-ncg-council]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.ncgCouncil===code)));
 renderMembers();
 status("");
}
function renderCouncils(){
 $("ncg-councils").innerHTML=councils.map(c=>'<button type="button" class="ncg-council" data-ncg-council="'+c.code+'" aria-pressed="false"><strong>'+c.icon+" "+E(c.ar)+'</strong><small>'+c.tag+'</small></button>').join("");
 $("ncg-councils").querySelectorAll("[data-ncg-council]").forEach(b=>b.addEventListener("click",()=>selectCouncil(b.dataset.ncgCouncil)));
 selectCouncil(state.code);
}
function mode(name){
 state.mode=name;
 clearCredential();
 $("ncg-create-form").hidden=name!=="new";
 $("ncg-existing").hidden=name!=="existing";
 document.querySelectorAll("[data-ncg-mode]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.ncgMode===name)));
 status("");
}
function lock(busy){
 state.busy=busy;
 ["ncg-create-submit","ncg-search","ncg-assign","ncg-refresh"].forEach(id=>{const el=$(id);if(el)el.disabled=busy||(id==="ncg-assign"&&!state.selected);});
}
async function call(action,properties={}){
 if(typeof db==="undefined")throw Error("اتصال قاعدة البيانات غير متاح.");
 const {data,error}=await db.functions.invoke("nabd-council-provision",{body:{action,...properties}});
 if(error){
   let body=null;
   try{body=await error.context?.json?.();}catch(_){}
   throw new Error(body?.error||error.message||"تعذّر الاتصال بخدمة إدارة الحسابات.");
 }
 if(data?.error)throw new Error(data.error);
 return data;
}
function generate(){
 const alphabet="abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
 const rand=new Uint8Array(22);crypto.getRandomValues(rand);
 const part=Array.from(rand,b=>alphabet[b%alphabet.length]).join("");
 const password="N7a!"+part;
 $("ncg-password").value=password;
 $("ncg-password").focus();
 status("تم إنشاء كلمة مرور عشوائية قوية. سلّمها للعضو عبر قناة خاصة.");
}
async function copy(value){
 if(navigator.clipboard?.writeText){
  await navigator.clipboard.writeText(value);
  status("تم النسخ. احرص على تسليم البيانات لصاحبها فقط.");
 } else status("تعذر النسخ تلقائيًا. حدّد النص وانسخه يدويًا.",true);
}
function showCredential(email,password){
 state.credential={email,password,council_code:state.code};
 $("ncg-credentials-email").textContent="اسم الدخول: "+email;
 $("ncg-credentials-password").textContent="كلمة المرور الأولية: "+password;
 $("ncg-credentials").hidden=false;
}
async function create(event){
 event.preventDefault();
 if(state.busy)return;
 const full_name=$("ncg-name").value.trim(),email=$("ncg-email").value.trim().toLowerCase(),
 password=$("ncg-password").value,position=$("ncg-new-position").value,
 verified_email=$("ncg-email-verified").checked,council_code=state.code;
 if(!verified_email){status("يجب التأكد من ملكية البريد وموافقة العضو قبل إنشاء الحساب.",true);return;}
 if(password.length<12||!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/[0-9]/.test(password)){status("كلمة المرور يجب أن تضم 12 حرفًا على الأقل وأحرفًا كبيرة وصغيرة ورقمًا.",true);return;}
 lock(true);clearCredential();
 status("جارٍ إنشاء الحساب وتسجيل تكليف المجلس...");
 try{
  const result=await call("create",{full_name,email,password,council_code,position,verified_email});
  if(!result.ok)throw Error("لم يؤكد الخادم إنشاء الحساب.");
  showCredential(email,password);
  $("ncg-create-form").reset();
  await refreshMembers(true);
  status("تم إنشاء الحساب وتكليفه بالمجلس. بيانات الدخول معروضة لمرة واحدة أسفل النموذج.");
 }catch(error){status(error.message||"تعذر إنشاء الحساب.",true);}
 finally{lock(false);}
}
async function search(){
 if(state.busy)return;
 const query=$("ncg-search-query").value.trim();
 if(query.length<2){status("اكتب حرفين على الأقل للبحث عن حساب موجود.",true);return;}
 lock(true);state.selected=null;$("ncg-assign").disabled=true;
 $("ncg-search-results").textContent="";
 $("ncg-selected-account").textContent="لم يتم اختيار حساب بعد.";
 try{
  const result=await call("search",{query});
  const rows=result.accounts||[];
  const area=$("ncg-search-results");
  area.innerHTML=rows.length?rows.map(p=>'<div class="ncg-result" data-ncg-account="'+E(p.id)+'"><div><b>'+E(p.full_name||"دون اسم")+'</b><small dir="ltr">'+E(p.email||"لا يوجد بريد")+'</small><small>'+E(p.role||"")+'</small></div><button type="button" data-ncg-pick="'+E(p.id)+'">اختيار هذا الحساب</button></div>').join(""):'<p class="ncg-note">لم يُعثر على حساب. تحقق من الاسم أو البريد، أو استخدم إنشاء حساب جديد.</p>';
  area.querySelectorAll("[data-ncg-pick]").forEach(btn=>btn.addEventListener("click",()=>{
    state.selected=rows.find(p=>p.id===btn.dataset.ncgPick)||null;
    area.querySelectorAll(".ncg-result").forEach(el=>el.classList.toggle("selected",el.dataset.ncgAccount===btn.dataset.ncgPick));
    $("ncg-selected-account").textContent="الحساب المحدد: "+(state.selected?.full_name||"") +" — "+(state.selected?.email||"");
    $("ncg-assign").disabled=!state.selected;
  }));
  status(rows.length?"اختر العضو من نتائج البحث ثم اضغط ربط الحساب.":"لا توجد نتائج مطابقة.",false);
 }catch(error){status(error.message||"فشل البحث.",true);}
 finally{lock(false);}
}
async function assign(){
 if(state.busy||!state.selected)return;
 lock(true);
 const user_id=state.selected.id, council_code=state.code,position=$("ncg-existing-position").value;
 try{
  const result=await call("assign",{user_id,council_code,position});
  if(!result.ok)throw Error("تعذر تأكيد الإضافة.");
  status("تم ربط حساب العضو بالمجلس. يبقى بريده وكلمة مروره الأصليان كما هما.");
  state.selected=null;$("ncg-selected-account").textContent="لم يتم اختيار حساب بعد.";
  $("ncg-search-results").textContent="";
  await refreshMembers(true);
 }catch(error){status(error.message||"تعذر ربط الحساب.",true);}
 finally{lock(false);}
}
function renderMembers(){
 const target=$("ncg-members");
 const rows=state.members.filter(m=>m.council_code===state.code);
 target.innerHTML=rows.length?rows.map(m=>{
  const p=m.account||{};
  const username=E(p.full_name||p.email||m.user_id);
  return '<div class="ncg-member"><div><strong>'+username+'</strong><small dir="ltr">'+E(p.email||m.user_id)+'</small><small>'+E(labels[m.position]||m.position)+'</small><span class="ncg-pill '+(m.active?"":"off")+'">'+(m.active?"عضوية نشطة":"عضوية معلقة")+'</span></div><button type="button" class="ncg-action '+(m.active?"secondary":"")+'" data-ncg-toggle="'+E(m.user_id)+'" data-ncg-next="'+String(!m.active)+'">'+(m.active?"تعليق العضوية":"إعادة التفعيل")+'</button></div>';
 }).join(""):'<p class="ncg-note">لا توجد عضويات مسجلة لهذا المجلس بعد.</p>';
 target.querySelectorAll("[data-ncg-toggle]").forEach(btn=>btn.addEventListener("click",()=>toggle(btn)));
}
async function toggle(button){
 if(state.busy)return;
 const user_id=button.dataset.ncgToggle,active=button.dataset.ncgNext==="true";
 const actionName=active?"إعادة التفعيل":"تعليق العضوية";
 if(!confirm("هل تريد "+actionName+" لهذا العضو في المجلس الحالي؟"))return;
 button.disabled=true;
 try{
  const response=await call("set_active",{user_id,council_code:state.code,active});
  if(!response.ok)throw Error("لم يؤكد الخادم التغيير.");
  status("تم "+actionName+" بنجاح.");
  await refreshMembers(true);
 }catch(error){status(error.message||"تعذر تغيير العضوية.",true);button.disabled=false;}
}
async function refreshMembers(silent=false){
 try{
  const data=await call("list");
  state.members=data.memberships||[];
  renderMembers();
  if(!silent)status("تم تحديث عضويات المجالس.");
 }catch(error){status(error.message||"تعذر تحميل الأعضاء.",true);}
}
function init(){
 if(state.initialized)return;state.initialized=true;
 renderCouncils();mode("new");
 $("ncg-create-form").addEventListener("submit",create);
 $("ncg-generate").addEventListener("click",generate);
 $("ncg-search").addEventListener("click",search);
 $("ncg-assign").addEventListener("click",assign);
 $("ncg-refresh").addEventListener("click",()=>refreshMembers());
 $("ncg-copy-link").addEventListener("click",()=>copy(link(state.code)));
 $("ncg-copy-credentials").addEventListener("click",()=>{
  if(!state.credential)return;
  const c=state.credential;
  copy("بوابة مجالس أكاديمية نبض\n"+link(c.council_code)+"\nالبريد: "+c.email+"\nكلمة المرور الأولية: "+c.password+"\nيرجى تغيير كلمة المرور بعد الدخول.");
 });
 $("ncg-clear-credentials").addEventListener("click",clearCredential);
 document.querySelectorAll("[data-ncg-mode]").forEach(b=>b.addEventListener("click",()=>mode(b.dataset.ncgMode)));
 $("councilAccountsTab").addEventListener("click",()=>{
   clearCredential();
   refreshMembers(true);
 });
 document.querySelectorAll('[data-tab]:not(#councilAccountsTab)').forEach(b=>b.addEventListener("click",clearCredential));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
