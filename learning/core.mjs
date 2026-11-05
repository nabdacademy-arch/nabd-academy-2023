export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}}
export function gradePractice(lesson,answers){
 const feedback=lesson.quiz.map(q=>({id:q.id,correct:Number.isInteger(answers[q.id])&&answers[q.id]===q.answer,explanation:q.explanation}));
 return {score:feedback.filter(x=>x.correct).length,total:feedback.length,feedback};
}
export const normalizeSearch=value=>String(value).toLocaleLowerCase().normalize('NFKC').replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا');
export function searchLessons(catalog,query){const tokens=normalizeSearch(query).trim().split(/\s+/).filter(Boolean);return catalog.lessons.filter(l=>tokens.every(token=>normalizeSearch(JSON.stringify([l.title,l.objectives,l.sections,l.topic,l.quiz])).includes(token)))}
export function relatedSources(catalog,lessons){return catalog.sources.filter(s=>new Set(lessons.flatMap(l=>l.source_ids)).has(s.id))}
export function progressSummary(lessons,progress){const completed=lessons.filter(l=>progress[l.id]?.completed).length;const passed=lessons.filter(l=>progress[l.id]?.score===l.quiz.length).length;return {completed,passed,percent:Math.round(completed/Math.max(1,lessons.length)*100),points:completed*10+passed*20}}
export const GRAPH={nodes:[
 {id:'heart',label:{ar:'القلب',en:'Heart'},group:'anatomy',x:280,y:160,summary:{ar:'عضو عضلي يضخ الدم خلال الدورتين الرئوية والجهازية.',en:'Muscular organ pumping blood through pulmonary and systemic circuits.'},sources:['openstax','heart']},
 {id:'blood',label:{ar:'الدم',en:'Blood'},group:'physiology',x:140,y:95,summary:{ar:'نسيج ينقل الغازات والمغذيات ومواد أخرى بين أجزاء الجسم.',en:'Tissue transporting gases, nutrients and other substances.'},sources:['openstax']},
 {id:'lungs',label:{ar:'الحويصلات',en:'Alveoli'},group:'anatomy',x:425,y:70,summary:{ar:'بنى رئوية يحدث عبر حاجزها مع الشعيرات تبادل الغازات.',en:'Lung structures exchanging gases across the alveolar–capillary barrier.'},sources:['openstax']},
 {id:'oxygen',label:{ar:'الأكسجين',en:'Oxygen'},group:'physiology',x:535,y:185,summary:{ar:'غاز أساسي للتنفس الخلوي؛ يرتبط معظمه بالهيموغلوبين في الدم.',en:'Gas essential for cellular respiration; most blood oxygen binds hemoglobin.'},sources:['openstax']},
 {id:'hemoglobin',label:{ar:'الهيموغلوبين',en:'Hemoglobin'},group:'physiology',x:420,y:290,summary:{ar:'بروتين في كريات الدم الحمراء يرتبط بالأكسجين.',en:'Protein in red blood cells that binds oxygen.'},sources:['openstax']},
 {id:'pressure',label:{ar:'ضغط الدم',en:'Blood pressure'},group:'physiology',x:130,y:260,summary:{ar:'ضغط الدم على جدران الأوعية، ويتأثر بنتاج القلب ومقاومة الأوعية.',en:'Pressure exerted on vessel walls, influenced by cardiac output and vascular resistance.'},sources:['openstax']},
 {id:'hypertension',label:{ar:'ارتفاع الضغط',en:'Hypertension'},group:'disease',x:85,y:385,summary:{ar:'حالة تتطلب قياسات وتقييمًا مناسبين؛ هذه الخريطة لا تشخّصها.',en:'A condition requiring appropriate measurements and assessment; this map does not diagnose it.'},sources:['medline','who']},
 {id:'medicines',label:{ar:'خافضات الضغط',en:'Antihypertensives'},group:'pharmacology',x:270,y:405,summary:{ar:'فئات دوائية تؤثر في تنظيم ضغط الدم بآليات مختلفة. ليست الخريطة توصية علاجية.',en:'Drug classes acting on blood-pressure regulation through different mechanisms. This map is not treatment advice.'},sources:['medline']}
],edges:[['heart','blood'],['heart','pressure'],['blood','hemoglobin'],['lungs','oxygen'],['oxygen','hemoglobin'],['blood','oxygen'],['pressure','hypertension'],['hypertension','medicines'],['medicines','pressure']]};
