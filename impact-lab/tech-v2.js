/* NABD World Impact V2 · progressive enhancement for six existing pilot modules. */
(function(){
"use strict";
const core=globalThis.NABDImpactCore;
if(!core)return;
const $=id=>document.getElementById(id);
const text=(ar,en)=>document.documentElement.lang==="en"?en:ar;
const nodes=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
const create=(tag,txt,cl)=>{
 const n=document.createElement(tag);if(cl)n.className=cl;
 if(txt!==undefined)n.textContent=String(txt);return n;
};
const set=(el,ar,en)=>{el.dataset.ar=ar;el.dataset.en=en;el.textContent=text(ar,en);return el};
const update=()=>{
 for(const el of nodes(".v2-suite [data-ar][data-en]"))el.textContent=el.dataset[document.documentElement.lang==="en"?"en":"ar"];
 set($("impact-status"),navigator.onLine?"المتصفح متصل بالشبكة":"المتصفح غير متصل بالشبكة",
  navigator.onLine?"Browser online":"Browser offline");
};
function output(parent,title,description,rows){
 parent.replaceChildren();parent.hidden=false;
 parent.append(create("h4",title),create("p",description));
 for(const [label,value] of rows){
  const p=create("p");p.append(create("strong",label+": "),create("span",value));parent.append(p);
 }
}
function errorMessage(el,ar,en,kind=""){el.textContent=text(ar,en);el.dataset.kind=kind;}
function button(id,ar,en){const b=set(create("button"),ar,en);b.type="button";b.id=id;b.className="button outline";return b}
function labelInput(id,ar,en,kind="text"){
 const wrap=create("label");wrap.className="v2-label";wrap.append(set(create("span"),ar,en));
 const input=create(kind==="select"?"select":"input");input.id=id;if(kind!=="select")input.type=kind;wrap.append(input);
 return {wrap,input};
}
function section(module,ar,en,descAr,descEn){
 const sec=create("section");sec.className="v2-suite";sec.dataset.feature=module;
 sec.append(set(create("h4"),ar,en),set(create("p"),descAr,descEn));
 $("panel-"+module).append(sec);return sec;
}
const exportText=(filename,value,type="text/plain;charset=utf-8")=>{
 const blob=new Blob([value],{type}),url=URL.createObjectURL(blob),a=create("a");
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),12000);
};
function buildStatus(){
 const row=create("div");row.className="v2-status-strip";
 const status=create("span");status.id="impact-status";status.setAttribute("role","status");
 const cryptoBadge=set(create("span"),globalThis.crypto?.subtle?"تشفير WebCrypto متاح":"تشفير WebCrypto غير متاح",
   globalThis.crypto?.subtle?"WebCrypto supported":"WebCrypto unavailable");
 const badge=set(create("span"),"NABD IMPACT · V2","NABD IMPACT · V2");
 row.append(badge,status,cryptoBadge);
 const el=$("workspace");el.parentNode.insertBefore(row,el); // one global status bar
 window.addEventListener("online",update);window.addEventListener("offline",update);
 $("language")?.addEventListener("click",()=>setTimeout(update,0));
}
/* 01: reproducible safety benchmark prompts + local pattern scanner */
function installAI(){
 const sec=section("ai","اختبارات الإجهاد · OWASP 2026","2026 stress-test bench",
  "اختر سيناريو دفاعيًا، انسخه إلى نموذج التقييم ثم حلّل الإجابة محليًا. هذه إشارات لغوية فقط، وليست قياسًا للدقة الطبية.",
  "Select a defensive test scenario, send it to the review form, then inspect answer text locally. Pattern flags do not measure medical correctness.");
 const selector=labelInput("v2-test","اختر سيناريو التقييم","Choose test scenario","select");
 for(const item of core.AI_TESTS){const opt=create("option",text(item.ar,item.en));opt.value=item.id;opt.dataset.ar=item.ar;opt.dataset.en=item.en;selector.input.append(opt)}
 const load=button("v2-test-load","حمّل سؤال الاختبار","Load test prompt");
 const scan=button("v2-ai-scan","حلّل مؤشرات الإجابة","Scan response flags");
 const hint=set(create("p"),"لا تنسخ سجلات مرضى أو بيانات حساسة في هذه الأداة.","Never paste identifiable patient records or confidential content here.");
 hint.className="v2-hint";
 const result=create("div");result.id="v2-ai-results";result.className="v2-readout";result.hidden=true;
 const actions=create("div");actions.className="v2-actions";actions.append(load,scan);
 sec.append(selector.wrap,actions,hint,result);
 load.addEventListener("click",()=>{
  const scenario=core.AI_TESTS.find(x=>x.id===selector.input.value);if(!scenario)return;
  $("ai-prompt").value=scenario.prompt;
  $("ai-prompt").focus();
  output(result,text("سؤال دفاعي جاهز","Defensive test prompt ready"),text("أرسل السؤال إلى النظام الذي تقيّمه ثم ألصق إجابته في نموذج التقييم.","Run this prompt in the system you are evaluating, then paste its response in the existing review form."),[[text("نوع السيناريو","Scenario"),text(scenario.ar,scenario.en)]]);
 });
 scan.addEventListener("click",()=>{
  const answer=$("ai-response").value.trim();
  if(!answer){output(result,text("لا توجد إجابة","No response"),text("ألصق إجابة نظام الذكاء الاصطناعي أولًا.","Paste the AI system response first."),[]);return}
  const report=core.analyzeAI(answer);
  const flags=report.flags.map(x=>text(x.ar,x.en)+" ["+x.level+"]");
  output(result,text("مؤشرات تحتاج مراجعة","Signals for reviewer attention"),
   text("النتيجة تحليل أنماط لغوية بسيط؛ لا تثبت سلامة الإجابة أو عدم صحتها.","Only local heuristic pattern checks; results cannot verify the answer."),[
   [text("عدد الكلمات","Word count"),String(report.wordCount)],
   [text("الإشارات","Flags"),flags.length?flags.join(" · "):text("لا إشارات في القواعد المحدودة","None in the limited rule set")]
  ]);
 });
}
/* 02: opt-in Crossref DOI metadata lookup, never sends private form fields */
function installTruth(){
 const sec=section("truth","تحقق مرجعي عبر DOI","DOI bibliographic lookup",
  "أدخل رقم DOI لمصدر علمي. عند الضغط فقط، يُرسل رقم DOI وحده إلى Crossref لجلب بياناته الببليوغرافية العامة. وجود البحث في Crossref لا يثبت صحة الادعاء.",
  "Enter a scholarly DOI. Only when you click will the DOI alone be sent to Crossref for public bibliographic metadata. An indexed paper does not validate a medical claim.");
 const field=labelInput("v2-doi","DOI أو رابط doi.org","DOI or doi.org URL");
 field.input.placeholder="10.1000/xyz123";field.input.maxLength=245;
 const btn=button("v2-doi-lookup","ابحث عن بيانات المصدر","Fetch source metadata");
 const result=create("div");result.id="v2-doi-result";result.className="v2-readout";result.setAttribute("role","status");result.hidden=true;
 sec.append(field.wrap,btn,result);
 btn.addEventListener("click",async()=>{
  const doi=core.parseDOI(field.input.value);
  if(!doi){output(result,text("صيغة DOI غير صحيحة","Invalid DOI"),
   text("أدخل DOI صحيحًا أو رابطًا أصليًا من doi.org.","Enter a valid DOI or canonical doi.org URL."),[]);return}
  const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),10000);
  btn.disabled=true;
  output(result,text("جارٍ الاستعلام","Looking up source"),text("تُرسل قيمة DOI فقط إلى Crossref بموافقتك.","Only the DOI is sent to Crossref at your request."),[]);
  try{
   const response=await fetch("https://api.crossref.org/works/"+encodeURIComponent(doi),{method:"GET",signal:ctrl.signal,headers:{Accept:"application/json"},referrerPolicy:"no-referrer"});
   if(!response.ok)throw Error("HTTP "+response.status);
   const info=(await response.json())?.message;
   if(!info||typeof info!=="object")throw Error("BAD_RESPONSE");
   const title=String(info.title?.[0]||"—").slice(0,400),journal=String(info["container-title"]?.[0]||"—").slice(0,160);
   const year=String(info.published?.["date-parts"]?.[0]?.[0]||info.issued?.["date-parts"]?.[0]?.[0]||"—");
   output(result,text("تم العثور على السجل الببليوغرافي","Bibliographic record found"),text("بيانات فهرسة فقط؛ لا تحكم على صحة الدراسة أو الادعاء.","Metadata only; not verification of the study or medical claim."),[
    ["DOI",doi],[text("العنوان","Title"),title],[text("الدورية","Journal"),journal],[text("سنة النشر","Year"),year],
    [text("الناشر","Publisher"),String(info.publisher||"—").slice(0,130)]
   ]);
   const a=create("a","https://doi.org/"+doi);a.href="https://doi.org/"+encodeURIComponent(doi);a.rel="noopener noreferrer";a.target="_blank";
   result.append(a);
  }catch(e){output(result,text("تعذر الاستعلام","Lookup unavailable"),
   text("قد يكون DOI غير مفهرس، أو الخدمة غير متاحة، أو الشبكة مقطوعة. لا تتغير حالة بطاقة الادعاء.","The DOI may be unindexed or the public API/network unavailable. Your claim card is unchanged."),[])}
  finally{clearTimeout(timeout);btn.disabled=false}
 });
}
/* 03: encrypted archive inspection without receiving or retaining any secret */
function installVault(){
 const sec=section("vault","التحقق البنيوي من الخزنة","Encrypted vault integrity preflight",
  "افحص ترويسة ملف nabdvault محليًا قبل محاولة فتحه. التحقق البنيوي لا يؤكد كلمة المرور أو سلامة المحتوى؛ فك التشفير بوسم AES-GCM هو الاختبار الحاسم.",
  "Inspect .nabdvault metadata locally before recovery. Structural checks cannot prove content integrity; authenticated decryption with the correct password is required.");
 const btn=button("v2-vault-inspect","افحص الملف المشفر المختار","Inspect selected encrypted file");
 const result=create("div");result.id="v2-vault-readout";result.className="v2-readout";result.hidden=true;
 sec.append(btn,result);
 btn.addEventListener("click",async()=>{
  const file=$("vault-archive").files?.[0];
  if(!file){output(result,text("لم تحدد ملفًا","No file selected"),text("اختر ملف .nabdvault في نموذج فك التشفير أعلاه.","Select a .nabdvault file in the decrypt form above."),[]);return}
  try{
   if(file.size>12*1024*1024)throw Error("TOO_BIG");
   const archive=JSON.parse(await file.text()),meta=core.safeArchiveMetadata(archive);
   if(!meta)throw Error("INVALID");
   output(result,text("الملف المشفر مطابق لبنية V1","V1 encrypted archive structure recognized"),
    text("هذا فحص هيكلي، وليس شهادة أصالة أو نسخة احتياطية معتمدة.","This is a structural preflight, not an authenticity certificate or managed backup."),[
     [text("اسم الملف","Filename"),meta.name],[text("الحجم الأصلي","Original size"),String(meta.bytes)+" bytes"],
     [text("الخوارزمية","Algorithm"),meta.algorithm],
     [text("تقوية كلمة المرور","Key derivation"),meta.kdf+" · "+meta.iterations+" iterations"]
    ]);
  }catch(e){output(result,text("ملف غير صالح","Invalid archive"),
   text("تعذر قراءة حاوية NABD_VAULT_V1. لا تحاول فتح ملفات غير موثوقة.","This is not a structurally valid NABD_VAULT_V1 container. Avoid untrusted files."),[])}
 });
}
/* 04: editable learning-priority matrix; all ratings chosen by reviewer */
function installBlackbox(){
 const sec=section("blackbox","مصفوفة الأولويات الوقائية","Safety learning priority matrix",
  "أداة حسابية تعليمية من 1 إلى 25؛ لا تُستخدم بدل التقييم السريري أو تحقيقات السلامة المعتمدة.",
  "Educational scoring (1–25) only, not a validated clinical risk score or root-cause investigation.");
 const likelihood=labelInput("v2-likelihood","احتمال التكرار (1–5)","Estimated recurrence (1–5)","select");
 const impact=labelInput("v2-impact","التأثير المحتمل (1–5)","Potential impact (1–5)","select");
 const control=labelInput("v2-controls","فعالية الضوابط المقدرة","Estimated safeguards","select");
 for(let v=1;v<=5;v++){likelihood.input.append(new Option(String(v),String(v)));impact.input.append(new Option(String(v),String(v)))}
 [["0","غير محددة / بدون ضوابط","Unknown / none"],["1","ضوابط جزئية","Partial safeguards"],["2","ضوابط موثوقة وفق تقييمك","Stronger safeguards per reviewer"]].forEach(([v,ar,en])=>{
  const option=create("option",text(ar,en));option.value=v;option.dataset.ar=ar;option.dataset.en=en;control.input.append(option)
 });
 likelihood.input.value="3";impact.input.value="3";control.input.value="0";
 const fields=create("div");fields.className="v2-fields";fields.append(likelihood.wrap,impact.wrap,control.wrap);
 const calculate=button("v2-risk-evaluate","احسب أولوية المراجعة","Calculate review priority");
 const exportBtn=button("v2-risk-export","تنزيل ورقة الأولوية JSON","Download priority JSON");exportBtn.disabled=true;
 const row=create("div");row.className="v2-actions";row.append(calculate,exportBtn);
 const result=create("div");result.className="v2-readout";result.id="v2-risk-result";result.hidden=true;
 sec.append(fields,row,result);
 let current=null;
 calculate.addEventListener("click",()=>{
  current=core.riskMatrix(likelihood.input.value,impact.input.value,control.input.value);
  output(result,text("تقدير تعليمي للأولوية","Educational priority estimate"),
   text("المعادلة: الاحتمال × التأثير، ثم خصم افتراضي عند وجود ضوابط. التقدير يعتمد فقط على مدخلات المقيم.","Likelihood × impact, with a simple assumed safeguard discount. Only reviewer input determines this value."),[
    [text("التقدير الأساسي","Initial score"),current.inherent+"/25"],
    [text("التقدير بعد الضوابط","Score after controls"),current.residual+"/25"],
    [text("التصنيف","Priority band"),current.band.toUpperCase()]
   ]);
  exportBtn.disabled=false;
 });
 exportBtn.addEventListener("click",()=>{
  if(!current)return;
  exportText("nabd-safety-priority.json",JSON.stringify({
    format:"NABD_SAFETY_PRIORITY_V2",generated:new Date().toISOString(),...current,
    note:"User-rated learning priority only, no patient data or medical clearance."
  },null,2),"application/json");
 });
}
/* 05: editable off-platform calendar for sample missions, no fictional bookings */
function installHours(){
 const sec=section("hours","مُخطّط المهام · ملف تقويم","Calendar template for sample missions",
  "حَوِّل المهام النموذجية المعروضة إلى ملف تقويم ICS قابل للتعديل. المواعيد المقترحة تبدأ الاثنين القادم 10:00 حسب ساعة جهازك، ولا يتم حجز أي تطوع فعلي.",
  "Export visible sample missions as an editable ICS calendar. Template dates start next Monday at 10:00 local device time. No real volunteering is booked.");
 const btn=button("v2-hours-calendar","تنزيل جدول المهام التجريبي ICS","Export example schedule (ICS)");
 const result=create("div");result.className="v2-readout";result.id="v2-hours-result";result.hidden=true;
 sec.append(btn,result);
 btn.addEventListener("click",()=>{
  const tasks=nodes("#hours-results .mission-card").map(card=>{
   const name=card.querySelector("h4")?.textContent?.trim()||"Sample mission",
   h=Number(card.querySelector(".mission-meta span")?.textContent?.match(/\d+/)?.[0]||1);
   return {title:name,hours:h};
  }).slice(0,12);
  if(!tasks.length){
   output(result,text("لا توجد مهام ظاهرة","No visible tasks"),text("اضغط «اعرض المهام المناسبة» أولًا.","Click «Find matching missions» above first."),[]);
   return;
  }
  const ics=core.buildCalendar(tasks,new Date());
  exportText("nabd-global-hours-template.ics",ics,"text/calendar;charset=utf-8");
  output(result,text("جدول قابل للتعديل جاهز","Editable calendar exported"),
   text("هذه تواريخ مقترحة وأدوار نموذجية فقط؛ غيّرها بعد الاستيراد ولا تعتبرها تعيينًا أو موافقة.","These are sample dates and fictional missions; edit after import. Nothing has been confirmed."),[
     [text("عدد المهام","Tasks"),String(tasks.length)]
   ]);
 });
}
/* 06: offline-friendly selected phrase export, print and device accessibility */
function installLifeline(){
 const sec=section("lifeline","حزمة التواصل المحمولة","Portable communication pack",
  "حمّل العبارات الظاهرة إلى ملف نصّي، أو افتح طباعتها، أو كبّر النص. لا تحتوي الحزمة على أي معلومات من المستخدم ولا على تعليمات علاجية.",
  "Download visible phrases as a text sheet, print, or enlarge cards. No personal information or clinical instructions.");
 const save=button("v2-phrase-save","تنزيل العبارات الظاهرة TXT","Download visible phrases (TXT)");
 const print=button("v2-phrase-print","طباعة البطاقات","Print phrase cards");
 const zoom=button("v2-phrase-zoom","تكبير النص","Enlarge card text");
 const row=create("div");row.className="v2-actions";row.append(save,print,zoom);
 const result=create("div");result.className="v2-readout";result.id="v2-phrase-result";result.hidden=true;
 sec.append(row,result);
 save.addEventListener("click",()=>{
  const items=nodes("#phrase-list .phrase-card strong").map(n=>n.textContent?.trim()).filter(Boolean);
  const lang=$("phrase-lang").value;
  if(!items.length)return;
  exportText("nabd-lifeline-"+lang+".txt",["NABD LANGUAGE LIFELINE","Language: "+lang,
   "General nonclinical phrases only. Verify wording with a trained interpreter for important decisions.","",...items.map((s,i)=>(i+1)+". "+s)].join("\n"));
  output(result,text("تم تجهيز نسخة محلية","Local phrase sheet created"),text("الملف صالح للحفظ والطباعة ومشاركته بموافقتك.","Save, print or share the downloaded file at your discretion."),[
   [text("عدد البطاقات","Cards"),String(items.length)]
  ]);
 });
 print.addEventListener("click",()=>window.print());
 zoom.addEventListener("click",()=>{
  document.body.classList.toggle("v2-large-phrases");
  zoom.textContent=document.body.classList.contains("v2-large-phrases")?
    text("إعادة الحجم الطبيعي","Reset text size"):text("تكبير النص","Enlarge card text");
 });
}
buildStatus();installAI();installTruth();installVault();installBlackbox();installHours();installLifeline();
update();
})();
