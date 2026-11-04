import {clinicalCases,clinicalDepartments} from "./clinical-cases.mjs";
import {grade,isFinished,comparePath,validateCase} from "./clinical-engine.mjs";

// NABD MEDVERSE: fully client-side fictional education simulation.
// This module does not access student accounts or real patient records.
const I18N={
  ar:{
    skip:"انتقل للمحتوى",view3d:"المستشفى 3D",pilot:"نسخة تعليمية تجريبية",title:"مستشفى نبض الافتراضي",
    lead:"اختر حالة سريرية خيالية، واتخذ قراراتك، ثم أعد أي قرار وقارن المسارات. تُحفظ محاولاتك على هذا الجهاز فقط.",
    attempts:"المحاولات المكتملة",storedLocal:"في هذا المتصفح فقط",casesCount:"حالات تدريبية",departmentsCount:"تخصصات متنوعة",
    selectCase:"اختر المهمة الطبية",disclaimer:"تدريب تعليمي غير معتمد، ولا يُستخدم لاتخاذ قرارات حول مرضى حقيقيين.",
    fictional:"حالة افتراضية",restart:"إعادة الحالة",completed:"أنهيت المهمة التدريبية.",
    downloadReport:"تنزيل تقرير المحاولة",tryAgain:"إعادة التجربة",history:"سجل التدريب على هذا الجهاز",
    historyNote:"هذا سجل تدريب محلي وليس شهادة رسمية، ويمكن فقدانه عند مسح بيانات المتصفح. لا توجد مزامنة مع حساب الطالب بعد.",
    medicalNotice:"تنبيه علمي: السيناريوهات مبسطة وغير معتمدة للاستخدام مع المرضى. يجب مراجعتها من مشرف طبي مختص قبل إتاحتها كتقييم رسمي.",
    online:"متصل",offline:"دون إنترنت",step:"القرار",of:"من",next:"القرار التالي",finish:"إنهاء المهمة",
    good:"قرار مناسب",partial:"قرار مناسب جزئيًا",review:"راجع هذا القرار",replay:"أعد هذا القرار",
    noHistory:"لم تكتمل أي محاولة على هذا الجهاز بعد.",score:"نتيجة تعليمية",compared:"قبل إعادة القرار",
    comparedNew:"بعد إعادة القرار",diff:"تغيّر النقاط",replayNotice:"هذه مقارنة لنقاط التعلّم وليست توقعًا لنتيجة المريض.",
    saveWarning:"تعذّر الحفظ في ذاكرة المتصفح؛ قد تفقد النتائج عند إغلاق الصفحة.",exportFailure:"تعذّر إعداد التقرير المحلي.",
    resume:"متابعة المحاولة",start:"ابدأ المهمة",searchLabel:"ابحث عن حالة",searchPlaceholder:"ابحث بالاسم أو التخصص",
    departmentLabel:"التخصص",levelLabel:"المستوى",allLevels:"جميع المستويات",introLevel:"مبتدئ",intermediateLevel:"متوسط",
    advancedLevel:"متقدم",noMatches:"لا توجد حالات مطابقة. جرّب تغيير البحث.",filtered:"الحالات الظاهرة",
    skillsTitle:"خريطة المهارات",decisionsTitle:"مراجعة القرارات",referenceTitle:"مراجع تعليمية ذات صلة",
    referenceNote:"روابط للقراءة العامة؛ لا تعني اعتماد السيناريو أو التحقق من دقته سريريًا.",
    clearHistory:"مسح سجل المحاولات المحلي",confirmClear:"هل تريد حذف سجل النتائج المحلي فقط؟ لا يمكن التراجع عن الحذف.",
    triage:"تمييز الخطورة",assessment:"جمع المعلومات",reasoning:"الاستدلال السريري",communication:"التسليم والتواصل",
    objective:"الهدف التعليمي",completeLabel:"تم الإنجاز",unreviewed:"مسودة غير معتمدة",noReferences:"لا توجد مراجع مضافة لهذه الحالة.",exploreWings:"استكشف أجنحة المستشفى الافتراضي",wingsHint:"اختر القسم",wingsNote:"خريطة تفاعلية للأقسام التعليمية، وليست مستشفى فعليًا أو مبنى ثلاثي الأبعاد.",wingCases:"حالة"
  },
  en:{
    skip:"Skip to content",view3d:"3D WORLD",pilot:"Educational pilot",title:"NABD Virtual Hospital",
    lead:"Choose a fictional clinical case, make decisions, then replay any choice and compare learning paths. Your attempts stay on this device.",
    attempts:"Completed attempts",storedLocal:"On this browser only",casesCount:"Learning cases",departmentsCount:"Across specialties",
    selectCase:"Choose a clinical mission",disclaimer:"Unvalidated educational training; not for making decisions about real patients.",
    fictional:"Fictional training case",restart:"Restart case",completed:"You have finished this training mission.",
    downloadReport:"Download attempt report",tryAgain:"Try again",history:"Training history on this device",
    historyNote:"This is a local training record, not an official certificate. Clearing browser data can remove it. Student account sync is not available yet.",
    medicalNotice:"Clinical review required: these are simplified and unvalidated scenarios, not for patient care or formal assessment.",
    online:"Online",offline:"Offline",step:"Decision",of:"of",next:"Next decision",finish:"Complete mission",
    good:"Appropriate decision",partial:"Partly appropriate",review:"Review this decision",replay:"Replay this decision",
    noHistory:"No completed attempt has been saved on this device yet.",score:"Educational score",compared:"Before replay",
    comparedNew:"After replay",diff:"Point difference",replayNotice:"This compares learning scores, not predicted patient outcomes.",
    saveWarning:"Browser storage is unavailable; results may disappear when you close this page.",exportFailure:"Could not prepare the local report.",
    resume:"Resume attempt",start:"Start mission",searchLabel:"Search cases",searchPlaceholder:"Search by name or specialty",
    departmentLabel:"Department",levelLabel:"Difficulty",allLevels:"All levels",introLevel:"Beginner",intermediateLevel:"Intermediate",
    advancedLevel:"Advanced",noMatches:"No matching cases. Try adjusting the filters.",filtered:"Cases shown",
    skillsTitle:"Learning competency map",decisionsTitle:"Review your decisions",referenceTitle:"Related educational reading",
    referenceNote:"Background links only; they do not validate or clinically endorse this scenario.",
    clearHistory:"Clear local attempt history",confirmClear:"Delete locally saved completion history only? This cannot be undone.",
    triage:"Recognize urgency",assessment:"Gather information",reasoning:"Clinical reasoning",communication:"Handover and communication",
    objective:"Learning goal",completeLabel:"Completed",unreviewed:"Unreviewed draft",noReferences:"No references listed for this case.",exploreWings:"Explore the virtual hospital wings",wingsHint:"Choose a department",wingsNote:"An interactive directory of educational departments, not a real hospital or 3D facility.",wingCases:"cases"
  }
};
const $=id=>document.getElementById(id);
const DRAFT_KEY="nabd_atlas_clinical_drafts_v1";
const HISTORY_KEY="nabd_atlas_clinical_history_v1";
const LANGUAGE_KEY="nabd_atlas_lang_v1";
const LAST_CASE_KEY="nabd_atlas_last_case_v1";
const SKILLS=["triage","assessment","reasoning","communication"];
const LINK_HOSTS=new Set(["www.who.int","www.cdc.gov","www.heart.org"]);
function safeRead(key,fallback){
  try{const item=localStorage.getItem(key);if(item===null)return fallback;const v=JSON.parse(item);return v??fallback;}catch{return fallback;}
}
function safeWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
let lang=safeRead(LANGUAGE_KEY,"ar")==="en"?"en":"ar";
const requestedDepartment=new URLSearchParams(location.search).get("department");
let selectedDepartment=clinicalDepartments.some(d=>d.id===requestedDepartment&&d.id!=="all")?requestedDepartment:"all";
let selectedLevel="all",searchQuery="";
let current=(selectedDepartment!=="all"?clinicalCases.find(item=>item.department===selectedDepartment):null)??clinicalCases.find(item=>item.id===safeRead(LAST_CASE_KEY,null))??clinicalCases[0],picks=[],stepIndex=0,selectedAnswer=null;
let replayBefore=null,reportMode=false,lastRecorded=null,lastGrade=null;
const tr=key=>I18N[lang][key]??key;
const tx=pair=>pair?.[lang]??"";
function difficulty(item){return tr(item.level==="advanced"?"advancedLevel":item.level==="intermediate"?"intermediateLevel":"introLevel");}
function skill(index){return tr(SKILLS[index]??"reasoning");}
function caseDepartment(item){return item.department??"emergency";}
function readDraft(caseId){
  const record=safeRead(DRAFT_KEY,{});
  const item=clinicalCases.find(v=>v.id===caseId);
  const draft=record && typeof record==="object" && !Array.isArray(record)?record[caseId]:null;
  if(!item || !draft || !Number.isInteger(draft.step)||draft.step<0||draft.step>=item.steps.length||!Array.isArray(draft.picks))return null;
  if(draft.picks.length>item.steps.length || draft.picks.slice(0,draft.step).some((n,i)=>!Number.isInteger(n)||n<0||n>=item.steps[i].options.length))return null;
  if(draft.picks.some((n,i)=>n!==null&&n!==undefined&&(!Number.isInteger(n)||n<0||n>=item.steps[i].options.length)))return null;
  return draft;
}
function warning(){
  $("storageWarning").textContent=tr("saveWarning");
}
function saveDraft(){
  const records=safeRead(DRAFT_KEY,{});
  const all=records && typeof records==="object"&&!Array.isArray(records)?records:{};
  all[current.id]={step:stepIndex,picks:[...picks],updatedAt:new Date().toISOString(),revision:current.revision??1};
  if(!safeWrite(DRAFT_KEY,all))warning();
}
function clearDraft(id){
  const records=safeRead(DRAFT_KEY,{});
  if(records && typeof records==="object"&&!Array.isArray(records)){delete records[id];safeWrite(DRAFT_KEY,records);}
}
function completionHistory(){
  const v=safeRead(HISTORY_KEY,[]);
  return Array.isArray(v)?v.filter(item=>item&&typeof item.caseId==="string"&&Number.isFinite(item.score)).slice(-40):[];
}
function renderHistory(){
  const records=completionHistory();
  $("totalAttempts").textContent=records.length;
  const target=$("attemptHistory");target.replaceChildren();
  if(!records.length){
    const empty=document.createElement("p");empty.className="history-empty";empty.textContent=tr("noHistory");
    target.append(empty);return;
  }
  records.slice(-8).reverse().forEach(entry=>{
    const card=document.createElement("div");card.className="history-item";
    const match=clinicalCases.find(item=>item.id===entry.caseId);
    const title=document.createElement("strong");title.textContent=match?tx(match.title):entry.caseId;
    const score=document.createElement("span");score.textContent=tr("score")+": "+entry.score+"/"+entry.maxPoints;
    const date=document.createElement("span");
    const timestamp=new Date(entry.at);date.textContent=Number.isFinite(timestamp.getTime())?timestamp.toLocaleString(lang==="ar"?"ar":"en"):"—";
    card.append(title,score,date);target.append(card);
  });
}
function updateConnection(){
  const online=navigator.onLine;
  $("networkStatus").textContent=tr(online?"online":"offline");
  $("networkStatus").classList.toggle("off",!online);
}
function renderFilters(){
  const select=$("departmentFilter");select.replaceChildren();
  clinicalDepartments.forEach(dept=>{
    const opt=document.createElement("option");opt.value=dept.id;opt.textContent=dept[lang];select.append(opt);
  });
  select.value=selectedDepartment;
  $("levelFilter").value=selectedLevel;
  $("searchCases").placeholder=tr("searchPlaceholder");
  $("totalCases").textContent=clinicalCases.length;
}
function renderDepartments(){
  const host=$("departmentTiles");host.replaceChildren();
  const icons={cardiology:"♡",neurology:"◈",emergency:"✚",respiratory:"◉",endocrine:"◇",gastro:"◎",surgery:"⚕",pediatrics:"✿",obstetrics:"◌",renal:"♢",toxicology:"△",trauma:"✦",mentalhealth:"☼"};
  clinicalDepartments.filter(item=>item.id!=="all").forEach(department=>{
    const count=clinicalCases.filter(item=>caseDepartment(item)===department.id).length;
    const button=document.createElement("button");button.type="button";button.className="wing-tile";
    button.setAttribute("aria-label",department[lang]+" · "+count+" "+tr("wingCases"));
    const icon=document.createElement("span");icon.className="wing-icon";icon.textContent=icons[department.id]||"✚";
    const name=document.createElement("strong");name.textContent=department[lang];
    const number=document.createElement("small");number.textContent=count+" "+tr("wingCases");
    button.append(icon,name,number);
    button.addEventListener("click",()=>{
      selectedDepartment=department.id;selectedLevel="all";searchQuery="";
      $("searchCases").value="";
      renderFilters();renderCatalog();
      $("caseList").scrollIntoView({behavior:"smooth",block:"start"});
    });
    host.append(button);
  });
}
function renderCatalog(){
  const target=$("caseList");target.replaceChildren();
  const done=new Set(completionHistory().map(row=>row.caseId));
  const query=searchQuery.trim().toLocaleLowerCase();
  const filtered=clinicalCases.filter(item=>{
    if(selectedDepartment!=="all" && selectedDepartment!==caseDepartment(item))return false;
    if(selectedLevel!=="all" && selectedLevel!==item.level)return false;
    const dept=clinicalDepartments.find(d=>d.id===caseDepartment(item));
    const search=[item.title.ar,item.title.en,item.category?.ar,item.category?.en,dept?.ar,dept?.en].filter(Boolean).join(" ").toLocaleLowerCase();
    return search.includes(query);
  });
  $("filterCount").textContent=tr("filtered")+": "+filtered.length+" / "+clinicalCases.length;
  $("caseEmpty").hidden=filtered.length!==0;
  filtered.forEach(item=>{
    const button=document.createElement("button");button.type="button";button.className="hub-case-button";
    button.setAttribute("aria-pressed",String(item.id===current.id));
    const label=document.createElement("strong");label.textContent=tx(item.title);
    const meta=document.createElement("small");
    meta.textContent=tx(item.category)+" · "+difficulty(item)+" · "+(readDraft(item.id)?tr("resume"):done.has(item.id)?tr("completeLabel"):tr("start"));
    const count=document.createElement("span");count.className="case-filter-tag";count.textContent=item.steps.length+" "+tr("step");
    button.append(label,meta,count);
    button.addEventListener("click",()=>activateCase(item.id));
    target.append(button);
  });
}
function renderReferences(){
  const target=$("referenceLinks");target.replaceChildren();
  let count=0;
  for(const value of current.references??[]){
    try{
      const url=new URL(value);
      if(url.protocol!=="https:"||!LINK_HOSTS.has(url.hostname))continue;
      const link=document.createElement("a");
      link.href=url.href;link.target="_blank";link.rel="noopener noreferrer";link.textContent=url.hostname+" ↗";
      target.append(link);count++;
    }catch{/* Only allow known, valid HTTPS references */}
  }
  if(!count){const empty=document.createElement("span");empty.textContent=tr("noReferences");target.append(empty);}
}
function renderProgress(done=false){
  const host=$("stageProgress");host.replaceChildren();
  current.steps.forEach((step,index)=>{
    const marker=document.createElement("span");
    marker.className="stage-chip"+(index<stepIndex||done?" done":"")+(index===stepIndex&&!done?" current":"");
    marker.textContent=(index+1)+" · "+skill(index);
    host.append(marker);
  });
}
function renderCaseHeader(){
  $("caseTitle").textContent=tx(current.title);
  $("patientDescription").textContent=tx(current.patient);
  $("caseObjectives").textContent=tr("objective")+": "+tx(current.objectives);
  $("caseLevel").textContent=difficulty(current)+" · "+tr("unreviewed");
  $("vitalHr").textContent=current.vitals?.hr??"—";
  $("vitalBp").textContent=current.vitals?.bp??"—";
  $("vitalSpo").textContent=current.vitals?.spo2??"—";
}
function activateCase(id,{reset=false}={}){
  const item=clinicalCases.find(candidate=>candidate.id===id);
  if(!item||!validateCase(item))return;
  current=item;
  safeWrite(LAST_CASE_KEY,id);
  if(reset)clearDraft(id);
  const draft=reset?null:readDraft(id);
  picks=draft?[...draft.picks]:[];
  stepIndex=draft?draft.step:0;
  selectedAnswer=Number.isInteger(picks[stepIndex])?picks[stepIndex]:null;
  replayBefore=null;reportMode=false;lastRecorded=null;lastGrade=null;
  renderCatalog();renderReferences();renderStep();
}
function renderStep(){
  if(!current)return;
  reportMode=false;
  $("caseReport").hidden=true;$("caseExercise").hidden=false;
  renderCaseHeader();renderProgress();
  $("stepCounter").textContent=tr("step")+" "+(stepIndex+1)+" "+tr("of")+" "+current.steps.length;
  const stage=current.steps[stepIndex];
  $("stepTitle").textContent=tx(stage.title);
  $("skillLabel").textContent=skill(stepIndex);
  $("stepDescription").textContent=tx(stage.description);
  const host=$("optionList");host.replaceChildren();
  stage.options.forEach((option,index)=>{
    const button=document.createElement("button");
    button.type="button";button.className="answer";button.textContent=tx(option);
    if(selectedAnswer!==null){
      button.disabled=true;
      if(selectedAnswer===index)button.classList.add("chosen");
    }
    button.addEventListener("click",()=>{
      if(selectedAnswer!==null)return;
      selectedAnswer=index;picks[stepIndex]=index;saveDraft();renderStep();
    });
    host.append(button);
  });
  const feedback=$("stepFeedback"),next=$("nextStep");
  feedback.hidden=selectedAnswer===null;next.hidden=selectedAnswer===null;
  if(selectedAnswer!==null){
    const answer=stage.options[selectedAnswer];
    feedback.classList.toggle("caution",answer.points===0);
    feedback.textContent=tr(answer.points===2?"good":answer.points===1?"partial":"review")+": "+tx(answer.feedback);
    next.textContent=replayBefore!==null||stepIndex===current.steps.length-1?tr("finish"):tr("next");
  }
}
function proceed(){
  if(selectedAnswer===null)return;
  if(replayBefore!==null||stepIndex===current.steps.length-1){
    if(isFinished(current,picks))renderReport({record:true});
    return;
  }
  stepIndex++;selectedAnswer=Number.isInteger(picks[stepIndex])?picks[stepIndex]:null;
  saveDraft();renderStep();
}
function renderSkillReport(){
  const target=$("skillReport");target.replaceChildren();
  current.steps.forEach((stage,index)=>{
    const selected=stage.options[picks[index]];
    const top=Math.max(...stage.options.map(x=>x.points));
    const row=document.createElement("div");row.className="skill-row";
    const title=document.createElement("span");title.textContent=skill(index);
    const score=document.createElement("span");score.textContent=selected.points+" / "+top;
    const track=document.createElement("div");track.className="skill-meter";
    const fill=document.createElement("div");fill.className="skill-meter-fill";
    fill.style.width=100*(top?selected.points/top:0)+"%";
    track.append(fill);row.append(title,score,track);target.append(row);
  });
}
function renderReport({record=false}={}){
  if(!isFinished(current,picks))return;
  const result=grade(current,picks),signature=current.id+":"+picks.join(",");
  if(record && signature!==lastRecorded){
    const records=completionHistory();
    records.push({caseId:current.id,score:result.score,maxPoints:result.maxPoints,at:new Date().toISOString(),answers:[...picks]});
    if(!safeWrite(HISTORY_KEY,records.slice(-40)))warning();
    lastRecorded=signature;clearDraft(current.id);
  }
  lastGrade=result;reportMode=true;
  $("caseExercise").hidden=true;$("caseReport").hidden=false;
  renderCaseHeader();renderProgress(true);
  $("stepCounter").textContent=tr("completed");
  $("finalScore").textContent=result.score+" / "+result.maxPoints;
  const compare=$("compareMessage");
  if(replayBefore){
    const change=comparePath(current,replayBefore,picks);
    compare.hidden=false;
    compare.textContent=tr("compared")+": "+change.before+" / "+result.maxPoints+" · "+tr("comparedNew")+": "+change.after+" · "+tr("diff")+": "+(change.difference>=0?"+":"")+change.difference+". "+tr("replayNotice");
  }else{compare.hidden=true;compare.textContent="";}
  renderSkillReport();
  const target=$("decisionHistory");target.replaceChildren();
  current.steps.forEach((stage,index)=>{
    const option=stage.options[picks[index]];
    const card=document.createElement("article");card.className="hub-decision";
    const title=document.createElement("strong");title.textContent=tx(stage.title)+" · "+option.points+"/"+Math.max(...stage.options.map(x=>x.points));
    const explanation=document.createElement("p");explanation.textContent=tx(option.feedback);
    const replay=document.createElement("button");replay.type="button";replay.textContent=tr("replay");
    replay.addEventListener("click",()=>{
      replayBefore=[...picks];stepIndex=index;selectedAnswer=null;
      renderStep();
    });
    card.append(title,explanation,replay);target.append(card);
  });
  renderHistory();renderCatalog();
}
function exportAttempt(){
  if(!lastGrade)return;
  try{
    const payload={kind:"NABD_ATLAS_EDUCATIONAL_SIMULATION",version:2,caseId:current.id,caseRevision:current.revision??1,score:lastGrade.score,maxPoints:lastGrade.maxPoints,decisions:lastGrade.decisions,medicalReview:"NOT_APPROVED_FOR_REAL_PATIENT_CARE",disclaimer:"This is not a clinical certificate."};
    const file=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(file);
    const a=document.createElement("a");a.href=url;a.download="nabd-atlas-"+current.id+"-practice.json";a.click();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  }catch{$("compareMessage").hidden=false;$("compareMessage").textContent=tr("exportFailure");}
}
function translate(){
  document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=tr(el.dataset.i18n));
  $("languageToggle").textContent=lang==="ar"?"English":"العربية";
  updateConnection();renderFilters();renderDepartments();renderHistory();renderCatalog();renderReferences();
  if(reportMode)renderReport();else renderStep();
}
$("languageToggle").addEventListener("click",()=>{lang=lang==="ar"?"en":"ar";safeWrite(LANGUAGE_KEY,lang);translate();});
$("searchCases").addEventListener("input",e=>{searchQuery=e.target.value;renderCatalog();});
$("departmentFilter").addEventListener("change",e=>{selectedDepartment=e.target.value;renderCatalog();});
$("levelFilter").addEventListener("change",e=>{selectedLevel=e.target.value;renderCatalog();});
$("clearHistory").addEventListener("click",()=>{
  if(!confirm(tr("confirmClear")))return;
  if(!safeWrite(HISTORY_KEY,[])){warning();return;}
  renderHistory();renderCatalog();
});
$("nextStep").addEventListener("click",proceed);
$("restartCase").addEventListener("click",()=>activateCase(current.id,{reset:true}));
$("restartFromReport").addEventListener("click",()=>activateCase(current.id,{reset:true}));
$("exportAttempt").addEventListener("click",exportAttempt);
window.addEventListener("online",updateConnection);window.addEventListener("offline",updateConnection);
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{});
const warningNode=document.createElement("p");warningNode.id="storageWarning";warningNode.className="muted small";
$("caseReport").after(warningNode);
activateCase(current.id);
translate();
