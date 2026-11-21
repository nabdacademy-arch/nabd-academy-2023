/* Public membership verification: read-only, token-gated and non-enumerable. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const names={trustees:"المجلس الأعلى للأمناء",academic:"المجلس العلمي والأكاديمي",research:"مجلس البحث العلمي والابتكار",students:"المجلس الطلابي الأعلى",international:"مجلس العلاقات والشراكات الدولية",quality:"مجلس الجودة والنزاهة الأكاديمية",digital:"مجلس الذكاء الاصطناعي والتحول الرقمي",humanitarian:"مجلس العمل الإنساني والاستدامة"};
const positions={member:"عضو مجلس",chair:"رئيس المجلس",vice_chair:"نائب الرئيس",secretary:"مقرر المجلس"};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function field(label,value){
 const r=document.createElement("div");r.className="field";
 const span=document.createElement("span");span.textContent=label;
 const strong=document.createElement("strong");strong.textContent=value;
 r.append(span,strong);return r;
}
function show(kind,title,description,rows=[]){
 const el=$("result");el.className="state show "+(kind==="ok"?"ok":"bad");
 $("result-title").textContent=title;
 $("result-description").textContent=description;
 $("result-details").replaceChildren(...rows.map(([k,v])=>field(k,v)));
}
function date(v){try{return new Intl.DateTimeFormat("ar-PS",{year:"numeric",month:"long",day:"numeric"}).format(new Date(v));}catch{return "—";}}
async function verify(event){
 event?.preventDefault();
 const token=$("token").value.trim();
 if(!uuid.test(token)){show("bad","رمز غير صالح","يرجى فتح رمز QR الصادر من أكاديمية نبض، أو إدخال رمز التحقق الصحيح.");return;}
 const cfg=window.NABD_CONFIG||{};
 if(!cfg.supabaseUrl||!cfg.supabaseAnonKey){show("bad","الخدمة غير متاحة","إعدادات الاتصال غير متوفرة حاليًا.");return;}
 $("verify").disabled=true;$("message").textContent="جارٍ التحقق مباشرة من سجل العضويات...";
 $("result").className="state";
 try{
  const result=await fetch(cfg.supabaseUrl.replace(/\/$/,"")+"/functions/v1/nabd-council-verify",{
    method:"POST",
    headers:{"content-type":"application/json","apikey":cfg.supabaseAnonKey},
    body:JSON.stringify({token}),cache:"no-store"
  });
  const data=await result.json();
  if(data.status==="valid"){
    const rows=[
      ["الاسم",data.full_name||"—"],
      ["رقم العضوية",data.member_code],
      ["المجلس",names[data.council_code]||"—"],
      ["الصفة",positions[data.position]||"—"],
      ["تاريخ التكليف",date(data.appointed_at)]
    ];
    show("ok","✓ عضوية نشطة ومعتمدة داخل نبض","تم التأكد من بيانات التكليف من السجل الرسمي الحالي للأكاديمية.",rows);
  }else if(data.status==="inactive"){
    show("bad","العضوية معلّقة","هذه العضوية ليست نشطة حاليًا، ولا يجوز اعتبار البطاقة أو شهادة التكليف دليلًا على تكليف سارٍ.",data.member_code?[["رقم العضوية",data.member_code]]:[]);
  }else if(data.status==="invalid"){
    show("bad","لم يتم العثور على تكليف صالح","رمز التحقق غير معروف أو أُلغي. لا تعتمد هذه البطاقة أو الشهادة دون تحقق ناجح.");
  }else {
    show("bad","تعذّر التحقق","خدمة التحقق غير متاحة مؤقتًا. أعد المحاولة لاحقًا، ولا تعتبر النتيجة تأكيدًا للعضوية.");
  }
 }catch(_){show("bad","خطأ بالاتصال","تعذّر الاتصال بخدمة التحقق. أعد المحاولة عند توفر الإنترنت.");}
 finally{$("verify").disabled=false;$("message").textContent="";}
}
function init(){
 $("verification-form").addEventListener("submit",verify);
 const token=new URLSearchParams(location.search).get("token");
 if(token){$("token").value=token;verify();}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();