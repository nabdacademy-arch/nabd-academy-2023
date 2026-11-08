/* NABD FUTURE LAB 2050 · fictional educational branching + optional 3D/AR
   No backend access, account storage, grades, credential issuance, or medical decisions.
   All visuals are conceptual / CC0 educational models; AR availability depends on device.
*/
(()=>{"use strict";
const d=document,$=id=>d.getElementById(id);
const loc=(pair,lang)=>pair?.[lang]??pair?.ar??"";
const make=(tag,cls,text)=>{const e=d.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
const root={lang:"ar",scenario:"circulation",step:0,history:[],model:"heart",loading:0,viewer:null,resource:null};
const L=(ar,en)=>root.lang==="en"?en:ar;
const scenarios={
 circulation:{
  title:{ar:"الدورة الدموية والتروية",en:"Circulation and perfusion"},
  intro:{ar:"تدريب خيالي على جمع المعطيات وشرح الترابط بين القلب والأوعية، لا محاكاة لمسار مرض واقعي.",en:"Fictional reasoning exercise connecting heart and vessel physiology, not a simulation of real disease progression."},
  stages:[
   {at:"T + 00",title:{ar:"بداية الملاحظة",en:"Initial observations"},question:{ar:"تظهر أمامك مؤشرات افتراضية متفرقة. كيف تبدأ تفسيرها علميًا؟",en:"A fictional dashboard shows scattered observations. How should you begin reasoning?"},context:{ar:"المعطيات وحدها لا تحدد تشخيصًا؛ المطلوب تنظيمها والتأكد من معناها.",en:"Observations alone do not establish a diagnosis. Start by organizing their meaning."},
    options:[[{ar:"أتحقق من معاني القياسات ومصدرها قبل المقارنة.",en:"Check measurement definitions and sources before comparing them."},2,{ar:"التحقق من المصدر يمنع بناء استنتاج على قراءة مبهمة.",en:"Source checking avoids reasoning from ambiguous measurements."}],
     [{ar:"أختار قراءة واحدة وأتجاهل بقية المعطيات.",en:"Choose a single value and ignore the rest."},0,{ar:"قراءة منفردة لا تمثّل السياق الفسيولوجي.",en:"A single reading cannot represent the physiological context."}],
     [{ar:"أصف الملاحظات لكن لا أتأكد من مصدرها.",en:"Describe observations without checking their source."},1,{ar:"التوصيف جيد، لكن يجب توثيق مصدر كل ملاحظة.",en:"Description helps, but evidence provenance matters."}]]},
   {at:"T + 01",title:{ar:"ربط الأجهزة",en:"Connecting systems"},question:{ar:"أي علاقة تساعدك على بناء نموذج فسيولوجي مفاهيمي؟",en:"Which connection builds a sound conceptual physiology model?"},context:{ar:"النشاط يختبر الربط العلمي ولا يوصي بتدخل علاجي.",en:"This stage tests conceptual connections, not treatment selection."},
    options:[[{ar:"أربط النتاج القلبي والتروية واحتياجات الأنسجة.",en:"Connect cardiac output, perfusion and tissue demand."},2,{ar:"فهم العلاقات بين المتغيرات أقوى من حفظ كل منها منفصلًا.",en:"Understanding related variables is more useful than memorizing them separately."}],
     [{ar:"أفترض أن كل الأعضاء تعمل منفصلة تمامًا.",en:"Assume organs work in complete isolation."},0,{ar:"الأنظمة القلبية والتنفسية والكلوية مترابطة.",en:"Cardiac, respiratory and renal systems interact."}],
     [{ar:"أركز على النبض فقط دون بقية العلاقات.",en:"Focus only on pulse, without other relationships."},1,{ar:"هذا مفهوم مهم لكنه جزء من الصورة لا الصورة كلها.",en:"Pulse matters but represents only part of the model."}]]},
   {at:"T + 06",title:{ar:"مراجعة الفرضيات",en:"Revising hypotheses"},question:{ar:"تظهر معلومة إضافية خيالية تختلف عن تصورك الأول. ماذا تفعل؟",en:"New fictional evidence challenges your initial interpretation. What now?"},context:{ar:"القيمة التعليمية هنا هي قبول الأدلة الجديدة بدل تثبيت حكم مبكر.",en:"The learning objective is updating your reasoning in response to evidence."},
    options:[[{ar:"أعيد مقارنة الفرضيات بالأدلة وأذكر حدود الاستنتاج.",en:"Recompare hypotheses with evidence and state uncertainty."},2,{ar:"تحديث الرأي عند ظهور دليل جديد جزء أساسي من التفكير العلمي.",en:"Revising a hypothesis after new evidence is a core scientific skill."}],
     [{ar:"أتمسك بالتفسير الأول لأنني اخترته سابقًا.",en:"Keep the first explanation because I chose it earlier."},0,{ar:"الانحياز للتصور الأول قد يخفي معلومات مهمة.",en:"Anchoring to an initial explanation can hide important evidence."}],
     [{ar:"أقبل الدليل الجديد دون تفسير أثره على الفرضية.",en:"Accept new evidence without explaining its implications."},1,{ar:"التعديل جيد، لكن توثيق سبب التغيير يجعله قابلًا للمراجعة.",en:"Updating is useful; documenting why makes it auditable."}]]},
   {at:"T + 24",title:{ar:"توثيق التسليم",en:"Reasoning handover"},question:{ar:"كيف تنهي هذا التمرين التعليمي بمخرجات قابلة للمراجعة؟",en:"How do you finish with a transparent, reviewable learning record?"},context:{ar:"المطلوب ملخص علمي تعليمي لا توصية بشأن مريض.",en:"The output is a learning summary, never patient advice."},
    options:[[{ar:"أكتب المعطيات والفرضيات والحدود وما يلزم مراجعته مع المدرّس.",en:"Record data, hypotheses, limits and questions for the instructor."},2,{ar:"ملخص قابل للتتبع يمكّن المدرّس من مراجعة خطوات التفكير.",en:"A traceable summary lets instructors assess the reasoning process."}],
     [{ar:"أقدّم نتيجة نهائية دون شرح أو مصادر.",en:"Present a final answer without reasoning or sources."},0,{ar:"النتائج بلا تفسير يصعب تدقيقها علميًا.",en:"Claims without reasoning are difficult to evaluate."}],
     [{ar:"أكتب ملخصًا مختصرًا دون نقاط عدم اليقين.",en:"Provide a short summary without uncertainty."},1,{ar:"الملخص مفيد، لكن الاعتراف بالحدود جزء من النزاهة العلمية.",en:"A summary helps, but limitations remain essential."}]]}
  ],
  skills:[["منهجية التوثيق","Evidence literacy"],["ترابط الأجهزة","Systems thinking"],["تحديث الفرضيات","Hypothesis revision"],["التواصل العلمي","Scientific communication"]]
 },
 breathing:{
  title:{ar:"التنفس وتبادل الغازات",en:"Breathing and gas exchange"},
  intro:{ar:"حالة تعليمية خيالية لاختبار كيفية ربط التهوية والانتشار ونقل الأكسجين مع توثيق الأدلة.",en:"A fictional exercise connecting ventilation, diffusion and oxygen transport with evidence documentation."},
  stages:[
   {at:"T + 00",title:{ar:"قراءة المصطلحات",en:"Define the observations"},question:{ar:"تظهر قيم افتراضية للتنفس. ما أول خطوة علمية؟",en:"Fictional respiratory readings appear. What is the first scientific step?"},context:{ar:"افصل بين مفهوم التهوية ومفهوم تبادل الغازات.",en:"Distinguish ventilation from gas exchange."},options:[[{ar:"أحدد تعريف كل متغير ووحدة قياسه.",en:"Define each variable and its unit."},2,{ar:"تحديد التعريفات شرط لتفسير المعلومات.",en:"Clear definitions are prerequisites for interpretation."}],[{ar:"أعامل كل القياسات وكأنها الشيء نفسه.",en:"Treat all readings as the same concept."},0,{ar:"المتغيرات التنفسية تقيس جوانب مختلفة.",en:"Respiratory measures capture different processes."}],[{ar:"أسجل القيم دون تفسير معناها.",en:"List readings without defining them."},1,{ar:"التسجيل خطوة أولى؛ يحتاج الأمر إلى تأطير مفاهيمي.",en:"Recording is useful but needs conceptual framing."}]]},
   {at:"T + 01",title:{ar:"التكامل القلبي الرئوي",en:"Cardiopulmonary integration"},question:{ar:"كيف ينتقل الأكسجين من الرئة إلى الأنسجة في النموذج العلمي؟",en:"How does oxygen travel from lung to tissue in a conceptual model?"},context:{ar:"هذا تمثيل مبسط للمسار الطبيعي للأكسجين.",en:"This is a simplified representation of normal oxygen transport."},options:[[{ar:"أربط الحويصلات والدم والدورة الدموية.",en:"Connect alveoli, blood and circulation."},2,{ar:"التبادل والنقل والتروية عمليات متكاملة.",en:"Exchange, transport and perfusion are connected."}],[{ar:"أفترض أن الرئة تنقل الأكسجين للعضلات مباشرة دون دم.",en:"Assume lungs supply muscles without blood transport."},0,{ar:"خلايا الدم والدورة الدموية عنصران أساسيان للنقل.",en:"Blood and circulation are essential to transport."}],[{ar:"أشرح الحويصلات وحدها.",en:"Describe alveoli alone."},1,{ar:"شرح الحويصلات صحيح جزئيًا، لكنه لا يغطي مرحلة النقل.",en:"Alveoli matter but do not explain transport."}]]},
   {at:"T + 06",title:{ar:"مراجعة النموذج",en:"Reassess the model"},question:{ar:"تظهر معلومة مفاهيمية جديدة. كيف تحدّث النموذج؟",en:"A new conceptual observation appears. How do you revise your model?"},context:{ar:"المراجعة المنهجية أفضل من اختيار إجابة ثابتة.",en:"Structured revision is better than a fixed unsupported answer."},options:[[{ar:"أوضح ما تغير وما بقي غير مؤكد.",en:"State what changed and what remains uncertain."},2,{ar:"هذا يفصل المعلومة الموثوقة عن الافتراض.",en:"This separates evidence from assumptions."}],[{ar:"أتجاهلها حفاظًا على النموذج الأول.",en:"Ignore it to preserve the initial model."},0,{ar:"العلم يستدعي مراجعة النماذج وفق الأدلة.",en:"Scientific models should respond to evidence."}],[{ar:"أعدل النتيجة دون توثيق سبب التغيير.",en:"Revise without documenting why."},1,{ar:"التحديث خطوة جيدة، ويكتمل بتوثيق السبب.",en:"Revising helps; document the reasoning."}]]},
   {at:"T + 24",title:{ar:"مراجعة المصادر",en:"Source review"},question:{ar:"ما أفضل خاتمة تعليمية لهذا النموذج التنفسي؟",en:"What is the best educational close to the respiratory model?"},context:{ar:"وثّق المصادر المستخدمة وحدود النموذج.",en:"Document sources and limitations."},options:[[{ar:"أشير إلى مرجع تعليمي وأذكر حدود التبسيط.",en:"Cite a learning reference and note simplifications."},2,{ar:"المصدر والحدود يجعلان الشرح مسؤولًا وقابلًا للتحسين.",en:"Sources and limits make a model responsibly reviewable."}],[{ar:"أذكر أن النموذج يصلح للتشخيص مباشرة.",en:"Claim the model can diagnose real patients."},0,{ar:"التمرين ليس نموذجًا سريريًا مُعتمدًا.",en:"This exercise is not clinically validated."}],[{ar:"أكتب خلاصة صحيحة دون ذكر المصادر.",en:"Summarize without naming references."},1,{ar:"الخلاصة تحتاج مرجعًا قابلًا للتحقق.",en:"A summary benefits from a verifiable citation."}]]}
  ],
  skills:[["تعريف المؤشرات","Measurement literacy"],["تكامل الجهاز التنفسي","Respiratory systems thinking"],["تحليل الأدلة","Evidence analysis"],["المصادر العلمية","Source literacy"]]
 },
 fluid:{
  title:{ar:"الكلى وتوازن السوائل",en:"Kidneys and fluid balance"},
  intro:{ar:"رحلة معرفية خيالية لفهم العلاقة بين النيفرون والكهارل والدورة الدموية، دون بيانات أو توجيهات علاجية.",en:"A fictional learning journey through nephrons, electrolytes and circulation without patient data or treatment advice."},
  stages:[
   {at:"T + 00",title:{ar:"جمع المعلومات",en:"Collect observations"},question:{ar:"كيف تهيّئ متغيرات افتراضية عن توازن الماء للفهم؟",en:"How do you organise fictional measurements of water balance?"},context:{ar:"ابدأ بفهم المتغيرات قبل بناء الاستنتاج.",en:"Understand the variables before drawing conclusions."},options:[[{ar:"أعرّف المدخلات والمخرجات والسياق الزمني.",en:"Define inputs, outputs and time context."},2,{ar:"التوقيت والتعريف ضروريان للمقارنة العلمية.",en:"Timing and definitions are essential for sound comparisons."}],[{ar:"أستنتج حالة مرضية من قيمة واحدة.",en:"Infer a disease state from one value."},0,{ar:"لا تسمح ملاحظة منفردة باستنتاج موثوق.",en:"A lone observation does not support a confident conclusion."}],[{ar:"أسجل القيم دون توضيح الزمن.",en:"Record values without their time context."},1,{ar:"السجل خطوة جيدة، لكن الزمن مهم.",en:"Recording helps, but time context matters."}]]},
   {at:"T + 01",title:{ar:"دور النيفرون",en:"Nephron function"},question:{ar:"أي وصف يعكس دور النيفرون بصورة تعليمية أدق؟",en:"Which explanation best represents nephron function?"},context:{ar:"قارن الترشيح وإعادة الامتصاص والإطراح.",en:"Compare filtration, reabsorption and excretion."},options:[[{ar:"أشرح كيف تتكامل المراحل لتنظيم الماء والمواد المذابة.",en:"Explain how processes regulate water and solutes together."},2,{ar:"الوظيفة الكلوية تتألف من عمليات مترابطة.",en:"Renal function involves multiple connected processes."}],[{ar:"أعتبر الكلى مجرد مخزن للماء.",en:"Describe kidneys as simple water storage."},0,{ar:"الكلى تنظّم الترشيح والإطراح ولا تقتصر على التخزين.",en:"Kidneys regulate filtration and excretion; they do not simply store water."}],[{ar:"أذكر الترشيح وحده دون بقية المراحل.",en:"Mention filtration without the other processes."},1,{ar:"الترشيح عنصر مهم وليس الوظيفة كاملة.",en:"Filtration matters but does not capture the full process."}]]},
   {at:"T + 06",title:{ar:"ربط الأجهزة",en:"Connecting organ systems"},question:{ar:"ما العلاقة الأكثر فائدة في نموذج توازن السوائل؟",en:"What is the most useful systems connection for fluid balance?"},context:{ar:"الأعضاء تتفاعل عبر الدورة الدموية والإشارات الكيميائية.",en:"Organs interact through circulation and chemical signalling."},options:[[{ar:"أربط القلب والكلى والتنظيم الهرموني.",en:"Connect heart, kidneys and hormonal regulation."},2,{ar:"هذا يوضح التفاعل متعدد الأجهزة بصورة مفاهيمية.",en:"This captures the systems-level relationship conceptually."}],[{ar:"أفصل الكلى تمامًا عن الدورة الدموية.",en:"Separate kidney function entirely from circulation."},0,{ar:"تنظيم السوائل والدورة الدموية مرتبطان.",en:"Fluid balance and circulation interact."}],[{ar:"أربط الكلى بالماء فقط.",en:"Connect kidneys only to water."},1,{ar:"يلزم النظر أيضًا إلى الأملاح والتنظيم الهرموني.",en:"Electrolytes and hormonal regulation also matter."}]]},
   {at:"T + 24",title:{ar:"خلاصة موثقة",en:"Reviewable conclusion"},question:{ar:"كيف تكتب نتيجة تدريب علمي قابلة للمراجعة؟",en:"How do you create a reviewable scientific learning conclusion?"},context:{ar:"نتيجة تعليمية وليست تقريرًا طبيًا.",en:"This is a learning reflection, not a patient report."},options:[[{ar:"أكتب الفرضيات والمعطيات والمراجع والحدود.",en:"Record hypotheses, observations, citations and limitations."},2,{ar:"التوثيق الكامل يجعل الاستنتاج قابلًا للتدقيق.",en:"A documented argument can be reviewed and improved."}],[{ar:"أُصدر حكمًا طبيًا قاطعًا دون مصدر.",en:"Make a definitive medical claim without evidence."},0,{ar:"لا يصح استخدام المحاكاة لتقرير وضع مريض.",en:"Simulations cannot establish real patient conditions."}],[{ar:"أحتفظ بالخلاصة دون ذكر حدود النموذج.",en:"Save a summary but omit the model's limitations."},1,{ar:"الاعتراف بالحدود أساسي للمسؤولية العلمية.",en:"Acknowledging limits is part of scientific responsibility."}]]}
  ],
  skills:[["تنظيم البيانات","Data organisation"],["مبادئ وظائف الكلى","Renal physiology"],["التكامل الفسيولوجي","Systems integration"],["الاستدلال الموثق","Documented reasoning"]]
 }
};
const modelData=[
 {id:"heart",icon:"♥",code:"01 / HEART",ar:"القلب",en:"Heart",descAr:"مضخة عضلية من أربع حجرات تدفع الدم خلال الدورتين الرئوية والجهازية.",descEn:"A four-chamber muscular pump supporting pulmonary and systemic circulation.",conceptAr:["الحجرات","الصمامات","الدورة الدموية"],conceptEn:["Chambers","Valves","Circulation"],poster:"v11/art/heart-3d.svg",asset:"https://cdn.3dassets.dev/assets/38952/v1/model.glb",source:"https://3dassets.dev/assets/human-anatomy-and-education-kit-heart-model-79e77e2b"},
 {id:"lungs",icon:"⌁",code:"02 / LUNGS",ar:"الرئتان",en:"Lungs",descAr:"الحويصلات الهوائية تسمح بتبادل الغازات بين الهواء والدم.",descEn:"Alveoli support gas exchange between air and blood.",conceptAr:["الحويصلات","التهوية","التبادل"],conceptEn:["Alveoli","Ventilation","Exchange"],poster:"v11/art/lungs-3d.svg",asset:"https://cdn.3dassets.dev/assets/38954/v1/model.glb",source:"https://3dassets.dev/assets/human-anatomy-and-education-kit-lung-pair-2c26b7b1"},
 {id:"brain",icon:"◈",code:"03 / BRAIN",ar:"الدماغ",en:"Brain",descAr:"شبكات عصبية تنسق الإحساس والحركة وبعض وظائف الجسم.",descEn:"Neural networks coordinate sensation, movement and bodily functions.",conceptAr:["القشرة","المخيخ","جذع الدماغ"],conceptEn:["Cortex","Cerebellum","Brainstem"],poster:"v11/art/brain-3d.svg",asset:"https://cdn.3dassets.dev/assets/38955/v1/model.glb",source:"https://3dassets.dev/assets/human-anatomy-and-education-kit-brain-model-6f2b597b"},
 {id:"kidneys",icon:"◉",code:"04 / RENAL",ar:"الكليتان",en:"Kidneys",descAr:"تساعد الكلى في تنظيم الماء والكهارل وإخراج الفضلات.",descEn:"Kidneys regulate water, electrolytes and waste excretion.",conceptAr:["النيفرون","الترشيح","التوازن"],conceptEn:["Nephron","Filtration","Balance"],poster:"v11/art/renal-3d.svg",asset:"https://cdn.3dassets.dev/assets/38958/v1/model.glb",source:"https://3dassets.dev/assets/human-anatomy-and-education-kit-kidney-model-c48807f6"},
 {id:"liver",icon:"⬡",code:"05 / LIVER",ar:"الكبد",en:"Liver",descAr:"يعالج مواد غذائية ويدعم وظائف استقلابية وينتج الصفراء.",descEn:"The liver processes nutrients, supports metabolism and produces bile.",conceptAr:["الاستقلاب","الصفراء","المغذيات"],conceptEn:["Metabolism","Bile","Nutrients"],poster:"v11/art/digestive-3d.svg",asset:"https://cdn.3dassets.dev/assets/38959/v1/model.glb",source:"https://3dassets.dev/assets/human-anatomy-and-education-kit-liver-model-2052c101"},
 {id:"skeleton",icon:"⟡",code:"06 / SKELETON",ar:"الهيكل العظمي",en:"Skeleton",descAr:"يوفر الدعم والحماية مع دور حركي بمشاركة العضلات والمفاصل.",descEn:"The skeletal system provides structure and protection, working with muscles and joints.",conceptAr:["العظام","المفاصل","الحركة"],conceptEn:["Bones","Joints","Movement"],poster:"v11/art/musculoskeletal-3d.svg",asset:"https://cdn.3dassets.dev/assets/38937/v1/model.glb",source:"https://3dassets.dev/assets/human-anatomy-and-education-kit-full-skeleton-6e2282f7"}
];
function total(){return root.history.reduce((sum,v)=>sum+(Number.isFinite(v?.points)?v.points:0),0)}
function setText(id,text){$(id).textContent=text}
function updateStatic(){
 d.documentElement.lang=root.lang;d.documentElement.dir=root.lang==="ar"?"rtl":"ltr";$("language").textContent=root.lang==="ar"?"EN":"عربي";
 $("language").setAttribute("aria-label",L("التبديل إلى الإنجليزية","Switch to Arabic"));
 d.querySelectorAll("[data-ar][data-en]").forEach(el=>{el.textContent=el.getAttribute("data-"+root.lang)});
 d.title=L("NABD 2050 | مختبر المستقبل الطبي — أكاديمية نبض","NABD 2050 | Future Medical Lab — NABD Academy");
}
function renderTimeline(){
 const course=scenarios[root.scenario],stages=course.stages,last=stages.length,done=root.step>=last;
 setText("scenarioTitle",loc(course.title,root.lang));setText("scenarioIntro",loc(course.intro,root.lang));
 setText("stageIndex",String(Math.min(root.step+1,last)).padStart(2,"0")+" / "+String(last).padStart(2,"0"));
 setText("stageStamp",done?"T + REPORT":stages[root.step].at);
 setText("points",total()+" / "+(last*2));$("meterFill").style.width=Math.max(0,Math.min(100,total()/(last*2)*100))+"%";
 const map=$("phaseMap");map.replaceChildren();
 stages.forEach((p,i)=>{const b=make("button","",p.at);b.type="button";b.disabled=true;b.dataset.state=root.history[i]?"complete":i===root.step?"current":"pending";b.setAttribute("aria-label",loc(p.title,root.lang));map.append(b)});
 $("choices").hidden=done;$("next").hidden=done;$("completion").hidden=!done;
 if(done){
  setText("phaseTitle",L("التقرير التعليمي","Learning report"));setText("phaseQuestion",L("اكتملت رحلة الزمن الافتراضي.","Your fictional timeline is complete."));
  setText("phaseContext",L("راجع أثر اختياراتك على جودة التفكير المنهجي، وليس على مصير مريض.","Review how your choices affected structured reasoning — never a patient's outcome."));
  $("feedback").hidden=true;setText("progressText",L("أربع مراحل مكتملة","Four phases completed"));renderCompletion();return;
 }
 const s=stages[root.step],selected=root.history[root.step];
 setText("phaseTitle",loc(s.title,root.lang));setText("phaseQuestion",loc(s.question,root.lang));setText("phaseContext",loc(s.context,root.lang));
 const host=$("choiceList");host.replaceChildren();s.options.forEach((option,i)=>{
  const label=make("label","choice"),input=make("input");input.type="radio";input.name="learning-choice";input.value=String(i);
  input.checked=selected?.option===i;input.addEventListener("change",()=>choose(i));label.append(input,make("span","",loc(option[0],root.lang)));host.append(label);
 });
 const next=$("next");next.disabled=!selected;next.textContent=root.step===last-1?L("عرض تقرير التعلم ←","View learning report →"):L("المرحلة التالية ←","Next phase →");
 setText("progressText",L("المرحلة ","Phase ")+(root.step+1)+" / "+last);
 if(selected){$("feedback").hidden=false;setText("feedback",L("مراجعة تعليمية: ","Learning feedback: ")+loc(s.options[selected.option][2],root.lang))}
 else {$("feedback").hidden=true;setText("feedback","")}
}
function choose(index){
 const s=scenarios[root.scenario].stages[root.step];if(!s||!s.options[index])return;
 root.history[root.step]={option:index,points:s.options[index][1]};renderTimeline();
}
function renderCompletion(){
 const course=scenarios[root.scenario],score=total(),max=course.stages.length*2;
 setText("summaryTitle",score>=7?L("استدلال واضح وموثق","Well-structured reasoning"):score>=4?L("أساس جيد يحتاج توثيقًا أعمق","Promising reasoning; deepen documentation"):L("فرصة للمراجعة والتجربة مجددًا","Opportunity to review and try again"));
 const path=course.stages.map((stage,i)=>loc(stage.title,root.lang)+": "+root.history[i].points+" / 2").join(" · ");
 setText("summaryText",L("درجة التدريب المفاهيمي: ","Conceptual practice score: ")+score+" / "+max+". "+path+". "+L("هذا تقييم لخيارات التعلم فقط؛ لا يمثل نتيجة سريرية أو اعتمادًا رسميًا.","This only assesses learning choices; it is not a clinical result or an official achievement."));
 const tag=$("skillTags");tag.replaceChildren();course.skills.forEach(pair=>tag.append(make("span","",root.lang==="ar"?pair[0]:pair[1])));
}
function resetScenario(){
 root.scenario=$("scenario").value;root.step=0;root.history=[];renderTimeline();
}
function exportPractice(){
 const course=scenarios[root.scenario];if(root.step<course.stages.length)return;
 const payload={type:"nabd_2050_anonymous_educational_practice",version:1,scenario:root.scenario,score:total(),maxScore:course.stages.length*2,steps:root.history.map((a,i)=>({phase:i+1,option:a.option+1,points:a.points})),note:"Fictional case; educational feedback only. Not a clinical evaluation, student record, or credential."};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),a=make("a");a.href=url;a.download="nabd-2050-practice.json";d.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderModels(){
 const host=$("modelMenu");host.replaceChildren();modelData.forEach(x=>{
  const b=make("button","model-tab"+(x.id===root.model?" active":""));b.type="button";b.dataset.model=x.id;b.setAttribute("aria-pressed",String(x.id===root.model));b.append(make("span","",x.icon),make("strong","",root.lang==="ar"?x.ar:x.en));b.addEventListener("click",()=>selectModel(x.id));host.append(b);
 });
 const m=modelData.find(x=>x.id===root.model);if(!m)return;
 setText("modelCode",m.code);setText("modelName",root.lang==="ar"?m.ar:m.en);setText("modelDescription",root.lang==="ar"?m.descAr:m.descEn);
 $("modelSource").href=m.source;const concept=$("modelConcepts");concept.replaceChildren();(root.lang==="ar"?m.conceptAr:m.conceptEn).forEach(x=>concept.append(make("span","",x)));
}
function resetViewer(){
 root.loading++;const host=$("modelHost");host.replaceChildren();root.viewer=null;$("modelPoster").hidden=false;$("activateAR").disabled=true;$("loadModel").disabled=false;
 setText("arStatus",L("اعرض الصورة المحلية أو حمّل المجسم عند توفر الاتصال.","View the local illustration or load 3D when online."));
}
function selectModel(id){if(!modelData.some(x=>x.id===id))return;root.model=id;resetViewer();const m=modelData.find(x=>x.id===id);const poster=$("modelPoster");poster.src=m.poster;poster.alt=L("رسم توضيحي مبسط لعضو ","Simplified illustration of ")+(root.lang==="ar"?m.ar:m.en);renderModels()}
let viewerLibrary=null;
function ensureViewer(){
 if(customElements.get("model-viewer"))return Promise.resolve();
 if(viewerLibrary)return viewerLibrary;
 viewerLibrary=new Promise((resolve,reject)=>{
  const script=make("script");script.src="https://cdnjs.cloudflare.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js";
  script.onload=()=>{Promise.race([customElements.whenDefined("model-viewer"),new Promise((_,rej)=>setTimeout(()=>rej(new Error("viewer not registered")),9000))]).then(resolve,reject)};
  script.onerror=()=>reject(new Error("viewer library unavailable"));d.head.append(script);
 }).catch(err=>{viewerLibrary=null;throw err});
 return viewerLibrary;
}
async function loadModel(){
 const m=modelData.find(x=>x.id===root.model),request=++root.loading;if(!m)return;
 $("loadModel").disabled=true;setText("arStatus",L("جارٍ تحضير المجسم التعليمي…","Preparing conceptual 3D model…"));
 if(navigator.onLine===false){if(request===root.loading){$("loadModel").disabled=false;setText("arStatus",L("لا يوجد اتصال. الصورة البديلة ما زالت متاحة.","Offline: the fallback illustration is still available."))}return}
 try{
  await ensureViewer();if(request!==root.loading)return;
  const v=make("model-viewer");v.setAttribute("src",m.asset);v.setAttribute("alt",L("مجسم مبسط لـ ","Simplified model of ")+(root.lang==="ar"?m.ar:m.en));v.setAttribute("camera-controls","");v.setAttribute("interaction-prompt","none");
  v.setAttribute("shadow-intensity","1");v.setAttribute("loading","eager");v.setAttribute("ar","");v.setAttribute("ar-modes","webxr scene-viewer quick-look");v.setAttribute("ar-scale","auto");
  v.addEventListener("load",()=>{
   if(request!==root.loading)return;
   const refresh=()=>{if(request!==root.loading)return;$("activateAR").disabled=!v.canActivateAR;setText("arStatus",v.canActivateAR?L("المجسم جاهز؛ يمكنك تدويره أو تجربة الواقع المعزز.","Model ready. Rotate it or try augmented reality."):L("المجسم جاهز للدوران؛ الواقع المعزز غير مدعوم على هذا الجهاز أو المتصفح.","Rotatable 3D ready; AR is unavailable on this browser/device."))};
   refresh();setTimeout(refresh,550);
  });
  v.addEventListener("error",()=>{if(request!==root.loading)return;resetViewer();setText("arStatus",L("تعذّر تحميل المجسم الخارجي. الصورة البديلة متاحة.","The remote model could not be loaded; the local illustration remains available."))});
  v.addEventListener("ar-status",e=>{if(request!==root.loading)return;if(e.detail?.status==="failed")setText("arStatus",L("تعذّر تشغيل الواقع المعزز؛ يمكنك متابعة العرض ثلاثي الأبعاد.","AR could not start. Continue in the 3D viewer."))});
  const host=$("modelHost");host.replaceChildren(v);$("modelPoster").hidden=true;root.viewer=v;setText("arStatus",L("جارٍ تحميل الشكل من المصدر المفتوح…","Loading model from its open asset source…"));
 }catch(err){if(request!==root.loading)return;resetViewer();setText("arStatus",L("لم تفتح مكتبة العرض؛ جرّب لاحقًا أو استخدم الصورة التعليمية.","The 3D viewer could not start. Use the local illustration instead."))}
}
function openAR(){
 const v=root.viewer;if(!v||!v.canActivateAR){setText("arStatus",L("الواقع المعزز غير متاح على هذا الجهاز. يمكنك تدوير المجسم هنا.","AR is not supported on this device. Rotate the model here."));return}
 try{const result=v.activateAR();if(result?.catch)result.catch(()=>setText("arStatus",L("تعذر تشغيل الواقع المعزز. استخدم المجسم داخل الصفحة.","AR could not launch. Use the in-page 3D view.")))}catch(err){setText("arStatus",L("تعذر تشغيل الواقع المعزز. استخدم المجسم داخل الصفحة.","AR could not launch. Use the in-page 3D view."))}
}
function setLanguage(language){
 root.lang=language;updateStatic();
 const selection=$("scenario").value;d.querySelectorAll("#scenario option").forEach(opt=>opt.textContent=opt.getAttribute("data-"+root.lang));
 $("scenario").value=selection;renderTimeline();renderModels();if(root.viewer)root.viewer.setAttribute("alt",L("مجسم تعليمي مبسط","Simplified educational model"));
}
function init(){
 $("language").addEventListener("click",()=>setLanguage(root.lang==="ar"?"en":"ar"));
 $("scenario").addEventListener("change",resetScenario);$("reset").addEventListener("click",resetScenario);
 $("next").addEventListener("click",()=>{if(!root.history[root.step])return;root.step++;renderTimeline()});
 $("export").addEventListener("click",exportPractice);
 $("loadModel").addEventListener("click",()=>{void loadModel()});$("modelReset").addEventListener("click",resetViewer);
 $("activateAR").addEventListener("click",openAR);
 setLanguage("ar");resetScenario();selectModel("heart");
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init);else init();
})();