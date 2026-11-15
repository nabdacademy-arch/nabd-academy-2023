/* NABD Open Doors Essay Lab — original authored practice. No official exam questions copied.
 * Sources link to Open Doors Bachelor subject-program and published sample pages.
 * Every item has a worked model answer and four explicit marking criteria. */
(function(root){
"use strict";
const SOURCES={
 chemistry:{title:"Chemistry and Materials Science",ar:"الكيمياء وعلوم المواد",page:"https://od.globaluni.ru/subject/52/b",sample:"https://od.globaluni.ru/attachment/1978020/download"},
 biology:{title:"Biology and Biotechnology",ar:"الأحياء والتقنية الحيوية",page:"https://od.globaluni.ru/subject/45",sample:"https://od.globaluni.ru/attachment/4096897/download"},
 medicine:{title:"Clinical Medicine and Public Health",ar:"الطب البشري والصحة العامة",page:"https://od.globaluni.ru/subject/55",sample:"https://od.globaluni.ru/attachment/4096977/download"}
};
function item(subject,id,topic,en,ar,solutionEn,solutionAr,criteria){
 return Object.freeze({subject,id,topic,prompt_en:en,prompt_ar:ar,model_en:solutionEn,model_ar:solutionAr,
  rubric:criteria.map((s,i)=>Object.freeze({en:s[0],ar:s[1],points:[3,3,2,2][i]})),max_points:10,origin:"NABD_ORIGINAL",source:SOURCES[subject].page});
}
const C=[
 item("chemistry","ch01","Stoichiometry / الحسابات الكيميائية",
 "In an experiment 4.0 g H₂ reacts with 24.0 g O₂ to form water (2H₂ + O₂ → 2H₂O). Identify the limiting reagent, compute the theoretical mass of water and the mass of H₂ remaining. Explain each step; H=1, O=16.",
 "يتفاعل 4.0 غ من H₂ مع 24.0 غ من O₂ لإنتاج الماء. حدد المتفاعل المحدِّد واحسب كتلة الماء النظرية وكتلة الهيدروجين المتبقية، مع خطوات الحساب؛ H=1 وO=16.",
 "n(H₂)=4/2=2 mol and n(O₂)=24/32=0.75 mol. Oxygen is limiting; 0.75 mol O₂ consumes 1.5 mol H₂ and generates 1.5 mol H₂O=27 g. Hydrogen remaining is 0.5 mol =1 g.",
 "مولات H₂ تساوي 2، ومولات O₂ تساوي 0.75. الأكسجين محدد؛ يستهلك 1.5 مول H₂ وينتج 1.5 مول ماء =27 غ. يتبقى 0.5 مول H₂ =1 غ.",
 [["Convert both masses correctly to moles","حساب المولات بشكل صحيح"],["Identify O₂ as limiting with stoichiometric justification","تحديد الأكسجين المحدد مع تبرير"],["Calculate 27 g water","حساب 27 غ ماء"],["Compute 1 g H₂ remaining and state units","حساب الهيدروجين المتبقي والوحدات"]]),
 item("chemistry","ch02","Chemical equilibrium / الاتزان",
 "For N₂ + 3H₂ ⇌ 2NH₃ (ΔH < 0), explain what happens to the equilibrium fraction of ammonia when pressure rises, temperature rises and a catalyst is added. Distinguish final equilibrium yield from reaction rate.",
 "في اتزان N₂+3H₂⇌2NH₃ الطارد للحرارة، فسر تأثير زيادة الضغط وزيادة الحرارة وإضافة محفز على نسبة الأمونيا عند الاتزان، مع التمييز بين النسبة والسرعة.",
 "Pressure increase favors the side with 2 gas moles (NH₃) over 4. Heating favors the endothermic reverse reaction, lowering equilibrium NH₃. A catalyst speeds forward/reverse processes but does not alter the equilibrium constant or composition.",
 "الضغط المرتفع يرجّح جهة عدد المولات الأقل (الأمونيا). التسخين يرجح التفاعل العكسي الماص للحرارة، والمحفظ يسرع الوصول إلى الاتزان دون تغيير ثابته أو موضعه.",
 [["Count gaseous moles and explain pressure shift","تفسير تأثير الضغط بعدد مولات الغاز"],["Use exothermic ΔH to explain heating","تفسير تأثير التسخين"],["Correctly state catalyst has no equilibrium shift","بيان أن المحفز لا يغير موضع الاتزان"],["Distinguish kinetics from equilibrium","التمييز بين الحركية والاتزان"]]),
 item("chemistry","ch03","Ionic equations / المعادلات الأيونية",
 "An aqueous solution containing chloride produces a white precipitate when AgNO₃ is added. Identify the likely solid, write a balanced net ionic equation, and explain why the observation is not sufficient to identify every component of the original salt.",
 "محلول يحوي أيونات الكلوريد ويعطي راسبًا أبيض عند إضافة AgNO₃. حدد الراسب المحتمل، واكتب معادلة أيونية صافية موزونة، واشرح لماذا لا يكفي هذا الاختبار لتحديد كل مكونات الملح.",
 "Ag⁺(aq)+Cl⁻(aq)→AgCl(s), a white curdy precipitate. Silver nitrate indicates chloride in appropriate conditions, but does not identify the original cation; sample impurities or other precipitating ions require controls.",
 "Ag⁺+Cl⁻→AgCl الصلب الأبيض. يثبت الترسيب وجود كلوريد على نحو داعم مع ضوابط مناسبة، لكنه لا يحدد الكاتيون الأصلي، وقد تتداخل شوائب أو أيونات أخرى.",
 [["Name silver chloride and its appearance","تحديد كلوريد الفضة الراسب"],["Write balanced net ionic reaction","كتابة المعادلة الأيونية الموزونة"],["Explain soluble precursor ions","شرح دور الأيونات في المحلول"],["Mention limitation or interference","ذكر حدود الاختبار أو تداخلاته"]]),
 item("chemistry","ch04","Acid–base buffer / المنظم الحمضي",
 "Acetic acid and acetate are mixed at equal concentrations, pKa=4.76. Calculate pH using Henderson–Hasselbalch and predict the qualitative response to adding a small amount of strong acid.",
 "حمض الأسيتيك والأسيتات في المحلول بتركيزين متساويين، pKa=4.76. احسب pH بعلاقة هندرسون–هاسلبالخ وتوقع أثر إضافة كمية صغيرة من حمض قوي.",
 "pH = pKa+log([A⁻]/[HA]) = 4.76. Added H⁺ reacts with CH₃COO⁻ to form CH₃COOH; pH drops slightly rather than dramatically, while buffer capacity remains.",
 "pH=4.76 لأن نسبة القاعدة للحمض تساوي واحدًا. يتفاعل H⁺ مع الأسيتات ليتكون الحمض، فينخفض pH قليلًا بفضل قدرة المحلول المنظمة المحدودة.",
 [["Write correct buffer equation","معادلة المحلول المنظم الصحيحة"],["Derive pH 4.76","استخراج pH=4.76"],["Write H⁺ + acetate reaction","تفاعل الحمض مع الأسيتات"],["Explain finite buffering","شرح الانخفاض المحدود وسعة التنظيم"]]),
 item("chemistry","ch05","Oxidation–reduction / الأكسدة والاختزال",
 "Balance Fe²⁺ reacting with MnO₄⁻ in acidic solution to form Fe³⁺ and Mn²⁺ using half-reactions. Identify oxidant and reductant.",
 "وازن تفاعل Fe²⁺ مع MnO₄⁻ في وسط حمضي لينتج Fe³⁺ وMn²⁺ باستخدام أنصاف التفاعلات، وحدد المؤكسد والمختزل.",
 "Fe²⁺→Fe³⁺+e⁻. MnO₄⁻+8H⁺+5e⁻→Mn²⁺+4H₂O. Overall: MnO₄⁻+5Fe²⁺+8H⁺→Mn²⁺+5Fe³⁺+4H₂O. Permanganate is oxidant, Fe²⁺ reductant.",
 "يتأكسد الحديد Fe²⁺→Fe³⁺+e⁻؛ وتختزل البرمنغنات MnO₄⁻+8H⁺+5e⁻→Mn²⁺+4H₂O. نضرب أكسدة الحديد في 5 ونجمع. البرمنغنات مؤكسد والحديد مختزل.",
 [["Correct oxidation half-reaction","نصف معادلة أكسدة الحديد"],["Correct acidic permanganate reduction","نصف معادلة اختزال البرمنغنات"],["Balance overall equation and charges","موازنة الإلكترونات والشحنة"],["Identify oxidant and reductant","تحديد المؤكسد والمختزل"]]),
 item("chemistry","ch06","Gravimetric analysis / التحليل الوزني",
 "A precipitate of AgCl weighs 1.435 g. Given M(AgCl)=143.5 g/mol and M(Cl)=35.5 g/mol, calculate moles and mass of chloride in the original sample, and explain one source of systematic error.",
 "وزن راسب AgCl يساوي 1.435 غ. احسب عدد مولات وكتلة الكلوريد باستخدام M(AgCl)=143.5 غ/مول وM(Cl)=35.5 غ/مول، وفسر مصدر خطأ منهجي واحد.",
 "n(AgCl)=1.435/143.5=0.0100 mol, equal to n(Cl⁻). Chloride mass=0.0100×35.5=0.355 g. Wet precipitate can overestimate mass; incomplete precipitation underestimates it.",
 "مولات الراسب 0.0100 = مولات الكلوريد. كتلة الكلوريد 0.355 غ. عدم تجفيف الراسب يرفع الكتلة ظاهريًا أو عدم اكتمال الترسيب يقللها.",
 [["Convert precipitate mass to 0.0100 mol","تحويل كتلة الراسب إلى 0.0100 مول"],["Apply 1:1 ionic stoichiometry","تطبيق النسبة المولية 1:1"],["Calculate 0.355 g chloride","حساب كتلة الكلوريد 0.355 غ"],["Explain systematic error direction","تفسير مصدر واتجاه خطأ منهجي"]]),
 item("biology","bi01","Mendelian genetics / الوراثة",
 "Two AaBb organisms are crossed under independent assortment and complete dominance. Show possible gametes, the expected dihybrid phenotypic ratio, and one biological assumption that could change that ratio.",
 "هُجّن فردان AaBb بانعزال مستقل وسيادة تامة. اكتب الأمشاج الممكنة والنسبة الشكلية المتوقعة، وفرضية بيولوجية يمكن أن تغير النسبة.",
 "Each parent makes AB, Ab, aB and ab gametes. With independent segregation and complete dominance, phenotypic ratio is 9:3:3:1. Linkage, epistasis, incomplete dominance or selection can change it.",
 "الأمشاج AB وAb وaB وab؛ نسبة الصفات 9:3:3:1 عند الاستقلال والسيادة. الارتباط الجيني أو تداخل الجينات أو السيادة الناقصة يغيّرها.",
 [["List the four gametes","تحديد الأمشاج الأربعة"],["Derive the 9:3:3:1 ratio","اشتقاق النسبة الصحيحة"],["Explain independent assortment and dominance","تفسير الاستقلال والسيادة"],["Give a realistic exception","ذكر استثناء بيولوجي"]]),
 item("biology","bi02","Gene mutations / الطفرات",
 "A single base is inserted near the start of a gene's coding sequence. Explain a frameshift, its effects on downstream amino acids and premature stops, and contrast insertion of three bases.",
 "أُضيفت قاعدة واحدة إلى بداية منطقة مشفرة من جين. اشرح زحزحة إطار القراءة وتأثيرها على الكودونات وأحماض البروتين والتوقف المبكر، وقارن بإضافة ثلاث قواعد.",
 "A one-nucleotide insertion shifts reading frame, changes downstream codons and may create an early stop. Three inserted bases typically preserve the frame, adding an amino acid; functional impact depends on site.",
 "إضافة قاعدة واحدة تزحزح إطار القراءة فتغير الكودونات اللاحقة وقد تسبب توقفًا مبكرًا. إضافة ثلاث قواعد غالبًا تحافظ على الإطار وتضيف حمضًا أمينيًا واحدًا ويعتمد الأثر على الموقع.",
 [["Explain shifted triplet reading frame","شرح تغير إطار قراءة الثلاثيات"],["Discuss downstream amino acids","التأثير في الأحماض الأمينية اللاحقة"],["Mention possible premature stop","احتمال التوقف المبكر"],["Contrast 3-base insertion accurately","المقارنة الصحيحة بإضافة ثلاث قواعد"]]),
 item("biology","bi03","Cell respiration / التنفس الخلوي",
 "In an experimental mitochondrion, complex IV is blocked. Explain what happens to electron flow, oxygen use, NADH levels, oxidative ATP production and potential cellular lactate formation.",
 "في تجربة افتراضية توقف عمل المعقد IV في الميتوكوندريا. اشرح أثر ذلك على الإلكترونات واستهلاك الأكسجين وNADH وإنتاج ATP واللاكتات.",
 "Terminal electron transfer to O₂ stops, oxygen use and oxidative ATP synthesis fall, reduced carriers such as NADH tend to accumulate, and glycolysis with fermentation may increase lactate depending on cell type.",
 "يتوقف انتقال الإلكترونات إلى O₂ ويقل استهلاك الأكسجين والفسفرة التأكسدية؛ يتراكم NADH نسبيًا وقد يزيد التحلل اللاهوائي وإنتاج اللاكتات بحسب نوع الخلية.",
 [["Identify complex IV terminal oxygen reduction","دور المعقد الرابع في اختزال الأكسجين"],["Predict NADH accumulation","التنبؤ بتراكم NADH"],["Explain oxidative ATP decline","تفسير انخفاض ATP"],["Explain conditional lactate rise","شرح الزيادة المحتملة للاكتات"]]),
 item("biology","bi04","Osmosis / الأسموزية",
 "Predict what happens to a plant cell in a concentrated sucrose solution and to a human red blood cell in very dilute water. Explain membrane water movement and the mechanical role of cell walls.",
 "توقع ما يحدث لخلية نباتية في سكروز مركز وكريّة دم حمراء في ماء مخفف جدًا. اشرح حركة الماء ودور الجدار الخلوي.",
 "The plant cell loses water to hypertonic medium, causing plasmolysis. RBC gains water in hypotonic medium and may hemolyze. Rigid plant cell wall resists excess swelling; RBC lacks one.",
 "تفقد الخلية النباتية الماء فيحدث التبلزم، بينما تمتص الكريّة الماء وقد تنحل. الجدار النباتي يقاوم الانتفاخ الشديد أما كريّة الدم فلا جدار لها.",
 [["Predict plant plasmolysis","التنبؤ بتبلزم الخلية النباتية"],["Predict RBC swelling and possible lysis","توقع انتفاخ الكريّة وانحلالها"],["Explain osmotic gradients","شرح تدرج الجهد المائي"],["Explain the wall difference","أثر وجود الجدار الخلوي"]]),
 item("biology","bi05","PCR controls / ضبط PCR",
 "Explain the denaturation–annealing–extension cycle in PCR and the purposes of primers, thermostable polymerase and a no-template negative control. Explain a possible false-positive result.",
 "اشرح مراحل PCR الثلاث (الفصل والارتباط والاستطالة) ووظيفة البوادئ والبوليميراز المقاوم للحرارة والشاهد السلبي دون قالب، وسبب نتيجة إيجابية كاذبة.",
 "DNA is denatured, primers anneal, polymerase extends DNA strands. Primers specify target, thermostable polymerase survives heating. A negative no-template control checks contamination; foreign DNA can be amplified and produce a false positive.",
 "تفصل الحرارة DNA ثم ترتبط البوادئ ويتبعها استطالة إنزيم بوليميراز ثابت حراريًا. تحدد البوادئ التسلسل المستهدف، ويكشف الشاهد السلبي تلوث الكواشف الذي قد يعطي تضخيمًا كاذبًا.",
 [["Identify all three temperature-cycle stages","تحديد المراحل الثلاث"],["Explain primer role","شرح دور البوادئ"],["Explain heat-stable polymerase","شرح دور البوليميراز المقاوم للحرارة"],["Negative control and false positive","تفسير الشاهد السلبي والإيجابية الكاذبة"]]),
 item("biology","bi06","Population genetics / الانتخاب",
 "A few antibiotic-resistant bacteria exist before an antibiotic is introduced. Explain why the resistant fraction grows afterward and distinguish random mutation from natural selection. Is the mutation created 'because bacteria need it'?",
 "كانت بكتيريا مقاومة قليلة موجودة قبل استعمال المضاد. اشرح لماذا ترتفع نسبتها بعد الاستخدام وميّز الطفرات العشوائية عن الانتخاب الطبيعي، وهل الطفرة تحدث لأن البكتيريا تحتاجها؟",
 "Heritable variants appear without directed anticipation of treatment. Antibiotic exposure removes susceptible bacteria more readily; resistant bacteria survive and multiply, raising resistance frequency. This is natural selection, not purposeful mutation.",
 "توجد متغيرات وراثية قبل التعرض للمضاد. تتضرر الحساسة أكثر، وتبقى المقاومة وتتكاثر فترتفع نسبتها. هذا انتخاب طبيعي لا طفرة مقصودة تخلقها الحاجة.",
 [["Identify pre-existing heritable variation","تحديد التنوع الوراثي الموجود"],["Explain differential survival","شرح النجاة التفاضلية"],["Connect reproduction to frequency increase","زيادة التكرارات عبر التكاثر"],["Reject adaptive purposeful mutation","نفي فكرة الطفرات الهادفة"]]),
 item("medicine","md01","Physiology / فسيولوجيا الدورة",
 "Arterial pressure drops during a hypothetical mild fluid-loss experiment. Explain the rapid baroreceptor reflex, effects on heart rate and vascular tone, and the slower kidney RAAS response. Avoid giving treatment advice.",
 "ينخفض ضغط الدم الشرياني في تجربة افتراضية لفقد سوائل بسيط. اشرح منعكس مستقبلات الضغط السريع وأثره على النبض والأوعية واستجابة RAAS الكلوية الأبطأ دون تقديم علاج.",
 "Reduced stretch lowers carotid/aortic baroreceptor firing, raising sympathetic and lowering parasympathetic output. Heart rate and vasoconstriction increase. Kidney renin triggers angiotensin II and aldosterone over a longer period, supporting sodium/water retention.",
 "يقل إطلاق مستقبلات الضغط فتزداد الإشارات الودية وينخفض نظير الودي مما يزيد النبض وتقبض الأوعية. ينشط الرينين الكلوي ثم أنجيوتنسين II وألدوستيرون للمحافظة على الماء والصوديوم.",
 [["Describe baroreceptor stretch/firing change","تغير إشارة مستقبلات الضغط"],["Predict autonomic heart and vessel response","تفسير استجابة النبض والأوعية"],["Explain RAAS components","آلية الرينين والأنجيوتنسين والألدوستيرون"],["Distinguish reflex vs long-term response","تمييز الزمن السريع والبطيء"]]),
 item("medicine","md02","Epidemiology / الوبائيات",
 "Out of 1,000 people, 10 have a condition. A hypothetical screening test has 90% sensitivity and 90% specificity. Calculate true positives, false positives, positive predictive value, and explain why prevalence matters.",
 "في 1000 شخص يوجد 10 مصابين بمرض افتراضي، وحساسية الاختبار ونوعيته 90%. احسب الإيجابيات الحقيقية والكاذبة والقيمة التنبؤية الإيجابية وفسّر أثر الانتشار.",
 "True positives=9 (10×0.9); false positives=99 (990×0.1). PPV=9/(9+99)=8.33%. In low-prevalence groups false positives can outnumber true positives even with a reasonably accurate test.",
 "الإيجابيات الحقيقية 9؛ والكاذبة 99 من 990 غير مصاب. PPV=9/108≈8.33%. عند انخفاض انتشار المرض تكثر الإيجابيات الكاذبة نسبيًا.",
 [["Compute 9 true positives","حساب 9 إيجابيات حقيقية"],["Compute 99 false positives","حساب 99 إيجابية كاذبة"],["Compute PPV≈8.33%","حساب القيمة التنبؤية 8.33%"],["Interpret low prevalence effect","شرح أثر انخفاض الانتشار"]]),
 item("medicine","md03","Renal physiology / الفسيولوجيا الكلوية",
 "Explain how ADH regulates collecting-duct water reabsorption via V₂ receptors and aquaporin-2. Predict how urine volume and concentration change when ADH is very low.",
 "اشرح كيف ينظم ADH امتصاص الماء في القنوات الجامعة عبر مستقبلات V₂ وقنوات aquaporin-2، وتوقع حجم وتركيز البول عند انخفاض ADH.",
 "ADH binds V₂ receptor on principal cells, signaling apical insertion of aquaporin-2 and raising water permeability. More water is reabsorbed and urine becomes concentrated. Low ADH produces more dilute, larger-volume urine.",
 "يرتبط ADH بمستقبلات V₂ فيحفز إدخال قنوات aquaporin-2 إلى الغشاء فيزيد نفاذ الماء ويقل حجم البول ويزداد تركيزه. عند نقصه يزداد حجم البول المخفف.",
 [["Correct V₂ binding mechanism","دور مستقبلات V₂"],["Correct aquaporin-2 mechanism","وظيفة aquaporin-2"],["Predict effects of high ADH","تأثير زيادة ADH على البول"],["Predict low ADH dilute high-volume urine","التنبؤ بالبول المخفف عند النقص"]]),
 item("medicine","md04","Pulmonary physiology / وظائف التنفس",
 "A hypothetical part of a lung has normal blood perfusion but poor ventilation. Explain the V/Q mismatch, consequences for oxygenation, and why increasing ventilation could improve local V/Q. Distinguish a true shunt.",
 "تتلقى منطقة رئوية افتراضية تروية جيدة وتهوية ضعيفة. اشرح اختلال V/Q وأثره على الأكسجة وتحسن النسبة عند زيادة التهوية، والفرق مع التحويلة الحقيقية.",
 "Low ventilation with preserved perfusion gives a low V/Q ratio. Blood from that area may leave underoxygenated. Raising ventilation raises local V/Q. A true shunt is the limiting case of perfusion with essentially no ventilation.",
 "ضعف التهوية مع وجود تروية يعطي V/Q منخفضًا فينخفض أكسجين الدم الخارج. زيادة التهوية ترفع V/Q موضعيًا. التحويلة الحقيقية تعني استمرار التروية مع غياب التهوية.",
 [["Define low V/Q correctly","تعريف V/Q المنخفض"],["Explain oxygenation impairment","شرح نقص الأكسجة"],["Explain effect of increasing ventilation","تفسير تحسين التهوية"],["Distinguish shunt","تمييز التحويلة الحقيقية"]]),
 item("medicine","md05","Immunology / علم المناعة",
 "Explain how a vaccine can prime immunological memory without the full disease. Describe antigen presentation, helper T-cell signaling, B-cell activation and memory-cell response.",
 "اشرح كيف ينتج اللقاح ذاكرة مناعية دون الإصابة الكاملة بالمرض؛ مع عرض المستضد والخلايا T المساعدة وتنشيط B وخلايا الذاكرة.",
 "Antigen-presenting cells display epitopes to helper T cells. These provide signals for activation and differentiation of specific B cells into antibody-producing and memory cells. Memory B/T responses can react faster on later exposure; exact mechanisms vary by vaccine.",
 "تعرض الخلايا العارضة المستضد إلى خلايا T المساعدة، فتساند تنشيط B وتكوين خلايا بلازمية وذاكرة. تكون الاستجابة أسرع عند تعرض لاحق، مع اختلاف التفاصيل حسب اللقاح.",
 [["Describe antigen presentation","عرض المستضد"],["Explain helper T cells and B activation","دور T في تنشيط B"],["Explain antibody and memory generation","الأجسام المضادة والذاكرة"],["Explain later rapid response and limits","الاستجابة اللاحقة وحدود التعميم"]]),
 item("medicine","md06","Public health calculation / حسابات الصحة العامة",
 "In an idealized well-mixed population, a hypothetical infection has R₀=4. Calculate the theoretical herd-immunity threshold 1−1/R₀ and give two reasons why this simple threshold may differ in the real world.",
 "في مجتمع متجانس افتراضي لعدوى R₀=4، احسب عتبة مناعة القطيع النظرية 1−1/R₀، وأعط سببين لعدم انطباقها تمامًا على الواقع.",
 "Threshold = 1−1/4 = 0.75 = 75%. Real populations have heterogeneous contact patterns, imperfect/waning immunity, viral evolution and changing R₀. This formula is an oversimplified theoretical model.",
 "العتبة =1−1/4=0.75 أي 75%. تختلف فعليًا بسبب تفاوت الاختلاط وتراجع المناعة واختلاف فعالية الحماية والمتغيرات والتغيرات الزمنية.",
 [["Apply the formula correctly","تطبيق المعادلة"],["Calculate 75%","حساب 75%"],["State homogeneity assumption","افتراض المجتمع المتجانس"],["Give two real-world limitations","ذكر سببين لحدود النموذج"]])
];
/* Deterministically generated concept variations from same syllabus topics.
 * Parameters are chosen to yield exact, auditable solutions. */
function generated(subject,n){
 const seed=Math.max(0,Number(n)||0);
 if(subject==="chemistry"){
  const x=2+seed%9;
  return item(subject,"ch-var-"+x,"Stoichiometry · generated / حسابات مولدة",
   "Original generated variation: "+x+" mol of O₂ reacts with excess H₂ to form water (2H₂+O₂→2H₂O). Determine H₂ used, water produced in moles and grams, then justify stoichiometry using H₂O molar mass 18 g/mol.",
   "صيغة تدريبية مولدة: تفاعل "+x+" مول O₂ مع فائض H₂ لإنتاج الماء. احسب مولات H₂ المستهلكة ومولات الماء وكتلته وفسر النسبة باستخدام 18 غ/مول.",
   x+" mol O₂ requires "+(2*x)+" mol H₂ and makes "+(2*x)+" mol H₂O. Water mass "+(36*x)+" g. Molar ratio H₂:O₂:H₂O = 2:1:2.",
   x+" مول O₂ يستهلك "+(2*x)+" مول H₂ ويكون "+(2*x)+" مول ماء كتلته "+(36*x)+" غ. النسبة 2:1:2.",
   [["Balance and interpret chemical equation","فهم المعادلة الموزونة"],["Calculate H₂ moles = "+(2*x),"حساب مولات H₂ = "+(2*x)],["Calculate water moles = "+(2*x),"حساب مولات الماء"],["Calculate water mass = "+(36*x)+" g with reasoning","حساب كتلة الماء والوحدات"]]);
 }
 if(subject==="biology"){
  const percent=10+5*(seed%7),count=200;
  return item(subject,"bi-var-"+percent,"Population genetics · generated / وراثة سكانية مولدة",
   "Original generated variation: In a population of "+count+" diploid individuals, "+percent+"% show a recessive phenotype. Under Hardy–Weinberg assumptions compute q, p and predicted heterozygote frequency. Explain two assumptions.",
   "مسألة مولدة: من "+count+" فرد ثنائي المجموعة الكروموسومية تظهر الصفة المتنحية في "+percent+"%. تحت شروط هاردي–واينبرغ احسب q وp ونسبة متغاير الزيجوت مع شرطين.",
   "q²="+(percent/100).toFixed(2)+", q≈"+Math.sqrt(percent/100).toFixed(4)+", p≈"+(1-Math.sqrt(percent/100)).toFixed(4)+", 2pq≈"+(2*Math.sqrt(percent/100)*(1-Math.sqrt(percent/100))).toFixed(4)+". Assumptions include random mating, no selection, negligible migration/mutation and large population.",
   "نحسب q²="+percent/100+" ثم q≈"+Math.sqrt(percent/100).toFixed(4)+" وp≈"+(1-Math.sqrt(percent/100)).toFixed(4)+" ونسبة الحاملين 2pq≈"+(2*Math.sqrt(percent/100)*(1-Math.sqrt(percent/100))).toFixed(4)+". يعتمد على التزاوج العشوائي وغياب الانتخاب وغيرها.",
   [["Derive recessive q² from phenotype percent","ربط نسبة المتنحي بقيمة q²"],["Correct square root q","حساب q بالجذر"],["Compute p = 1−q and 2pq","حساب p و2pq"],["Explain two Hardy–Weinberg assumptions","ذكر شرطين للتوازن"]]);
 }
 const r0=2+seed%7,threshold=(1-1/r0)*100;
 return item(subject,"md-var-"+r0,"Epidemiology · generated / وبائيات مولدة",
  "Original generated variation: Assume a homogeneous population with estimated R₀="+r0+". Calculate the simplified theoretical threshold 1−1/R₀, give the percent, and discuss two limitations of this model.",
  "مسألة مولدة: في مجتمع متجانس افتراضي R₀="+r0+"؛ احسب العتبة النظرية 1−1/R₀ بالنسبة المئوية، وناقش حدَّين للنموذج.",
  "1−1/"+r0+" ≈ "+threshold.toFixed(2)+"%. This is only a theoretical simplified threshold; heterogeneous mixing, changing transmission and imperfect immunity affect reality.",
  "العتبة 1−1/"+r0+" ≈ "+threshold.toFixed(2)+"%. إنها نظرية فقط، وتتأثر حقيقةً بتفاوت المخالطة والعدوى والمناعة.",
  [["Write formula 1−1/R₀","كتابة العلاقة"],["Insert R₀="+r0+" correctly","التعويض العددي"],["Calculate "+threshold.toFixed(2)+"%","حساب النسبة الصحيحة"],["Give two realistic limitations","ذكر حدود النموذج"]]);
}
function select(subject="all",difficulty="mixed"){
 const valid=["chemistry","biology","medicine"];
 const bank=subject==="all"?C:C.filter(x=>x.subject===subject);
 return bank.slice();
}
root.OpenDoorsEssayBank=Object.freeze({SOURCES:Object.freeze(SOURCES),QUESTIONS:Object.freeze(C),
 generated,select,version:"2026-11-15"});
})(typeof globalThis!=="undefined"?globalThis:this);
