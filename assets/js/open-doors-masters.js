/* NABD Open Doors Master's Research Coach — independent practice only.
 * No fake official questions; no AI grading without explicit consent.
 * Static 81-question master's bank + parameterized generators, protected studio login,
 * timed 43 written + one oral simulation, true-key single/multi scoring.
 */
import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const db=createClient("https://zsmmmljgguycrvyrmakl.supabase.co",
 "sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM",
 {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const B=window.NabdOpenDoorsMasters;
if(!B)throw Error("MASTERS_BANK_NOT_LOADED");
const $=id=>document.getElementById(id);
const state={subject:"chemistry",lang:"ar",view:"home",arabic:false,
 practice:{kind:"single",deck:[],index:0,results:[],completed:false},
 exam:{phase:"ready",deck:[],oralChoices:[],oralSelected:0,index:0,endAt:0,oralChooseEndAt:0,interval:null,done:false,assessment:{}},
 busy:false,loggedIn:false,activeRecognition:null};
function T(ar,en){return state.lang==="en"?en:ar}
const el=(tag,text,cls)=>{
 const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=String(text);
 if(cls)e.className=cls;return e;
};
const append=(p,tag,text,cls)=>{const e=el(tag,text,cls);p.append(e);return e};
const randomInt=max=>Math.floor(Math.random()*max);
function shuffled(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function clear(node){node.replaceChildren()}
function showStatus(id,ar,en,error=false){const x=$(id);x.textContent=T(ar,en);x.style.color=error?"#ffc3b2":"#b4f2d7"}
function safeHref(url){try{const v=new URL(url);return v.protocol==="https:"?v.href:null}catch{return null}}
function addAnchor(area,label,url){
 const link=safeHref(url);if(!link)return;
 const a=append(area,"a",label);a.href=link;a.target="_blank";a.rel="noopener noreferrer";return a;
}
function sourceCard(s,container,mini=false){
 const v=B.SUBJECTS[s];if(!v)return;
 const article=el("article");append(article,"h3",T(v.ar,v.en));
 const linkRow=el("div",undefined,"source-links");
 addAnchor(linkRow,T("صفحة الماجستير الرسمية ↗","Official master's subject ↗"),v.page);
 addAnchor(linkRow,T("برنامج الماجستير PDF ↗","Master's program PDF ↗"),v.program);
 addAnchor(linkRow,T("نموذج المرحلة الثانية PDF ↗","Second Stage sample PDF ↗"),v.sample);
 article.append(linkRow);
 if(!mini){
  append(article,"p",T("موعد المادة المعلن 2026: ","Published 2026 subject date: ")+v.date+" · "+
   T("تحقق من موعدك النهائي في حساب المنحة.","Check your own booked exam slot in the official account."));
  if(v.archive?.length){
   const old=el("div",undefined,"source-links");
   for(const a of v.archive)addAnchor(old,T("أرشيف قديم: ","Historical sample: ")+a.year+" ↗",a.url);
   article.append(old);
   append(article,"p",T("تنبيه: تختلف بنية نماذج الأعوام السابقة عن تعليمات 2026، ولا يجوز افتراض أن الأسئلة القديمة تكررت.","Historical formats differ from 2026 rules; past samples are for practice, not repeated real exam items."));
  }
 }
 container.append(article);
}
function renderSources(){
 const area=$("masterSourcesContent");clear(area);
 sourceCard(state.subject,area);
 for(const subject of Object.keys(B.SUBJECTS)){
  if(subject===state.subject)continue;
  sourceCard(subject,area);
 }
 const rules=el("article");
 append(rules,"h3",T("القواعد والتعليمات الرسمية 2026","Official 2026 rules and instructions"));
 const links=el("div",undefined,"source-links");
 addAnchor(links,"Rules 2026 ↗","https://od.globaluni.ru/rules");
 addAnchor(links,"Proctored Stage 2 Guidelines 2026 ↗","https://od.globaluni.ru/images/2026/Guidelines_for_the_Open_Doors_Proctored_Second_Stage_ENG_2026.pdf");
 addAnchor(links,"Second Stage Rules PDF ↗","https://od.globaluni.ru/images/2026/Second_Stage_Rules_ENG_2026.pdf");
 rules.append(links);
 append(rules,"p",T("البرنامج والنموذج الحاليان مأخوذان من صفحات مسار الماجستير. الأرشيفات التاريخية تتوفر للمسارات التي تحققت روابطها فقط.","Current sample and program links are taken from the master's subject pages. Historical archives are included only where a verified public URL exists."));
 area.append(rules);
}
function renderCurriculum(){
 const area=$("masterCurriculumContent");clear(area);
 const v=B.SUBJECTS[state.subject];
 const head=el("article");append(head,"h3",T(v.ar,v.en));
 append(head,"p",T("برامج الماجستير المعلنة تحت هذا المسار: ","Master's degrees listed for this subject: ")+v.degrees.join(" · "));
 const links=el("div",undefined,"source-links");
 addAnchor(links,"Official Master's Syllabus ↗",v.program);
 addAnchor(links,"Official Subject ↗",v.page);head.append(links);area.append(head);
 v.fields.forEach(([en,ar,focus],idx)=>{
  const a=el("article");append(a,"span",String(idx+1).padStart(2,"0"),"field-index");
  append(a,"h3",T(ar,en));append(a,"p",focus);
  const n=B.subjectItems(state.subject,"single").filter(x=>x.topic.toLowerCase().includes(en.split(" ")[0].toLowerCase())).length;
  append(a,"p",T("تدريب نبض: حل مسائل مفاهيمية وكمية في هذا المجال، وافحص إجاباتك وفق المراجع.","NABD study method: solve conceptual and numerical tasks in this domain, then evaluate reasoning against the linked subject program."));
  area.append(a);
 });
}
function readHistory(){
 try{const s=JSON.parse(localStorage.getItem("nabd_masters_history_v1")||"[]");
  return Array.isArray(s)?s.slice(-70).filter(x=>x&&["single","multi","written","oral","mock"].includes(x.kind)):[];
 }catch{return []}
}
function saveHistory(kind,score,max){
 if(!["single","multi","written","oral","mock"].includes(kind)||!Number.isFinite(score)||!Number.isFinite(max)||max<=0)return;
 try{
  const a=readHistory();a.push({kind,subject:state.subject,score:Math.max(0,Math.min(max,score)),max,at:new Date().toISOString()});
  localStorage.setItem("nabd_masters_history_v1",JSON.stringify(a.slice(-70)));
 }catch{}
}
function renderProgress(){
 const area=$("masterProgressContent");clear(area);
 const history=readHistory(),bySubject=history.filter(x=>x.subject===state.subject);
 if(!history.length){
  append(area,"h3",T("لا توجد نتائج محفوظة بعد","No results yet"));
  append(area,"p",T("ابدأ تدريبًا أو محاكاة. يحفظ النظام ملخص الدرجات فقط محليًا في متصفح هذا الجهاز.","Complete practice or a mock. Only score summaries are saved locally in this browser."));return;
 }
 const total=bySubject.reduce((a,x)=>a+x.max,0),earned=bySubject.reduce((a,x)=>a+x.score,0);
 append(area,"h3",T("نتائج ","Results: ")+T(B.SUBJECTS[state.subject].ar,B.SUBJECTS[state.subject].en));
 append(area,"p",T("عدد المحاولات: ","Attempts: ")+bySubject.length+" · "+
  T("مجموع النقاط المقيمة: ","Assessed marks: ")+earned+"/"+total+
  (total?" ("+Math.round(100*earned/total)+"%)":""));
 const groups=["single","multi","written","oral","mock"],list=el("ul");
 for(const g of groups){
  const h=bySubject.filter(x=>x.kind===g);if(!h.length)continue;
  const num=h.reduce((a,x)=>a+x.score,0),den=h.reduce((a,x)=>a+x.max,0);
  append(list,"li",g.toUpperCase()+": "+num+"/"+den+" · "+h.length+
   T(" محاولة"," attempts")); }
 area.append(list);
 append(area,"p",T("حسّن أضعف نوع عبر إعدادات التدريب، ثم أعد الأسئلة المقالية بالشرح خطوة بخطوة. لا تضمن هذه النتائج الفوز في المنحة.",
   "Target your weakest format with another round, review extended solutions and focus on reasoning. These scores cannot predict a scholarship win."),"warn");
}
function download(name,content){
 const blob=new Blob([content],{type:"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=el("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),12000);
}
$("masterProgressExport").addEventListener("click",()=>download("nabd-open-doors-masters-progress.json",JSON.stringify(readHistory(),null,2)));
$("masterProgressClear").addEventListener("click",()=>{
 if(!confirm(T("هل تريد حذف ملخص درجات الماجستير من هذا الجهاز؟","Delete local master's score history from this browser?")))return;
 localStorage.removeItem("nabd_masters_history_v1");renderProgress();
});
function setLanguage(lang){
 state.lang=lang;document.documentElement.lang=lang;document.documentElement.dir=lang==="en"?"ltr":"rtl";
 for(const x of document.querySelectorAll("[data-ar][data-en]")){
  const value=x.getAttribute(lang==="en"?"data-en":"data-ar");
  if(x.tagName==="H1")x.innerHTML=value;
  else if(x.querySelector("input,select,textarea,button,a")){
   // Preserve nested form controls and links when switching language.
   const t=Array.from(x.childNodes).find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
   if(t)t.textContent=value+" ";
   else x.prepend(document.createTextNode(value+" "));
  }else x.textContent=value;
 }
 $("masterLanguage").textContent=lang==="en"?"العربية 🌐":"English 🌐";
 renderDashboard();renderCurriculum();renderSources();renderProgress();
 if(["single","multi","written","oral"].includes(state.view))renderPractice();
 if(state.view==="simulation")renderExam();
}
$("masterLanguage").addEventListener("click",()=>setLanguage(state.lang==="ar"?"en":"ar"));
function renderDashboard(){
 const s=B.SUBJECTS[state.subject];$("currentSubjectName").textContent=T(s.ar,s.en);
 $("currentSubjectDescription").textContent=T("تخصص الماجستير · موعد اختبار 2026: ","Master's subject · 2026 exam date: ")+s.date+
  " · "+T("الأسئلة التدريبية: ","Authored questions: ")+B.questions.filter(q=>q.subject===state.subject).length;
}
function changeSubject(subject){
 if(!B.SUBJECTS[subject]||subject===state.subject)return;
 if(state.exam.phase==="written"||state.exam.phase.startsWith("oral")){
  if(!confirm(T("تغيير التخصص سينهي المحاكاة الحالية. هل أنت متأكد؟","Changing subject ends the active mock. Continue?")))return;
  stopExam();
 }
 state.subject=subject;state.practice.deck=[];state.practice.results=[];state.exam.deck=[];state.arabic=false;
 for(const b of document.querySelectorAll("[data-subject]"))b.setAttribute("aria-pressed",String(b.dataset.subject===subject));
 renderDashboard();renderCurriculum();renderSources();renderProgress();
 if(["single","multi","written","oral"].includes(state.view)){
  $("masterPracticeQuestion").hidden=true;$("masterPracticeReport").hidden=true;$("masterPracticeSummary").hidden=true;$("masterPracticeActions").hidden=true;
  showStatus("masterPracticeStatus","تم تغيير تخصص الماجستير. ابدأ جولة جديدة.","Master's subject changed. Start a new practice round.");
 }
}
document.querySelectorAll("[data-subject]").forEach(b=>b.addEventListener("click",()=>changeSubject(b.dataset.subject)));
function showView(v){
 if(["single","multi","written","oral"].includes(v)){
  state.practice.kind=v;$("masterPracticeTitle").textContent=
   {single:T("🔘 الاختيار الواحد · ماجستير","🔘 Master's single-answer practice"),
    multi:T("☑️ الاختيار المتعدد · ماجستير","☑️ Master's multiple-answer practice"),
    written:T("✍️ المسائل المقالية المتقدمة","✍️ Master's advanced written responses"),
    oral:T("🎙️ التعبير الشفوي البحثي","🎙️ Master's scientific oral response")}[v];
  $("masterPracticeDescription").textContent=T("أسئلة بمستوى الماجستير من إعداد نبض؛ الترجمة والحل النموذجي وتصحيح الاختيارات متاحان. تقييم المقالة والشفوي قد يتطلب موافقة لخدمة AI.","Original master's-level questions; bilingual explanations and exact-key choice grading. Written/oral AI assessment requires explicit consent.");
  if(state.practice.deck.length&&state.practice.deck[0].q.kind!==v){
   state.practice.deck=[];state.practice.results=[];$("masterPracticeQuestion").hidden=true;
   $("masterPracticeReport").hidden=true;$("masterPracticeSummary").hidden=true;$("masterPracticeActions").hidden=true;
  }
 }
 state.view=v;
 for(const b of document.querySelectorAll("[data-view]")){
  const active=b.dataset.view===v;b.classList.toggle("active",active);
  if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
 }
 for(const section of document.querySelectorAll("[data-panel]")){
  section.hidden=section.dataset.panel!==( ["single","multi","written","oral"].includes(v)?"practice":v);
 }
 if(v==="home")renderDashboard();
 if(v==="curriculum")renderCurriculum();
 if(v==="sources")renderSources();
 if(v==="progress")renderProgress();
 if(v==="simulation")renderExam();
 if(["single","multi","written","oral"].includes(v))renderPractice();
 document.querySelector(".master-nav")?.scrollIntoView({block:"start",behavior:"smooth"});
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
function wrapper(q){
 return {q,order:q.options?shuffled(q.options.map((_,i)=>i)):[],
  chosen:[],text:"",photo:null,photoURL:null,grade:null,revealed:false};
}
function newDeck(kind,count,mode){
 let base=B.subjectItems(state.subject,kind),pool=mode==="generated"?[]:shuffled(base);
 if((kind==="single"||kind==="multi")&&mode!=="authored"){
  const countGen=mode==="generated"?count:Math.max(count-base.length,Math.ceil(count*.5));
  const seed=randomInt(1000000)+1;
  for(let i=0;i<countGen;i++)pool.push(B.generated(state.subject,kind,seed+i*19));
 }
 const picked=shuffled(pool).slice(0,count);
 if((kind==="written"||kind==="oral")&&mode==="generated")return shuffled(base).slice(0,count);
 return picked.map(wrapper);
}
function renderQuestion(qw,host,{mode="practice",locked=false,report=null}={}){
 clear(host);const q=qw.q,subject=B.SUBJECTS[q.subject];
 const meta=el("div",undefined,"question-meta");append(meta,"span",T(subject.ar,subject.en));
 append(meta,"span",q.topic);append(meta,"span",q.kind.toUpperCase()+" · "+q.points+" pts");
 append(meta,"span",q.origin==="NABD_MASTERS_GENERATED"?"GENERATED PRACTICE":"ORIGINAL NABD PRACTICE");
 host.append(meta);
 const en=append(host,"div",q.prompt_en,"question-en");en.lang="en";
 const translate=el("button",state.arabic?T("إخفاء الترجمة العربية","Hide Arabic translation"):T("إظهار الترجمة العربية","Show Arabic translation"),"button subtle translation-button");
 translate.type="button";translate.setAttribute("aria-pressed",String(state.arabic));
 translate.addEventListener("click",()=>{
  state.arabic=!state.arabic;
  if(mode==="practice")renderPractice();
  else renderExam();
 });host.append(translate);
 if(state.arabic&&q.prompt_ar){const ar=append(host,"div",q.prompt_ar,"question-ar");ar.lang="ar"}
 if(["single","multi"].includes(q.kind)){
  const area=el("div",undefined,"answer-options");
  for(let i=0;i<qw.order.length;i++){
   const index=qw.order[i],label=el("label",undefined,"answer-option");
   const input=el("input");input.type=q.kind==="single"?"radio":"checkbox";input.name="master-"+mode+"-"+q.id;
   input.value=String(index);input.checked=qw.chosen.includes(index);input.disabled=locked;
   input.addEventListener("change",()=>{
    if(locked)return;
    if(q.kind==="single")qw.chosen=[index];
    else qw.chosen=input.checked?[...qw.chosen,index]:qw.chosen.filter(x=>x!==index);
    if(mode==="practice")renderPractice();else renderExam();
   });
   const letter=append(label,"strong",String.fromCharCode(65+i));
   const body=el("span",undefined,"option-label");const eng=append(body,"span",q.options[index],"english");eng.lang="en";
   if(state.arabic&&q.options_ar?.[index]){const a=append(body,"span",q.options_ar[index],"arabic");a.lang="ar"}
   label.prepend(input);label.append(body);
   if(report&&q.correct.includes(index)){label.classList.add("correct");append(label,"em","✓")}
   else if(report&&qw.chosen.includes(index)){label.classList.add("wrong");append(label,"em","✗")}
   area.append(label);
  }
  host.append(area);
 }else{
  const field=el("textarea",undefined,"written-answer");field.value=qw.text;
  field.placeholder=T("اكتب آليات التفكير، الحسابات، وحدود الاستنتاج...","Explain mechanisms, calculations, evidence and limitations...");
  field.maxLength=6500;field.disabled=locked;field.setAttribute("aria-label",T("الإجابة المكتوبة","Written response"));
  field.addEventListener("input",()=>{qw.text=field.value});host.append(field);
  if(q.kind==="written"){
   const photo=el("label",undefined,"photo-field");
   append(photo,"span",T("📸 صورة اختيارية لخطوات الحل على الورق (JPG/PNG/WebP، حتى 4 MB)","📸 Optional handwritten solution photo (JPG/PNG/WebP, up to 4 MB)"));
   const inp=el("input");inp.type="file";inp.accept="image/jpeg,image/png,image/webp";inp.disabled=locked;
   inp.addEventListener("change",()=>{
    const file=inp.files?.[0];if(!file)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>4*1024*1024||file.size<200){
     showStatus("masterPracticeStatus","ارفع صورة صالحة أقل من 4 ميغابايت.","Use a valid image under 4 MB.",true);inp.value="";return;
    }
    qw.photo=file;if(qw.photoURL)URL.revokeObjectURL(qw.photoURL);
    qw.photoURL=URL.createObjectURL(file);
    const preview=host.querySelector(".photo-preview")||el("img",undefined,"photo-preview");
    preview.src=qw.photoURL;preview.alt="Handwritten answer preview";photo.append(preview);
   });
   photo.append(inp);append(photo,"small",T("لن تُرسل الصورة إلى أي مزود AI دون موافقتك الصريحة.","No image is sent to AI without your explicit consent."),"help");host.append(photo);
   if(qw.photoURL){const img=append(host,"img",undefined,"photo-preview");img.src=qw.photoURL;img.alt="Handwriting preview"}
  }
  if(q.kind==="oral"){
   const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
   if(Speech&&!locked){
    const btn=el("button",T("🎤 فرّغ الإجابة صوتيًا (قد يستخدم الجهاز خدمة سحابية)","🎤 Dictate answer (device may use cloud recognition)"),"button subtle");
    btn.type="button";btn.addEventListener("click",()=>{
     try{
      if(state.activeRecognition){state.activeRecognition.stop();state.activeRecognition=null;return}
      const rec=new Speech();rec.lang=state.lang==="ar"?"ar":"en-US";rec.interimResults=false;rec.continuous=false;
      rec.onresult=e=>{const phrase=Array.from(e.results).map(x=>x[0]?.transcript||"").join(" ");
       qw.text=(qw.text+" "+phrase).trim();field.value=qw.text;};
      rec.onerror=()=>{state.activeRecognition=null};
      rec.onend=()=>{state.activeRecognition=null};
      rec.start();state.activeRecognition=rec;
     }catch{showStatus("masterPracticeStatus","تعذر تشغيل التفريغ الصوتي في هذا المتصفح.","Speech recognition unavailable.",true)}
    });host.append(btn);
   }
   append(host,"small",T("التقييم الشفوي هنا يراجع محتوى النص، وليس النطق أو الطلاقة أو جودة التسجيل.","Oral grading here assesses transcript content only, not pronunciation, fluency or recording quality."),"muted");
  }
 }
}
function renderReview(parent,qw,grade){
 clear(parent);parent.hidden=false;
 const q=qw.q;
 append(parent,"h3",T("مراجعة وتصحيح","Solution & feedback"));
 if(grade&&Number.isFinite(grade.score)){
  append(parent,"div",grade.score+"/"+grade.max,"score");
  if(grade.partial)append(parent,"p",T("نتيجة جزئية من مراجعة ذاتية أو AI؛ ليست علامة رسمية.","Partial self/AI estimate; not an official mark."),"warn");
 }
 if(["single","multi"].includes(q.kind)){
  const got=grade?.selected||qw.chosen,letters=qw.order;
  append(parent,"p",T("اختيارك: ","You selected: ")+
   (got.length?got.map(i=>String.fromCharCode(65+letters.indexOf(i))).join(", "):"—"));
  append(parent,"p",T("الاختيارات الصحيحة: ","Correct options: ")+
   q.correct.map(i=>String.fromCharCode(65+letters.indexOf(i))).join(", "),"good");
  const list=el("ul");
  for(const [i,o] of q.options.entries()){
   const found=q.correct.includes(i);
   append(list,"li",(found?"✓ ":"✗ ")+o+(state.arabic&&q.options_ar?.[i]?" — "+q.options_ar[i]:""));
  }
  parent.append(list);
 }
 if(grade?.criteria?.length){
  const grid=el("div",undefined,"rubric");
  for(let i=0;i<q.rubric.length;i++){
   const c=q.rubric[i],r=grade.criteria[i]||{score:0};
   const box=el("div");append(box,"strong",T(c.ar,c.en));
   append(box,"small",(r.score||0)+"/"+c.points);
   if(r.feedback_ar||r.feedback_en)append(box,"small",T(r.feedback_ar||"",r.feedback_en||r.feedback_ar||""));
   grid.append(box);
  }parent.append(grid);
 }
 if(grade?.reason_ar||grade?.reason_en)append(parent,"p",T(grade.reason_ar||"",grade.reason_en||grade.reason_ar||""));
 if(grade?.missing_ar?.length||grade?.missing_en?.length){
  append(parent,"h4",T("أين ينقص الحل؟","What needs improvement?"));
  const u=el("ul");(state.lang==="ar"?grade.missing_ar:grade.missing_en||grade.missing_ar||[]).forEach(x=>append(u,"li",x));parent.append(u);
 }
 append(parent,"h4",T("الإجابة العلمية النموذجية","Worked reference answer"));
 if(q.kind==="single"||q.kind==="multi"){
  if(q.explanation_en){const p=append(parent,"p",q.explanation_en,"worked");p.dir="ltr"}
  if(q.explanation_ar){const p=append(parent,"p",q.explanation_ar,"worked ar");p.dir="rtl"}
 }else{
  const p=append(parent,"p",q.model_en,"worked");p.dir="ltr";
  const a=append(parent,"p",q.model_ar,"worked ar");a.dir="rtl";
 }
 if(q.kind==="multi")append(parent,"p",T("التصحيح من إعداد نبض: أي خيار خاطئ يلغي النقاط؛ الاختيارات الصحيحة الجزئية قد تمنح درجة جزئية. هذه ليست قاعدة Open Doors الرسمية.","NABD-only partial-credit rubric: a wrong selection earns zero; a correct-only subset may earn partial credit. Not official scoring."),"warn");
 if(["written","oral"].includes(q.kind))append(parent,"p",T("يمكن أن تختلف الإجابات العلمية الصحيحة عن النموذج. يجب فحص الاستدلال، لا مطابقة النص حرفيًا.","Other scientifically valid solutions may differ from the worked reference. Grade reasoning, not exact text."),"warn");
}
function gradeChoiceWrapper(qw){return B.gradeChoice(qw.q,qw.chosen)}
function practiceCurrent(){return state.practice.deck[state.practice.index]}
function renderPractice(){
 if(!["single","multi","written","oral"].includes(state.view))return;
 const st=state.practice,area=$("masterPracticeQuestion"),report=$("masterPracticeReport");
 if(!st.deck.length||st.deck[0].q.kind!==st.kind){
  area.hidden=true;report.hidden=true;$("masterPracticeActions").hidden=true;
  $("masterPracticeProgress").hidden=true;$("masterPracticeSummary").hidden=true;return;
 }
 const qw=practiceCurrent(),i=st.index,entry=st.results[i];
 $("masterPracticeProgress").hidden=false;$("masterPracticeActions").hidden=false;
 $("masterPracticeNumber").textContent=(i+1)+"/"+st.deck.length;
 $("masterPracticeMeter").style.width=Math.round((i+(entry?1:0))*100/st.deck.length)+"%";
 const earned=st.results.reduce((sum,x)=>sum+(x?.score||0),0);
 $("masterPracticeScore").textContent=earned+T(" نقطة"," points");
 area.hidden=false;renderQuestion(qw,area,{mode:"practice",locked:Boolean(entry),report:entry});
 $("masterPracticeCheck").disabled=Boolean(entry)||state.busy;
 $("masterPracticeNext").hidden=!entry;
 if(entry)renderReview(report,qw,entry);
 else{report.hidden=true;clear(report)}
 if(st.completed)renderPracticeSummary();
}
function startPractice(){
 const kind=state.practice.kind,asked=Number($("masterPracticeCount").value)||5;
 const mode=$("masterPracticeSource").value;
 state.practice.deck=newDeck(kind,asked,mode);
 state.practice.index=0;state.practice.results=[];state.practice.completed=false;
 $("masterPracticeSummary").hidden=true;renderPractice();
 if(!state.practice.deck.length)showStatus("masterPracticeStatus","لا توجد مهام متاحة لهذا الاختيار.","No tasks for this selection.",true);
 else showStatus("masterPracticeStatus","ابدأ بالحل ثم اطلب التصحيح. زر الترجمة يفتح النص العربي.","Solve each question then check. Use the translation toggle for Arabic.");
}
$("masterPracticeStart").addEventListener("click",startPractice);
async function imageData(file){
 if(!file)return null;
 const bitmap=await createImageBitmap(file);
 try{
  const factor=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));
  const c=document.createElement("canvas");c.width=Math.round(bitmap.width*factor);c.height=Math.round(bitmap.height*factor);
  const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(bitmap,0,0,c.width,c.height);
  let encoded=c.toDataURL("image/jpeg",.88).split(",")[1];
  if(encoded.length>2_800_000)encoded=c.toDataURL("image/jpeg",.69).split(",")[1];
  if(encoded.length>2_800_000)throw Error("IMAGE_TOO_LARGE");
  return {mime:"image/jpeg",base64:encoded,width:c.width,height:c.height};
 }finally{bitmap.close()}
}
async function AIgrade(qw,requireConsent){
 const q=qw.q;
 if(requireConsent!==true)throw Error("CONSENT_REQUIRED");
 if(qw.text.trim().length<12&&!qw.photo)throw Error("ANSWER_REQUIRED");
 const user=await db.auth.getUser();
 if(user.error||!user.data?.user)throw Error("AUTH_REQUIRED");
 const image=qw.photo?await imageData(qw.photo):null;
 const {data,error}=await db.functions.invoke("open-doors-essay-grade",{body:{
  question:{id:q.id,subject:q.subject,topic:q.topic,prompt_en:q.prompt_en,prompt_ar:q.prompt_ar,
   model_en:q.model_en,model_ar:q.model_ar,rubric:q.rubric},
  answer:qw.text.slice(0,6500),image
 }});
 if(error||!data?.ok||!data.result)throw Error(data?.error||"AI_UNAVAILABLE");
 if(data.result.readable===false)throw Error("UNREADABLE_IMAGE");
 if(!Number.isInteger(data.result.score)||data.result.score<0||data.result.score>10)throw Error("AI_INVALID_GRADE");
 const score=q.kind==="oral"?Math.round(data.result.score/2):data.result.score;
 return {...data.result,score,max:q.points,partial:true,provider:data.provider,mode:"AI_CONTENT_ONLY"};
}
function selfReview(qw,parent,onApply){
 const q=qw.q;const box=el("div",undefined,"feedback");
 append(box,"h3",T("معايير التصحيح الذاتي","Self-assessment criteria"));
 append(box,"p",T("ضع علامة لكل معيار أجبته بشكل صحيح؛ لا تُعتبر هذه درجة مصحح آلي.","Check only the criteria you genuinely met. This is not automated grading."));
 const arr=[];
 q.rubric.forEach(c=>{
  const label=el("label",undefined,"answer-option");
  const input=el("input");input.type="checkbox";
  label.append(input,el("span",T(c.ar,c.en)+" · "+c.points+"/10"));box.append(label);arr.push({input,points:c.points});
 });
 const button=el("button",T("اعتمد تقييمي الذاتي","Record self-assessment"),"button primary");
 button.type="button";button.addEventListener("click",()=>{
  const raw=arr.reduce((sum,item)=>sum+(item.input.checked?item.points:0),0);
  const score=q.kind==="oral"?Math.round(raw/2):raw;
  onApply({score,max:q.points,partial:true,mode:"SELF_REVIEW",criteria:arr.map(v=>({score:v.input.checked?v.points:0}))});
 });box.append(button);parent.append(box);
}
async function checkPractice(){
 const st=state.practice,qw=practiceCurrent();if(!qw||st.results[st.index]||state.busy)return;
 const q=qw.q;
 if(["single","multi"].includes(q.kind)){
  if(!qw.chosen.length){showStatus("masterPracticeStatus","اختر إجابة على الأقل أولًا.","Select at least one answer.",true);return}
  const grade=gradeChoiceWrapper(qw);st.results[st.index]=grade;
  saveHistory(q.kind,grade.score,grade.max);renderPractice();
  showStatus("masterPracticeStatus",grade.exact?"صحيح! راجع الشرح قبل الانتقال.":"راجع الاختيارات الصحيحة وسبب الخطأ.",grade.exact?"Correct! Review the explanation.":"Review the key and reasoning.");
  return;
 }
 const host=$("masterPracticeReport");clear(host);host.hidden=false;
 const controls=el("div",undefined,"feedback");
 append(controls,"h3",T("تصحيح متقدم للمقالي / الشفوي","Written / oral marking"));
 const consent=el("label",undefined,"answer-option"),check=el("input");check.type="checkbox";
 consent.append(check,el("span",T("أوافق على إرسال إجابتي والصورة الاختيارية إلى مزود ذكاء اصطناعي خارجي للتدريب فقط.","I consent to sending the answer and optional image to a third-party AI provider for practice marking only.")));controls.append(consent);
 const gradeBtn=el("button",T("🤖 صحح تلقائيًا حسب المعايير","🤖 Grade with AI rubric"),"button gold");
 gradeBtn.type="button";controls.append(gradeBtn);
 const hint=append(controls,"p",T("عند عدم توفر خدمة AI يمكنك متابعة الحل بالمراجعة الذاتية، دون اختراع علامة.","If AI is unavailable you can use self-review; no mark is fabricated."),"warn");
 host.append(controls);
 gradeBtn.addEventListener("click",async()=>{
  if(!check.checked){hint.textContent=T("وافق أولًا على إرسال الإجابة إلى المزوّد.","Provide explicit consent first.");return}
  state.busy=true;gradeBtn.disabled=true;hint.textContent=T("يحلل المزوّد خطوات الحل...","Analyzing reasoning and step-by-step answer...");
  try{
   const grade=await AIgrade(qw,check.checked);
   st.results[st.index]=grade;saveHistory(q.kind,grade.score,grade.max);renderPractice();
   showStatus("masterPracticeStatus","اكتمل التقدير التعليمي؛ راجع النقاط الناقصة.","Educational estimate complete. Review missing steps.");
  }catch(e){hint.textContent=T("التصحيح الآلي غير متاح حاليًا: ","AI grading unavailable: ")+String(e.message).slice(0,75);
  }finally{state.busy=false;gradeBtn.disabled=false}
 });
 selfReview(qw,host,grade=>{
  st.results[st.index]=grade;saveHistory(q.kind,grade.score,grade.max);renderPractice();
 });
}
$("masterPracticeCheck").addEventListener("click",checkPractice);
$("masterPracticeModel").addEventListener("click",()=>{
 const qw=practiceCurrent();if(!qw)return;
 const host=$("masterPracticeReport");renderReview(host,qw,stResult());
 if(!stResult()&&["written","oral"].includes(qw.q.kind))selfReview(qw,host,grade=>{
  state.practice.results[state.practice.index]=grade;saveHistory(qw.q.kind,grade.score,grade.max);renderPractice();
 });
});
function stResult(){return state.practice.results[state.practice.index]||null}
$("masterPracticeNext").addEventListener("click",()=>{
 const st=state.practice;
 if(st.index>=st.deck.length-1){st.completed=true;renderPracticeSummary();return}
 st.index++;renderPractice();
});
function renderPracticeSummary(){
 const st=state.practice,root=$("masterPracticeSummary");clear(root);root.hidden=false;
 $("masterPracticeQuestion").hidden=true;$("masterPracticeActions").hidden=true;$("masterPracticeReport").hidden=true;
 const sum=st.results.reduce((a,r)=>a+(r?.score||0),0),total=st.results.reduce((a,r)=>a+(r?.max||0),0);
 append(root,"h3",T("انتهت جولة الماجستير 🎓","Master's practice completed 🎓"));
 append(root,"div",sum+"/"+total,"score");
 const ul=el("ul");st.deck.forEach((d,i)=>append(ul,"li",d.q.topic+" · "+(st.results[i]?.score??"—")+"/"+d.q.points));root.append(ul);
 append(root,"p",T("الدرجات تدريبية. ركّز على شرح الأخطاء قبل تكرار المحاولة.","These are training marks; review reasoning before your next attempt."));
 const btn=el("button",T("ابدأ جولة جديدة","Start another round"),"button primary");btn.onclick=startPractice;root.append(btn);
}
function examCurrent(){return state.exam.deck[state.exam.index]}
function activeExam(){return state.exam.phase==="written"||state.exam.phase==="oral_select"||state.exam.phase==="oral_answer"}
function stopExam(){
 const e=state.exam;if(e.interval){clearInterval(e.interval);e.interval=null}
 if(state.activeRecognition){try{state.activeRecognition.stop()}catch{}state.activeRecognition=null}
 for(const w of e.deck){if(w.photoURL){URL.revokeObjectURL(w.photoURL);w.photoURL=null}}
 e.phase="ready";e.endAt=0;e.deck=[];e.oralChoices=[];e.done=false;e.assessment={};
 $("masterExamWorkspace").hidden=true;$("masterExamOral").hidden=true;
 $("masterExamClock").textContent="175:00";$("masterExamPhase").textContent="READY";
 $("masterExamResults").hidden=true;$("masterExamStart").disabled=false;
}
function startExam(){
 if(activeExam()&&!confirm(T("إلغاء المحاكاة الحالية وبدء أخرى؟","Replace your current mock exam?")))return;
 stopExam();const e=state.exam,exam=B.exam(state.subject,randomInt(1e9)+1);
 e.deck=exam.questions.map(wrapper);e.oralChoices=exam.oralChoices.map(wrapper);
 e.phase="written";e.index=0;e.endAt=Date.now()+175*60*1000;
 $("masterExamStart").disabled=true;
 e.interval=setInterval(tick,1000);renderExam();tick();
}
$("masterExamStart").addEventListener("click",startExam);
$("masterExamReset").addEventListener("click",()=>{
 if(activeExam()&&!confirm(T("إنهاء المحاكي وإلغاء الإجابات الحالية؟","Stop this mock and discard current answers?")))return;
 stopExam();
});
function tick(){
 const e=state.exam;if(!activeExam()){if(e.interval){clearInterval(e.interval);e.interval=null}return}
 const now=Date.now(),time=Math.max(0,e.endAt-now),s=Math.ceil(time/1000);
 $("masterExamClock").textContent=String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
 $("masterExamPhase").textContent=e.phase==="written"?"WRITTEN":e.phase==="oral_select"?"ORAL PREP":"ORAL";
 if(e.phase==="written"&&time<=0)finishWritten(true);
 if(e.phase==="oral_select"&&now>=e.oralChooseEndAt){e.phase="oral_answer";renderExam()}
 if((e.phase==="oral_select"||e.phase==="oral_answer")&&time<=0)finishExam();
}
function renderExamNavigation(){
 const e=state.exam,nav=$("masterExamNavigator");clear(nav);
 e.deck.forEach((w,i)=>{
  const btn=el("button",String(i+1));
  btn.type="button";btn.title=w.q.topic+" · "+w.q.kind;btn.className=w.q.kind==="written"?"written":"";
  if(w.chosen.length||w.text.trim().length||w.photo)btn.classList.add("answered");
  if(e.index===i)btn.classList.add("current");
  btn.addEventListener("click",()=>{if(e.phase==="written"){e.index=i;renderExam()}});
  nav.append(btn);
 });
}
function renderExam(){
 const e=state.exam;
 if(state.view!=="simulation")return;
 if(e.phase==="ready"){
  $("masterExamWorkspace").hidden=true;$("masterExamOral").hidden=true;
  $("masterExamResults").hidden=true;return;
 }
 if(e.phase==="written"){
  $("masterExamWorkspace").hidden=false;$("masterExamOral").hidden=true;
  $("masterExamResults").hidden=true;
  $("masterExamPosition").textContent=(e.index+1)+"/43";
  $("masterExamMeter").style.width=Math.round((e.index+1)*100/43)+"%";
  $("masterExamAnswered").textContent=e.deck.filter(x=>x.chosen.length||x.text.trim()||x.photo).length+" / 43";
  renderExamNavigation();renderQuestion(examCurrent(),$("masterExamQuestion"),{mode:"simulation"});
  $("masterExamPrevious").disabled=e.index===0;$("masterExamNext").disabled=e.index===42;
  return;
 }
 if(e.phase==="oral_select"||e.phase==="oral_answer"){
  $("masterExamWorkspace").hidden=true;$("masterExamOral").hidden=false;
  $("masterExamResults").hidden=true;
  const choices=$("masterExamOralChoices");clear(choices);
  e.oralChoices.forEach((w,i)=>{
   const label=el("label"),input=el("input");input.type="radio";input.name="mastersOralChoice";
   input.checked=e.oralSelected===i;input.disabled=e.phase==="oral_answer";
   input.addEventListener("change",()=>{e.oralSelected=i;renderExam()});
   label.append(input,el("span",T(w.q.prompt_ar,w.q.prompt_en)));choices.append(label);
  });
  const target=$("masterExamOralAnswer");clear(target);
  const current=e.oralChoices[e.oralSelected];
  if(e.phase==="oral_select"){
   append(target,"p",T("اختر موضوعك الآن؛ بعد 3 دقائق يبدأ وقت الإجابة البالغ دقيقتين.","Choose your prompt now. After 3 minutes, the two-minute answer window begins."),"warn");
  }else{
   renderQuestion(current,target,{mode:"simulation"});
  }
 }
}
$("masterExamPrevious").addEventListener("click",()=>{
 const e=state.exam;if(e.phase!=="written")return;e.index=Math.max(0,e.index-1);renderExam();
});
$("masterExamNext").addEventListener("click",()=>{
 const e=state.exam;if(e.phase!=="written")return;e.index=Math.min(42,e.index+1);renderExam();
});
function finishWritten(forced=false){
 const e=state.exam;if(e.phase!=="written")return;
 const unanswered=e.deck.filter(x=>!x.chosen.length&&!x.text.trim()&&!x.photo).length;
 if(!forced&&unanswered&& !confirm(T("لديك "+unanswered+" أسئلة دون إجابة. إنهاء الكتابي الآن؟",
  "You have "+unanswered+" unanswered written tasks. Finish now?")))return;
 e.phase="oral_select";e.endAt=Date.now()+5*60*1000;e.oralChooseEndAt=Date.now()+3*60*1000;
 e.oralSelected=0;renderExam();tick();
}
$("masterExamFinishWritten").addEventListener("click",()=>finishWritten(false));
$("masterExamFinishOral").addEventListener("click",()=>{
 const e=state.exam;if(!["oral_select","oral_answer"].includes(e.phase))return;
 finishExam();
});
function finishExam(){
 const e=state.exam;if(!activeExam())return;
 e.phase="finished";e.done=true;if(e.interval){clearInterval(e.interval);e.interval=null}
 $("masterExamClock").textContent="00:00";$("masterExamPhase").textContent="REVIEW";
 $("masterExamWorkspace").hidden=true;$("masterExamOral").hidden=true;$("masterExamStart").disabled=false;
 let earned=0,maximum=0;
 for(const w of e.deck){
  if(["single","multi"].includes(w.q.kind)){
   const result=B.gradeChoice(w.q,w.chosen);e.assessment[w.q.id]=result;
   earned+=result.score;maximum+=result.max;
  }
 }
 saveHistory("mock",earned,maximum);
 renderExamResults();
}
function renderExamResults(){
 const e=state.exam,root=$("masterExamResults");if(e.phase!=="finished"){root.hidden=true;return}
 clear(root);root.hidden=false;
 append(root,"h3",T("📊 تقرير محاكاة الماجستير","📊 Master's mock result"));
 const objective=e.deck.filter(w=>["single","multi"].includes(w.q.kind));
 const earned=objective.reduce((s,w)=>s+(e.assessment[w.q.id]?.score||0),0);
 const written=e.deck.filter(w=>w.q.kind==="written");
 const oral=e.oralChoices[e.oralSelected];
 const gradedExtra=[...written,oral].filter(w=>e.assessment[w.q.id]&&Number.isFinite(e.assessment[w.q.id].score));
 const points=gradedExtra.reduce((a,w)=>a+e.assessment[w.q.id].score,0),possible=gradedExtra.reduce((a,w)=>a+w.q.points,0);
 append(root,"div",(earned+points)+"/"+(70+possible),"score");
 append(root,"p",T("المصحح بمفتاح الإجابة: ","Choice-key confirmed: ")+earned+"/70. "+
  T("مقالي وشفوي تم تقييمهما: ","Evaluated written/oral: ")+gradedExtra.length+"/4. "+
  T("المجموع المعروض يشمل فقط الأسئلة التي تم تقييمها، ولا يمثل علامة رسمية من 105.","The displayed denominator includes only graded sections; it is not an official /105 score."),"warn");
 const list=el("ul");for(const w of objective){
  const gr=e.assessment[w.q.id];append(list,"li",w.q.topic+" · "+gr.score+"/"+gr.max+(gr.exact?" ✓":""));
 }root.append(list);
 append(root,"h4",T("تصحيح المقالي والشفوي /35 نقطة إضافية","Evaluate advanced written and oral sections /35"));
 const note=append(root,"p",T("التقييم الآلي يتطلب موافقة صريحة على إرسال النص والصورة، وأما التقييم الذاتي فلا يُرسل شيئًا إلى مزود AI.","AI grading requires explicit consent to share text and any image with a provider. Self-review sends nothing to AI."),"warn");
 for(const w of [...written,oral]){
  const section=el("div",undefined,"feedback");
  append(section,"h4",w.q.topic+" · "+w.q.points+" pts");
  append(section,"p",w.q.prompt_en);
  if(state.arabic)append(section,"p",w.q.prompt_ar,"worked ar");
  append(section,"p",T("إجابتك: ","Your response: ")+(w.text|| (w.photo?T("صورة مرفقة","Photo supplied"):T("لم تجب","Unanswered"))));
  const recorded=e.assessment[w.q.id];
  if(recorded){renderReview(section,w,recorded)}
  else{
   const consent=el("label",undefined,"answer-option");const checkbox=el("input");checkbox.type="checkbox";
   consent.append(checkbox,el("span",T("أوافق على معالجة الإجابة والصورة الاختيارية عبر مزود AI.","I consent to AI processing of this answer and optional image.")));section.append(consent);
   const ai=el("button",T("🤖 تصحيح تقديري","🤖 Provisional AI grading"),"button gold");
   ai.type="button";
   ai.addEventListener("click",async()=>{
    if(!checkbox.checked){note.textContent=T("يجب الموافقة صراحة على إرسال بيانات الإجابة.","Explicit consent is required.");return}
    ai.disabled=true;note.textContent=T("يجري تصحيح الخطوات…","Evaluating solution reasoning…");
    try{const grade=await AIgrade(w,true);e.assessment[w.q.id]=grade;saveHistory(w.q.kind,grade.score,grade.max);renderExamResults();}
    catch(err){note.textContent=T("الخدمة غير متاحة: ","AI grading unavailable: ")+String(err.message).slice(0,110);}
    finally{ai.disabled=false}
   });section.append(ai);
   selfReview(w,section,grade=>{e.assessment[w.q.id]=grade;saveHistory(w.q.kind,grade.score,grade.max);renderExamResults()});
   append(section,"h4",T("الحل النموذجي","Worked answer"));
   append(section,"p",w.q.model_en,"worked");
   if(state.arabic)append(section,"p",w.q.model_ar,"worked ar");
  }
  root.append(section);
 }
 const downloadBtn=el("button",T("تنزيل تقرير المحاكاة TXT","Download mock result TXT"),"button primary");
 downloadBtn.addEventListener("click",()=>{
  const lines=["NABD Open Doors Master Stage 2 Independent Mock","Subject: "+state.subject,"Date: "+new Date().toISOString(),
  "Confirmed choice score: "+earned+"/70","Written and oral are provisional / self-reviewed only."];
  for(const w of [...e.deck,oral]){
   const r=e.assessment[w.q.id];
   lines.push("","Question "+w.q.id,w.q.prompt_en,"Your answer: "+
    (w.q.kind==="single"||w.q.kind==="multi"?w.chosen.join(","):w.text.slice(0,6500)),
    "Score: "+(r?r.score+"/"+r.max:"not graded"),
    "Model: "+(w.q.model_en||w.q.explanation_en||""));
  }
  download("nabd-open-doors-masters-mock.txt",lines.join("\n"));
 });
 root.append(downloadBtn);
}
async function authorize(){
 $("mastersLoginStatus").textContent=T("جارٍ التحقق من الحساب والصلاحيات...","Checking account and permissions...");
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user){$("mastersAuth").hidden=false;$("masterApp").hidden=true;
  $("masterLogout").hidden=true;$("mastersLoginStatus").textContent=T("سجّل الدخول إلى حساب الأكاديمية.","Sign in with your Academy account.");return false}
 const {data,error:check}=await db.from("open_doors_questions").select("id").limit(1);
 if(check||!data?.length){
  $("mastersAuth").hidden=false;$("masterApp").hidden=true;$("masterLogout").hidden=true;
  $("mastersLoginStatus").textContent=T("هذا الحساب لا يملك صلاحية بوابة تدريب المدير الحالية.","This account is not authorized for the founder's training portal.");return false}
 state.loggedIn=true;$("mastersAuth").hidden=true;$("masterApp").hidden=false;$("masterLogout").hidden=false;
 $("masterBankCount").textContent=String(B.questions.length);
 showView("home");return true;
}
$("mastersLoginForm").addEventListener("submit",async e=>{
 e.preventDefault();const email=$("mastersEmail").value.trim(),password=$("mastersPassword").value;
 $("mastersLoginStatus").textContent=T("تسجيل الدخول...","Signing in...");
 const {error}=await db.auth.signInWithPassword({email,password});
 $("mastersPassword").value="";
 if(error){$("mastersLoginStatus").textContent=T("فشل الدخول. راجع بيانات الحساب.","Sign-in failed; check the account credentials.");return}
 await authorize();
});
$("masterLogout").addEventListener("click",async()=>{
 stopExam();await db.auth.signOut();state.loggedIn=false;$("masterApp").hidden=true;
 $("mastersAuth").hidden=false;$("masterLogout").hidden=true;$("mastersPassword").value="";
 $("mastersLoginStatus").textContent=T("تم تسجيل الخروج.","Signed out.");
});
setLanguage("ar");
authorize().catch(()=>{$("mastersLoginStatus").textContent=T("تعذر الاتصال حاليًا. أعد فتح الصفحة عند توفر الإنترنت.","Connection unavailable. Retry when online.")});
