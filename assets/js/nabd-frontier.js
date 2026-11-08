/* NABD NEXT FRONTIER / 8 initiatives. RLS is the security boundary, not client-side filters.
   All user-generated content is rendered as text, never HTML; publication is exclusively admin-reviewed. */
(()=>{"use strict";
const d=document,$=id=>d.getElementById(id);
const keys=["evidence","congress","press","mentor","innovation","wallet","quest","observatory"];
const S={lang:"ar",db:null,user:null,active:"evidence",busy:false,generation:0,quest:"cells",cards:{},records:{},mentor:null};
const tr=(ar,en)=>S.lang==="ar"?ar:en;
const elem=(tag,cls,value)=>{const e=d.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e};
const fmt=x=>{const dt=new Date(x);return Number.isFinite(dt.getTime())?new Intl.DateTimeFormat(S.lang==="ar"?"ar":"en",{dateStyle:"medium"}).format(dt):""};
const warnPattern=/(?:\S+@\S+\.\S+)|(?:\+?\d[\s-]?){8,}|(?:password|passport|patient\s*(?:name|record|id)|كلمة\s*(?:المرور|السر)|رقم\s*(?:الهوية|هويه)|بيانات\s*مريض|اسم\s*المريض)/iu;
const validHttps=u=>typeof u==="string"&&/^https:\/\/[^<>"\s]+$/i.test(u)&&u.length<=650;
const block=(host,title,text)=>{const e=elem("article","nf-card");e.append(elem("h3","",title),elem("p","",text));host.append(e);return e};
function info(key,ar,en,bad=false){const e=$("nf-status-"+key);if(!e)return;e.textContent=tr(ar,en);e.classList.toggle("bad",bad)}
function empty(host,ar,en){host.append(elem("div","nf-empty",tr(ar,en)))}
function link(url,ar,en){if(!validHttps(url))return null;const a=elem("a","",tr(ar,en)+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
function chip(value){const m={submitted:["بانتظار المراجعة","Submitted"],reviewing:["قيد التقييم","Under review"],accepted:["مقبول","Accepted"],published:["منشور","Published"],rejected:["غير مقبول","Not accepted"],approved:["معتمد للعرض","Approved listing"],pending:["بانتظار القرار","Pending"],requested:["مرسل","Requested"],ready:["جاهز للتجهيز فقط","Review-ready only"],shortlisted:["في القائمة المختصرة","Shortlisted"],showcased:["في المعرض","Showcased"],declined:["مرفوض","Declined"],hidden:["غير معروض","Not listed"]};return tr(...(m[value]||[value,value]))}
function row(h,txt,cls=""){h.append(elem("small",cls,txt))}
function cardHead(card,title,status){const h=elem("div","nf-card-head");h.append(elem("h3","",title));if(status)h.append(elem("span","nf-pill",chip(status)));card.append(h)}
function show(key){
 S.active=keys.includes(key)?key:"evidence";
 for(const name of keys){
  const tab=$("nf-tab-"+name),panel=$("nf-panel-"+name);tab.setAttribute("aria-selected",String(name===S.active));tab.tabIndex=name===S.active?0:-1;panel.hidden=name!==S.active
 }
 if(location.hash!=="#"+S.active)history.replaceState(null,"","#"+S.active);
 loadOne(S.active)
}
function switchLang(){
 d.documentElement.lang=S.lang;d.documentElement.dir=S.lang==="ar"?"rtl":"ltr";$("nf-lang").textContent=tr("EN","عربي");
 d.querySelectorAll("[data-ar][data-en]").forEach(el=>el.textContent=el.dataset[S.lang]);
 for(const key of keys)render(key)
}
function attachForm(formId,table,fieldNames,kind){
 const form=$(formId);form.addEventListener("submit",async event=>{
  event.preventDefault();if(S.busy||!S.db||!S.user){info(kind,"سجّل الدخول أولًا.","Sign in first.",true);return}
  const values=Object.fromEntries(fieldNames.map(field=>[field,form.elements.namedItem(field)?.value.trim()||""]));
  if(form.elements.namedItem("public_consent"))values.public_consent=form.elements.namedItem("public_consent").checked;
  if(values.public_consent===false){info(kind,"يلزم قبول شروط العرض بعد مراجعة اللجنة.","Publication consent is required for a reviewed submission.",true);return}
  const checks=Object.values(values).filter(x=>typeof x==="string");
  if(checks.some(s=>warnPattern.test(s))){info(kind,"أزل بيانات المرضى أو البريد الشخصي أو أرقام الاتصال من الحقول المنشورة.","Remove patient, personal email or contact details from fields that may be published.",true);return}
  const identity=table==="nfx_mentor_profiles"?"user_id":table==="nfx_mentor_requests"?"learner_id":"user_id";
  values[identity]=S.user.id;
  S.busy=true;const btn=form.querySelector('button[type="submit"]');btn.disabled=true;
  info(kind,"جارٍ حفظ الطلب الحقيقي…","Saving real submission…");
  try{
   const {error}=await S.db.from(table).insert(values);if(error)throw error;
   form.reset();info(kind,"حُفظ الطلب بنجاح، ولن يُنشر إلا بعد قرار الإدارة.","Submission saved. It will not be publicly visible until staff approval.");
   await loadOne(kind);
  }catch(err){info(kind,"لم يُؤكَّد إرسال الطلب؛ ربما لديك طلب سابق أو صلاحيات غير كافية.","Submission failed or could not be verified. You may already have a request.",true)}
  finally{S.busy=false;btn.disabled=false}
 })
}
function authenticatedUI(){
 for(const id of ["nf-congress-form","nf-press-form","nf-mentor-form","nf-innovation-form","nf-wallet-form"])$(id).hidden=!S.user;
 const acct=$("nf-account");acct.replaceChildren();
 if(S.user)acct.append(elem("strong","",tr("✓ حساب مسجل — طلباتك الخاصة تظهر لك فقط","✓ Signed in — only your authorised private requests appear")));
 else{acct.append(elem("span","",tr("المشاهدة والتحديات متاحة للجميع. للتقديم احصل على حساب نبض.","Browsing and practice games are open to all. Sign in to submit.")));const a=elem("a","",tr("تسجيل الدخول ↗","Sign in ↗"));a.href="learning/#account";acct.append(" ",a)}
}
async function boot(){
 if(!window.supabase?.createClient||!window.NABD_CONFIG?.supabaseUrl){for(const k of keys)info(k,"الواجهة تعمل لكن اتصال قاعدة البيانات غير متاح حاليًا.","The interface is available but the database connection is unavailable.",true);authenticatedUI();return}
 try{
  S.db=window.supabase.createClient(window.NABD_CONFIG.supabaseUrl,window.NABD_CONFIG.supabaseAnonKey);
  const result=await S.db.auth.getUser();S.user=result.error?null:result.data?.user||null;
  if(S.db.auth.onAuthStateChange)S.db.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){S.user=null;S.records={};authenticatedUI();loadOne(S.active)}else if(event==="SIGNED_IN"&&session?.user?.id!==S.user?.id){S.user=session.user;S.records={};authenticatedUI();loadOne(S.active)}});
 }catch(err){S.db=null;S.user=null}
 authenticatedUI();await loadOne(S.active)
}
const queries={
 evidence:()=>S.db.from("nfx_evidence_entries").select("id,claim_ar,claim_en,topic,source_title,source_url,relation,status,reviewed_at").order("created_at",{ascending:false}).limit(40),
 congress:()=>S.db.from("nfx_congress_submissions").select("id,user_id,display_name,title,abstract,track,status,created_at").order("created_at",{ascending:false}).limit(40),
 press:()=>S.db.from("nfx_manuscripts").select("id,user_id,title,abstract,study_type,status,created_at").order("created_at",{ascending:false}).limit(40),
 mentor:()=>S.db.from("nfx_mentor_profiles").select("user_id,display_name,expertise,bio,status,created_at").order("created_at",{ascending:false}).limit(40),
 innovation:()=>S.db.from("nfx_innovation_projects").select("id,user_id,team_name,title,problem,solution,status,created_at").order("created_at",{ascending:false}).limit(40),
 observatory:()=>S.db.from("nfx_observatory_records").select("id,indicator_ar,indicator_en,location_label,period_label,figure,units,source_title,source_url,status").order("created_at",{ascending:false}).limit(50)
};
async function fetchQuery(q){try{const {data,error}=await q();return error?null:data||[]}catch{return null}}
async function loadOne(key){
 if(key==="quest"){renderQuest();if(S.db&&S.user)await fetchQuest();return}
 if(!S.db){info(key,"لا يوجد اتصال بالبيانات حاليًا. جرّب لاحقًا.","Database connection unavailable. Please retry later.",true);render(key);return}
 info(key,"جارٍ التحقق من السجلات المصرح بها…","Checking authorised records…");
 if(key==="wallet")await fetchWallet();
 else if(key==="mentor"){const [a,b]=await Promise.all([fetchQuery(queries.mentor),S.user?fetchQuery(()=>S.db.from("nfx_mentor_requests").select("id,mentor_id,goal,status,created_at").eq("learner_id",S.user.id).limit(40)):Promise.resolve([])]);S.records.mentor=a;S.records.mentorRequests=b}
 else if(queries[key])S.records[key]=await fetchQuery(queries[key]);
 else return;
 info(key,S.records[key]===null?"تعذر قراءة السجلات، ولا يعني ذلك عدم وجودها.":"عرض السجلات المسموح بها فقط.",S.records[key]===null?"Unable to verify records; this is not evidence of an empty catalogue.":"Only records permitted by database policies are shown.",S.records[key]===null);
 render(key)
}
async function fetchWallet(){
 if(!S.user){S.records.wallet=[];renderWallet();return}
 const uid=S.user.id;
 const jobs=[
 S.db.from("certificates").select("id,certificate_id,course_title,status,issue_date").eq("student_id",uid).limit(60),
 S.db.from("nabd_skill_verifications").select("id,level,verification_status,public_reference,issued_at,expires_at").eq("student_id",uid).limit(60),
 S.db.from("nfx_badge_requests").select("id,record_type,record_reference,status,created_at").eq("user_id",uid).limit(60)
 ];
 const result=await Promise.allSettled(jobs);
 S.records.wallet=result.map(x=>x.status==="fulfilled"&&!x.value.error?x.value.data||[]:null);renderWallet()
}
async function fetchQuest(){
 const rows=await fetchQuery(()=>S.db.from("nfx_quest_attempts").select("id,quest_id,correct_count,total_count,created_at").eq("user_id",S.user.id).order("created_at",{ascending:false}).limit(7));
 S.records.quest=rows;renderQuestHistory()
}
function render(key){switch(key){case"evidence":return renderPublic("evidence","nf-evidence-list");case"congress":return renderPublic("congress","nf-congress-list");case"press":return renderPublic("press","nf-press-list");case"mentor":return renderMentors();case"innovation":return renderPublic("innovation","nf-innovation-list");case"wallet":return renderWallet();case"quest":return renderQuest();case"observatory":return renderPublic("observatory","nf-observatory-list")}}
function renderPublic(key,hostId){
 const host=$(hostId);if(!host)return;host.replaceChildren();
 const data=S.records[key];
 if(data===null){empty(host,"تعذر التحقق من السجلات. تأكد من اتصال الإنترنت.","Unable to verify records. Check your connection.");return}
 if(!Array.isArray(data)){empty(host,"لا توجد نتائج محمّلة. اختر هذا المشروع لعرض بياناته.","Select this project to load its available records.");return}
 if(!data.length){const texts={
 evidence:["لا توجد مراجع مدققة ومنشورة في هذا القسم بعد. ينبغي على المشرف إضافة مصادر موثوقة أولًا.","No staff-verified evidence claims published yet."],
 congress:["لا توجد ملخصات مقبولة منشورة بعد. يمكنك تقديم ملخص للمراجعة.","No accepted congress abstracts published yet."],
 press:["لا توجد أعمال منشورة بعد؛ مراجعة المحرر مطلوبة قبل الإتاحة العامة.","No editorially published manuscripts yet."],
 innovation:["المعرض ينتظر مشاريع يراجعها الفريق أولًا.","The showcase awaits staff-reviewed projects."],
 observatory:["لا توجد أرقام صحية منشورة ومدققة بعد. لن نعرض إحصاءات تخمينية.","No sourced health figures have been published yet. We do not invent statistics."]
 };empty(host,...(texts[key]||["لا سجلات منشورة بعد.","Nothing published yet."]));return}
 if(key==="observatory"){renderObservatory(data,host);return}
 for(const item of data){
  const card=elem("article","nf-card");
  let title="",body="",metadata="";
  if(key==="evidence"){title=tr(item.claim_ar,item.claim_en);body=item.source_title;metadata=item.topic+" · "+tr(({supports:"دليل مؤيد",questions:"دليل يناقش",context:"سياق علمي"}[item.relation]||item.relation),({supports:"Supports",questions:"Questions",context:"Context"}[item.relation]||item.relation))}
  if(key==="congress"){title=item.title;body=item.abstract;metadata=item.display_name+" · "+item.track}
  if(key==="press"){title=item.title;body=item.abstract;metadata=item.study_type+" · "+fmt(item.created_at)}
  if(key==="innovation"){title=item.title;body=tr("المشكلة: ","Problem: ")+item.problem+"\n"+tr("الحل: ","Proposal: ")+item.solution;metadata=item.team_name}
  cardHead(card,title,item.status);row(card,metadata);card.append(elem("p","",body));
  if(key==="evidence"){const a=link(item.source_url,"افتح المصدر الأصلي","Read original source");if(a)card.append(a)}
  if(key!=="evidence")row(card,fmt(item.created_at));
  host.append(card)
 }
}
function renderObservatory(data,host){
 const max=Math.max(0,...data.map(x=>Number(x.figure)||0));const list=elem("div","nf-ob-data");
 for(const row of data){
  const card=elem("article","nf-card");cardHead(card,tr(row.indicator_ar,row.indicator_en),row.status);
  card.append(elem("strong","nf-figure",new Intl.NumberFormat(S.lang==="ar"?"ar":"en",{maximumFractionDigits:3}).format(row.figure)+" "+row.units));
  card.append(elem("small","",row.location_label+" · "+row.period_label));
  card.append(elem("small","",row.source_title));
  const meter=elem("div","nf-bar-meter");meter.setAttribute("aria-hidden","true");const fill=elem("i");fill.style.width=(max?Math.min(100,(Number(row.figure)/max)*100):0)+"%";meter.append(fill);card.append(meter);
  const a=link(row.source_url,"تحقق من المصدر","Verify original source");if(a)card.append(a);
  list.append(card)
 }host.append(list)
}
function renderMentors(){
 const host=$("nf-mentor-list");host.replaceChildren();const items=S.records.mentor;
 if(!Array.isArray(items)){empty(host,"اختر القسم لإظهار المرشدين المراجعين.","Select this section to load approved mentors.");return}
 if(!items.length)empty(host,"لم يُعتمد مرشد للعرض بعد. الطلبات الجديدة تراجعها الإدارة.","No mentor profile has been approved for public listing.");
 for(const m of items){
  const card=elem("article","nf-card");cardHead(card,m.display_name,m.status);
  card.append(elem("small","",m.expertise),elem("p","",m.bio));
  if(S.user&&m.status==="approved"&&S.user.id!==m.user_id){
   const f=elem("form","nf-form");f.append(elem("label","",tr("ما الهدف الذي تريد مساعدة فيه؟","What would you like help with?")));
   const area=elem("textarea");area.required=true;area.minLength=15;area.maxLength=750;area.placeholder=tr("هدف تعليمي محدد دون معلومات شخصية","A specific learning goal, without personal information");f.append(area);
   const button=elem("button","nf-btn primary",tr("طلب جلسة إرشاد","Request mentorship"));button.type="submit";f.append(button);
   f.addEventListener("submit",async e=>{
    e.preventDefault();if(S.busy)return;const goal=area.value.trim();if(goal.length<15||goal.length>750||warnPattern.test(goal)){info("mentor","تأكد من هدف مناسب دون معلومات حساسة.","Enter a suitable goal without sensitive information.",true);return}
    S.busy=true;button.disabled=true;
    try{const {error}=await S.db.from("nfx_mentor_requests").insert({learner_id:S.user.id,mentor_id:m.user_id,goal});
     if(error)throw error;info("mentor","أُرسل طلب الإرشاد للإدارة. لا تبدأ مراسلة تلقائية.","Mentorship request saved for staff review; no contact is initiated automatically.");await loadOne("mentor")
    }catch(err){info("mentor","تعذّر الإرسال، أو لديك طلب سابق لهذا المرشد.","Request failed, or you already requested this mentor.",true)}finally{S.busy=false;button.disabled=false}
   });card.append(f)
  }host.append(card)
 }
 const req=$("nf-mentor-requests");req.replaceChildren();const rows=S.records.mentorRequests;
 if(!S.user){empty(req,"سجّل الدخول لمتابعة طلبات الإرشاد.","Sign in to see your requests.");return}
 if(!Array.isArray(rows)){empty(req,"تعذر التأكد من طلباتك.","Could not verify your requests.");return}
 if(!rows.length){empty(req,"ليس لديك طلبات إرشاد حتى الآن.","No mentorship requests yet.");return}
 for(const row of rows){const c=elem("article","nf-card");cardHead(c,tr("طلب إرشاد","Mentorship request"),row.status);c.append(elem("p","",row.goal));req.append(c)}
}
function renderWallet(){
 const host=$("nf-wallet-list");host.replaceChildren();
 if(!S.user){empty(host,"سجّل الدخول لعرض الشهادات والمهارات المرتبطة بحسابك.","Sign in to view credentials and skills linked to your account.");return}
 const data=S.records.wallet;
 if(!Array.isArray(data)){empty(host,"جارٍ تحميل السجلات الموجودة.","Loading existing records.");return}
 if(data.some(x=>x===null)){empty(host,"تعذر قراءة أحد مصادر السجلات؛ لا نفترض أن العدد صفر.","Could not verify one or more credential sources.");return}
 const [certificates,skills,requests]=data;let n=0;
 for(const c of certificates.filter(x=>["issued","active","valid","verified"].includes(String(x.status).toLowerCase()))){const card=elem("article","nf-card");cardHead(card,c.course_title||tr("سجل شهادة موجودة","Existing credential record"),"published");row(card,tr("تاريخ الإصدار: ","Issued: ")+fmt(c.issue_date));if(c.certificate_id)row(card,tr("معرّف السجل: ","Record ID: ")+c.certificate_id);host.append(card);n++}
 for(const skill of skills.filter(x=>x.verification_status==="verified"&&(!x.expires_at||new Date(x.expires_at)>new Date()))){const card=elem("article","nf-card");cardHead(card,tr("مهارة تعليمية موثقة","Verified learning skill"),"approved");row(card,tr("المستوى: ","Level: ")+skill.level);if(skill.public_reference)row(card,tr("مرجع: ","Reference: ")+skill.public_reference);host.append(card);n++}
 for(const req of requests){const card=elem("article","nf-card");cardHead(card,tr("طلب مراجعة سجل","Credential review request"),req.status);row(card,req.record_type+" · "+req.record_reference);host.append(card);n++}
 if(!n)empty(host,"لا توجد سجلات صادرة أو طلبات مراجعة ظاهرة في حسابك.","No issued records or review requests are currently visible in your account.")
}
const questionBank={
 cells:[
 ["أي عضيّة مسؤولة عن معظم إنتاج ATP في الخلايا حقيقية النوى؟","Which organelle generates most ATP in eukaryotic cells?",["الميتوكوندريا","جهاز جولجي","النوية"],["Mitochondrion","Golgi apparatus","Nucleolus"],0,"التنفس الخلوي في الميتوكوندريا ينتج معظم ATP في الظروف الهوائية.","Mitochondria produce most ATP during aerobic cellular respiration."],
 ["ما وظيفة الغشاء البلازمي؟","What is the plasma membrane's principal role?",["حفظ المعلومات الوراثية","تنظيم مرور المواد","إنتاج الريبوسومات"],["Store DNA","Regulate movement of substances","Build ribosomes"],1,"الغشاء ينظم التبادل بين الخلية وبيئتها.","The membrane regulates exchange between the cell and its surroundings."],
 ["أين يوجد معظم الحمض النووي DNA في الخلية البشرية؟","Where is most DNA located in a human cell?",["السيتوبلازم","النواة","الليسوسوم"],["Cytoplasm","Nucleus","Lysosome"],1,"معظم DNA النووي موجود في نواة الخلية.","Most nuclear DNA is housed in the cell nucleus."]
 ],
 heart:[
 ["أي حجرة تضخ الدم إلى الدورة الدموية الجهازية؟","Which chamber pumps blood into systemic circulation?",["البطين الأيسر","الأذين الأيمن","البطين الأيمن"],["Left ventricle","Right atrium","Right ventricle"],0,"يضخ البطين الأيسر الدم عبر الشريان الأبهر.","The left ventricle pumps blood into the aorta."],
 ["إلى أين تحمل الشرايين الرئوية الدم؟","Where do pulmonary arteries carry blood?",["إلى الكليتين","إلى الرئتين","إلى الكبد"],["Kidneys","Lungs","Liver"],1,"تحمل الشرايين الرئوية الدم من البطين الأيمن إلى الرئتين.","Pulmonary arteries carry blood from the right ventricle to the lungs."],
 ["ما وظيفة الحاجز بين البطينين؟","What does the interventricular septum separate?",["الصمامات","البطين الأيمن والأيسر","الشرايين التاجية"],["Valves","Right and left ventricles","Coronary arteries"],1,"يفصل الحاجز بين البطينين الجانبين الأيمن والأيسر.","The septum separates the two ventricles."]
 ],
 method:[
 ["في إطار PICO، ماذا يعني حرف C؟","In PICO, what does C represent?",["Comparison","Citation","Cohort"],["Comparison","Citation","Cohort"],0,"C تشير عادة إلى مجموعة المقارنة أو التدخل البديل.","C usually refers to a comparison intervention or group."],
 ["أي عبارة أدق حول دراسة قائمة على الملاحظة فقط؟","Which statement is most accurate for observational studies?",["تثبت السببية دومًا","يمكن أن تكشف ارتباطات، لا تثبت السببية تلقائيًا","لا يمكن قياس أي متغير"],["Always prove causality","May reveal associations without automatically proving causality","Cannot measure variables"],1,"الارتباط لا يثبت السببية وحده.","Association alone does not establish causation."],
 ["ما فائدة خطة تحليل مسبقة؟","What is one benefit of a preregistered analysis plan?",["تقليل المرونة غير المعلنة في اختيار التحليلات","إلغاء الحاجة إلى البيانات","ضمان النتائج الإيجابية"],["Reduce undisclosed analytic flexibility","Remove need for data","Guarantee positive findings"],0,"التحديد المسبق للتحليلات يعزز الشفافية المنهجية.","Preregistration can improve analytic transparency."]
 ]
};
function renderQuest(){
 const host=$("nf-quest-board");if(!host)return;host.replaceChildren();
 $("nf-quest-result").replaceChildren();
 const chosen=questionBank[S.quest],form=elem("form","nf-quest-board"),header=elem("h3","",tr("اختر إجابة واحدة لكل سؤال ثم اعرض النتيجة التدريبية.","Choose one answer for each question, then see your practice result."));form.append(header);
 chosen.forEach((q,i)=>{const field=elem("fieldset","nf-question"),legend=elem("legend","",String(i+1)+" — "+tr(q[0],q[1]));field.append(legend);
  const labels=tr(q[2],q[3]);labels.forEach((label,j)=>{const l=elem("label","nf-choice"),input=elem("input");input.type="radio";input.name="q"+i;input.value=String(j);input.required=true;l.append(input,elem("span","",label));field.append(l)});form.append(field)
 });
 const submit=elem("button","nf-btn primary",tr("تحقق من إجاباتي","Check my answers"));submit.type="submit";form.append(submit);
 form.addEventListener("submit",async e=>{
  e.preventDefault();const answers=chosen.map((_,i)=>form.elements.namedItem("q"+i)?.value);
  if(answers.some(x=>x===undefined||x===""))return;
  const score=answers.reduce((sum,x,i)=>sum+(Number(x)===chosen[i][4]?1:0),0);
  const report=$("nf-quest-result");report.replaceChildren();
  const result=elem("article","nf-quest-result");
  result.append(elem("h3","",tr("النتيجة التدريبية: ","Practice score: ")+score+"/"+chosen.length));
  chosen.forEach((q,i)=>result.append(elem("p","",tr("السؤال ","Question ")+(i+1)+": "+tr(q[5],q[6]))));
  result.append(elem("small","",tr("هذه نتيجة تدريب ذاتي وليست درجة أكاديمية معتمدة.","This is a self-practice result, not a certified academic grade.")));report.append(result);
  if(S.db&&S.user){const {error}=await S.db.from("nfx_quest_attempts").insert({user_id:S.user.id,quest_id:S.quest,correct_count:score,total_count:chosen.length});
   info("quest",error?"ظهرت النتيجة محليًا، لكن لم يُحفظ سجل المحاولة.":"حُفظ سجل المحاولة التدريبية في حسابك.",error?"Practice scored locally but the attempt was not saved.":"Practice attempt saved to your account.",!!error);
   if(!error)await fetchQuest()
  }else info("quest","النتيجة محلية فقط. سجّل الدخول لحفظ سجل الممارسة.","Guest practice score is local only. Sign in to save an attempt.")
 });host.append(form);renderQuestHistory()
}
function renderQuestHistory(){
 const host=$("nf-quest-history");host.replaceChildren();if(!S.user)return;
 const rows=S.records.quest;if(!Array.isArray(rows))return;
 if(rows.length){const title=elem("h3","",tr("محاولاتي السابقة (تدريب فقط)","My recent attempts (practice only)"));host.append(title);
  for(const r of rows){const c=elem("article","nf-card");cardHead(c,r.quest_id+" · "+r.correct_count+"/"+r.total_count);row(c,fmt(r.created_at));host.append(c)}
 }
}
for(const [id,table,fields,key] of [
 ["nf-congress-form","nfx_congress_submissions",["display_name","title","abstract","track","public_consent"],"congress"],
 ["nf-press-form","nfx_manuscripts",["title","abstract","study_type","public_consent"],"press"],
 ["nf-mentor-form","nfx_mentor_profiles",["display_name","expertise","bio","public_consent"],"mentor"],
 ["nf-innovation-form","nfx_innovation_projects",["team_name","title","problem","solution","public_consent"],"innovation"],
 ["nf-wallet-form","nfx_badge_requests",["record_type","record_reference","description"],"wallet"]
])attachForm(id,table,fields,key);
d.querySelectorAll(".nf-tab").forEach(tab=>tab.addEventListener("click",()=>show(tab.dataset.key)));
d.querySelector(".nf-tabs").addEventListener("keydown",e=>{const i=keys.indexOf(S.active),step=e.key==="ArrowLeft"?-1:e.key==="ArrowRight"?1:0;if(!step)return;e.preventDefault();const next=keys[(i+step+keys.length)%keys.length];show(next);$("nf-tab-"+next).focus()});
d.querySelectorAll("[data-quest]").forEach(btn=>btn.addEventListener("click",()=>{S.quest=btn.dataset.quest;d.querySelectorAll("[data-quest]").forEach(b=>b.classList.toggle("active",b===btn));renderQuest()}));
$("nf-lang").addEventListener("click",()=>{S.lang=S.lang==="ar"?"en":"ar";switchLang()});
window.addEventListener("hashchange",()=>show(decodeURIComponent(location.hash.slice(1))));
S.active=keys.includes(location.hash.slice(1))?location.hash.slice(1):"evidence";
switchLang();show(S.active);authenticatedUI();boot();
})();