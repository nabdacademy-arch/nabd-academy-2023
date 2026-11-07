/* NABD V11 reference-inspired interactive dashboard. Views are educational illustrations.
   Real rotating 3D heart is offered only by the existing opt-in 3D studio. */
(()=>{"use strict";
const d=document,$=id=>d.getElementById(id);
const entries=[
["cardiovascular","🫀","القلب والدورة الدموية","Cardiovascular","heart-3d.svg","القلب (Heart)","Heart","مضخة عضلية قوية تدفع الدم عبر الأوعية، وتنقل الأكسجين والمغذيات لأنسجة الجسم.","The muscular pump circulates blood, oxygen and nutrients throughout the body.",["القلب","الشرايين","الأوردة","الشعيرات"],["Heart","Arteries","Veins","Capillaries"]],
["nervous","🧠","الجهاز العصبي","Nervous","brain-3d.svg","الدماغ والأعصاب","Brain","ينسّق الجهاز العصبي الإشارات والحركة والإدراك ووظائف الأعضاء.","The nervous system coordinates signals, movement, perception and organ functions.",["الدماغ","الخلايا","الأعصاب","المشابك"],["Brain","Neurons","Nerves","Synapses"]],
["respiratory","🫁","الجهاز التنفسي","Respiratory","lungs-3d.svg","الرئتان (Lungs)","Lungs","تنقل الرئتان الأكسجين إلى الدم وتساعدان على طرح ثاني أكسيد الكربون.","The lungs exchange oxygen and carbon dioxide with the blood.",["الرئتان","الشعب","الحويصلات","التنفس"],["Lungs","Bronchi","Alveoli","Breathing"]],
["digestive","🥣","الجهاز الهضمي","Digestive","digestive-3d.svg","الجهاز الهضمي","Digestion","يهضم الغذاء ويسمح بامتصاص العناصر الغذائية والماء.","The digestive tract breaks down food and absorbs nutrients and water.",["المعدة","الكبد","الأمعاء","الامتصاص"],["Stomach","Liver","Intestines","Absorption"]],
["renal","🫘","الجهاز البولي","Renal","renal-3d.svg","الكلى","Kidneys","تنظّم الكليتان توازن الماء والأملاح وتطرحان الفضلات.","Kidneys regulate fluids, electrolytes and waste removal.",["الكلى","النيفرون","الحالب","الترشيح"],["Kidneys","Nephron","Ureter","Filtration"]],
["musculoskeletal","🦴","الجهاز العضلي الهيكلي","Musculoskeletal","musculoskeletal-3d.svg","الهيكل والعضلات","Bones & muscles","العظام والعضلات والمفاصل تؤمّن الدعم والحركة.","Bones, muscles and joints provide support and movement.",["الهيكل","العضلات","العظام","المفاصل"],["Skeleton","Muscles","Bones","Joints"]],
["endocrine","🧬","جهاز الغدد الصماء","Endocrine","endocrine-3d.svg","الغدد الصماء","Glands","تنظّم الهرمونات النمو والاستقلاب وتوازن الجسم.","Hormones help regulate growth, metabolism and homeostasis.",["النخامية","الدرقية","البنكرياس","الهرمونات"],["Pituitary","Thyroid","Pancreas","Hormones"]],
["immune","🛡️","الجهاز المناعي","Immune","immune-3d.svg","المناعة","Immunity","يحمي الجهاز المناعي الجسم من التهديدات البيولوجية ويساعد على تكوين الذاكرة المناعية.","The immune system provides defence and can develop immune memory.",["الخلايا","العقد","الأجسام المضادة","المناعة"],["Cells","Nodes","Antibodies","Defence"]]
];
let current=0,zoom=1,visible=true;
const ar=()=>d.documentElement.lang!=="en";
const path=e=>"./art/"+e[4];
const label=(a,b)=>ar()?a:b;
function e(tag,cl,text){const n=d.createElement(tag);if(cl)n.className=cl;if(text!==undefined)n.textContent=text;return n}
function syncOriginal(entry){const key=entry[4].split("-")[0];const b=d.querySelector('.a3d-item[data-organ="'+key+'"]');if(b&&!b.classList.contains("active"))b.click()}
function notify(msg){const n=$("rdStatus");if(n)n.textContent=msg}
function render(){let x=entries[current];$("rdTitle").textContent=label(x[2],x[3]);$("rdName").textContent=label(x[5],x[6]);$("rdDescription").textContent=label(x[7],x[8]);$("rdStageImage").src=path(x);$("rdStageImage").alt=label("رسم تعليمي مجسّم لـ"+x[2],"Educational illustration of "+x[3]);$("rdPreviewImage").src=path(x);$("rdPreviewImage").alt=label(x[2],x[3]);const list=$("rdSystems");list.replaceChildren();entries.forEach((row,i)=>{const b=e("button","rd-select"+(i===current?" active":""));b.type="button";b.setAttribute("aria-pressed",String(i===current));b.append(e("span","",label(row[2],row[3])),e("span","",row[1]));b.addEventListener("click",()=>select(i));list.append(b)});const thumbs=$("rdThumbs");thumbs.replaceChildren();x[ar()?9:10].forEach((name,i)=>{const b=e("button","rd-thumb"+(i===0?" active":""));b.type="button";const img=e("img");img.src=path(x);img.alt="";img.loading="lazy";const s=e("span","",name);b.append(img,s);b.addEventListener("click",()=>{if(i>0){const target=d.getElementById("visual-atlas");target?.scrollIntoView({behavior:"smooth",block:"start"});notify(label("تفاصيل أكثر متاحة في الاستوديو التشريحي أدناه.","More details are available in the anatomy studio below."))}});thumbs.append(b)});$("rdPulseLabel").textContent=label("رسم تخطيطي توضيحي · ليس قياس نبض حقيقي","Illustrative waveform · not a live heart-rate measurement");$("rdHeartRate").textContent="72";$("rdHeartRate").setAttribute("aria-label",label("عدد افتراضي توضيحي، وليس قياسًا حقيقيًا","Demonstration value, not a live measurement"));$("rdHeartRate").closest(".rd-infocard").hidden=x[0]!=="cardiovascular";$("rdStageImage").style.transform="scale("+zoom+")";$("rdStageImage").style.opacity=visible?"1":"0";$("rdImageLink").href=path(x);$("rdImageLink").setAttribute("aria-label",label("افتح الرسم الكامل لـ"+x[2],"Open full size illustration of "+x[3]));syncOriginal(x)}
function select(i){if(!entries[i])return;current=i;zoom=1;visible=true;$("rdOrgans").checked=true;render()}
function syncLanguage(){render()}
function changeZoom(v){zoom=Math.min(2.4,Math.max(1,Math.round((zoom+v)*10)/10));$("rdStageImage").style.transform="scale("+zoom+")";notify(label("التكبير "+Math.round(zoom*100)+"٪","Zoom "+Math.round(zoom*100)+"%"))}
function gotoStudio(mesh){const s=$("visual-atlas");if(!s)return;s.scrollIntoView({behavior:"smooth",block:"start"});if(mesh){if(current!==0)select(0);window.setTimeout(()=>{const b=$("a3dTrue3D");if(b&&!b.hidden)b.click()},280)}}
function bind(){
$("rdZoomIn").addEventListener("click",()=>changeZoom(.2));$("rdZoomOut").addEventListener("click",()=>changeZoom(-.2));$("rdReset").addEventListener("click",()=>{zoom=1;visible=true;$("rdOrgans").checked=true;render();notify(label("تمت إعادة ضبط العرض","View reset"))});
$("rdOrgans").addEventListener("change",evt=>{visible=evt.target.checked;$("rdStageImage").style.opacity=visible?"1":"0";notify(label("إظهار العضو: "+(visible?"نعم":"لا"),"Show organ: "+(visible?"yes":"no"))});
$("rdReal3D").addEventListener("click",()=>{if(current!==0){notify(label("النموذج الحجمي الحقيقي متاح حاليًا للقلب فقط. اختر القلب أولًا.","A true 3D model is currently available for the heart only."));return}gotoStudio(true)});
$("rdDetails").addEventListener("click",()=>gotoStudio(false));$("rdCross").addEventListener("click",()=>{notify(label("المقاطع التشريحية المنفصلة ليست متاحة بعد؛ فتح استوديو التفاصيل.","True cross sections are not available yet. Opening the detailed anatomy studio."));gotoStudio(false)});
$("rdAR").addEventListener("click",()=>notify(label("الواقع المعزز غير متاح حاليًا. لا نعرض محاكاة AR وهمية.","Augmented reality is not currently supported.")));
$("rdVR").addEventListener("click",()=>{window.location.href="../atlas/hospital-3d.html"});
d.querySelectorAll("[data-rd-tab]").forEach(b=>b.addEventListener("click",()=>{d.querySelectorAll("[data-rd-tab]").forEach(x=>{x.classList.toggle("active",x===b);x.setAttribute("aria-pressed",String(x===b))});const target=b.getAttribute("data-target");if(target){d.getElementById(target)?.scrollIntoView({behavior:"smooth",block:"start"})}}));
const watch=new MutationObserver((list)=>{if(list.some(x=>x.attributeName==="lang"))syncLanguage()});watch.observe(d.documentElement,{attributes:true,attributeFilter:["lang"]});
$("rdImageLink").addEventListener("click",()=>{});
render();
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",bind);else bind();
})();
