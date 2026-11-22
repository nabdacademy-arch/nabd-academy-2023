/* NABD Motivation Studio — Phase 1 · public, consent-led AI writing.
 * Personal application details remain in memory unless the applicant explicitly
 * presses Generate; responses are not placed in localStorage or analytics.
 * The server must enforce Turnstile, daily/minute quota, no fabricated facts.
 */
(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const base="https://zsmmmljgguycrvyrmakl.supabase.co";
 const functionUrl=base+"/functions/v1/nabd-motivation-studio";
 const publicKey=window.NABD_CONFIG?.supabaseAnonKey||"";
 const turnstileSiteKey="0x4AAAAAAFW8jGnVSDWdHdLz";
 const state={step:1,kind:"scholarship",tone:"authentic",length:"standard",variation:0,drafts:0,busy:false,widget:null,captchaLoading:false};
 const kindLabels={scholarship:"المنحة الدراسية",university:"القبول الجامعي",job:"الوظيفة",internship:"التدريب",research:"الفرصة البحثية",volunteer:"فرصة التطوع",exchange:"برنامج التبادل",fellowship:"الزمالة",other:"الفرصة"};
 const selectFields=["opportunity","organization","region","fullName","about","achievements","why","fit","future","challenges","requirements","avoid","typeOther"];
 const hints={
 scholarship:{opportunity:"مثال: منحة البكالوريوس الدولية",why:"لماذا هذه المنحة تحديدًا؟ كيف يخدم البرنامج مستقبلك العلمي والمجتمع؟",fit:"كيف ستستفيد الجهة أو المجتمع من دراستك وخبراتك؟"},
 university:{opportunity:"مثال: بكالوريوس علوم الحاسوب والذكاء الاصطناعي",why:"لماذا اخترت هذه الجامعة وهذا البرنامج؟",fit:"ماذا ستضيف للحياة الأكاديمية ولمشاريع الجامعة؟"},
 job:{opportunity:"مثال: Junior Software Developer — اسم الوظيفة",why:"لماذا هذه الوظيفة وهذه الشركة بالذات؟",fit:"ما القيمة العملية التي ستقدمها للفريق؟ ادعمها بمثال محدد."},
 internship:{opportunity:"مثال: برنامج تدريب تقني صيفي",why:"ما الذي تريد تعلمه من هذا التدريب ولماذا اخترت هذه الجهة؟",fit:"ما المهارات التي ستطبقها أثناء التدريب؟"},
 research:{opportunity:"مثال: Research Assistant / Research Grant",why:"ما السؤال البحثي أو المشكلة التي تريد المساهمة في حلها؟",fit:"ما منهجك أو مهاراتك البحثية ذات الصلة؟"},
 volunteer:{opportunity:"مثال: برنامج قيادة المتطوعين",why:"ما القضية التي تهمك ولماذا تريد المساهمة فيها؟",fit:"اذكر تجربة تطوعية أو ما تستطيع تقديمه فعلًا."},
 exchange:{opportunity:"مثال: برنامج التبادل الأكاديمي",why:"لماذا اخترت هذا التبادل وأين يضيف لمسارك؟",fit:"كيف ستنقل الخبرات بين مجتمعك والبرنامج؟"},
 fellowship:{opportunity:"مثال: International Leadership Fellowship",why:"كيف تتصل الزمالة بمسارك وأثر عملك؟",fit:"ما المشروع أو الأثر الذي يمكن أن تضيفه؟"},
 other:{opportunity:"اسم الفرصة أو البرنامج",why:"لماذا تريد هذه الفرصة بالذات؟",fit:"ما الذي ستقدمه لهذه الفرصة؟"}
 };
 function showMessage(message,type=""){
  const node=$("formStatus");
  node.textContent=message;node.hidden=false;
  node.className="status-message"+(type?" "+type:"");
  if(type==="error")node.scrollIntoView({behavior:"smooth",block:"nearest"});
 }
 function clearMessage(){const n=$("formStatus");n.hidden=true;n.textContent="";}
 function value(id){return String($(id)?.value||"").trim();}
 function setKind(kind){
  if(!Object.hasOwn(kindLabels,kind))return;
  state.kind=kind;
  document.querySelectorAll("[data-kind]").forEach(btn=>{
    const yes=btn.dataset.kind===kind;
    btn.classList.toggle("selected",yes);btn.setAttribute("aria-pressed",String(yes));
  });
  $("typeOtherWrap").hidden=kind!=="other";
  for(const [id,placeholder] of Object.entries(hints[kind])){
    $(id).placeholder=placeholder;
  }
  refreshReview();
 }
 function selectedButton(group,attr,v){
  for(const btn of $(group).querySelectorAll("button")){
   const active=btn.dataset[attr]===v;
   btn.classList.toggle("active",active);btn.setAttribute("aria-pressed",String(active));
  }
 }
 function countCharacters(id){
  const t=$(id),n=document.querySelector('[data-count="'+id+'"]');
  if(!t||!n)return;
  n.textContent=t.value.length+" / "+t.maxLength;
 }
 function validateStep1(focus=true){
  if(value("opportunity").length<4){if(focus){showMessage("اكتب الاسم الحقيقي للفرصة (أربع حروف على الأقل).","error");$("opportunity").focus();}return false;}
  if(state.kind==="other"&&value("typeOther").length<3){if(focus){showMessage("حدد نوع الفرصة الأخرى حتى نفهم غرض رسالتك.","error");$("typeOther").focus();}return false;}
  if($("specialty").value==="custom"&&value("specialtyOther").length<2){if(focus){showMessage("اكتب اسم تخصصك في الخانة المخصصة.","error");$("specialtyOther").focus();}return false;}
  return true;
 }
 function validateStep2(focus=true){
  if(value("about").length<35){if(focus){showMessage("احكِ عن نفسك بجملة أو أكثر (35 حرفًا على الأقل) حتى لا تكون الرسالة عامة.","error");$("about").focus();}return false;}
  if(value("why").length<18){if(focus){showMessage("وضّح لماذا اخترت هذه الفرصة (18 حرفًا على الأقل).","error");$("why").focus();}return false;}
  return true;
 }
 function showStep(step){
  state.step=step;
  for(let i=1;i<=3;i++){
   $("step"+i).hidden=i!==step;
   const b=document.querySelector('[data-goto="'+i+'"]');
   b.classList.toggle("active",i===step);
   b.classList.toggle("completed",i<step);
   if(i===step)b.setAttribute("aria-current","step");else b.removeAttribute("aria-current");
  }
  $("progressLabel").textContent=String(step).padStart(2,"0")+" / 03";
  $("backBtn").hidden=step===1;
  $("nextBtn").hidden=step===3;
  $("generateBtn").hidden=step!==3;
  $("stepHint").textContent=step===1?"اختر الفرصة التي تستهدفها":
   step===2?"شارك تجربتك، ولا تختلق شيئًا": "راجع حقائقك ووافق على استخدام الذكاء الاصطناعي";
  clearMessage();
  if(step===3){refreshReview();initCaptcha();}
  const top=document.querySelector(".builder");
  if(top)top.scrollIntoView({behavior:"smooth",block:"start"});
 }
 function next(){
  if(state.step===1&&!validateStep1())return;
  if(state.step===2&&!validateStep2())return;
  if(state.step<3)showStep(state.step+1);
 }
 function review(){
  const issues=[];
  if(!value("opportunity"))issues.push("اسم الفرصة غير مكتمل");
  if(state.kind==="other"&&!value("typeOther"))issues.push("نوع الفرصة غير محدد");
  if(!value("about")||value("about").length<35)issues.push("نبذة شخصية أعمق عن نفسك");
  if(!value("why")||value("why").length<18)issues.push("سبب مباشر وواضح لاختيار هذه الفرصة");
  if(!value("achievements"))issues.push("إنجاز أو تجربة واحدة على الأقل تستطيع إثباتها");
  if(!value("fit"))issues.push("قيمة محددة تستطيع إضافتها للجهة المستهدفة");
  if(!value("future"))issues.push("هدف واقعي بعد الفرصة");
  if(!value("organization"))issues.push("اسم الجهة المستهدفة؛ لا نخمنه نيابةً عنك");
  if(!value("requirements"))issues.push("متطلبات الجهة الرسمية، إن كانت منشورة");
  return issues;
 }
 function refreshReview(){
  const list=$("reviewList"),issues=review();
  list.replaceChildren();
  if(issues.length===0){
   $("reviewMessage").textContent="ممتاز! لديك قصة وهدف وأمثلة ووجهة واضحة. راجع صحتها قبل الإنشاء.";
  }else{
   $("reviewMessage").textContent="هذه نقاط قد تقوي الخطاب؛ المطلوب فعليًا هو معلومات الفرصة والنبذة والسبب. لن نخترع المعلومات الناقصة:";
   issues.slice(0,6).forEach(txt=>{const li=document.createElement("li");li.textContent=txt;list.appendChild(li);});
  }
 }
 function openingStyleInstruction(){
  const choice=$("variationStyle").value;
  return {
   story:"Prefer an authentic experience-led opening only when one is actually supplied; otherwise choose a fresh grounded opening.",
   impact:"Prefer a specific proven achievement or practical impact in the opening; if none is supplied, avoid inventing one.",
   vision:"Prefer an opening connecting a concrete, stated objective with the opportunity.",
   natural:"Choose a fresh, context-appropriate introduction and vary it across drafts."
  }[choice]||"";
 }
 function buildPayload(token){
  const data={};
  for(const id of selectFields)data[id]=value(id);
  data.specialty=$("specialty").value==="custom"?value("specialtyOther"):$("specialty").value;
  // The backend uses requirements and avoid as user preferences, never as verified facts.
  const instruction=openingStyleInstruction();
  data.avoid=[data.avoid,instruction].filter(Boolean).join("\n").slice(0,1800);
  data.kind=state.kind;
  data.tone=state.tone;
  data.length=state.length;
  data.language=$("letterLanguage").value;
  data.variation=(state.variation%9)+1;
  data.turnstileToken=token;
  data.aiConsent=$("aiConsent").checked;
  return data;
 }
 function setBusy(busy){
  state.busy=busy;
  $("generateBtn").disabled=busy;
  $("regenerateBtn").disabled=busy;
  $("generateBtn").textContent=busy?"جارٍ صياغة الرسالة بعناية…":"✧ أنشئ رسالة الدافع";
  $("regenerateBtn").textContent=busy?"جارٍ العمل…":"✧ نسخة مختلفة";
 }
 function resetCaptcha(){
  if(state.widget!==null&&window.turnstile){
   try{window.turnstile.reset(state.widget);}catch(_){}
  }
 }
 async function initCaptcha(){
  if(state.widget!==null||state.captchaLoading)return;
  state.captchaLoading=true;
  const status=$("captchaStatus");
  status.textContent="جارٍ تحميل التحقق الأمني…";
  try{
   if(!window.turnstile){
    await new Promise((resolve,reject)=>{
     const s=document.createElement("script");
     s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
     s.async=true;s.defer=true;
     s.onload=resolve;s.onerror=()=>reject(Error("TURNSTILE_NETWORK"));
     document.head.appendChild(s);
    });
   }
   if(!window.turnstile)throw Error("TURNSTILE_NOT_READY");
   state.widget=window.turnstile.render("#captcha",{
    sitekey:turnstileSiteKey,theme:"dark",language:"ar",action:"motivation_generate",
    "error-callback":()=>{status.textContent="تعذر إكمال التحقق الأمني. تحقق من الاتصال أو أعد فتح الصفحة.";},
    "expired-callback":()=>{status.textContent="انتهت صلاحية التحقق. أعد التحقق قبل الإنشاء.";},
    callback:()=>{status.textContent="تم التحقق بنجاح. يمكنك إنشاء الرسالة.";}
   });
   status.textContent="أكمل التحقق الأمني قبل الإنشاء.";
  }catch(e){
   status.textContent="لا يمكن تحميل التحقق حاليًا. قد يكون السبب انقطاع الاتصال أو حجب Cloudflare؛ أعد المحاولة بعد تحسين الشبكة.";
   console.warn("motivation_captcha_unavailable",{kind:e?.message==="TURNSTILE_NETWORK"?"network":"render"});
  }finally{state.captchaLoading=false;}
 }
 function translateError(code,http){
  return {
   INVALID_INPUT:"البيانات غير مكتملة أو تجاوزت الحد المسموح. راجع الحقول والمحاولة.",
   TOO_LARGE:"النصوص طويلة أكثر من الحد المسموح. اختصر بعض التفاصيل.",
   CAPTCHA_FAILED:"تعذر التحقق الأمني؛ أعد إكمال التحقق ثم حاول.",
   NETWORK_ID_UNAVAILABLE:"لم تتمكن الخدمة من إتمام حماية الاستخدام. حاول من اتصال مختلف.",
   RATE_LIMIT:"بلغت حد المحاولات المؤقت لحماية مجانية الخدمة. جرّب لاحقًا.",
   RATE_GATE_UNAVAILABLE:"نظام حماية الحصة غير متاح حاليًا.",
   NOT_CONFIGURED:"خدمة التوليد لم تُفعّل جميع متطلباتها في الخادم بعد.",
   MODEL_UNAVAILABLE:"نموذج الذكاء الاصطناعي غير متاح حاليًا. يمكنك إعادة المحاولة لاحقًا.",
   ORIGIN_FORBIDDEN:"هذا الرابط لا يقبل الطلبات من مصدر خارجي.",
   METHOD_NOT_ALLOWED:"طريقة الطلب غير مسموحة.",
   INVALID_JSON:"تعذر تفسير بيانات الرسالة.",
   AUTH_REQUIRED:"الخدمة تتطلب التحقق من الصلاحية."
  }[code]||("تعذرت صياغة الرسالة الآن (رمز "+String(code||http)+"). لم نفقد النصوص التي أدخلتها.");
 }
 async function submit(e){
  if(e)e.preventDefault();
  if(state.busy)return;
  if(!validateStep1()||!validateStep2()){showMessage("راجع البيانات المطلوبة في المرحلتين الأولى والثانية ثم حاول من جديد.","error");return;}
  if(!$("aiConsent").checked){showMessage("يلزم موافقتك الصريحة قبل إرسال أي نص شخصي لمزود الذكاء الاصطناعي.","error");$("aiConsent").focus();return;}
  if(!window.turnstile||state.widget===null){showMessage("أكمل تحميل التحقق الأمني أولًا؛ لا يمكن توليد النص بدونه.","error");initCaptcha();return;}
  const token=window.turnstile.getResponse(state.widget);
  if(!token){showMessage("أكمل التحقق الأمني الظاهر أمامك قبل الإنشاء.","error");return;}
  const payload=buildPayload(token);
  setBusy(true);clearMessage();
  showMessage("نحلل تجربة المتقدم ونبني رسالة شخصية. قد يستغرق الطلب قليلًا بحسب الاتصال.");
  const abort=new AbortController();
  const timeout=setTimeout(()=>abort.abort(),50000);
  try{
   const result=await fetch(functionUrl,{
    method:"POST",mode:"cors",credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",
    headers:{"Content-Type":"application/json",...(publicKey?{"apikey":publicKey}:{})},
    body:JSON.stringify(payload),signal:abort.signal
   });
   let body={};
   try{body=await result.json();}catch(_){}
   if(!result.ok||body.ok!==true){
    showMessage(translateError(body.code,result.status),"error");
    return;
   }
   if(typeof body.letter!=="string"||body.letter.length<180||body.letter.length>12000)
    throw Error("BAD_RESPONSE");
   state.variation=payload.variation;
   state.drafts+=1;
   renderLetter(body);
   showMessage("تمت صياغة الرسالة بنجاح. يمكنك تحريرها أو نسخها أو إنشاء نسخة أخرى.","success");
  }catch(error){
   showMessage(error?.name==="AbortError"?"انتهت مهلة الطلب، ربما بسبب ضعف الإنترنت. لن نمسح ما كتبته. أعد المحاولة حين يستقر الاتصال.":"تعذر الاتصال بخدمة الكتابة الآن. النصوص في النموذج ما زالت موجودة ويمكنك المحاولة مجددًا.","error");
  }finally{
   clearTimeout(timeout);resetCaptcha();setBusy(false);
  }
 }
 function renderLetter(result){
  $("resultEmpty").hidden=true;
  $("resultReady").hidden=false;
  $("draftNumber").textContent=String(state.drafts).padStart(2,"0");
  $("letterOutput").value=result.letter;
  const language=$("letterLanguage").value;
  $("letterOutput").dir=language==="ar"?"rtl":"ltr";
  $("letterOutput").lang=language;
  updateWordCount();
  renderBullets("notesList",result.notes||[],"لا توجد ملاحظات إضافية حاليًا.");
  renderBullets("missingList",result.missing||[],"لا توجد معلومات ناقصة محددة؛ راجع الحقائق وأسماء الجهات بنفسك.");
  $("resultTitle").textContent="مسودة رسالتك جاهزة";
  document.querySelector(".result").scrollIntoView({behavior:"smooth",block:"start"});
 }
 function renderBullets(id,values,empty){
  const node=$(id);node.replaceChildren();
  const list=Array.isArray(values)?values.filter(x=>typeof x==="string"&&x.trim()).slice(0,5):[];
  for(const item of (list.length?list:[empty])){
   const li=document.createElement("li");li.textContent=item;node.appendChild(li);
  }
 }
 function updateWordCount(){
  const txt=value("letterOutput");
  $("wordCount").textContent=(txt?txt.split(/\s+/u).length:0)+" كلمة";
 }
 async function copyLetter(){
  const text=value("letterOutput");if(!text)return;
  try{
   if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
   else{
    const field=$("letterOutput");field.focus();field.select();
    if(!document.execCommand("copy"))throw Error("COPY_FAILED");
   }
   showMessage("تم نسخ النص. راجعه ثم أرسله للجهة المناسبة.","success");
  }catch{showMessage("تعذر النسخ تلقائيًا. حدد النص من مربع الرسالة وانسخه يدويًا.","error");}
 }
 function downloadLetter(){
  const text=value("letterOutput");if(!text)return;
  const url=URL.createObjectURL(new Blob(["\ufeff",text],{type:"text/plain;charset=utf-8"}));
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download="NABD_Motivation_"+state.kind+"_"+$("letterLanguage").value+".txt";
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function printLetter(){
  if(!value("letterOutput"))return;
  const field=$("letterOutput"),original=field.style.height;
  field.style.height=Math.max(field.scrollHeight,450)+"px";
  window.print();
  setTimeout(()=>{field.style.height=original;},1200);
 }
 document.querySelectorAll("[data-kind]").forEach(btn=>btn.addEventListener("click",()=>setKind(btn.dataset.kind)));
 document.querySelectorAll("[data-tone]").forEach(btn=>btn.addEventListener("click",()=>{state.tone=btn.dataset.tone;selectedButton("toneGroup","tone",state.tone);}));
 document.querySelectorAll("[data-length]").forEach(btn=>btn.addEventListener("click",()=>{state.length=btn.dataset.length;selectedButton("lengthGroup","length",state.length);}));
 document.querySelectorAll("[data-goto]").forEach(btn=>btn.addEventListener("click",()=>{
  const target=Number(btn.dataset.goto);
  if(target>state.step){
   if(state.step===1&&!validateStep1())return;
   if(state.step===2&&!validateStep2())return;
   if(target===3&&(!validateStep1()||!validateStep2()))return;
  }
  showStep(target);
 }));
 $("nextBtn").addEventListener("click",next);
 $("backBtn").addEventListener("click",()=>{if(state.step>1)showStep(state.step-1);});
 $("specialty").addEventListener("change",()=>{$("specialtyOtherWrap").hidden=$("specialty").value!=="custom";});
 for(const id of selectFields){
  $(id).addEventListener("input",()=>{countCharacters(id);if(state.step===3)refreshReview();});
 }
 $("studioForm").addEventListener("submit",submit);
 $("regenerateBtn").addEventListener("click",()=>{if(state.step!==3)showStep(3);submit();});
 $("copyBtn").addEventListener("click",copyLetter);
 $("downloadBtn").addEventListener("click",downloadLetter);
 $("printBtn").addEventListener("click",printLetter);
 $("letterOutput").addEventListener("input",updateWordCount);
 // Avoid auto-saving private application narratives or letters in browser storage.
 setKind("scholarship");
 for(const id of selectFields)countCharacters(id);
 showStep(1);
})();
