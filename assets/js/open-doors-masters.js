/* NABD Open Doors Master's Studio — standalone independent bilingual practice.
 * Only founder-authorized visitors may use the studio. No official Open Doors login.
 * Correctness from independent NABD answer keys; written/oral AI scores provisional only.
 */
import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const client=createClient("https://zsmmmljgguycrvyrmakl.supabase.co","sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM",
 {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const bank=window.NABDOpenDoorsMastersBank;
const $=id=>document.getElementById(id);
const $$=s=>Array.from(document.querySelectorAll(s));
if(!bank)throw Error("MASTER_BANK_MISSING");
const SUBJECTS=["chemistry","biology","medicine"];
let lang="ar";
const T=(ar,en)=>lang==="ar"?ar:en;
const el=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt!==undefined&&txt!==null)x.textContent=String(txt);if(cls)x.className=cls;return x};
function para(parent,txt,cls){const p=el("p",txt,cls);parent.append(p);return p}
function button(parent,txt,handler,cls="action"){const b=el("button",txt,cls);b.type="button";if(handler)b.addEventListener("click",handler);parent.append(b);return b}
function cleanText(x){return String(x||"").slice(0,7000)}
function rnd(a){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[j],b[i]]=[b[i],b[j]]}return b}
function int(n,min,max){const x=Number(n);return Number.isInteger(x)&&x>=min&&x<=max?x:min}
function note(parent,ar,en){const p=para(parent,T(ar,en),"status");return p}
function headline(parent,kind,topic){const row=el("div",null,"step-labels");for(const x of [kind,topic])row.append(el("span",x));parent.append(row)}
function toggleLang(){
 lang=lang==="ar"?"en":"ar";
 document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";
 $$("[data-ar][data-en]").forEach(node=>{
  const value=node.getAttribute("data-"+lang);
  if(node.matches(".hero h1"))node.innerHTML=value;else node.textContent=value;
 });
 $("masterLang").textContent=lang==="ar"?"English 🌐":"العربية 🌐";
 for(const view of ["masterSingle","masterMulti"])if(practice[view].deck.length)renderPractice(view);
 if(written.pool.length)renderWritten();if(oral.item)renderOral();
 if(exam.active)renderExam();
 if(!document.querySelector('[data-panel="officialSources"]').hidden)renderSources();
 if(!document.querySelector('[data-panel="masterProgress"]').hidden)renderProgress();
}
$("masterLang").addEventListener("click",toggleLang);
function showView(v,scroll=true){
 const known=["dashboard","masterSingle","masterMulti","masterWritten","masterOral","masterExam","officialSources","masterProgress"];
 if(!known.includes(v))v="dashboard";
 $$("[data-view]").forEach(b=>{
  const yes=b.dataset.view===v;b.classList.toggle("active",yes);b.setAttribute("aria-selected",String(yes));
 });
 $$("[data-panel]").forEach(p=>p.hidden=p.dataset.panel!==v);
 if(v==="officialSources")renderSources();if(v==="masterProgress")renderProgress();
 if(location.hash!=="#"+v)history.replaceState(null,"","#"+v);
 if(scroll)$("masterApp").scrollIntoView({behavior:"smooth",block:"start"});
}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$$("[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goto)));
$("jumpMasters").addEventListener("click",e=>{e.preventDefault();showView("dashboard")});
$("goOfficial").addEventListener("click",e=>{e.preventDefault();showView("officialSources")});
function setupSubjects(){
 for(const select of $$(".subject-select")){
  select.replaceChildren();
  for(const s of SUBJECTS){const o=el("option",T(bank.SOURCES[s].ar,bank.SOURCES[s].name));o.value=s;select.append(o)}
  if(select.id.includes("Multi"))select.value="biology";
  if(select.id.includes("Written"))select.value="chemistry";
  if(select.id.includes("Oral"))select.value="biology";
 }
}
function authMessage(s){$("masterLoginStatus").textContent=s}
async function verify(){
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user)return false;
 const {data:probe,error:err}=await client.from("open_doors_questions").select("id").limit(1);
 return !err&&Array.isArray(probe)&&probe.length>0;
}
async function initialize(){
 try{
  if(await verify()){
   $("masterAuth").hidden=true;$("masterApp").hidden=false;$("masterLogout").hidden=false;
   showView(location.hash.slice(1)||"dashboard",false);
  }else{
   $("masterAuth").hidden=false;$("masterApp").hidden=true;$("masterLogout").hidden=true;
  }
 }catch{authMessage(T("تعذر التحقق من الحساب؛ تحقق من الاتصال.","Could not check your account; verify connectivity."))}
}
$("masterLogin").addEventListener("submit",async e=>{
 e.preventDefault();
 authMessage(T("جارٍ تسجيل الدخول والتحقق من الصلاحية…","Signing in and checking access…"));
 const email=$("masterEmail").value.trim(),password=$("masterPassword").value;
 const {error}=await client.auth.signInWithPassword({email,password});$("masterPassword").value="";
 if(error){authMessage(T("تعذر الدخول: ","Sign in failed: ")+error.message);return}
 if(!(await verify())){
  authMessage(T("هذا الحساب غير مخوّل لبنك Open Doors الخاص.","This account has no private Open Doors access."));return;
 }
 authMessage("");await initialize();
});
$("masterLogout").addEventListener("click",async()=>{await client.auth.signOut();$("masterAuth").hidden=false;$("masterApp").hidden=true;$("masterLogout").hidden=true;authMessage("")});
setupSubjects();await initialize();

// History contains only practice metadata and scores, never answers, photos, passwords, voice or patient data.
const HISTORY_KEY="nabd_open_doors_masters_history_v1";
function history(){try{const a=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");return Array.isArray(a)?a.slice(-120):[]}catch{return []}}
function logResult(data){
 const record={at:new Date().toISOString(),type:data.type,subject:data.subject,earned:data.earned,
  possible:data.possible,method:data.method||"answer-key"};
 try{const a=history();a.push(record);localStorage.setItem(HISTORY_KEY,JSON.stringify(a.slice(-120)))}catch{}
}
function downloadText(name,content){
 const blob=new Blob([content],{type:"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=el("a");a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
}
function renderSources(){
 const root=$("masterSourcesList");root.replaceChildren();
 for(const subject of SUBJECTS){
  const src=bank.SOURCES[subject],card=el("article",null,"source-card");
  card.append(el("h3",T(src.ar,src.name)));
  para(card,T("صفحة Open Doors الرسمية لهذا المسار تحديدًا، مع نموذج المرحلة الثانية وبرنامج الموضوع.","Official Master's subject page with a published second-stage sample and subject program."));
  for(const [text,url] of [["Official Master's subject",src.page],["Second-round Master's sample PDF",src.demo],["Master's program/syllabus",src.syllabus],...(src.older?[["Older official format demo (archive)",src.older]]:[])]){
   const a=el("a",text+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";card.append(a);
  }
  const title=el("h4",T("موضوعات الماجستير المستهدفة","Graduate focus"));card.append(title);
  const ul=el("ul");src.topics.forEach(t=>ul.append(el("li",t)));card.append(ul);root.append(card);
 }
}
function renderProgress(){
 const root=$("masterProgressBoard"),h=history();root.replaceChildren();
 const all=h.length,earned=h.reduce((a,b)=>a+Number(b.earned||0),0),possible=h.reduce((a,b)=>a+Number(b.possible||0),0);
 const grid=el("div",null,"stat-grid");
 for(const [a,b] of [[String(all),T("محاولات مسجلة","Recorded practice sessions")],[String(earned),T("نقاط صحيحة/مقيّمة","Scored points")],
   [String(possible),T("إجمالي النقاط المقيّمة","Total assessed points")],[possible?Math.round(earned/possible*100)+"%":"—",T("نسبة النقاط المحسوبة","Assessed percentage")]]){
  const cell=el("div");cell.append(el("strong",a),el("span",b));grid.append(cell);
 }
 root.append(grid);
 if(!h.length){para(root,T("لا توجد نتائج مخزنة حتى الآن.","No locally saved results yet."));return}
 const table=el("table",null,"history"),tr=el("tr");
 for(const head of [T("التاريخ","Date"),T("النمط","Mode"),T("التخصص","Subject"),T("الدرجة المحسوبة","Assessed score")])tr.append(el("th",head));
 const thead=el("thead");thead.append(tr);table.append(thead);
 const body=el("tbody");h.slice().reverse().slice(0,25).forEach(r=>{
  const row=el("tr");
  for(const value of [r.at.slice(0,10),r.type,bank.SOURCES[r.subject]?.ar||r.subject,r.earned+"/"+r.possible])row.append(el("td",value));
  body.append(row);
 });table.append(body);root.append(table);
}
$("masterExport").addEventListener("click",()=>downloadText("nabd-masters-progress.json",JSON.stringify(history(),null,2)));
$("masterClear").addEventListener("click",()=>{
 if(!confirm(T("حذف سجل تدريب الماجستير من هذا الجهاز نهائيًا؟","Permanently clear the Master's practice log on this device?")))return;
 localStorage.removeItem(HISTORY_KEY);renderProgress();
});
// Preparation decks: authored examples + endlessly parameterized numeric reasoning with localized sources.
function makeDeck(subject,kind,count,source="mixed"){
 let curated=bank.available(subject,kind),deck=[];
 if(source==="curated"){
  deck=rnd(curated);
  if(deck.length<count)deck=deck.concat(Array.from({length:count-deck.length},(_,i)=>bank.generated(subject,kind,10000+i)));
 }else if(source==="generated"){
  const seed=Math.floor(Math.random()*500000);
  deck=Array.from({length:count},(_,i)=>bank.generated(subject,kind,seed+i));
 }else{
  const maxStatic=Math.min(curated.length,Math.ceil(count*.45));
  deck=rnd(curated).slice(0,maxStatic);
  const seed=Math.floor(Math.random()*500000);
  for(let i=0;deck.length<count;i++)deck.push(bank.generated(subject,kind,seed+i));
 }
 return rnd(deck.slice(0,count)).map(q=>({q,order:q.options?rnd(q.options.map((_,i)=>i)):[]}));
}
// Question & option presentation. Data travels into DOM through textContent, never HTML.
function drawPrompt(root,q,showAr){
 root.append(el("div",q.prompt_en,"problem-en"));
 if(showAr&&q.prompt_ar)root.append(el("div",q.prompt_ar,"problem-ar"));
}
function drawOptions(root,q,order,selected,locked,showAr,onChange,review=null){
 const out=el("div",null,"answer-options");
 for(let i=0;i<order.length;i++){
  const original=order[i],lab=el("label",null,"answer-option");
  const control=el("input");control.type=q.kind==="single"?"radio":"checkbox";control.value=String(original);
  control.name="answer-choice-"+q.id;control.checked=selected.has(original);control.disabled=locked;
  if(review?.right.includes(original))lab.classList.add("correct");
  if(review?.wrong.includes(original))lab.classList.add("incorrect");
  control.addEventListener("change",()=>{
   if(locked)return;
   if(q.kind==="single"){selected.clear();selected.add(original)}
   else if(control.checked)selected.add(original);else selected.delete(original);
   onChange?.();
  });
  const txt=el("span",null,"opt-text");
  txt.append(el("strong",q.options[original]));
  if(showAr&&q.options_ar?.[original])txt.append(el("small",q.options_ar[original]));
  lab.append(control,el("span",String.fromCharCode(65+i),"letter"),txt);
  if(review?.right.includes(original))lab.append(el("b","✓"));
  else if(review?.wrong.includes(original))lab.append(el("b","✗"));
  out.append(lab);
 }
 root.append(out);
}
function drawExplanation(root,q,grade,showAr){
 const block=el("div",null,"feedback");
 block.append(el("h3",T("التصحيح وشرح الخيارات","Answer review and explanation")));
 block.append(el("div",grade.score+"/"+grade.max,"score"));
 const letters=q.options.map((_,i)=>String.fromCharCode(65+i));
 para(block,T("الصحيح: ","Correct: ")+grade.right.map(i=>letters[i]).join(", "));
 para(block,T("اختيارك: ","You selected: ")+(grade.chosen.length?grade.chosen.map(i=>letters[i]).join(", "):"—"));
 if(grade.missing.length)para(block,T("الخيارات الناقصة: ","Missing: ")+grade.missing.map(i=>letters[i]).join(", "));
 if(grade.wrong.length)para(block,T("خيارات خاطئة حُدّدت: ","Incorrectly selected: ")+grade.wrong.map(i=>letters[i]).join(", "));
 if(q.explain_en)para(block,q.explain_en,"explanation");
 if(showAr&&q.explain_ar)para(block,q.explain_ar,"explanation ar");
 para(block,T("درجات الاختيار المتعدد تحسب وفق قاعدة تدريب نبض ولا تمثل توزيع علامات اللجنة الرسمية.","Multiple-choice partial credit is NABD's training rubric, not the official Open Doors policy."),"status");
 root.append(block);
}
const practice={
 masterSingle:{kind:"single",deck:[],index:0,selected:new Set(),grades:[],showAr:false,locked:false},
 masterMulti:{kind:"multi",deck:[],index:0,selected:new Set(),grades:[],showAr:false,locked:false}
};
function beginPractice(view,wrongDeck=null){
 const p=practice[view],subject=$(view+"Subject").value,number=int($(view+"Count").value,1,50),
  source=$(view+"Source").value;
 p.deck=wrongDeck||makeDeck(subject,p.kind,number,source);
 p.index=0;p.selected=new Set();p.grades=[];p.locked=false;p.showAr=false;
 renderPractice(view);
}
function renderPractice(view){
 const p=practice[view],stage=$(view+"Stage"),entry=p.deck[p.index];
 if(!entry)return;
 stage.hidden=false;stage.replaceChildren();
 const q=entry.q,grade=p.grades[p.index];
 const heading=el("div",null,"step-labels");
 heading.append(el("span",T("سؤال ","Question ")+(p.index+1)+"/"+p.deck.length),
  el("span",T(bank.SOURCES[q.subject].ar,bank.SOURCES[q.subject].name)),el("span",q.topic),
  el("span",q.origin==="NABD_MASTER_ORIGINAL"?"NABD ORIGINAL":"NABD GENERATED"));
 stage.append(heading);
 button(stage,p.showAr?T("إخفاء الترجمة","Hide Arabic translation"):T("🌐 إظهار الترجمة العربية","🌐 Show Arabic translation"),()=>{
  p.showAr=!p.showAr;renderPractice(view);
 },"translation-switch");
 drawPrompt(stage,q,p.showAr);
 drawOptions(stage,q,entry.order,p.selected,p.locked,p.showAr,null,grade);
 const actions=el("div",null,"button-row");
 if(!grade){
  button(actions,T("تحقق من إجابتي","Check my answer"),()=>{
   if(!p.selected.size){const msg=note(stage,"اختر إجابة أولًا.","Select an answer first.");msg.classList.add("error");return}
   const result=bank.gradeChoice(q,[...p.selected]);p.grades[p.index]=result;p.locked=true;renderPractice(view);
  },"action gold");
 }else{
  button(actions,p.index===p.deck.length-1?T("النتيجة النهائية","Final result"):T("السؤال التالي ←","Next question →"),()=>{
   if(p.index===p.deck.length-1)finishPractice(view);
   else{p.index++;p.selected=new Set();p.locked=false;p.showAr=false;renderPractice(view)}
  },"action primary");
 }
 stage.append(actions);
 if(grade)drawExplanation(stage,q,grade,p.showAr);
}
function finishPractice(view){
 const p=practice[view],root=$(view+"Stage");root.replaceChildren();
 const score=p.grades.reduce((a,b)=>a+(b?.score||0),0);
 const max=p.deck.reduce((a,b)=>a+(b.q.kind==="single"?1:3),0);
 root.append(el("h3",T("📊 تقرير الجولة","📊 Practice round report")));
 root.append(el("div",score+"/"+max,"score"));
 const list=el("ol");p.deck.forEach((item,i)=>{
  list.append(el("li",item.q.topic+" · "+(p.grades[i]?.score||0)+"/"+(item.q.kind==="single"?1:3)));
 });root.append(list);
 logResult({type:p.kind,subject:$(view+"Subject").value,earned:score,possible:max,method:"answer-key"});
 const actions=el("div",null,"button-row");
 const wrong=p.deck.filter((_,i)=>!p.grades[i]?.exact);
 const retry=button(actions,T("إعادة الأسئلة الخاطئة","Retry incorrect tasks"),()=>beginPractice(view,rnd(wrong)),"action gold");
 retry.disabled=wrong.length===0;
 button(actions,T("اختبار عشوائي جديد","New randomized round"),()=>beginPractice(view),"action primary");
 button(actions,T("تنزيل تقرير TXT","Download TXT report"),()=>{
  downloadText("nabd-masters-"+p.kind+".txt",
   ["NABD Master's Open Doors — INDEPENDENT PRACTICE","Score: "+score+"/"+max,
    ...p.deck.flatMap((item,i)=>["",item.q.topic,item.q.prompt_en,
     "Score: "+(p.grades[i]?.score??0),item.q.explain_en])].join("\n"));
 });
 root.append(actions);
}
$("masterSingleStart").addEventListener("click",()=>beginPractice("masterSingle"));
$("masterMultiStart").addEventListener("click",()=>beginPractice("masterMulti"));

// Extended written practice: text OR handwritten photo (explicit provider consent).
const written={pool:[],index:0,answer:"",showAr:false,photo:null,photoURL:null,graded:null,self:false,working:false};
function releasePhoto(){
 if(written.photoURL)URL.revokeObjectURL(written.photoURL);
 written.photoURL=null;written.photo=null;
}
$("masterWrittenStart").addEventListener("click",()=>{
 releasePhoto();
 const subject=$("masterWrittenSubject").value,n=int($("masterWrittenCount").value,1,3);
 written.pool=rnd(bank.available(subject,"written")).slice(0,n);
 written.index=0;written.answer="";written.showAr=false;written.graded=null;
 renderWritten();
});
function renderWritten(){
 const stage=$("masterWrittenStage");stage.hidden=false;stage.replaceChildren();
 const q=written.pool[written.index];if(!q)return;
 headline(stage,T("المسألة ","Task ")+(written.index+1)+"/"+written.pool.length,q.topic);
 button(stage,written.showAr?T("إخفاء العربية","Hide Arabic"):T("🌐 أظهر الترجمة","🌐 Show Arabic"),()=>{written.showAr=!written.showAr;renderWritten()},"translation-switch");
 drawPrompt(stage,q,written.showAr);
 const form=el("div",null,"editor");
 const textLabel=el("label");textLabel.append(el("span",T("خطوات الإجابة بالتفصيل","Show your reasoning and intermediate steps")));
 const area=el("textarea");area.value=written.answer;area.maxLength=6500;area.placeholder=T("المعادلات والخطوات والتبرير","Equations, calculations, assumptions and conclusions");
 area.addEventListener("input",()=>written.answer=area.value);textLabel.append(area);form.append(textLabel);
 const photoLabel=el("label");photoLabel.append(el("span",T("📸 صوّر ورقة الحل أو ارفع صورة (حتى 4MB)","📸 Photograph your handwritten work or upload (up to 4 MB)")));
 const file=el("input");file.type="file";file.accept="image/png,image/jpeg,image/webp";file.setAttribute("capture","environment");
 file.addEventListener("change",()=>{
  const f=file.files?.[0];releasePhoto();
  if(!f)return;
  if(f.size>4*1024*1024||f.size<200||!["image/png","image/jpeg","image/webp"].includes(f.type)){
   file.value="";status.textContent=T("صورة غير صالحة، استخدم JPG/PNG/WebP أقل من 4MB.","Invalid image: use JPG/PNG/WebP under 4 MB.");return;
  }
  written.photo=f;written.photoURL=URL.createObjectURL(f);
  const img=el("img");img.src=written.photoURL;img.alt="Handwritten answer preview";photoLabel.append(img);
 });photoLabel.append(file);form.append(photoLabel);
 if(written.photo&&!written.photoURL)written.photoURL=URL.createObjectURL(written.photo);
 if(written.photoURL){const img=el("img");img.src=written.photoURL;img.alt="Current handwritten solution";form.append(img)}
 const consent=el("label",null,"consent"),checkbox=el("input");checkbox.type="checkbox";
 const consText=el("span",T("أوافق على إرسال الإجابة والصورة الاختيارية إلى مزود ذكاء اصطناعي خارجي لأغراض التصحيح التقديري فقط، ولا أضع بيانات شخصية أو طبية.","I consent to sending my answer and optional image to an external AI provider for provisional educational grading, with no personal or patient data."));
 consent.append(checkbox,consText);form.append(consent);
 stage.append(form);
 const actions=el("div",null,"button-row");
 const status=el("p","", "status");
 const gradeBtn=button(actions,T("🤖 صحح بالذكاء الاصطناعي","🤖 AI provisional grading"),async()=>{
  if(written.working)return;
  if(!written.answer.trim()&&!written.photo){status.textContent=T("اكتب إجابة أو أرفق صورة.","Provide a typed answer or photograph.");return}
  if(!checkbox.checked){status.textContent=T("وافق على معالجة الإجابة أولًا.","Consent to provider processing first.");return}
  written.working=true;gradeBtn.disabled=true;
  status.textContent=T("جارٍ تحليل خطوات الحل والمعادلات…","Reviewing written steps and calculations…");
  try{
   const image=written.photo?await compressPhoto(written.photo):null;
   const {data,error}=await client.functions.invoke("open-doors-essay-grade",{body:{
     question:{id:q.id,subject:q.subject,topic:q.topic,prompt_en:q.prompt_en,prompt_ar:q.prompt_ar,
      model_en:q.model_en,model_ar:q.model_ar,rubric:q.rubric},answer:written.answer,image}});
   if(error||!data?.ok)throw Error(data?.error||error?.message||"AI_UNAVAILABLE");
   if(data.result?.readable===false){status.textContent=T("تعذر قراءة الصورة بوضوح؛ أعد تصويرها.","The handwriting could not be read. Retake the photo.");return}
   const r=data.result;if(!r||!Number.isInteger(r.score)||r.score<0||r.score>10)throw Error("INVALID_SCORE");
   written.graded=r;written.self=false;
   drawWrittenReview(stage,q,r,false);
   status.textContent=T("نتيجة تعليمية تقديرية؛ راجع الحل النموذجي.","Provisional learning result; compare to the model answer.");
  }catch(e){status.textContent=T("تعذر التصحيح الآلي؛ استخدم الحل النموذجي والمراجعة الذاتية.","AI is unavailable; use the model answer and self-review.")+
   " ("+String(e.message||"UNKNOWN").slice(0,50)+")";}
  finally{written.working=false;gradeBtn.disabled=false}
 },"action gold");
 button(actions,T("📚 الحل النموذجي ومراجعتي الذاتية","📚 Worked solution and self-review"),()=>drawSelfReview(stage,q),"action");
 button(actions,written.index===written.pool.length-1?T("إنهاء المقالي","Finish written round"):T("مسألة تالية","Next advanced task"),()=>{
  if(written.index<written.pool.length-1){written.index++;written.answer="";releasePhoto();written.showAr=false;written.graded=null;renderWritten()}
  else{stage.replaceChildren(el("h3",T("أنهيت جولة المقالي","Written round complete")));button(stage,T("ابدأ جولة جديدة","New written practice"),()=>$("masterWrittenStart").click(),"action primary")}
 },"action primary");
 stage.append(actions,status);
 if(written.graded)drawWrittenReview(stage,q,written.graded,written.self);
}
async function compressPhoto(file){
 if(!globalThis.createImageBitmap)throw Error("PHOTO_PREPROCESS_UNAVAILABLE");
 const b=await createImageBitmap(file);
 try{
  const ratio=Math.min(1,1900/Math.max(b.width,b.height)),canvas=el("canvas");
  canvas.width=Math.max(1,Math.round(b.width*ratio));canvas.height=Math.max(1,Math.round(b.height*ratio));
  const g=canvas.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,canvas.width,canvas.height);g.drawImage(b,0,0,canvas.width,canvas.height);
  let data=canvas.toDataURL("image/jpeg",.82).split(",")[1];
  if(data.length>2_800_000)data=canvas.toDataURL("image/jpeg",.66).split(",")[1];
  if(data.length>2_800_000)throw Error("PHOTO_TOO_LARGE");
  return {mime:"image/jpeg",base64:data,width:canvas.width,height:canvas.height};
 }finally{b.close()}
}
function drawModel(root,q){
 para(root,T("الإجابة النموذجية / خطوات الحل","Model answer / worked reasoning"),"status");
 para(root,q.model_en,"model-solution");
 if(q.model_ar)para(root,q.model_ar,"model-solution");
}
function drawWrittenReview(stage,q,result,self){
 let existing=stage.querySelector("[data-written-review]");if(existing)existing.remove();
 const box=el("section",null,"feedback");box.dataset.writtenReview="1";
 box.append(el("h3",T("التقييم وتفسير الإجابة","Marking and worked explanation")));
 box.append(el("div",result.score+"/10","score"));
 para(box,self?T("تقييم ذاتي وليس درجة ذكاء اصطناعي.","Your own self-review, not an AI grade."):
  T("تقدير بالذكاء الاصطناعي وقد يحتاج تصحيحًا بشريًا.","AI estimate; human review may be needed."),"status");
 if(result.reason_en||result.reason_ar)para(box,T(result.reason_ar||result.reason_en,result.reason_en||result.reason_ar),"explanation");
 const criteria=el("div",null,"breakdown");
 q.rubric.forEach((r,i)=>{
  const x=result.criteria?.[i]||{score:0};
  const cell=el("div");cell.append(el("b",T(r.ar,r.en)),el("small",(x.score||0)+"/"+r.points));
  if(x.feedback_en||x.feedback_ar)para(cell,T(x.feedback_ar||x.feedback_en,x.feedback_en||x.feedback_ar),"status");
  criteria.append(cell);
 });box.append(criteria);
 const misses=(lang==="ar"?result.missing_ar:result.missing_en)||result.missing_ar||[];
 if(misses.length){para(box,T("خطوات ناقصة","Missing steps"),"status");const u=el("ul");misses.forEach(x=>u.append(el("li",x)));box.append(u)}
 drawModel(box,q);
 button(box,T("تنزيل شرح الإجابة","Download answer review"),()=>downloadText("nabd-masters-written.txt",
  [q.prompt_en,"","Model:",q.model_en,"","Score:",result.score+"/10","",result.reason_en||""].join("\n")),"action");
 stage.append(box);
 if(!self)logResult({type:"written-ai",subject:q.subject,earned:result.score,possible:10,method:"provisional-ai"});
}
function drawSelfReview(stage,q){
 let old=stage.querySelector("[data-self]");if(old)old.remove();
 const box=el("div",null,"feedback");box.dataset.self="1";
 box.append(el("h3",T("المراجعة الذاتية على أربعة معايير","Self-review against four criteria")));
 drawModel(box,q);
 const grid=el("div",null,"self-grid"),ticks=[];
 q.rubric.forEach(r=>{
  const label=el("label"),input=el("input");input.type="checkbox";ticks.push({input,r});
  label.append(input,el("span",T(r.ar,r.en)+" · "+r.points+" "+T("علامة","points")));grid.append(label);
 });
 box.append(grid);
 button(box,T("احسب نتيجتي الذاتية","Calculate self-review score"),()=>{
  const criteria=ticks.map(({input,r})=>({score:input.checked?r.points:0}));
  const result={score:criteria.reduce((a,b)=>a+b.score,0),criteria,
   reason_ar:"المجموع من تقييمك الشخصي للنقاط المحققة، وليس تصحيحًا رسميًا.",
   reason_en:"Self-scored checklist; not an official mark.",missing_ar:[],missing_en:[]};
  written.graded=result;written.self=true;drawWrittenReview(stage,q,result,true);
  logResult({type:"written-self",subject:q.subject,earned:result.score,possible:10,method:"self"});
 },"action gold");
 stage.append(box);
}
// Oral practice: local voice recording and transcript-based provisional content grading.
const oral={item:null,showAr:false,transcript:"",recorder:null,chunks:[],audioURL:null};
function clearOralAudio(){
 if(oral.recorder&&oral.recorder.state!=="inactive")oral.recorder.stop();
 if(oral.audioURL)URL.revokeObjectURL(oral.audioURL);
 oral.audioURL=null;oral.chunks=[];
}
$("masterOralStart").addEventListener("click",()=>{
 clearOralAudio();
 const subject=$("masterOralSubject").value;
 oral.item=rnd(bank.available(subject,"oral"))[0];oral.showAr=false;oral.transcript="";
 renderOral();
});
function renderOral(){
 const stage=$("masterOralStage");stage.hidden=false;stage.replaceChildren();const q=oral.item;if(!q)return;
 headline(stage,T("المهمة الشفوية","Oral research response"),q.topic);
 button(stage,oral.showAr?T("إخفاء الترجمة","Hide translation"):T("🌐 أظهر الترجمة","🌐 Show Arabic"),()=>{oral.showAr=!oral.showAr;renderOral()},"translation-switch");
 drawPrompt(stage,q,oral.showAr);
 const actions=el("div",null,"button-row");
 const status=el("p","", "status");
 const startRecord=button(actions,T("🎙️ سجل صوتك محليًا","🎙️ Record locally"),async()=>{
  try{
   if(!navigator.mediaDevices?.getUserMedia||!globalThis.MediaRecorder)throw Error("UNSUPPORTED");
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});
   oral.chunks=[];oral.recorder=new MediaRecorder(stream);
   oral.recorder.ondataavailable=e=>{if(e.data?.size>0)oral.chunks.push(e.data)};
   oral.recorder.onstop=()=>{
    stream.getTracks().forEach(t=>t.stop());
    if(oral.audioURL)URL.revokeObjectURL(oral.audioURL);
    oral.audioURL=URL.createObjectURL(new Blob(oral.chunks,{type:oral.recorder.mimeType||"audio/webm"}));
    const old=stage.querySelector("audio");if(old)old.remove();
    const player=el("audio");player.controls=true;player.src=oral.audioURL;stage.append(player);
    status.textContent=T("التسجيل على هذا الجهاز فقط؛ اكتب التفريغ النصي لتقييم محتوى الشرح.","Audio stays on this device. Type the transcript to grade scientific content.");
   };
   oral.recorder.start();status.textContent=T("بدأ التسجيل… أوقفه عند الانتهاء.","Recording started… stop when ready.");
  }catch{status.textContent=T("تعذر الوصول إلى الميكروفون؛ يمكنك الكتابة بدل التسجيل.","Microphone unavailable; use a typed oral transcript.")}
 },"action");
 button(actions,T("⏹ أوقف التسجيل","⏹ Stop recording"),()=>{
  if(oral.recorder?.state==="recording")oral.recorder.stop();
 },"action");
 stage.append(actions);
 const form=el("div",null,"editor"),label=el("label");
 label.append(el("span",T("تفريغ الشرح الشفوي نصيًا (لتقييم المحتوى فقط)","Type the spoken explanation (content review only)")));
 const text=el("textarea");text.maxLength=6500;text.value=oral.transcript;
 text.addEventListener("input",()=>oral.transcript=text.value);label.append(text);form.append(label);stage.append(form,status);
 const rub=el("div",null,"step-labels");q.rubric.forEach(x=>rub.append(el("span",x)));stage.append(rub);
 const buttons=el("div",null,"button-row");
 button(buttons,T("🤖 تصحيح محتوى الشفوي","🤖 Grade oral transcript content"),async()=>{
  if(oral.transcript.trim().length<20){status.textContent=T("اكتب تفريغًا من 20 حرفًا على الأقل.","Provide at least 20 transcript characters.");return}
  status.textContent=T("جارٍ تقييم المحتوى العلمي…","Evaluating scientific content…");
  try{
   const res=await client.functions.invoke("open-doors-grade",{body:{tasks:[{
    type:"oral",prompt:q.prompt_en,answer:oral.transcript,rubric:q.rubric}]}});
   if(res.error||!res.data?.ok||!res.data.results?.length)throw Error("ORAL_AI_UNAVAILABLE");
   const val=res.data.results[0],box=el("div",null,"feedback");
   box.append(el("h3",T("درجة تقديرية للمحتوى العلمي","Provisional scientific content score")));
   box.append(el("div",val.score+"/5","score"));para(box,T(val.reason_ar||"",val.reason_en||val.reason_ar||""),"explanation");
   para(box,T("لا يتم تقييم النطق أو جودة الميكروفون.","Pronunciation and microphone quality are not assessed."),"status");
   stage.append(box);logResult({type:"oral-ai",subject:q.subject,earned:val.score,possible:5,method:"provisional-ai"});
   status.textContent="";
  }catch{status.textContent=T("خدمة تقييم الشفوي غير متاحة؛ راجع المعايير وقارن إجابتك.","AI oral review unavailable; use the provided criteria.")}
 },"action gold");
 button(buttons,T("جرب مهمة جديدة","New oral task"),()=>$("masterOralStart").click(),"action primary");
 stage.append(buttons);
 if(oral.audioURL){const p=el("audio");p.controls=true;p.src=oral.audioURL;stage.append(p)}
}
// Timed 44-task simulation: 25 basic, 15 multi, 3 extended, 1 oral.
let exam={active:false,subject:"chemistry",phase:"idle",questions:[],index:0,answers:{},endsAt:0,
 timerId:null,showAr:false,transcript:"",grading:false};
function stopClock(){if(exam.timerId)clearInterval(exam.timerId);exam.timerId=null}
function timeLeft(){
 return Math.max(0,Math.ceil((exam.endsAt-Date.now())/1000));
}
function renderClock(){
 const t=$("masterClock");if(!t)return;
 const sec=timeLeft(),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;
 t.textContent=[h,m,s].map(n=>String(n).padStart(2,"0")).join(":");
}
function beginExam(){
 stopClock();
 const subject=$("masterExamSubject").value;
 const singles=makeDeck(subject,"single",25,"mixed");
 const multis=makeDeck(subject,"multi",15,"mixed");
 const essays=rnd(bank.available(subject,"written")).slice(0,3).map(q=>({q,order:[]}));
 const speech=rnd(bank.available(subject,"oral"))[0];
 exam={active:true,subject,phase:"written",questions:[...singles,...multis,...essays],speech,index:0,
  answers:{},showAr:false,transcript:"",grading:false,endsAt:Date.now()+175*60*1000,timerId:null};
 exam.timerId=setInterval(()=>{
  if(!exam.active)return;
  renderClock();
  if(timeLeft()===0){if(exam.phase==="written")goExamOral(true);else if(exam.phase==="oral")finishExam(true)}
 },1000);
 renderExam();
}
$("masterExamStart").addEventListener("click",()=>{
 if(exam.active&&!confirm(T("إعادة بدء الامتحان ستلغي الإجابات الحالية. متابعة؟","Starting over will discard the current mock. Continue?")))return;
 beginExam();
});
function getExamAnswer(){
 const existing=exam.answers[exam.index];
 if(existing)return existing;
 const ans={choices:[],text:""};
 exam.answers[exam.index]=ans;return ans;
}
function renderExam(){
 const stage=$("masterExamStage");if(!exam.active){stage.hidden=true;return}
 stage.hidden=false;stage.replaceChildren();
 const bar=el("div",null,"exam-bar");
 bar.append(el("b",exam.phase==="oral"?T("5 دقائق شفوي","5-minute oral"):T("175 دقيقة كتابي","175-minute written")));
 const clock=el("strong","", "timer");clock.id="masterClock";bar.append(clock);
 bar.append(el("span",exam.phase==="written"?T("المهمة ","Task ")+(exam.index+1)+"/43":T("المهمة 44: الشفوي","Task 44: oral")));
 stage.append(bar);renderClock();
 if(exam.phase==="oral"){renderExamOral(stage);return}
 if(exam.phase==="complete"){renderExamReport(stage);return}
 const nav=el("div",null,"question-nav");
 for(let i=0;i<43;i++){
  const a=exam.answers[i],b=el("button",String(i+1));
  b.type="button";b.classList.toggle("current",i===exam.index);
  b.classList.toggle("answered",Boolean(a&&(a.choices.length||a.text.trim())));
  b.setAttribute("aria-label","Task "+(i+1));
  b.addEventListener("click",()=>{exam.index=i;exam.showAr=false;renderExam()});nav.append(b);
 }
 stage.append(nav);
 const q=exam.questions[exam.index].q,answer=getExamAnswer();
 headline(stage,T("السؤال ","Question ")+(exam.index+1)+" · "+(q.kind==="single"?"1":q.kind==="multi"?"3":"10")+
  T(" علامة"," points"),q.topic);
 button(stage,exam.showAr?T("إخفاء الترجمة","Hide Arabic"):T("🌐 إظهار العربية","🌐 Show Arabic"),()=>{
  exam.showAr=!exam.showAr;renderExam()
 },"translation-switch");
 drawPrompt(stage,q,exam.showAr);
 if(q.kind==="single"||q.kind==="multi"){
  const selected=new Set(answer.choices);
  drawOptions(stage,q,exam.questions[exam.index].order,selected,false,exam.showAr,
   ()=>{answer.choices=[...selected]});
 }else{
  const form=el("div",null,"editor"),label=el("label");
  label.append(el("span",T("اكتب إجابتك المقالية مع خطوات الحل.","Write your extended answer and reasoning.")));
  const textarea=el("textarea");textarea.maxLength=6500;textarea.value=answer.text;
  textarea.addEventListener("input",()=>answer.text=textarea.value);
  label.append(textarea);form.append(label);stage.append(form);
  para(stage,T("في المحاكي الكامل، التصحيح الآلي للمقالي يعتمد على النص المكتوب. يمكنك استخدام تدريب المقالي المستقل لرفع صورة الحل.","In the full simulator, essays are evaluated from typed text. Use the separate essay lab to photograph a handwritten response."),"status");
 }
 const actions=el("div",null,"button-row");
 if(exam.index>0)button(actions,T("السابق","Previous"),()=>{exam.index--;renderExam()},"action");
 if(exam.index<42)button(actions,T("التالي →","Next →"),()=>{exam.index++;renderExam()},"action primary");
 button(actions,T("الانتقال إلى المهمة الشفوية","Move to oral stage"),()=>{
  if(confirm(T("هل أنهيت الجزء الكتابي؟ لا يمكن الرجوع إليه بعد الانتقال للشفوي.","Submit written answers and move to oral? You cannot return to the written section.")))goExamOral(false);
 },"action gold");
 stage.append(actions);
 para(stage,T("هذه محاكاة تدريبية؛ الإجابات النموذجية لا تظهر حتى تسليم الامتحان.","Practice simulation: answers are not revealed before final submission."),"status");
}
function goExamOral(auto){
 if(exam.phase!=="written")return;
 exam.phase="oral";exam.endsAt=Date.now()+5*60*1000;
 exam.showAr=false;renderExam();
}
function renderExamOral(stage){
 const q=exam.speech;
 headline(stage,T("المهمة 44 / شفوي","Task 44 / Oral"),q.topic);
 button(stage,exam.showAr?T("إخفاء الترجمة","Hide Arabic"):T("🌐 إظهار العربية","🌐 Show Arabic"),
 ()=>{exam.showAr=!exam.showAr;renderExam()},"translation-switch");
 drawPrompt(stage,q,exam.showAr);
 const label=el("label",null,"editor");label.append(el("span",T("سجل محتوى إجابتك الشفوية كتابةً (اختياري للتقييم)","Type an oral-response transcript (optional for scoring)")));
 const text=el("textarea");text.value=exam.transcript;text.maxLength=6500;
 text.addEventListener("input",()=>exam.transcript=text.value);
 label.append(text);stage.append(label);
 para(stage,T("الشفوي في المحاكي يقيم النص المفرغ فقط، وليس النطق أو الصوت. التدريب المنفصل يتيح تسجيل صوتك محليًا.","The mock evaluates transcript content only, not speaking quality. The separate oral trainer supports local audio recording."),"status");
 const actions=el("div",null,"button-row");
 const consent=el("label",null,"consent"),tick=el("input");tick.type="checkbox";tick.id="masterExamAIConsent";
 consent.append(tick,el("span",T("أوافق على إرسال نصوص الحل للمزوّد الخارجي لتصحيح تقديري للمقالي والشفوي، دون أي بيانات شخصية.","I consent to sending written answers and oral transcript to an AI provider for provisional educational scoring; no personal data.")));
 stage.append(consent);
 button(actions,T("تسليم المحاكاة وعرض النتائج","Submit mock and review results"),()=>finishExam(false),"action gold");
 stage.append(actions);
}
async function finishExam(auto){
 if(exam.phase!=="oral"||exam.grading)return;
 if(!auto&&!(document.querySelector("#masterExamAIConsent")?.checked)&&
 !confirm(T("بدون الموافقة على إرسال النصوص لن تصحح الأسئلة المقالية والشفوية آليًا؛ سنعرض نتيجة الاختيارات المؤكدة فقط. متابعة؟",
 "Without provider consent, only objective questions will be scored. Continue?")))return;
 const permission=Boolean(document.querySelector("#masterExamAIConsent")?.checked)&&!auto;
 exam.grading=true;stopClock();exam.phase="complete";
 const tasks=exam.questions.slice(40,43);
 let aiResults=null;
 if(permission){
  const inputs=tasks.map((entry,i)=>({
   type:"written",prompt:entry.q.prompt_en,answer:(exam.answers[40+i]?.text||"").slice(0,6500),
   rubric:entry.q.rubric.map(x=>x.en+" ("+x.points+" points)").slice(0,8)
  }));
  if(exam.transcript.trim().length>=20)inputs.push({
   type:"oral",prompt:exam.speech.prompt_en,answer:exam.transcript.slice(0,6500),
   rubric:exam.speech.rubric});
  try{
   const {data,error}=await client.functions.invoke("open-doors-grade",{body:{tasks:inputs}});
   if(!error&&data?.ok&&Array.isArray(data.results)&&data.results.length===inputs.length)aiResults=data.results;
  }catch{}
 }
 exam.aiResults=aiResults;
 exam.grading=false;
 renderExamReport($("masterExamStage"));
}
function renderExamReport(stage){
 stage.replaceChildren();
 stage.append(el("h3",T("📊 نتيجة محاكاة الماجستير","📊 Master's mock examination report")));
 let objective=0;
 for(let i=0;i<40;i++){
  const q=exam.questions[i].q,r=bank.gradeChoice(q,exam.answers[i]?.choices||[]);
  objective+=r.score;
 }
 const grades=exam.aiResults||[];
 const essaysEvaluated=grades.length>=3;
 const essay=essaysEvaluated?grades.slice(0,3).reduce((s,x)=>s+(Number(x.score)||0),0):null;
 const oralEvaluated=grades.length===4;
 const oral=oralEvaluated?Number(grades[3]?.score)||0:null;
 const known=70+(essaysEvaluated?30:0)+(oralEvaluated?5:0);
 const earned=objective+(essay??0)+(oral??0);
 stage.append(el("div",objective+"/70", "score"));
 para(stage,T("درجة الاختيارات المؤكدة: ","Verified answer-key objective score: ")+objective+"/70");
 if(essaysEvaluated)para(stage,T("تصحيح المقالي الآلي التقديري: ","Provisional AI essay total: ")+essay+"/30");
 else para(stage,T("الأسئلة المقالية لم تُصحح آليًا. لا تُضاف 30 علامة افتراضية.","Essay tasks not AI-graded; 30 marks remain unassessed."),"status");
 if(oralEvaluated)para(stage,T("تقييم محتوى الشفوي التقديري: ","Provisional oral content: ")+oral+"/5");
 else para(stage,T("محتوى الشفوي غير مقيّم؛ لا تُمثل هذه القيمة جودة النطق.","Oral content not assessed; speech quality was never measured."),"status");
 const box=el("div",null,"feedback");
 box.append(el("h3",T("المجموع المُقيّم فقط","Total assessed points only")));
 box.append(el("div",earned+"/"+known+" "+T("من 105 علامة محتملة","of 105 possible points"),"score"));
 para(box,T("الدرجة التقديرية ليست نتيجة Open Doors الرسمية. الاختيارات حُسبت بمفتاح نبض، والمقالي/الشفوي إن وُجدا بتقييم ذكاء اصطناعي قد يخطئ.",
 "Not an official Open Doors score. Objective points use NABD answer keys; any essay/oral AI points are provisional."),"status");
 stage.append(box);
 const wrong=el("ol");for(let i=0;i<40;i++){
  const q=exam.questions[i].q,g=bank.gradeChoice(q,exam.answers[i]?.choices||[]);
  if(!g.exact)wrong.append(el("li",(i+1)+". "+q.topic+" — "+g.score+"/"+g.max+" · "+q.explain_en));
 }
 stage.append(el("h3",T("أولويات المراجعة / أخطاء الاختيار","Review priorities / objective mistakes")));
 if(wrong.childElementCount)stage.append(wrong);else para(stage,T("جميع الاختيارات صحيحة حسب بنك التدريب.","All objective choices matched the independent training key."));
 if(essaysEvaluated){
  for(let i=0;i<3;i++){
   const val=grades[i],q=exam.questions[40+i].q;
   const review=el("div",null,"feedback");
   review.append(el("h3",(41+i)+". "+q.topic+" · "+val.score+"/10"));
   para(review,T(val.reason_ar||"",val.reason_en||val.reason_ar||""),"status");
   drawModel(review,q);stage.append(review);
  }
 }
 logResult({type:"full-simulation",subject:exam.subject,earned,possible:known,
  method:essaysEvaluated?"objective-key+AI-provisional":"objective-key-only"});
 const row=el("div",null,"button-row");
 button(row,T("ابدأ امتحان ماجستير جديد","Start a new Master's mock"),()=>beginExam(),"action gold");
 button(row,T("تنزيل النتيجة TXT","Download score TXT"),()=>downloadText("nabd-masters-mock-report.txt",
  ["NABD Master's independent simulation, not official","Subject: "+exam.subject,
   "Objective: "+objective+"/70","Essay provisional: "+(essay??"ungraded")+"/30",
   "Oral provisional: "+(oral??"ungraded")+"/5","Assessed: "+earned+"/"+known].join("\n")),"action");
 stage.append(row);
 exam.phase="complete";
}
window.addEventListener("beforeunload",()=>{stopClock();clearOralAudio();releasePhoto()});
renderSources();
