/* NABD Academic Core: enhancements for Academy, Campus, Global Lectures, Medical Knowledge.
 No server calls, storage, clinical decisions or external script dependencies. */
(function(){"use strict";
const d=document,$=id=>d.getElementById(id),en=()=>d.documentElement.lang==="en";
const tr=(ar,english)=>en()?english:ar;
const node=(tag,cls,txt)=>{const e=d.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
const routes=[
["student","◈","بوابة الطالب","Student Portal","حسابك ومقرراتك وشهاداتك","Courses, certificates and your account","portal.html","student"],
["learning","✳","عالم الطالب","Learning Universe","الدروس والمراجعة ومصادر التعلّم","Learning, revision and study resources","learning/","student lecturer"],
["atlas","♥","أطلس نبض الطبي","NABD ATLAS","مختبرات التشريح والتعلّم التفاعلي","Anatomy labs and interactive learning","atlas/","student lecturer"],
["infinity","✧","منظومة NABD INFINITY","NABD INFINITY","التشريح ثلاثي الأبعاد والمهام التعليمية","3D teaching objects and learning missions","infinity/","student lecturer"],
["knowledge","▤","مركز المعرفة الطبية","Medical Knowledge Center","16 تخصصًا ومصادر عامة للمراجعة","16 specialties and educational references","nabd-medical-knowledge.html","student lecturer research"],
["lectures","◉","برنامج المحاضرات الدولية","Global Lectures","مبادرة محاضرات قيد الإعداد","Emerging international lectures initiative","global-lectures.html","student lecturer research"],
["lecturer","⌘","استوديو المحاضر","Lecturer Studio","تدريس وموارد وفق صلاحيات الحساب","Teaching tools under existing permissions","lecturers.html","lecturer"],
["passport","◇","جواز المهارات","Skill Passport","مهارات وسجلات تعلم موجودة","Skills and existing learning records","skill-passport.html","student lecturer"],
["researchlab","✷","مختبر الباحث الناشئ","Research Starter Lab","سؤال PICO ومسودات بحث أولية","PICO questions and preliminary outlines","research-starter-lab.html","student lecturer research"],
["researchnet","◎","شبكة البحث العالمية","Global Research Network","مبادرة التواصل والتثقيف البحثي","Emerging research network and literacy","nabd-global-research.html","research lecturer"],
["campus","▣","الحرم الرقمي","Digital Campus","خدمات أكاديمية نبض في مكان واحد","Academy services in one place","nabd-campus.html","student lecturer research leadership"],
["volunteer","✦","متابعة طلبات التطوع","Volunteer Applications","متابعة الطلبات المؤسسية","Institutional application status","application-status.html","leadership"],
["scholarships-manager","✦","مدير المنح الخارجية والدولية","International Scholarships Manager","بوابة خاصة للموظف المخوّل بنشر المنح الدولية وتعديلها","Restricted staff portal for international scholarship publishing","scholarship-manager.html","leadership"],
["scholarships-news","🌍","أخبار المنح الخارجية والدولية","International Scholarship News","المنح المنشورة وروابط التقديم الرسمية","Published opportunities and official application links","scholarships.html","student leadership research"],
["partners","⌬","مركز الشراكات والأثر","Partnerships & Impact","مبادرات تعاون ودعم مقترحة","Proposed academic support initiatives","nabd-partners.html","leadership research"]
];
const tracks=[
{value:"foundations",ar:"أساسيات العلوم الطبية",en:"Medical foundations",url:"atlas/",arSteps:["حدد مفهومًا أساسيًا في التشريح أو الفسيولوجيا.","دوّن سؤالين قبل المحاضرة، واربطهما بدرس من أطلس نبض.","بعدها راجع المصدر واكتب ما فهمته وما لم يتضح بعد."],enSteps:["Choose a core anatomy or physiology topic.","Prepare two questions linked to an ATLAS lesson.","Afterward, review the source and record remaining questions."]},
{value:"clinical",ar:"التفكير السريري",en:"Clinical reasoning",url:"atlas/clinical-hub.html",arSteps:["راجع مفاهيم فسيولوجية قبل محاكاة أي حالة.","حضّر سؤالًا علميًا دون بيانات مريض حقيقي.","راجع حالة تعليمية خيالية في مستشفى نبض."],enSteps:["Review physiology before fictional case learning.","Prepare a general question without real patient data.","Revise a fictional NABD clinical exercise."]},
{value:"public",ar:"الصحة العامة والطوارئ",en:"Public health and emergencies",url:"nabd-medical-knowledge.html",arSteps:["اختر موضوعًا موثوقًا في الصحة العامة.","سجل سؤالًا عن الوقاية على مستوى المجتمع.","اكتب ملخصًا مع المصدر وتاريخ الاطلاع."],enSteps:["Choose a trusted public-health topic.","Record a population-level prevention question.","Summarize with its source and access date."]},
{value:"research",ar:"البحث العلمي والمهارات",en:"Research methods",url:"research-starter-lab.html",arSteps:["اكتب سؤال بحث باستخدام PICO دون بيانات أشخاص.","تحقق من DOI أو PMID في مصدر رسمي.","دوّن حدود الدليل وافتح مختبر الباحث الناشئ."],enSteps:["Draft a PICO question without personal data.","Verify DOI or PMID at an authoritative source.","Note evidence limitations and open the starter lab."]}
];
const quiz=[
{area:"base",ar:"أين يحدث تبادل الغازات في الرئتين غالبًا؟",en:"Where does most gas exchange occur in the lungs?",arOpts:["الحويصلات الهوائية","المريء","الحنجرة"],enOpts:["Alveoli","Oesophagus","Larynx"],correct:0,arWhy:"تنتشر الغازات عبر الحاجز السنخي الشعيري.",enWhy:"Gases diffuse across the alveolar-capillary interface."},
{area:"base",ar:"ما البنية الأساسية لنقل الإشارات بين عصبونين؟",en:"Where are signals transmitted between neurons?",arOpts:["الكبيبة","المشبك العصبي","الحالب"],enOpts:["Glomerulus","Synapse","Ureter"],correct:1,arWhy:"المشبك منطقة اتصال عصبي كيميائي أو كهربائي.",enWhy:"A synapse is a chemical or electrical neural junction."},
{area:"base",ar:"ما وظيفة صمامات القلب؟",en:"What is a primary function of heart valves?",arOpts:["توجيه جريان الدم","توليد الأنسولين","إنتاج خلايا الدم"],enOpts:["Maintain one-way flow","Produce insulin","Create blood cells"],correct:0,arWhy:"تساعد الصمامات على منع الارتداد غير الطبيعي للدم.",enWhy:"Valves help prevent backward blood flow."},
{area:"base",ar:"أين يبدأ الترشيح في النيفرون؟",en:"Where does nephron filtration begin?",arOpts:["المثانة","الكبيبة","القصبة الهوائية"],enOpts:["Bladder","Glomerulus","Trachea"],correct:1,arWhy:"يبدأ ترشيح الدم في الشعيرات الكبيبية.",enWhy:"Filtration starts in the glomerular capillaries."},
{area:"base",ar:"ما الموقع الرئيسي لامتصاص المغذيات؟",en:"Where are most nutrients absorbed?",arOpts:["الأمعاء الدقيقة","المريء","المثانة"],enOpts:["Small intestine","Oesophagus","Bladder"],correct:0,arWhy:"تزيد الزغابات المعوية مساحة الامتصاص.",enWhy:"Intestinal villi increase absorption surface area."},
{area:"research",ar:"ما الذي يرمز إليه الحرف P في PICO؟",en:"What does P represent in PICO?",arOpts:["الفئة السكانية","المقارنة","النتيجة"],enOpts:["Population","Comparison","Outcome"],correct:0,arWhy:"P تعني الفئة السكانية أو المجموعة المدروسة.",enWhy:"P denotes population or patient group."},
{area:"research",ar:"كيف تتحقق من مرجع منشور؟",en:"How do you validate a research citation?",arOpts:["التحقق من DOI أو PMID","اعتماد عنوان مولد","تجاهل المؤلف"],enOpts:["Verify DOI or PMID","Trust a generated title","Ignore the author"],correct:0,arWhy:"التحقق المباشر من المعرّفات يحدّ من المراجع الخاطئة.",enWhy:"Verifying source identifiers reduces false citations."},
{area:"research",ar:"ما الذي ينبغي استبعاده من تمرين بحث علني؟",en:"What should be excluded from public research exercises?",arOpts:["بيانات مرضى معرّفة","سؤال عام","موضوع منهجي"],enOpts:["Identifiable patient data","General question","Methodology topic"],correct:0,arWhy:"يجب حماية خصوصية المرضى في جميع التمارين العامة.",enWhy:"Patient privacy requires avoiding identifiable information."}
];
function initRoutes(){
 const input=$("nc-route-query"),role=$("nc-route-role"),grid=$("nc-route-grid");if(!grid||!input||!role)return;
 function render(){const term=input.value.trim().toLocaleLowerCase(),category=role.value;const found=routes.filter(r=>(category==="all"||r[7].split(" ").includes(category))&&(!term||[r[2],r[3],r[4],r[5],r[0]].join(" ").toLocaleLowerCase().includes(term)));grid.replaceChildren();
 found.forEach(r=>{const a=node("a","ncore-card");a.href=r[6];a.append(node("span","ncore-icon",r[1]),node("span","ncore-meta",r[0].toUpperCase()),node("h3","",tr(r[2],r[3])),node("p","",tr(r[4],r[5])),node("span","ncore-arrow",tr("افتح المسار ←","Open pathway →")));grid.append(a)});
 $("nc-route-count").textContent=tr("المسارات المعروضة: ","Visible pathways: ")+found.length+" / "+routes.length;$("nc-route-empty").hidden=found.length!==0;
 }
 $("nc-build-route").addEventListener("click",()=>{const byRole={all:["student","learning","knowledge"],student:["student","learning","passport"],lecturer:["lecturer","lectures","learning"],research:["knowledge","researchlab","researchnet"],leadership:["campus","partners","volunteer"]};const out=$("nc-route-plan");const list=node("ol");(byRole[role.value]||byRole.all).forEach(key=>{const r=routes.find(x=>x[0]===key);const li=node("li"),a=node("a","",tr(r[2],r[3]));a.href=r[6];li.append(a);list.append(li)});out.replaceChildren(node("h3","",tr("خطة بداية من ثلاث خطوات","Three starting steps")),list,node("p","",tr("اقتراح توجيهي وليس تسجيلًا أو قبولًا تلقائيًا.","Suggested steps, not automatic registration or admission.")));out.hidden=false});
 input.addEventListener("input",render);role.addEventListener("change",render);new MutationObserver(render).observe(d.documentElement,{attributes:true,attributeFilter:["lang"]});render();
}
let plan="";
function initLectures(){
 const form=$("nc-lecture-form");if(!form)return;const select=$("nc-lecture-track"),goal=$("nc-lecture-goal"),preview=$("nc-lecture-preview"),status=$("nc-lecture-status");
 function build(){const track=tracks.find(x=>x.value===select.value)||tracks[0],steps=en()?track.enSteps:track.arSteps,objective=goal.value.trim().slice(0,180);plan=[tr("دفتر التحضير الشخصي — نبض","NABD personal lecture preparation"),tr("المسار: ","Track: ")+tr(track.ar,track.en),objective?tr("هدفي: ","My goal: ")+objective:""].concat(steps.map((s,i)=>(i+1)+". "+s)).concat([new URL(track.url,location.href).href,tr("ليست جلسة مؤكدة أو موعدًا معلنًا.","Not a confirmed lecture or scheduled event.")]).filter(Boolean).join("\n\n");
 preview.replaceChildren();preview.append(node("h3","",tr(track.ar,track.en)),node("p","",objective?tr("هدفي: ","Goal: ")+objective:tr("خطة تحضير مستقلة","Independent preparation plan")));const list=node("ol");steps.forEach(s=>list.append(node("li","",s)));preview.append(list);const a=node("a","ncore-button",tr("افتح مورد المراجعة ←","Open study resource →"));a.href=track.url;preview.append(a);status.textContent=tr("خطة شخصية داخل المتصفح؛ لا يُرسل شيء.","Personal in-browser plan; nothing is submitted.") }
 form.addEventListener("submit",ev=>{ev.preventDefault();build()});select.addEventListener("change",build);
 $("nc-copy-lecture").addEventListener("click",async()=>{if(!plan)build();let ok=false;try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(plan);ok=true}else{const ta=node("textarea");ta.value=plan;ta.style.cssText="position:fixed;opacity:0";d.body.append(ta);ta.select();ok=d.execCommand("copy");ta.remove()}}catch(e){}status.textContent=ok?tr("تم نسخ خطة التحضير.","Preparation copied."):tr("تعذر النسخ، جرّب تنزيل الملف.","Copy unavailable; use text export.")});
 $("nc-download-lecture").addEventListener("click",()=>{if(!plan)build();const url=URL.createObjectURL(new Blob(["\ufeff"+plan],{type:"text/plain;charset=utf-8"}));const a=node("a");a.href=url;a.download="NABD-lecture-preparation.txt";d.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)});
 new MutationObserver(build).observe(d.documentElement,{attributes:true,attributeFilter:["lang"]});build();
}
function initKnowledge(){
 const root=$("nc-quiz");if(!root)return;let mode="all",index=0,score=0,answered=false,chosen=-1,complete=false;
 const filtered=()=>quiz.filter(x=>mode==="all"||x.area===mode);
 function render(){const set=filtered(),item=set[index],answers=$("nc-quiz-answers");answers.replaceChildren();$("nc-quiz-progress").textContent=complete?tr("انتهى التدريب","Review complete"):tr("السؤال ","Question ")+(index+1)+" / "+set.length;
 if(complete){$("nc-quiz-question").textContent=tr("نتيجتك: ","Your score: ")+score+" / "+set.length;$("nc-quiz-feedback").textContent=tr("هذه مراجعة ذاتية لا تُحفظ في حسابك.","This self-check is not saved to your account.");$("nc-quiz-next").hidden=false;$("nc-quiz-next").textContent=tr("أعد التدريب ↺","Try again ↺");return}
 $("nc-quiz-question").textContent=en()?item.en:item.ar;
 (en()?item.enOpts:item.arOpts).forEach((ans,i)=>{const b=node("button","ncore-answer",ans);b.type="button";if(answered){b.disabled=true;if(i===item.correct)b.classList.add("correct");else if(i===chosen)b.classList.add("wrong")}else b.addEventListener("click",()=>{answered=true;chosen=i;if(i===item.correct)score++;render()});answers.append(b)});
 $("nc-quiz-feedback").textContent=answered?(chosen===item.correct?tr("صحيح! ","Correct! "):tr("راجع المفهوم: ","Review: "))+(en()?item.enWhy:item.arWhy):"";
 $("nc-quiz-next").hidden=!answered;$("nc-quiz-next").textContent=index===set.length-1?tr("عرض النتيجة","See results"):tr("التالي ←","Next →");
 }
 function reset(next){mode=next;index=0;score=0;answered=false;chosen=-1;complete=false;$("nc-quiz-filters").querySelectorAll("[data-area]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.area===mode)));render()}
 $("nc-quiz-filters").querySelectorAll("[data-area]").forEach(b=>b.addEventListener("click",()=>reset(b.dataset.area)));
 $("nc-quiz-next").addEventListener("click",()=>{if(complete){reset(mode);return}if(!answered)return;if(index===filtered().length-1)complete=true;else{index++;answered=false;chosen=-1}render()});
 new MutationObserver(render).observe(d.documentElement,{attributes:true,attributeFilter:["lang"]});render();
}
function init(){if($("nc-route-grid"))initRoutes();if($("nc-lecture-form"))initLectures();if($("nc-quiz"))initKnowledge()}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init);else init();
})();