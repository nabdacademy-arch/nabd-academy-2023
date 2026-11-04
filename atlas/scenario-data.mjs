// Original, simplified educational simulation. NOT a clinical protocol.
export const scenario = {
  id: "chest-pain-foundation-v1",
  title: {ar:"الحالة 01: ألم صدري في الطوارئ", en:"Case 01: Chest pain in the ED"},
  patient: {ar:"مريض افتراضي، 54 عامًا، ألم صدري مفاجئ مع تعرّق وضيق نفس.",en:"Fictional patient, 54, sudden chest pain, sweating and breathlessness."},
  maxPoints: 6,
  steps: [
    {
      title:{ar:"الخطوة 1 — الاستجابة الأولية",en:"Step 1 — Initial response"},
      description:{ar:"تصل الحالة إلى الطوارئ مع العلامات الحيوية الظاهرة. ما الإجراء التعليمي الأنسب من بين الخيارات؟",en:"The patient presents with the displayed vital signs. Which educational response best prioritizes initial care?"},
      options:[
        {ar:"تقييم الاستقرار بشكل عاجل، طلب الدعم، وإجراء تخطيط قلب مبكر.",en:"Urgently assess stability, call for help and obtain an early ECG.",points:2,feedback:{ar:"هذا الاختيار يضع تقييم الاستقرار والبحث المبكر عن أسباب خطيرة في المقدمة.",en:"This prioritizes stability assessment and early investigation for serious causes."}},
        {ar:"تأجيل التقييم حتى تزول الأعراض تلقائيًا.",en:"Delay assessment until symptoms settle spontaneously.",points:0,feedback:{ar:"التأخير قد يهمل حالة خطيرة؛ الأعراض والعلامات تتطلب تقييمًا عاجلًا.",en:"Delay may miss a time-critical condition; urgent evaluation is needed."}},
        {ar:"الاطمئنان إلى أن الألم غير مهم دون فحص.",en:"Assume the pain is harmless without assessment.",points:0,feedback:{ar:"لا يمكن استبعاد أسباب خطيرة للألم الصدري بالافتراض وحده.",en:"Serious causes of chest pain cannot be excluded by assumption."}}
      ]
    },
    {
      title:{ar:"الخطوة 2 — قراءة المعلومات الجديدة",en:"Step 2 — New information"},
      description:{ar:"يظهر تخطيط تعليمي افتراضي مع ارتفاع مقطع ST في اشتقاقات متجاورة. ما الأولوية المناسبة؟",en:"A fictional training ECG describes ST elevation in contiguous leads. What is the priority?"},
      options:[
        {ar:"التصعيد العاجل للفريق المختص وتفعيل المسار المؤسسي المناسب دون تأخير.",en:"Urgently escalate to the appropriate team and activate the local emergency pathway.",points:2,feedback:{ar:"في سيناريو تعليمي يوحي باحتشاء حاد، يجب عدم تأخير التقييم والتصعيد المتخصص.",en:"In a training scenario suggestive of acute infarction, specialist escalation should not be delayed."}},
        {ar:"إرسال المريض إلى المنزل دون متابعة.",en:"Discharge the patient without follow-up.",points:0,feedback:{ar:"هذا الخيار يتجاهل مؤشرًا محتملًا إلى مرض قلبي مهدد للحياة.",en:"This ignores a potentially life-threatening cardiac finding."}},
        {ar:"تجاهل التخطيط والانتظار عدة ساعات دون مراقبة.",en:"Ignore the ECG and wait several hours without monitoring.",points:0,feedback:{ar:"التأخير دون مراقبة أو تصعيد ليس مناسبًا لحالة طارئة محتملة.",en:"Unmonitored delay is inappropriate for a possible emergency."}}
      ]
    },
    {
      title:{ar:"الخطوة 3 — تسليم الحالة",en:"Step 3 — Clinical handover"},
      description:{ar:"حان وقت تسليم الحالة إلى الفريق المختص. كيف توصل المعلومات بطريقة أكثر أمانًا؟",en:"It is time for specialist handover. How should information be communicated safely?"},
      options:[
        {ar:"تسليم منظّم يذكر الأعراض والعلامات والتخطيط والإجراءات المطلوبة بوضوح.",en:"Use structured handover: symptoms, observations, ECG findings and requested actions.",points:2,feedback:{ar:"التواصل المنظّم يساعد الفريق على إدراك الأولويات ويقلل فقدان المعلومات.",en:"Structured communication helps convey priorities and reduces information loss."}},
        {ar:"إرسال رسالة مقتضبة لا تحتوي على العلامات الحيوية أو نتائج الفحوصات.",en:"Send a vague message without vital signs or test findings.",points:0,feedback:{ar:"غياب المعلومات الحرجة يضعف انتقال مسؤولية الرعاية.",en:"Missing critical information weakens safe transfer of care."}},
        {ar:"الاعتماد على افتراض أن الجميع يعرف تفاصيل الحالة.",en:"Assume the receiving team already knows every detail.",points:0,feedback:{ar:"لا ينبغي افتراض معرفة الفريق بالتفاصيل دون تسليم واضح.",en:"The receiving team should not be assumed to know details without a clear handover."}}
      ]
    }
  ]
};