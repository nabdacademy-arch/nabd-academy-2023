import {scenario as chestPainCase} from "./scenario-data.mjs";
import {criticalCases} from "./cases-critical.mjs";
import {generalCases} from "./cases-general.mjs";
import {specialistCases} from "./cases-specialist.mjs";
import {injuryCases} from "./cases-injury.mjs";

export const clinicalDepartments = [
  {id:"all",ar:"كل الأقسام",en:"All departments"},
  {id:"cardiology",ar:"القلب",en:"Cardiology"},
  {id:"neurology",ar:"الأعصاب",en:"Neurology"},
  {id:"emergency",ar:"الطوارئ",en:"Emergency care"},
  {id:"respiratory",ar:"التنفسية",en:"Respiratory"},
  {id:"endocrine",ar:"الغدد والسكري",en:"Endocrinology"},
  {id:"gastro",ar:"الجهاز الهضمي",en:"Gastroenterology"},
  {id:"surgery",ar:"الجراحة",en:"Surgery"},
  {id:"pediatrics",ar:"الأطفال",en:"Pediatrics"},
  {id:"obstetrics",ar:"النساء والتوليد",en:"Obstetrics"},
  {id:"renal",ar:"الكلى",en:"Renal"},
  {id:"toxicology",ar:"السموم",en:"Toxicology"},
  {id:"trauma",ar:"الإصابات",en:"Trauma"},
  {id:"mentalhealth",ar:"الصحة النفسية",en:"Mental health"}
];

// Fictional medical education scenarios; content is not reviewed for formal assessment.
// No patient-identifying information or prescribing/treatment instructions are included.
export const strokeCase = {
  id:"stroke-recognition-foundation-v1",
  title:{ar:"الحالة 02: أعراض عصبية مفاجئة",en:"Case 02: Sudden neurological symptoms"},
  patient:{ar:"مريضة افتراضية، 61 عامًا، ضعف مفاجئ في أحد الذراعين وصعوبة في الكلام. وقت آخر ظهور طبيعي غير محدد بعد.",en:"Fictional patient, 61, sudden arm weakness and difficulty speaking. Last known well time has not yet been established."},
  vitals:{hr:"96/min",bp:"170/92",spo2:"97%"},
  category:{ar:"الطوارئ العصبية",en:"Neurological emergency"},
  maxPoints:6,
  steps:[
    {
      title:{ar:"الخطوة 1 — التعرّف على الخطورة",en:"Step 1 — Recognize urgency"},
      description:{ar:"تظهر الأعراض فجأة في مكان الاستقبال. أي استجابة تعكس ترتيب الأولويات؟",en:"Symptoms appeared suddenly at triage. Which response best prioritizes safety?"},
      options:[
        {ar:"تقييم عاجل مع تفعيل مسار الاشتباه بالسكتة وطلب المساعدة المختصة.",en:"Arrange urgent assessment, activate the suspected-stroke pathway and seek specialist help.",points:2,feedback:{ar:"الضعف المفاجئ واضطراب الكلام قد يشيران إلى حالة طارئة حساسة للوقت، وتتطلب تقييمًا متخصصًا سريعًا.",en:"Sudden weakness and speech changes may signal a time-sensitive emergency requiring prompt specialist assessment."}},
        {ar:"الانتظار حتى اليوم التالي دون تصعيد.",en:"Wait until the next day without escalation.",points:0,feedback:{ar:"تأجيل التقييم قد يفوّت حالة طارئة تحتاج إلى استجابة مبكرة.",en:"Delayed assessment may miss an emergency that needs prompt evaluation."}},
        {ar:"اعتبار الصعوبة في الكلام تعبًا عابرًا دون تقييم.",en:"Assume speech difficulty is fatigue without assessment.",points:0,feedback:{ar:"لا يجوز استبعاد الحالات العصبية العاجلة بالافتراض دون تقييم.",en:"Urgent neurological conditions cannot be excluded by assumption."}}
      ]
    },
    {
      title:{ar:"الخطوة 2 — المعلومات الأساسية",en:"Step 2 — Essential history"},
      description:{ar:"وصل الفريق المختص. أي معلومة تاريخية مهمة لتسليم الحالة؟",en:"The specialist team is present. Which history detail is especially useful to communicate?"},
      options:[
        {ar:"متى شوهدت المريضة آخر مرة دون أعراض، وما طبيعة الأعراض وتطورها.",en:"When the patient was last known well, plus symptom characteristics and progression.",points:2,feedback:{ar:"توقيت آخر ظهور طبيعي ووصف الأعراض يساعدان الفريق المختص على التقييم.",en:"Last-known-well timing and symptom descriptions help the specialist team evaluate the case."}},
        {ar:"الاقتصار على سؤال المريضة عن لون ملابسها.",en:"Ask only about the patient's clothing color.",points:0,feedback:{ar:"هذه المعلومة لا تستبدل التاريخ المرضي المطلوب للحالة.",en:"This does not replace the time-critical clinical history."}},
        {ar:"عدم تسجيل أي تاريخ للأعراض.",en:"Record no history of symptoms.",points:0,feedback:{ar:"غياب توثيق وقت البداية أو آخر ظهور طبيعي يجعل التواصل أقل دقة.",en:"Without symptom timing or last-known-well documentation, handover is less informative."}}
      ]
    },
    {
      title:{ar:"الخطوة 3 — التواصل الآمن",en:"Step 3 — Safe handover"},
      description:{ar:"ما أسلوب التواصل الأنسب مع الفريق المسؤول عن متابعة الحالة؟",en:"How should the assessment be communicated to the receiving team?"},
      options:[
        {ar:"تسليم منظم يشمل الأعراض وتوقيتها والعلامات الحيوية والإجراءات المنجزة.",en:"Provide structured handover including symptoms, timing, observations and actions already taken.",points:2,feedback:{ar:"يساعد التسليم المنظم على تقليل فقدان المعلومات وتوضيح ما يحتاج إلى متابعة.",en:"Structured handover reduces information loss and clarifies next steps for the receiving team."}},
        {ar:"مغادرة المكان دون نقل أي معلومات.",en:"Leave without handing over the information.",points:0,feedback:{ar:"تسليم المعلومات عنصر أساسي من عناصر التواصل الآمن.",en:"Handover is an essential part of safe communication."}},
        {ar:"ذكر عرض واحد فقط دون توقيت أو سياق.",en:"Mention one symptom without its timing or context.",points:0,feedback:{ar:"هذا يفوّت معلومات ضرورية لفهم الحالة وتسلسلها.",en:"This omits important details about the presentation and its sequence."}}
      ]
    }
  ]
};

export const clinicalCases = [
  {
    ...chestPainCase,
    department:"cardiology",level:"intro",revision:1,reviewStatus:"unreviewed",
    objectives:{ar:"ترتيب الأولويات وتفسير إنذار التخطيط والتسليم الآمن.",en:"Prioritize initial assessment, ECG alerts and safe handover."},
    references:["https://www.heart.org/health-topics/heart-attack/warning-signs-of-a-heart-attack"],
    vitals:{hr:"112/min",bp:"95/60",spo2:"93%"},
    category:{ar:"طوارئ القلب",en:"Cardiac emergency"}
  },
  {
    ...strokeCase,
    department:"neurology",level:"intermediate",revision:1,reviewStatus:"unreviewed",
    objectives:{ar:"تمييز الأعراض العصبية العاجلة والتوقيت والتسليم المنظم.",en:"Recognize urgent neurological signs, symptom timing and structured handover."},
    references:["https://www.heart.org/en/about-us/heart-attack-and-stroke-symptoms"]
  },
  ...criticalCases,
  ...generalCases,
  ...specialistCases,
  ...injuryCases
];
