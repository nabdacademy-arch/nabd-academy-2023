/* NABD Open Doors MASTERS only — independent authored practice aligned by topic
 * with 2026 Open Doors Master's+Doctoral syllabus and official demo links.
 * Not official tasks, actual examination papers, or copied past questions.
 */
(function(root){"use strict";
const SUBJECTS=Object.freeze({
 chemistry:Object.freeze({en:"Chemistry and Materials Science",ar:"الكيمياء وعلوم المواد",date:"2026-11-28",
 page:"https://od.globaluni.ru/subject/52/ma",sample:"https://od.globaluni.ru/attachment/4096947/download",
 program:"https://od.globaluni.ru/attachment/4096949/download",
 degrees:["04.04.01 Chemistry","04.04.02 Chemistry, physics and mechanics of materials","18.04.01 Chemical Engineering","18.04.02 Energy and Resource Saving Processes in Chemical Engineering, Petrochemistry and Biotechnology","22.04.01 Materials Science and Engineering"],
 fields:[
 ["Physical chemistry, thermodynamics and kinetics","الكيمياء الفيزيائية والديناميكا والحركية","Chemical potential, Gibbs energy, electrochemistry, reaction kinetics and equilibria"],
 ["Analytical chemistry and spectroscopy","الكيمياء التحليلية والتحليل الطيفي","Calibration, acid-base and complexometric titration, chromatography, uncertainty"],
 ["Organic reaction mechanisms","آليات التفاعل في الكيمياء العضوية","Nucleophiles and electrophiles, regioselectivity, stereochemistry, spectroscopy"],
 ["Materials and crystal structures","علم المواد والبنى البلورية","Crystal defects, lattices, phase diagrams and materials characterization"],
 ["Chemical process engineering","هندسة العمليات الكيميائية","Mass balances, rate laws, reactor design and separation processes"]]}),
 biology:Object.freeze({en:"Biology and Biotechnology",ar:"الأحياء والتقنية الحيوية",date:"2026-11-19",
 page:"https://od.globaluni.ru/subject/45/ma",sample:"https://od.globaluni.ru/attachment/4096899/download",
 program:"https://od.globaluni.ru/attachment/4096901/download",
 archive:[
 {year:"2025 demo · historic format (45 tasks)",url:"https://od.globaluni.ru/index.php/attachment/1583346/download"},
 {year:"Older Russian-language demo · historic format",url:"https://od.globaluni.ru/attachment/94201/download"}],
 degrees:["06.04.01 Biology","19.04.01 Biotechnology"],
 fields:[
 ["Molecular genetics and genomics","الوراثة الجزيئية والجينوم","Gene regulation, mutations, omics, DNA sequencing and bioinformatics"],
 ["Biotechnology and microbial processes","التقنية الحيوية والعمليات الميكروبية","Recombinant DNA, metabolic engineering, fermentation and GMP"],
 ["Cell biology and immunology","بيولوجيا الخلية والمناعة","Cell signaling, immunological memory, assay design and microscopy"],
 ["Biochemistry and enzymology","الكيمياء الحيوية والإنزيمات","Michaelis–Menten kinetics, protein structure and metabolism"],
 ["Biostatistics and research methods","الإحصاء الحيوي ومنهجية البحث","PCR controls, hypothesis testing, replication, confounding and ethics"]]}),
 medicine:Object.freeze({en:"Clinical Medicine and Public Health",ar:"الطب السريري والصحة العامة",date:"2026-11-27",
 page:"https://od.globaluni.ru/subject/55/ma",sample:"https://od.globaluni.ru/attachment/4096979/download",
 program:"https://od.globaluni.ru/attachment/4097309/download",
 degrees:["32.04.01 Public health"],
 fields:[
 ["Epidemiology and biostatistics","الوبائيات والإحصاء الحيوي","Risk ratios, study designs, bias, confounding, screening and causation"],
 ["Clinical and pathological physiology","الفسيولوجيا السريرية والمرضية","Cardiopulmonary, endocrine and renal mechanisms and clinical reasoning"],
 ["Evidence-based medicine","الطب المبني على الدليل","Clinical evidence, meta-analysis, study quality, diagnostic metrics"],
 ["Health systems and prevention","النظم الصحية والوقاية","Population health, health policy, ethics and preventive strategies"],
 ["Pharmacology and research ethics","علم الأدوية وأخلاقيات البحث","Mechanisms, adverse effects, study design, informed consent"]]})
});
const RUBRIC=Object.freeze([
 Object.freeze({en:"Accurate scientific foundations",ar:"صحة الأسس العلمية",points:3}),
 Object.freeze({en:"Reasoning, mechanisms or derivation",ar:"التحليل والآلية أو الاشتقاق",points:3}),
 Object.freeze({en:"Calculations, evidence and units where applicable",ar:"الحسابات والأدلة والوحدات عند اللزوم",points:2}),
 Object.freeze({en:"Interpretation, limits or application",ar:"التفسير والقيود أو التطبيق",points:2})
]);
const singles=[],multis=[],essays=[],orals=[];
function q(subject,kind,id,topic,en,ar,options,optionsAr,keys,exEn,exAr){
 if(!SUBJECTS[subject]||!["single","multi"].includes(kind)||options.length!==4||optionsAr.length!==4||
  keys.some(k=>!Number.isInteger(k)||k<0||k>=options.length)||new Set(keys).size!==keys.length||
  !keys.length||(kind==="single"&&keys.length!==1))throw Error("INVALID_MASTER_QUESTION");
 const item=Object.freeze({id:"nabd-ma-"+id,subject,kind,topic,prompt_en:en,prompt_ar:ar,
  options:Object.freeze(options),options_ar:Object.freeze(optionsAr),correct:Object.freeze(keys),
  explanation_en:exEn,explanation_ar:exAr,origin:"NABD_MASTERS_AUTHORED",
  points:kind==="single"?1:3,source:SUBJECTS[subject].page});
 (kind==="single"?singles:multis).push(item);return item;
}
function essay(subject,id,topic,en,ar,modelEn,modelAr){
 essays.push(Object.freeze({id:"nabd-ma-"+id,subject,kind:"written",topic,prompt_en:en,prompt_ar:ar,
  model_en:modelEn,model_ar:modelAr,rubric:RUBRIC,points:10,origin:"NABD_MASTERS_AUTHORED",source:SUBJECTS[subject].page}));
}
function oral(subject,id,topic,en,ar,modelEn,modelAr){
 orals.push(Object.freeze({id:"nabd-ma-"+id,subject,kind:"oral",topic,prompt_en:en,prompt_ar:ar,
  model_en:modelEn,model_ar:modelAr,rubric:RUBRIC,points:5,origin:"NABD_MASTERS_AUTHORED",source:SUBJECTS[subject].page}));
}
// CHEMISTRY · Master's-level quantitative, mechanistic and materials topics.
q("chemistry","single","ch-s01","Thermodynamics","For ΔH=−40 kJ/mol and ΔS=−0.10 kJ/(mol·K), find ΔG at 300 K.","عند ΔH=−40 كيلوجول/مول وΔS=−0.10 كيلوجول/(مول·كلفن)، احسب ΔG عند 300 كلفن.",
 ["−70 kJ/mol","−10 kJ/mol","+10 kJ/mol","+70 kJ/mol"],["−70 كيلوجول/مول","−10 كيلوجول/مول","+10 كيلوجول/مول","+70 كيلوجول/مول"],[1],
 "ΔG=ΔH−TΔS=−40−300(−0.10)=−10 kJ/mol; negative suggests spontaneous forward tendency under stated conditions.","ΔG=ΔH−TΔS=−40−300(−0.10)=−10 كيلوجول/مول؛ الإشارة السالبة تدل على نزعة تلقائية للتفاعل بهذه الشروط.");
q("chemistry","single","ch-s02","Electrochemistry","For a one-electron cell with E°=0.0592 V at 298 K, what is K approximately? Use E°=(0.0592/n)log₁₀K.","لخلية إلكترونية واحدة E°=0.0592 فولت عند 298 كلفن، كم ثابت الاتزان K باستخدام علاقة نرنست المعطاة؟",
 ["0.1","1","10","100"],["0.1","1","10","100"],[2],"log₁₀K=nE°/0.0592=1; therefore K=10.","لوغاريتم K يساوي 1، ولذلك K=10.");
q("chemistry","single","ch-s03","Spectrophotometry","Beer–Lambert law predicts what happens to absorbance A when the path length doubles at constant concentration?","طبقًا لقانون بير–لامبرت، ماذا يحدث للامتصاصية عند مضاعفة طول المسار مع ثبات التركيز؟",
 ["Halves","Remains constant","Doubles","Becomes zero"],["تنخفض للنصف","تبقى ثابتة","تتضاعف","تصبح صفرًا"],[2],
 "A=εlc; doubling l doubles A as long as linearity conditions hold.","A=εlc؛ مضاعفة l تضاعف A ضمن حدود صلاحية العلاقة الخطية.");
q("chemistry","single","ch-s04","Kinetics","A first-order reaction has k=0.231 min⁻¹. Estimate its half-life (ln2≈0.693).","تفاعل من المرتبة الأولى له k=0.231 دقيقة⁻¹. احسب نصف العمر باستخدام ln2≈0.693.",
 ["0.33 min","1.5 min","3.0 min","6.0 min"],["0.33 دقيقة","1.5 دقيقة","3.0 دقائق","6.0 دقائق"],[2],
 "t₁/₂=ln2/k=0.693/0.231=3.0 minutes.","نصف العمر =0.693/0.231=3 دقائق.");
q("chemistry","single","ch-s05","Complex formation","Which ligand typically binds through two donor atoms to one metal center?","أي ليغاند يرتبط عادة بذرتين مانحتين للمركز الفلزي نفسه؟",
 ["Chloride","Ammonia","Ethylenediamine","Water"],["الكلوريد","الأمونيا","الإيثيلين ديامين","الماء"],[2],
 "Ethylenediamine is bidentate with two amine nitrogen donor atoms; the other listed ligands are commonly monodentate.","الإيثيلين ديامين ثنائي السن لاحتوائه على ذرتي نيتروجين مانحتين؛ البقية غالبًا أحادية السن.");
q("chemistry","single","ch-s06","Materials characterization","Which method commonly provides crystal lattice spacing using Bragg's law?","أي تقنية تُستخدم عادة لتحديد المسافات بين مستويات البلورة بتطبيق قانون براغ؟",
 ["X-ray diffraction","UV-visible absorbance only","pH titration","Flame test"],["حيود الأشعة السينية","الامتصاص المرئي فقط","معايرة pH","اختبار اللهب"],[0],
 "X-ray diffraction obeys nλ=2d sinθ and determines interplanar distances in crystalline solids.","يستخدم حيود الأشعة السينية nλ=2d sinθ لتعيين مسافات المستويات البلورية.");
q("chemistry","single","ch-s07","Organic stereochemistry","Which descriptor denotes an equimolar mixture of two enantiomers?","أي مصطلح يدل على خليط متساوي المولارية من متماكبين مرآتيين؟",
 ["Diastereomer","Racemate","Conformer","Tautomer"],["متماكب فراغي غير مرآتي","خليط راسيمي","متشكل","متصاوغ توتومري"],[1],
 "A racemate is a 1:1 mixture of enantiomers and is often optically inactive due to cancellation.","المزيج الراسيمي يحوي متماكبين مرآتيين بنسبة 1:1 وغالبًا يكون غير نشط بصريًا بسبب التعادل.");
q("chemistry","single","ch-s08","Thermodynamics","At equilibrium under constant temperature and pressure, which quantity is zero for a reaction?","عند الاتزان بدرجة حرارة وضغط ثابتين، أي كمية تصبح صفرًا بالنسبة للتفاعل؟",
 ["Standard ΔG° always","Reaction Gibbs energy ΔᵣG","Activation energy","Heat capacity"],["ΔG° القياسي دائمًا","طاقة غيبس للتفاعل ΔᵣG","طاقة التنشيط","السعة الحرارية"],[1],
 "The reaction Gibbs energy ΔᵣG is zero at equilibrium; ΔG° generally equals −RT lnK and need not be zero.","عند الاتزان ΔᵣG=0، لكن ΔG°=−RTlnK وليس بالضرورة صفرًا.");
q("chemistry","single","ch-s09","Quantitative analysis","Which parameter directly describes precision of repeat measurements?","أي مقياس يصف دقة التكرارية (Precision) لقياسات متكررة؟",
 ["Standard deviation","Difference from true value only","Atomic number","Molar mass"],["الانحراف المعياري","البعد عن القيمة الحقيقية فقط","العدد الذري","الكتلة المولية"],[0],
 "Standard deviation measures spread and repeatability (precision); systematic bias concerns accuracy.","الانحراف المعياري يقيس تشتت القياسات والتكرارية، أما الانحياز المنهجي فيتعلق بالصحة (Accuracy).");
q("chemistry","single","ch-s10","Materials defects","A missing atom at a regular lattice site is called a:","ما اسم غياب ذرة من موضعها المنتظم داخل شبكة بلورية؟",
 ["Dislocation","Vacancy","Interstitial defect","Grain boundary"],["انخلاع بلوري","فجوة ذرية","عيب بيني","حد حبيبة"],[1],
 "A lattice vacancy is a missing atom or ion at a regular site; an interstitial defect is an additional species between sites.","الفجوة الذرية هي غياب ذرة أو أيون من موضع معتاد، بخلاف العيب البيني حيث توجد جسيمة إضافية.");
q("chemistry","single","ch-s11","Acid-base equilibria","A monoprotic weak acid has pKa=5.0. At pH=6.0, what is [A⁻]/[HA]?","لحمض أحادي البروتون pKa=5.0 وعند pH=6.0، ما نسبة [A⁻]/[HA]؟",
 ["0.1","1","10","100"],["0.1","1","10","100"],[2],
 "Henderson–Hasselbalch gives log([A⁻]/[HA])=pH−pKa=1, so the ratio is 10.","من هندرسون–هاسلبالخ لوغاريتم النسبة=1 وبالتالي النسبة 10.");
q("chemistry","single","ch-s12","Chromatography","In typical reversed-phase HPLC, which compounds tend to elute later when other factors are comparable?","في HPLC الطور العكسي، أي المركبات تتأخر في الخروج غالبًا إذا تساوت العوامل الأخرى؟",
 ["More hydrophobic compounds","More volatile compounds regardless of polarity","More ionic compounds always","Smaller molecular mass always"],["الأكثر كرهًا للماء","الأكثر تطايرًا بغض النظر عن القطبية","الأكثر تأينًا دائمًا","الأقل كتلة دائمًا"],[0],
 "A nonpolar stationary phase retains more hydrophobic compounds longer, although mobile phase and ionization modify retention.","الطور الثابت غير القطبي يحتجز المواد الأكثر كرهًا للماء مدة أطول، مع تأثر الاحتجاز بالطور المتحرك والتأين.");
// BIOLOGY · Master's molecular genetics, genomics, methods and statistics.
q("biology","single","bi-s01","Enzyme kinetics","At substrate concentration [S]=Kₘ, the Michaelis–Menten initial rate is:","عند [S]=Kₘ في حركية ميكايليس–منتن، تكون السرعة الأولية:",
 ["Vmax/4","Vmax/2","Vmax","2Vmax"],["Vmax/4","Vmax/2","Vmax","2Vmax"],[1],
 "v=Vmax[S]/(Kₘ+[S]); at [S]=Kₘ, v=Vmax/2.","v=Vmax[S]/(Km+[S])، وعند [S]=Km تصبح Vmax/2.");
q("biology","single","bi-s02","Gene expression","Which assay directly measures RNA abundance after reverse transcription?","أي اختبار يقيس وفرة RNA بعد تحويله إلى cDNA؟",
 ["RT-qPCR","Southern blot","DNA karyotype","Protein ELISA only"],["RT-qPCR","لطخة ساوثرن","النمط النووي","ELISA للبروتين فقط"],[0],
 "Reverse transcription generates cDNA and qPCR monitors its amplification to estimate RNA expression.","يحوّل النسخ العكسي RNA إلى cDNA ويستخدم qPCR قياس تضخيمه لتقدير التعبير الجيني.");
q("biology","single","bi-s03","Genome editing","In CRISPR-Cas9 genome editing, the guide RNA primarily determines:","في تعديل الجينوم بنظام CRISPR-Cas9، ما الذي يحدده guide RNA أساسًا؟",
 ["DNA target sequence specificity","DNA polymerase rate","Mitochondrial membrane potential","Ribosome translation speed"],["نوعية تسلسل DNA المستهدف","سرعة بوليميراز DNA","جهد غشاء الميتوكوندريا","سرعة ترجمة الريبوسوم"],[0],
 "Complementarity of guide RNA to the genomic target steers Cas9 targeting near a suitable PAM.","التكامل بين RNA المرشد والتسلسل المستهدف يحدد موضع عمل Cas9 بجوار PAM مناسب.");
q("biology","single","bi-s04","Microbial growth","In exponential growth N=N₀×2ⁿ. Starting from 100 cells, after 4 generations how many cells are expected?","في النمو الأسي N=N₀×2ⁿ، إذا بدأنا بـ100 خلية، فكم خلية بعد 4 أجيال؟",
 ["400","800","1600","3200"],["400","800","1600","3200"],[2],
 "N=100×2⁴=1600 cells, assuming no death and perfectly synchronized divisions.","N=100×16=1600 خلية بافتراض عدم الموت وتقسيمات مثالية.");
q("biology","single","bi-s05","Genomics","For a standard two-tailed statistical test with p=0.003 and α=0.05, what is appropriate?","في اختبار إحصائي ثنائي الطرف p=0.003 وα=0.05، ما الاستنتاج المناسب؟",
 ["Reject null hypothesis at 5% significance","Accept alternative as definitely true","Effect is necessarily large","Reject all confounding"],["نرفض فرضية العدم عند مستوى 5%","نؤكد أن البديل صحيح يقينًا","حجم الأثر بالضرورة كبير","نفي جميع عوامل الإرباك"],[0],
 "p<0.05 implies statistical evidence against the null under model assumptions, not effect size, causality, or certainty.","p أقل من 0.05 تعني دليلًا إحصائيًا ضد العدم ضمن افتراضات النموذج، ولا تثبت السببية أو حجم الأثر.");
q("biology","single","bi-s06","RNA-seq","Which normalization issue commonly arises when comparing raw RNA-seq read counts between libraries?","ما المشكلة التي تجعل المقارنة المباشرة لعدد قراءات RNA-seq الخام بين المكتبات غير سليمة؟",
 ["Different sequencing depths","Different DNA alphabets","Different biological genetic codes","All transcripts having identical lengths"],["اختلاف عمق التسلسل","اختلاف أبجدية DNA","اختلاف الشفرة الوراثية","تساوي أطوال جميع النصوص"],[0],
 "Raw counts depend on library size and sequencing depth; normalization accounts for exposure and composition.","تعتمد القراءات الخام على حجم المكتبة وعمق التسلسل، لذلك يلزم التطبيع.");
q("biology","single","bi-s07","PCR specificity","Why include a no-template control in PCR?","لماذا نستخدم شاهدًا سلبيًا دون قالب في PCR؟",
 ["Detect reagent contamination","Increase target copy number","Choose thermal cycle temperatures automatically","Measure protein folding"],["كشف تلوث الكواشف","زيادة نسخ الهدف","اختيار الحرارة تلقائيًا","قياس طي البروتين"],[0],
 "Amplification in a no-template control suggests contamination or nonspecific products and demands investigation.","ظهور تضخيم في الشاهد الخالي من قالب يدل على تلوث أو نواتج غير نوعية تستلزم الفحص.");
q("biology","single","bi-s08","Immunology","What are memory B cells primarily associated with?","ما الوظيفة الرئيسة للخلايا B الذاكرية؟",
 ["Faster antigen-specific humoral response on re-exposure","Innate epithelial barrier formation","Immediate erythrocyte destruction","DNA repair only"],["استجابة خلطية نوعية أسرع عند إعادة التعرض","بناء حاجز ظهاري فطري","تخريب كريات الدم فورًا","إصلاح DNA فقط"],[0],
 "Memory B cells support a rapid, antigen-specific secondary antibody response.","تمكّن الخلايا B الذاكرية من استجابة أضداد نوعية أسرع بعد التعرض المتكرر للمستضد.");
q("biology","single","bi-s09","Population genetics","For recessive phenotype q²=0.09 under Hardy–Weinberg, what is heterozygote frequency?","إذا كان q²=0.09 تحت هاردي–واينبرغ، ما نسبة متغايري الزيجوت؟",
 ["9%","21%","42%","70%"],["9%","21%","42%","70%"],[2],
 "q=0.3,p=0.7; 2pq=2×0.3×0.7=0.42 (42%).","q=0.3 وp=0.7، ومن ثم 2pq=42%.");
q("biology","single","bi-s10","Flow cytometry","Which signal typically reflects forward light scatter in flow cytometry?","على ماذا يدل غالبًا التبعثر الأمامي للضوء (FSC) في قياس التدفق الخلوي؟",
 ["Cell size-related property","Exact gene sequence","DNA base pair count","Enzyme active-site pKa"],["خاصية مرتبطة بحجم الخلية","التسلسل الجيني الدقيق","عدد أزواج قواعد DNA","pKa لموقع الإنزيم"],[0],
 "Forward scatter correlates broadly with particle or cell size, though optics and cell properties matter.","غالبًا يرتبط FSC بحجم الخلية أو الجسيم، مع تأثير خصائص الخلية والجهاز.");
q("biology","single","bi-s11","Metabolic engineering","Which intervention is most directly intended to reduce formation of an unwanted competing metabolite?","أي تدخل يستهدف مباشرة تقليل تكوين ناتج أيضي منافس غير مرغوب فيه؟",
 ["Knock out a competing-pathway enzyme","Increase the competing enzyme expression","Remove all carbon sources","Raise temperature without measurements"],["تعطيل إنزيم المسار المنافس","زيادة التعبير عن الإنزيم المنافس","إزالة كل مصادر الكربون","رفع الحرارة دون قياسات"],[0],
 "Reducing competing-pathway flux can redirect precursor toward a target product; feasibility requires measuring trade-offs.","خفض تدفق المسار المنافس قد يوجّه المواد الأولية نحو المنتج المطلوب، ويستلزم قياس الآثار الجانبية.");
q("biology","single","bi-s12","Statistics","When multiple hypotheses are tested, which procedure controls the false discovery rate under standard conditions?","عند اختبار فرضيات كثيرة، أي إجراء يستخدم لضبط معدل الاكتشافات الكاذبة (FDR)؟",
 ["Benjamini–Hochberg","Unadjusted p<0.05 per test","Ignoring missing data","Selecting only positive outcomes"],["بنجميني–هوشبرغ","p<0.05 دون تصحيح لكل اختبار","تجاهل البيانات المفقودة","اختيار النتائج الإيجابية فقط"],[0],
 "Benjamini–Hochberg adjusts multiple p-values to control false discovery rate under its assumptions.","يُعدّل إجراء بنجميني–هوشبرغ قيم p المتعددة لضبط FDR ضمن افتراضاته.");
// MEDICINE / PUBLIC HEALTH · Master's applied epidemiology, EBM and pathophysiology.
q("medicine","single","md-s01","Epidemiology","A cohort has risk of disease 20% in exposed and 10% in unexposed. What is the risk ratio?","في دراسة أتراب، خطر المرض 20% لدى المعرضين و10% لدى غير المعرضين. كم نسبة الخطر RR؟",
 ["0.5","1.0","2.0","10.0"],["0.5","1.0","2.0","10.0"],[2],
 "RR=0.20/0.10=2; exposed risk is double the unexposed risk, without automatically proving causation.","RR=0.20/0.10=2، أي خطر مضاعف لدى المعرضين دون إثبات السببية بحد ذاته.");
q("medicine","single","md-s02","Diagnostic testing","In a population of 1000, 100 cases and 900 noncases, a test has 90% sensitivity and 80% specificity. What is PPV?","في 1000 شخص: 100 مصاب و900 غير مصاب، اختبار الحساسية 90% والنوعية 80%. كم PPV؟",
 ["20%","33.3%","50%","90%"],["20%","33.3%","50%","90%"],[1],
 "True positives=90, false positives=180; PPV=90/(90+180)=33.3%.","الإيجابيات الحقيقية 90 والكاذبة 180، وبالتالي PPV=90/270≈33.3%.");
q("medicine","single","md-s03","Study design","Which design is generally strongest for estimating an intervention's causal effect when ethical and feasible?","أي تصميم هو الأقوى عادة لتقدير الأثر السببي لتدخل إذا كان ممكنًا وأخلاقيًا؟",
 ["Randomized controlled trial","Uncontrolled case series","Single anecdote","Ecological correlation alone"],["تجربة عشوائية مضبوطة","سلسلة حالات دون ضابط","قصة فردية","ارتباط بيئي وحده"],[0],
 "Random allocation can reduce confounding between treatment groups, although RCT validity still depends on design and conduct.","يساعد التوزيع العشوائي في تقليل الإرباك، مع بقاء أهمية جودة التصميم والتنفيذ.");
q("medicine","single","md-s04","Biostatistics","A 95% confidence interval for an odds ratio is 1.2 to 2.5. What is the standard null-value interpretation?","فترة الثقة 95% لنسبة الأرجحية OR هي 1.2 إلى 2.5. كيف نفسرها مقارنة بالقيمة العدمية؟",
 ["Includes 1 and not significant","Excludes 1 and suggests an association at 5% level","Proves causation","Is equivalent to relative risk"],["تضم 1 وليست مهمة","لا تضم 1 وتشير إلى ارتباط عند 5%","تثبت السببية","تساوي RR"],[1],
 "The CI excludes the null OR=1, suggesting statistical association under assumptions, not causality.","لا تشمل فترة الثقة القيمة 1، فتشير إلى ارتباط إحصائي ضمن الافتراضات ولا تثبت السببية.");
q("medicine","single","md-s05","Cardiovascular physiology","During acute reduced arterial pressure, a rapid baroreflex typically causes:","عند انخفاض الضغط الشرياني الحاد، ماذا يفعل منعكس مستقبلات الضغط بسرعة عادة؟",
 ["Increased sympathetic outflow","Increased baroreceptor firing","Immediate aldosterone washout","Reduced heart rate in all cases"],["زيادة النشاط الودي","زيادة إطلاق مستقبلات الضغط","تصفية الألدوستيرون فورًا","خفض النبض دائمًا"],[0],
 "Lower arterial stretch decreases baroreceptor firing; sympathetic tone increases to sustain cardiac output and resistance.","ينقص تنبيه مستقبلات الضغط فيزداد النشاط الودي لدعم النتاج القلبي والمقاومة.");
q("medicine","single","md-s06","Evidence synthesis","What is a key objective of a systematic review?","ما الهدف الأساسي للمراجعة المنهجية للأدلة؟",
 ["Predefined reproducible search and synthesis of evidence","Select only supporting studies","Replace research ethics approval in any setting","Guarantee unbiased conclusions"],["بحث وتركيب أدلة بخطة قابلة للتكرار","اختيار الدراسات المؤيدة فقط","الاستغناء عن أخلاقيات البحث مطلقًا","ضمان غياب التحيز"],[0],
 "Systematic reviews apply explicit inclusion, searching and appraisal methods; they can still have biases.","تتبع المراجعة المنهجية معايير بحث وضم وتقييم معلنة، ومع ذلك قد تواجه انحيازات.");
q("medicine","single","md-s07","Health policy","The primary purpose of a disease incidence rate is to describe:","ما الذي يقيسه معدل حدوث المرض (Incidence rate) أساسًا؟",
 ["New cases over person-time","All existing cases at one time","Number of hospital beds","Test specificity only"],["الحالات الجديدة لكل زمن-شخص","كل الحالات الموجودة لحظة معينة","عدد الأسرّة","نوعية الاختبار فقط"],[0],
 "Incidence density uses new events divided by total person-time at risk.","كثافة الحدوث = عدد الحالات الجديدة / مجموع زمن الشخص المعرض للخطر.");
q("medicine","single","md-s08","Infection control","A lower secondary attack rate after an intervention is best interpreted as:","إذا انخفض معدل الهجوم الثانوي بعد تدخل، فأي تفسير هو الأكثر ملاءمة؟",
 ["Potential reduction in transmission, subject to study design","Definitive proof of a mechanism","Complete eradication everywhere","A measure of mortality only"],["انخفاض محتمل للانتقال مع مراعاة تصميم الدراسة","دليل حاسم على الآلية","استئصال كامل عالميًا","مؤشر وفيات فقط"],[0],
 "Secondary attack rate measures infection among susceptible contacts; comparisons require accounting for confounding and ascertainment.","يقيس الانتقال بين المخالطين القابلين للإصابة؛ وتتطلب المقارنات ضبط الإرباك واكتشاف الحالات.");
q("medicine","single","md-s09","Pharmacokinetics","If first-order elimination half-life is 6 hours, what fraction remains after 12 hours?","إذا كان نصف عمر التخلص وفق مرتبة أولى 6 ساعات، فما الجزء المتبقي بعد 12 ساعة؟",
 ["1/2","1/4","1/8","3/4"],["النصف","الربع","الثمن","ثلاثة أرباع"],[1],
 "After two half-lives, remaining fraction=(1/2)²=1/4.","بعد نصفَي عمر متتالين يبقى (1/2)²=1/4.");
q("medicine","single","md-s10","Meta-analysis","Which graphical tool commonly displays study-specific effects and a pooled effect estimate?","أي مخطط يعرض تأثير كل دراسة وتقدير التأثير المجمع في التحليل التلوي؟",
 ["Forest plot","Pie chart only","Pedigree chart","Karyogram"],["مخطط الغابة","مخطط دائري فقط","مخطط النسب الوراثي","النمط النووي"],[0],
 "Forest plots present point estimates, intervals and often a pooled estimate.","يعرض مخطط الغابة تقديرات التأثير وفترات الثقة وقد يعرض التقدير المجمع.");
q("medicine","single","md-s11","Public health ethics","Which principle supports informing participants about study risks before enrollment?","أي مبدأ يلزم بإعلام المشاركين بمخاطر الدراسة قبل الالتحاق بها؟",
 ["Informed consent","Selective outcome reporting","Undisclosed randomization","Withholding all information"],["الموافقة المستنيرة","انتقاء النتائج","عشوائية غير معلنة","حجب جميع المعلومات"],[0],
 "Informed consent includes meaningful disclosure, comprehension and voluntary participation.","الموافقة المستنيرة تشمل المعلومات الملائمة والفهم والمشاركة الطوعية.");
q("medicine","single","md-s12","Renal physiology","The hormone ADH primarily increases collecting-duct water permeability through:","بماذا يزيد ADH نفاذية الماء في القنوات الجامعة أساسًا؟",
 ["V₂ receptors and aquaporin-2","Direct glomerular platelet activation","Blocking all ion channels","Inhibiting aldosterone synthesis only"],["مستقبلات V₂ وقنوات aquaporin-2","تنشيط صفائح الكبيبة","إغلاق جميع قنوات الأيونات","تثبيط الألدوستيرون فقط"],[0],
 "Vasopressin acts at collecting-duct V₂ receptors and inserts apical AQP2 channels.","يعمل الفازوبرسين عبر V₂ لإدخال قنوات AQP2 في الغشاء القِمي للخلايا الرئيسية.");
// Multiple-answer Master's concepts, three correct + one clearly incorrect in each.
const MULTI=[
["chemistry","ch-m01","Thermodynamics","Which can alter reaction Gibbs energy ΔᵣG at fixed pressure?","ما الذي قد يغير طاقة غيبس للتفاعل عند ضغط ثابت؟",
 ["Temperature","Reaction quotient Q","Standard reaction Gibbs energy ΔG°","Catalyst changes ΔG° by definition"],
 ["درجة الحرارة","حاصل التفاعل Q","طاقة غيبس القياسية ΔG°","المحفز يغير ΔG° بالضرورة"],
 "ΔᵣG=ΔᵣG°+RTlnQ; temperature and composition matter. A catalyst changes rate, not the equilibrium state.","ΔᵣG=ΔᵣG°+RTlnQ؛ تتدخل الحرارة والتركيب والكمية القياسية؛ المحفز لا يغير موضع الاتزان."],
["chemistry","ch-m02","Analytical chemistry","Which practices improve confidence in quantitative chromatography?","ما الإجراءات التي تحسن موثوقية التحليل الكمي بالاستشراب؟",
 ["Calibration standards","Blank and quality-control runs","Replicate measurements","Ignore baseline drift"],
 ["محاليل قياسية للمعايرة","شواهد فارغة وضبط جودة","قياسات مكررة","تجاهل انجراف خط الأساس"],
 "Calibration, blanks and replication reveal bias and precision issues; baseline drift must be assessed.","تُحسن المعايير والشواهد والمكررات موثوقية القياس، ولا يجوز تجاهل انجراف خط الأساس."],
["chemistry","ch-m03","Materials science","Which can affect electrical conductivity of a solid material?","ما العوامل التي قد تؤثر في التوصيل الكهربائي لمادة صلبة؟",
 ["Dopant concentration","Crystal defects","Temperature","Paper label color"],
 ["تركيز الشوائب المطعّمة","عيوب البلورة","درجة الحرارة","لون ملصق العينة"],
 "Carrier density, scattering and defect states influence conductivity; label color has no intrinsic effect.","تؤثر كثافة الحوامل والتبعثر والعيوب ودرجة الحرارة في التوصيل، بخلاف لون الملصق."],
["chemistry","ch-m04","Reaction kinetics","Which statements about a first-order reaction are correct under constant conditions?","أي العبارات صحيحة لتفاعل من المرتبة الأولى عند ثبات الشروط؟",
 ["ln[A] versus time is linear","Half-life equals ln2/k","Rate is proportional to [A]","Half-life grows directly with starting [A]"],
 ["علاقة ln[A] والزمن خطية","نصف العمر ln2/k","السرعة تتناسب مع [A]","نصف العمر يزداد طرديًا مع [A] الابتدائي"],
 "The integrated first-order law yields a constant half-life independent of initial concentration.","قانون المرتبة الأولى المتكامل يعطي نصف عمر ثابتًا مستقلًا عن التركيز الابتدائي."],
["chemistry","ch-m05","Spectroscopy","Which are useful for organic structure elucidation?","أي التقنيات تساعد على كشف البنية العضوية؟",
 ["NMR chemical shifts","Mass spectrometry fragments","IR functional-group bands","pH alone determines stereochemistry"],
 ["الإزاحة الكيميائية في NMR","شظايا مطياف الكتلة","حزم المجموعات الوظيفية في IR","pH وحده يحدد الكيمياء الفراغية"],
 "NMR, MS and IR provide complementary structural clues, but pH does not determine stereochemistry.","توفر NMR وMS وIR دلائل متكاملة؛ لا يحدد pH وحده التصاوغ الفراغي."],
["chemistry","ch-m06","Electrochemistry","Which statements are valid for a galvanic cell under spontaneous discharge?","ما العبارات الصحيحة للخلية الجلفانية عند التفريغ التلقائي؟",
 ["Oxidation occurs at anode","Reduction occurs at cathode","Electrons move through external circuit from anode to cathode","Salt bridge transports electrons through solution"],
 ["تحدث الأكسدة في المصعد","يحدث الاختزال في المهبط","تتحرك الإلكترونات عبر السلك من المصعد للمهبط","ينقل الجسر الملحي إلكترونات عبر المحلول"],
 "Electrons use the outer wire; ions carry current and maintain electroneutrality in the salt bridge.","تتحرك الإلكترونات في الدارة الخارجية، بينما تنتقل الأيونات في الجسر الملحي لحفظ التعادل."],
["chemistry","ch-m07","Organic chemistry","Which favor an SN2 substitution mechanism?","ما العوامل التي ترجح آلية SN2؟",
 ["Relatively unhindered substrate","Strong nucleophile","Polar aprotic solvent commonly","A fully stabilized carbocation intermediate"],
 ["ركيزة قليلة الإعاقة الفراغية","نيوكليوفيل قوي","مذيب قطبي لابروتي غالبًا","وسيط كربوكاتيون ثابت بالكامل"],
 "SN2 is concerted with backside attack, favored by low steric hindrance and appropriate nucleophile/solvent.","تحدث SN2 بخطوة واحدة وهجوم خلفي، ويفضلها قلة العائق ونيوكليوفيل ومذيب مناسب."],
["chemistry","ch-m08","Experimental design","Which improve reproducibility of a chemical experiment?","ما الإجراءات التي تحسن قابلية تكرار التجربة الكيميائية؟",
 ["Recording reagent grades","Documenting temperature and calibration","Reporting uncertainty","Omitting failed trials without documentation"],
 ["تسجيل نقاوة الكواشف","توثيق الحرارة والمعايرة","الإبلاغ عن عدم اليقين","حذف التجارب الفاشلة دون توثيق"],
 "Reproducibility requires complete procedures, environmental controls and transparent uncertainty, including unsuccessful runs.","تتطلب القابلية للتكرار توثيق الإجراءات والظروف وعدم اليقين والتجارب غير الناجحة."],
["biology","bi-m01","Gene regulation","Which regulate eukaryotic gene expression?","ما الآليات التي تنظم التعبير الجيني في حقيقيات النوى؟",
 ["Transcription factors","Chromatin accessibility","microRNAs","DNA sequence always identical to mRNA without processing"],
 ["عوامل النسخ","إتاحة الكروماتين","microRNAs","تسلسل DNA يماثل mRNA دائمًا دون معالجة"],
 "Transcription factors, epigenetic accessibility and posttranscriptional microRNAs regulate expression.","تنظم عوامل النسخ وحالة الكروماتين وmicroRNAs مستويات التعبير عبر آليات متعددة."],
["biology","bi-m02","PCR methodology","Which controls help assess RT-qPCR reliability?","ما الشواهد التي تساعد على موثوقية RT-qPCR؟",
 ["No-template control","No-reverse-transcriptase control","Reference gene assessment","Assume every cycle threshold is contamination-free"],
 ["شاهد دون قالب","شاهد دون إنزيم نسخ عكسي","التحقق من الجين المرجعي","اعتبار كل Ct خاليًا من التلوث"],
 "Controls detect contamination and genomic DNA carryover; reference suitability requires validation.","تساعد الشواهد على كشف التلوث وDNA الجينومي، وتتطلب الجينات المرجعية تحققًا مناسبًا."],
["biology","bi-m03","Genome editing","Which risks or limitations must be considered in CRISPR experiments?","ما المخاطر أو القيود التي يجب مراعاتها في تجارب CRISPR؟",
 ["Off-target edits","Mosaicism","DNA repair pathway outcomes","Perfect specificity in every cell is guaranteed"],
 ["تعديلات خارج الهدف","فسيفسائية التعديل","نتائج مسارات إصلاح DNA","ضمان النوعية الكاملة لكل خلية"],
 "Genome editing can produce unintended and heterogeneous outcomes; appropriate controls and sequencing are essential.","قد تنتج تعديلات خارج الهدف أو مختلفة بين الخلايا، وتستلزم ضوابط وفحص التسلسل."],
["biology","bi-m04","Bioprocess engineering","Which influence bioreactor product yield?","ما العوامل التي تؤثر في مردود المنتج في المفاعل الحيوي؟",
 ["Substrate supply","Dissolved oxygen","Product inhibition","Label font of the reactor"],
 ["الإمداد بالركيزة","الأكسجين الذائب","تثبيط المنتج","خط كتابة ملصق المفاعل"],
 "Bioreactor productivity depends on metabolic limitations, oxygen delivery and product feedback.","يتأثر الإنتاج بتوفر الركائز وتوصيل الأكسجين وتثبيط الناتج."],
["biology","bi-m05","Statistical inference","Which reflect good practice when testing many gene-expression hypotheses?","ما ممارسات التحليل الجيد عند اختبار جينات كثيرة؟",
 ["False-discovery-rate control","Independent biological replication","Explicit filtering and normalization","Treat unadjusted p<0.05 as proof for every gene"],
 ["ضبط FDR","مكررات بيولوجية مستقلة","التصفية والتطبيع المعلنان","اعتبار p الخام<0.05 إثباتًا لكل جين"],
 "Omics studies require multiple-testing correction, biological replication and transparent analysis.","تستلزم دراسات أوميكس تصحيح الاختبارات المتعددة وتكرارًا بيولوجيًا وتحليلًا شفافًا."],
["biology","bi-m06","Protein structure","Which interactions often contribute to protein folding stability?","ما الروابط أو التأثيرات التي تساهم غالبًا في ثبات طي البروتين؟",
 ["Hydrophobic effects","Hydrogen bonds","Disulfide bonds in appropriate proteins","All protein tertiary structure relies only on covalent peptide bonds"],
 ["التأثيرات الكارهة للماء","الروابط الهيدروجينية","روابط ثنائي الكبريت في بعض البروتينات","تعتمد البنية الثالثة دائمًا على روابط الببتيد فقط"],
 "Stability arises from diverse interactions beyond peptide bonds, with context-dependent contributions.","ينشأ الثبات من تآثرات متعددة غير روابط الببتيد، وتتفاوت أهمية كل منها."],
["biology","bi-m07","Cell biology","Which can be assessed with flow cytometry plus appropriate labels?","ما الذي يمكن قياسه بقياس التدفق الخلوي مع الواسمات المناسبة؟",
 ["Relative surface antigen expression","Cell-cycle DNA content","Fraction of marker-positive cells","Whole-genome base sequence with routine scatter alone"],
 ["التعبير النسبي عن مستضدات السطح","محتوى DNA خلال دورة الخلية","نسبة الخلايا الإيجابية للواسم","تسلسل الجينوم كاملًا بالتبعثر الروتيني وحده"],
 "Fluorescence and scatter profiles support phenotyping and cell-cycle analysis, not whole-genome sequencing.","تدعم الإشارات الفلورية والتبعثر التنميط ودورة الخلية، لا التسلسل الجينومي الكامل."],
["biology","bi-m08","Research ethics","Which are valid principles for human biospecimen studies?","ما المبادئ الصحيحة عند البحث على عينات بشرية؟",
 ["Informed consent or approved legal basis","Appropriate de-identification","Ethics review when required","Publish identifiable samples without permission"],
 ["موافقة مستنيرة أو أساس قانوني مناسب","إزالة بيانات التعريف وفق الحاجة","مراجعة أخلاقية عند لزومها","نشر عينات تكشف الهوية بلا إذن"],
 "Research governance requires legitimate consent/basis, privacy protections and appropriate oversight.","تحتاج إدارة البحث إلى أساس مشروع وحماية خصوصية ومراجعة مختصة عند الضرورة."],
["medicine","md-m01","Epidemiology","Which are common limitations in an observational cohort study?","ما القيود الشائعة في دراسة الأتراب الرصدية؟",
 ["Confounding","Loss to follow-up","Selection bias","Automatic random allocation"],
 ["الإرباك","الفقد أثناء المتابعة","انحياز الاختيار","العشوائية التلقائية"],
 "Observational cohorts may suffer confounding, attrition and selection bias, and do not automatically randomize exposure.","تواجه دراسات الأتراب إرباكًا وفقدًا للمتابعة وانحياز اختيار ولا تخصص التعرض عشوائيًا بطبيعتها."],
["medicine","md-m02","Diagnostic accuracy","Which characteristics can change positive predictive value of a diagnostic test?","ما العوامل التي قد تغيّر PPV لاختبار تشخيصي؟",
 ["Disease prevalence","Sensitivity","Specificity","Color of test packaging alone"],
 ["انتشار المرض","الحساسية","النوعية","لون عبوة الاختبار وحده"],
 "Bayesian PPV depends on prevalence, sensitivity and specificity.","تعتمد PPV بايزيًا على انتشار المرض وحساسية الاختبار ونوعيته."],
["medicine","md-m03","Critical appraisal","Which strengthen a randomized clinical trial?","ما الذي يقوي جودة تجربة سريرية عشوائية؟",
 ["Allocation concealment","Intention-to-treat analysis","Prespecified outcome measures","Selective reporting after results are known"],
 ["إخفاء التخصيص","التحليل حسب نية العلاج","تحديد النتائج مسبقًا","اختيار نشر النتائج بعد معرفتها"],
 "Concealment, prespecification and intent-to-treat reduce common selection and analysis biases.","يحد إخفاء التخصيص والتخطيط السابق والتحليل حسب نية العلاج من انحيازات شائعة."],
["medicine","md-m04","Public health","Which approaches can inform population-level disease prevention?","ما المقاربات التي تدعم الوقاية من المرض على مستوى المجتمع؟",
 ["Surveillance data","Risk factor analysis","Evaluation of interventions","Assuming a single strategy works universally without measurement"],
 ["بيانات الترصد","تحليل عوامل الخطر","تقييم التدخلات","افتراض نجاح استراتيجية واحدة للجميع دون قياس"],
 "Prevention planning requires ongoing surveillance, determinants assessment and evaluation.","تتطلب الوقاية ترصدًا وتحليل محددات المرض وتقييمًا لفعالية التدخلات."],
["medicine","md-m05","Meta-analysis","Which should be considered when interpreting a pooled meta-analysis?","ما الجوانب التي يجب مراعاتها عند تفسير تحليل تلوي؟",
 ["Between-study heterogeneity","Risk of bias","Publication bias","Assuming pooled estimates are automatically causal"],
 ["تغاير الدراسات","خطر التحيز","انحياز النشر","افتراض السببية تلقائيًا للتقدير المجمع"],
 "Heterogeneity, publication and internal study biases affect pooled effect estimates.","يؤثر تغاير الدراسات وانحياز النشر والجودة الداخلية على تقدير الأثر المجمع."],
["medicine","md-m06","Clinical physiology","Which factors materially influence oxygen delivery DO₂ in a simplified physiological model?","ما العوامل المؤثرة في توصيل الأكسجين DO₂ في نموذج مبسط؟",
 ["Cardiac output","Hemoglobin concentration","Arterial hemoglobin saturation","PaO₂ alone completely determines delivery"],
 ["النتاج القلبي","تركيز الهيموغلوبين","التشبع الشرياني للهيموغلوبين","PaO₂ وحده يحدد التوصيل كليًا"],
 "DO₂ equals flow times oxygen content; hemoglobin concentration and saturation dominate oxygen carriage.","DO₂ يساوي تدفق الدم مضروبًا بمحتوى الأكسجين الذي يتأثر بالهيموغلوبين والتشبع."],
["medicine","md-m07","Pharmacology","Which may alter total drug exposure at a fixed dose?","ما العوامل التي قد تغيّر التعرض الكلي لدواء بجرعة ثابتة؟",
 ["Bioavailability","Clearance","Drug interactions","Patient's handwriting style"],
 ["التوافر الحيوي","التصفية","التداخلات الدوائية","أسلوب خط المريض"],
 "Drug AUC can change with bioavailability, clearance and interactions; handwriting does not determine pharmacokinetic exposure.","قد يتغير AUC مع التوافر الحيوي والتصفية والتداخلات، ولا يحدده شكل الخط."],
["medicine","md-m08","Research ethics","Which improve ethical standards in clinical research?","ما الإجراءات التي تعزز أخلاقيات البحث السريري؟",
 ["Voluntary informed consent","Independent ethics review","Protection of participant confidentiality","Withholding known major risks"],
 ["موافقة طوعية مستنيرة","مراجعة أخلاقية مستقلة","حماية سرية المشاركين","إخفاء المخاطر المهمة المعروفة"],
 "Ethical research involves transparent risks, voluntary participation and confidentiality.","يستلزم البحث الأخلاقي شفافية المخاطر والمشاركة الطوعية والسرية."]
];
for(const x of MULTI){const [subject,id,topic,en,ar,oe,oa,whyEn,whyAr]=x;
 q(subject,"multi",id,topic,en,ar,oe,oa,[0,1,2],whyEn,whyAr);
}
// Advanced essays — original, Master's-level reasoning and marking criteria.
const ESSAYS=[
["chemistry","ch-e1","Thermodynamics and equilibrium",
 "A reaction has ΔH°=−60 kJ/mol and ΔS°=−0.15 kJ/(mol·K). Calculate ΔG° at 300 K and 500 K; interpret temperature dependence and the meaning of equilibrium conditions.",
 "لتفاعل ΔH°=−60 كيلوجول/مول وΔS°=−0.15 كيلوجول/(مول·كلفن)، احسب ΔG° عند 300 و500 كلفن وفسر أثر الحرارة والاتزان.",
 "ΔG°(300)=−60−300(−0.15)=−15 kJ/mol. ΔG°(500)=−60+75=+15 kJ/mol. With negative entropy, increasing T disfavors the forward reaction under standard conditions. Actual spontaneity requires ΔG=ΔG°+RTlnQ; equilibrium when ΔG=0, so ΔG° need not be zero.",
 "ΔG° عند 300 =−15 وعند 500=+15. لأن ΔS سالبة، رفع T يجعل التفاعل الأمامي أقل تفضيلًا في الحالة القياسية. في الظروف غير القياسية ΔG=ΔG°+RTlnQ وعند الاتزان ΔG=0."],
["chemistry","ch-e2","Chemical kinetics",
 "A first-order decomposition yields 25% remaining after 20 min. Compute k and half-life. Explain a test to distinguish first-order from zero-order using concentration-time measurements.",
 "بقي 25% من مادة تتحلل من المرتبة الأولى بعد 20 دقيقة. احسب k ونصف العمر واقترح اختبارًا يميّزها عن المرتبة الصفرية.",
 "For [A]/[A]₀=0.25=e^(−20k), k=ln4/20≈0.0693 min⁻¹. t1/2=ln2/k=10 min. A plot of ln[A] versus time is linear for first order, whereas [A] versus time is linear for zero order.",
 "0.25=e^(−20k)؛ لذلك k≈0.0693 دقيقة⁻¹ ونصف العمر 10 دقائق. خطية ln[A] مع الزمن تشير للمرتبة الأولى وخطية [A] مع الزمن للمرتبة الصفرية."],
["chemistry","ch-e3","Analytical validation",
 "Design a calibration and quality-control strategy for measuring trace analyte concentrations by HPLC. Explain blanks, standards, repeatability, recovery and uncertainty.",
 "صمّم استراتيجية معايرة وضبط جودة لقياس تراكيز ضئيلة بتقنية HPLC، موضحًا الشواهد والمعايير والتكرارية والاسترداد وعدم اليقين.",
 "Prepare matrix-matched standards over a validated range, run solvent/matrix blanks, include independent quality controls and replicates, measure calibration slope and residuals, and evaluate spike recovery, precision and detection limits. Quantify uncertainty and report method limitations such as matrix interference.",
 "نستخدم محاليل قياسية مناسبة لمصفوفة العينة ضمن مجال مقبول، وشواهد فارغة وضبط جودة مستقلًا ومكررات؛ ثم نفحص خطية المعايرة ودقتها واسترداد الإضافة وحد الكشف وعدم اليقين وتداخل المصفوفة."],
["chemistry","ch-e4","Materials structure",
 "Compare point defects, dislocations, and grain boundaries in crystalline materials. Explain how they may affect mechanical and electrical properties, and name two suitable characterization methods.",
 "قارن العيوب النقطية والانخلاعات وحدود الحبيبات في البلورات، واشرح أثرها في الخواص الميكانيكية والكهربائية وحدد تقنيتين للفحص.",
 "Vacancies/interstitials are point defects, dislocations are line defects, and grain boundaries separate orientations. Dislocations enable plastic deformation; grain boundaries can impede slip and affect conductivity/diffusion. X-ray diffraction probes phases/strain; electron microscopy can image grains or some defects.",
 "الفجوات والذرات البينية عيوب نقطية، والانخلاعات خطية، وحدود الحبيبات تفصل اتجاهات مختلفة. تتحكم الانخلاعات بالتشوه البلاستيكي، وقد تعيق الحدود الانزلاق وتؤثر في النقل؛ يستخدم XRD والمجهر الإلكتروني."],
["biology","bi-e1","Enzyme kinetics",
 "An enzyme has Vmax=120 μmol/min and Km=30 μM. Calculate v at [S]=30 μM and 90 μM. Describe the effect of a competitive inhibitor on Km and Vmax, and identify a limitation of this ideal model.",
 "لإنزيم Vmax=120 ميكرومول/دقيقة وKm=30 ميكرومولاري، احسب v عند [S]=30 و90 ميكرومولاري وفسر أثر مثبط تنافسي وحدود النموذج.",
 "v=Vmax[S]/(Km+[S]). At 30 μM, v=60 μmol/min; at 90 μM, v=90 μmol/min. Competitive inhibitor increases apparent Km while Vmax is unchanged in the ideal model. Michaelis–Menten assumes initial rates and suitable steady-state conditions.",
 "v=Vmax[S]/(Km+[S]): عند 30 تكون 60، وعند 90 تكون 90 ميكرومول/دقيقة. التثبيط التنافسي يرفع Km الظاهر ويبقي Vmax في النموذج المثالي، ويشترط ثباتًا مناسبًا ومعدلات أولية."],
["biology","bi-e2","Gene expression",
 "Plan a controlled RT-qPCR experiment comparing gene expression in two cell groups. Discuss biological replicates, RNA quality, housekeeping gene suitability, ΔΔCt calculation and interpretation.",
 "ضع خطة تجربة RT-qPCR مضبوطة للمقارنة بين مجموعتي خلايا، وتناول التكرارات وجودة RNA والجين المرجعي وحساب ΔΔCt والتفسير.",
 "Extract good-quality RNA with biological replicates, check for DNA contamination and RNA integrity, choose and validate a stable reference transcript, use no-template/no-RT controls, compute ΔCt=Ct(target)−Ct(reference), ΔΔCt=ΔCt(treated)−ΔCt(control), then relative fold change=2^(−ΔΔCt) when assay efficiencies are suitable. Report variation and limitations.",
 "نستخدم RNA جيدًا وتكرارات بيولوجية مع شواهد عدم القالب وعدم النسخ العكسي، ونراجع ثبات الجين المرجعي، ثم نحسب ΔCt وΔΔCt والتغير النسبي 2^(−ΔΔCt) إذا كانت كفاءات الاختبار مناسبة، مع حدود تفسير النتائج."],
["biology","bi-e3","Population genetics",
 "Under Hardy–Weinberg assumptions, 9% of a population displays a recessive phenotype. Derive p, q, heterozygote fraction and the expected carrier count in 500 persons; discuss two possible violations of the model.",
 "في جماعة تخضع لهاردي–واينبرغ يظهر النمط المتنحي في 9%. اشتق p وq ونسبة الحاملين وعددهم في 500 شخص مع حدود النموذج.",
 "q²=0.09; q=0.3, p=0.7, carrier frequency 2pq=0.42, expected carriers=0.42×500=210. Random mating, large population, no migration, mutation or selection are assumptions that can fail.",
 "q²=0.09 ثم q=0.3 وp=0.7، ونسبة الحاملين 2pq=0.42 أي 210 من 500. قد يختل التوازن مع الانتخاب أو عدم عشوائية التزاوج والهجرة."],
["biology","bi-e4","Genome editing ethics",
 "A hypothetical laboratory is considering CRISPR editing for a research-only cell model. Describe how to formulate an aim, assess on-target and off-target effects, validate controls and handle biosafety and ethical constraints. Do not give an operational editing protocol.",
 "يفكر مختبر افتراضي في تعديل جينوم خلايا لأغراض بحثية فقط. ناقش الهدف وتقييم التعديلات داخل الهدف وخارجه والشواهد والسلامة والأخلاقيات دون بروتوكول عملي.",
 "Define a clear, testable gene-function hypothesis; compare edited groups with matched controls; plan sequencing-based verification of intended and off-target outcomes, replicate observations, and review cell viability and biological phenotypes. Follow biosafety, ethics and institutional review requirements. No experimental protocol is implied.",
 "نحدد فرضية قابلة للاختبار وشواهد مطابقة ونخطط للتحقق التسلسلي من الأثر المقصود وغير المقصود والتكرارات وحيوية الخلايا، مع الالتزام بالموافقات الأخلاقية والسلامة المؤسسية."],
["medicine","md-e1","Diagnostic epidemiology",
 "Among 2000 people, 100 have a condition. A test has sensitivity 90% and specificity 95%. Calculate TP, FN, TN, FP and PPV. Interpret why PPV depends on prevalence.",
 "في 2000 شخص منهم 100 مصاب، حساسية اختبار 90% ونوعيته 95%. احسب TP وFN وTN وFP وPPV وناقش أثر الانتشار.",
 "TP=90,FN=10. Noncases=1900; TN=0.95×1900=1805,FP=95. PPV=90/(90+95)=48.65%. PPV reflects disease prevalence as well as sensitivity and specificity; a positive is not certain evidence of disease.",
 "الإيجابيات الحقيقية 90، السلبية الكاذبة 10، السلبية الحقيقية 1805 والإيجابية الكاذبة 95. القيمة PPV=90/185≈48.65% وتعتمد على الانتشار بجانب حساسية الاختبار ونوعيته."],
["medicine","md-e2","Causal inference",
 "A cohort study finds relative risk RR=2.1 for disease in an exposed group. Explain three potential noncausal interpretations, a plan to assess confounding and why observational association is not necessarily causation.",
 "وجدت دراسة أتراب RR=2.1 بين التعرض والمرض. اشرح ثلاثة تفسيرات غير سببية وخطة تقييم الإرباك ولماذا لا يعني الارتباط سببية مؤكدة.",
 "Selection bias, confounding (e.g., correlated exposures) and information/misclassification bias can create apparent associations. Draw a causal diagram, collect relevant confounders before analysis, use suitable stratification/regression and sensitivity analyses, and inspect time-order and dose-response evidence. Residual confounding remains possible.",
 "قد ينتج الارتباط عن انحياز الاختيار أو الإرباك أو خطأ التصنيف. نحدد المتغيرات على مخطط سببي ونجمعها مسبقًا ونستخدم طبقات أو نماذج ضبط وتحليل حساسية مع دراسة التسلسل الزمني؛ قد يبقى إرباك متبقٍ."],
["medicine","md-e3","Meta-analysis interpretation",
 "Explain the meaning of I² heterogeneity, why an I² of 70% requires investigation, and the roles of forest plots, subgroup analysis and study quality assessment in a meta-analysis.",
 "فسّر تغاير I² ولماذا يتطلب I²=70% استقصاء، وأدوار مخطط الغابة والتحليل الفرعي وجودة الدراسات في التحليل التلوي.",
 "I² estimates the proportion of observed variability not readily attributable to sampling error under model assumptions; 70% suggests substantial heterogeneity for investigation. Inspect designs, populations, intervention differences, risk of bias and sensitivity/subgroup analyses without treating I² as a definitive biological difference or evidence of causation.",
 "يمثل I² مؤشرًا على التغاير غير المفسر بالتباين العشوائي ضمن النموذج؛ 70% يوحي بتغاير مهم. نفحص السكان والتدخلات والانحياز والتحليلات الفرعية والحساسية دون عدّه دليلًا سببيًا."],
["medicine","md-e4","Population health policy",
 "Design an ethical evaluation of a community prevention intervention using a comparison group. Identify primary outcome, confounders, equity indicators, privacy protections and threats to validity.",
 "صمم تقييمًا أخلاقيًا لتدخل وقائي مجتمعي بمقارنة مناسبة؛ حدد النتيجة الأولية والإرباك ومؤشرات الإنصاف والخصوصية ومهددات الصلاحية.",
 "Specify measurable population-level outcome and baseline, select a feasible comparison or phased implementation, predefine confounders and analysis, assess differential effects across groups, ensure consent/legal basis and de-identification, and examine selection, secular trends and loss-to-follow-up bias.",
 "نحدد نتيجة قابلة للقياس وخط أساس ومجموعة مقارنة أو تنفيذًا مرحليًا، ونحدد عوامل الإرباك مسبقًا ونقيس الإنصاف بين الفئات، ونحمي الهوية مع فحص اتجاهات الزمن وانحياز الاختيار والفقد."]
];
for(const x of ESSAYS)essay(...x);
// Oral response practice — judged only for transcript scientific CONTENT; no voice/proctor claims.
const ORALS=[
["chemistry","ch-o1","Scientific presentation","In two minutes, explain why Gibbs energy alone must be interpreted with temperature, composition and equilibrium conditions.","خلال دقيقتين، اشرح لماذا يلزم تفسير طاقة غيبس مع الحرارة والتركيب والاتزان.",
 "State ΔG=ΔG°+RTlnQ, sign of ΔG for direction at given T,P, equilibrium when ΔG=0, and that ΔG° need not vanish.","اذكر العلاقة ΔG=ΔG°+RTlnQ واتجاه التفاعل وفق إشارة ΔG وشروط الاتزان ΔG=0، وأن ΔG° لا يلزم أن تكون صفرًا."],
["chemistry","ch-o2","Method validation","Explain the difference between accuracy, precision and selectivity in chemical analytical methods, with one example for each.","اشرح الفرق بين الصحة والدقة التكرارية والنوعية في التحليل الكيميائي مع مثال لكل منها.",
 "Accuracy is closeness to reference, precision measures repeatability, selectivity limits interference. Examples: certified reference, replicate SD, matrix-interference study.","الصحة قرب القياس من المرجع، والتكرارية تشتت القراءات، والنوعية القدرة على عزل الإشارة؛ أمثلة: مرجع معياري ومكررات وتداخل المصفوفة."],
["chemistry","ch-o3","Materials research","Present a short plan for comparing the crystal structures of two candidate materials, and explain possible limitations.","قدم خطة قصيرة لمقارنة البنى البلورية لمادتين وبيّن حدود التفسير.",
 "Use consistent sample preparation, XRD phase patterns and peak positions, complementary microscopy, replicate measurements and avoid overclaiming from peaks alone.","يستخدم تحضيرًا موحدًا وحيود الأشعة السينية ومجهرية داعمة ومكررات، مع تجنب الجزم بالبنية من قمم منفردة."],
["biology","bi-o1","Molecular methods","In two minutes, compare RT-qPCR and RNA-seq as tools for gene-expression analysis; describe advantages, controls and limitations.","خلال دقيقتين قارن RT-qPCR وRNA-seq في تحليل التعبير الجيني مع الضوابط والقيود.",
 "RT-qPCR measures selected transcripts sensitively; RNA-seq profiles many transcripts but requires depth and multiple-testing normalization. Include biological replication and validation.","RT-qPCR يستهدف عددًا محدودًا من النصوص بدقة، وRNA-seq يرصد نطاقًا واسعًا ويتطلب تطبيعًا وضبط اختبارات متعددة، مع تكرارات وتحقق مستقل."],
["biology","bi-o2","Biotechnology risk","Describe how you would evaluate the safety and data validity of a genetic engineering research proposal at a conceptual level.","صف كيف تقيّم السلامة وصحة البيانات لمقترح بحث هندسة وراثية مفاهيميًا.",
 "Define scientific scope, oversight, intended/unintended outcomes, biosafety constraints, control groups, reproducibility and transparent reporting.","تحديد الهدف والإشراف والعواقب المتوقعة وغير المتوقعة والسلامة والشواهد والتكرار وشفافية الإبلاغ."],
["biology","bi-o3","Research methods","Explain why biological replication is not the same as repeating an instrument measurement on one biological sample.","اشرح لماذا لا يساوي التكرار البيولوجي تكرار القياس على عينة بيولوجية واحدة.",
 "Independent biological samples reflect biological variation; technical replicates largely assess measurement precision. Treating technical replicates as independent biological n is pseudoreplication.","العينات المستقلة تقيس اختلافًا بيولوجيًا بينما المكررات التقنية تقيس دقة الأداة، واعتبارها n بيولوجيًا يسبب تكرارًا زائفًا."],
["medicine","md-o1","Epidemiology interpretation","In two minutes, explain why positive predictive value changes when disease prevalence changes.","اشرح خلال دقيقتين سبب تغير PPV مع انتشار المرض.",
 "PPV=P(disease|positive), governed by Bayes, sensitivity, specificity and prevalence; lower prevalence can yield many false positives even with good tests.","القيمة PPV احتمال المرض بعد إيجابية الفحص وتعتمد على بايز والحساسية والنوعية والانتشار؛ تقل في المجتمعات منخفضة الانتشار."],
["medicine","md-o2","Evidence quality","Explain how you would appraise a randomized controlled trial before recommending changes to a population health policy.","كيف تقيّم تجربة عشوائية قبل اقتراح تغيير في سياسة صحية مجتمعية؟",
 "Check registration, allocation concealment, randomization, attrition, outcomes, confidence intervals, applicability, adverse effects, ethics and equity.","نراجع التسجيل وإخفاء التخصيص والعشوائية والفقد والنتائج وفترات الثقة والقابلية للتعميم والأضرار والأخلاقيات والإنصاف."],
["medicine","md-o3","Health systems","Describe a way to evaluate a preventive health intervention fairly across groups without exposing individual records.","صف طريقة عادلة لتقييم تدخل وقائي بين فئات مجتمعية دون كشف السجلات الفردية.",
 "Define aggregate outcomes, de-identified data, baseline comparison, equity stratification, transparent methods, consent/legal basis and privacy threshold.","نحدد نتائج مجمعة منزوعة الهوية وخط أساس ومقارنة حسب مجموعات الإنصاف مع أساليب شفافة وأساس قانوني وضوابط خصوصية."]
];
for(const x of ORALS)oral(...x);
// Generator: parameterized original maths & conceptual variants to make full 25 + 15 tests non-duplicate.
function generated(subject,kind,seed){
 if(!SUBJECTS[subject]||!["single","multi"].includes(kind))throw Error("INVALID_GENERATION");
 const n=Math.abs(Math.trunc(Number(seed)||0)),type=n%3;
 if(kind==="single"){
  if(subject==="chemistry"){
   if(type===0){const h=-(20+(n%19)*2),entropy=-(.05+(n%10)*.01),T=300,ans=Math.round((h-T*entropy)*100)/100;
    return qGenerated(subject,kind,n,"Gibbs energy",
     "Calculate ΔG=ΔH−TΔS for ΔH="+h+" kJ/mol, ΔS="+entropy.toFixed(2)+" kJ/(mol·K), T=300 K.",
     "احسب ΔG لعلاقة ΔH−TΔS عندما ΔH="+h+" وΔS="+entropy.toFixed(2)+" وT=300 كلفن.",
     [(ans-20).toFixed(2),ans.toFixed(2),(ans+10).toFixed(2),(ans+20).toFixed(2)],[1],
     "ΔG="+h+"−300×("+entropy.toFixed(2)+")="+ans.toFixed(2)+" kJ/mol.");
   }
   if(type===1){const k=[.0693,.1386,.231,.3465][Math.floor(n/3)%4],ans=Math.round((.693/k)*100)/100;
    return qGenerated(subject,kind,n,"First-order half-life","Calculate t½ if k="+k+" min⁻¹ for a first-order reaction (ln2=0.693).",
     "احسب نصف العمر لتفاعل مرتبة أولى عندما k="+k+" دقيقة⁻¹ وln2=0.693.",
     [(ans/2).toFixed(2),ans.toFixed(2),(ans*2).toFixed(2),(ans*3).toFixed(2)],[1],
     "t½=0.693/"+k+"="+ans.toFixed(2)+" min.");
   }
   const ka=3+Math.floor(n/3)%7,ph=ka+1;
   return qGenerated(subject,kind,n,"Henderson–Hasselbalch",
    "A buffer has pKa="+ka+" and pH="+ph+". Calculate [A−]/[HA].",
    "محلول منظم pKa="+ka+" وpH="+ph+"؛ احسب [A−]/[HA].",
    ["0.1","10","100","1"],[1],"[A−]/[HA]=10^(pH−pKa)=10.");
  }
  if(subject==="biology"){
   if(type===0){const qval=[.2,.3,.4,.5][Math.floor(n/3)%4],het=2*qval*(1-qval)*100;
    return qGenerated(subject,kind,n,"Hardy–Weinberg",
     "Recessive allele frequency q="+qval.toFixed(1)+". Under Hardy–Weinberg, what is 2pq?",
     "إذا كان تواتر الأليل المتنحي q="+qval.toFixed(1)+"، فكم 2pq تحت هاردي–واينبرغ؟",
     [(het/2).toFixed(1)+"%",het.toFixed(1)+"%",(het+10).toFixed(1)+"%",(het+20).toFixed(1)+"%"],[1],
     "p=1−q="+(1-qval).toFixed(1)+"; 2pq="+het.toFixed(1)+"%.");
   }
   if(type===1){const ct=2+Math.floor(n/3)%8,fold=Math.pow(2,ct);
    return qGenerated(subject,kind,n,"Relative expression ΔΔCt",
     "Assuming ideal equal amplification efficiency, ΔΔCt=−"+ct+". What is relative fold change 2^(−ΔΔCt)?",
     "مع افتراض كفاءة تضخيم مثالية وΔΔCt=−"+ct+"، كم التغير النسبي 2^(−ΔΔCt)؟",
     [fold/2+"×",fold+"×",fold*2+"×",fold*3+"×"],[1],"2^"+ct+"="+fold+"-fold.");
   }
   const gen=2+Math.floor(n/3)%8,total=100*Math.pow(2,gen);
   return qGenerated(subject,kind,n,"Microbial generations",
    "A bacteria population starts at 100 and undergoes "+gen+" perfect doublings. What is its final size?",
    "مجموعة بكتيريا تبدأ بـ100 خلية وتتضاعف "+gen+" مرات مثالية. كم العدد النهائي؟",
    [total/2+"",total+"",total*2+"",total*3+""],[1],"N=100×2^"+gen+"="+total+".");
  }
  if(type===0){const exposed=20+(Math.floor(n/3)%8)*5,risk=10,rr=exposed/risk;
   return qGenerated(subject,kind,n,"Risk ratio",
    "Exposed disease risk is "+exposed+"%, unexposed risk is 10%. Calculate risk ratio (RR).",
    "خطر المرض لدى المعرضين "+exposed+"% وغير المعرضين 10%. احسب RR.",
    [(rr/2).toFixed(1),rr.toFixed(1),(rr*2).toFixed(1),(rr*3).toFixed(1)],[1],
    "RR="+exposed+"/10="+rr.toFixed(1)+". Association is not proof of causation.");
  }
  if(type===1){const h=2+Math.floor(n/3)%8,left=Math.pow(.5,h),ans=Math.round(left*1000)/10;
   return qGenerated(subject,kind,n,"Pharmacokinetics",
    "After "+h+" elimination half-lives, approximately what percent of a first-order drug remains?",
    "بعد "+h+" أنصاف عمر للتخلص من دواء ذي حركية مرتبة أولى، كم النسبة المئوية المتبقية؟",
    [(ans/2).toFixed(2)+"%",ans.toFixed(2)+"%",(ans*2).toFixed(2)+"%",(ans+17).toFixed(2)+"%"],[1],
    "Remaining=100×(1/2)^"+h+" = "+ans.toFixed(2)+"%.");
  }
  const r0=2+Math.floor(n/3)%9,ans=(100*(1-1/r0)).toFixed(1);
  return qGenerated(subject,kind,n,"Population models",
   "Under ideal homogeneous mixing with R₀="+r0+", what is the theoretical 1−1/R₀ threshold?",
   "وفق اختلاط متجانس مثالي وR₀="+r0+"، ما قيمة 1−1/R₀ النظرية؟",
   [(Number(ans)-10).toFixed(1)+"%",ans+"%",(Number(ans)+10).toFixed(1)+"%","100%"],[1],
   "Simplified homogeneous model gives "+ans+"%. Not a guaranteed real-world threshold.");
 }
 if(subject==="chemistry"){
  const v=2+n%9;
  return qGenerated(subject,kind,n,"Stoichiometric balance",
   "For "+v+" mol O₂ reacting with excess H₂ (2H₂+O₂→2H₂O), select ALL correct results.",
   "عند تفاعل "+v+" مول O₂ مع فائض H₂، اختر جميع النتائج الصحيحة.",
   [2*v+" mol H₂ used",2*v+" mol H₂O produced",36*v+" g H₂O produced",v+" mol H₂ used"],[0,1,2],
   "Balance 2:1:2 gives "+2*v+" mol H₂ and water; water mass="+36*v+" g.");
 }
 if(subject==="biology"){
  const x=[.2,.3,.4,.5][n%4],p=1-x,het=2*x*p*100;
  return qGenerated(subject,kind,n,"Hardy–Weinberg assumptions",
   "With q="+x.toFixed(1)+" in an ideal Hardy–Weinberg population, select ALL mathematically correct statements.",
   "مع q="+x.toFixed(1)+" في نموذج هاردي–واينبرغ مثالي، اختر الاستنتاجات الحسابية الصحيحة.",
   ["p="+p.toFixed(1),"q²="+(x*x).toFixed(2),"2pq="+het.toFixed(1)+"%","Every individual is heterozygous"],[0,1,2],
   "p=1−q="+p.toFixed(1)+", q²="+(x*x).toFixed(2)+", 2pq="+het.toFixed(1)+"%.");
 }
 const tp=10+(n%9)*5,non=1000-tp,fp=(non*.1),positive=(tp*.9)+fp,ppv=100*tp*.9/positive;
 return qGenerated(subject,kind,n,"Screening statistics",
  "In 1,000 persons, "+tp+" have a condition. A test is 90% sensitive and 90% specific. Select ALL correct conclusions.",
  "في 1000 شخص، المصابون "+tp+"، والحساسية والنوعية 90%. اختر الاستنتاجات الصحيحة.",
  ["Expected true positives ≈ "+(tp*.9).toFixed(1),"Expected false positives ≈ "+fp.toFixed(1),
   "PPV ≈ "+ppv.toFixed(1)+"%","PPV equals sensitivity for all prevalences"],[0,1,2],
  "TP="+(tp*.9).toFixed(1)+", FP="+fp.toFixed(1)+", PPV="+ppv.toFixed(1)+"%. Counts here are expected values.");
}
function qGenerated(subject,kind,n,topic,en,ar,opts,keys,why){
 const options=[...opts].map(String);if(new Set(options).size!==options.length)throw Error("DUPLICATE_GENERATED_OPTIONS_"+subject+"_"+kind+"_"+n);
 const result=Object.freeze({id:"nabd-ma-generated-"+subject+"-"+kind+"-"+n,subject,kind,topic,
 prompt_en:en,prompt_ar:ar,options:Object.freeze(options),options_ar:Object.freeze(options),
 correct:Object.freeze(keys),explanation_en:why,explanation_ar:"",origin:"NABD_MASTERS_GENERATED",
 points:kind==="single"?1:3,source:SUBJECTS[subject].page});
 return result;
}
function gradeChoice(question,selected){
 if(!question||!Array.isArray(question.correct)||!["single","multi"].includes(question.kind))throw Error("INVALID_QUESTION");
 const ans=[...new Set((selected||[]).map(Number))].sort((a,b)=>a-b),correct=[...question.correct].sort((a,b)=>a-b);
 const falseChoices=ans.filter(x=>!correct.includes(x)),hit=ans.filter(x=>correct.includes(x));
 const exact=!falseChoices.length&&ans.length===correct.length;
 const score=question.kind==="single"?(exact?1:0):
 !ans.length||falseChoices.length?0:exact?3:Math.floor(3*hit.length/correct.length);
 return {score,max:question.kind==="single"?1:3,correct,selected:ans,missed:correct.filter(x=>!ans.includes(x)),wrong:falseChoices,exact};
}
function subjectItems(subject,kind){
 const list={single:singles,multi:multis,written:essays,oral:orals}[kind]||[];
 return list.filter(x=>x.subject===subject);
}
function exam(subject,seed=Date.now()){
 if(!SUBJECTS[subject])throw Error("INVALID_MASTER_SUBJECT");
 const rnd=mulberry32(Math.abs(Math.trunc(seed)));
 function shuffle(a){const v=[...a];for(let i=v.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[v[i],v[j]]=[v[j],v[i]]}return v}
 function fill(kind,n){
  let picked=shuffle(subjectItems(subject,kind));
  if(kind==="single"||kind==="multi"){
   let i=0;
   while(picked.length<n){
    const generatedSeed=Math.trunc(seed)%100000+i*17+71;
    const candidate=generated(subject,kind,Math.abs(generatedSeed));
    if(!picked.some(x=>x.id===candidate.id))picked.push(candidate);
    i++;if(i>n*10)throw Error("GENERATION_EXHAUSTED");
   }
  }
  return shuffle(picked).slice(0,n);
 }
 return {subject,seed,questions:[...fill("single",25),...fill("multi",15),...fill("written",3)],oralChoices:fill("oral",3),
 duration_written_sec:175*60,duration_oral_sec:5*60,
 structure:"25 basic singles + 15 intermediate multiples + 3 advanced written + 1 oral (chosen from 3); independent NABD simulation",
 max_written:25+45+30,max_oral:5,max_total:105};
}
function mulberry32(seed){let a=seed>>>0;return function(){a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
const all=[...singles,...multis,...essays,...orals];if(new Set(all.map(x=>x.id)).size!==all.length)throw Error("DUPLICATE_MASTER_ID");
root.NabdOpenDoorsMasters=Object.freeze({SUBJECTS,questions:Object.freeze(all),single:Object.freeze(singles),
 multi:Object.freeze(multis),written:Object.freeze(essays),oral:Object.freeze(orals),
 subjectItems,generated,gradeChoice,exam,RUBRIC,version:"2026.11.15-masters-v1"});
})(typeof globalThis!=="undefined"?globalThis:this);
