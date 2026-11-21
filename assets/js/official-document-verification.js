/* Public document verification: status only, never subject identity. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const names={statement:"إفادة قيد بيانات",permit:"تصريح مشاركة تنظيمي",report:"تقرير إداري",treatment_request:"نموذج طلب علاج / إحالة",consultation_request:"نموذج طلب استشارة",complaint:"استمارة تقديم شكوى"};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function field(label,text){const e=document.createElement("div");e.className="field";const s=document.createElement("span");s.textContent=label;const b=document.createElement("strong");b.textContent=text;e.append(s,b);return e;}
function show(status,title,description,data=[]){const root=$("result");root.hidden=false;root.className=status;$("title").textContent=title;$("description").textContent=description;$("details").replaceChildren(...data.map(([key,value])=>field(key,value)));}
function fmt(d){try{return new Intl.DateTimeFormat("ar-PS",{year:"numeric",month:"long",day:"numeric"}).format(new Date(d));}catch{return "—";}}
async function check(e){
 e?.preventDefault();
 const token=$("token").value.trim();
 if(!uuid.test(token)){show("invalid","رمز غير صالح","افتح رابط QR الموجود في المستند الصادر من أكاديمية نبض.");return;}
 const cfg=window.NABD_CONFIG||{};
 if(!cfg.supabaseUrl||!cfg.supabaseAnonKey){show("invalid","الخدمة غير متاحة","تعذّر تحميل إعدادات الاتصال.");return;}
 $("check").disabled=true;
 try{
  const r=await fetch(cfg.supabaseUrl.replace(/\/$/,"")+"/functions/v1/nabd-document-verify",{method:"POST",headers:{"content-type":"application/json","apikey":cfg.supabaseAnonKey},body:JSON.stringify({token}),cache:"no-store"});
  const d=await r.json();
  const details=d.number?[["رقم المستند",d.number],["نوع المستند",names[d.type]||"—"],["تاريخ الإصدار",fmt(d.issued_at)]]:[];
  if(d.status==="valid")show("valid","✓ المستند ساري في سجل نبض","تم تأكيد وجود هذا المستند في سجل الأكاديمية وأنه لم يُلغَ.",details);
  else if(d.status==="void")show("void","المستند ملغى","ألغت الإدارة هذا المستند ولا يجوز اعتباره ساريًا.",details);
  else if(d.status==="invalid")show("invalid","لم يُعثر على المستند","رمز التحقق غير صحيح أو المستند غير مسجّل.");
  else show("invalid","تعذّر التحقق","الخدمة غير متاحة حاليًا. أعد المحاولة ولا تعتبر النتيجة اعتمادًا.");
 }catch(_){show("invalid","تعذّر الاتصال","حاول مجددًا عند توفر الإنترنت.");}
 finally{$("check").disabled=false;}
}
function init(){$("form").addEventListener("submit",check);const t=new URLSearchParams(location.search).get("token");if(t){$("token").value=t;check();}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();