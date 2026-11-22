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

 // Guidance changes with the *purpose*, not merely with the selected label.
 // Hints offer examples; they are never submitted as applicant achievements.
 const contexts={
  ar:{
   scholarship:["للمنح: أبرز الجدارة الأكاديمية أو المبادرة المثبتة، وصلها بهدف دراسي وأثر اجتماعي واضح.","مثال: منحة بكالوريوس هندسة المعلوماتية","لماذا هذه المنحة وهذا البرنامج تحديدًا؟ كيف ستستخدم ما تتعلمه؟","كيف ستساهم في الجامعة أو مجتمعك بعد الدراسة؟"],
   university:["للقبول الجامعي: اربط اهتمامك الأكاديمي بتجارب ملموسة وما يجعلك مناسبًا للتخصص.","مثال: BSc Computer Science & Artificial Intelligence","لماذا اخترت هذا التخصص وهذه الجامعة؟ أي تجربة أكدت اهتمامك به؟","ما الإسهام الذي ستضيفه للبيئة الأكاديمية؟"],
   job:["للوظائف: ابدأ بالقيمة العملية للجهة، مع موقف يثبت مهارة أو نتيجة.","مثال: Junior Software Engineer","لماذا هذا الدور وهذه الشركة؟ وما التحدي الذي تحب العمل عليه؟","اذكر مهارة عملية ونتيجة فعلية تستطيع تقديمها للفريق."],
   internship:["للتدريب: أظهر مهاراتك الحالية، وما تريد تعلّمه، وكيف ستطبقه في الواقع.","مثال: Software Engineering Summer Internship","ما المهارة التي تريد تطويرها أثناء التدريب ولماذا هنا؟","ما المشروع أو المهارة التي ستساهم بها أثناء التدريب؟"],
   research:["للبحث العلمي: وضّح اهتمامك البحثي وسؤالك أو المشكلة، مع مهارات قابلة للإثبات.","مثال: Undergraduate Research Fellowship","أي سؤال علمي يحفزك، ولماذا مختبر أو فريق البحث هذا؟","كيف ستساهم في جمع البيانات أو التحليل أو العمل البحثي؟"],
   volunteer:["للتطوع: ركّز على خدمة الناس، استمرارية الالتزام، وموقف عملي من تجربتك.","مثال: Community Education Volunteer Program","ما القضية التي ترغب في خدمتها، ولماذا هذا الفريق؟","ماذا تستطيع أن تقدم للمتطوعين والمستفيدين؟"],
   exchange:["للتبادل الدولي: اشرح هدف التعلم المتبادل وما ستنقله بعد العودة.","مثال: International Semester Exchange","ما الذي ستتعلمه في البيئة الجديدة، ولماذا هذا البرنامج؟","ما خبراتك التي ستشاركها مع المشاركين؟"],
   fellowship:["للزمالات: أظهر مبادرة أو قيادة مثبتة، وتصورًا لمشروع قابل للتنفيذ.","مثال: Young Leaders Fellowship","كيف ستسرّع هذه الزمالة مشروعك أو مساهمتك؟","ما الخبرة التي ستضيفها لزملائك وما الذي ستنفذه بعد البرنامج؟"],
   other:["للفرص الأخرى: حدّد الهدف والجمهور وسبب الملاءمة، مع دليل حقيقي.","مثال: برنامج ريادة الأعمال الشبابية","ما الذي يميز هذه الفرصة عن غيرها بالنسبة لك؟","ما المهارة أو الأثر الذي تقدمه لهذه الجهة؟"]
  },
  en:{
   scholarship:["For scholarships: connect proven academic initiative with a specific study goal and realistic community impact.","e.g. International Informatics Engineering Scholarship","Why this exact scholarship and course? What would you learn and build?","How could you contribute to the campus or community?"],
   university:["For admission: connect your academic curiosity with a real project or formative learning experience.","e.g. BSc Computer Science & AI","Why this course and institution? What experience confirmed your interest?","How would you contribute to campus learning?"],
   job:["For jobs: focus on practical employer value backed by evidence, not generic enthusiasm.","e.g. Junior Software Engineer","Why this company and role? What problem would you enjoy solving?","Name a skill and proven outcome you could bring to the team."],
   internship:["For internships: show what you can do now, what you hope to learn, and where you will apply it.","e.g. Software Engineering Summer Internship","What specific skill would you learn in this placement?","What could you contribute during the internship?"],
   research:["For research: state a real scientific question, relevant skills and an achievable contribution.","e.g. Undergraduate Research Fellowship","What research question motivates you, and why this group?","What analysis or fieldwork skills could you offer?"],
   volunteer:["For volunteering: prioritize service, reliability and first-hand evidence of commitment.","e.g. Community Education Volunteer","Which cause matters to you, and why this organization?","How would you support other volunteers and beneficiaries?"],
   exchange:["For exchanges: describe two-way learning and how you would share outcomes afterwards.","e.g. International Semester Exchange","Why would learning in this environment matter?","What perspectives would you bring to participants?"],
   fellowship:["For fellowships: highlight a demonstrated initiative and a feasible leadership project.","e.g. Young Leaders Fellowship","How would the fellowship advance your work?","What could peers learn from you, and what would you implement afterwards?"],
   other:["For other opportunities: clarify purpose, audience, concrete suitability and evidence.","e.g. Youth Entrepreneurship Program","What distinguishes this particular opportunity for you?","What value would you provide to the organization?"]
  }
 };
 function updateContext(){
  const kind=value("kind")||"scholarship";
  const detail=contexts[ui][kind]||contexts[ui].other;
  $("kindContext").textContent=detail[0];
  for(const [id,txt] of [["opportunity",detail[1]],["why",detail[2]],["fit",detail[3]]])
   $(id).placeholder=txt;
 }
 const advice={
  ar:{opportunity:"ابدأ بتحديد اسم الفرصة؛ رسالة غير موجهة لجهة واضحة أضعف.",
   about:"احكِ عن تجربة أو اهتمام شكّل اتجاهك، ولو في كلمات بسيطة.",
   achievements:"أضف مثالًا واحدًا صحيحًا يوضح ما فعلته أو تعلمته.",
   why:"اربط الفرصة بسبب دقيق بدل الاكتفاء بأنها فرصة عظيمة.",
   fit:"اشرح ماذا تستطيع أن تقدم للجهة، لا ماذا ستأخذ منها فقط.",
   future:"اختم بهدف واقعي تود تحقيقه بعد هذه الفرصة.",
   ready:"العناصر الأساسية موجودة. مؤشر الاكتمال ليس درجة قبول أو ضمانًا لجودة الرسالة."},
  en:{opportunity:"Start with a named opportunity; a generic letter is less focused.",
   about:"Share a real experience or interest that shaped your direction.",
   achievements:"Add one true, specific example of something you did or learned.",
   why:"Explain your particular motivation rather than generic praise.",
   fit:"Show what you would contribute, not only what you hope to receive.",
   future:"Conclude with a realistic next step or intended impact.",
   ready:"The core details are here. Completeness is not an admission score or guarantee."}
 };
 function updateAdvice(rules){
  const first=Object.keys(rules).find(key=>!rules[key])||"ready";
  $("qualityAdvice").textContent=advice[ui][first];
 }

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
   updateContext();
   updateQuality();
 });
 function updateQuality(){
   const rules={opportunity:value("opportunity").length>=4,about:value("about").length>=35,
     achievements:value("achievements").length>=18,why:value("why").length>=18,
     fit:value("fit").length>=18,future:value("future").length>=18};
   const score=Math.round(Object.values(rules).filter(Boolean).length/Object.keys(rules).length*100);
   $("qualityValue").textContent=score+"%";$("qualityBar").style.width=score+"%";
   updateAdvice(rules);
   for(const [name,ok]of Object.entries(rules)){
     const item=document.querySelector('[data-check="'+name+'"]');
     if(item){item.classList.toggle("checked",ok);item.querySelector(".check-circle").textContent=ok?"✓":"·";}
   }
   if($("about"))$("about").closest(".field-block")?.querySelector('[data-count="about"]')?.replaceChildren(
     document.createTextNode(value("about").length+" / 2200"));
 }
 form.addEventListener("input",updateQuality);
 updateContext();
 updateQuality();
 function switchUI(){
   ui=ui==="ar"?"en":"ar";
   document.documentElement.lang=ui;document.documentElement.dir=ui==="ar"?"rtl":"ltr";
   for(const node of document.querySelectorAll("[data-ar][data-en]")){
     node.textContent=node.dataset[ui];
   }
   $("uiSwitch").textContent=ui==="ar"?"EN / عربي":"عربي / EN";
   $("uiSwitch").setAttribute("aria-label",ui==="ar"?"Switch to English":"التبديل إلى العربية");
   updateContext();updateQuality();
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
     countWords();resultPanel.hidden=false;
     // All 9 writing strategies remain available; never get stuck on seed 9.
     // Choose a different next seed so consecutive requests have distinct guidance.
     const random=new Uint32Array(1);
     if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(random);
     const jump=1+(random[0]%8);
     variant=((variant-1+jump)%9)+1;
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