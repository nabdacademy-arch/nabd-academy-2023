/*
 * NABD learning visual companion.
 * Educational images are a reviewed allowlist of Wikimedia Commons media.
 * No patient photographs, user-controlled URLs, provider-generated image links, or external code.
 * Media download requires Internet. Only the trusted filename is used for the image URL.
 */
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
export const VISUAL_TOPICS=ITEMS.map(({id,ar,en,file,author,license})=>({id,ar,en,file,author,license}));
export function pickVisualTopics(question,max=2){
 const s=String(question||"").normalize("NFKC");
 return ITEMS.filter(item=>item.match.test(s)).slice(0,Math.max(0,Math.min(2,max)));
}
export function commonsSource(file){return COMMONS+"File:"+encodeURIComponent(file).replace(/%20/g,"_");}
export function commonsImage(file){return COMMONS+"Special:FilePath/"+encodeURIComponent(file).replace(/%20/g,"_")+"?width=700";}
function node(tag,cls,text){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text!==undefined)el.textContent=text;
 return el;
}
export function createVisualCompanion(question,language="ar"){
 const chosen=pickVisualTopics(question);
 if(!chosen.length)return null;
 const ar=language!=="en",key=ar?"ar":"en";
 const section=node("section","nabd-visual-companion");
 section.setAttribute("aria-label",ar?"صور ومخططات تعليمية":"Educational images and diagrams");
 const title=node("h3","nabd-visual-title",ar?"شاهد العضو وافهم الفكرة":"See the organ, understand the concept");
 const intro=node("p","nabd-visual-intro",ar?"رسوم تعليمية مرتبطة بموضوع سؤالك. الصور من Wikimedia Commons وقد تتطلب اتصالًا بالإنترنت.":"Educational illustrations matched to your question. Wikimedia Commons images require Internet.");
 section.append(title,intro);
 const layout=node("div","nabd-visual-grid");
 for(const item of chosen){
  const card=node("article","nabd-visual-card");
  const figure=node("figure","nabd-visual-figure");
  const anchor=document.createElement("a");
  anchor.href=commonsSource(item.file);anchor.target="_blank";anchor.rel="noopener noreferrer";
  const img=document.createElement("img");
  img.src=commonsImage(item.file);img.alt=item.alt[key];img.loading="lazy";img.decoding="async";img.referrerPolicy="no-referrer";
  img.width=500;img.height=410;
  const fallback=node("span","nabd-visual-unavailable",ar?"تعذّر تحميل الصورة، افتحها في المصدر الأصلي.":"Image unavailable. Open the original source.");
  fallback.hidden=true;
  img.addEventListener("error",()=>{img.hidden=true;fallback.hidden=false;});
  anchor.append(img,fallback);
  const caption=node("figcaption","nabd-visual-caption");
  caption.append(node("strong","",item[key]));
  caption.append(node("span","",item.author+" · "+item.license+" · Wikimedia Commons"));
  const open=node("span","nabd-visual-open",ar?"افتح الصورة والمصدر ↗":"View image and attribution ↗");
  caption.append(open);figure.append(anchor,caption);card.append(figure);
  const mapTitle=node("h4","nabd-visual-map-title",ar?"خريطة مبسطة للمسار":"Simplified pathway map");
  const ol=node("ol","nabd-visual-path");
  for(const label of item.path[key])ol.append(node("li","",label));
  card.append(mapTitle,ol);
  layout.append(card);
 }
 section.append(layout);
 const foot=node("p","nabd-visual-foot",ar?"هذه المخططات مبسطة للتعلم وليست أداة تشخيص. يُرجى الرجوع للمراجع الطبية عند التحقق من التفاصيل.":"These simplified teaching diagrams are not diagnostic tools. Verify details against medical references.");
 section.append(foot);
 return section;
}
