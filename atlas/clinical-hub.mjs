import {clinicalCases} from "./clinical-cases.mjs";
import {grade,isFinished,comparePath,validateCase} from "./clinical-engine.mjs";

const texts={
  ar:{
    skip:"انتقل للمحتوى",pilot:"نسخة تعليمية تجريبية",title:"مستشفى نبض الافتراضي",
    lead:"اختر حالة سريرية خيالية، واتخذ قراراتك، ثم أعد أي قرار وقارن المسارات. تُحفظ محاولاتك على هذا الجهاز فقط.",
    attempts:"المحاولات المكتملة",storedLocal:"في هذا المتصفح فقط",
    selectCase:"اختر المهمة الطبية",disclaimer:"تدريب تعليمي غير معتمد، ولا يُستخدم لاتخاذ قرارات حول مرضى حقيقيين.",
    fictional:"حالة افتراضية",restart:"إعادة الحالة",completed:"أنهيت المهمة التدريبية.",
    downloadReport:"تنزيل تقرير المحاولة",tryAgain:"إعادة التجربة",
    history:"سجل التدريب على هذا الجهاز",
    historyNote:"هذا سجل تدريب محلي وليس شهادة رسمية، ويمكن فقدانه عند مسح بيانات المتصفح. لا توجد مزامنة مع حساب الطالب بعد.",
    medicalNotice:"تنبيه علمي: السيناريوهات مبسطة وغير معتمدة للاستخدام مع المرضى. يجب مراجعتها من مشرف طبي مختص قبل إتاحتها كتقييم رسمي.",
    online:"متصل",offline:"دون إنترنت",step:"القرار",of:"من",next:"القرار التالي",finish:"إنهاء المهمة",
    selected:"تم اختيار الإجابة",good:"قرار مناسب",review:"راجع هذا القرار",replay:"أعد هذا القرار",
    noHistory:"لم تكتمل أي محاولة على هذا الجهاز بعد.",record:"محاولة",score:"نتيجة تعليمية",
    compared:"نتيجة التجربة السابقة",comparedNew:"بعد تغيير القرار",diff:"تغيّر النقاط",
    replayNotice:"هذه مقارنة لنقاط التعلّم وليست توقعًا لنتيجة المريض.",saveWarning:"تعذّر الحفظ في ذاكرة المتصفح؛ ستفقد النتائج بعد إغلاق الصفحة.",
    exportFailure:"تعذّر إعداد التقرير المحلي.",resume:"متابعة المحاولة",start:"ابدأ المهمة"
  },
  en:{
    skip:"Skip to content",pilot:"Educational pilot",title:"NABD Virtual Hospital",
    lead:"Choose a fictional clinical case, make decisions, then replay any choice and compare learning paths. Your attempts stay on this device.",
    attempts:"Completed attempts",storedLocal:"On this browser only",
    selectCase:"Choose a clinical mission",disclaimer:"Unvalidated educational training; not for making decisions about real patients.",
    fictional:"Fictional training case",restart:"Restart case",completed:"You have finished this training mission.",
    downloadReport:"Download attempt report",tryAgain:"Try again",
    history:"Training history on this device",
    historyNote:"This is a local training record, not an official certificate. Clearing browser data can remove it. Student account sync is not available yet.",
    medicalNotice:"Clinical review required: these are simplified and unvalidated scenarios, not for patient care or formal assessment.",
    online:"Online",offline:"Offline",step:"Decision",of:"of",next:"Next decision",finish:"Complete mission",
    selected:"Answer selected",good:"Appropriate decision",review:"Review this decision",replay:"Replay this decision",
    noHistory:"No completed attempt has been saved on this device yet.",record:"Attempt",score:"Educational score",
    compared:"Previous learning score",comparedNew:"Score after replay",diff:"Point difference",
    replayNotice:"This compares learning points, not predicted patient outcomes.",saveWarning:"Browser storage was unavailable; progress may disappear when this page closes.",
    exportFailure:"Could not prepare the local report.",resume:"Resume attempt",start:"Start mission"
  }
};
const DRAFT_KEY="nabd_atlas_clinical_drafts_v1";
const HISTORY_KEY="nabd_atlas_clinical_history_v1";
const LANG_KEY="nabd_atlas_lang_v1";
const $=id=>document.getElementById(id);
function read(key,fallBack){
  try{let value=JSON.parse(localStorage.getItem(key));return value===null?fallBack:value;}catch{return fallBack;}
}
function write(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}
}
function t(key){return texts[language][key]||key;}
function label(pair){return pair?.[language]||"";}
let language=read(LANG_KEY,"ar")==="en"?"en":"ar";
let current=clinicalCases[0];
let picks=[],stepIndex=0,selectedAnswer=null,replayIndex=null,oldPath=null,reportMode=false,lastRecorded=null,lastGrade=null;
function loadDraft(id){
  const drafts=read(DRAFT_KEY,{});
  if(!drafts || typeof drafts!=="object" || !Object.hasOwn(drafts,id))return null;
  const item=clinicalCases.find(caseItem=>caseItem.id===id);
  const draft=drafts[id];
  if(!item||!draft || !Array.isArray(draft.picks) || !Number.isInteger(draft.step) || draft.step<0 || draft.step>=item.steps.length)return null;
  if(draft.picks.some((x,i)=> x!==null && x!==undefined && (!Number.isInteger(x)||x<0||x>=item.steps[i]?.options.length)))return null;
  if(draft.picks.slice(0,draft.step).some(x=>!Number.isInteger(x)))return null;
  return draft;
}
function persistDraft(){
  const drafts=read(DRAFT_KEY,{});
  const updated=drafts && typeof drafts==="object"&&!Array.isArray(drafts)?drafts:{};
  updated[current.id]={step:stepIndex,picks:[...picks],updatedAt:new Date().toISOString()};
  if(!write(DRAFT_KEY,updated))displaySaveWarning();
}
function clearDraft(){
  const drafts=read(DRAFT_KEY,{});
  if(drafts && typeof drafts==="object"){delete drafts[current.id];write(DRAFT_KEY,drafts);}
}
function displaySaveWarning(){
  const notice=document.getElementById("storageWarning");
  if(notice)notice.textContent=t("saveWarning");
}
function history(){
  const h=read(HISTORY_KEY,[]);
  return Array.isArray(h)?h.filter(x=>x && typeof x.caseId==="string" && Number.isFinite(x.score)).slice(-40):[];
}
function historyPaint(){
  const records=history();
  $("totalAttempts").textContent=records.length;
  const place=$("attemptHistory");place.replaceChildren();
  if(records.length===0){
    const empty=document.createElement("div");empty.className="history-empty";empty.textContent=t("noHistory");place.append(empty);return;
  }
  records.slice(-8).reverse().forEach((item)=>{
    const card=document.createElement("div");card.className="history-item";
    const caseItem=clinicalCases.find(x=>x.id===item.caseId);
    const name=document.createElement("strong");name.textContent=caseItem?label(caseItem.title):item.caseId;
    const score=document.createElement("span");score.textContent=t("score")+": "+item.score+"/"+item.maxPoints;
    const at=document.createElement("span");
    at.textContent=new Date(item.at).toLocaleString(language==="ar"?"ar":"en");
    card.append(name,score,at);place.append(card);
  });
}
function updateNetwork(){
  const online=navigator.onLine;$("networkStatus").textContent=t(online?"online":"offline");
  $("networkStatus").classList.toggle("off",!online);
}
function renderCaseButtons(){
  const container=$("caseList");container.replaceChildren();
  clinicalCases.forEach(item=>{
    const draft=loadDraft(item.id);
    const button=document.createElement("button");
    button.type="button";button.className="hub-case-button";
    button.setAttribute("aria-pressed",String(item.id===current.id));
    const name=document.createElement("strong");name.textContent=label(item.title);
    const sub=document.createElement("small");sub.textContent=label(item.category)+" • "+(draft?t("resume"):t("start"));
    button.append(name,sub);button.addEventListener("click",()=>activateCase(item.id));
    container.append(button);
  });
}
function activateCase(id,{reset=false}={}){
  const item=clinicalCases.find(x=>x.id===id);
  if(!item||!validateCase(item))return;
  current=item;const previous=reset?null:loadDraft(id);
  if(reset){const all=read(DRAFT_KEY,{});if(all && typeof all==="object"){delete all[id];write(DRAFT_KEY,all);}}
  picks=previous?[...previous.picks]:[];
  stepIndex=previous?previous.step:0;
  selectedAnswer=Number.isInteger(picks[stepIndex])?picks[stepIndex]:null;
  replayIndex=null;oldPath=null;reportMode=false;lastRecorded=null;lastGrade=null;
  $("caseReport").hidden=true;
  $("caseExercise").hidden=false;
  renderCaseButtons();
  renderStep();
}
function renderStep(){
  $("caseExercise").hidden=false;$("caseReport").hidden=true;
  $("caseTitle").textContent=label(current.title);
  $("patientDescription").textContent=label(current.patient);
  $("vitalHr").textContent=current.vitals?.hr||"—";
  $("vitalBp").textContent=current.vitals?.bp||"—";
  $("vitalSpo").textContent=current.vitals?.spo2||"—";
  const step=current.steps[stepIndex];
  $("stepCounter").textContent=t("step")+" "+(stepIndex+1)+" "+t("of")+" "+current.steps.length;
  $("stepTitle").textContent=label(step.title);
  $("stepDescription").textContent=label(step.description);
  const choices=$("optionList");choices.replaceChildren();
  step.options.forEach((option,index)=>{
    const button=document.createElement("button");
    button.type="button";button.className="answer";
    button.textContent=label(option);
    if(selectedAnswer!==null){button.disabled=true;if(selectedAnswer===index)button.classList.add("chosen");}
    button.addEventListener("click",()=>{
      if(selectedAnswer!==null)return;
      selectedAnswer=index;picks[stepIndex]=index;
      persistDraft();renderStep();
    });
    choices.append(button);
  });
  const feedback=$("stepFeedback"),next=$("nextStep");
  feedback.hidden=selectedAnswer===null;next.hidden=selectedAnswer===null;
  if(selectedAnswer!==null){
    const answer=step.options[selectedAnswer];
    feedback.classList.toggle("caution",answer.points===0);
    feedback.textContent=t(answer.points>0?"good":"review")+": "+label(answer.feedback);
    next.textContent=replayIndex!==null||stepIndex===current.steps.length-1?t("finish"):t("next");
  }
}
function proceed(){
  if(selectedAnswer===null)return;
  if(replayIndex!==null||stepIndex===current.steps.length-1){
    if(!isFinished(current,picks))return;
    renderReport({record:true});return;
  }
  stepIndex++;selectedAnswer=Number.isInteger(picks[stepIndex])?picks[stepIndex]:null;
  persistDraft();renderStep();
}
function renderReport({record=false}={}){
  if(!isFinished(current,picks))return;
  const info=grade(current,picks);
  const signature=current.id+":"+picks.join(",");
  if(record && signature!==lastRecorded){
    const attempts=history();
    const entry={caseId:info.caseId,score:info.score,maxPoints:info.maxPoints,at:new Date().toISOString(),answers:[...picks]};
    attempts.push(entry);
    if(!write(HISTORY_KEY,attempts.slice(-40)))displaySaveWarning();
    lastRecorded=signature;clearDraft();
  }
  lastGrade=info;reportMode=true;
  $("caseExercise").hidden=true;$("caseReport").hidden=false;
  $("caseTitle").textContent=label(current.title);
  $("patientDescription").textContent=label(current.patient);
  $("stepCounter").textContent=t("completed");
  $("finalScore").textContent=info.score+" / "+info.maxPoints;
  const compare=$("compareMessage");
  if(oldPath){
    const delta=comparePath(current,oldPath,picks);
    compare.hidden=false;
    compare.textContent=t("compared")+": "+delta.before+" / "+info.maxPoints+" · "+t("comparedNew")+": "+delta.after+" · "+t("diff")+": "+(delta.difference>=0?"+":"")+delta.difference+". "+t("replayNotice");
  }else{compare.hidden=true;compare.textContent="";}
  const list=$("decisionHistory");list.replaceChildren();
  current.steps.forEach((step,index)=>{
    const pick=picks[index],answer=step.options[pick];
    const box=document.createElement("article");box.className="hub-decision";
    const title=document.createElement("strong");title.textContent=label(step.title)+" — "+answer.points+"/"+Math.max(...step.options.map(x=>x.points));
    const detail=document.createElement("p");detail.textContent=label(answer.feedback);
    const button=document.createElement("button");button.type="button";button.textContent=t("replay");
    button.addEventListener("click",()=>{
      oldPath=[...picks];replayIndex=index;stepIndex=index;selectedAnswer=null;
      renderStep();
    });
    box.append(title,detail,button);list.append(box);
  });
  renderCaseButtons();historyPaint();
}
function exportAttempt(){
  if(!lastGrade)return;
  try{
    const entry={type:"NABD-ATLAS-LOCAL-TRAINING",v:1,caseId:current.id,score:lastGrade.score,maxPoints:lastGrade.maxPoints,decisions:lastGrade.decisions,notice:"Fictional educational demo; not a medical certificate or clinical competency assessment."};
    const blob=new Blob([JSON.stringify(entry,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="nabd-atlas-"+current.id+"-training.json";a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch{$("compareMessage").hidden=false;$("compareMessage").textContent=t("exportFailure");}
}
function translate(){
  document.documentElement.lang=language;document.documentElement.dir=language==="ar"?"rtl":"ltr";
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));
  $("languageToggle").textContent=language==="ar"?"English":"العربية";
  updateNetwork();renderCaseButtons();historyPaint();
  if(reportMode)renderReport();else renderStep();
}
$("languageToggle").addEventListener("click",()=>{
  language=language==="ar"?"en":"ar";write(LANG_KEY,language);translate();
});
$("nextStep").addEventListener("click",proceed);
$("restartCase").addEventListener("click",()=>activateCase(current.id,{reset:true}));
$("restartFromReport").addEventListener("click",()=>activateCase(current.id,{reset:true}));
$("exportAttempt").addEventListener("click",exportAttempt);
window.addEventListener("online",updateNetwork);window.addEventListener("offline",updateNetwork);
if("serviceWorker" in navigator){navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{});}
const storageWarning=document.createElement("p");storageWarning.id="storageWarning";storageWarning.className="muted small";
$("caseReport").after(storageWarning);
translate();
