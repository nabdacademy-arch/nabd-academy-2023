/**
 * NABD KNOWLEDGE ATLAS — first-party curated educational concept map.
 * Images: same manually curated Wikimedia Commons organ media as the anatomy lab.
 * Concept summaries are short, introductory teaching notes, NOT diagnosis.
 * All references are existing NABD Academy source identifiers.
 */
export const SYSTEMS=[
 ["cardio","القلب والدورة الدموية","Cardiovascular","🫀","الدورة الدموية وتوزيع الأكسجين","Circulation and oxygen delivery","heart,blood,lungs,oxygen,hemoglobin,vessels,pressure,arteries,veins"],
 ["respiratory","الجهاز التنفسي","Respiratory","🫁","الهواء وتبادل الغازات والتنفس","Airflow, gas exchange and breathing","lung,trachea,alveoli,diaphragm,oxygen,hemoglobin,blood"],
 ["nervous","الجهاز العصبي","Nervous","🧠","الإشارات العصبية والإحساس والتحكم","Signals, sensation and control","brain,neuron,spinal,eye,ear,muscles,nerves"],
 ["digestive","الجهاز الهضمي","Digestive","◈","الهضم والامتصاص ووظائف الأعضاء","Digestion, absorption and organ function","digestive,stomach,liver,pancreas,intestine,gallbladder,nutrients"],
 ["renal","الجهاز البولي والكلى","Urinary & renal","💧","تنظيم السوائل والترشيح وإنتاج البول","Fluid regulation, filtration and urine","kidney,nephron,urinary,bladder,ureter,blood,electrolytes"],
 ["muscular","العضلات والعظام","Musculoskeletal","🦴","الدعم والحركة والمفاصل","Support, movement and joints","skeleton,muscles,joints,tendons,brain,nerves,calcium"],
 ["senses","الحواس والجلد","Sensory","👁","الإبصار والسمع والإحساس والحماية","Vision, hearing, sensation and protection","eye,ear,skin,brain,nerves,optic,spinal"],
 ["endocrine","الغدد والهرمونات","Endocrine","✦","التحكم الهرموني والتمثيل الغذائي","Hormones and metabolism","thyroid,pancreas,insulin,pituitary,glucose,liver,metabolism"],
 ["reproductive","الجهاز التناسلي","Reproductive","✿","الأعضاء والهرمونات والتكاثر","Reproductive organs and hormonal control","reproductive,ovary,uterus,fallopian,hormones,pituitary,blood"],
 ["immune","المناعة والدفاع","Immune","✺","خلايا المناعة والحواجز الواقية","Immune cells and protective barriers","whitecells,lymph,spleen,skin,blood,lungs,bone-marrow"]
].map(([id,ar,en,icon,subtitleAr,subtitleEn,ids])=>({id,ar,en,icon,subtitleAr,subtitleEn,ids:ids.split(",")}));
/* id, Arabic title, English title, Arabic description, English description, media catalog id, category, related ids */
const DATA=[
 ["heart","القلب","Heart","عضو عضلي يدفع الدم إلى الرئتين ثم إلى سائر الجسم.","Muscular pump sending blood through pulmonary and systemic circulation.","heart","anatomy","blood,lungs,vessels,pressure,hemoglobin,arteries,veins"],
 ["blood","الدم","Blood","نسيج سائل ينقل الغازات والمغذيات ومواد الدفاع.","Fluid tissue transporting gases, nutrients and immune components.",null,"physiology","heart,oxygen,hemoglobin,vessels,whitecells"],
 ["lungs","الرئتان","Lungs","موضع تبادل الأكسجين وثاني أكسيد الكربون مع الدم.","Site of oxygen and carbon dioxide exchange with blood.","lung","anatomy","heart,alveoli,oxygen,trachea,diaphragm,blood"],
 ["oxygen","الأكسجين","Oxygen","غاز ضروري لكثير من عمليات إنتاج الطاقة في الخلايا.","Gas needed for many cellular energy-producing reactions.",null,"physiology","lungs,alveoli,hemoglobin,blood,metabolism"],
 ["hemoglobin","الهيموغلوبين","Hemoglobin","بروتين في خلايا الدم الحمراء يرتبط بالأكسجين وينقله.","Protein in red blood cells binding and carrying oxygen.",null,"physiology","blood,oxygen,lungs,heart"],
 ["vessels","الأوعية الدموية","Blood vessels","شبكة شرايين وأوردة وشعيرات تنقل الدم وتتيح التبادل.","Arteries, veins and capillaries move blood and enable exchange.",null,"anatomy","heart,arteries,veins,pressure,blood"],
 ["pressure","ضغط الدم","Blood pressure","قوة يمارسها الدم على جدران الأوعية الدموية.","Force exerted by blood against vessel walls.",null,"physiology","heart,vessels,arteries,kidney,blood"],
 ["arteries","الشرايين","Arteries","أوعية تحمل الدم بعيدًا عن القلب، غالبًا تحت ضغط أعلى.","Vessels carrying blood away from the heart, generally at higher pressure.",null,"anatomy","heart,vessels,pressure,veins"],
 ["veins","الأوردة","Veins","أوعية تعيد الدم نحو القلب وتحتوي كثير منها على صمامات.","Vessels returning blood toward the heart; many contain valves.",null,"anatomy","heart,blood,vessels,arteries"],
 ["trachea","القصبة الهوائية","Trachea","مجرى هوائي يوصل الهواء إلى الشعب داخل الرئتين.","Airway carrying air toward the bronchi and lungs.","lung","anatomy","lungs,alveoli,diaphragm"],
 ["alveoli","الحويصلات الهوائية","Alveoli","أكياس هوائية دقيقة ينتشر عبر جدرانها الأكسجين وثاني أكسيد الكربون.","Tiny air sacs across which oxygen and carbon dioxide diffuse.","lung","physiology","lungs,oxygen,hemoglobin,blood"],
 ["diaphragm","الحجاب الحاجز","Diaphragm","عضلة رئيسية تساهم في تغيير حجم الصدر أثناء التنفس.","Key muscle changing thoracic volume during breathing.","lung","anatomy","lungs,trachea,muscles"],
 ["brain","الدماغ","Brain","مركز معالجة الإشارات العصبية وتنسيق وظائف عديدة.","Integrates nerve signals and coordinates many functions.","brain","anatomy","neuron,spinal,nerves,eye,ear,muscles"],
 ["neuron","الخلية العصبية","Neuron","خلية متخصصة في إرسال الإشارات الكهربائية والكيميائية.","Specialized cell transmitting electrical and chemical signals.","brain","physiology","brain,spinal,nerves,muscles"],
 ["spinal","الحبل الشوكي","Spinal cord","مسار رئيسي لنقل الإشارات بين الدماغ والجسم.","Major signal pathway between brain and body.","brain","anatomy","brain,neuron,nerves,muscles"],
 ["nerves","الأعصاب","Nerves","حزم ألياف تنقل المعلومات الحسية والحركية.","Bundles of fibers carrying sensory and motor information.","brain","anatomy","brain,neuron,spinal,muscles,skin"],
 ["eye","العين","Eye","عضو الإبصار يحول الضوء إلى إشارات عصبية.","Organ of vision converting light into neural signals.","eye","anatomy","brain,optic,nerves"],
 ["optic","العصب البصري","Optic nerve","ينقل الإشارات البصرية من الشبكية إلى الدماغ.","Carries visual information from retina toward the brain.","eye","anatomy","eye,brain,nerves"],
 ["ear","الأذن","Ear","تسهم في السمع والتوازن عبر بنيات الأذن الداخلية.","Supports hearing and balance through inner-ear structures.","ear","anatomy","brain,nerves"],
 ["digestive","الجهاز الهضمي","Digestive tract","منظومة تعالج الطعام وتتيح هضم المغذيات وامتصاصها.","System processing food, digesting and absorbing nutrients.","digestive","anatomy","stomach,intestine,liver,pancreas,gallbladder,nutrients"],
 ["stomach","المعدة","Stomach","عضو يخزن الطعام مؤقتًا ويمزجه بالعصارات الهضمية.","Organ temporarily storing food and mixing it with digestive secretions.","stomach","anatomy","digestive,intestine,pancreas"],
 ["liver","الكبد","Liver","يعالج موادًا ممتصة وينتج الصفراء وله أدوار استقلابية متنوعة.","Processes absorbed substances, produces bile and supports metabolism.","liver","anatomy","digestive,gallbladder,pancreas,nutrients,glucose"],
 ["pancreas","البنكرياس","Pancreas","غدة تفرز إنزيمات هضمية وهرمونات تنظم سكر الدم.","Gland releasing digestive enzymes and glucose-regulating hormones.","pancreas","anatomy","digestive,insulin,glucose,liver,stomach"],
 ["intestine","الأمعاء","Intestines","مكان رئيسي للهضم النهائي وامتصاص كثير من المغذيات.","Major site of final digestion and nutrient absorption.","intestine","anatomy","digestive,stomach,nutrients,liver"],
 ["gallbladder","المرارة","Gallbladder","تخزن الصفراء وتطلقها للمساعدة في هضم الدهون.","Stores and releases bile to aid fat digestion.","gallbladder","anatomy","liver,digestive,intestine"],
 ["nutrients","المغذيات","Nutrients","مواد يستخلصها الجسم من الغذاء لتوفير الطاقة والبناء.","Food-derived substances supplying energy and building materials.",null,"physiology","intestine,digestive,liver,blood,metabolism"],
 ["kidney","الكلى","Kidneys","ترشح البلازما وتضبط السوائل والأملاح وتنتج البول.","Filter plasma, regulate fluid and electrolytes and produce urine.","kidney","anatomy","nephron,urinary,blood,pressure,electrolytes"],
 ["nephron","النفرون","Nephron","الوحدة الوظيفية لترشيح السوائل وتعديل الراشح في الكلية.","Functional kidney unit filtering and modifying fluid.","kidney","physiology","kidney,urinary,electrolytes"],
 ["urinary","الجهاز البولي","Urinary system","منظومة الكليتين والحالبين والمثانة والإحليل.","System of kidneys, ureters, bladder and urethra.","urinary","anatomy","kidney,ureter,bladder,nephron"],
 ["bladder","المثانة","Urinary bladder","عضو عضلي يخزن البول إلى حين التخلص منه.","Muscular organ storing urine until voiding.","urinary","anatomy","kidney,ureter,urinary"],
 ["ureter","الحالب","Ureter","أنبوب ينقل البول من الكلية إلى المثانة.","Tube carrying urine from each kidney to the bladder.","urinary","anatomy","kidney,bladder,urinary"],
 ["electrolytes","الأملاح والشوارد","Electrolytes","أيونات مهمة لتوازن السوائل ونشاط الأعصاب والعضلات.","Ions important for fluid balance and nerve/muscle activity.",null,"physiology","kidney,nephron,muscles,nerves"],
 ["skeleton","الهيكل العظمي","Skeleton","يوفر الدعامة والحماية ويسهم في الحركة مع العضلات.","Provides support, protection and leverage for movement.","skeleton","anatomy","muscles,joints,calcium,bone-marrow"],
 ["muscles","العضلات","Muscles","أنسجة تنقبض لإنتاج الحركة وتثبيت الوضعية.","Contractile tissues producing movement and posture.","muscles","anatomy","skeleton,joints,tendons,nerves,diaphragm"],
 ["joints","المفاصل","Joints","مواضع التقاء العظام التي تسمح بأنماط مختلفة من الحركة.","Bone connections allowing different kinds of movement.","skeleton","anatomy","skeleton,muscles,tendons"],
 ["tendons","الأوتار","Tendons","أنسجة ضامة تربط العضلات بالعظام لنقل قوة الشد.","Connective tissues attaching muscles to bones.","muscles","anatomy","muscles,skeleton,joints"],
 ["calcium","الكالسيوم","Calcium","عنصر مهم للعظام وانقباض العضلات وإشارات الخلايا.","Mineral important for bones, muscle contraction and cell signaling.","skeleton","physiology","skeleton,muscles,electrolytes"],
 ["skin","الجلد","Skin","حاجز يحمي الجسم ويسهم في الإحساس وتنظيم الحرارة.","Barrier protecting the body and aiding sensation/temperature control.","skin","anatomy","nerves,whitecells,lymph"],
 ["thyroid","الغدة الدرقية","Thyroid","غدة تفرز هرمونات تؤثر في معدل الاستقلاب.","Gland secreting hormones that influence metabolic rate.","thyroid","anatomy","pituitary,metabolism,hormones"],
 ["insulin","الإنسولين","Insulin","هرمون بنكرياسي يسهم في خفض سكر الدم بتنظيم دخوله للخلايا.","Pancreatic hormone regulating glucose uptake and blood glucose.",null,"physiology","pancreas,glucose,liver,metabolism"],
 ["pituitary","الغدة النخامية","Pituitary","غدة تفرز هرمونات تنظم غددًا ووظائف متعددة.","Hormone-secreting gland regulating other glands and functions.","thyroid","anatomy","thyroid,hormones,ovary"],
 ["glucose","الغلوكوز","Glucose","سكر رئيسي يُستخدم مصدرًا للطاقة في خلايا عديدة.","Major sugar used as an energy source by many cells.",null,"physiology","pancreas,insulin,liver,metabolism"],
 ["metabolism","التمثيل الغذائي","Metabolism","مجموعة تفاعلات تحول المغذيات إلى طاقة ومكونات خلوية.","Reactions converting nutrients into energy and cell components.",null,"physiology","thyroid,insulin,glucose,oxygen,nutrients"],
 ["reproductive","الجهاز التناسلي الأنثوي","Female reproductive system","أعضاء تشمل الرحم والمبيضين وقناتي فالوب.","Includes uterus, ovaries and uterine tubes.","reproductive","anatomy","ovary,uterus,fallopian,hormones"],
 ["ovary","المبيض","Ovary","عضو ينتج البويضات ويفرز هرمونات تناسلية.","Produces oocytes and secretes reproductive hormones.","reproductive","anatomy","uterus,fallopian,hormones,pituitary"],
 ["uterus","الرحم","Uterus","عضو عضلي يستقبل البويضة المخصبة ويدعم نمو الحمل.","Muscular organ supporting implantation and pregnancy.","reproductive","anatomy","ovary,fallopian,hormones"],
 ["fallopian","قناة فالوب","Uterine tube","أنبوب يصل المبيض بمنطقة الرحم وهو موضع شائع للإخصاب.","Tube connecting ovarian region to uterus; common fertilization site.","reproductive","anatomy","ovary,uterus"],
 ["hormones","الهرمونات","Hormones","رسائل كيميائية تنقل إشارات بين الأعضاء والأنسجة.","Chemical messengers coordinating tissues and organs.",null,"physiology","pituitary,thyroid,ovary,uterus"],
 ["whitecells","خلايا الدم البيضاء","White blood cells","خلايا مناعية متعددة الأدوار في الدفاع والاستجابة.","Immune cells with varied protective and response roles.",null,"physiology","blood,skin,lymph,spleen,bone-marrow"],
 ["lymph","الجهاز اللمفاوي","Lymphatic system","شبكة تعيد السائل الخلالي وتدعم عمل المناعة.","Network returning tissue fluid and supporting immunity.",null,"anatomy","whitecells,spleen,blood,skin"],
 ["spleen","الطحال","Spleen","عضو لمفاوي يرشح الدم ويساهم في الاستجابة المناعية.","Lymphoid organ filtering blood and supporting immune responses.",null,"anatomy","lymph,whitecells,blood"],
 ["bone-marrow","نخاع العظم","Bone marrow","نسيج داخل العظام تنتج فيه خلايا دموية عديدة.","Tissue inside bones where many blood cells are produced.","skeleton","anatomy","skeleton,whitecells,blood"]
];
export const TOPICS=DATA.map(([id,ar,en,summaryAr,summaryEn,image,kind,links])=>({
 id,ar,en,summaryAr,summaryEn,image,kind,links:links.split(",")
}));
export const TOPIC_BY_ID=Object.fromEntries(TOPICS.map(t=>[t.id,t]));
export const SYSTEM_BY_ID=Object.fromEntries(SYSTEMS.map(s=>[s.id,s]));
export function connectedIds(id){
 const t=TOPIC_BY_ID[id];if(!t)return [];
 const out=new Set(t.links);
 for(const other of TOPICS){if(other.id!==id&&other.links.includes(id))out.add(other.id);}
 return [...out].filter(k=>TOPIC_BY_ID[k]&&k!==id);
}
export function systemTopics(systemId){return (SYSTEM_BY_ID[systemId]||SYSTEMS[0]).ids.map(k=>TOPIC_BY_ID[k]).filter(Boolean);}
export function visibleRelated(systemId,id,count=6){
 const topics=systemTopics(systemId),near=new Set(connectedIds(id));
 return [...topics.filter(t=>t.id!==id&&near.has(t.id)),...topics.filter(t=>t.id!==id&&!near.has(t.id))].slice(0,count);
}
export function getFeatured(systemId,activeId){const topics=systemTopics(systemId);return topics.find(t=>t.id===activeId)||topics[0];}
