import {escapeHTML as esc} from './core.mjs?v=3';

const cases = [
  {
    ar: ['انقطاع الكهرباء أثناء تسليم المناوبة', 'فريق عيادة متنقلة لديه سجل ورقي معتمد ومكان مغلق لحفظه.', 'تعذّر فتح قائمة الإحالات المعلّقة. تَذكّر الموظفون حالتين واختلفوا حول الثالثة.', 'استخدم الفريق نموذج التعطل المعتمد، وسمّى مسؤولًا عن متابعة الإحالات ومطابقتها بعد عودة النظام.', 'في هذا المثال التدريبي كشفت المطابقة إحالة غير مكتملة، فاتصل المسؤول بالجهة المستقبلة.', 'الصمت لا يؤكد استلام الإحالة. لا تُنسخ بيانات المرضى إلى أجهزة شخصية.'],
    en: ['Power loss during handover', 'A mobile clinic has an approved paper register and locked storage.', 'The electronic referral queue is unavailable. Staff recall two referrals but disagree about a third.', 'The team uses its downtime form and assigns one person to reconcile pending referrals when service returns.', 'In this exercise, reconciliation reveals an incomplete referral. The coordinator contacts the receiving team.', 'Silence does not confirm receipt. Keep patient details off personal devices.']
  },
  {
    ar: ['تسليم مستلزمات عند انقطاع الاتصال', 'تصل شحنة إلى عيادة مؤقتة ويُتاح سجل المخزون الورقي.', 'توجد عبوة بلا بطاقة واضحة أثناء ازدحام نقطة الاستلام.', 'يفصل مسؤول المخزون العبوة عن المخزون المتاح ويطلب التحقق من الجهة المورّدة وفق إجراء المنشأة.', 'في المثال، يستمر توزيع الأصناف المتحقَّق منها وتبقى العبوة معلّقة إلى حين مراجعتها.', 'ضغط الوقت لا يكفي لإثبات هوية مادة أو صلاحيتها. سجّل ما تعذّر التحقق منه.'],
    en: ['A supply handover without connectivity', 'A shipment reaches a temporary clinic with a paper inventory register.', 'One package has an unreadable label at a busy receiving desk.', 'The storekeeper separates it from available stock and requests verification under the facility procedure.', 'In the exercise, verified items move forward while the unidentified package awaits review.', 'Urgency cannot establish identity or fitness for use. Record the uncertainty.']
  },
  {
    ar:['تبديل فريق الفرز عند ازدحام المدخل','تصل مناوبة جديدة ويظل سجل الانتظار متاحًا على الورق.','يظهر اسم متشابه في سجلين ويطلب مرافق تحديثًا.','يتحقق المسؤول من المعرّفات المعتمدة في خصوصية ثم يطابق القائمتين قبل التسليم.','في التمرين تبيّن أن السجلين لشخصين مختلفين واستُكملت المتابعة لكل منهما.','لا تعتمد على تشابه الأسماء أو تنادِ بالتفاصيل الصحية أمام الجمهور.'],
    en:['Triage team change at a crowded entrance','A new shift arrives with access to the paper waiting list.','Two entries have similar names and a companion requests an update.','The coordinator privately checks approved identifiers and reconciles both lists.','In this exercise the entries belong to different people and both receive follow-up.','Avoid matching on names alone or announcing health details in public.']
  },
  {
    ar:['استمرار التعليم خلال انقطاع الشبكة','يتوفر دليلان تدريبيان مطبوعان بإصدارين مختلفين.','تريد المجموعة استخدام تعليمات متعارضة في محاكاة.','تراجع المشرفة سجل النسخ المعتمدة وتوقف الجزء المختلف عليه إلى حين التحقق.','في المثال يستكمل الطلاب الجزء المتفق عليه ويُوثَّق التصحيح عند عودة الاتصال.','لا تُقدّم المذكرة غير المعتمدة بوصفها بروتوكولًا سريريًا.'],
    en:['Training through a network outage','The team has two printed versions of a training manual.','Instructions conflict during a simulation.','The instructor checks the approved version register and pauses the disputed step.','In the exercise students complete the verified section and record the correction when connectivity returns.','An unverified handout should not be presented as a clinical protocol.']
  }
];

const profiles = [
  {slug:'cholera', ar:['الكوليرا','تضرّر خدمات المياه والصرف الصحي.', 'إسهال مائي حاد يستدعي الانتباه، خصوصًا عند ورود بلاغات مشابهة.', 'ناقش مع المشرف مسار التقييم العاجل والإبلاغ وفق التعريف المحلي للحالة.'], en:['Cholera','Disrupted water and sanitation services.', 'Acute watery diarrhoea warrants attention, particularly alongside similar reports.', 'Ask the supervisor about urgent assessment and notification under the local case definition.']},
  {slug:'diphtheria', ar:['الدفتيريا','فجوات في التحصين الروتيني.', 'التهاب حلق مع غشاء ملتصق يستدعي تقييمًا عاجلًا.', 'استدعِ المشرف واتبع مسار احتياطات مكافحة العدوى والإبلاغ المعتمد.'], en:['Diphtheria','Gaps in routine immunisation.', 'A sore throat with an adherent membrane warrants urgent assessment.', 'Alert the supervisor and follow the approved infection-control and reporting pathway.']},
  {slug:'malaria', ar:['الملاريا','إقامة أو سفر إلى منطقة ينتقل فيها المرض.', 'حمّى مع قشعريرة أو صداع بعد تعرّض محتمل.', 'اذكر تاريخ السفر للمشرف واطلب تقييم الحاجة إلى اختبار تشخيصي سريعًا.'], en:['Malaria','Residence in or travel to an area with malaria transmission.', 'Fever with chills or headache after possible exposure.', 'Tell the supervisor about travel and seek prompt assessment for diagnostic testing.']}
];

function card(title, labels, values) {
  return `<article class="panel"><h2>${esc(title)}</h2><dl>${labels.map((l,i)=>`<dt><strong>${esc(l)}</strong></dt><dd>${esc(values[i])}</dd>`).join('')}</dl></article>`;
}
function exercise(question, prompt, answer) {
  return `<section class="panel"><h2>${esc(question)}</h2><p>${esc(prompt)}</p><details><summary>${esc(answer[0])}</summary><p>${esc(answer[1])}</p></details></section>`;
}
export function archivePage(lang) {
  const ar = lang === 'ar';
  const labels = ar ? ['السياق والموارد','التحدي','الإجراء في المثال','النتيجة الافتراضية','حدود السلامة والأخلاقيات'] : ['Context and resources','Challenge','Action in the exercise','Simulated outcome','Safety and ethics'];
  return `<div class="stack"><p>${ar?'حالات تعليمية افتراضية. عند توثيق تجربة حقيقية، تُحذف تفاصيل الهوية ويُراجع السياق والإجراء والنتيجة سريريًا قبل النشر.':'These are fictional training records. Real submissions require de-identification and clinical review of context, action and outcome before publication.'}</p>${cases.map(c=>{const [title,...values]=c[lang];return card(title,labels,values)}).join('')}
  ${exercise(ar?'تمرين تسليم المناوبة':'Handover exercise',ar?'عودة الشبكة بعد انتهاء المناوبة لا تعني وصول إحالة مكتوبة. كيف تتحقق من مصيرها؟':'Connectivity returns after the shift. How can you establish what happened to a paper referral?',ar?['اعرض المناقشة','طابق السجلين، واتصل بالفريق المستقبِل لتأكيد الاستلام، وعيّن مسؤول متابعة للحالات المعلّقة.']:['Discuss the decision','Reconcile both registers, confirm receipt with the receiving team and assign an owner for unresolved referrals.'])}
  <a class="button" href="crisis-evidence.html?lang=${lang}&amp;from=archive">${ar?'استكشف قاعدة بيانات التحصين':'Explore the immunization evidence bank'}</a>
  <a class="button secondary" href="#disease-radar">${ar?'انتقل إلى مؤشر الأمراض':'Open the disease radar'}</a></div>`;
}
export function radarPage(lang) {
  const ar = lang === 'ar';
  const labels = ar ? ['السياق الوبائي','إشارة تستحق التقييم','مسار المتابعة'] : ['Epidemiological context','Signal to assess','Follow-up pathway'];
  return `<div class="stack"><p>${ar?'مؤشر تعليمي للتدرّب على الاشتباه والإبلاغ. الحالات افتراضية ولا تعبّر عن إنذار وبائي محلي.':'A learning tool for recognition and notification. Scenarios are fictional and do not represent a local outbreak alert.'}</p>${profiles.map(p=>{const [title,...values]=p[lang];return `<section>${card(title,labels,values)}<a class="button secondary" href="https://www.who.int/news-room/fact-sheets/detail/${p.slug}">${ar?'مرجع منظمة الصحة العالمية':'WHO fact sheet'} · ${esc(title)}</a></section>`}).join('')}
  ${exercise(ar?'تمرين الحالة الأولى':'First suspected case',ar?'بعد انقطاع المياه ورد بلاغ عن إسهال مائي حاد. هل تكفي الحالة لإعلان تفشٍ؟ وما الذي تنقله للمشرف؟':'After a water disruption, a clinic reports acute watery diarrhoea. Is this enough to declare an outbreak? What should the supervisor hear?',ar?['اعرض المناقشة','بلّغ المشرف بالإشارة وتوقيت ظهورها والسياق واتبع مسار التقييم والإبلاغ المحلي. تحديد وجود تفشٍ من اختصاص جهة الصحة العامة.']:['Discuss the decision','Tell the supervisor the signal, onset and context. Follow local assessment and reporting procedures. Public health authorities assess whether an outbreak is occurring.'])}
  <a class="button secondary" href="https://www.who.int/emergencies/surveillance/early-warning-alert-and-response-system-ewars">${ar?'الإنذار المبكر في الطوارئ · منظمة الصحة العالمية':'WHO early warning and response in emergencies'}</a>
  <a class="button" href="crisis-evidence.html?lang=${lang}&amp;from=radar">${ar?'استكشف قاعدة بيانات التحصين':'Explore the immunization evidence bank'}</a>
  <a class="button secondary" href="#crisis-archive">${ar?'افتح أرشيف طب الأزمات':'Open the crisis medicine archive'}</a></div>`;
}
