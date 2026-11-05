/*
 * NABD learning visual companion.
 * Educational images are a reviewed allowlist of Wikimedia Commons media.
 * No patient photographs, user-controlled URLs, provider-generated image links, or external code.
 * Media download requires Internet. Only the trusted filename is used for the image URL.
 */
import {openAnatomyLightbox} from "./anatomy-lightbox.mjs";
import {createHeartStudio} from "./heart-studio.mjs";
const COMMONS="https://commons.wikimedia.org/wiki/";
const ITEMS=[
 {
  id:"heart",ar:"القلب والدورة الدموية",en:"Heart and circulation",
  match:/(قلب|قلبي|القلب|دور[ةه]\s*(?:الدم|دمو)|شريان|شرايين|أورد[ةه]|وريد|cardi|heart|circulat|arter|vein)/iu,
  file:"Diagram of the human heart.svg",author:"Wapcaplet, Yaddah",license:"CC BY-SA 3.0",
  alt:{ar:"رسم تشريحي للقلب البشري يُظهر الحجرات والصمامات والأوعية الدموية.",en:"Anatomical heart diagram showing chambers, valves and vessels."},
  path:{ar:["الجسم: دم أقل أكسجة","الأذين الأيمن","البطين الأيمن","الرئتان: تبادل الغازات","الأذين الأيسر","البطين الأيسر","الأبهر → الجسم"],en:["Body: lower oxygen blood","Right atrium","Right ventricle","Lungs: gas exchange","Left atrium","Left ventricle","Aorta → body"]}
 },
 {
  id:"lung",ar:"الرئتان والجهاز التنفسي",en:"Lungs and respiratory system",
  match:/(رئ[ةت]|رئت|رئتين|رئوي|تنفس|قصب|حويصلات|تبادل الغازات|lung|respirat|pulmon|alveol|bronch|breath)/iu,
  file:"Respiratory system complete en.svg",author:"LadyofHats, Jmarchn",license:"Public domain",
  alt:{ar:"مخطط للجهاز التنفسي من الأنف والقصبة الهوائية إلى الرئتين.",en:"Respiratory system diagram showing airways and lungs."},
  path:{ar:["الأنف أو الفم","البلعوم والحنجرة","القصبة والشُّعب","الحويصلات الهوائية","انتشار الأكسجين إلى الدم"],en:["Nose or mouth","Pharynx and larynx","Trachea and bronchi","Alveoli","Oxygen diffuses into blood"]}
 },
 {
  id:"brain",ar:"الدماغ والجهاز العصبي",en:"Brain and nervous system",
  match:/(دماغ|المخ|مخيخ|عصب|الأعصاب|قشر[ةه]|النخاع|brain|cerebr|neur|nervous|cortex|stroke)/iu,
  file:"Human head and brain diagram.svg",author:"Patrick J. Lynch, C. Carl Jaffe",license:"CC BY 2.5",
  alt:{ar:"رسم تشريحي جانبي للرأس والدماغ لأغراض التعلم.",en:"Lateral medical illustration of head and brain."},
  path:{ar:["مستقبل حسّي","إشارة عبر الأعصاب","الدماغ: معالجة المعلومات","استجابة عبر الأعصاب","عضلة أو غدة"],en:["Sensory receptor","Nerve signal","Brain: information processing","Nerve response","Muscle or gland"]}
 },
 {
  id:"kidney",ar:"الكلى والجهاز البولي",en:"Kidneys and urinary system",
  match:/(كلي[ةت]|الكلى|كلوي|كلية|الكلي|بول|نيفرون|kidney|renal|nephr|urine)/iu,
  file:"Kidney.svg",author:"Flac",license:"CC BY-SA 3.0",
  alt:{ar:"مقطع تخطيطي للكلية يُظهر الحوض الكلوي والكؤوس والحالب.",en:"Kidney cross-section with renal pelvis, calyces and ureter."},
  path:{ar:["الدم يصل إلى الكلية","الترشيح في النفرون","إعادة امتصاص وتنظيم السوائل","تكوين البول","الحالب → المثانة"],en:["Blood reaches kidney","Filtration in nephrons","Reabsorption and fluid regulation","Urine forms","Ureter → bladder"]}
 },
 {
  id:"digestive",ar:"الجهاز الهضمي",en:"Digestive system",
  match:/(هضم|معد[ةه]|أمعاء|مريء|قولون|مرارة|كبد|digest|stomach|intestin|esophag|colon|liver|gastro)/iu,
  file:"Digestive system without labels.svg",author:"Mariana Ruiz (LadyofHats), Jmarchn",license:"Public domain",
  alt:{ar:"رسم للجهاز الهضمي يُظهر الأعضاء الرئيسية دون تسميات.",en:"Illustration of the principal digestive organs."},
  path:{ar:["الفم","المريء","المعدة","الأمعاء الدقيقة: معظم الامتصاص","الأمعاء الغليظة","المستقيم"],en:["Mouth","Esophagus","Stomach","Small intestine: most absorption","Large intestine","Rectum"]}
 }
];

// Expanded organ atlas: each image below is linked to a specific Commons file page.
// The list is deliberately static and reviewed; no model-generated image URLs are used.
const extra=(id,ar,en,match,file,author,license,altAr,altEn,pathAr,pathEn)=>({
 id,ar,en,match,file,author,license,rank:3,
 alt:{ar:altAr,en:altEn},path:{ar:pathAr,en:pathEn}
});
ITEMS.push(
 extra("liver","الكبد","Liver",/(كبد|الكبد|كبدي|liver|hepat)/iu,
  "Liver Diagram.svg","T Sheasby","CC BY-SA 3.0","رسم تعليمي للكبد والأوعية والقنوات الصفراوية.","Illustrated liver with vessels and biliary structures.",
  ["وريد بابي وشريان كبدي","معالجة المغذيات","إفراز العصارة الصفراوية"],["Portal vein and hepatic artery","Nutrient processing","Bile secretion"]),
 extra("pancreas","البنكرياس","Pancreas",/(بنكرياس|بنكرياسي|pancrea|insulin|أنسولين)/iu,
  "Liver and pancreas - transparent.png","Mikael Häggström","Public domain","رسم لموضع البنكرياس إلى جانب الكبد.","Image showing the pancreas alongside the liver.",
  ["إنزيمات هضمية","تُفرَز إلى الاثني عشر","خلايا صماء تنظّم سكر الدم"],["Digestive enzymes","Released to the duodenum","Endocrine cells regulate glucose"]),
 extra("stomach","المعدة","Stomach",/(معد[ةه]|المعدة|gastr|stomach)/iu,
  "Stomach diagram.svg","Indolences","Wikimedia Commons file license","رسم تخطيطي للمعدة.","Simplified anatomical stomach diagram.",
  ["المريء","المعدة: خلط وهضم","الاثنا عشر"],["Esophagus","Stomach: mixing and digestion","Duodenum"]),
 extra("intestine","الأمعاء","Intestines",/(أمعاء|الأمعاء|قولون|الأمعاء الدقيقة|colonic|intestin|colon|bowel)/iu,
  "Digestive system without labels.svg","LadyofHats, Jmarchn","Public domain","الأمعاء ضمن الجهاز الهضمي الكامل.","Intestines shown within the digestive system.",
  ["الأمعاء الدقيقة: امتصاص","الأمعاء الغليظة: امتصاص الماء","المستقيم"],["Small intestine: absorption","Large intestine: water recovery","Rectum"]),
 extra("gallbladder","المرارة والقنوات الصفراوية","Gallbladder and bile ducts",/(مرار[ةه]|مرارة|صفراوي|biliar|gallbladder|bile duct)/iu,
  "GallbladderAnatomy-en.svg","LukesAnatomy, Angelito7","CC BY-SA 3.0","رسم المرارة والقنوات الصفراوية.","Anatomy of gallbladder and nearby bile ducts.",
  ["الكبد ينتج الصفراء","المرارة تختزنها","تصل إلى الاثني عشر"],["Liver produces bile","Gallbladder stores bile","Bile reaches duodenum"]),
 extra("skeleton","العظام والهيكل العظمي","Skeletal system",/(عظم|عظام|هيكل عظمي|الهيكل|skeleton|skelet|bone|osseous|femur)/iu,
  "Human skeleton front en.svg","LadyofHats","Public domain","رسم أمامي للعظام والهيكل العظمي البشري.","Frontal human skeletal system illustration.",
  ["هيكل محوري","هيكل طرفي","دعم وحماية وحركة"],["Axial skeleton","Appendicular skeleton","Support, protection and movement"]),
 extra("muscles","العضلات","Muscular system",/(عضل|العضلات|muscl|myofibril|عضلي)/iu,
  "Muscular system.svg","Termininja","CC BY-SA 3.0","رسم للعضلات الهيكلية الرئيسية.","Diagram of the main skeletal muscles.",
  ["إشارة عصبية","انقباض ألياف عضلية","حركة أو ثبات"],["Nerve signal","Muscle fiber contraction","Movement or posture"]),
 extra("eye","العين والإبصار","Eye and vision",/(العين|عيون|بصر|شبكي[ةه]|قرني[ةه]|vision|retina|cornea|optic|eye anatomy)/iu,
  "Schematic diagram of the human eye.svg","Erin Silversmith, Jmarchn","CC BY-SA 3.0","مقطع تخطيطي للعين وعدستها وشبكيتها.","Human eye cross-section with lens and retina.",
  ["القرنية","العدسة","الشبكية","العصب البصري"],["Cornea","Lens","Retina","Optic nerve"]),
 extra("ear","الأذن والسمع","Ear and hearing",/(أذن|الأذن|سمع|قوقع[ةه]|طنبل|ear anatom|hearing|cochle|auditor)/iu,
  "Anatomy of the Human Ear.svg","Lars Chittka, Axel Brockmann","CC BY 2.5","رسم تشريحي للأذن الخارجية والوسطى والداخلية.","Anatomical diagram of outer, middle and inner ear.",
  ["صيوان الأذن","طبلة وعظيمات السمع","القوقعة","العصب السمعي"],["Outer ear","Eardrum and ossicles","Cochlea","Auditory nerve"]),
 extra("skin","الجلد وطبقاته","Skin layers",/(جلد|الجلد|بشر[ةه]|أدم[ةه]|dermis|epiderm|skin)/iu,
  "Skin layers.svg","Madhero88, M.Komorniczak","CC BY-SA 3.0","طبقات الجلد والبنى داخلها.","Skin layers with associated structures.",
  ["البشرة","الأدمة","النسيج تحت الجلد"],["Epidermis","Dermis","Subcutaneous tissue"]),
 extra("thyroid","الغدة الدرقية","Thyroid regulation",/(درقي[ةه]|الدرقية|غد[ةه]\s*درقي|thyroid|thyrox|tsh\b)/iu,
  "Thyroid system.svg","Mikael Häggström","CC0 / Public domain","مخطط محور تنظيم هرمونات الغدة الدرقية.","Thyroid hormone regulatory system diagram.",
  ["الوطاء","النخامية: TSH","الدرقية: T3 وT4","تغذية راجعة"],["Hypothalamus","Pituitary: TSH","Thyroid: T3 and T4","Feedback loop"]),
 extra("urinary","المثانة والجهاز البولي","Urinary system",/(مثان[ةه]|الحالب|الإحليل|urinary|bladder|ureter|urethra)/iu,
  "Urinary system.svg","Wikimedia Commons contributors","Wikimedia Commons file license","مخطط للجهاز البولي والكليتين والحالب والمثانة.","Diagram of kidneys, ureters and urinary bladder.",
  ["الكليتان: إنتاج البول","الحالبان","المثانة: التخزين","الإحليل"],["Kidneys: urine formation","Ureters","Bladder: storage","Urethra"]),
 extra("reproductive","الرحم والمبيضان","Uterus and ovaries",/(رحم|الرحم|مبيض|المبيض|قناتي فالوب|uterus|uterine|ovary|ovaries|fallopian|reproduct)/iu,
  "Basic Female Reproductive System (English).svg","Wikimedia Commons contributors","CC BY-SA 4.0","رسم مبسط للرحم والمبيضين وقناتي فالوب.","Frontal diagram of uterus, ovaries and fallopian tubes.",
  ["المبيض","قناة فالوب","الرحم","عنق الرحم"],["Ovary","Fallopian tube","Uterus","Cervix"]),
 extra("body","خريطة أعضاء الجسم","Whole body anatomy",/(جسم الإنسان|أعضاء الجسم|جميع الأعضاء|أنظمة الجسم|human body|all organs|anatomy overview)/iu,
  "Internal organs.svg","Mikael Häggström","Public domain","مخطط عام لبعض الأعضاء الداخلية في الجسم.","Overview of several major internal organs.",
  ["الرأس والجذع","الصدر: قلب ورئتان","البطن: كبد ومعدة وأمعاء","الحوض"],["Head and torso","Chest: heart and lungs","Abdomen: liver, stomach, intestines","Pelvis"])
);

export const VISUAL_TOPICS=ITEMS.map(({id,ar,en,file,author,license})=>({id,ar,en,file,author,license}));
export function pickVisualTopics(question,max=3){
 const s=String(question||"").normalize("NFKC");
 return ITEMS.filter(item=>item.match.test(s))
  .sort((a,b)=>(b.rank||0)-(a.rank||0))
  .slice(0,Math.max(0,Math.min(3,max)));
}
export function commonsSource(file){return COMMONS+"File:"+encodeURIComponent(file).replace(/%20/g,"_");}
export function commonsImage(file,width=700){return COMMONS+"Special:FilePath/"+encodeURIComponent(file).replace(/%20/g,"_")+"?width="+(width===1600?1600:700);}
function node(tag,cls,text){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text!==undefined)el.textContent=text;
 return el;
}
const SYMBOLS={
 heart:"🫀",lung:"🫁",brain:"🧠",kidney:"💧",digestive:"◎",liver:"◈",pancreas:"◇",
 stomach:"♧",intestine:"〰",gallbladder:"◉",skeleton:"🦴",muscles:"◆",
 eye:"👁",ear:"◖",skin:"▤",thyroid:"✦",urinary:"♢",reproductive:"✿",body:"♧"
};
export function createVisualCompanion(question,language="ar"){
 const chosen=pickVisualTopics(question);
 const ar=language!=="en",key=ar?"ar":"en";
 const section=node("section","nabd-visual-companion");
 section.setAttribute("aria-label",ar?"أطلس الأعضاء والرسوم التفاعلية":"Interactive organ atlas");
 const title=node("h3","nabd-visual-title",ar?"أطلس نبض التفاعلي • شاهد وجرّب":"NABD Visual Atlas • Explore and learn");
 const intro=node("p","nabd-visual-intro",ar?"اضغط أي صورة لتكبيرها حتى 400%، واستكشف الأعضاء والمسارات الطبية. الصور موثقة من Wikimedia Commons.":"Tap an image to enlarge up to 400%; explore organs and their pathways. Illustrations are sourced from Wikimedia Commons.");
 section.append(title,intro);
 const layout=node("div","nabd-visual-grid");
 function makeCard(item){
  const card=node("article","nabd-visual-card");
  card.dataset.organ=item.id;
  const figure=node("figure","nabd-visual-figure");
  const preview=node("button","nabd-visual-zoom");
  preview.type="button";
  preview.setAttribute("aria-label",(ar?"كبّر صورة ":"Enlarge image: ")+item[key]);
  const img=document.createElement("img");
  img.src=commonsImage(item.file);img.alt=item.alt[key];img.loading="lazy";img.decoding="async";img.referrerPolicy="no-referrer";
  img.width=500;img.height=410;
  const prompt=node("span","nabd-visual-zoom-hint",ar?"اضغط للتكبير ↗":"Tap to zoom ↗");
  const fallback=node("span","nabd-visual-unavailable",ar?"الصورة غير متاحة، افتح المصدر الأصلي أدناه.":"Image not available; open the source below.");
  fallback.hidden=true;
  img.addEventListener("error",()=>{img.hidden=true;fallback.hidden=false;});
  preview.append(img,fallback,prompt);
  preview.addEventListener("click",()=>openAnatomyLightbox(item,language,preview));
  const caption=node("figcaption","nabd-visual-caption");
  caption.append(node("strong","",item[key]));
  caption.append(node("span","",item.author+" · "+item.license+" · Wikimedia Commons"));
  const source=node("a","nabd-visual-open",ar?"عرض المصدر والترخيص ↗":"View source and license ↗");
  source.href=commonsSource(item.file);source.target="_blank";source.rel="noopener noreferrer";
  caption.append(source);figure.append(preview,caption);card.append(figure);
  const mapTitle=node("h4","nabd-visual-map-title",ar?"المسار الوظيفي المبسّط":"Simplified functional pathway");
  const path=node("ol","nabd-visual-path");
  for(const text of item.path[key])path.append(node("li","",text));
  card.append(mapTitle,path);
  if(item.id==="heart")card.append(createHeartStudio(language));
  return card;
 }
 function render(items){
  layout.replaceChildren(...items.map(makeCard));
 }
 render(chosen);
 if(!chosen.length)section.append(node("p","nabd-visual-empty",ar?"لا توجد صورة تلقائية لهذا السؤال؛ يمكنك اختيار عضو من المكتبة أدناه.":"No automatic image for this question. Choose an organ from the atlas below."));
 section.append(layout);
 const browse=node("details","nabd-organ-browser");
 const summary=node("summary","",ar?"📚 استكشف مكتبة "+ITEMS.length+" عضوًا وجهازًا":"📚 Browse "+ITEMS.length+" organs and systems");
 browse.append(summary);
 const chips=node("div","nabd-organ-picker");
 const buttons=[];
 for(const item of ITEMS){
  const button=node("button","nabd-organ-choice",(SYMBOLS[item.id]||"◇")+" "+item[key]);
  button.type="button";button.dataset.organChoice=item.id;button.setAttribute("aria-pressed",String(chosen.some(c=>c.id===item.id)));
  button.addEventListener("click",()=>{
   render([item]);
   for(const b of buttons)b.setAttribute("aria-pressed",String(b===button));
   browse.open=false;
   layout.scrollIntoView?.({behavior:"smooth",block:"nearest"});
  });
  buttons.push(button);chips.append(button);
 }
 browse.append(chips);
 section.append(browse);
 const foot=node("p","nabd-visual-foot",ar?"رسم القلب المتحرك محاكاة مجسّمة المظهر (2.5D)، وليس تصويرًا حيًا أو نموذجًا ثلاثي الأبعاد دقيقًا. بقية الصور رسومات ثابتة قابلة للتكبير؛ لا تُستخدم للتشخيص.":"The moving heart is a 2.5D-style schematic, not live imaging or a precise 3D anatomy model. Other illustrations are zoomable static references, not diagnostic tools.");
 section.append(foot);
 return section;
}
