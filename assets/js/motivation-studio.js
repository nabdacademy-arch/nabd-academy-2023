/* NABD Motivation Studio — Phase 1. No keys, personal letter storage, or fake local AI. */
(()=>{"use strict";
 const API="https://zsmmmljgguycrvyrmakl.supabase.co/functions/v1/nabd-motivation-studio";
 const SITE_KEY="0x4AAAAAAFW8jGnVSDWdHdLz";
 const $=id=>document.getElementById(id);
 const form=$("letterForm"),status=$("status"),resultPanel=$("resultPanel"),output=$("generatedLetter");
 if(!form||!status||!resultPanel||!output)return;
 let ui="ar",step=1,variant=1,busy=false,captchaId=null;
 const feedback={
  ar:{opportunity:"اكتب اسم الفرصة أو البرنامج أولًا.",about:"احكِ لنا عن نفسك بما لا يقل عن 35 حرفًا، حتى تصبح الرسالة شخصية فعلًا.",
      why:"اشرح سبب رغبتك في هذه الفرصة بصورة أوضح (18 حرفًا على الأقل).",
      consent:"يجب الموافقة على إرسال المعلومات لمزوّد الذكاء الاصطناعي أولًا.",
      captcha:"أكمل التحقق الأمني أولًا ثم أعد المحاولة.",
      loading:"نصوغ رسالتك استنادًا إلى قصتك الحقيقية... قد تحتاج العملية إلى اتصال مستقر.",
      copied:"تم نسخ الرسالة. راجع الحقائق قبل إرسالها.",save:"تم حفظ المسودة على جهازك.",
      reroll:"للحصول على صياغة جديدة، أكمل التحقق الأمني مجددًا ثم اضغط «أنشئ رسالتي». لن نغيّر حقائقك.",
      server:"تعذر الوصول إلى محرّك الكتابة الآن. لم نختلق نصًا بديلًا؛ حاول مرة أخرى.",
      RATE_LIMIT:"وصلت إلى الحد المسموح للإنشاء حاليًا (6 رسائل في الساعة و24 في اليوم). جرّب لاحقًا.",
      CAPTCHA_FAILED:"التحقق الأمني غير صالح أو انتهت صلاحيته؛ أعد التحقق ثم حاول.",
      NOT_CONFIGURED:"محرّك الكتابة غير مفعّل بالكامل حاليًا. جرّب لاحقًا.",
      RATE_GATE_UNAVAILABLE:"خدمة حماية الطلبات غير متاحة مؤقتًا.",
      INVALID_INPUT:"يرجى مراجعة الحقول الأساسية ثم المحاولة.",
      MODEL_UNAVAILABLE:"لم يستطع مزود الذكاء الاصطناعي إنتاج مسودة صالحة الآن. حاول لاحقًا.",
      NETWORK_ID_UNAVAILABLE:"تعذر التحقق من الطلب بأمان عبر الشبكة الحالية.",
      copyFailed:"تعذر النسخ التلقائي؛ حدّد نص الرسالة وانسخه يدويًا.",
      noMissing:"لا توجد حقائق ناقصة حددها المحرّر. مع ذلك راجع التفاصيل بنفسك."},
  en:{opportunity:"Enter the name of your opportunity or program.",about:"Tell us more about yourself (at least 35 characters).",
      why:"Explain specifically why you want this opportunity (at least 18 characters).",
      consent:"Please consent to AI processing before generating your draft.",
      captcha:"Complete the security check before continuing.",
      loading:"Drafting from your true story. A stable connection helps...",
      copied:"Letter copied. Verify every fact before sending.",save:"The draft was saved to your device.",
      reroll:"Complete the security check again, then select Generate my letter. Your facts will stay the same.",
      server:"The writing engine is unreachable. We won't pretend to have generated a new AI draft.",
      RATE_LIMIT:"Generation limit reached (6 per hour, 24 per day). Please try later.",
      CAPTCHA_FAILED:"Your security check expired or failed. Complete it again and retry.",
      NOT_CONFIGURED:"The AI writing service isn't fully configured at the moment.",
      RATE_GATE_UNAVAILABLE:"The request safety service is temporarily unavailable.",
      INVALID_INPUT:"Please review the required fields.",
      MODEL_UNAVAILABLE:"The AI provider couldn't return a valid draft. Please try again.",
      NETWORK_ID_UNAVAILABLE:"The request couldn't be verified safely on this network.",
      copyFailed:"Automatic copy failed; select the letter text and copy it manually.",
      noMissing:"No additional facts were flagged, but verify the details before sending."}
 };
 const msg=(key)=>feedback[ui][key]||key||feedback[ui].server;
 function notify(text,type="error"){
   status.textContent=feedback[ui][text]||text;status.hidden=false;
   status.classList.toggle("success",type==="success");status.scrollIntoView({behavior:"smooth",block:"nearest"});
 }
 function clearNotice(){status.textContent="";status.hidden=true;status.classList.remove("success");}
 function value(name){return String(form.elements.namedItem(name)?.value||"").trim();}
 function focusField(name){const el=form.elements.namedItem(name);el?.focus();el?.scrollIntoView({behavior:"smooth",block:"center"});}
 function verifyStep(number){
   if(number===1 && value("opportunity").length<4){notify("opportunity");focusField("opportunity");return false;}
   if(number===2 && value("about").length<35){notify("about");focusField("about");return false;}
   if(number===3 && value("why").length<18){notify("why");focusField("why");return false;}
   if(number===3&&!$("aiConsent").checked){notify("consent");$("aiConsent").focus();return false;}
   return true;
 }
 function setStep(number){
   if(busy||number<1||number>3)return;
   if(number>step){for(let n=step;n<number;n++)if(!verifyStep(n))return;}
   step=number;clearNotice();
   for(let n=1;n<=3;n++){
     const sec=$("step"+n),btn=document.querySelector('[data-step-button="'+n+'"]');
     sec.hidden=n!==number;
     btn.classList.toggle("active",n===number);
     btn.classList.toggle("done",n<number);
     btn.setAttribute("aria-current",n===number?"step":"false");
   }
   $("workspace").scrollIntoView({behavior:"smooth",block:"start"});
   if(number===3)loadCaptcha();
 }
 for(const btn of document.querySelectorAll("[data-step-button]"))
   btn.addEventListener("click",()=>setStep(Number(btn.dataset.stepButton)));
 for(const btn of document.querySelectorAll("[data-next]"))
   btn.addEventListener("click",()=>setStep(Number(btn.dataset.next)));
 for(const btn of document.querySelectorAll("[data-prev]"))
   btn.addEventListener("click",()=>setStep(Number(btn.dataset.prev)));
 const kinds=document.querySelectorAll("[data-kind]");
 for(const btn of kinds)btn.addEventListener("click",()=>{
   for(const item of kinds){item.classList.toggle("active",item===btn);item.setAttribute("aria-pressed",item===btn?"true":"false");}
   $("kindInput").value=btn.dataset.kind;
   $("otherKindBlock").classList.toggle("is-hidden",btn.dataset.kind!=="other");
   updateQuality();
 });
 function updateQuality(){
   const rules={opportunity:value("opportunity").length>=4,about:value("about").length>=35,
     achievements:value("achievements").length>=18,why:value("why").length>=18,
     fit:value("fit").length>=18,future:value("future").length>=18};
   const score=Math.round(Object.values(rules).filter(Boolean).length/Object.keys(rules).length*100);
   $("qualityValue").textContent=score+"%";$("qualityBar").style.width=score+"%";
   for(const [name,ok]of Object.entries(rules)){
     const item=document.querySelector('[data-check="'+name+'"]');
     if(item){item.classList.toggle("checked",ok);item.querySelector(".check-circle").textContent=ok?"✓":"·";}
   }
   if($("about"))$("about").closest(".field-block")?.querySelector('[data-count="about"]')?.replaceChildren(
     document.createTextNode(value("about").length+" / 2200"));
 }
 form.addEventListener("input",updateQuality);
 updateQuality();
 function switchUI(){
   ui=ui==="ar"?"en":"ar";
   document.documentElement.lang=ui;document.documentElement.dir=ui==="ar"?"rtl":"ltr";
   for(const node of document.querySelectorAll("[data-ar][data-en]")){
     node.textContent=node.dataset[ui];
   }
   $("uiSwitch").textContent=ui==="ar"?"EN / عربي":"عربي / EN";
   $("uiSwitch").setAttribute("aria-label",ui==="ar"?"Switch to English":"التبديل إلى العربية");
   clearNotice();
 }
 $("uiSwitch").addEventListener("click",switchUI);
 function loadCaptcha(){
   if(captchaId!==null||!$("motivation-captcha"))return;
   if(window.turnstile){renderCaptcha();return;}
   if(document.querySelector('script[data-motivation-turnstile]'))return;
   const script=document.createElement("script");
   script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
   script.async=true;script.defer=true;script.dataset.motivationTurnstile="1";
   script.onload=renderCaptcha;
   script.onerror=()=>notify("captcha");
   document.head.appendChild(script);
 }
 function renderCaptcha(){
   if(captchaId!==null||!window.turnstile)return;
   try{captchaId=window.turnstile.render("#motivation-captcha",
     {sitekey:SITE_KEY,theme:"dark",language:"auto",action:"motivation_generate"});}
   catch{captchaId=null;notify("captcha");}
 }
 function captchaToken(){
   try{return captchaId!==null&&window.turnstile?window.turnstile.getResponse(captchaId):"";}catch{return "";}
 }
 function resetCaptcha(){
   try{if(captchaId!==null&&window.turnstile)window.turnstile.reset(captchaId);}catch{}
 }
 function buildPayload(token){
   const keys=["fullName","typeOther","specialty","opportunity","organization","about","achievements","why","fit","future",
    "requirements","challenges","avoid","region"];
   const obj={kind:value("kind"),language:value("language"),tone:value("tone"),length:value("length"),
     variation:variant,aiConsent:$("aiConsent").checked,turnstileToken:token};
   for(const key of keys)obj[key]=value(key);
   return obj;
 }
 function listInto(id,values,fallback){
   const ul=$(id);ul.replaceChildren();
   for(const text of values?.length?values:[fallback]){
     const li=document.createElement("li");li.textContent=String(text);ul.appendChild(li);
   }
 }
 function countWords(){
   const s=output.value.trim();$("wordCount").textContent=(s?s.split(/\s+/u).length:0)+" words";
 }
 output.addEventListener("input",countWords);
 form.addEventListener("submit",async event=>{
   event.preventDefault();
   if(busy)return;
   if(step!==3){setStep(3);return;}
   if(!verifyStep(1)||!verifyStep(2)||!verifyStep(3))return;
   const token=captchaToken();
   if(!token){notify("captcha");loadCaptcha();return;}
   busy=true;const btn=$("generateBtn");
   btn.disabled=true;btn.setAttribute("aria-busy","true");
   notify("loading","success");
   try{
     const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),65000);
     let response;
     try{response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify(buildPayload(token)),signal:abort.signal,cache:"no-store"});}
     finally{clearTimeout(timer);}
     let data={};try{data=await response.json();}catch{}
     if(!response.ok||data.ok!==true||typeof data.letter!=="string")
       throw Error(data.code||"server");
     output.value=data.letter.trim();
     output.dir=value("language")==="ar"?"rtl":"ltr";
     listInto("strengthList",data.notes,ui==="ar"?"راجع التعبير وقوّته مع شخص موثوق.":"Review the writing with someone you trust.");
     listInto("missingList",data.missing,msg("noMissing"));
     countWords();resultPanel.hidden=false;variant=Math.min(variant+1,9);
     clearNotice();resultPanel.scrollIntoView({behavior:"smooth",block:"start"});
   }catch(error){
     const key=String(error?.message||"server");
     notify(feedback[ui][key]?key:"server");
   }finally{busy=false;btn.disabled=false;btn.removeAttribute("aria-busy");resetCaptcha();}
 });
 $("copyBtn").addEventListener("click",async()=>{
   if(!output.value.trim())return;
   try{
     if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(output.value);
     else {output.focus();output.select();if(!document.execCommand("copy"))throw Error("copy");}
     notify("copied","success");
   }catch{notify("copyFailed");}
 });
 $("downloadBtn").addEventListener("click",()=>{
   if(!output.value.trim())return;
   const blob=new Blob([output.value],{type:"text/plain;charset=utf-8"});
   const url=URL.createObjectURL(blob);
   const anchor=document.createElement("a");anchor.href=url;anchor.download="NABD-Motivation-Letter.txt";
   document.body.appendChild(anchor);anchor.click();anchor.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1500);
   notify("save","success");
 });
 $("newVariantBtn").addEventListener("click",()=>{
   setStep(3);loadCaptcha();notify("reroll","success");
   $("motivation-captcha").scrollIntoView({behavior:"smooth",block:"center"});
 });
 window.addEventListener("pagehide",()=>{if(busy)resetCaptcha();});
})();