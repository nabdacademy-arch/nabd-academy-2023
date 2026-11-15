/* NABD Open Doors MCQ Lab — original independent practice, not official exam questions.
   Program structure and official sample PDFs linked via subject pages. */
(function(root){
"use strict";
const SOURCES=Object.freeze({
 chemistry:Object.freeze({title:"Chemistry and Materials Science",ar:"الكيمياء",url:"https://od.globaluni.ru/subject/52/b",sample:"https://od.globaluni.ru/attachment/1978020/download"}),
 biology:Object.freeze({title:"Biology and Biotechnology",ar:"الأحياء",url:"https://od.globaluni.ru/subject/45/b",sample:"https://od.globaluni.ru/attachment/4096897/download"}),
 medicine:Object.freeze({title:"Clinical Medicine and Public Health",ar:"الطب البشري",url:"https://od.globaluni.ru/subject/55/b",sample:"https://od.globaluni.ru/attachment/4096977/download"})
});
function make(subject,kind,id,topic,en,ar,optionsEn,optionsAr,correct,enExplanation,arExplanation,whyEn=[],whyAr=[]){
 if(!["chemistry","biology","medicine"].includes(subject)||!["single","multi"].includes(kind)||
 optionsEn.length!==4||optionsAr.length!==4||!correct.length||new Set(correct).size!==correct.length||
 correct.some(n=>n<0||n>=4)||(kind==="single"&&correct.length!==1))throw Error("INVALID_AUTHORED_QUESTION");
 return Object.freeze({id:"nabd-choice-"+id,subject,kind,topic,question:en,question_ar:ar,
  options:Object.freeze([...optionsEn]),options_ar:Object.freeze([...optionsAr]),correct:Object.freeze([...correct]),
  explanation_en:enExplanation,explanation_ar:arExplanation,
  optionWhyEn:Object.freeze([...whyEn]),optionWhyAr:Object.freeze([...whyAr]),
  origin:"NABD_ORIGINAL",source:SOURCES[subject].url,points:kind==="single"?1:3});
}
const Q=[
make("chemistry","single","ch-s1","Atomic structure","What is the oxidation state of Mn in KMnO₄?","ما عدد أكسدة Mn في KMnO₄؟",
 ["+2","+4","+7","−1"],["+2","+4","+7","−1"],[2],
 "K is +1 and each O is −2. Charge balance gives +1+x−8=0, so Mn is +7.","البوتاسيوم +1 وكل أكسجين −2؛ إذن +1+x−8=0 وبالتالي عدد أكسدة المنغنيز +7."),
make("chemistry","single","ch-s2","Acid–base buffers","When [acetate] equals [acetic acid] in an ideal buffer with pKa=4.76, what is its approximate pH?","عندما يتساوى تركيز الأسيتات وحمض الأسيتيك في محلول منظم مثالي له pKa=4.76، فما pH تقريبًا؟",
 ["2.38","4.76","7.00","9.52"],["2.38","4.76","7.00","9.52"],[1],
 "Henderson–Hasselbalch: pH=pKa+log([base]/[acid]); log(1)=0, therefore pH=4.76.","باستخدام هندرسون–هاسلبالخ: pH=pKa+log([القاعدة]/[الحمض])، والنسبة=1 فلوغاريتمها صفر، لذا pH=4.76."),
make("chemistry","single","ch-s3","Chemical equilibrium","For the exothermic reaction N₂+3H₂ ⇌ 2NH₃, which change tends to increase ammonia equilibrium yield?","لتفاعل تكوين الأمونيا الطارد للحرارة N₂+3H₂⇌2NH₃، أي تغيير يزيد نسبة الأمونيا عند الاتزان؟",
 ["Increase temperature","Decrease pressure","Increase pressure","Add a catalyst only"],
 ["رفع درجة الحرارة","خفض الضغط","رفع الضغط","إضافة محفز فقط"],[2],
 "The product side contains fewer gas moles (2 versus 4); increasing pressure favors NH₃. A catalyst affects rate but not equilibrium position.","النواتج 2 مول غاز مقابل 4 في المتفاعلات؛ لذلك زيادة الضغط ترجح تكوين NH₃. المحفز يزيد السرعة دون تغيير موضع الاتزان."),
make("chemistry","single","ch-s4","Stoichiometry","Excess H₂ reacts with 16 g of O₂. What mass of water can form? (2H₂+O₂→2H₂O, O₂=32 g/mol, H₂O=18 g/mol)","يتفاعل هيدروجين فائض مع 16 غ O₂. ما كتلة الماء الناتجة؟ (الكتلة المولية O₂=32، وH₂O=18 غ/مول)",
 ["9 g","18 g","27 g","36 g"],["9 غ","18 غ","27 غ","36 غ"],[1],
 "16/32=0.5 mol O₂, producing 2×0.5=1.0 mol H₂O. Mass=1×18=18 g.","مولات O₂=16/32=0.5، وتنتج 1.0 مول ماء؛ الكتلة 1×18=18 غ."),
make("chemistry","multi","ch-m1","Equilibrium factors","For exothermic Haber ammonia synthesis, which changes can favor greater NH₃ equilibrium yield? Select all correct.","في عملية هابر الطاردة للحرارة، ما التغييرات التي قد تزيد نسبة NH₃ عند الاتزان؟ اختر كل الصحيح.",
 ["Higher pressure","Lower temperature","Remove NH₃ as it forms","Add a catalyst without other changes"],
 ["زيادة الضغط","خفض درجة الحرارة","إزالة NH₃ عند تكوّنه","إضافة محفز دون تغيير آخر"],[0,1,2],
 "Higher pressure favors fewer gas molecules, lower temperature favors the exothermic direction, and removing NH₃ drives the reaction forward. A catalyst changes rate only.","زيادة الضغط ترجّح عدد مولات الغاز الأقل، وانخفاض الحرارة يرجّح الاتجاه الطارد، وسحب الأمونيا يدفع التفاعل للأمام. المحفز يؤثر في السرعة فقط."),
make("chemistry","multi","ch-m2","Redox reactions","Consider MnO₄⁻ reacting with Fe²⁺ in acid. Which statements are correct?","عند تفاعل MnO₄⁻ مع Fe²⁺ في وسط حمضي، ما العبارات الصحيحة؟",
 ["Fe²⁺ is oxidized to Fe³⁺","MnO₄⁻ is reduced to Mn²⁺","Electrons pass from Fe²⁺ to the oxidant","Fe²⁺ gains electrons"],
 ["يتأكسد Fe²⁺ إلى Fe³⁺","تختزل MnO₄⁻ إلى Mn²⁺","تنتقل الإلكترونات من Fe²⁺ إلى المؤكسد","يكتسب Fe²⁺ إلكترونات"],[0,1,2],
 "Fe²⁺ loses an electron (oxidation). Permanganate accepts electrons (reduction) in acid; Fe²⁺ does not gain electrons.","يفقد Fe²⁺ إلكترونًا فيتأكسد، وتكتسب البرمنغنات الإلكترونات فتختزل. عبارة اكتساب Fe²⁺ للإلكترونات خاطئة."),
make("chemistry","multi","ch-m3","Precipitation tests","AgNO₃ is added to a chloride-containing solution. Which conclusions are justified?","أضيف AgNO₃ إلى محلول يحوي كلوريدًا. ما النتائج العلمية الصحيحة؟",
 ["AgCl can form a white precipitate","Ag⁺+Cl⁻→AgCl(s) is the net ionic equation","The test alone identifies the original metal cation","Other interfering ions may require control tests"],
 ["قد يتشكل راسب AgCl أبيض","المعادلة الصافية Ag⁺+Cl⁻→AgCl(s)","يكشف هذا الاختبار وحده كاتيون الملح الأصلي","قد تستلزم الأيونات المتداخلة اختبارات ضابطة"],[0,1,3],
 "A silver chloride precipitate supports the presence of chloride with appropriate controls but does not identify the original cation.","الراسب الأبيض يدعم وجود الكلوريد مع ضوابط مناسبة، لكنه لا يحدد نوع الكاتيون الأصلي."),
make("chemistry","multi","ch-m4","Reaction kinetics","For a typical homogeneous reaction, which may change reaction rate without necessarily changing equilibrium constant?","لتفاعل متجانس نموذجي، أي العوامل قد تؤثر في السرعة دون أن تغيّر ثابت الاتزان بالضرورة؟",
 ["Reactant concentration","Catalyst","Reactant pressure for gases","Adding a catalyst always raises equilibrium yield"],
 ["تركيز المواد المتفاعلة","المحفز","ضغط المواد المتفاعلة الغازية","إضافة محفز ترفع دائمًا مردود الاتزان"],[0,1,2],
 "Concentration, effective gas pressure and catalysts can affect reaction kinetics. Catalysts do not shift the equilibrium constant or final equilibrium composition.","يمكن للتركيز والضغط في الغازات والمحفز التأثير في سرعة التفاعل. المحفز لا يغيّر ثابت الاتزان أو مردود الاتزان النهائي."),
make("biology","single","bi-s1","Molecular biology","Where does transcription of nuclear protein-coding genes primarily occur in a eukaryotic cell?","أين تحدث عملية نسخ جينات الترميز البروتيني النووية أساسًا في الخلية حقيقية النواة؟",
 ["Nucleus","Ribosome","Golgi apparatus","Lysosome"],["النواة","الريبوسوم","جهاز غولجي","الليسوسوم"],[0],
 "RNA polymerase transcribes nuclear genes to RNA in the nucleus. Translation occurs on ribosomes.","ينسخ إنزيم RNA polymerase الجينات النووية إلى RNA داخل النواة؛ الترجمة تحدث على الريبوسومات."),
make("biology","single","bi-s2","Cell division","What separates during anaphase I of meiosis?","ما الذي ينفصل خلال الطور الانفصالي الأول من الانقسام المنصف؟",
 ["Sister chromatids","Homologous chromosomes","Nuclear pores","DNA strands"],
 ["الكروماتيدات الشقيقة","الكروموسومات المتماثلة","مسام النواة","سلاسل DNA"],[1],
 "Meiosis I separates homologous chromosomes; sister chromatids separate in meiosis II.","في الانقسام المنصف الأول تنفصل الكروموسومات المتماثلة، أما الكروماتيدات الشقيقة ففي الانقسام الثاني."),
make("biology","single","bi-s3","Cellular respiration","In a eukaryotic cell, glycolysis predominantly takes place in the:","أين يحدث تحلل الجلوكوز (Glycolysis) أساسًا في الخلية حقيقية النواة؟",
 ["Mitochondrial matrix","Cytosol","Nucleus","Lysosome"],
 ["مصفوفة الميتوكوندريا","السيتوسول","النواة","الليسوسوم"],[1],
 "Glycolytic enzymes are primarily cytosolic; pyruvate may subsequently enter mitochondria for further oxidation.","إنزيمات التحلل السكري موجودة غالبًا في السيتوسول، وقد يدخل البيروفات لاحقًا إلى الميتوكوندريا."),
make("biology","single","bi-s4","DNA replication","What is meant by semiconservative DNA replication?","ما المقصود بتضاعف DNA شبه المحافظ؟",
 ["Each daughter molecule has one old and one newly made strand","Both strands are fully new in one molecule","DNA uses ribose instead of deoxyribose","Chromosomes do not duplicate"],
 ["كل جزيء جديد يحوي سلسلة قديمة وسلسلة جديدة","السلسلتان جديدتان بالكامل في جزيء واحد","يستخدم DNA الريبوز بدل الديوكسي ريبوز","لا تتضاعف الكروموسومات"],[0],
 "Each daughter duplex conserves one original parental strand and synthesizes one complementary new strand.","يحتفظ كل DNA ناتج بإحدى سلسلتي الجزيء الأبوي ويكوّن سلسلة مكملة جديدة."),
make("biology","multi","bi-m1","PCR","Which components are normally necessary for standard DNA PCR amplification?","ما المكونات اللازمة عادةً لتضخيم DNA بتفاعل PCR التقليدي؟",
 ["Template DNA","Two sequence-specific primers","Thermostable DNA polymerase","Intact living nucleus"],
 ["قالب DNA","بادئان نوعيان للتسلسل","بوليميراز DNA ثابت حراريًا","نواة حية سليمة"],[0,1,2],
 "PCR typically uses template, primers, heat-stable polymerase and dNTPs/buffer; no intact nucleus is required.","يتطلب PCR قالبًا وبوادئ وبوليميراز مقاومًا للحرارة وdNTPs ووسطًا مناسبًا؛ لا يحتاج نواة حية."),
make("biology","multi","bi-m2","Mitochondria","Which statements about mitochondrial oxidative phosphorylation are correct?","أي العبارات التالية صحيحة حول الفسفرة التأكسدية في الميتوكوندريا؟",
 ["Electron transport builds a proton gradient","ATP synthase harnesses the proton gradient","O₂ is the final electron acceptor in aerobic respiration","Glycolysis occurs inside the mitochondrial inner membrane"],
 ["تنشئ سلسلة الإلكترونات تدرج بروتونات","يستخدم ATP synthase تدرج البروتونات","الأكسجين هو المستقبل النهائي للإلكترونات هوائيًا","يحدث تحلل الجلوكوز داخل الغشاء الداخلي للميتوكوندريا"],[0,1,2],
 "Electron transport and proton pumping establish electrochemical potential; ATP synthase uses it; oxygen accepts electrons. Glycolysis is cytosolic.","تضخ السلسلة البروتونات لتنشأ قوة دافعة يستثمرها ATP synthase؛ والأكسجين مستقبل نهائي. التحلل السكري في السيتوسول."),
make("biology","multi","bi-m3","Evolution","Which mechanisms contribute to changes in allele frequencies in populations?","أي العمليات تساهم في تغير تواتر الأليلات لدى الجماعات؟",
 ["Natural selection","Genetic drift","Migration/gene flow","DNA replication alone always changes allele frequencies"],
 ["الانتخاب الطبيعي","الانجراف الجيني","الهجرة وتدفق الجينات","تضاعف DNA وحده يغير دائمًا تواتر الأليلات"],[0,1,2],
 "Selection, drift and gene flow can alter allele frequencies. Ordinary faithful DNA replication alone does not necessarily shift population allele frequencies.","الانتخاب والانجراف وتدفق الجينات تغير تواتر الأليلات، أما تضاعف DNA الطبيعي وحده فلا يغير بالضرورة تواترها على مستوى الجماعة."),
make("biology","multi","bi-m4","Immune memory","Which belong to adaptive immunological memory or specificity?","ما المكونات التي ترتبط بذاكرة المناعة التكيفية أو نوعيتها؟",
 ["Memory B cells","Memory T cells","Antigen-specific antibody responses","Unbroken skin as the sole adaptive memory mechanism"],
 ["خلايا B الذاكرية","خلايا T الذاكرية","استجابات الأجسام المضادة النوعية","الجلد السليم وحده آلية الذاكرة التكيفية"],[0,1,2],
 "Antigen-specific B and T responses form adaptive memory. The skin barrier belongs to innate protection.","الخلايا B وT النوعية تساهم في الذاكرة التكيفية؛ الجلد حاجز مناعي فطري."),
make("medicine","single","md-s1","Cardiovascular physiology","A healthy person's arterial pressure briefly falls during a physiology experiment. Which rapid response is most likely?","انخفض الضغط الشرياني مؤقتًا في تجربة فسيولوجية لشخص سليم. ما الاستجابة السريعة الأكثر احتمالًا؟",
 ["Increased baroreceptor firing","Increased sympathetic heart-rate drive","Reduced sympathetic activity","Immediate aldosterone depletion"],
 ["زيادة إطلاق مستقبلات الضغط","زيادة التنبيه الودي لرفع النبض","انخفاض النشاط الودي","نضوب الألدوستيرون فورًا"],[1],
 "Reduced arterial stretch lowers baroreceptor firing and increases sympathetic tone, commonly causing a faster heart rate.","يقل تنبيه مستقبلات الضغط بسبب نقص التمدد، ويزداد النشاط الودي فيرتفع النبض عادةً."),
make("medicine","single","md-s2","Renal physiology","Which hormone directly promotes collecting-duct water permeability via V₂ receptors and aquaporin-2?","أي هرمون يزيد نفاذية الماء في القنوات الجامعة عبر مستقبلات V₂ وقنوات aquaporin-2؟",
 ["Insulin","ADH/vasopressin","Glucagon","Calcitonin"],
 ["الإنسولين","ADH/فازوبرسين","الغلوكاغون","الكالسيتونين"],[1],
 "Vasopressin (ADH) acts at V₂ receptors on principal cells and increases apical aquaporin-2 insertion.","يرتبط الفازوبرسين (ADH) بمستقبلات V₂ ويحفز إدخال aquaporin-2 في الغشاء القِمي للخلايا الرئيسية."),
make("medicine","single","md-s3","Heart anatomy","Which chamber directly pumps oxygenated blood into the aorta?","أي حجرة قلبية تضخ الدم المؤكسج مباشرة إلى الشريان الأبهر؟",
 ["Right atrium","Right ventricle","Left atrium","Left ventricle"],
 ["الأذين الأيمن","البطين الأيمن","الأذين الأيسر","البطين الأيسر"],[3],
 "The left ventricle ejects blood through the aortic valve into the systemic circulation.","يضخ البطين الأيسر الدم عبر الصمام الأبهري إلى الدورة الدموية الجهازية."),
make("medicine","single","md-s4","Epidemiology","In 1,000 people, 10 have a condition. A test has 90% sensitivity and 90% specificity. What is PPV approximately?","في 1000 شخص منهم 10 مصابين، اختبار بحساسية ونوعية 90%. كم القيمة التنبؤية الإيجابية PPV تقريبًا؟",
 ["8.3%","50%","90%","99%"],["8.3%","50%","90%","99%"],[0],
 "True positives=9; false positives=99 from 990 noncases. PPV=9/(9+99)=8.33%.","الإيجابيات الحقيقية 9، والكاذبة 99 من 990 غير مصاب؛ PPV=9/(9+99)=8.33%."),
make("medicine","multi","md-m1","ADH and kidneys","When ADH levels rise, which physiological effects may occur?","عند ارتفاع ADH، ما التغيرات الفسيولوجية التي قد تحدث؟",
 ["More aquaporin-2 channels in collecting-duct apical membranes","Greater collecting-duct water reabsorption","Typically lower urine volume","Guaranteed more dilute urine"],
 ["زيادة قنوات aquaporin-2 في الغشاء القِمي للقناة الجامعة","زيادة إعادة امتصاص الماء","انخفاض حجم البول عادةً","بول أكثر تخفيفًا بالضرورة"],[0,1,2],
 "ADH usually increases collecting-duct permeability and water retention, producing less, more concentrated urine. It does not guarantee dilution.","يرفع ADH نفاذية القناة الجامعة للماء فتزداد إعادة امتصاصه ويقل حجم البول ويتزايد تركيزه غالبًا."),
make("medicine","multi","md-m2","Inflammation","Which are typical components of an acute inflammatory response?","أي التغيرات التالية تمثل مكونات شائعة للاستجابة الالتهابية الحادة؟",
 ["Local vasodilation","Increased vascular permeability","Recruitment of leukocytes","Inflammation always proves a bacterial infection"],
 ["توسع الأوعية موضعيًا","زيادة نفاذية الأوعية","استدعاء كريات الدم البيضاء","الالتهاب دليل قاطع دائمًا على عدوى بكتيرية"],[0,1,2],
 "Acute inflammation often involves vasodilation, leak of plasma components, and immune-cell recruitment; it may be sterile, viral or bacterial.","قد يشمل الالتهاب توسع الأوعية ونفاذيتها واستدعاء الخلايا المناعية، وقد ينجم عن أسباب غير بكتيرية."),
make("medicine","multi","md-m3","Oxygen delivery","Which variables influence systemic oxygen delivery (DO₂) in a simplified model?","أي المتغيرات تؤثر في توصيل الأكسجين إلى أنسجة الجسم (DO₂) في نموذج مبسط؟",
 ["Cardiac output","Hemoglobin concentration","Hemoglobin oxygen saturation","Arterial PaO₂ by itself completely determines oxygen delivery"],
 ["النتاج القلبي","تركيز الهيموغلوبين","تشبع الهيموغلوبين بالأكسجين","ضغط الأكسجين الشرياني وحده يحدد التوصيل كليًا"],[0,1,2],
 "DO₂ ≈ cardiac output × arterial O₂ content; hemoglobin and saturation dominate content. PaO₂ contributes but does not alone determine delivery.","DO₂≈النتاج القلبي×محتوى الأكسجين الشرياني؛ ويتأثر المحتوى بقوة بالهيموغلوبين وتشبع الأكسجين، وليس PaO₂ وحده."),
make("medicine","multi","md-m4","Research methods","Which cautions are appropriate when interpreting an observational health study?","ما الاحتياطات المناسبة عند تفسير دراسة صحية رصدية؟",
 ["Potential confounding","Possible selection bias","Association does not by itself prove causation","All observational studies automatically randomize treatment"],
 ["احتمال وجود عوامل مربكة","احتمال انحياز الاختيار","الارتباط لا يثبت السببية وحده","كل الدراسات الرصدية تعشّئ العلاج تلقائيًا"],[0,1,2],
 "Observational studies can show associations while remaining vulnerable to confounding and bias; random assignment is not inherent to observational designs.","قد تكشف الدراسات الرصدية ارتباطات لكنها معرضة للإرباك والانحياز؛ التوزيع العشوائي ليس صفة ملازمة لها.")
];
function generated(subject,kind,seed){
 const n=Math.abs(Math.trunc(Number(seed)||0));
 if(kind==="single"&&subject==="chemistry"){
  const moles=1+n%8,mass=moles*36;
  return make(subject,kind,"gen-ch-s-"+n,"Stoichiometry / generated",
   "For "+moles+" mol O₂ reacting with excess H₂ (2H₂ + O₂ → 2H₂O), what water mass forms? M(H₂O)=18 g/mol.",
   "عند تفاعل "+moles+" مول O₂ مع فائض H₂ (2H₂+O₂→2H₂O)، ما كتلة الماء الناتج؟ M(H₂O)=18 غ/مول.",
   [mass/2+" g",mass+" g",mass*2+" g",(mass+18)+" g"],
   [mass/2+" غ",mass+" غ",mass*2+" غ",(mass+18)+" غ"],[1],
   "The mole ratio is 1 mol O₂ to 2 mol water. "+moles+"×2×18="+mass+" g.",
   "نسبة المولات 1:2 بين O₂ والماء، ومن ثم الكتلة = "+moles+"×2×18="+mass+" غ.");
 }
 if(kind==="single"&&subject==="biology"){
  const fraction=[0.09,0.16,0.25,0.36][n%4],q=Math.sqrt(fraction),het=Math.round(2*q*(1-q)*100);
  const opts=[het-9,het,het+9,het+17].map(x=>x+"%");
  return make(subject,kind,"gen-bi-s-"+n,"Hardy–Weinberg / generated",
   "In an ideal Hardy–Weinberg population, recessive phenotype frequency q²="+Math.round(fraction*100)+"%. Approximate the heterozygote frequency (2pq).",
   "في جماعة مثالية تخضع لهاردي–واينبرغ، تكرار الصفة المتنحية q²="+Math.round(fraction*100)+"%، ما النسبة التقريبية لمتغايري الزيجوت 2pq؟",
   opts,opts,[1],
   "q="+q.toFixed(2)+", p="+(1-q).toFixed(2)+", 2pq≈"+het+"%.",
   "q="+q.toFixed(2)+" وp="+(1-q).toFixed(2)+"، إذن 2pq≈"+het+"%.");
 }
 if(kind==="single"&&subject==="medicine"){
  const total=1000,affected=[20,40,60,80][n%4],sens=.8,spec=.9;
  const tp=affected*sens,fp=(total-affected)*(1-spec),ppv=Math.round(1000*tp/(tp+fp))/10;
  const options=[Math.max(1,ppv-5).toFixed(1)+"%",ppv.toFixed(1)+"%",(ppv+10).toFixed(1)+"%","80.0%"];
  return make(subject,kind,"gen-md-s-"+n,"Predictive values / generated",
   "Out of 1,000 people, "+affected+" have a condition. A test is 80% sensitive and 90% specific. What is the positive predictive value (PPV) approximately?",
   "من 1000 شخص هناك "+affected+" مصابين، وحساسية الاختبار 80% ونوعيته 90%. كم PPV تقريبًا؟",options,options,[1],
   "TP="+tp+", FP="+Math.round(fp)+", PPV=TP/(TP+FP)≈"+ppv.toFixed(1)+"%.",
   "الإيجابيات الحقيقية "+tp+" والكاذبة "+Math.round(fp)+"؛ PPV≈"+ppv.toFixed(1)+"%.");
 }
 if(kind==="multi"&&subject==="chemistry"){
  const m=2+n%7;
  return make(subject,kind,"gen-ch-m-"+n,"Stoichiometry / generated",
   "For "+m+" mol O₂ with excess H₂ (2H₂+O₂→2H₂O), select all correct calculations.",
   "عند تفاعل "+m+" مول O₂ مع فائض H₂، اختر كل الحسابات الصحيحة.",
   [(2*m)+" mol H₂ consumed",(2*m)+" mol H₂O formed",(36*m)+" g H₂O formed",m+" mol H₂ consumed"],
   [(2*m)+" مول H₂ مستهلك",(2*m)+" مول H₂O ناتج",(36*m)+" غ ماء",m+" مول H₂ مستهلك"],[0,1,2],
   "Ratios H₂:O₂:H₂O=2:1:2. Thus H₂ and water are 2×"+m+" mol each and water mass "+(36*m)+" g.",
   "النسبة H₂:O₂:H₂O=2:1:2، ولذلك المولات "+(2*m)+" لكل من H₂ والماء وكتلة الماء "+(36*m)+" غ.");
 }
 if(kind==="multi"&&subject==="biology"){
  const r=[9,16,25,36][n%4],q=Math.sqrt(r/100),p=1-q;
  return make(subject,kind,"gen-bi-m-"+n,"Hardy–Weinberg / generated",
   "Under Hardy–Weinberg assumptions, q²="+r+"%. Select all statements that follow from this model.",
   "وفق افتراضات هاردي–واينبرغ q²="+r+"%. اختر كل الاستنتاجات الصحيحة.",
   ["Recessive allele q="+q.toFixed(2),"Dominant allele p="+p.toFixed(2),"Heterozygotes 2pq≈"+(2*q*p*100).toFixed(1)+"%","Every individual is heterozygous"],
   ["تواتر الأليل المتنحي q="+q.toFixed(2),"تواتر الأليل السائد p="+p.toFixed(2),"نسبة متغايري الزيجوت 2pq≈"+(2*q*p*100).toFixed(1)+"%","كل الأفراد متغايرو الزيجوت"],[0,1,2],
   "q=sqrt(q²) and p=1−q; heterozygote proportion is 2pq. The genotype proportions cannot all be heterozygous here.",
   "نحسب q بأخذ الجذر وp=1−q، وتواتر متغايري الزيجوت 2pq، ولا يمكن أن يكون كل الأفراد كذلك في هذه الحالة.");
 }
 const r0=2+n%7,threshold=((1-1/r0)*100).toFixed(1);
 return make(subject,kind,"gen-md-m-"+n,"Epidemiology / generated",
  "In a simplified homogeneous infection model R₀="+r0+", select all valid statements about the theoretical threshold.",
  "في نموذج عدوى متجانس مبسط R₀="+r0+"، اختر كل العبارات الصحيحة عن العتبة النظرية.",
  ["Threshold 1−1/R₀ = "+threshold+"%","The formula assumes homogeneous mixing","Immunity and contact patterns can shift real-world results","The threshold exactly guarantees eradication in every population"],
  ["العتبة 1−1/R₀ = "+threshold+"%","تتطلب المعادلة اختلاطًا متجانسًا","تتغير النتائج الواقعية باختلاف المناعة والمخالطة","تضمن العتبة استئصال العدوى في كل مجتمع"],[0,1,2],
  "The threshold is "+threshold+"% in a simplified homogeneous model. Real heterogeneous mixing and imperfect immunity limit direct use.",
  "العتبة "+threshold+"% في النموذج المبسط، لكن تختلف النتائج الفعلية بسبب تباين الاختلاط والمناعة.");
}
function sample(kind,subject="all"){
 return Q.filter(q=>q.kind===kind&&(subject==="all"||q.subject===subject));
}
/* Source-marked DB questions should never be upgraded to 'official' solely from a source_note link. */
function normalizeDatabase(q){
 if(!q||!["single","multi"].includes(q.kind)||!SOURCES[q.subject]||
 !Array.isArray(q.options)||q.options.length<2||q.options.length>8||!Array.isArray(q.answers))return null;
 const answers=q.answers.map(x=>typeof x==="string"?x.trim().toUpperCase():x);
 const letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
 const correct=answers.map(x=>typeof x==="number"?x:letters.indexOf(x)).filter(x=>Number.isInteger(x)&&x>=0&&x<q.options.length);
 if(!correct.length||new Set(correct).size!==correct.length||(q.kind==="single"&&correct.length!==1))return null;
 return Object.freeze({id:"db-"+String(q.id||""),dbId:String(q.id||""),subject:q.subject,kind:q.kind,
  topic:String(q.topic||"Course knowledge"),difficulty:String(q.difficulty||""),
  question:String(q.question||""),question_ar:"",options:[...q.options],options_ar:[],correct,
  explanation_en:/[\u0600-\u06FF]/.test(q.explanation||"")?"":String(q.explanation||""),
  explanation_ar:/[\u0600-\u06FF]/.test(q.explanation||"")?String(q.explanation||""):"",
  originalExplanation:String(q.explanation||""),source:SOURCES[q.subject].url,
  origin:"NABD_EXISTING_DATABASE",points:q.kind==="single"?1:3});
}
function grade(question,selected){
 if(!question||!Array.isArray(selected))throw Error("INVALID_ANSWER");
 const got=[...new Set(selected.map(Number))].sort((a,b)=>a-b),expected=[...question.correct].sort((a,b)=>a-b);
 const exact=got.length===expected.length&&got.every((x,i)=>x===expected[i]);
 const incorrect=got.filter(x=>!expected.includes(x));
 let score=0;
 if(question.kind==="single")score=exact?1:0;
 else if(got.length&&!incorrect.length){
  // Published as an INDEPENDENT training rubric, never claimed to be the official grading rule.
  score=exact?3:Math.floor(3*got.length/expected.length);
 }
 return {exact,score,max:question.kind==="single"?1:3,correct:expected,selected:got,
  missed:expected.filter(x=>!got.includes(x)),incorrect,
  disclaimer:"NABD training rule: multi-select partial credit only for correct-only subsets; any wrong option is 0. This is NOT the official Open Doors scoring algorithm."};
}
root.OpenDoorsChoiceBank=Object.freeze({version:"2026-11-15",SOURCES,QUESTIONS:Object.freeze(Q),sample,generated,normalizeDatabase,grade});
})(typeof globalThis!=="undefined"?globalThis:this);
