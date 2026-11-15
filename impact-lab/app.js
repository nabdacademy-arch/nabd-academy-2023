/* NABD World Impact — 6 practical local-first pilots. Zero private input sent to a server.
 * Avoid use for clinical decisions or identifiers. User-driven review != automated verification.
 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const $$=s=>Array.from(document.querySelectorAll(s));
const tabs=["ai","truth","vault","blackbox","hours","lifeline"];
let lang="ar";
const tr=(ar,en)=>lang==="en"?en:ar;
const reports={};
function setStatus(id,ar,en,kind=""){
 const el=$(id);if(!el)return;el.textContent=tr(ar,en);el.className="tool-status"+(kind?" "+kind:"");
}
function element(tag,content,className=""){
 const n=document.createElement(tag);
 if(className)n.className=className;
 if(content!==undefined&&content!==null)n.textContent=String(content);
 return n;
}
function addText(parent,tag,label,cls=""){const n=element(tag,label,cls);parent.append(n);return n}
function makeReport(parent,title,paragraphs,rows){
 parent.replaceChildren();parent.hidden=false;
 addText(parent,"h4",title);
 for(const p of paragraphs)addText(parent,"p",p);
 if(rows&&rows.length){
  const grid=element("div",null,"report-grid");
  for(const [name,value] of rows){const cell=element("div");addText(cell,"small",name);addText(cell,"strong",value);grid.append(cell);}
  parent.append(grid);
 }
}
function safeFileName(name){return String(name||"file").replace(/[\/\\<>:"|?*\x00-\x1f]/g,"_").slice(0,140)||"file"}
function download(name,blob){
 const url=URL.createObjectURL(blob);const a=element("a");
 a.href=url;a.download=safeFileName(name);document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),15000);
}
function downloadText(name,content,type="text/markdown;charset=utf-8"){download(name,new Blob([content],{type}))}
function redactWarning(text){
 // Deliberately conservative: this is a warning, NOT a guarantee of de-identification.
 return /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\d\s().-]{8,}\d)|(?:اسم المريض|رقم الملف|patient name|patient id|record number)/i.test(text);
}
function switchTo(tab,scroll=false){
 if(!tabs.includes(tab))tab="ai";
 for(const name of tabs){
  const active=name===tab,button=$("tab-"+name),panel=$("panel-"+name);
  button.setAttribute("aria-selected",String(active));button.tabIndex=active?0:-1;panel.hidden=!active;
 }
 if(location.hash!=="#"+tab)history.replaceState(null,"","#"+tab);
 if(scroll)$("workspace").scrollIntoView({behavior:"smooth",block:"start"});
 if(tab==="hours")renderHours();
 if(tab==="lifeline")renderPhrases();
}
$$("[data-module]").forEach((button,index)=>{
 button.addEventListener("click",()=>switchTo(button.dataset.module,window.innerWidth<840));
 button.addEventListener("keydown",e=>{
  if(!["ArrowRight","ArrowLeft","Home","End"].includes(e.key))return;
  e.preventDefault();
  const step=e.key==="ArrowRight"?1:-1;
  const next=e.key==="Home"?0:e.key==="End"?tabs.length-1:(index+step+tabs.length)%tabs.length;
  $("tab-"+tabs[next]).focus();switchTo(tabs[next]);
 });
});
window.addEventListener("hashchange",()=>switchTo(location.hash.slice(1)));
function setLanguage(next){
 lang=next==="en"?"en":"ar";
 document.documentElement.lang=lang;document.documentElement.dir=lang==="en"?"ltr":"rtl";
 for(const n of $$("[data-ar][data-en]")){
   const value=n.dataset[lang];
   if(n.id==="main-title")n.innerHTML=value;
   else n.textContent=value;
 }
 $("language").textContent=lang==="ar"?"English 🌐":"العربية 🌐";
 $("language").setAttribute("aria-pressed",String(lang==="en"));
 if(reports.ai)renderAi(reports.ai);
 if(reports.truth)renderTruth(reports.truth);
 if(reports.blackbox)renderBlackbox(reports.blackbox);
 renderHours();renderPhrases();
}
$("language").addEventListener("click",()=>setLanguage(lang==="ar"?"en":"ar"));
switchTo(location.hash.slice(1));

/* 01 · AI Crash Test — score from explicit HUMAN rubric, no medical truth assertion */
const METRICS=[
 ["accuracy","الدقة وفق المقيم","Accuracy per reviewer"],
 ["evidence","قابلية فحص المراجع","Reference verifiability"],
 ["uncertainty","التعامل مع عدم اليقين","Uncertainty disclosure"],
 ["privacy","الخصوصية","Privacy"],
 ["safety","تقليل المخاطر","Harm reduction"]
];
function renderAi(data){
 const review=data.values;
 const rows=METRICS.map(([key,ar,en])=>[tr(ar,en),review[key]+"/4"]);
 rows.unshift([tr("المجموع حسب تقييم المراجع","Reviewer-defined score"),data.score+"/100"]);
 const warnings=[];
 if(!/https?:\/\/[^\s]+/i.test(data.response))warnings.push(tr("لم نكتشف رابط مرجع مباشر في النص؛ قد توجد مراجع غير مرتبطة.","No direct source URL detected; references might still be present without a link."));
 if(/(?:\b(?:always|never|guaranteed|100%|completely safe)\b|(?:دائما|دائمًا|مضمون 100|آمن تمامًا))/i.test(data.response))warnings.push(tr("توجد صياغة قطعية تستحق فحصها ضمن السياق.","Absolute language may need context-sensitive review."));
 if(redactWarning(data.response))warnings.push(tr("قد توجد بيانات تعريفية في الإجابة؛ تحقق قبل مشاركة التقرير.","Potential identifying information: review before sharing."));
 makeReport($("ai-result"),tr("بطاقة مراجعة مخاطر الذكاء الاصطناعي","AI risk review worksheet"),[
  tr("النظام: ","System: ")+data.name,
  tr("هذا المؤشر مستمد بالكامل من اختيارات المُقيّم الخمسة، ولا يقيس الحقيقة تلقائيًا أو يصنف النظام آمنًا للاستخدام الطبي.","This is an average of five reviewer ratings, NOT an automated truth test or medical safety certification."),
  warnings.length?tr("إشارات لغوية أولية: ","Preliminary language flags: ")+warnings.join(" | "):
   tr("لم تظهر إشارات لغوية من قائمة الاختبارات البسيطة؛ وهذا لا يثبت سلامة الإجابة.","No basic language flags were triggered; this does not prove the answer safe.")
 ],rows);
}
$("ai-form").addEventListener("submit",e=>{
 e.preventDefault();
 const name=$("ai-name").value.trim(),prompt=$("ai-prompt").value.trim(),response=$("ai-response").value.trim();
 if(!name||!prompt||!response)return;
 if(redactWarning(prompt)){
  setStatus("ai-status","لا تدخل بيانات مرضى أو أرقام تعريفية في أسئلة التقييم.","Do not enter patient identifiers in test prompts.","error");return;
 }
 const values={};
 $$("select[name=ai-metric]").forEach(n=>{values[n.dataset.metric]=Number(n.value)});
 const score=Math.round((Object.values(values).reduce((a,b)=>a+b,0)/20)*100);
 reports.ai={name,prompt,response,values,score,created:new Date().toISOString()};
 renderAi(reports.ai);$("ai-export").disabled=false;
 setStatus("ai-status","تم إنشاء مسودة المراجعة محليًا؛ لا تُنشر أو تُعتمد تلقائيًا.","A local review draft was created; not published or certified.","success");
});
$("ai-export").addEventListener("click",()=>{
 const d=reports.ai;if(!d)return;
 const lines=["# NABD AI Crash Test","Date: "+d.created,"System: "+d.name,"Reviewer rubric score (not automated accuracy): "+d.score+"/100",
  "## Test prompt",d.prompt,"## Model response",d.response,"## Scores (0-4)"];
 for(const [key,ar,en] of METRICS)lines.push(en+": "+d.values[key]);
 lines.push("## Limitation","Reviewer-assigned rubric only. This report does not certify medical accuracy or system safety.");
 downloadText("nabd-ai-review.md",lines.join("\n\n"));
});

/* 02 · Truth Strike — drafts and evidence links, no automatic fact-check verdict */
function validLink(raw){
 try{const u=new URL(raw);return u.protocol==="https:"&&Boolean(u.hostname)&&!u.username&&!u.password?u.href:null}catch{return null}
}
const VERDICTS={
 undetermined:["غير محسوم؛ يحتاج تحققًا مستقلًا","Undetermined; independent review needed"],
 supported:["مدعوم وفق تقييم المراجع","Supported according to reviewer"],
 misleading:["ينقصه سياق وفق تقييم المراجع","Missing context according to reviewer"],
 unsupported:["لا تدعمه المراجع المدخلة","Not supported by cited sources"]
};
function renderTruth(d){
 const out=$("truth-result");
 makeReport(out,tr("بطاقة ادعاء · مسودة غير منشورة","Claim card · Unpublished draft"),[
  tr("الادعاء: ","Claim: ")+d.claim,
  tr("خلاصة الأدلة التي أدخلها المستخدم: ","Reviewer-entered evidence summary: ")+d.evidence,
  tr("حالة المراجعة البشرية: ","Human reviewer verdict: ")+tr(...VERDICTS[d.verdict]),
  tr("لم تتحقق نبض آليًا من محتوى الروابط أو صحة الادعاء. لا تشاركها كتصحيح رسمي دون تدقيق مختص.","NABD has not independently fetched the links or verified this claim. Expert review is needed before public publication.")
 ]);
 const heading=addText(out,"h5",tr("روابط المصادر المدخلة","Submitted source links"));
 for(const link of d.links){
  const p=element("p"),a=element("a",link);a.href=link;a.target="_blank";a.rel="noopener noreferrer";p.append(a);out.append(p);
 }
 heading.className="report-subtitle";
}
$("truth-form").addEventListener("submit",e=>{
 e.preventDefault();
 const claim=$("truth-claim").value.trim(),evidence=$("truth-evidence").value.trim(),a=validLink($("truth-link1").value.trim());
 const second=$("truth-link2").value.trim(),b=second?validLink(second):null;
 if(!a||(second&&!b)){setStatus("truth-status","استخدم روابط HTTPS صالحة للمصادر.","Use valid HTTPS source URLs.","error");return}
 if(redactWarning(claim+" "+evidence)){setStatus("truth-status","لا تدخل بيانات مرضى أو تفاصيل تعريفية.","Do not enter patient identifying information.","error");return}
 reports.truth={claim,evidence,links:b?[a,b]:[a],verdict:$("truth-verdict").value,created:new Date().toISOString()};
 renderTruth(reports.truth);$("truth-export").disabled=false;
 setStatus("truth-status","البطاقة جاهزة للتنزيل كمسودة غير منشورة.","The unpublished draft card is ready to download.","success");
});
$("truth-export").addEventListener("click",()=>{
 const d=reports.truth;if(!d)return;
 downloadText("nabd-claim-draft.md",["# NABD Truth Strike - Unpublished draft","Date: "+d.created,
  "## Claim",d.claim,"## Evidence summary entered by reviewer",d.evidence,
  "## Source links",...d.links,"## Reviewer verdict",VERDICTS[d.verdict][1],
  "Not fact-checked by software or endorsed for public release."].join("\n\n"));
});

/* 03 · Rescue Vault — genuine browser-side authenticated encryption, not a remote backup */
const MAX_FILE=8*1024*1024,ITERATIONS=310000;
function bytesTo64(bytes){
 let out="";for(let i=0;i<bytes.length;i+=16384)out+=String.fromCharCode(...bytes.subarray(i,i+16384));
 return btoa(out);
}
function base64ToBytes(b64){
 const bin=atob(b64),bytes=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes;
}
async function makeKey(password,salt,iterations){
 const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveKey"]);
 return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function encryptFile(file,password){
 if(!globalThis.crypto?.subtle||!crypto.getRandomValues)throw Error("NO_WEBCRYPTO");
 if(file.size<1||file.size>MAX_FILE)throw Error("FILE_SIZE");
 if(password.length<12)throw Error("SHORT_PASSWORD");
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await makeKey(password,salt,ITERATIONS);
 const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,await file.arrayBuffer()));
 return {format:"NABD_VAULT_V1",algorithm:"AES-256-GCM",kdf:"PBKDF2-SHA256",iterations:ITERATIONS,
  salt:bytesTo64(salt),iv:bytesTo64(iv),ciphertext:bytesTo64(ciphertext),
  filename:safeFileName(file.name),type:String(file.type||"application/octet-stream").slice(0,100),size:file.size};
}
async function decryptArchive(archive,password){
 if(!globalThis.crypto?.subtle)throw Error("NO_WEBCRYPTO");
 if(!archive||archive.format!=="NABD_VAULT_V1"||archive.algorithm!=="AES-256-GCM"||
   archive.kdf!=="PBKDF2-SHA256"||!Number.isInteger(archive.iterations)||archive.iterations<250000||archive.iterations>800000||
   typeof archive.ciphertext!=="string"||archive.ciphertext.length>(MAX_FILE+20)*1.5||
   typeof archive.filename!=="string"||typeof archive.size!=="number"||archive.size<1||archive.size>MAX_FILE)
   throw Error("INVALID_ARCHIVE");
 const salt=base64ToBytes(archive.salt),iv=base64ToBytes(archive.iv),body=base64ToBytes(archive.ciphertext);
 if(salt.length!==16||iv.length!==12||body.length<17)throw Error("INVALID_ARCHIVE");
 const key=await makeKey(password,salt,archive.iterations);
 const original=await crypto.subtle.decrypt({name:"AES-GCM",iv},key,body);
 if(original.byteLength!==archive.size)throw Error("INVALID_ARCHIVE");
 return new Blob([original],{type:archive.type||"application/octet-stream"});
}
$("vault-encrypt").addEventListener("submit",async e=>{
 e.preventDefault();const file=$("vault-input").files?.[0],pass=$("vault-pass").value,button=e.submitter;
 if(!file)return;
 button.disabled=true;setStatus("vault-status","جارٍ تشفير الملف محليًا…","Encrypting locally…");
 try{const archive=await encryptFile(file,pass);
  download(safeFileName(file.name)+".nabdvault",new Blob([JSON.stringify(archive)],{type:"application/json"}));
  $("vault-pass").value="";setStatus("vault-status","تم إنشاء ملف مشفر وتنزيله. احفظ كلمة المرور في مكان آمن منفصل.","Encrypted file downloaded. Store the password securely and separately.","success");
 }catch(err){
  const code=String(err?.message||"");
  setStatus("vault-status",code==="FILE_SIZE"?"ملف غير صالح أو أكبر من 8 ميغابايت.":"تعذر التشفير؛ استخدم HTTPS ومتصفحًا حديثًا، وكلمة مرور من 12 حرفًا على الأقل.",
   code==="FILE_SIZE"?"File must be between 1 byte and 8 MB.":"Encryption failed. Use HTTPS, a modern browser and a password of 12+ characters.","error");
 }finally{button.disabled=false}
});
$("vault-decrypt").addEventListener("submit",async e=>{
 e.preventDefault();const file=$("vault-archive").files?.[0],pass=$("vault-open-pass").value,button=e.submitter;
 if(!file)return;
 button.disabled=true;setStatus("vault-status","جارٍ التحقق وفك التشفير محليًا…","Verifying and decrypting locally…");
 try{
  if(file.size>12*1024*1024)throw Error("INVALID_ARCHIVE");
  const archive=JSON.parse(await file.text());
  const original=await decryptArchive(archive,pass);
  download(archive.filename,original);$("vault-open-pass").value="";
  setStatus("vault-status","تم فك التشفير وتنزيل الملف الأصلي بنجاح.","Original file decrypted and downloaded.","success");
 }catch(err){
  setStatus("vault-status","تعذر فتح الملف؛ قد تكون كلمة المرور غير صحيحة أو الملف غير صالح.","Could not decrypt: wrong password or invalid archive.","error");
 }finally{button.disabled=false}
});

/* 04 · Black Box — incident-learning worksheet only; no healthcare reporting */
const FACTORS={
 handoff:["تنظيم تسليم المعلومات والتأكد من استلامها","Standardize handoff and acknowledgement"],
 workload:["مراجعة توزيع المهام وضغط الفريق","Review staffing and workload distribution"],
 process:["تبسيط الإجراء المكتوب واختبار وضوحه","Clarify written procedures and verify usability"],
 equipment:["تحديد فحوص صيانة وبدائل موارد","Introduce maintenance checks and contingency supplies"],
 training:["تجربة تدريب قصيرة مع قياس فهم","Provide focused practice and verify understanding"]
};
function renderBlackbox(d){
 const rows=[[tr("نوع الحدث","Event type"),d.type],[tr("شدة محتملة","Potential impact"),d.severity],
  [tr("عوامل مختارة","Selected factors"),String(d.factors.length)]];
 makeReport($("bb-result"),tr("تقرير تعلم من حادثة · مسودة محلية","Safety event learning draft"),[
  tr("وصف الحالة غير المحددة للهوية: ","De-identified description: ")+d.description,
  tr("الإجراء الوقائي المقترح: ","Reviewer proposed preventive action: ")+d.action,
  tr("أسئلة للمراجعة: ما الضوابط التي لم تعمل؟ كيف نختبر الإجراء التصحيحي؟ كيف نقيس التحسن دون لوم فردي؟",
   "Review prompts: Which safeguards failed? How can we test the corrective action? How do we measure improvement without blame?"),
  tr("هذه مسودة تعلم وليست تقرير حادثة رسميًا أو تحديدًا للسبب الجذري.","This is a learning worksheet, not an official incident report or verified root-cause conclusion.")
 ],rows);
 const list=element("ul");
 for(const key of d.factors)addText(list,"li",tr(...FACTORS[key]));
 $("bb-result").append(list);
}
$("blackbox-form").addEventListener("submit",e=>{
 e.preventDefault();const description=$("bb-description").value.trim(),action=$("bb-action").value.trim();
 if(redactWarning(description+" "+action)){
  setStatus("bb-status","قد يحتوي النص على بيانات تعريفية. أزلها قبل إنشاء التقرير.","Possible identifiers detected. Remove them before generating a report.","error");return;
 }
 const factors=$$("input[name=bb-factor]:checked").map(n=>n.value);
 if(!factors.length){setStatus("bb-status","اختر عاملًا مساهمًا واحدًا على الأقل.","Select at least one contributing factor.","error");return}
 reports.blackbox={type:$("bb-type").value,severity:$("bb-severity").value,description,action,factors,created:new Date().toISOString()};
 renderBlackbox(reports.blackbox);$("bb-export").disabled=false;
 setStatus("bb-status","تم إعداد تقرير محلي للمراجعة؛ لا يُرسل إلى جهة خارجية.","A local learning report was created; nothing was submitted.","success");
});
$("bb-export").addEventListener("click",()=>{
 const d=reports.blackbox;if(!d)return;
 downloadText("nabd-blackbox-learning.md",["# NABD Black Box — Local learning draft",
  "Date: "+d.created,"Type: "+d.type,"Potential impact: "+d.severity,
  "## Anonymized event summary",d.description,"## System factors",...d.factors.map(x=>FACTORS[x][1]),
  "## Preventive idea",d.action,"No patient identifiers. Not an official incident report."].join("\n\n"));
});

/* 05 · Global Hours — sample mission matching, no invented real openings */
const MISSIONS=[
 {id:"m1",skill:"translation",hours:2,titleAr:"ترجمة ملخص إنساني مبسط",titleEn:"Translate a humanitarian summary",descAr:"تحويل نموذج معلومات عامة إلى صيغة ثنائية اللغة دون معلومات شخصية.",descEn:"Make a general information template bilingual without personal data."},
 {id:"m2",skill:"programming",hours:4,titleAr:"تدقيق إتاحة صفحة ويب",titleEn:"Audit a webpage for accessibility",descAr:"فحص التنقل بلوحة المفاتيح، العناوين، والتباين في صفحة تعليمية تجريبية.",descEn:"Check keyboard navigation, headings and contrast on a demo webpage."},
 {id:"m3",skill:"design",hours:3,titleAr:"تصميم بطاقات تواصل واضحة",titleEn:"Design inclusive communication cards",descAr:"إعداد مخططات بصرية بخط كبير ورموز واضحة لمواقف عامة.",descEn:"Create large-print, high-clarity pictographic cards for general situations."},
 {id:"m4",skill:"research",hours:3,titleAr:"فهرسة أدلة مرجعية مفتوحة",titleEn:"Index open reference resources",descAr:"جمع روابط جهات رسمية وتوثيق تاريخ الاطلاع ونوع المصدر.",descEn:"Catalog publicly accessible official sources with date and source category."},
 {id:"m5",skill:"coordination",hours:2,titleAr:"إعداد جدول مهام لفريق متطوعين",titleEn:"Plan a volunteer team workflow",descAr:"تصميم نموذج مهام وأوقات وتقارير إنجاز دون استخدام بيانات شخصية.",descEn:"Design an assignment schedule and progress template with no personal data."},
 {id:"m6",skill:"programming",hours:2,titleAr:"تحسين نموذج يعمل دون إنترنت",titleEn:"Prototype a small offline-first form",descAr:"اختبار إدخال البيانات وحفظ مسودة محلية دون إرسالها للخوادم.",descEn:"Test a local draft form that works without uploading to servers."}
];
function renderHours(){
 const out=$("hours-results");out.replaceChildren();
 const skill=$("hours-skill").value,available=Number($("hours-amount").value||0);
 if(!Number.isInteger(available)||available<1||available>40)return;
 const matched=MISSIONS.filter(m=>(skill==="all"||m.skill===skill)&&m.hours<=available)
  .sort((a,b)=>a.hours-b.hours);
 if(!matched.length){
  addText(out,"p",tr("لا توجد مهمة نموذجية ضمن هذا الوقت. زد الساعات أو اختر تخصصًا آخر.","No sample missions fit. Increase your available hours or change the skill."),"tool-status");return;
 }
 const pre=element("p",tr("بطاقات تدريبية توضح آلية المطابقة فقط، وليست فرصًا منشورة ولا تسجيلًا فعليًا.","Illustrative sample missions only—not live job openings or submitted applications."),"tool-status");
 out.append(pre);
 matched.forEach(m=>{
  const card=element("article",null,"mission-card");
  addText(card,"h4",tr(m.titleAr,m.titleEn));
  const badges=element("div",null,"mission-meta");addText(badges,"span",m.hours+" "+tr("ساعات/أسبوع","hours/week"));addText(badges,"span",m.skill.toUpperCase());card.append(badges);
  addText(card,"p",tr(m.descAr,m.descEn));
  const btn=element("button",tr("إنشاء عرض تطوع لهذه المهمة","Create a proposal for this mission"),"button outline");
  btn.type="button";btn.addEventListener("click",()=>{
   const text=["# NABD Global Hours","Volunteer proposal — example / not submitted",
    "Mission: "+m.titleEn,"Skill: "+m.skill,"Hours/week: "+available,"Suggested task duration: "+m.hours+" hours/week",
    "Status: draft, not sent to any organization.","No name or contact details stored in this demo."].join("\n\n");
   downloadText("nabd-volunteer-proposal-"+m.id+".md",text);
   setStatus("hours-status","تم تنزيل مسودة عرض تطوع. لا توجد جهة مستلمة أو تسجيل تلقائي.","Proposal downloaded. No organization has received an application.","success");
  });card.append(btn);out.append(card);
 });
}
$("hours-form").addEventListener("submit",e=>{e.preventDefault();renderHours();setStatus("hours-status","تم تحديث نتائج المطابقة النموذجية.","Sample matching results updated.","success")});
$("hours-skill").addEventListener("change",renderHours);

/* 06 · Language Lifeline — nonclinical multilingual phrase cards */
const PHRASES=[
 {id:1,cat:"welcome",ar:"مرحبًا، كيف يمكنني مساعدتك؟",en:"Hello, how can I help you?",fr:"Bonjour, comment puis-je vous aider ?",es:"Hola, ¿cómo puedo ayudarle?",tr:"Merhaba, size nasıl yardımcı olabilirim?"},
 {id:2,cat:"welcome",ar:"هل تتحدث لغة أخرى؟",en:"Do you speak another language?",fr:"Parlez-vous une autre langue ?",es:"¿Habla otro idioma?",tr:"Başka bir dil konuşuyor musunuz?"},
 {id:3,cat:"welcome",ar:"هل يمكنك تكرار ذلك ببطء؟",en:"Could you repeat that slowly?",fr:"Pouvez-vous répéter lentement ?",es:"¿Puede repetirlo despacio?",tr:"Bunu yavaşça tekrar edebilir misiniz?"},
 {id:4,cat:"welcome",ar:"سأحاول العثور على مترجم.",en:"I will try to find an interpreter.",fr:"Je vais essayer de trouver un interprète.",es:"Intentaré encontrar un intérprete.",tr:"Bir tercüman bulmaya çalışacağım."},
 {id:5,cat:"access",ar:"هل تحتاج إلى مكان هادئ؟",en:"Do you need a quiet place?",fr:"Avez-vous besoin d’un endroit calme ?",es:"¿Necesita un lugar tranquilo?",tr:"Sessiz bir yere ihtiyacınız var mı?"},
 {id:6,cat:"access",ar:"هل تحتاج إلى ماء للشرب؟",en:"Do you need drinking water?",fr:"Avez-vous besoin d’eau potable ?",es:"¿Necesita agua potable?",tr:"İçme suyuna ihtiyacınız var mı?"},
 {id:7,cat:"access",ar:"هل تحتاج إلى مساعدة للوصول إلى المكان؟",en:"Do you need help reaching the location?",fr:"Avez-vous besoin d’aide pour vous rendre sur place ?",es:"¿Necesita ayuda para llegar al lugar?",tr:"Buraya ulaşmak için yardıma ihtiyacınız var mı?"},
 {id:8,cat:"access",ar:"يمكننا كتابة المعلومات بدلًا من قولها.",en:"We can write the information instead of speaking.",fr:"Nous pouvons écrire les informations au lieu de parler.",es:"Podemos escribir la información en lugar de decirla.",tr:"Bilgileri sözlü söylemek yerine yazabiliriz."},
 {id:9,cat:"access",ar:"هل تفضّل قراءة النص بحجم أكبر؟",en:"Would you prefer larger text?",fr:"Préférez-vous un texte plus grand ?",es:"¿Prefiere un texto más grande?",tr:"Daha büyük yazı tercih eder misiniz?"},
 {id:10,cat:"logistics",ar:"أين نقطة التجمع؟",en:"Where is the meeting point?",fr:"Où est le point de rassemblement ?",es:"¿Dónde está el punto de encuentro?",tr:"Toplanma noktası nerede?"},
 {id:11,cat:"logistics",ar:"هذه المعلومات تحتاج إلى تأكيد.",en:"This information needs confirmation.",fr:"Ces informations doivent être confirmées.",es:"Esta información necesita confirmación.",tr:"Bu bilginin doğrulanması gerekiyor."},
 {id:12,cat:"logistics",ar:"من فضلك انتظر هنا قليلًا.",en:"Please wait here for a moment.",fr:"Veuillez patienter ici un instant.",es:"Por favor, espere aquí un momento.",tr:"Lütfen burada biraz bekleyin."},
 {id:13,cat:"logistics",ar:"أين يمكن الحصول على معلومات محدثة؟",en:"Where can we get updated information?",fr:"Où pouvons-nous obtenir des informations à jour ?",es:"¿Dónde podemos obtener información actualizada?",tr:"Güncel bilgileri nereden alabiliriz?"},
 {id:14,cat:"logistics",ar:"شكرًا لمساعدتك.",en:"Thank you for your help.",fr:"Merci pour votre aide.",es:"Gracias por su ayuda.",tr:"Yardımınız için teşekkür ederim."}
];
const voiceLang={ar:"ar-PS",en:"en-US",fr:"fr-FR",es:"es-ES",tr:"tr-TR"};
let phraseDialog=null;
function showLarge(text,voice){
 if(!phraseDialog){
  phraseDialog=element("dialog");phraseDialog.style.cssText="max-width:min(640px,94vw);border:2px solid #67dacc;border-radius:20px;padding:28px;background:#071d2a;color:white;font:700 27px/1.7 system-ui;";
  const content=element("p");content.id="phrase-enlarged";content.style.overflowWrap="anywhere";
  const close=element("button",tr("إغلاق","Close"),"button outline");close.id="phrase-dialog-close";close.type="button";
  close.addEventListener("click",()=>phraseDialog.close());
  phraseDialog.append(content,close);document.body.append(phraseDialog);
 }
 $("phrase-enlarged").textContent=text;
 $("phrase-enlarged").lang=voice;
 $("phrase-dialog-close").textContent=tr("إغلاق","Close");
 if(typeof phraseDialog.showModal==="function")phraseDialog.showModal();else alert(text);
}
function renderPhrases(){
 const list=$("phrase-list");list.replaceChildren();
 const selected=$("phrase-lang").value,cat=$("phrase-category").value;
 for(const p of PHRASES.filter(p=>cat==="all"||p.cat===cat)){
  const card=element("article",null,"phrase-card"),name=selected==="ar"?p.ar:p[selected];
  const label=element("small",tr("بطاقة رقم ","Card #")+p.id+" / "+p.cat);
  card.append(label);
  const content=element("strong",name);content.lang=voiceLang[selected];content.dir=selected==="ar"?"rtl":"ltr";card.append(content);
  const actions=element("div",null,"phrase-actions");
  const copy=element("button",tr("نسخ","Copy"));copy.type="button";
  copy.addEventListener("click",async()=>{
   try{await navigator.clipboard.writeText(name);
    setStatus("phrase-status","تم نسخ العبارة.","Phrase copied.","success");
   }catch{setStatus("phrase-status","تعذر النسخ تلقائيًا. استخدم العرض الكبير لتحديد النص.","Copy unavailable. Use large display to select the text.","error")}
  });
  const speak=element("button",tr("نطق","Speak"));speak.type="button";
  speak.addEventListener("click",()=>{
   if(!("speechSynthesis" in window)){setStatus("phrase-status","هذا المتصفح لا يدعم النطق الآلي.","Text-to-speech not available in this browser.","error");return}
   try{speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(name);utterance.lang=voiceLang[selected];utterance.rate=.85;speechSynthesis.speak(utterance);
    setStatus("phrase-status","النطق الآلي يعتمد على صوت الجهاز وقد لا يكون دقيقًا.","Device speech may be unavailable or inaccurate.","success");
   }catch{setStatus("phrase-status","تعذر النطق الآلي على هذا الجهاز.","Speech playback failed.","error")}
  });
  const large=element("button",tr("عرض كبير","Enlarge"));large.type="button";large.addEventListener("click",()=>showLarge(name,voiceLang[selected]));
  actions.append(copy,speak,large);card.append(actions);list.append(card);
 }
}
$("phrase-lang").addEventListener("change",renderPhrases);
$("phrase-category").addEventListener("change",renderPhrases);
renderHours();renderPhrases();
if("serviceWorker" in navigator && location.protocol==="https:"){
 window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{}));
}
})();
