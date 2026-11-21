/* NABD Councils: authenticated, RLS-scoped council membership card and certificate. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const councils={
 trustees:"المجلس الأعلى للأمناء",academic:"المجلس العلمي والأكاديمي",
 research:"مجلس البحث العلمي والابتكار",students:"المجلس الطلابي الأعلى",
 international:"مجلس العلاقات والشراكات الدولية",quality:"مجلس الجودة والنزاهة الأكاديمية",
 digital:"مجلس الذكاء الاصطناعي والتحول الرقمي",humanitarian:"مجلس العمل الإنساني والاستدامة"
};
const positions={member:"عضو مجلس",chair:"رئيس المجلس",vice_chair:"نائب الرئيس",secretary:"مقرر المجلس"};
const state={mode:"card",data:null};
function note(value,error=false){const el=$("doc-message");el.textContent=value;el.classList.toggle("error",error);el.hidden=!value;}
function date(value){
 try{return new Intl.DateTimeFormat("ar-PS",{year:"numeric",month:"long",day:"numeric"}).format(new Date(value));}
 catch{return "—";}
}
function mode(kind){
 state.mode=kind==="certificate"?"certificate":"card";
 $("document-card").hidden=state.mode!=="card";
 $("document-certificate").hidden=state.mode!=="certificate";
 document.querySelectorAll("[data-document]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.document===state.mode)));
 document.body.dataset.printMode=state.mode;
}
function verificationUrl(token){
 return new URL("council-verify.html?token="+encodeURIComponent(token),location.href).href;
}
function renderQR(target,text){
 target.replaceChildren();
 if(typeof QRCode!=="function")return false;
 try{
  new QRCode(target,{text,width:252,height:252,colorDark:"#102b39",colorLight:"#ffffff",
    correctLevel:QRCode.CorrectLevel?.M});
  return true;
 }catch(_){target.replaceChildren();return false;}
}
function display(membership,name){
 const data=membership;
 state.data=membership;
 const council=councils[data.council_code]||"—";
 const position=positions[data.position]||"—";
 const appointment="تاريخ التكليف: "+date(data.appointed_at);
 [["card-name",name],["card-position",position],["card-council",council],
  ["card-code",data.member_code],["card-date",appointment],
  ["cert-name",name],["cert-position",position],["cert-council",council],
  ["cert-code",data.member_code],["cert-date",appointment]]
  .forEach(([id,val])=>{$(id).textContent=val;});
 const url=verificationUrl(data.verify_token);
 $("verify-link").href=url;
 const qr1=renderQR($("card-qr"),url);
 const qr2=renderQR($("certificate-qr"),url);
 $("doc-controls").hidden=false;
 $("print-zone").hidden=false;
 $("privacy-note").hidden=false;
 const verifiedReady=qr1&&qr2;
 $("print-document").disabled=!verifiedReady;
 if(!data.active){
  $("print-document").disabled=true;
  note("هذه العضوية معلقة حاليًا؛ لا يمكن إصدار بطاقة أو شهادة سارية لها. عند إعادة التفعيل سيبقى رقمها كما هو.",true);
 }else if(!verifiedReady){
  note("تم تحميل البيانات، لكن تعذّر رسم QR. تحقق من اتصال الإنترنت وأعد تحميل الصفحة قبل الطباعة.",true);
 } else {
  note("عضوية نشطة — "+data.member_code+" · يمكن طباعة البطاقة أو الشهادة، والتحقق منهما عبر رمز QR.");
 }
 mode(new URLSearchParams(location.search).get("type"));
}
async function init(){
 document.querySelectorAll("[data-document]").forEach(btn=>btn.addEventListener("click",()=>mode(btn.dataset.document)));
 $("print-document").addEventListener("click",()=>{if(state.data?.active&&!$("print-document").disabled)window.print();});
 const db=window.nabdSupabase;
 if(!db){note("الاتصال الآمن بنظام نبض غير متاح حاليًا.",true);return;}
 try{
  const {data:auth,error:authError}=await db.auth.getUser();
  if(authError||!auth?.user){note("يجب تسجيل الدخول بحساب عضو مجلس أو مدير معتمد أولًا. افتح بوابة المجالس ثم عُد لهذا الرابط.",true);return;}
  const params=new URLSearchParams(location.search);
  const member=params.get("member")||auth.user.id;
  const council=params.get("council");
  const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  if(!uuid.test(member)){note("معرّف العضو غير صالح.",true);return;}
  if(council&&!Object.prototype.hasOwnProperty.call(councils,council)){note("المجلس المحدد غير معروف.",true);return;}
  let request=db.from("nabd_council_memberships")
    .select("user_id,council_code,position,active,appointed_at,member_code,verify_token")
    .eq("user_id",member).order("appointed_at",{ascending:true}).limit(1);
  if(council)request=request.eq("council_code",council);
  const {data:rows,error:membershipError}=await request;
  if(membershipError||!rows?.length){
    note("لم يُعثر على عضوية متاحة لهذا الحساب في المجلس المحدد، أو ليست لديك صلاحية الاطلاع عليها.",true);
    return;
  }
  const membership=rows[0];
  const {data:profile,error:profileError}=await db.from("profiles")
    .select("full_name,role").eq("id",membership.user_id).maybeSingle();
  if(profileError||!profile){note("تعذر تحميل اسم العضو من سجل الأكاديمية.",true);return;}
  $("director-return").hidden=profile.role!=="admin" && member===auth.user.id;
  display(membership,profile.full_name||"—");
 }catch(_){note("حدث خطأ أثناء تحميل مستندات العضوية. تحقق من الاتصال وأعد المحاولة.",true);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
else init();
})();