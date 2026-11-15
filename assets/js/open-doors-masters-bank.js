/* NABD Open Doors Master's Research Studio — original bilingual learning bank.
 * Based on the OFFICIAL master's/doctoral subject programs, not reused bachelor tests.
 * Official sample files are linked, not represented as verbatim copied exam items.
 */
(function(root){
"use strict";
const SOURCES=Object.freeze({
 chemistry:{name:"Chemistry & Materials Science",ar:"الكيمياء وعلوم المواد",
  page:"https://od.globaluni.ru/subject/52/ma",
  demo:"https://od.globaluni.ru/attachment/1583358/download",
  syllabus:"https://od.globaluni.ru/attachment/1584298/download",
  topics:["Analytical chemistry","Physical chemistry","Materials characterization","Chemical thermodynamics","Chemical kinetics","Organic synthesis","Coordination chemistry","Electrochemistry","Spectroscopy"]},
 biology:{name:"Biology & Biotechnology",ar:"الأحياء والتقنية الحيوية",
  page:"https://od.globaluni.ru/subject/45/ma",
  demo:"https://od.globaluni.ru/attachment/4096899/download",
  older:"https://od.globaluni.ru/attachment/1583346/download",
  syllabus:"https://od.globaluni.ru/attachment/4096901/download",
  topics:["Gene expression","Genomics","Biostatistics","Bioengineering","Sequencing","Microbiology","Bioprocesses","CRISPR controls","Immunology"]},
 medicine:{name:"Clinical Medicine & Public Health",ar:"الطب والصحة العامة",
  page:"https://od.globaluni.ru/subject/55/ma",
  demo:"https://od.globaluni.ru/attachment/4096979/download",
  syllabus:"https://od.globaluni.ru/attachment/4097309/download",
  topics:["Clinical epidemiology","Biostatistics","Evidence-based medicine","Public health metrics","Infectious disease","Pathophysiology","Health systems","Diagnostic accuracy","Research methods"]}
});
let next=0;
const all=[];
function choice(subject,kind,topic,en,ar,options,options_ar,correct,explain,enExplain){
 if(options.length!==4||options_ar.length!==4||correct.length<1)return;
 const id="NABD-MA-"+(++next);
 const q={id,subject,kind,topic,prompt_en:en,prompt_ar:ar,options:[...options],options_ar:[...options_ar],
  correct:[...correct],explain_en:enExplain||explain,explain_ar:explain,
  points:kind==="single"?1:3,origin:"NABD_MASTER_ORIGINAL",source:SOURCES[subject].page};
 all.push(Object.freeze(q));return q;
}
function single(s,topic,en,ar,oe,oa,correct,expAr,expEn){return choice(s,"single",topic,en,ar,oe,oa,[correct],expAr,expEn)}
function multi(s,topic,en,ar,oe,oa,c,expAr,expEn){return choice(s,"multi",topic,en,ar,oe,oa,c,expAr,expEn)}
function essay(s,topic,en,ar,modelEn,modelAr,criteria){
 const q=Object.freeze({id:"NABD-MA-"+(++next),subject:s,kind:"written",topic,prompt_en:en,prompt_ar:ar,
  model_en:modelEn,model_ar:modelAr,rubric:criteria.map((c,i)=>({en:c[0],ar:c[1],points:[3,3,2,2][i]})),
  points:10,origin:"NABD_MASTER_ORIGINAL",source:SOURCES[s].page});all.push(q);return q;
}
function oral(s,topic,en,ar,points){
 const q=Object.freeze({id:"NABD-MA-"+(++next),subject:s,kind:"oral",topic,prompt_en:en,prompt_ar:ar,
  rubric:points,points:5,origin:"NABD_MASTER_ORIGINAL",source:SOURCES[s].page});all.push(q);return q;
}
// Chemistry: master's topics — spectroscopy, thermodynamics, analytical methods, reaction mechanisms.
single("chemistry","NMR spectroscopy","An NMR resonance is shifted downfield when the proton experiences:",
 "تتحرك إشارة بروتون NMR إلى أسفل المجال عند:",
 ["More electron shielding","Less electron shielding","Faster sample spinning","No magnetic field"],
 ["حجب إلكتروني أكبر","حجب إلكتروني أقل","دوران أسرع للعينة","غياب المجال المغناطيسي"],1,
 "الحجب الإلكتروني الأقل يزيد إزالة الحجب فتزداد الإزاحة الكيميائية.","Less electronic shielding generally causes a higher chemical shift (downfield).");
single("chemistry","Gibbs free energy","At constant temperature and pressure, a process is thermodynamically spontaneous when ΔG is:",
 "عند ثبوت الحرارة والضغط، تكون العملية تلقائية ترموديناميكيًا إذا كانت ΔG:",
 ["Positive","Zero only","Negative","Equal to ΔH always"],["موجبة","صفر فقط","سالبة","تساوي ΔH دائمًا"],2,
 "ΔG سالبة تدل على تلقائية العملية في اتجاهها المدروس.","Spontaneity is favored when Gibbs free-energy change is negative.");
single("chemistry","Arrhenius kinetics","In the Arrhenius equation, the slope of ln(k) versus 1/T is:",
 "في معادلة أرهينيوس، ما ميل منحنى ln(k) مقابل 1/T؟",
 ["Ea/R","−Ea/R","R/Ea","−RT"],["Ea/R","−Ea/R","R/Ea","−RT"],1,
 "من ln(k)=ln(A)−Ea/(RT) فإن الميل =−Ea/R.","Arrhenius linearization yields ln(k)=ln(A)−(Ea/R)(1/T).");
single("chemistry","Chromatography","Increasing chromatographic resolution most directly means:",
 "ماذا تعني زيادة دقة الفصل الكروماتوغرافي؟",
 ["Greater overlap of analyte peaks","Better separation between peaks","Higher sample mass only","Loss of detector sensitivity"],
 ["تداخلًا أكبر للقمم","فصلًا أفضل بين القمم","زيادة كتلة العينة فقط","فقد حساسية الكاشف"],1,
 "كلما زادت الدقة انفصلت القمم بصورة أفضل وأمكن تمييز المكونات.","Higher resolution implies less overlapping peaks and better distinction of compounds.");
single("chemistry","Electrochemistry","At 25°C, the Nernst equation predicts electrode potential changes with:",
 "عند 25°م، بماذا يرتبط تغير جهد القطب وفق نرنست؟",
 ["Reaction quotient Q","Sample color only","Stirring speed alone","Only electrode mass"],
 ["حاصل التفاعل Q","لون العينة فقط","سرعة التحريك فقط","كتلة القطب وحدها"],0,
 "ترتبط E بجهدها القياسي وبحاصل التفاعل Q والحرارة وعدد الإلكترونات.","E=E°−(RT/nF)lnQ depends on composition through Q.");
single("chemistry","X-ray diffraction","XRD is particularly useful for determining a crystalline material's:",
 "في ماذا يفيد حيود الأشعة السينية XRD على نحو خاص؟",
 ["Crystal structure","Patient blood type","Solution pH alone","Thermal conductivity directly"],
 ["البنية البلورية","فصيلة الدم","الرقم الهيدروجيني وحده","الناقلية الحرارية مباشرة"],0,
 "تعطي أنماط الحيود معلومات عن المسافات البينية والبنية والطور البلوري.","Diffraction peak positions reveal lattice spacings and crystalline phases.");
single("chemistry","Organic mechanisms","An SN2 reaction usually proceeds through:",
 "ما آلية تفاعل SN2 غالبًا؟",
 ["A stable carbocation intermediate","Concerted backside attack","Free-radical chain propagation","Two independent electron transfers"],
 ["كربوكاتيون وسيط ثابت","هجوم خلفي بخطوة واحدة","سلسلة جذور حرة","انتقالَي إلكترون مستقلين"],1,
 "SN2 آلية متزامنة بهجوم خلفي وعادة انقلاب في التشكيل.","SN2 is concerted and commonly gives inversion at the reacting stereocenter.");
single("chemistry","Coordination chemistry","A strong-field ligand often produces:",
 "ماذا يُنتج الليغاند قوي المجال غالبًا؟",
 ["Larger crystal-field splitting","No splitting of d orbitals","Only ionic bonding","Zero metal oxidation state"],
 ["انقسامًا أكبر للمستويات d","غياب انقسام مدارات d","روابط أيونية فقط","عدد أكسدة معدني صفر"],0,
 "الليغاند قوي المجال يرفع فرق الطاقة البلوري Δ ما يؤثر في ترتيب الإلكترونات.","Strong-field ligands increase splitting Δ and can favor low-spin configurations.");
multi("chemistry","Spectroscopic method selection","Which techniques may help characterize an unknown organic compound?","أي تقنيات قد تساعد على توصيف مركب عضوي مجهول؟",
 ["NMR for chemical environments","IR for functional groups","Mass spectrometry for mass-to-charge signals","Assuming color alone establishes exact molecular structure"],
 ["NMR لبيئة الذرات","IR للمجموعات الوظيفية","مطياف الكتلة لنسبة الكتلة إلى الشحنة","الاعتماد على اللون وحده لتحديد البنية بدقة"],[0,1,2],
 "تتكامل NMR وIR وMS في تحليل البنية؛ اللون وحده لا يكفي.","NMR, IR and MS provide complementary structural information; color is not definitive.");
multi("chemistry","Reaction thermodynamics","Which statements about chemical equilibrium are scientifically valid?","أي العبارات عن الاتزان الكيميائي صحيحة؟",
 ["At equilibrium ΔG for the reaction direction equals zero","Reaction quotient equals equilibrium constant","Catalysts can alter the time to equilibrium","A catalyst alone always changes K"],
 ["عند الاتزان ΔG=0","في الاتزان Q=K","قد يغيّر المحفز زمن الوصول للاتزان","المحفز وحده يغيّر K دائمًا"],[0,1,2],
 "عند الاتزان Q=K وΔG=0؛ المحفز يؤثر في السرعة لا في K.","At equilibrium Q=K, ΔG=0; catalysts speed equilibration but do not change K.");
multi("chemistry","Materials characterization","Which observations are useful when comparing two crystalline materials?","أي قياسات مفيدة لمقارنة مادتين بلوريتين؟",
 ["XRD diffraction patterns","SEM morphology","Thermal analysis such as DSC","Color alone determines all mechanical properties"],
 ["أنماط XRD","صور SEM للبنية السطحية","التحليل الحراري DSC","اللون وحده يحدد كل الخواص الميكانيكية"],[0,1,2],
 "تقنيات الحيود والمجهر والتحليل الحراري تكمّل بعضها في توصيف المواد.","XRD, SEM and thermal analysis interrogate complementary material properties.");
multi("chemistry","Analytical validation","Which are important for analytical method validation?","أي العناصر ضرورية للتحقق من صلاحية طريقة تحليلية؟",
 ["Calibration and linearity","Precision and accuracy","Detection limit where relevant","Ignoring blanks and interference"],
 ["المعايرة والخطية","الدقة والإحكام","حد الكشف عند الحاجة","تجاهل الفراغات والتداخلات"],[0,1,2],
 "يجب تقييم الخطية والدقة والإحكام وحد الكشف وتداخلات القياس.","Calibration, accuracy, precision and limits of detection support method validity.");
essay("chemistry","Reaction kinetics","A reaction follows first-order kinetics with a half-life of 20 min. Derive the rate constant in min⁻¹, calculate the fraction remaining after 60 min, and explain what experimental evidence would support first-order behavior.",
 "تفاعل من الرتبة الأولى زمن نصف عمره 20 دقيقة. اشتق ثابت السرعة بالدقيقة⁻¹، واحسب الجزء المتبقي بعد 60 دقيقة، وما الدليل التجريبي على الرتبة الأولى؟",
 "k=ln2/t½=0.693/20=0.0347 min⁻¹. After 60 min, three half-lives elapse, so fraction remaining=(1/2)^3=0.125 (12.5%). A linear ln[C] versus t plot supports first-order kinetics; a constant half-life across concentration ranges also supports it.",
 "k=0.693/20=0.0347 دقيقة⁻¹. بعد 60 دقيقة تمر ثلاثة أنصاف عمر ويبقى 1/8=12.5%. الخطية بين ln[C] والزمن وثبات نصف العمر يدعمان الرتبة الأولى.",
 [["Derive correct first-order half-life relation","اشتقاق علاقة نصف العمر"],["Calculate k=0.0347 min⁻¹","حساب ثابت السرعة"],["Calculate 12.5% remaining","حساب الجزء المتبقي"],["Discuss experimental kinetic verification","شرح التحقق التجريبي"]]);
essay("chemistry","Spectroscopy problem solving","An unknown pure organic sample shows a broad IR absorption around 3300 cm⁻¹ and a strong band near 1710 cm⁻¹. Propose functional-group interpretations, discuss ambiguity, and identify two additional measurements to support structural assignment.",
 "عينة عضوية نقية مجهولة لها امتصاص IR عريض نحو 3300 cm⁻¹ وحزمة قوية قرب 1710 cm⁻¹. اقترح المجموعات الوظيفية وحدود الاستدلال وقياسين إضافيين لتأكيد البنية.",
 "A broad 3300 cm⁻¹ band may indicate O–H (or N–H depending on shape) and 1710 cm⁻¹ strongly suggests a carbonyl C=O. A carboxylic acid is one possibility, although its broad O–H often spans ~2500–3300 cm⁻¹; other carbonyl/hydroxyl combinations remain possible. NMR, MS, and chemical tests can help distinguish structures.",
 "قد تشير الحزمة العريضة إلى O–H أو N–H، و1710 إلى كربونيل C=O. الحمض الكربوكسيلي احتمال وليس تفسيرًا قطعيًا؛ يمكن استخدام NMR وMS وتجارب نوعية للتأكيد.",
 [["Identify IR functional groups cautiously","تفسير الحزم الوظيفية بحذر"],["Discuss plausible structural hypotheses","عرض احتمالات البنية"],["Note IR ambiguity / non-unique structures","تحديد قصور IR"],["Recommend two complementary tests","اقتراح تحليلين داعمين"]]);
essay("chemistry","Thermodynamic feasibility","For a process ΔH=+40 kJ/mol and ΔS=+150 J/(mol·K), calculate ΔG at 298 K and estimate the temperature above which ΔG becomes negative. Explain assumptions.",
 "عملية ΔH=+40 kJ/mol وΔS=+150 J/(mol·K). احسب ΔG عند 298 كلفن والحرارة التي تصبح عندها ΔG سالبة وفسر الافتراضات.",
 "Convert ΔS=0.150 kJ/(mol·K). ΔG(298)=40−298×0.150=−4.70 kJ/mol. Threshold T=ΔH/ΔS=40/0.150≈266.7 K. For T>266.7 K, ΔG<0 assuming ΔH and ΔS roughly temperature-independent over the interval.",
 "ΔS=0.150 كيلوجول/(مول·كلفن)؛ ΔG=40−298×0.150=−4.70 كيلوجول/مول. الحد نحو 266.7 كلفن، وتصبح العملية مفضلة ترموديناميكيًا فوقه مع افتراض ثبات ΔH وΔS تقريبًا.",
 [["Convert entropy units","تحويل وحدات الإنتروبيا"],["Calculate ΔG at 298 K","حساب ΔG عند 298"],["Solve threshold temperature correctly","حساب درجة العتبة"],["Discuss temperature dependence assumptions","مناقشة الافتراضات"]]);
oral("chemistry","Experimental method design","Explain how you would validate a new analytical method for measuring a trace metal in environmental water, including controls and uncertainty.","اشرح كيف تتحقق من صلاحية طريقة تحليل جديدة لقياس معدن نادر في المياه البيئية، مع الضوابط وعدم اليقين.",["Calibration","Blanks","Precision and recovery","Interference","Uncertainty and reporting"]);
// Biology and biotech — molecular tools, genomics, controls, bioprocesses.
single("biology","qPCR analysis","In qPCR, a lower Ct value usually indicates:",
 "في qPCR ما دلالة Ct الأقل عادةً؟",
 ["Less starting target","More starting target","Absent amplification","Always degraded primers"],
 ["قالبًا أوليًا أقل","قالبًا أوليًا أكثر","غياب التضخيم","بادئات متدهورة دائمًا"],1,
 "العتبة تصل أسرع عند وجود كمية ابتدائية أكبر بشرط تساوي الكفاءة.","Lower Ct usually indicates higher initial template abundance, assuming comparable efficiency.");
single("biology","NGS","Sequencing depth most directly refers to:",
 "ما المقصود بعمق التسلسل الجيني؟",
 ["Average number of reads covering a locus","Number of microscopes used","RNA molecular weight","Total sample volume"],
 ["متوسط القراءات التي تغطي موضعًا جينيًا","عدد المجاهر","الكتلة الجزيئية لـRNA","حجم العينة"],0,
 "عمق التسلسل يعبّر عن عدد القراءات التي تغطي منطقة معينة.","Read depth captures sequencing coverage at a locus.");
single("biology","CRISPR controls","A negative control for CRISPR editing is useful primarily to:",
 "لماذا نستخدم شاهدًا سلبيًا في تجربة CRISPR؟",
 ["Measure baseline effects unrelated to target editing","Guarantee no off-target effects","Replace sequencing validation","Change target DNA automatically"],
 ["قياس آثار خلفية مستقلة عن التحرير المستهدف","ضمان عدم وجود آثار خارج الهدف","الاستغناء عن التحقق بالتسلسل","تغيير DNA الهدف تلقائيًا"],0,
 "الشاهد يفرق بين أثر تحرير الهدف وتأثيرات عملية التوصيل أو المعالجة.","A negative control helps isolate treatment or delivery effects from target editing.");
single("biology","Flow cytometry","In flow cytometry, forward scatter (FSC) is often associated with:",
 "بماذا يرتبط FSC في قياس التدفق الخلوي عادةً؟",
 ["Approximate cell size","DNA sequence exactly","Specific protein phosphorylation","Only sample temperature"],
 ["الحجم التقريبي للخلية","تسلسل DNA الدقيق","فسفرة بروتين معين","حرارة العينة فقط"],0,
 "يرتبط FSC تقريبيًا بحجم الخلايا ويحتاج سياقًا ومعايرة.","FSC typically correlates with cell size, subject to instrument and sample context.");
single("biology","Microbial growth","During exponential microbial growth, the log of cell concentration vs time is approximately:",
 "خلال النمو الميكروبي الأسي، ما شكل ln(تركيز الخلايا) مقابل الزمن؟",
 ["Linear","Always parabolic","Constant at zero","Undefined for any sample"],
 ["خطي","قطع مكافئ دائمًا","ثابت عند الصفر","غير معرف لكل عينة"],0,
 "إذا N=N₀e^(μt) فإن ln N=ln N₀+μt ويكون خطيًا.","N=N0 e^(μt), so lnN=lnN0+μt; slope is growth rate μ.");
single("biology","Biostatistics","An adjusted regression model is often used to:",
 "لماذا نستخدم نموذج انحدار معدلًا في تحليل البيانات الحيوية؟",
 ["Account for measured potential confounders","Prove causality automatically","Remove all selection bias","Guarantee randomization"],
 ["التحكم في عوامل إرباك مقاسة","إثبات السببية تلقائيًا","إزالة كل انحياز الاختيار","ضمان العشوائية"],0,
 "يسمح الانحدار بالتعامل مع عوامل مربكة مقاسة وليس كل مصادر التحيز.","Adjustment can account for measured covariates; it cannot by itself prove causality.");
single("biology","Gene regulation","Which technique measures transcript abundance genome-wide?",
 "أي تقنية تقيس وفرة نسخ RNA على مستوى واسع من الجينوم؟",
 ["RNA-seq","Standard Gram staining","Light microscopy only","Simple centrifugation"],
 ["تسلسل RNA (RNA-seq)","صبغة غرام المعتادة","المجهر الضوئي فقط","الطرد المركزي البسيط"],0,
 "يقيس RNA-seq مستويات النسخ الجينية ويمكنه مقارنة التعبير بين حالات.","RNA-seq quantifies transcript abundance across many genes.");
single("biology","Bioprocess design","In a chemostat at steady state (without washout), specific growth rate μ generally equals:",
 "في المزرعة المستمرة (chemostat) بحالة مستقرة دون غسل الخلايا، ما علاقة μ بمعدل التخفيف D؟",
 ["2D","D","0 always","D²"],["2D","D","0 دائمًا","D²"],1,
 "عند الاستقرار μ=D في الظروف النموذجية قبل حدوث washout.","For an ideal chemostat at steady state before washout, μ=D.");
multi("biology","RNA-seq interpretation","Which issues should be considered when comparing RNA-seq groups?","ما الاعتبارات الضرورية عند مقارنة مجموعات RNA-seq؟",
 ["Normalization and library size","Biological replication","Multiple-testing adjustment","Assuming batch effects never matter"],
 ["تطبيع حجم المكتبة","التكرارات البيولوجية","تصحيح الاختبارات المتعددة","افتراض عدم أهمية دفعات التشغيل"],[0,1,2],
 "يعتمد تحليل RNA-seq السليم على التطبيع والتكرار والتحكم بالإيجابيات الكاذبة والانحياز الدفعي.","Normalization, replication, multiple-testing correction and batch assessment are essential.");
multi("biology","CRISPR specificity","Which methods can help assess CRISPR editing outcomes?","أي الطرق تفيد في تقييم نتائج تحرير CRISPR؟",
 ["Target-site sequencing","Appropriate negative controls","Off-target assessment when relevant","Assuming perfect specificity without testing"],
 ["تسلسل موضع التحرير","الضوابط السلبية","فحص آثار خارج الهدف عند الحاجة","افتراض النوعية الكاملة دون فحص"],[0,1,2],
 "يحتاج التحقق من التحرير إلى تسلسل وضوابط وفحص ملائم لاحتمالات التحرير غير المقصود.","Sequencing, controls and relevant off-target checks support quality assessment.");
multi("biology","Bioprocess monitoring","Which parameters are informative during microbial fermentation?","أي مؤشرات مهمة عند مراقبة تخمير ميكروبي؟",
 ["Dissolved oxygen","pH","Substrate concentration","Ignoring biomass measurements by default"],
 ["الأكسجين المذاب","pH","تركيز المادة الغذائية","تجاهل قياس الكتلة الحيوية دائمًا"],[0,1,2],
 "متابعة الأكسجين وpH والركيزة والكتلة الحيوية ضرورية لفهم أداء العملية.","Oxygen, pH, substrate and biomass measurements characterize fermentation.");
multi("biology","Study design","Which strengthen a gene-expression experiment's interpretability?","أي الإجراءات تقوي تفسير تجربة التعبير الجيني؟",
 ["Independent biological replicates","Prespecified analysis plan","Documented batch effects","Selecting only samples that confirm a desired hypothesis"],
 ["مكررات بيولوجية مستقلة","خطة تحليل مسبقة","توثيق تأثير دفعات العمل","اختيار العينات الموافقة للفرضية فقط"],[0,1,2],
 "تقلل المكررات والتخطيط والتوثيق من التحيز، ولا يجوز انتقاء النتائج المؤيدة فقط.","Replication, prespecification and batch tracking reduce avoidable bias.");
essay("biology","qPCR fold change","A gene has Ct target=24, Ct reference=20 in control, and Ct target=22, Ct reference=20 in treatment. Assuming 100% amplification efficiency, calculate ΔCt for each group, ΔΔCt and fold change (2^−ΔΔCt). Explain the key assumption.",
 "الجين المستهدف Ct=24 والمرجعي Ct=20 في الضبط، وفي المعالجة Ct المستهدف=22 والمرجعي=20. بافتراض كفاءة تضخيم 100%، احسب ΔCt وΔΔCt والتغير النسبي.",
 "Control ΔCt=24−20=4; treatment ΔCt=22−20=2. ΔΔCt=2−4=−2; fold change=2²=4, i.e. 4-fold higher normalized expression in treatment. This assumes comparable near-100% amplification efficiencies and stable reference expression.",
 "ΔCt للضبط=4 وللمعالجة=2؛ ΔΔCt=−2؛ التغير 2²=4 أي ارتفاع أربعة أضعاف، بشرط تساوي كفاءة التضخيم وثبات الجين المرجعي.",
 [["Correct ΔCt calculations","حساب ΔCt لكل مجموعة"],["Correct ΔΔCt","حساب ΔΔCt"],["Compute 4-fold expression change","حساب الارتفاع أربعة أضعاف"],["State efficiency/reference assumptions","افتراضات كفاءة التضخيم وثبات المرجع"]]);
essay("biology","Biostatistics hypothesis testing","A small study finds p=0.04 for differential gene expression across 20,000 tests. Explain why nominal p<0.05 alone is inadequate, outline FDR control and suggest two validation steps.",
 "وجدت دراسة تعبير جيني p=0.04 عبر 20000 اختبار. لماذا لا يكفي p<0.05 وحده؟ اشرح مفهوم التحكم في FDR واقترح خطوتين للتحقق.",
 "At 20,000 nominal tests many false positives are expected without multiplicity control. Apply FDR methods such as Benjamini–Hochberg using all tested p-values. Validate with independent biological samples or qPCR, examine effect sizes, controls and sequencing quality.",
 "مع كثرة الاختبارات تنتج إيجابيات كاذبة؛ يُستخدم تصحيح FDR مثل Benjamini–Hochberg على كل القيم. يُفضّل تكرار بيولوجي مستقل أو qPCR مع فحص حجم الأثر وجودة البيانات.",
 [["Recognize multiple comparison problem","مشكلة المقارنات المتعددة"],["Describe FDR correction appropriately","شرح تصحيح FDR"],["Suggest independent validation","التحقق بعينات مستقلة"],["Consider effect size and controls","حجم الأثر والضوابط"]]);
essay("biology","Experimental design","Design a controlled experiment to measure whether a gene knockout changes microbial growth. Include a negative control, biological replicates, growth measurement and one possible confounder.",
 "صمّم تجربة مضبوطة لمعرفة أثر تعطيل جين على نمو ميكروب، متضمنة شاهدًا سلبيًا وتكرارات بيولوجية وقياس النمو وعامل إرباك محتمل.",
 "Compare independently derived knockout and isogenic wild-type strains grown under matched conditions; optionally include complementation. Use multiple biological replicates, measure OD600 and/or viable counts at defined times, calculate growth curves/μ, and control for medium, inoculum size, temperature and unintended off-target mutations.",
 "قارن سلالة حذف الجين بسلالة برية متماثلة خلفيًا مع تكرارات مستقلة ونفس ظروف النمو؛ قس OD600 أو المستعمرات وارسم منحنى النمو، وراقب حرارة الوسط وحجم اللقاح والطفرات غير المقصودة.",
 [["Clear testable hypothesis and controls","فرضية وضوابط قابلة للاختبار"],["Biological replication and consistency","التكرار وضبط الظروف"],["Quantitative growth measurement","قياس النمو كميًا"],["Discuss confounders / complementation","العوامل المربكة أو الإكمال الجيني"]]);
oral("biology","Research hypothesis and controls","Describe a research plan to compare differential expression of a target gene in two cell types, including replication and validity threats.","صف خطة بحثية لمقارنة التعبير الجيني بين نوعين من الخلايا مع التكرار وتهديدات الصدق.",["Research hypothesis","Sampling","Controls","Statistical approach","Bias and reproducibility"]);
// Clinical Medicine & PUBLIC HEALTH master's (not a basic medical specialty licence)
single("medicine","Diagnostic tests","Test sensitivity measures the proportion of:",
 "ما الذي تمثله حساسية الاختبار التشخيصي؟",
 ["True cases testing positive","Noncases testing negative","Positive results that are true cases","All people testing positive"],
 ["المصابين الحقيقيين بنتيجة موجبة","غير المصابين بنتيجة سالبة","الموجبين المصابين فعلاً","جميع من نتيجتهم موجبة"],0,
 "الحساسية = TP/(TP+FN).","Sensitivity = true positives divided by all actual cases.");
single("medicine","Study design","Which study design directly estimates incidence by following exposed and unexposed groups over time?","أي تصميم يقدّر الحدوث بمتابعة مجموعتين معرّضة وغير معرّضة عبر الزمن؟",
 ["Cross-sectional","Cohort","Case report","Ecological only"],
 ["مقطعية","أترابية Cohort","تقرير حالة","بيئية فقط"],1,
 "الدراسة الأترابية تتابع المعرّضين وغير المعرّضين لحساب معدل الحدوث.","A cohort design can estimate incidence and relative risks over follow-up.");
single("medicine","Biostatistics","A 95% confidence interval for a risk ratio includes 1.0. What is a cautious interpretation?","إذا شمل مجال ثقة 95% لنسبة المخاطر القيمة 1.0، فما الاستنتاج الحذر؟",
 ["Proof of no effect","Evidence at the 5% level is not sufficient to exclude RR=1","Proof of confounding","Proof of benefit"],
 ["برهان انعدام الأثر","لا تكفي الأدلة لاستبعاد RR=1 عند مستوى 5%","برهان الإرباك","برهان الفائدة"],1,
 "اشتمال المجال على 1 يعني عدم دلالة إحصائية ضمن الاختبار المعتاد، وليس إثبات عدم الأثر.","CI includes the null RR=1, so significance is not established at the conventional two-sided 5% level.");
single("medicine","Health systems","Which indicator is generally a process measure rather than a population health outcome?","أي مؤشر يعد مقياسًا لعملية تقديم الخدمة لا لنتيجة صحة سكانية؟",
 ["Infant mortality rate","Percentage of eligible patients screened","Life expectancy","Disease incidence"],
 ["وفيات الرضع","نسبة المؤهلين الذين أُجرِي لهم فحص","متوسط العمر المتوقع","حدوث المرض"],1,
 "تغطية الفحص مؤشر عملية، أما الوفيات والحدوث والعمر المتوقع فهي نتائج.","Screening coverage is a care-process indicator; mortality and incidence are outcomes.");
single("medicine","Causal inference","Confounding in observational research arises when a variable is associated with:",
 "متى يحدث الإرباك في البحث الرصدي؟",
 ["Exposure and outcome (outside the causal pathway)","Only the study title","Neither exposure nor outcome","Randomized allocation alone"],
 ["التعرض والنتيجة دون أن يكون في المسار السببي","عنوان الدراسة فقط","لا التعرض ولا النتيجة","التخصيص العشوائي وحده"],0,
 "العامل المربك يرتبط بالتعرض والنتيجة ويشوّه العلاقة المقدّرة إن لم يُضبط.","A confounder affects the exposure-outcome comparison and can bias its estimate.");
single("medicine","Health economics","An intervention costs $2,000 extra and gains 0.1 additional QALY versus comparator. The ICER is:",
 "تدخل يكلف 2000$ إضافية ويضيف 0.1 QALY مقارنة بالبديل. ما ICER؟",
 ["$200/QALY","$2,000/QALY","$20,000/QALY","$200,000/QALY"],
 ["200$/QALY","2000$/QALY","20000$/QALY","200000$/QALY"],2,
 "ICER=التكلفة الإضافية/المنفعة الإضافية=2000/0.1=20000 دولار لكل QALY.","ICER=incremental cost/incremental QALYs=2000/0.1=$20,000 per QALY.");
single("medicine","Infectious disease","Which concept is most directly reduced when a vaccine lowers disease incidence in a susceptible population?","أي قياس يتناقص مباشرةً إذا خفض اللقاح حدوث المرض في جماعة حساسة؟",
 ["Risk of new cases","DNA mutation rate necessarily","Every source of confounding","All-cause mortality always to zero"],
 ["خطر الحالات الجديدة","معدل طفرات DNA حتمًا","كل عوامل الإرباك","الوفيات الكلية إلى الصفر"],0,
 "اللقاح الذي يمنع حالات جديدة يقلل خطر الحدوث، ولا يلزم أن يؤثر في بقية المقاييس.","Preventing new cases reduces incidence risk; other outcomes require separate evidence.");
single("medicine","Evidence-based practice","In a systematic review, publication bias can lead to:",
 "ما أثر انحياز النشر في مراجعة منهجية؟",
 ["Over-representation of positive findings","Perfectly balanced results","Randomization of all studies","No effect on pooled estimates"],
 ["تمثيل زائد للنتائج الإيجابية","توازن مثالي","عشوائية كل الدراسات","لا أثر على التقدير التجميعي"],0,
 "يمكن أن تُنشر الدراسات الإيجابية بمعدل أعلى مما يشوه التقدير المجمع.","Selective publication of positive studies may bias pooled estimates.");
multi("medicine","Diagnostic accuracy","Which are required to interpret a positive predictive value properly?","أي العوامل مهمة لتفسير القيمة التنبؤية الإيجابية؟",
 ["Sensitivity","Specificity","Disease prevalence","Only the test manufacturer’s marketing claim"],
 ["الحساسية","النوعية","انتشار المرض","تصريح تسويقي وحده"],[0,1,2],
 "تعتمد PPV على الحساسية والنوعية والانتشار.","PPV depends jointly on sensitivity, specificity and pretest prevalence.");
multi("medicine","Quality improvement","Which practices strengthen a quality-improvement evaluation?","ما الإجراءات التي تعزز تقييم مبادرة تحسين جودة صحية؟",
 ["Predefined process/outcome measures","Run charts over time","Monitoring unintended consequences","Changing all definitions after seeing results"],
 ["مؤشرات عملية ونتيجة محددة مسبقًا","مخططات زمنية","مراقبة آثار غير مقصودة","تغيير التعاريف بعد النتائج"],[0,1,2],
 "تحتاج مبادرات الجودة مؤشرات ثابتة، وتحليلًا زمنيًا، ومراقبة الآثار الجانبية.","Quality improvement benefits from stable measures, time-series data and balancing measures.");
multi("medicine","Research interpretation","Which statements about relative risk are correct?","أي العبارات عن RR صحيحة؟",
 ["RR=1 represents equal risks","RR>1 may suggest higher risk among exposed","Confidence intervals express statistical uncertainty","RR alone always proves causation"],
 ["RR=1 يشير لتساوي الأخطار","RR>1 قد يدل على خطر أعلى لدى المعرّضين","مجالات الثقة تعبّر عن عدم اليقين","RR وحدها تثبت السببية دائمًا"],[0,1,2],
 "RR يقارن أخطار مجموعتين؛ لا يثبت وحده السببية.","Relative risk compares event risks; causal inference requires more than association.");
multi("medicine","Epidemiologic surveillance","Which considerations support reliable disease surveillance?","ما العناصر التي تدعم ترصدًا وبائيًا موثوقًا؟",
 ["Consistent case definitions","Completeness of reporting","Timely data and denominators","Ignoring changes in testing practices"],
 ["تعاريف حالات موحدة","اكتمال الإبلاغ","حداثة البيانات والمقامات المناسبة","تجاهل تغير ممارسات الفحص"],[0,1,2],
 "تؤثر تعاريف الحالات واكتمال البيانات وتغير الفحوص في مقارنة الاتجاهات.","Stable definitions, reporting completeness and testing context are critical.");
essay("medicine","Relative risk and bias","A cohort study follows 200 exposed persons (40 cases) and 300 unexposed persons (30 cases). Calculate both risks, relative risk and risk difference. Discuss one possible confounder.",
 "تابعت دراسة أترابية 200 معرّض (40 حالة) و300 غير معرّض (30 حالة). احسب الخطر في المجموعتين وRR وفرق الخطر وناقش مربكًا محتملًا.",
 "Risk exposed=40/200=0.20 (20%). Risk unexposed=30/300=0.10 (10%). RR=0.20/0.10=2.0. Risk difference=0.10=10 percentage points. A variable associated with exposure and outcome (e.g. age) may confound the estimate.",
 "الخطر لدى المعرّضين 20% وغير المعرّضين 10%؛ RR=2.0 وفرق الخطر=10 نقاط مئوية. قد يربك العمر العلاقة إذا ارتبط بالتعرض والنتيجة.",
 [["Correct two risks and denominators","حساب الخطر بالمقامين الصحيحين"],["Compute RR=2 accurately","حساب RR=2"],["Compute absolute risk difference","حساب فرق الخطر"],["Discuss a plausible confounder","شرح مربك محتمل"]]);
essay("medicine","Screening and prevalence","A hypothetical screening program tests 2,000 individuals with 2% prevalence, sensitivity=90%, specificity=95%. Calculate expected TP, FP, and PPV, and explain what low prevalence implies.",
 "في برنامج فحص افتراضي لـ2000 شخص وانتشار 2%، الحساسية 90% والنوعية 95%. احسب الإيجابيات الحقيقية والكاذبة وPPV وفسر أثر الانتشار المنخفض.",
 "Cases=40, noncases=1960. True positives=0.90×40=36. False positives=0.05×1960=98. PPV=36/(36+98)=26.87%. Low prevalence can create more false-positive than true-positive results even when a test appears reasonably accurate.",
 "المصابون 40 وغير المصابين 1960؛ TP=36 وFP=98؛ PPV=36/134≈26.87%. قد تتجاوز الإيجابيات الكاذبة الحقيقية عند انتشار منخفض.",
 [["Calculate case and noncase counts","حساب المصابين وغير المصابين"],["Correct sensitivity and specificity application","تطبيق الحساسية والنوعية"],["Calculate PPV≈26.9%","حساب PPV"],["Interpret low prevalence limitation","تفسير أثر الانتشار"]]);
essay("medicine","Critical appraisal","A nonrandomized hospital study reports lower mortality following a new protocol. Explain at least three reasons why association alone may not establish causation and propose a stronger evaluation strategy.",
 "سجلت دراسة مستشفى غير عشوائية وفيات أقل بعد بروتوكول جديد. اشرح ثلاثة أسباب لعدم إثبات السببية واقترح تقييمًا أقوى.",
 "Alternative explanations include secular trends, changes in case mix/severity, selection bias, measurement changes, concurrent interventions, and regression to the mean. A cluster-randomized trial if feasible, or interrupted time series with multiple points and appropriate comparators, can improve causal evaluation; prespecification and balancing measures are important.",
 "قد تتداخل الاتجاهات الزمنية وتغير شدة الحالات وانحياز الاختيار وتبدل القياس وتدخلات متزامنة. يمكن استخدام تجربة عشوائية عنقودية أو سلسلة زمنية متقطعة مع مقارنة وضبط المؤشرات.",
 [["Identify confounding and case-mix issues","مربكات وشدة الحالات"],["Identify temporal/selection/measurement biases","انحيازات الزمن والاختيار والقياس"],["Propose stronger evaluation design","اقتراح تصميم أقوى"],["Specify practical controls and limitations","ضوابط وحدود التفسير"]]);
oral("medicine","Evidence-based public health","Explain how you would evaluate a community screening program, including benefits, harms, test accuracy, equity and cost-effectiveness.","اشرح كيف تقيّم برنامج فحص مجتمعي من حيث الفوائد والأضرار ودقة الاختبار والعدالة والجدوى الاقتصادية.",["Benefits and target population","Test accuracy","False positives/harms","Equity and feasibility","Cost-effectiveness"]);
// Further independently written Master's questions in each academic area.
single("chemistry","Internal standards","What is the primary purpose of an internal standard in quantitative instrumental analysis?",
 "ما الهدف الأساسي من استخدام معيار داخلي في تحليل كمي بجهاز تحليلي؟",
 ["Correct instrumental variation and preparation effects","Automatically identify every impurity","Replace all calibration curves","Prove zero measurement uncertainty"],
 ["تصحيح تباين الجهاز والتحضير","تحديد كل الشوائب تلقائيًا","الاستغناء عن المعايرة تمامًا","إثبات انعدام عدم اليقين"],0,
 "يمكن للمعيار الداخلي تعويض تغيرات الاستجابة وحجم التحضير عندما يستخدم بصورة صحيحة.","An internal standard can correct signal fluctuation and sample-preparation variation.");
single("chemistry","Diffusion and transport","According to Fick's first law J=−D dc/dx, the negative sign means diffusion is:",
 "وفق قانون فيك الأول J=−D dc/dx، ما معنى الإشارة السالبة؟",
 ["Toward higher concentration","Down the concentration gradient","Unrelated to concentration","Always opposite to temperature change"],
 ["نحو تركيز أعلى","نحو اتجاه انخفاض التركيز","لا علاقة له بالتركيز","بعكس تغير الحرارة دائمًا"],1,
 "يشير السالب إلى انتقال المادة نحو انخفاض التركيز عند الانتشار الاعتيادي.","The negative sign points flux down the concentration gradient.");
multi("chemistry","Thermal analysis and phase transitions","Which techniques or observations aid investigation of thermal behavior of materials?",
 "أي تقنيات أو ملاحظات تساعد في تحليل السلوك الحراري للمواد؟",
 ["DSC can detect heat-flow changes near transitions","TGA can track mass changes with temperature","Dilatometry may reveal thermal expansion","A single material color measurement fully determines heat capacity"],
 ["يكشف DSC تغيرات تدفق الحرارة قرب التحولات","يتتبع TGA تغير الكتلة مع الحرارة","قد يقيس التمدد الحراري تغير الأبعاد","قياس اللون وحده يحدد السعة الحرارية كاملةً"],[0,1,2],
 "يمكن تكامل DSC وTGA والتمدد الحراري؛ اللون وحده لا يحدد الخواص الحرارية.","DSC, TGA and dilatometry provide complementary thermal information.");
multi("chemistry","Organic reaction selectivity","Which factors can influence substitution mechanism or stereochemical outcome?",
 "أي عوامل قد تؤثر في آلية الاستبدال العضوي أو ناتجه الفراغي؟",
 ["Substrate structure","Solvent properties","Nucleophile strength and concentration","Every substrate necessarily gives the same mechanism"],
 ["بنية الركيزة","خواص المذيب","قوة النيوكليوفيل وتركيزه","كل الركائز تتبع آلية واحدة حتمًا"],[0,1,2],
 "الركيزة والمذيب والنيوكليوفيل تسهم في ترجيح مسارات SN1 وSN2 وانتقائية النتيجة.","Substrate, solvent and nucleophile influence SN1/SN2 pathways and stereochemistry.");
essay("chemistry","Quantitative redox analysis","A 2.00 g solid sample is digested and diluted to 250.0 mL. A 25.0 mL aliquot requires 12.0 mL of 0.0200 M dichromate to oxidize all Fe²⁺. Given 1 mol Cr₂O₇²⁻ reacts with 6 mol Fe²⁺ and M(Fe)=55.85 g/mol, calculate mass percent Fe and discuss two error sources.",
 "حُللت عينة صلبة 2.00 غ وخففت إلى 250.0 مل. احتاجت عينة فرعية 25.0 مل إلى 12.0 مل من ثنائي كرومات 0.0200 مول/لتر لأكسدة Fe²⁺، والنسبة 1:6 وM(Fe)=55.85. احسب النسبة المئوية للحديد واذكر مصدري خطأ.",
 "n(Cr₂O₇²⁻)=0.0120 L×0.0200=0.000240 mol. Fe²⁺ in aliquot =6×0.000240=0.001440 mol. Total sample Fe moles=0.001440×(250/25)=0.01440 mol; mass=0.01440×55.85=0.80424 g; percentage=0.80424/2.00×100=40.21%. Possible errors include incomplete sample dissolution, imperfect standardization or endpoint detection, and interference by other reductants.",
 "مولات ثنائي الكرومات 0.000240، ومولات Fe²⁺ بالجزء 0.001440، وبالعينة كاملة 0.01440 مول؛ الكتلة 0.80424 غ ونسبة الحديد 40.21%. قد تؤثر عدم اكتمال الإذابة أو أخطاء المعايرة ونقطة النهاية والمواد المتداخلة.",
 [["Convert titrant concentration and volume to moles","حساب مولات المعاير"],["Apply 1:6 stoichiometry and aliquot dilution","نسبة 1:6 وعامل التخفيف"],["Calculate 40.21% iron","حساب نسبة الحديد"],["Identify two analytical error sources","ذكر مصدرين للخطأ"]]);
essay("chemistry","Crystal diffraction analysis","A crystalline sample shows a strong XRD peak at 2θ=30° using X-rays of wavelength λ=0.154 nm. Calculate lattice-plane spacing from Bragg's law with n=1. Explain why a single diffraction peak cannot uniquely identify an unknown phase.",
 "عينة بلورية لها قمة XRD عند 2θ=30° وطول موجة λ=0.154 نانومتر. احسب المسافة بين المستويات بقانون براغ n=1، ولماذا لا تكفي قمة واحدة لتحديد الطور؟",
 "Bragg's law is nλ=2d sinθ. Here θ=15° and d=0.154/(2 sin15°)≈0.2975 nm. One peak represents a single spacing and may be shared by multiple structures. Indexing multiple peaks, comparing reference patterns, and considering preferred orientation/impurities is necessary for a robust phase identification.",
 "قانون براغ nλ=2d sinθ؛ θ=15° فنحصل على d=0.154/(2sin15°)≈0.2975 نانومتر. قمة واحدة قد تتشابه بين أطوار عديدة، لذا نحتاج قممًا متعددة ومرجعًا بلوريًا وفحص الشوائب.",
 [["Identify θ as half of 2θ","تمييز θ عن 2θ"],["Apply Bragg equation correctly","تطبيق قانون براغ"],["Calculate d≈0.2975 nm","استخراج المسافة"],["Explain phase identification limitation","تفسير قصور قمة واحدة"]]);
oral("chemistry","Materials research design","Present an experimental plan to compare the corrosion resistance of two alloys, including controlled conditions, electrochemical measures and reproducibility.",
 "قدم خطة تجريبية لمقارنة مقاومة سبيكتين للتآكل، مع الظروف المضبوطة والقياسات الكهروكيميائية والتكرار.",
 ["Controlled alloys and environment","Corrosion measurement","Electrochemical method","Replication and uncertainty","Interpretation and limitations"]);
oral("chemistry","Environmental analytical validation","Explain how you would design a calibration and quality-control protocol for measuring an environmental contaminant near its detection limit.",
 "اشرح تصميم بروتوكول معايرة وضبط جودة لملوث بيئي قرب حد الكشف.",
 ["Calibration","Blanks","Detection/quantification limit","Matrix effects and recovery","Uncertainty and reporting"]);

single("biology","Multiple-testing control","Which approach is widely used to control the false discovery rate in genome-wide testing?",
 "ما الإجراء الشائع لضبط معدل الاكتشافات الكاذبة في الاختبارات الجينومية الواسعة؟",
 ["Benjamini–Hochberg procedure","Ignoring the number of tested genes","Choosing the smallest p-value only","Using no biological replicates"],
 ["طريقة Benjamini–Hochberg","تجاهل عدد الجينات المختبرة","اختيار أصغر p فقط","عدم استعمال تكرارات بيولوجية"],0,
 "تُستخدم طريقة Benjamini–Hochberg لضبط FDR عبر قيم p المتعددة.","Benjamini–Hochberg can control the expected false discovery rate across many tests.");
single("biology","Recombinant DNA validation","After cloning a gene into a plasmid, which measurement most directly verifies its intended sequence?",
 "بعد استنساخ جين في بلازميد، أي فحص يؤكد تسلسله المقصود مباشرةً؟",
 ["DNA sequencing","Cell color alone","Incubator temperature","OD600 alone"],
 ["تسلسل DNA","لون الخلية وحده","حرارة الحاضنة","OD600 وحده"],0,
 "يؤكد تسلسل DNA تطابق المقطع المستنسخ مع التسلسل المستهدف.","Direct DNA sequencing verifies the insert's nucleotide identity.");
multi("biology","Flow cytometry quality controls","Which measures strengthen a multicolor flow cytometry experiment?",
 "أي الضوابط تعزز صحة تجربة قياس تدفق خلوي متعددة الألوان؟",
 ["Spectral compensation controls","Gating strategy defined consistently","Viability staining when appropriate","Ignoring fluorescence spillover"],
 ["ضوابط تعويض التداخل الطيفي","استراتيجية بوابات موحدة","صبغ الحيوية عند الحاجة","تجاهل تداخل الفلورة"],[0,1,2],
 "تساعد المعايرة والتعويض والبوابات وضبط الخلايا الميتة في تحليل أدق.","Compensation, prespecified gating and viability checks improve interpretability.");
multi("biology","Cell-culture experiments","Which are legitimate sources of unwanted bias in cell-culture research?",
 "أي العوامل قد تسبب تحيزًا غير مرغوب في تجارب زراعة الخلايا؟",
 ["Unequal cell-passage number","Mycoplasma contamination","Unrecorded media changes","Independent biological replicates inherently cause bias"],
 ["اختلاف عدد مرات تمرير الخلايا","التلوث بالميكوبلازما","تغيير الأوساط دون توثيق","المكررات البيولوجية المستقلة تسبب تحيزًا حتميًا"],[0,1,2],
 "قد يغير التلوث والمرور المتكرر والظروف غير الموثقة نتائج الخلايا.","Passage number, contamination and undocumented medium changes can confound results.");
essay("biology","Sequencing coverage and limits","A sequencing run yields 4 million high-quality paired-end reads, each 150 bp long. For a 3-million-bp reference genome, estimate mean depth assuming each pair contributes 300 distinct bases. Discuss two reasons observed local depth may differ.",
 "أنتجت تجربة تسلسل 4 ملايين زوج قراءة جيدة، طول كل قراءة 150 قاعدة. لجينوم مرجعي طوله 3 ملايين قاعدة، احسب العمق المتوسط بافتراض 300 قاعدة مستقلة لكل زوج، واشرح سببين لتباين العمق المحلي.",
 "Total bases=4,000,000 read pairs×(2×150)=1.2×10⁹ bases. Mean coverage=1.2×10⁹/(3×10⁶)=400×. Local coverage may differ because of GC bias, mapping ambiguity in repeats, filtering, duplication, or library/preparation variation. The estimate assumes all contributing bases map independently and uniformly.",
 "إجمالي القواعد =4 ملايين زوج×300=1.2 مليار قاعدة. العمق المتوقع=1.2 مليار/3 ملايين=400×. قد يتفاوت موضعيًا بسبب انحياز GC والمناطق المتكررة والتكرارات التقنية والترشيح.",
 [["Count paired-end sequenced bases correctly","حساب القواعد في الأزواج"],["Compute 400× average coverage","حساب العمق 400×"],["Explain at least two coverage biases","شرح مصدري انحياز"],["State independence/uniformity assumption","ذكر فرضيات التوزيع"]]);
essay("biology","Chemostat growth analysis","An ideal chemostat of volume 2.0 L receives fresh medium at 0.40 L/h. Under steady-state growth without washout, calculate the dilution rate and specific growth rate and explain what happens if dilution exceeds the maximum sustainable growth rate.",
 "مفاعل chemostat مثالي حجمه 2.0 لتر ويتلقى وسطًا جديدًا بمعدل 0.40 لتر/ساعة. احسب معدل التخفيف والنمو النوعي عند الاستقرار دون غسل، وفسر تجاوز التخفيف أقصى نمو ممكن.",
 "Dilution rate D=F/V=0.40/2.0=0.20 h⁻¹. At ideal steady state before washout, μ=D=0.20 h⁻¹. If D is greater than the achievable μ under growth conditions, biomass is removed faster than it reproduces and washout can occur. Steady-state assumptions, substrate limitation and mixing must be stated.",
 "معدل التخفيف D=0.40/2=0.20 ساعة⁻¹ وعند الاستقرار μ=D=0.20 ساعة⁻¹. إذا تجاوز التخفيف النمو الممكن تنخفض الكتلة الحيوية وقد يحدث washout.",
 [["Compute D=F/V","حساب D من التدفق والحجم"],["State μ=D at steady state","العلاقة μ=D"],["Explain washout at excessive D","تفسير غسل الخلايا"],["Discuss ideal model assumptions","ذكر فرضيات نموذج المفاعل"]]);
oral("biology","Bioprocess design","Explain how to scale up a fermentation process while controlling oxygen transfer, contamination and product quality.",
 "اشرح توسيع عملية تخمير حيوي مع ضبط نقل الأكسجين والتلوث وجودة المنتج.",
 ["Process goal and scale","Oxygen mass transfer","Contamination controls","Product quality","Measurement and reproducibility"]);
oral("biology","CRISPR experiment appraisal","Critically assess a proposed gene-editing experiment, including target confirmation, off-target risk, control groups and independent replication.",
 "قيّم تجربة تحرير جيني مقترحة نقديًا مع تأكيد الهدف وآثار خارج الهدف والضوابط والتكرار المستقل.",
 ["Target hypothesis","On-target validation","Off-target assessment","Appropriate controls","Replication and ethics"]);

single("medicine","Absolute risk reduction","If a randomized intervention lowers event risk from 20% to 12%, the absolute risk reduction is:",
 "إذا خفّض تدخل عشوائي خطر الحدث من 20% إلى 12%، فما فرق الخطر المطلق ARR؟",
 ["8 percentage points","32 percentage points","40%","0.8 percentage points"],
 ["8 نقاط مئوية","32 نقطة مئوية","40%","0.8 نقطة مئوية"],0,
 "ARR=20%−12%=8 نقاط مئوية.","Absolute risk reduction=0.20−0.12=0.08, or 8 percentage points.");
single("medicine","Survival analysis","A hazard ratio in a time-to-event study most directly compares:",
 "في تحليل البقاء، بماذا تقارن نسبة المخاطر اللحظية HR؟",
 ["Instantaneous event rates under model assumptions","Only lifetime prevalence","Always identical absolute risks","Average blood pressure"],
 ["معدلات حدوث الحدث اللحظية وفق افتراضات النموذج","الانتشار طوال الحياة فقط","أخطار مطلقة متطابقة دائمًا","متوسط ضغط الدم"],0,
 "يقارن HR المعدلات اللحظية للحدث ويعتمد تفسيره على فرضيات النموذج.","A hazard ratio compares instantaneous hazards conditional on relevant model assumptions.");
multi("medicine","Randomized trial validity","Which practices can reduce important biases in an intervention trial?",
 "أي إجراءات تقلل تحيزات مهمة في تجربة تدخل؟",
 ["Concealed allocation","Prespecified outcomes","Intention-to-treat analysis where appropriate","Selecting only participants with favorable outcomes after randomization"],
 ["إخفاء تخصيص المجموعات","تحديد النتائج مسبقًا","تحليل نية العلاج عند الملاءمة","اختيار أصحاب النتائج الجيدة بعد التخصيص"],[0,1,2],
 "تدعم العشوائية المضبوطة وإخفاء التخصيص والتحليل المحدد مسبقًا التقييم المنصف.","Allocation concealment, predefined outcomes and intention-to-treat approaches reduce avoidable bias.");
multi("medicine","Cluster randomized evaluations","Which are relevant when analyzing a cluster-randomized public-health trial?",
 "أي عوامل مهمة في تحليل تجربة صحة عامة عشوائية عنقودية؟",
 ["Intracluster correlation","Cluster-level allocation","Design effects on required sample size","Treating all observations as independent without justification"],
 ["الارتباط داخل العنقود","التوزيع على مستوى المجموعات","تأثير التصميم على حجم العينة","افتراض استقلال جميع البيانات بلا مبرر"],[0,1,2],
 "الاعتماد داخل العناقيد يغير تقدير التباين والحجم المطلوب.","Clustering affects dependence, uncertainty and sample-size design.");
essay("medicine","Diagnostic study interpretation","In a fictional diagnostic study, 100 patients truly have a condition and 900 do not. The test has 80 true positives and 810 true negatives. Calculate sensitivity, specificity, false positives, false negatives and PPV.",
 "في دراسة تشخيصية افتراضية يوجد 100 مصاب و900 غير مصاب. كشف الاختبار 80 إيجابية حقيقية و810 سلبية حقيقية. احسب الحساسية والنوعية والإيجابيات والسلبية الكاذبة وPPV.",
 "TP=80, FN=100−80=20; TN=810, FP=900−810=90. Sensitivity=80/100=80%; specificity=810/900=90%; PPV=80/(80+90)=47.06%. A relatively modest PPV illustrates the importance of prevalence even when sensitivity/specificity seem high.",
 "TP=80 وFN=20؛ TN=810 وFP=90. الحساسية 80% والنوعية 90% وPPV=80/170≈47.06%. يتأثر PPV بانتشار المرض.",
 [["Construct correct 2×2 counts","ترتيب أعداد الجدول"],["Compute sensitivity and specificity","حساب الحساسية والنوعية"],["Compute PPV≈47.06%","حساب القيمة التنبؤية"],["Interpret results and prevalence dependence","تفسير النتائج والانتشار"]]);
essay("medicine","Outbreak investigation metrics","During a fictional outbreak investigation, 60 of 200 exposed individuals and 30 of 300 unexposed individuals become ill. Compute attack rates, relative risk, attributable risk difference and discuss causal limitations.",
 "في تحقيق وبائي افتراضي مرض 60 من 200 معرّض و30 من 300 غير معرّض. احسب معدلات الهجوم وRR وفرق الخطر وحدود الاستدلال السببي.",
 "Exposed attack rate=60/200=30%; unexposed=30/300=10%. RR=0.30/0.10=3.0. Risk difference=0.20=20 percentage points. Confounding, selection and misclassification may distort the association, so causation requires additional evidence.",
 "معدل الهجوم للمعرّضين 30% ولغير المعرّضين 10%؛ RR=3 وفرق الخطر=20 نقطة مئوية. قد تؤثر العوامل المربكة وانحياز اختيار الحالات وتصنيفها.",
 [["Compute attack rates with denominators","حساب معدلَي الهجوم"],["Calculate RR=3","حساب الخطر النسبي"],["Compute risk difference=20 points","حساب فرق الخطر"],["Address confounding and misclassification","مناقشة حدود السببية"]]);
oral("medicine","Study design appraisal","Compare a randomized controlled trial and an observational cohort for evaluation of a health intervention, including strengths, bias and ethics.",
 "قارن بين تجربة عشوائية مضبوطة ودراسة أترابية رصدية لتقييم تدخل صحي من حيث القوة والتحيز والأخلاقيات.",
 ["Research question","Randomization vs exposure","Bias and confounding","Feasibility and ethics","Interpretation"]);
oral("medicine","Public-health outbreak surveillance","Describe how you would organize a surveillance dashboard for a novel outbreak while protecting privacy and communicating uncertainty.",
 "صف تنظيم لوحة ترصد وبائي لتفشٍ جديد مع حماية الخصوصية وإبلاغ عدم اليقين.",
 ["Case definition","Timely reporting","Rates and denominators","Privacy","Uncertainty communication"]);

// Generate additional mathematically auditable variations. ID tied to parameter.
function generated(subject,kind,seed){
 const n=Math.abs(Math.trunc(Number(seed)||0)),id="NABD-MA-G-"+subject+"-"+kind+"-"+n,series=Math.floor(n/5),family=n%5;
 function result(topic,en,ar,options,optionAr,correct,explainEn,explainAr){
  if(new Set(options).size!==4)throw Error("GENERATED_OPTIONS_NOT_DISTINCT");
  return Object.freeze({id,subject,kind,topic,prompt_en:en,prompt_ar:ar,options,options_ar:optionAr||options,correct,
   explain_en:explainEn,explain_ar:explainAr,points:kind==="single"?1:3,
   origin:"NABD_MASTER_GENERATED",source:SOURCES[subject].page});
 }
 if(kind==="single"&&subject==="chemistry"){
  if(family===0){
   const half=10+5*(series%50);
   return result("First-order half life","A first-order reaction has a half-life of "+half+" minutes. What fraction remains after "+(2*half)+" minutes?",
    "تفاعل من الرتبة الأولى نصف عمره "+half+" دقيقة، ما الجزء المتبقي بعد "+(2*half)+" دقيقة؟",
    ["1/2","1/4","1/8","3/4"],null,[1],
    "Two half-lives leave (1/2)^2=1/4.","بعد نصفَي عمر يبقى (1/2)²=1/4.");
  }
  if(family===1){
   const h=30+5*(series%20),t=290+10*(series%20),ent=.1;
   const g=h-t*ent;
   return result("Gibbs energy calculation","For ΔH="+h+" kJ/mol and ΔS=+100 J/(mol·K), estimate ΔG at T="+t+" K.",
    "ΔH="+h+" كيلوجول/مول وΔS=+100 جول/(مول·كلفن). احسب ΔG عند "+t+" كلفن.",
    [(g-10).toFixed(1)+" kJ/mol",g.toFixed(1)+" kJ/mol",(g+10).toFixed(1)+" kJ/mol",(h+t*.1).toFixed(1)+" kJ/mol"],
    [(g-10).toFixed(1)+" كيلوجول/مول",g.toFixed(1)+" كيلوجول/مول",(g+10).toFixed(1)+" كيلوجول/مول",(h+t*.1).toFixed(1)+" كيلوجول/مول"],
    [1],"ΔG=ΔH−TΔS="+h+"−"+t+"×0.1="+g.toFixed(1)+" kJ/mol.",
    "ΔG=ΔH−TΔS="+h+"−"+t+"×0.1="+g.toFixed(1)+" كيلوجول/مول.");
  }
  if(family===2){
   const eps=1000+250*(series%40),c=.002,path=1,abs=eps*c;
   return result("Beer–Lambert absorbance","At ε="+eps+" L mol⁻¹ cm⁻¹, path length 1 cm and concentration 0.002 mol/L, calculate absorbance A.",
    "عند ε="+eps+" لتر مول⁻¹ سم⁻¹ وطول المسار 1 سم والتركيز 0.002 مول/لتر، احسب الامتصاصية A.",
    [(abs/2).toFixed(2),abs.toFixed(2),(abs*2).toFixed(2),(abs+1).toFixed(2)],null,[1],
    "Beer–Lambert A=εbc="+eps+"×1×0.002="+abs.toFixed(2)+".",
    "قانون بير–لامبرت A=εbc="+eps+"×1×0.002="+abs.toFixed(2)+".");
  }
  if(family===3){
   const e0=.5+.05*(series%8),elec=1+(series%2),logQ=1+(series%4),e=e0-.0592/elec*logQ;
   return result("Nernst equation","At 25°C E°="+e0.toFixed(3)+" V, n="+elec+" electrons and Q=10^"+logQ+". Estimate E by E=E°−(0.0592/n)log₁₀Q.",
    "عند 25°م الجهد القياسي E°="+e0.toFixed(3)+" فولت، وn="+elec+" وQ=10^"+logQ+"، احسب E بعلاقة نرنست.",
    [(e-.1).toFixed(3)+" V",e.toFixed(3)+" V",(e+.1).toFixed(3)+" V",(e0+.0592/elec*logQ).toFixed(3)+" V"],
    [(e-.1).toFixed(3)+" فولت",e.toFixed(3)+" فولت",(e+.1).toFixed(3)+" فولت",(e0+.0592/elec*logQ).toFixed(3)+" فولت"],[1],
    "E="+e0.toFixed(3)+"−0.0592/"+elec+"×"+logQ+"≈"+e.toFixed(3)+" V.",
    "E="+e0.toFixed(3)+"−0.0592/"+elec+"×"+logQ+"≈"+e.toFixed(3)+" فولت.");
  }
  const half=15+5*(series%30),k=.693/half;
  return result("Rate constant","Calculate first-order rate constant k from t½="+half+" min (k=ln2/t½).",
   "احسب ثابت سرعة تفاعل من الرتبة الأولى إذا كان نصف العمر "+half+" دقيقة.",[(k/2).toFixed(4)+" min⁻¹",k.toFixed(4)+" min⁻¹",(k*2).toFixed(4)+" min⁻¹",(k+0.1).toFixed(4)+" min⁻¹"],
   [(k/2).toFixed(4)+" دقيقة⁻¹",k.toFixed(4)+" دقيقة⁻¹",(k*2).toFixed(4)+" دقيقة⁻¹",(k+0.1).toFixed(4)+" دقيقة⁻¹"],[1],
   "k=0.693/"+half+"≈"+k.toFixed(4)+" min⁻¹.","k=0.693/"+half+"≈"+k.toFixed(4)+" دقيقة⁻¹.");
 }
 if(kind==="single"&&subject==="biology"){
  if(family===0){
   const ct=1+(series%9),fold=2**ct;
   return result("qPCR fold change","Assuming 100% efficiency and stable reference, ΔCt is "+ct+" cycles LOWER than control. Approximate normalized fold increase.",
    "بافتراض كفاءة 100% وثبات المرجع، انخفض ΔCt بمقدار "+ct+" دورة عن الضبط. ما الزيادة النسبية؟",
    [fold/2+"-fold",fold+"-fold",fold*2+"-fold","no change"],[fold/2+" ضعف",fold+" ضعف",fold*2+" ضعف","لا تغير"],[1],
    "ΔΔCt=−"+ct+" so expression fold change is 2^"+ct+"="+fold+".",
    "ΔΔCt=−"+ct+"، إذن التغير 2^"+ct+"="+fold+" ضعف.");
  }
  if(family===1){
   const q=.1+.025*(series%27),p=1-q,het=Math.round(2*q*p*1000)/10;
   return result("Hardy–Weinberg carrier estimate","For Hardy–Weinberg recessive allele frequency q="+q.toFixed(3)+", estimate heterozygote proportion 2pq (%).",
    "في توازن هاردي–واينبرغ، q="+q.toFixed(3)+"، احسب نسبة متغايري الزيجوت 2pq.",
    [(het/2).toFixed(1)+"%",het.toFixed(1)+"%",(het+10).toFixed(1)+"%","100%"],
    [(het/2).toFixed(1)+"%",het.toFixed(1)+"%",(het+10).toFixed(1)+"%","100%"],[1],
    "p=1−q="+p.toFixed(3)+" and 2pq="+het.toFixed(1)+"%.","p=1−q="+p.toFixed(3)+"، و2pq="+het.toFixed(1)+"%.");
  }
  if(family===2){
   const reads=2+(series%30),length=100,genome=1;
   const coverage=reads*100;
   return result("Sequencing coverage","A sample has "+reads+" million reads of length 100 bp for a 1-million-bp genome. Approximate mean coverage assuming uniform mapping.",
    "عينة تحوي "+reads+" مليون قراءة بطول 100 زوج قاعدة لجينوم طوله مليون زوج قاعدة، ما عمق التغطية المتوقع بافتراض التوزيع المنتظم؟",
    [coverage/2+"×",coverage+"×",coverage*2+"×",reads+"×"],null,[1],
    "Coverage≈reads×read length/genome length="+reads+"×100="+coverage+"×.",
    "التغطية≈عدد القراءات×الطول/طول الجينوم="+reads+"×100="+coverage+"×.");
  }
  if(family===3){
   const mu=.1+.025*(series%25),dt=.693/mu;
   return result("Exponential microbial growth","For specific growth rate μ="+mu.toFixed(3)+" h⁻¹, estimate doubling time using t_d=ln2/μ.",
    "إذا كان معدل النمو النوعي μ="+mu.toFixed(3)+" ساعة⁻¹، احسب زمن تضاعف الخلايا t_d=ln2/μ.",
    [(dt/2).toFixed(2)+" h",dt.toFixed(2)+" h",(dt*2).toFixed(2)+" h",(dt+5).toFixed(2)+" h"],
    [(dt/2).toFixed(2)+" ساعة",dt.toFixed(2)+" ساعة",(dt*2).toFixed(2)+" ساعة",(dt+5).toFixed(2)+" ساعة"],[1],
    "t_d=0.693/"+mu.toFixed(3)+"="+dt.toFixed(2)+" h.","زمن التضاعف=0.693/"+mu.toFixed(3)+"="+dt.toFixed(2)+" ساعة.");
  }
  const total=200+10*(series%30),mutant=20+2*(series%30),v=Math.round(mutant/total*1000)/10;
  return result("Variant allele fraction","A sequencing experiment finds "+mutant+" reads with a variant out of "+total+" adequately filtered reads. Estimate observed variant fraction.",
   "تجربة تسلسل فيها "+mutant+" قراءة تحمل متغيرًا من "+total+" قراءة بعد الفلترة. احسب النسبة المرصودة.",
   [(v/2).toFixed(1)+"%",v.toFixed(1)+"%",(v+10).toFixed(1)+"%","100%"],null,[1],
   "Variant allele fraction = variant reads / total reads = "+mutant+"/"+total+" ≈ "+v.toFixed(1)+"%.",
   "تواتر المتغير="+mutant+"/"+total+"≈"+v.toFixed(1)+"%.");
 }
 if(kind==="single"&&subject==="medicine"){
  if(family===0){
   const cases=10*(2+series%30),tp=cases*.8,fp=(1000-cases)*.1,v=Math.round(1000*tp/(tp+fp))/10;
   return result("Screening PPV","Of 1,000 people "+cases+" have disease. Test sensitivity is 80%, specificity 90%. Estimate PPV.",
    "من 1000 شخص هناك "+cases+" مصابًا. الحساسية 80% والنوعية 90%. احسب PPV.",
    [(v-7).toFixed(1)+"%",v.toFixed(1)+"%",(v+8).toFixed(1)+"%","80.0%"],null,[1],
    "TP="+tp+", FP="+fp.toFixed(0)+", PPV≈"+v.toFixed(1)+"%.","TP="+tp+" وFP="+fp.toFixed(0)+"؛ PPV≈"+v.toFixed(1)+"%.");
  }
  if(family===1){
   const a=1+(series%8),b=5+(series%10),rr=a/b*10;
   return result("Cohort relative risk","Exposure group: "+a*10+"/100 cases. Comparator: "+b+"/100 cases. Estimate relative risk.",
    "حالات المعرّضين "+(a*10)+"/100 وغير المعرّضين "+b+"/100، احسب RR.",
    [(rr/2).toFixed(1),rr.toFixed(1),(rr*2).toFixed(1),"0.0"],null,[1],
    "RR=("+(a*10)+"/100)/("+b+"/100)="+rr.toFixed(1)+".","RR=("+a*10+"/100)/("+b+"/100)="+rr.toFixed(1)+".");
  }
  if(family===2){
   const cost=1000*(1+series%20),qaly=.05+.05*(series%8),icer=cost/qaly;
   return result("Cost-effectiveness","Incremental intervention cost is $"+cost+" and gain is "+qaly.toFixed(2)+" QALYs. Estimate ICER.",
    "تكلفة تدخل إضافية "+cost+" دولار ومكسب "+qaly.toFixed(2)+" QALY. احسب ICER.",
    ["$"+Math.round(icer/2)+"/QALY","$"+Math.round(icer)+"/QALY","$"+Math.round(icer*2)+"/QALY","$"+cost+"/QALY"],null,[1],
    "ICER=cost/QALY="+cost+"/"+qaly.toFixed(2)+"≈$"+Math.round(icer)+"/QALY.",
    "ICER=التكلفة/QALY="+cost+"/"+qaly.toFixed(2)+"≈"+Math.round(icer)+" دولار/QALY.");
  }
  if(family===3){
   const tp=40+2*(series%30),fn=10+2*(series%15),sen=Math.round(1000*tp/(tp+fn))/10;
   return result("Test sensitivity","A diagnostic evaluation has TP="+tp+" and FN="+fn+". Approximate sensitivity.",
    "في تقييم تشخيصي TP="+tp+" وFN="+fn+"؛ احسب الحساسية.",
    [(sen-9).toFixed(1)+"%",sen.toFixed(1)+"%",(sen+7).toFixed(1)+"%","100%"],null,[1],
    "Sensitivity=TP/(TP+FN)="+tp+"/"+(tp+fn)+"≈"+sen.toFixed(1)+"%.",
    "الحساسية=TP/(TP+FN)="+tp+"/"+(tp+fn)+"≈"+sen.toFixed(1)+"%.");
  }
  const arr=.05+.005*(series%20),nnt=Math.ceil(1/arr);
  return result("Number needed to treat","An intervention achieves absolute risk reduction ARR="+(arr*100).toFixed(1)+"%. Find NNT (round up).",
   "خفض تدخل ما الخطر المطلق ARR بمقدار "+(arr*100).toFixed(1)+"%. احسب NNT مع التقريب للأعلى.",
   [String(nnt-2),String(nnt),String(nnt+2),String(Math.round(100/arr))],null,[1],
   "NNT=ceil(1/ARR)=ceil(1/"+arr.toFixed(3)+")="+nnt+".",
   "NNT=تقريب(1/ARR) للأعلى= "+nnt+".");
 }
 if(kind==="multi"&&subject==="chemistry"){
  if(family%2===0){
   const temp=310+10*(series%25),h=20+5*(series%20),g=h-.1*temp;
   return result("Thermodynamics and consistency","Given ΔH="+h+" kJ/mol, ΔS=+0.1 kJ/(mol·K), T="+temp+" K. Select all valid statements.",
    "مع ΔH="+h+" وΔS=+0.1 وT="+temp+" كلفن، اختر جميع العبارات الصحيحة.",
    ["ΔG="+g.toFixed(1)+" kJ/mol","ΔG=ΔH−TΔS","Higher temperature decreases ΔG for positive ΔS","A catalyst changes ΔG° at fixed temperature"],
    ["ΔG="+g.toFixed(1)+" كيلوجول/مول","ΔG=ΔH−TΔS","زيادة الحرارة تخفض ΔG عند ΔS موجبة","المحفز يغير ΔG° عند الحرارة نفسها"],[0,1,2],
    "ΔG="+h+"−0.1×"+temp+"="+g.toFixed(1)+". Catalyst cannot change thermodynamic ΔG°.",
    "ΔG="+h+"−0.1×"+temp+"="+g.toFixed(1)+"؛ المحفز لا يغير ΔG°.");
  }
  const pka=3+series%6,ratio=10**(1+series%2),ph=pka+Math.log10(ratio);
  return result("Henderson–Hasselbalch validation","Acid buffer pKa="+pka+" and [A−]/[HA]="+ratio+". Select all correct statements.",
   "منظم حمضي pKa="+pka+" ونسبة [A−]/[HA]="+ratio+". اختر الصحيح.",
   ["pH="+ph.toFixed(1),"pH=pKa+log([A−]/[HA])","Higher base/acid ratio raises pH","Catalyst directly sets buffer pH"],
   ["pH="+ph.toFixed(1),"pH=pKa+log([A−]/[HA])","زيادة القاعدة/الحمض ترفع pH","المحفز يحدد pH مباشرةً"],[0,1,2],
   "pH="+pka+"+log("+ratio+")="+ph.toFixed(1)+".",
   "pH="+pka+"+log("+ratio+")="+ph.toFixed(1)+".");
 }
 if(kind==="multi"&&subject==="biology"){
  if(family%2===0){
   const q=.1+.05*(series%14),p=1-q;
   return result("Hardy–Weinberg consistency","For recessive allele frequency q="+q.toFixed(2)+" under ideal assumptions, select valid statements.",
    "في نموذج هاردي–واينبرغ المثالي q="+q.toFixed(2)+"، اختر الصحيح.",
    ["p="+p.toFixed(2),"q²="+(q*q*100).toFixed(2)+"%","2pq="+(2*q*p*100).toFixed(2)+"%","Every individual must be heterozygous"],
    ["p="+p.toFixed(2),"q²="+(q*q*100).toFixed(2)+"%","2pq="+(2*q*p*100).toFixed(2)+"%","كل الأفراد متغايرو الزيجوت"],[0,1,2],
    "p=1−q; expected genotype proportions are p²,2pq,q², not 100% heterozygotes.",
    "p=1−q؛ النسب المتوقعة p² و2pq وq²، وليس كل الأفراد متغايرين.");
  }
  const ct=1+(series%9),fold=2**ct;
  return result("qPCR data interpretation","Treatment ΔCt is "+ct+" cycles lower than reference under equal efficiencies. Select valid conclusions.",
   "ΔCt للمعالجة أقل بمقدار "+ct+" دورات عند كفاءة متساوية، اختر النتائج الصحيحة.",
   ["ΔΔCt=−"+ct,"Normalized fold change="+fold+"×","A stable reference gene is assumed","The result proves causality without experimental controls"],
   ["ΔΔCt=−"+ct,"التغير النسبي="+fold+" ضعف","يشترط ثبات الجين المرجعي","تثبت النتيجة السببية دون ضوابط"],[0,1,2],
   "ΔΔCt=−"+ct+"; 2^(−ΔΔCt)="+fold+"-fold, subject to efficiency/reference assumptions.",
   "ΔΔCt=−"+ct+"، والتغير 2^"+ct+"="+fold+" ضعف مع افتراضات مناسبة.");
 }
 if(kind==="multi"&&subject==="medicine"){
  if(family%2===0){
   const cases=10*(2+series%21),rate=cases/1000;
   return result("Cumulative incidence method","There are "+cases+" new cases in a defined group of 1,000 over a stated period. Select valid statements.",
    "ظهر "+cases+" حالة جديدة بين 1000 شخص خلال فترة محددة، اختر الصحيح.",
    ["Cumulative incidence="+(100*rate).toFixed(1)+"%","A denominator and time window are necessary","Loss to follow-up may bias estimates","Incidence alone proves causality"],
    ["الحدوث التراكمي="+(100*rate).toFixed(1)+"%","يلزم مقام وفترة زمنية","فقدان المتابعة قد يسبب انحيازًا","الحدوث وحده يثبت السببية"],[0,1,2],
    "Risk="+cases+"/1000="+(100*rate).toFixed(1)+"%; causal inference needs additional controls.",
    "الخطر="+cases+"/1000="+(100*rate).toFixed(1)+"%، ولا يثبت السببية وحده.");
  }
  const exposed=10+5*(series%14),unexp=5+5*(series%8),rr=exposed/unexp;
  return result("Comparative risk study","Exposed risk is "+exposed+"%, unexposed risk "+unexp+"%. Select valid statements.",
   "خطر المعرّضين "+exposed+"% وغير المعرّضين "+unexp+"%. اختر الصحيح.",
   ["RR="+rr.toFixed(2),"Risk difference="+(exposed-unexp)+" percentage points","Confounding may still distort the comparison","These risks alone establish a randomized causal effect"],
   ["RR="+rr.toFixed(2),"فرق الخطر="+(exposed-unexp)+" نقطة مئوية","قد يربك متغير ثالث المقارنة","تثبت الأرقام تأثيرًا سببيًا عشوائيًا"],[0,1,2],
   "RR="+exposed+"/"+unexp+"="+rr.toFixed(2)+", risk difference="+(exposed-unexp)+" points. Association alone is not proof of causation.",
   "RR="+rr.toFixed(2)+" وفرق الخطر="+(exposed-unexp)+" نقطة. الارتباط لا يكفي للسببية.");
 }
 if(kind==="written"){
  const base=all.filter(x=>x.subject===subject&&x.kind==="written");
  const q=base[n%base.length];return {...q,id,origin:"NABD_MASTER_CURATED_VARIANT"};
 }
 return all.find(q=>q.subject===subject&&q.kind==="oral");
}
function available(subject,kind){
 return all.filter(q=>q.subject===subject&&q.kind===kind);
}
function gradeChoice(q,selected){
 const chosen=[...new Set((selected||[]).map(Number))].sort((a,b)=>a-b);
 const right=[...q.correct].sort((a,b)=>a-b);
 const exact=chosen.length===right.length&&chosen.every((x,i)=>x===right[i]);
 const wrong=chosen.filter(x=>!right.includes(x));
 const missing=right.filter(x=>!chosen.includes(x));
 let score=0;
 if(q.kind==="single")score=exact?1:0;
 else if(q.kind==="multi"){score=exact?3:(!wrong.length&&chosen.length?Math.floor(3*chosen.length/right.length):0)}
 return {score,max:q.kind==="single"?1:3,exact,chosen,right,wrong,missing,
  rule:"NABD independent practice rubric; no claim of official Open Doors partial-credit policy."};
}
root.NABDOpenDoorsMastersBank=Object.freeze({SOURCES,QUESTIONS:Object.freeze(all),generated,available,gradeChoice,version:"1.0.0"});
})(typeof globalThis!=="undefined"?globalThis:this);
