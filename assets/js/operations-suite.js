/* NABD V16 operational workflows. Sensitive operations remain on existing Auth/RLS backend.
This module creates only ephemeral review drafts; no network uploads, account changes or certificate issuance. */
(()=>{"use strict";
const d=document,$=id=>d.getElementById(id);
const line=(id,message)=>{const x=$(id);if(x)x.textContent=message};
let lectureDraft="",courseDraft="",researchDraft="";
const clean=s=>String(s??"").trim().slice(0,1500);
function fallbackCopy(text){const t=d.createElement("textarea");t.value=text;t.style.cssText="position:fixed;opacity:0;pointer-events:none";d.body.append(t);t.select();let ok=false;try{ok=d.execCommand("copy")}catch(e){}t.remove();return ok}
async function copy(text,id){if(!text){line(id,"أنشئ المسودة أولاً.");return}let ok=false;try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);ok=true}else ok=fallbackCopy(text)}catch(e){ok=fallbackCopy(text)}line(id,ok?"تم نسخ المسودة.":"النسخ غير متاح؛ استخدم تنزيل الملف.")}
function download(text,name,type="text/plain;charset=utf-8"){if(!text)return;const blob=new Blob(["\ufeff",text],{type});const url=URL.createObjectURL(blob),a=d.createElement("a");a.href=url;a.download=name;d.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function checklist(group,meter){const inputs=[...d.querySelectorAll('[data-os-check="'+group+'"]')];if(!inputs.length)return;const update=()=>{const total=inputs.length,done=inputs.filter(x=>x.checked).length;line(meter,done+" / "+total+" — "+(done===total?"جاهز للمراجعة البشرية، لا يعني اعتمادًا آليًا.":"خطوات مراجعة مكتملة."))};inputs.forEach(x=>x.addEventListener("change",update));update();return {inputs,update}}
function lesson(){
 const form=$("os-lesson-form");if(!form)return;
 function build(){const title=clean($("os-lesson-title").value),objective=clean($("os-lesson-objective").value),course=clean($("os-lesson-course").value),duration=Number($("os-lesson-length").value);if(!title||!objective||![30,45,60,90].includes(duration)){line("os-lesson-status","أدخل عنوانًا وهدفًا ومدة صحيحة.");return}
 const blocks=[Math.max(3,Math.round(duration*.12)),Math.max(7,Math.round(duration*.53)),Math.max(5,Math.round(duration*.2))];blocks.push(duration-blocks.reduce((a,b)=>a+b,0));
 const labels=["تهيئة وسؤال تمهيدي","شرح/تعلم نشط","تطبيق أو محاكاة تعليمية","تقويم ختامي ومصادر"];
 lectureDraft=["NABD / FACULTY LESSON BLUEPRINT — مسودة غير منشورة","العنوان: "+title,"المقرر: "+(course||"غير محدد"),"المدة: "+duration+" دقيقة","هدف التعلّم: "+objective,"","توزيع الوقت:",...blocks.map((n,i)=>(i+1)+". "+labels[i]+" — "+n+" دقيقة"),"","قائمة تحقق قبل النشر:","- التأكد من المصادر العلمية","- مراجعة التناسب مع مستوى الطلاب","- التأكد من ملكية موارد العرض","- تدقيق المحتوى علميًا","- نشره عبر استوديو المحاضر وصلاحيات قاعدة البيانات فقط."].join("\n");
 $("os-lesson-output").textContent=lectureDraft;line("os-lesson-status","تم إنشاء مخطط الجلسة على جهازك. لم يُنشر في الدورات.");}
 form.addEventListener("submit",e=>{e.preventDefault();build()});
 $("os-lesson-copy").addEventListener("click",()=>copy(lectureDraft,"os-lesson-status"));
 $("os-lesson-download").addEventListener("click",()=>{if(!lectureDraft)build();download(lectureDraft,"NABD-lesson-blueprint.txt")});
 $("os-lesson-to-editor").addEventListener("click",()=>{if(!lectureDraft)build();const workspace=$("studio-workspace"),editor=$("studio-editor"),existing=$("studio-record");if(!workspace||workspace.hidden||!editor||editor.hidden||!existing){line("os-lesson-status","لا يوجد محرر مقرر متاح لهذا الحساب. يلزم تكليف صلاحية التدريس أولاً.");return}
 const title=existing.querySelector('[name="title"]'),objective=existing.querySelector('[name="objective"]'),description=existing.querySelector('[name="description"]');if(!title||!objective||!description)return;
 if(title.value||objective.value||description.value){if(!confirm("هناك بيانات موجودة في المحرر. هل تريد استبدال حقول العنوان والهدف والتفاصيل فقط؟"))return}
 title.value=clean($("os-lesson-title").value);objective.value=clean($("os-lesson-objective").value);description.value=lectureDraft;editor.scrollIntoView({behavior:"smooth",block:"start"});line("os-lesson-status","تم نسخ المسودة إلى نموذج المحاضر فقط. راجعها ثم اضغط حفظ بنفسك إن أردت.");});
}
function course(){
 const form=$("os-course-form");if(!form)return;
 function build(){const name=clean($("os-course-name").value),code=clean($("os-course-code").value).toUpperCase(),weeks=Number($("os-course-weeks").value),hours=Number($("os-course-hours").value),outcomes=clean($("os-course-outcomes").value).split(/\n/).map(x=>x.trim()).filter(Boolean).slice(0,8),assessment=$("os-course-assessment").value;
 if(!name||!code||!outcomes.length||weeks<1||weeks>24||hours<1||hours>100){line("os-course-status","أكمل اسم المقرر ورمزه ومخرجات التعلم وحدود الساعات والأسابيع.");return}
 const plan={kind:"NABD COURSE PROPOSAL / DRAFT ONLY",version:1,title:name,code,weeks,hours_per_week:hours,learning_outcomes:outcomes,assessment_strategy:assessment,units:Array.from({length:weeks},(_,i)=>({week:i+1,theme:outcomes[i%outcomes.length],planned_hours:hours,requires_faculty_review:true})),review:{scientific_review:false,accessibility_review:false,copyright_checked:false,assessment_review:false,admin_approval:false},note:"Draft only; not created in the live course database. Must be reviewed and published by authorised staff."};
 courseDraft=JSON.stringify(plan,null,2);$("os-course-output").textContent=["مخطط مقرر مقترح، غير منشور",name+" / "+code,"عدد الأسابيع: "+weeks+" • ساعات أسبوعية: "+hours,"نواتج التعلّم: "+outcomes.join(" • "),"نوع التقييم: "+assessment,"","خطة الوحدات:",...plan.units.map(x=>"الأسبوع "+x.week+": "+x.theme)].join("\n");line("os-course-status","أُنشئت مسودة مقرر محلية فقط. لم يتم تعديل جدول المقررات أو تسجيل أي طالب.");}
 form.addEventListener("submit",e=>{e.preventDefault();build()});
 $("os-course-copy").addEventListener("click",()=>copy(courseDraft,"os-course-status"));
 $("os-course-export").addEventListener("click",()=>{if(!courseDraft)build();download(courseDraft,"NABD-course-proposal.json","application/json;charset=utf-8")});
 checklist("admin-course","os-course-meter");
}
function certificates(){
 const code=$("os-cert-id");if(!code)return;
 const link=$("os-cert-link");const out=$("os-cert-status");const build=()=>{const value=code.value.trim().toUpperCase();if(!/^[A-Z0-9][A-Z0-9_-]{3,79}$/.test(value)){link.hidden=true;out.textContent="أدخل معرّف شهادة صالحًا كما هو مطبوع (حروف أو أرقام أو شرطات).";return}
 const url=new URL("index.html",location.href);url.searchParams.set("cert",value);url.hash="verify";link.href=url.href;link.hidden=false;out.textContent="الرابط يفتح نظام التحقق الرسمي؛ لا يعني ظهور الرابط أن الشهادة أصلية أو معتمدة.";};
 $("os-cert-form").addEventListener("submit",e=>{e.preventDefault();build()});
 code.addEventListener("input",()=>{link.hidden=true;out.textContent=""});
 checklist("student-cert","os-cert-meter");
}
function research(){
 const form=$("os-research-form");if(!form)return;
 const links=["os-pubmed-link","os-crossref-link"].map($);
 function make(){const p=clean($("os-pico-p").value),i=clean($("os-pico-i").value),c=clean($("os-pico-c").value),o=clean($("os-pico-o").value),design=$("os-research-design").value;
 if(!p||!i||!o){line("os-research-status","أدخل الفئة والتدخل أو التعرض والنتيجة لإنشاء خطة البحث.");return}
 const phrase=[p,i,c,o].filter(Boolean).join(" ");
 researchDraft=["NABD RESEARCH EVIDENCE NAVIGATOR — draft only","Population / الفئة: "+p,"Intervention/Exposure / التدخل: "+i,"Comparison / المقارنة: "+(c||"لم تحدد"),"Outcome / النتيجة: "+o,"Study approach / النهج: "+design,"","Draft research question:",[p,i,c?"compared with "+c:"","and",o].filter(Boolean).join(" "),"","Required before participant-facing research:","- Supervisory and ethics approvals","- Privacy and consent review","- Source/DOI verification","- No identifiable patient data in public tools."].join("\n");
 $("os-research-output").textContent=researchDraft;
 links[0].href="https://pubmed.ncbi.nlm.nih.gov/?term="+encodeURIComponent(phrase);links[0].hidden=false;
 links[1].href="https://search.crossref.org/?q="+encodeURIComponent(phrase);links[1].hidden=false;
 line("os-research-status","المسودة محلية. لا يُرسل البحث إلى PubMed أو Crossref إلا إذا ضغطت رابط البحث الخارجي.");}
 form.addEventListener("submit",e=>{e.preventDefault();make()});
 ["os-pico-p","os-pico-i","os-pico-c","os-pico-o"].forEach(id=>$(id).addEventListener("input",()=>{links.forEach(x=>x.hidden=true)}));
 $("os-research-copy").addEventListener("click",()=>copy(researchDraft,"os-research-status"));
 $("os-research-download").addEventListener("click",()=>{if(!researchDraft)make();download(researchDraft,"NABD-research-evidence-plan.txt")});
 checklist("research-ethics","os-research-meter");
}
function executive(){
 const host=$("os-admin-suite");if(!host)return;
 const qa=checklist("admin-cert","os-admin-cert-meter"),governance=checklist("admin-governance","os-admin-governance-meter");
 $("os-admin-report").addEventListener("click",()=>{
 const snapshot=[["مراجعة الشهادات",qa?.inputs||[]],["قائمة الإدارة",governance?.inputs||[]]].map(([name,inputs])=>[name,...inputs.map(i=>(i.checked?"[x] ":"[ ] ")+i.dataset.description)].join("\n")).join("\n\n");
 const plan=courseDraft||"لم يتم إنشاء مقترح مقرر في هذه الجلسة.";
 download(["NABD EXECUTIVE REVIEW PACK / DRAFT","Local checklist only; no database records changed.","",snapshot,"","PROPOSED COURSE:",plan].join("\n\n"),"NABD-administrative-review.txt");
 line("os-admin-status","تم تنزيل حزمة المراجعة المحلية؛ لا تعني موافقة أو إصدار شهادة.");});
 d.querySelectorAll("[data-os-tab]").forEach(b=>b.addEventListener("click",()=>{const target=d.querySelector('[data-tab="'+b.dataset.osTab+'"]');if(target)target.click()}));
}
function init(){lesson();course();certificates();research();executive()}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init);else init();
})();