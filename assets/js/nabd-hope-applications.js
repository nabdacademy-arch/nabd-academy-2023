(()=>{
"use strict";
const $=id=>document.getElementById(id),root=$("hope-applications");if(!root)return;
const url="https://zsmmmljgguycrvyrmakl.supabase.co",key="sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM",site="0x4AAAAAAFW8jGnVSDWdHdLz";
const db=window.supabase.createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
let state=null,widgets={},tokens={},busy=false,pending=null;
const ar=()=>document.documentElement.lang==="ar",t=(a,e)=>ar()?a:e;
// Result presentation only. The server remains the source of every decision.
const resultViews={
 pending:{tone:"pending",icon:"◷",title:["طلبك قيد المراجعة","Your application is pending"],detail:["تم العثور على طلبك. لم تُنشر نتيجة بعد. يمكنك العودة إلى هذه الصفحة والاستعلام لاحقًا بنفس رمز المتابعة.","Your application was found. No result has been published yet. Return later with the same tracking code."]},
 review:{tone:"review",icon:"◷",title:["طلبك قيد الدراسة","Your application is under review"],detail:["تعمل إدارة المنحة على مراجعة طلبك. تابع حالة الطلب من خلال هذه البوابة.","The scholarship administration is reviewing your application. Check this portal for updates."]},
 shortlisted:{tone:"shortlisted",icon:"✦",title:["تم ترشيحك مبدئيًا","You have been shortlisted"],detail:["أنت ضمن المرشحين مبدئيًا للمنحة. هذا ليس قبولًا نهائيًا؛ يرجى متابعة أي تعليمات لاحقة من الإدارة.","You have been shortlisted. This is not final acceptance; please follow any further instructions from the administration."]},
 accepted:{tone:"accepted",icon:"✓",title:["تهانينا! تم قبول طلبك","Congratulations! Your application was accepted"],detail:["يسرنا إبلاغك بقرار قبول طلبك. تقديم الدعم يبقى مشروطًا بتوافر التمويل واستيفاء شروط المنحة. تابع تعليمات الإدارة لاستكمال الإجراءات.","We are pleased to inform you that your application was accepted. Support remains subject to funding and scholarship conditions. Follow the administration’s instructions for next steps."]},
 waitlisted:{tone:"waitlisted",icon:"◷",title:["طلبك على قائمة الانتظار","You are on the waiting list"],detail:["طلبك ما زال ضمن قائمة الانتظار. لم يُعتمد لك دعم نهائي حتى الآن. قد تتغير الحالة وفق توافر التمويل ونتائج المراجعة؛ يرجى متابعة الاستعلام لاحقًا.","Your application remains on the waiting list. No final support has been approved. Your status may change depending on funding and review outcomes; please check again later."]},
 rejected:{tone:"rejected",icon:"—",title:["لم يتم اختيار طلبك","Your application was not selected"],detail:["نقدّر اهتمامك وثقتك بأكاديمية نبض. نأسف لعدم اختيار طلبك وفق النتيجة الحالية. نتمنى لك التوفيق واستمرار مسيرتك التعليمية.","Thank you for your interest and trust in NABD Academy. We regret that your application was not selected in the current decision. We wish you success in your studies."]},
 notfound:{tone:"notice",icon:"?",title:["لم نجد طلبًا مطابقًا","No matching application"],detail:["تحقق من البريد الإلكتروني ورمز المتابعة كما ظهرا عند التسجيل، ثم حاول مرة أخرى.","Check that your email and tracking code match your original registration, then try again."]},
 loading:{tone:"review",icon:"…",title:["جارٍ الاستعلام عن النتيجة","Checking your result"],detail:["يرجى الانتظار حتى يتم التحقق من حالة طلبك.","Checking your application status."]},
 verification:{tone:"notice",icon:"!",title:["أكمل التحقق الأمني","Complete the security check"],detail:["أكمل التحقق الأمني ثم اضغط على عرض النتيجة.","Complete the security check, then select View result."]},
 error:{tone:"notice",icon:"!",title:["تعذر عرض النتيجة","Unable to display the result"],detail:["حاول مرة أخرى بعد قليل.","Please try again shortly."]}
};
let resultState=null;
function renderResult(){
 const box=$("hope-lookup-message");if(!box)return;
 box.replaceChildren();
 if(!resultState){box.hidden=true;delete box.dataset.resultTone;return;}
 const view=resultViews[resultState.kind]||resultViews.error;
 box.hidden=false;box.dataset.resultTone=view.tone;
 const icon=document.createElement("span");icon.className="hope-result-icon";icon.setAttribute("aria-hidden","true");icon.textContent=view.icon;
 const content=document.createElement("div");content.className="hope-result-content";
 const label=document.createElement("span");label.className="hope-result-label";label.textContent=t("منحة نبض الأمل · حالة الطلب","NABD HOPE · APPLICATION STATUS");
 const title=document.createElement("strong");title.className="hope-result-title";title.textContent=t(...view.title);
 const detail=document.createElement("p");detail.className="hope-result-detail";detail.textContent=resultState.error?errorText(resultState.error):t(...view.detail);
 content.append(label,title,detail);box.append(icon,content);
}
function showResult(kind,error=null){resultState={kind,error};renderResult();}
const status=(id,m)=>{$(id).textContent=m;};
function local(){
 document.querySelectorAll("[data-hope-ar]").forEach(n=>n.textContent=ar()?n.dataset.hopeAr:n.dataset.hopeEn);
 $("hope-apply-button").textContent=t("التقديم للمنحة ↗","Apply for scholarship ↗");$("hope-result-button").textContent=t("الاستعلام عن النتيجة ↗","Check your result ↗");
 const label=state===true?t("التقديم مفتوح الآن","Applications are open"):state===false?t("التقديم مغلق حاليًا","Applications are closed"):t("تعذر تأكيد حالة التسجيل","Registration status unavailable");
 status("hope-registration-status",label);
 const texts={notOpen:label,aOne:label+" — "+t("التقديم مجاني، ولا يضمن الحصول على التمويل.","Application is free and does not guarantee funding."),footerDisclaimer:t("مبادرة قيد الإعداد؛ حالة التقديم موضحة أعلاه، والتمويل غير مضمون.","Initiative in preparation; see application status above. Funding is not guaranteed.")};
 Object.entries(texts).forEach(([k,v])=>{const n=document.querySelector('[data-t="'+k+'"]');if(n)n.textContent=v;});
 $("hope-form-fields").disabled=state!==true||busy;$("hope-form").hidden=state!==true;
 $("hope-open-note").hidden=state===true;
 renderResult();
}
async function refresh(){try{const {data,error}=await db.from("nabd_hope_control").select("registration_open").eq("id",1).single();state=error?null:data.registration_open;}catch{state=null;}local();}
function renderCaptcha(kind){
 if(widgets[kind]!==undefined||!window.turnstile)return;
 widgets[kind]=window.turnstile.render("#hope-"+kind+"-captcha",{sitekey:site,action:kind==="submit"?"hope_submit":kind==="verify"?"hope_verify":"hope_lookup",callback:token=>{tokens[kind]=token;}, "expired-callback":()=>{tokens[kind]="";},"error-callback":()=>{tokens[kind]="";}});
}
function resetCaptcha(kind){tokens[kind]="";if(widgets[kind]!==undefined)window.turnstile?.reset(widgets[kind]);}
function show(kind){const isApply=kind==="submit";$("hope-apply-area").hidden=!isApply;$("hope-lookup-area").hidden=isApply;root.hidden=false;local();if(!isApply||state===true)renderCaptcha(kind);refresh().then(()=>{if(!isApply||state===true)renderCaptcha(kind);});root.scrollIntoView({behavior:"smooth",block:"start"});}
$("hope-apply-button").addEventListener("click",()=>show("submit"));$("hope-result-button").addEventListener("click",()=>show("lookup"));
$("hope-refresh-state").addEventListener("click",async()=>{await refresh();if(state===true)renderCaptcha("submit");});
$("language")?.addEventListener("change",local);
window.nabdHopeCaptchaReady=()=>{if(!root.hidden){if(!$("hope-verification-form").hidden&&!$("hope-verification").hidden)renderCaptcha("verify");if(!$("hope-lookup-area").hidden)renderCaptcha("lookup");if(!$("hope-apply-area").hidden&&state===true)renderCaptcha("submit");}};
const script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=nabdHopeCaptchaReady";script.async=true;script.defer=true;document.head.append(script);
async function call(body){const r=await fetch(url+"/functions/v1/nabd-hope-register",{method:"POST",headers:{"Content-Type":"application/json","apikey":key},body:JSON.stringify(body)});const d=await r.json();return d;}
const errors={CLOSED:["التسجيل مغلق. لم يُستقبل الطلب الجديد.","Registration is closed. No new application was submitted."],DUPLICATE_OR_CONFLICT:["تعذر تسجيل طلب جديد. إن سبق لك التقديم فاستخدم رمز المتابعة الأصلي.","A new application could not be registered. If you applied before, use your original tracking code."],INVALID_INPUT:["راجع البيانات المطلوبة.","Check the required information."],CAPTCHA_FAILED:["أعد التحقق الأمني وحاول مرة أخرى.","Repeat security verification and try again."],SERVICE_UNAVAILABLE:["الخدمة غير متاحة الآن، حاول لاحقًا بنفس رمز المتابعة.","Service unavailable; retry later using the same tracking code."]};
function errorText(code){const a=errors[code]||errors.SERVICE_UNAVAILABLE;return t(...a);}
$("hope-form").addEventListener("submit",async e=>{
 e.preventDefault();if(busy||state!==true)return;
 if(!tokens.submit){status("hope-apply-message",t("أكمل التحقق الأمني.","Complete the security check."));return;}
 const f=new FormData(e.target),payload={name:String(f.get("name")||"").trim(),email:String(f.get("email")||"").trim().toLowerCase(),phone:String(f.get("phone")||"").trim(),governorate:f.get("governorate"),institution:String(f.get("institution")||"").trim(),field:String(f.get("field")||"").trim(),stage:f.get("stage"),support:f.getAll("support"),consent:f.get("consent")==="on"};
 if(!payload.support.length){status("hope-apply-message",t("اختر نوع دعم واحدًا على الأقل.","Select at least one support type."));return;}
 if(!pending||pending.email!==payload.email)pending={email:payload.email,code:crypto.randomUUID()};$("hope-verify-next").hidden=true;
 // The applicant keeps the secret; it is never stored in public code or sent by email.
 $("hope-receipt").hidden=false;$("hope-receipt-code").textContent=pending.code;
 status("hope-receipt-label",t("احفظ رمز المتابعة الآن؛ لا يعني ظهوره أن الطلب حُفظ.","Save this tracking code now; its appearance does not confirm submission."));
 busy=true;local();status("hope-apply-message",t("جارٍ إرسال الطلب…","Submitting…"));
 try{const d=await call({action:"submit",code:pending.code,captcha:tokens.submit,...payload});if(!d.ok){status("hope-apply-message",errorText(d.error));if(d.error==="CLOSED")await refresh();return;}
 status("hope-apply-message",t("تم حفظ البيانات الأساسية. احفظ الرمز ثم استكمل الوثيقة حتى يصبح طلبك جاهزًا للمراجعة.","Basic details saved. Save the tracking code and complete verification to prepare your application for review."));$("hope-verify-next").hidden=false;
 status("hope-receipt-label",t("رمز متابعة مؤكد — احتفظ به في مكان آمن.","Confirmed tracking code — save it somewhere safe."));
 $("hope-lookup-code").value=pending.code;$("hope-lookup-email").value=payload.email;e.target.reset();pending=null;
 }catch{status("hope-apply-message",t("لم نتأكد من الحفظ. لا تغلق الصفحة؛ أعد المحاولة بنفس البريد والرمز.","Submission not confirmed. Keep this page open and retry with the same email and code."));}
 finally{busy=false;resetCaptcha("submit");local();}
});
$("hope-copy-code").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("hope-receipt-code").textContent);status("hope-copy-message",t("تم النسخ.","Copied."));}catch{status("hope-copy-message",t("انسخ الرمز يدويًا.","Copy the code manually."));}});
const lookupForm=$("hope-lookup-form"),lookupEmail=$("hope-lookup-email"),lookupCode=$("hope-lookup-code"),lookupButton=$("hope-lookup-submit");
const verifyBox=$("hope-verification"),verifyForm=$("hope-verification-form"),verifyButton=$("hope-verify-submit");
let verificationState=null,verificationBusy=false;
const verificationWords={
 missing:["لم تُرسل الوثيقة بعد — استكمل البيانات أدناه.","Document missing — complete the form below."],
 submitted:["تم استلام الوثيقة، وهي بانتظار المراجعة اليدوية.","Document received; manual review is pending."],
 verified:["تم اعتماد التحقق من الوثيقة من الإدارة.","The administration marked the document verified."],
 needs_correction:["تحتاج الوثيقة أو البيانات إلى تصحيح. يرجى إعادة تقديمها.","Your document or details require correction. Please resubmit."],
 unknown:["أكمل بيانات التحقق ثم أرسل الوثيقة.","Complete your verification details and submit the document."]
};
function renderVerification(){
 if(!verificationState){verifyBox.hidden=true;verifyForm.hidden=true;return;}
 verifyBox.hidden=false;
 status("hope-verification-status",t(...(verificationWords[verificationState]||verificationWords.unknown)));
 verifyForm.hidden=!["missing","needs_correction","unknown"].includes(verificationState);
 if(!verifyForm.hidden)renderCaptcha("verify");
}
function setVerification(v){verificationState=v;renderVerification();}
function hideVerification(){verificationState=null;verifyForm.reset();status("hope-verify-message","");renderVerification();}
$("hope-verify-next").addEventListener("click",()=>{show("lookup");resultState=null;renderResult();setVerification("unknown");});
const ve={
 INVALID_INPUT:["راجع نوع الهوية ورقمها ورمز البلد والملف.","Check identity type, number, country code and document."],
 FILE_LIMIT_OR_INVALID:["الملف غير صالح أو أكبر من 1 MB.","Invalid file or larger than 1 MB."],
 FILE_TYPE:["الملف ليس PDF أو JPG أو PNG صالح النوع.","File is not a supported PDF, JPG or PNG."],
 IDENTITY_CONFLICT:["تعذر إتمام التحقق. راجع الرقم وتواصل مع الإدارة إذا استمرت المشكلة.","Verification could not be completed. Check your number and contact the administration if needed."],
 ALREADY_SUBMITTED:["توجد وثيقة مسجلة أو لم يحن وقت إعادة الرفع. استعلم لتحديث الحالة.","A document is already registered or resubmission is not yet available. Check your status again."],
 NOT_FOUND:["لم نجد طلبًا مطابقًا. تحقق من رمز المتابعة والبريد.","No matching application. Check the tracking code and email."],
 SAVE_UNCONFIRMED:["لم يتأكد حفظ الوثيقة. استعلم عن حالة التحقق قبل إعادة الإرسال.","Document save was not confirmed. Check verification status before retrying."],
 STORAGE_UNAVAILABLE:["لم يتوفر تخزين الوثيقة الآن. حاول لاحقًا.","Document storage is unavailable. Try later."]
};
verifyForm.addEventListener("submit",async e=>{
 e.preventDefault();if(verificationBusy||!verificationState)return;
 if(!lookupEmail.checkValidity()||!lookupCode.checkValidity()){status("hope-verify-message",t("أدخل البريد ورمز المتابعة الصحيحين أعلاه.","Enter a valid email and tracking code above."));return;}
 if(!tokens.verify){status("hope-verify-message",t("أكمل التحقق الأمني.","Complete the security check."));return;}
 const f=new FormData(verifyForm);
 if(f.get("consent")!=="on"){
   status("hope-verify-message",t("راجع إقرار استخدام الوثيقة وحدّد مربع الموافقة قبل الإرسال.","Review the document-use statement and select the consent checkbox before submitting."));
   return;
 }
 const file=f.get("document");
 if(!(file instanceof File)||file.size<1||file.size>1048576){status("hope-verify-message",t("اختر ملفًا لا يتجاوز 1 MB.","Select a document up to 1 MB."));return;}
 const number=String(f.get("number")||"").trim().replace(/[٠-٩]/g,x=>String("٠١٢٣٤٥٦٧٨٩".indexOf(x))).replace(/[۰-۹]/g,x=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(x))).toUpperCase();
 const issuer=String(f.get("issuer")||"").trim().toUpperCase();
 if(!/^[A-Z0-9]{5,20}$/.test(number)||!/^[A-Z]{2}$/.test(issuer)||(f.get("kind")==="national_id"&&issuer==="PS"&&!/^[0-9]{9}$/.test(number))){status("hope-verify-message",t("تحقق من صيغة الرقم ورمز بلد الإصدار. الهوية الفلسطينية تتطلب 9 أرقام.","Check the ID format and country code. Palestinian national ID requires 9 digits."));return;}
 f.set("number",number);f.set("issuer",issuer);f.set("code",lookupCode.value.trim());f.set("email",lookupEmail.value.trim());f.set("captcha",tokens.verify);f.set("consent","yes");
 verificationBusy=true;verifyButton.disabled=true;lookupButton.disabled=true;lookupEmail.readOnly=true;lookupCode.readOnly=true;status("hope-verify-message",t("جارٍ رفع الوثيقة بصورة آمنة…","Uploading document securely…"));
 try{
 const r=await fetch(url+"/functions/v1/nabd-hope-verify-enrollment",{method:"POST",headers:{apikey:key},body:f});
 const d=await r.json();
 if(!d.ok){status("hope-verify-message",ve[d.error]?t(...ve[d.error]):errorText(d.error));return;}
 verifyForm.reset();setVerification("submitted");status("hope-verify-message",t("تم استلام الوثيقة. ستراجعها إدارة المنحة؛ لا يعني ذلك قبول الطلب.","Document received. The administration will review it; this does not mean acceptance."));
 }catch{status("hope-verify-message",t("تعذر تأكيد الرفع. استعلم عن الحالة قبل إعادة المحاولة.","Upload not confirmed. Check status before retrying."));}
 finally{verificationBusy=false;verifyButton.disabled=false;lookupButton.disabled=false;lookupEmail.readOnly=false;lookupCode.readOnly=false;resetCaptcha("verify");}
});
$("language")?.addEventListener("change",renderVerification);

lookupForm.addEventListener("input",()=>{if(!lookupButton.disabled){resultState=null;renderResult();hideVerification();}});
lookupForm.addEventListener("submit",async e=>{
 e.preventDefault();if(lookupButton.disabled)return;
 if(!tokens.lookup){showResult("verification");return;}
 const email=lookupEmail.value.trim(),code=lookupCode.value.trim();
 hideVerification();lookupButton.disabled=true;lookupEmail.readOnly=true;lookupCode.readOnly=true;showResult("loading");
 try{
  const d=await call({action:"lookup",code,email,captcha:tokens.lookup});
  if(d.error){showResult(d.error==="CAPTCHA_FAILED"?"verification":"error",d.error);return;}
  if(d.found===false){showResult("notfound");return;}
  if(d.found!==true){showResult("error","SERVICE_UNAVAILABLE");return;}
  const publishedKinds=["review","shortlisted","accepted","waitlisted","rejected"];
  showResult(d.published===true&&publishedKinds.includes(d.status)?d.status:"pending");setVerification(Object.hasOwn(verificationWords,d.verification)?d.verification:"unknown");
 }catch{showResult("error","SERVICE_UNAVAILABLE");}
 finally{lookupButton.disabled=false;lookupEmail.readOnly=false;lookupCode.readOnly=false;resetCaptcha("lookup");}
});
refresh();local();
})();