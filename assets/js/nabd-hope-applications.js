(()=>{
"use strict";
const $=id=>document.getElementById(id),root=$("hope-applications");if(!root)return;
const url="https://zsmmmljgguycrvyrmakl.supabase.co",key="sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM",site="0x4AAAAAAFW8jGnVSDWdHdLz";
const db=window.supabase.createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
let state=null,widgets={},tokens={},busy=false,pending=null;
const ar=()=>document.documentElement.lang==="ar",t=(a,e)=>ar()?a:e;
const words={pending:["قيد المراجعة — لم تُنشر نتيجة بعد","Pending — no result published yet"],review:["قيد الدراسة","Under review"],shortlisted:["مرشح مبدئيًا","Shortlisted"],accepted:["مقبول — وفق توفر التمويل وشروط المنحة","Accepted — subject to funding and scholarship conditions"],waitlisted:["قائمة الانتظار","Waitlisted"],rejected:["غير مختار","Not selected"]};
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
}
async function refresh(){try{const {data,error}=await db.from("nabd_hope_control").select("registration_open").eq("id",1).single();state=error?null:data.registration_open;}catch{state=null;}local();}
function renderCaptcha(kind){
 if(widgets[kind]!==undefined||!window.turnstile)return;
 widgets[kind]=window.turnstile.render("#hope-"+kind+"-captcha",{sitekey:site,action:kind==="submit"?"hope_submit":"hope_lookup",callback:token=>{tokens[kind]=token;}, "expired-callback":()=>{tokens[kind]="";},"error-callback":()=>{tokens[kind]="";}});
}
function resetCaptcha(kind){tokens[kind]="";if(widgets[kind]!==undefined)window.turnstile?.reset(widgets[kind]);}
function show(kind){const isApply=kind==="submit";$("hope-apply-area").hidden=!isApply;$("hope-lookup-area").hidden=isApply;root.hidden=false;local();if(!isApply||state===true)renderCaptcha(kind);refresh().then(()=>{if(!isApply||state===true)renderCaptcha(kind);});root.scrollIntoView({behavior:"smooth",block:"start"});}
$("hope-apply-button").addEventListener("click",()=>show("submit"));$("hope-result-button").addEventListener("click",()=>show("lookup"));
$("hope-refresh-state").addEventListener("click",async()=>{await refresh();if(state===true)renderCaptcha("submit");});
$("language")?.addEventListener("change",local);
window.nabdHopeCaptchaReady=()=>{if(!root.hidden){if(!$("hope-lookup-area").hidden)renderCaptcha("lookup");if(!$("hope-apply-area").hidden&&state===true)renderCaptcha("submit");}};
const script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=nabdHopeCaptchaReady";script.async=true;script.defer=true;document.head.append(script);
async function call(body){const r=await fetch(url+"/functions/v1/nabd-hope-register",{method:"POST",headers:{"Content-Type":"application/json","apikey":key},body:JSON.stringify(body)});const d=await r.json();return d;}
const errors={CLOSED:["التسجيل مغلق. لم يُستقبل الطلب الجديد.","Registration is closed. No new application was submitted."],DUPLICATE_OR_CONFLICT:["تعذر تسجيل طلب جديد. إن سبق لك التقديم فاستخدم رمز المتابعة الأصلي.","A new application could not be registered. If you applied before, use your original tracking code."],INVALID_INPUT:["راجع البيانات المطلوبة.","Check the required information."],CAPTCHA_FAILED:["أعد التحقق الأمني وحاول مرة أخرى.","Repeat security verification and try again."],SERVICE_UNAVAILABLE:["الخدمة غير متاحة الآن، حاول لاحقًا بنفس رمز المتابعة.","Service unavailable; retry later using the same tracking code."]};
function errorText(code){const a=errors[code]||errors.SERVICE_UNAVAILABLE;return t(...a);}
$("hope-form").addEventListener("submit",async e=>{
 e.preventDefault();if(busy||state!==true)return;
 if(!tokens.submit){status("hope-apply-message",t("أكمل التحقق الأمني.","Complete the security check."));return;}
 const f=new FormData(e.target),payload={name:String(f.get("name")||"").trim(),email:String(f.get("email")||"").trim().toLowerCase(),phone:String(f.get("phone")||"").trim(),governorate:f.get("governorate"),institution:String(f.get("institution")||"").trim(),field:String(f.get("field")||"").trim(),stage:f.get("stage"),support:f.getAll("support"),consent:f.get("consent")==="on"};
 if(!payload.support.length){status("hope-apply-message",t("اختر نوع دعم واحدًا على الأقل.","Select at least one support type."));return;}
 if(!pending||pending.email!==payload.email)pending={email:payload.email,code:crypto.randomUUID()};
 // The applicant keeps the secret; it is never stored in public code or sent by email.
 $("hope-receipt").hidden=false;$("hope-receipt-code").textContent=pending.code;
 status("hope-receipt-label",t("احفظ رمز المتابعة الآن؛ لا يعني ظهوره أن الطلب حُفظ.","Save this tracking code now; its appearance does not confirm submission."));
 busy=true;local();status("hope-apply-message",t("جارٍ إرسال الطلب…","Submitting…"));
 try{const d=await call({action:"submit",code:pending.code,captcha:tokens.submit,...payload});if(!d.ok){status("hope-apply-message",errorText(d.error));if(d.error==="CLOSED")await refresh();return;}
 status("hope-apply-message",t("تم استلام الطلب بنجاح. احتفظ بالرمز والبريد للاستعلام.","Application received. Keep your code and email to check your result."));
 status("hope-receipt-label",t("رمز متابعة مؤكد — احتفظ به في مكان آمن.","Confirmed tracking code — save it somewhere safe."));
 $("hope-lookup-code").value=pending.code;$("hope-lookup-email").value=payload.email;e.target.reset();pending=null;
 }catch{status("hope-apply-message",t("لم نتأكد من الحفظ. لا تغلق الصفحة؛ أعد المحاولة بنفس البريد والرمز.","Submission not confirmed. Keep this page open and retry with the same email and code."));}
 finally{busy=false;resetCaptcha("submit");local();}
});
$("hope-copy-code").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("hope-receipt-code").textContent);status("hope-copy-message",t("تم النسخ.","Copied."));}catch{status("hope-copy-message",t("انسخ الرمز يدويًا.","Copy the code manually."));}});
$("hope-lookup-form").addEventListener("submit",async e=>{e.preventDefault();if(!tokens.lookup){status("hope-lookup-message",t("أكمل التحقق الأمني.","Complete the security check."));return;}const btn=$("hope-lookup-submit");btn.disabled=true;status("hope-lookup-message",t("جارٍ الاستعلام…","Checking…"));
 try{const d=await call({action:"lookup",code:$("hope-lookup-code").value.trim(),email:$("hope-lookup-email").value.trim(),captcha:tokens.lookup});if(d.error){status("hope-lookup-message",errorText(d.error));return;}status("hope-lookup-message",d.found?t(...(words[d.status]||words.pending)):t("لم نجد طلبًا مطابقًا. تحقق من البريد والرمز.","No matching application. Check your email and code."));}catch{status("hope-lookup-message",errorText("SERVICE_UNAVAILABLE"));}finally{btn.disabled=false;resetCaptcha("lookup");}});
refresh();local();
})();