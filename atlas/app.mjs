import {scenario} from "./scenario-data.mjs";

const COPY = {
  ar:{
    skip:"تخطَّ إلى المحتوى",navigation:"استكشف أطلس",navHome:"الصفحة الرئيسية",navCase:"محاكاة الطوارئ",navOffline:"التعلم دون إنترنت",beta:"نموذج تجريبي مستقل وآمن",
    heroPill:"مستقبل التعليم الطبي يبدأ هنا",heroTitle:"تعلَّم الطب.\nعِش التجربة.",heroDesc:"بيئة تعليم طبي تفاعلية تجمع التعلم مع اتخاذ القرار السريري، وتبقى متاحة بعد تنزيل ملفاتها حتى عند انقطاع الإنترنت.",startNow:"ابدأ المحاكاة",prepareOffline:"جهّز النسخة دون إنترنت",disclaimer:"للتعليم والمحاكاة فقط؛ ليست إرشادات لعلاج المرضى.",
    statOne:"محاكاة تعليمية",statOneSub:"الطوارئ القلبية",statTwo:"خطوات قرار",statTwoSub:"مع تغذية راجعة",statThree:"العمل دون إنترنت",statThreeSub:"بعد تجهيز الملفات",statFour:"آخر نتيجة",statFourSub:"محفوظة على هذا الجهاز",
    discover:"ابدأ الاستكشاف",featuresTitle:"مساحتك الطبية الجديدة",featureCase:"أول حالة طوارئ افتراضية",featureCaseDesc:"تدرّب على ترتيب الأولويات وتلقي شرح لكل اختيار.",featureOffline:"تعلّم حتى دون اتصال",featureOfflineDesc:"نزّل هذه التجربة إلى ذاكرة المتصفح للاستخدام لاحقًا.",
    simTitle:"قسم الطوارئ الافتراضي",simSubtitle:"محاكاة قرارات سريرية تعليمية قصيرة، من دون بيانات مرضى حقيقيين.",demoBadge:"حالة تدريبية افتراضية",restart:"ابدأ من جديد",patientSafety:"سلامة التعلم",asideTitle:"تعلّم اتخاذ القرار",asideText:"السيناريو مبسط وغير معتمد للاستخدام في رعاية مرضى حقيقيين. تم تصميمه لتوضيح أولويات التقييم والتصعيد.",asideFoot:"يمكنك إعادة التجربة وتغيير قراراتك. النتيجة محفوظة محليًا على جهازك فقط.",
    offlineTitle:"تعليم مستمر، حتى عند انقطاع الشبكة.",offlineIntro:"يخزن هذا النموذج ملفات الواجهة والسيناريو محليًا. افتح هذه الصفحة مرة متصلًا بالإنترنت وجهّز النسخة، ثم يمكنك العودة لها لاحقًا دون اتصال.",
    offlinePack:"حزمة NABD ATLAS التجريبية",offlinePackDesc:"الواجهة + البرمجيات + الحالة السريرية الأولى. لا تشمل محاضرات خارجية أو تسجيل دخول Supabase.",download:"تنزيل الحزمة / تحديثها",
    offlineStepOne:"افتح التجربة متصلًا",offlineStepOneDesc:"يحتاج التحميل الأول إلى اتصال عبر HTTPS.",offlineStepTwo:"حمّل الملفات",offlineStepTwoDesc:"اضغط زر التنزيل وانتظر تأكيد جاهزية الملفات.",offlineStepThree:"أكمل بلا إنترنت",offlineStepThreeDesc:"افتح المسار نفسه، وخض المحاكاة؛ تحفظ نتائجك على هذا الجهاز.",
    offlineCaveat:"تنبيه: قد يحذف المتصفح الملفات المخزنة عند نقص المساحة أو مسح بيانات الموقع. الاتصال بين الأجهزة والمزامنة مع حساب الطالب ميزتان مستقبليتان غير مفعّلتين في هذا النموذج.",
    online:"متصل بالشبكة",offline:"دون اتصال",step:"القرار",of:"من",next:"القرار التالي",finish:"إنهاء المحاكاة",showReport:"عرض التقرير",good:"اختيار مناسب",review:"قرار يحتاج مراجعة",reportTitle:"تقرير المحاكاة",total:"نتيجتك التعليمية",outOf:"من 6 نقاط",replay:"إعادة هذا القرار",old:"النقاط السابقة",new:"النقاط الجديدة",compare:"مقارنة مسار القرار",ready:"جاهزة دون إنترنت",notReady:"لم تُجهّز بعد",unsupported:"التخزين غير مدعوم",downloading:"يجري حفظ الملفات...",downloaded:"تم حفظ الملفات الأساسية. يمكنك اختبارها بقطع الإنترنت وفتح الرابط نفسه.",downloadError:"تعذر تنزيل بعض الملفات. تحقق من الاتصال والمساحة وحاول مجددًا.",complete:"اكتملت الحالة. راجع القرارات أو أعد أحدها لاختبار مسار مختلف.",stepResult:"نقاط القرار",noStorage:"تعذر حفظ النتيجة محليًا على هذا الجهاز.",notReviewed:"المحتوى تجريبي، ويحتاج مراجعة علمية قبل اعتماده في أي تقييم رسمي."
  },
  en:{
    skip:"Skip to content",navigation:"EXPLORE ATLAS",navHome:"Overview",navCase:"Emergency simulation",navOffline:"Offline learning",beta:"Safe, standalone pilot",
    heroPill:"A new direction in medical education",heroTitle:"Study medicine.\nLive the experience.",heroDesc:"An interactive medical learning experience combining study and clinical decisions, available offline after downloading its files.",startNow:"Start simulation",prepareOffline:"Prepare offline pack",disclaimer:"Educational simulation only; not guidance for treating real patients.",
    statOne:"Learning scenario",statOneSub:"Cardiac emergency",statTwo:"Decision steps",statTwoSub:"With explanations",statThree:"Offline access",statThreeSub:"After download",statFour:"Latest score",statFourSub:"Saved on this device",
    discover:"EXPLORE",featuresTitle:"Your new medical learning space",featureCase:"Your first emergency case",featureCaseDesc:"Practice prioritizing decisions and learn from each choice.",featureOffline:"Learning without internet",featureOfflineDesc:"Download this experience for later use in your browser.",
    simTitle:"Virtual emergency department",simSubtitle:"A short educational clinical decision simulation with no real patient information.",demoBadge:"Fictional training scenario",restart:"Start again",patientSafety:"LEARNING SAFETY",asideTitle:"Learn clinical reasoning",asideText:"This simplified scenario is not validated for real patient care. It is designed to illustrate assessment and escalation priorities.",asideFoot:"You can restart and change your decisions. Scores are stored only on this device.",
    offlineTitle:"Keep learning when the network goes down.",offlineIntro:"This pilot stores the interface and scenario locally. Open it online once and download the pack; return to the same URL later without a connection.",
    offlinePack:"NABD ATLAS pilot pack",offlinePackDesc:"Interface + code + first scenario. Excludes external lessons and Supabase sign-in.",download:"Download / update pack",
    offlineStepOne:"Open while online",offlineStepOneDesc:"The initial download requires HTTPS internet access.",offlineStepTwo:"Download files",offlineStepTwoDesc:"Use the download button and wait for confirmation.",offlineStepThree:"Continue offline",offlineStepThreeDesc:"Reopen the same URL and complete the case; results stay on this device.",
    offlineCaveat:"Note: Browsers may evict cached files when storage is low or site data is cleared. Device-to-device communication and student-account synchronization are future features, not active in this pilot.",
    online:"Network detected",offline:"Offline",step:"Decision",of:"of",next:"Next decision",finish:"Complete simulation",showReport:"View report",good:"Appropriate choice",review:"Review this choice",reportTitle:"Simulation report",total:"Educational score",outOf:"out of 6 points",replay:"Replay this decision",old:"Previous points",new:"New points",compare:"Decision replay comparison",ready:"Offline pack ready",notReady:"Not downloaded",unsupported:"Storage unsupported",downloading:"Saving offline files...",downloaded:"Core files are saved. To test, disconnect and open this URL again.",downloadError:"Some files could not be saved. Check your connection and storage, then retry.",complete:"Case complete. Review your decisions or replay a step to compare choices.",stepResult:"Decision points",noStorage:"Your result could not be saved on this device.",notReviewed:"Pilot content requires clinical review before use in formal assessments."
  }
};
const PACK = ["./","./index.html","./styles.css","./app.mjs","./scenario-data.mjs","./manifest.webmanifest","./icon.svg"];
const CACHE = "nabd-atlas-foundation-v1";
const STORAGE = "nabd_atlas_demo_scores_v1";
const $ = (id) => document.getElementById(id);
let lang = "ar";
let stepIndex = 0;
let selectedIndex = -1;
let replayIndex = -1;
let beforeReplayPoints = null;
let picks = [];
let lastReportSignature = "";
function readLocal(key,fallback){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback;}catch{return fallback;}}
function saveLocal(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function t(key){return COPY[lang][key] || key;}
function local(pair){return pair[lang];}
function setView(view){
  ["home","case","offline"].forEach((name)=>{$("view-"+name).hidden = view!==name;});
  document.querySelectorAll("[data-view-button]").forEach((button)=>{
    const active=button.dataset.viewButton===view;
    button.classList.toggle("active",active);
    if(active){button.setAttribute("aria-current","page");}else{button.removeAttribute("aria-current");}
  });
  if(view==="case") renderStep();
  if(view==="offline") checkPack();
  window.scrollTo({top:0,behavior:"auto"});
}
function applyLanguage(value){
  lang=value==="en"?"en":"ar";
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  document.querySelectorAll("[data-i18n]").forEach((node)=>{
    const translation=t(node.dataset.i18n);
    node.textContent=translation;
    if(node.dataset.i18n==="heroTitle"){node.style.whiteSpace="pre-line";}
  });
  $("langBtn").textContent=lang==="ar"?"English":"العربية";
  saveLocal("nabd_atlas_lang_v1",lang);
  $("patientTitle").textContent=local(scenario.title);
  $("patientDetail").textContent=local(scenario.patient);
  renderConnection();
  renderStep();
  updateLastScore();
  checkPack();
}
function renderConnection(){
  const online=navigator.onLine;
  $("connection").classList.toggle("off",!online);
  $("connectionLabel").textContent=t(online?"online":"offline");
}
function updateLastScore(){
  const records=readLocal(STORAGE,[]);
  const recent=Array.isArray(records)?records.at(-1):null;
  $("lastScore").textContent=(recent && typeof recent.score==="number") ? recent.score+"/6" : "—";
}
function restart(){
  picks=[];
  stepIndex=0;
  selectedIndex=-1;
  replayIndex=-1;
  beforeReplayPoints=null;
  $("report").hidden=true;
  setView("case");
}
function renderStep(){
  const step=scenario.steps[stepIndex];
  if(!step)return;
  $("patientTitle").textContent=local(scenario.title);
  $("patientDetail").textContent=local(scenario.patient);
  $("caseProgress").textContent=t("step")+" "+(stepIndex+1)+" "+t("of")+" "+scenario.steps.length;
  $("questionTitle").textContent=local(step.title);
  $("questionDescription").textContent=local(step.description);
  const answers=$("answers");
  answers.replaceChildren();
  step.options.forEach((option,index)=>{
    const button=document.createElement("button");
    button.type="button";button.className="answer";
    button.textContent=local(option);
    if(selectedIndex!==-1){button.disabled=true;if(index===selectedIndex)button.classList.add("chosen");}
    button.addEventListener("click",()=>choose(index));
    answers.append(button);
  });
  const feedback=$("feedback");
  if(selectedIndex===-1){feedback.hidden=true;$("nextBtn").hidden=true;}
  else{
    const option=step.options[selectedIndex];
    feedback.hidden=false;
    feedback.classList.toggle("caution",option.points===0);
    let message=t(option.points===2?"good":"review")+": "+local(option.feedback);
    if(replayIndex!==-1 && beforeReplayPoints!==null){
      message+="\n"+t("compare")+": "+t("old")+" "+beforeReplayPoints+" — "+t("new")+" "+option.points;
    }
    feedback.textContent=message;
    $("nextBtn").hidden=false;
    $("nextBtn").textContent=replayIndex!==-1||stepIndex===scenario.steps.length-1?t("showReport"):t("next");
  }
}
function choose(index){
  if(selectedIndex!==-1)return;
  selectedIndex=index;
  picks[stepIndex]=index;
  renderStep();
}
function next(){
  if(selectedIndex===-1)return;
  if(replayIndex!==-1 || stepIndex===scenario.steps.length-1){
    replayIndex=-1;beforeReplayPoints=null;
    showReport();return;
  }
  stepIndex++;
  selectedIndex=-1;
  renderStep();
}
function showReport(){
  if(picks.length!==scenario.steps.length || picks.some((v)=>!Number.isInteger(v)))return;
  const score=picks.reduce((sum,index,step)=>sum+scenario.steps[step].options[index].points,0);
  const signature=picks.join(",");
  if(signature!==lastReportSignature){
    const records=readLocal(STORAGE,[]);
    const safeRecords=Array.isArray(records)?records.slice(-9):[];
    safeRecords.push({scenarioId:scenario.id,score:score,at:new Date().toISOString()});
    saveLocal(STORAGE,safeRecords);
    lastReportSignature=signature;
  }
  updateLastScore();
  $("questionTitle").textContent=t("reportTitle");
  $("questionDescription").textContent=t("complete");
  $("answers").replaceChildren();
  $("feedback").hidden=true;
  $("nextBtn").hidden=true;
  $("caseProgress").textContent=t("finish");
  const report=$("report");
  report.replaceChildren();
  report.hidden=false;
  const label=document.createElement("p");label.className="muted";label.textContent=t("total");
  const result=document.createElement("div");result.className="report-score";result.textContent=score+" / "+scenario.maxPoints;
  const warning=document.createElement("p");warning.className="muted";warning.textContent=t("notReviewed");
  const list=document.createElement("div");list.className="report-list";
  scenario.steps.forEach((step,index)=>{
    const option=step.options[picks[index]];
    const item=document.createElement("div");item.className="report-item";
    const heading=document.createElement("strong");heading.textContent=local(step.title)+" — "+option.points+"/2";
    const detail=document.createElement("span");detail.textContent=local(option.feedback);
    const button=document.createElement("button");button.type="button";button.textContent=t("replay");
    button.addEventListener("click",()=>{replayIndex=index;beforeReplayPoints=option.points;stepIndex=index;selectedIndex=-1;report.hidden=true;renderStep();});
    item.append(heading,detail,button);
    list.append(item);
  });
  report.append(label,result,warning,list);
}
function ensureScenario(){
  if($("report").hidden===false)return;
  renderStep();
}
async function checkPack(){
  const badge=$("cacheBadge");
  if(!("caches" in window)){badge.textContent=t("unsupported");return;}
  try{
    const ok=await Promise.all(PACK.map(async path=>Boolean(await caches.match(new URL(path,location.href)))));
    badge.textContent=t(ok.every(Boolean)?"ready":"notReady");
  }catch{badge.textContent=t("notReady");}
}
async function prepareOffline(){
  const message=$("downloadMessage");
  const button=$("downloadBtn");
  if(!("caches" in window)||!("serviceWorker" in navigator)){message.textContent=t("unsupported");return;}
  button.disabled=true;message.textContent=t("downloading");
  try{
    const registration=await navigator.serviceWorker.register("./sw.js",{scope:"./"});
    await navigator.serviceWorker.ready;
    const cache=await caches.open(CACHE);
    await cache.addAll(PACK);
    if(registration.waiting)registration.waiting.postMessage({type:"SKIP_WAITING"});
    message.textContent=t("downloaded");
  }catch(error){
    console.warn("NABD ATLAS cache preparation failed",error);
    message.textContent=t("downloadError");
  }finally{button.disabled=false;await checkPack();}
}
document.querySelectorAll("[data-view-button]").forEach(button=>button.addEventListener("click",()=>setView(button.dataset.viewButton)));
$("langBtn").addEventListener("click",()=>applyLanguage(lang==="ar"?"en":"ar"));
$("startHero").addEventListener("click",restart);
$("caseCard").addEventListener("click",restart);
$("offlineHero").addEventListener("click",()=>setView("offline"));
$("offlineCard").addEventListener("click",()=>setView("offline"));
$("restartBtn").addEventListener("click",restart);
$("nextBtn").addEventListener("click",next);
$("downloadBtn").addEventListener("click",prepareOffline);
window.addEventListener("online",renderConnection);
window.addEventListener("offline",renderConnection);
if("serviceWorker" in navigator){navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{});}
applyLanguage(readLocal("nabd_atlas_lang_v1","ar"));
setView("home");