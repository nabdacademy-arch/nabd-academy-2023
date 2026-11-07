/* NABD INFINITY V15 - all modules run locally except explicit on-demand CC0 GLB viewing.
   No question uploads. No student APIs, patient records, or generated medical claims. */
import {MODELS,MISSIONS,LIBRARY,BUILDINGS} from "./data.mjs";
const d=document;const by=id=>d.getElementById(id);
const state={lang:"ar",selectedModel:0,modelLive:false,section:false,selectedMission:0,step:0,picks:[],finished:false,reduced:matchMedia("(prefers-reduced-motion: reduce)").matches,store:false,progress:{models:[],missions:[],topics:[]},viewerRequest:0};
const STORE="nabd-infinity-progress-v1";
const trans=o=>o?.[state.lang]??"";
const choose=(ar,en)=>state.lang==="ar"?ar:en;
function el(tag,cls,txt){const x=d.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x}
function clean(node){node.replaceChildren()}
function status(id,ar,en){by(id).textContent=choose(ar,en)}
function save(){if(!state.store)return;try{localStorage.setItem(STORE,JSON.stringify({version:1,consent:true,progress:state.progress}))}catch(e){state.store=false;by("saveProgress").checked=false;status("progressStatus","تعذر تفعيل التخزين على هذا الجهاز.","Local storage is unavailable.")}}
function loadSaved(){try{const saved=JSON.parse(localStorage.getItem(STORE)||"null");if(saved?.version===1&&saved.consent===true){state.store=true;for(const [key,ids] of [["models",MODELS.map(x=>x.id)],["missions",MISSIONS.map(x=>x.id)],["topics",LIBRARY.map(x=>x.id)]])state.progress[key]=ids.filter(x=>saved.progress?.[key]?.includes(x));by("saveProgress").checked=true}}catch(e){/* Corrupted storage should not block learning. */}}
function record(kind,id){if(!state.progress[kind].includes(id)){state.progress[kind].push(id);save();renderStats()}}
function renderStats(){by("modelsCount").textContent=state.progress.models.length;by("missionsCount").textContent=state.progress.missions.length;by("mentorCount").textContent=state.progress.topics.length}
function renderModels(){clean(by("modelMenu"));MODELS.forEach((m,i)=>{const btn=el("button","model-btn"+(i===state.selectedModel?" active":""));btn.type="button";btn.setAttribute("aria-pressed",String(i===state.selectedModel));const icon=el("span","ico",m.icon);icon.setAttribute("aria-hidden","true");const title=el("span");title.append(el("strong","",choose(m.ar,m.en)),el("small","",m.code));btn.append(icon,title);btn.addEventListener("click",()=>selectModel(i,true));by("modelMenu").append(btn)});showModelText()}
function showModelText(){const m=MODELS[state.selectedModel];by("modelTag").textContent=m.code;by("modelIcon").textContent=m.icon;by("modelTitle").textContent=choose(m.ar,m.en);by("modelFact").textContent=trans(m.fact);by("modelPoster").src=m.poster;by("modelPoster").alt=choose("رسم توضيحي مجسّم لـ"+m.ar,"Dimensional illustration of "+m.en);clean(by("modelConcepts"));m.concepts[state.lang].forEach(c=>by("modelConcepts").append(el("span","",c)));by("modelSource").href=m.source;by("sectionModel").hidden=!m.section;by("sectionModel").textContent=state.section?choose("القلب من الخارج ↩","External heart view ↩"):choose("القلب من الداخل","Sectioned heart");by("loadModel").disabled=false}
function resetToImage(message=true){state.viewerRequest++;state.modelLive=false;const host=by("modelHost");clean(host);host.hidden=true;by("modelPoster").hidden=false;if(message)status("viewerStatus","تم فتح النسخة الخفيفة، دون الحاجة إلى الإنترنت.","Light image mode active; no network needed.")}
function selectModel(i,mark){if(i<0||i>=MODELS.length)return;state.selectedModel=i;state.section=false;resetToImage(false);renderModels();if(mark)record("models",MODELS[i].id);status("viewerStatus","اختر تحميل المجسم عند الحاجة؛ الصور المحلية تعمل دون إنترنت.","Load 3D only when needed; local preview images work offline.")}
let modulePromise=null;
function ensureViewer(){
 if(customElements.get("model-viewer"))return Promise.resolve();
 if(modulePromise)return modulePromise;
 modulePromise=new Promise((resolve,reject)=>{
   const script=d.createElement("script");script.type="module";script.crossOrigin="anonymous";
   script.src="https://cdnjs.cloudflare.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js";
   let settled=false;const finish=(err)=>{if(settled)return;settled=true;clearTimeout(timeout);if(err){script.remove();modulePromise=null;reject(err)}else resolve()};
   const timeout=setTimeout(()=>finish(new Error("viewer library timeout")),13000);
   script.addEventListener("error",()=>finish(new Error("viewer library unreachable")));
   script.addEventListener("load",()=>customElements.whenDefined("model-viewer").then(()=>finish()).catch(finish));
   d.head.append(script);
 });return modulePromise
}
async function open3D(){
 const i=state.selectedModel,m=MODELS[i],token=++state.viewerRequest;
 if(!navigator.onLine){status("viewerStatus","الإنترنت غير متاح. ستظل الصورة التعليمية متاحة.","Offline: the local educational illustration remains available.");return}
 by("loadModel").disabled=true;
 status("viewerStatus","جارٍ تحميل عارض المجسم. لا يتم تنزيل المجسم إلا بعد طلبك.","Loading the 3D viewer; models are fetched only at your request.");
 try{
  await ensureViewer();if(token!==state.viewerRequest||i!==state.selectedModel)return;
  const node=d.createElement("model-viewer");
  const modelUrl=state.section&&m.section?m.section:m.asset;
  node.setAttribute("src",modelUrl);node.setAttribute("alt",choose("مجسم ثلاثي الأبعاد تعليمي لـ"+m.ar,"3D teaching model of "+m.en));
  node.setAttribute("camera-controls","");node.setAttribute("interaction-prompt","none");node.setAttribute("shadow-intensity","0.7");node.setAttribute("exposure","1.3");node.setAttribute("camera-orbit","15deg 80deg auto");node.setAttribute("touch-action","pan-y");
  if(!state.reduced)node.setAttribute("auto-rotate","");
  node.addEventListener("load",()=>{if(token!==state.viewerRequest)return;state.modelLive=true;by("modelPoster").hidden=true;status("viewerStatus","اسحب المجسم لتدويره. النماذج تعليمية مبسطة وليست مرجعًا سريريًا.","Drag to rotate. Simplified teaching geometry; not a clinical reference.");record("models",m.id)});
  node.addEventListener("error",()=>{if(token!==state.viewerRequest)return;resetToImage(false);status("viewerStatus","لم ينجح تحميل المجسم. أعد المحاولة عند توفر اتصال أفضل.","Model could not load. Retry with a better connection.")});
  clean(by("modelHost"));by("modelHost").append(node);by("modelHost").hidden=false;
 }catch(error){if(token!==state.viewerRequest)return;resetToImage(false);status("viewerStatus","تعذّر تحميل مكتبة 3D. جرّب وضع الصورة أو اتصالًا آخر.","3D library unavailable. Try the image view or another connection.")}
 finally{if(token===state.viewerRequest)by("loadModel").disabled=false}
}
function chooseSection(){const m=MODELS[state.selectedModel];if(!m.section)return;state.section=!state.section;by("sectionModel").textContent=state.section?choose("القلب من الخارج ↩","External heart view ↩"):choose("القلب من الداخل","Sectioned heart");open3D()}
function prepareMission(){clean(by("missionMenu"));MISSIONS.forEach((m,i)=>{const b=el("button","mission-btn"+(i===state.selectedMission?" active":""));b.type="button";b.setAttribute("aria-pressed",String(i===state.selectedMission));const ic=el("span","mission-icon",m.icon);const text=el("span");text.append(el("strong","",choose(m.ar,m.en)),el("small","",trans(m.label)));b.append(ic,text);b.addEventListener("click",()=>startMission(i));by("missionMenu").append(b)});showMission()}
function startMission(i){state.selectedMission=i;state.step=0;state.picks=[];state.finished=false;prepareMission()}
function missionChoice(choice){const m=MISSIONS[state.selectedMission],q=m.questions[state.step];if(state.picks.length>state.step||choice<0||choice>=q.options.ar.length)return;state.picks.push(choice);showMission()}
function missionNext(){const m=MISSIONS[state.selectedMission];if(state.picks.length<=state.step)return;if(state.step===m.questions.length-1){state.finished=true;record("missions",m.id)}else state.step++;showMission()}
function showMission(){const m=MISSIONS[state.selectedMission],box=by("missionContent");by("missionCode").textContent="MISSION / "+String(state.selectedMission+1).padStart(2,"0");clean(box);box.append(el("h3","",choose(m.ar,m.en)),el("p","",trans(m.intro)));if(state.finished){const correct=state.picks.reduce((sum,c,i)=>sum+(c===m.questions[i].correct?1:0),0);box.append(el("div","mission-score",choose("اكتملت المهمة التعليمية — ","Mission complete — ")+correct+" / "+m.questions.length));box.append(el("p","",choose("هذا تقييم للمراجعة الذاتية وليس دليلًا على كفاءة سريرية.","This self-study score does not measure clinical competence.")));const retry=el("button","button secondary small",choose("أعد المحاولة ↺","Try again ↺"));retry.type="button";retry.addEventListener("click",()=>startMission(state.selectedMission));box.append(retry);return}
 const q=m.questions[state.step],n=state.step;
 box.append(el("span","mission-step",choose("الخطوة ","STEP ")+(n+1)+" / "+m.questions.length),el("p","mission-question",trans(q.q)));
 const choiceGroup=el("div","mission-choices");q.options[state.lang].forEach((answer,i)=>{const b=el("button","choice",answer);b.type="button";if(state.picks.length>n){b.disabled=true;if(i===q.correct)b.classList.add("correct");else if(i===state.picks[n])b.classList.add("incorrect")}else b.addEventListener("click",()=>missionChoice(i));choiceGroup.append(b)});box.append(choiceGroup);
 if(state.picks.length>n){const feedback=(state.picks[n]===q.correct?choose("إجابة صحيحة. ","Correct. "):choose("راجع التفسير: ","Review: "))+trans(q.why);box.append(el("p","mission-feedback",feedback));const next=el("button","button primary small",n===m.questions.length-1?choose("عرض النتيجة ←","View result →"):choose("الخطوة التالية ←","Next step →"));next.type="button";next.addEventListener("click",missionNext);box.append(next)}
}
function appendMessage(kind,title,body,link){const wrap=el("div","chat-bubble"+(kind==="user"?" user":""));if(title)wrap.append(el("strong","",title));if(body)wrap.append(el("p","",body));if(link){const a=el("a","",link.text);a.href=link.href;wrap.append(a)}by("chatLog").append(wrap);by("chatLog").scrollTop=by("chatLog").scrollHeight}
function cleanQuestion(v){return String(v||"").toLocaleLowerCase().normalize("NFKC").replace(/[\u064b-\u065f\u0670]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim()}
function responseFor(q){
 const value=cleanQuestion(q);
 if(!value)return null;
 if(/(?:\b(?:diagnose|diagnosis|dose|dosage|prescrib|treat|medicine|drug|patient|symptom)\b|تشخيص|جرعه|جرعات|وصفه|علاج|مريض|دواء|اعراض)/iu.test(value))return {unsafe:true};
 let best=null,score=0;
 for(const item of LIBRARY){let points=0;for(const term of item.words){const normalized=cleanQuestion(term);if(normalized.length>=3&&value.includes(normalized))points+=normalized.length>5?3:2}
 if(points>score){best=item;score=points}}
 return best&&score>0?{item:best}:null
}
function ask(value){const text=value.trim().slice(0,220);if(!text)return;appendMessage("user","",text);const r=responseFor(text);if(r?.unsafe){appendMessage("assistant",choose("تنبيه تعليمي","Educational note"),choose("لا أقدّم تشخيصًا أو علاجًا أو جرعات مخصصة. يمكنني شرح المفاهيم العامة، وللحالات الطبية الحقيقية ينبغي الرجوع إلى مختص.","I cannot provide personalized diagnosis, treatment or dosages. I can explain general concepts; for real cases consult a qualified professional."),{text:choose("اذهب للأطلس التعليمي ↗","Explore learning atlas ↗"),href:"#anatomy"});return}
 if(!r){appendMessage("assistant",choose("حدود المعرفة","Scope"),choose("لا يوجد لدي شرح موثّق لهذا السؤال في قاعدة المحتوى الحالية. جرّب سؤالًا عن القلب أو الرئتين أو الكلى أو الأعصاب أو البحث، أو افتح مكتبة نبض.","I don't have a curated explanation for that question. Try heart, lungs, kidneys, nerves or research, or visit the NABD learning library."),{text:choose("افتح مكتبة نبض ↗","Open NABD learning library ↗"),href:"../learning/"});return}
 const item=r.item;record("topics",item.id);appendMessage("assistant",item[state.lang].title,item[state.lang].body+"\n"+item[state.lang].tip,{text:choose("استكشف الدروس المرتبطة ↗","Explore related lessons ↗"),href:item.model?"#anatomy":"../research-starter-lab.html"})}
function renderSuggestions(){clean(by("mentorSuggestions"));const questions=state.lang==="ar"?["كيف يعمل القلب؟","أين يحدث تبادل الغازات؟","ما دور الكلى؟","كيف تنتقل الإشارات العصبية؟","ما معنى PICO في البحث؟"]:["How does the heart work?","Where does gas exchange happen?","What do kidneys do?","How do neurons communicate?","What is PICO in research?"];questions.forEach(q=>{const b=el("button","suggestion",q);b.type="button";b.addEventListener("click",()=>ask(q));by("mentorSuggestions").append(b)})}
function renderCampus(){clean(by("campusGrid"));BUILDINGS.forEach(building=>{const a=el("a","building");a.href=building.href;const head=el("div","building-top");const icon=el("span","building-icon",building.icon);icon.setAttribute("aria-hidden","true");head.append(icon,el("span","building-code",building.tag));a.append(head,el("h3","",choose(building.ar,building.en)),el("p","",trans(building.desc)),el("span","building-enter",choose("ادخل المساحة ↗","Enter space ↗")));by("campusGrid").append(a)})}
function setLanguage(next){
 state.lang=next;d.documentElement.lang=next;d.documentElement.dir=next==="ar"?"rtl":"ltr";d.title=choose("NABD INFINITY V15 | منظومة نبض الطبية","NABD INFINITY V15 | Medical Learning Ecosystem");
 d.querySelectorAll("[data-ar][data-en]").forEach(node=>node.textContent=node.getAttribute("data-"+next));
 d.querySelectorAll("[data-placeholder-ar][data-placeholder-en]").forEach(node=>node.placeholder=node.getAttribute("data-placeholder-"+next));
 by("langButton").textContent=next==="ar"?"EN":"عربي";by("langButton").setAttribute("aria-label",next==="ar"?"Switch language to English":"التحويل إلى العربية");
 renderModels();prepareMission();renderSuggestions();renderCampus();
 if(by("chatLog").children.length===0)welcome();
}
function welcome(){appendMessage("assistant",choose("أهلًا بك في نبض","Welcome to NABD"),choose("أنا مساعد دراسة محدود بالمحتوى المكتوب داخل هذه المنصة. اسأل عن مفهوم علمي أساسي؛ لا أرسل سؤالك إلى خادم.","I'm a content-grounded study assistant limited to the academy's curated notes. Ask a foundational question; I do not upload your query."))}
function legacyCopy(value){const area=el("textarea");area.value=value;area.setAttribute("readonly","");area.style.position="fixed";area.style.opacity="0";d.body.append(area);area.select();let ok=false;try{ok=d.execCommand("copy")}catch(e){}area.remove();return ok}
async function copyStats(){const text=[choose("NABD INFINITY — ملخص تعلّمي","NABD INFINITY — Study summary"),"Models: "+state.progress.models.length+"/6","Missions: "+state.progress.missions.length+"/5","Topics: "+state.progress.topics.length+"/7",...state.progress.models.map(id=>"- "+choose(MODELS.find(m=>m.id===id).ar,MODELS.find(m=>m.id===id).en))].join("\n");let ok=false;try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);ok=true}else ok=legacyCopy(text)}catch(e){ok=legacyCopy(text)}status("progressStatus",ok?"تم نسخ الملخص.":"تعذّر النسخ؛ تحقق من إذن المتصفح.",ok?"Summary copied.":"Copy unavailable; check browser permissions.")}
function init(){
 loadSaved();by("motionButton").addEventListener("click",()=>{state.reduced=!state.reduced;d.body.classList.toggle("no-motion",state.reduced);by("motionButton").setAttribute("aria-pressed",String(state.reduced));const viewer=by("modelHost").querySelector("model-viewer");if(viewer){if(state.reduced)viewer.removeAttribute("auto-rotate");else viewer.setAttribute("auto-rotate","")}});
 if(state.reduced)d.body.classList.add("no-motion");
 by("langButton").addEventListener("click",()=>setLanguage(state.lang==="ar"?"en":"ar"));
 by("loadModel").addEventListener("click",open3D);by("sectionModel").addEventListener("click",chooseSection);by("imageMode").addEventListener("click",()=>resetToImage(true));
 by("modelMission").addEventListener("click",()=>{const key=MODELS[state.selectedModel].related;const i=MISSIONS.findIndex(x=>x.id===key);if(i>=0)startMission(i);by("clinical").scrollIntoView({behavior:state.reduced?"auto":"smooth"})});
 by("mentorForm").addEventListener("submit",event=>{event.preventDefault();const input=by("mentorInput");ask(input.value);input.value="";input.focus()});
 by("saveProgress").addEventListener("change",event=>{state.store=event.target.checked;if(state.store){save();status("progressStatus","تم تفعيل الحفظ المحلي الاختياري.","Opt-in local saving enabled.")}else{try{localStorage.removeItem(STORE)}catch(e){}status("progressStatus","أُوقف الحفظ وحُذفت النسخة المحفوظة على الجهاز.","Saving disabled and existing local copy deleted.")}});
 by("clearProgress").addEventListener("click",()=>{state.progress={models:[],missions:[],topics:[]};state.store=false;by("saveProgress").checked=false;try{localStorage.removeItem(STORE)}catch(e){}renderStats();status("progressStatus","حُذفت بيانات التعلم المحلية وتوقف الحفظ.","Local study progress erased and saving disabled.")});
 by("copyProgress").addEventListener("click",copyStats);
 setLanguage("ar");renderStats();
 const localSecure=location.protocol==="http:"&&["localhost","127.0.0.1","[::1]"].includes(location.hostname);
 if("serviceWorker" in navigator&&(location.protocol==="https:"||localSecure)){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{}))}

}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init);else init();
