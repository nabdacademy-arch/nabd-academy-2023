/* NABD Open Doors advanced written coach — public independent training studio.
 * Text/image graded by an authenticated Edge Function only with explicit consent.
 * No grade stored on the academy servers. Local typed drafts persist per-tab only. */
const dbPromise=import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm")
 .then(({createClient})=>createClient("https://zsmmmljgguycrvyrmakl.supabase.co","sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM",
 {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})).catch(()=>null);
const bank=window.OpenDoorsEssayBank;
const $=id=>document.getElementById(id);
if(!bank||!$("essayLab"))throw Error("ESSAY_BANK_UNAVAILABLE");
let state={questions:[],index:0,answerMode:"typed",photo:null,photoURL:null,results:[],archive:[],busy:false,lang:"en",
 active:false,draftId:null,scoreTotal:0,scorePossible:0,latest:null,cacheLoaded:false};
const ar=(a,e)=>state.lang==="ar"?a:e;
const elem=(t,txt,cls)=>{const x=document.createElement(t);if(txt!==undefined)x.textContent=String(txt);if(cls)x.className=cls;return x};
function status(a,e,isError=false){const x=$("essayStatus");x.textContent=ar(a,e);x.classList.toggle("error",isError)}
const allSubjects=["chemistry","biology","medicine"];
function shuffle(a){const out=a.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function questionTitle(q){return bank.SOURCES[q.subject]?.title||q.subject}
function normaliseArchive(q){
 if(!q||!allSubjects.includes(q.subject)||q.kind!=="written"||typeof q.question!=="string"||!q.question.trim())return null;
 const rubric=typeof q.rubric==="string"?q.rubric:"";
 return {id:"archive-"+q.id,subject:q.subject,topic:q.topic||"Advanced response",
  prompt_en:q.question,prompt_ar:"",model_en:typeof q.explanation==="string"?q.explanation:"",model_ar:"",
  rubric:[
   {en:"Correct scientific concepts",ar:"المفاهيم العلمية الصحيحة",points:3},
   {en:"Step-by-step explanation and equations",ar:"التبرير العلمي والخطوات والمعادلات",points:3},
   {en:"Required result and relevant units",ar:"النتيجة المطلوبة والوحدات",points:2},
   {en:"Clear limitations or relevant example",ar:"توضيح القيود أو مثال مناسب",points:2}
  ],origin:"NABD_EXISTING_DATABASE",source:bank.SOURCES[q.subject].page,max_points:10,
  originalRubric:rubric.slice(0,750)};
}
async function loadArchive(){
 if(state.cacheLoaded)return;state.cacheLoaded=true;
 try{
  // The practice archive is now publicly readable. Auth is reserved for paid AI grading.
  const db=await dbPromise;if(!db)throw Error("BANK_UNAVAILABLE");
  const {data,error}=await db.from("open_doors_questions").select("id,subject,kind,topic,question,explanation,rubric,origin,source_note")
   .eq("kind","written").in("subject",allSubjects).limit(100);
  if(error)throw Error(error.message);
  state.archive=(data||[]).map(normaliseArchive).filter(Boolean);
  $("essayBankSize").textContent=String(state.archive.length+bank.QUESTIONS.length);
 }catch(e){status("الأسئلة الجديدة متاحة؛ تعذّر جلب أرشيف الأسئلة الحالي.","New tasks are available; the existing protected archive could not be loaded.",true)}
}
function langUI(){
 const lang=state.lang;
 $("essayTranslate").textContent=lang==="ar"?"🌐 إخفاء الترجمة العربية":"🌐 عرض الترجمة العربية";
 $("essayAnswer").placeholder=lang==="ar"?"اكتب خطوات الإجابة بالتفصيل، مع المعادلات والتبرير...":"Write your complete step-by-step answer, equations, units and reasoning here...";
 $("essayLangState").textContent=lang==="ar"?"AR + EN":"EN → AR";
 $("essayQuestionAr").hidden=lang!=="ar";
 $("essayTranslate").setAttribute("aria-expanded",String(lang==="ar"));
 for(const node of document.querySelectorAll("#essayLab [data-essay-ar][data-essay-en]")){
  node.textContent=node.getAttribute(lang==="ar"?"data-essay-ar":"data-essay-en");
 }
 if(state.active)renderQuestion();
}
$("essayTranslate").addEventListener("click",()=>{state.lang=state.lang==="en"?"ar":"en";langUI()});
function updateSourceLinks(subject){
 const root=$("essaySources");root.replaceChildren();
 const src=bank.SOURCES[subject]||bank.SOURCES.chemistry;
 const intro=elem("p",ar("المراجع الرسمية للمسار – لم تُنسخ نصوص الأسئلة الرسمية إلى البنك.","Official track references — official sample questions are linked, not copied."));
 root.append(intro);
 [["Official subject page / صفحة المسار",src.page],["Official published sample PDF / النموذج الرسمي",src.sample]].forEach(([title,url])=>{
  const a=elem("a",title+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";root.append(a);
 });
 const note=elem("p",ar("أسئلة NABD_ORIGINAL متوقعة في مستوى التفكير فقط، وليست امتحانات منشورة أو تسريبات.","NABD_ORIGINAL items are authored practice inspired by competencies, not official past papers or predicted exam leaks."),"essay-helper");
 root.append(note);
}
function saveDraft(){
 const q=state.questions[state.index];if(!q)return;
 try{sessionStorage.setItem("nabd_essay_"+q.id,JSON.stringify({text:$("essayAnswer").value,updated:Date.now()}))}catch{}
}
$("essayAnswer").addEventListener("input",()=>{
 saveDraft();$("essayCharacters").textContent=String($("essayAnswer").value.length);
});
function clearPhoto(){
 if(state.photoURL)URL.revokeObjectURL(state.photoURL);
 state.photoURL=null;state.photo=null;
 $("essayImage").value="";$("essayCamera").value="";$("essayPreview").hidden=true;$("essayPreview").removeAttribute("src");
 $("essayPhotoInfo").textContent="";
}
function resetFeedback(){
 $("essayFeedback").replaceChildren();$("essayFeedback").hidden=true;
 $("essaySelfRubric").replaceChildren();$("essaySelfRubric").hidden=true;$("essayReveal").disabled=false;
 $("essayGrade").disabled=false;$("essayNext").hidden=true;
 $("essayConsent").checked=false;state.latest=null;
}
function renderQuestion(){
 const q=state.questions[state.index];if(!q)return;
 state.active=true;$("essayWorkspace").hidden=false;$("essaySummary").hidden=true;
 const id=state.index+1,total=state.questions.length;
 $("essayQuestionMeta").textContent=questionTitle(q)+" · "+q.topic+" · "+ar("المسألة","Question")+" "+id+"/"+total;
 $("essayNumber").textContent=id+"/"+total;
 $("essayMeter").style.width=Math.round(((state.index)/total)*100)+"%";
 $("essayQuestionEn").textContent=q.prompt_en||"";
 $("essayQuestionAr").textContent=q.prompt_ar||ar("هذا السؤال من الأرشيف القديم ويتوفر بالإنجليزية فقط؛ اقرأ الترجمة العامة للمفاهيم في الشروح.", "This archived question has only an English prompt.");
 $("essayQuestionAr").hidden=state.lang!=="ar";
 $("essayOrigin").textContent=q.origin==="NABD_EXISTING_DATABASE"?"NABD ARCHIVE · prior training":"NABD ORIGINAL · independently written";
 $("essayAnswer").value="";
 try{const previous=JSON.parse(sessionStorage.getItem("nabd_essay_"+q.id)||"null");if(previous?.text)$("essayAnswer").value=previous.text}catch{}
 $("essayCharacters").textContent=String($("essayAnswer").value.length);
 clearPhoto();resetFeedback();updateSourceLinks(q.subject);
 status("اكتب خطواتك أو ارفع صورة لورقة الحل. لا تعطى الدرجة حتى تطلب التصحيح.","Enter a worked answer or attach a photo. No score is assigned until you request grading.");
}
function buildDeck(){
 const subject=$("essaySubject").value,mode=$("essayMode").value;
 let pool=bank.select(subject).concat(state.archive.filter(q=>subject==="all"||q.subject===subject));
 if(mode==="generated"){
  const s=subject==="all"?shuffle(allSubjects):[subject];
  const seed=Math.floor(Math.random()*10000);
  pool=Array.from({length:3},(_,i)=>bank.generated(s[i%s.length],seed+i));
 }else{pool=shuffle(pool).slice(0,mode==="three"?3:1)}
 state.questions=pool;state.index=0;state.results=[];state.scoreTotal=0;state.scorePossible=0;
 if(!pool.length){status("لا توجد أسئلة متاحة لهذا الاختيار.","No tasks available for this choice.",true);return}
 renderQuestion();
}
$("essayStart").addEventListener("click",async()=>{await loadArchive();buildDeck()});
$("essayHeroJump")?.addEventListener("click",()=>{
 document.querySelector('[data-tab="essayLab"]')?.click();
 $("essayLab")?.scrollIntoView({behavior:"smooth",block:"start"});
 loadArchive();
});
document.querySelector('[data-tab="essayLab"]')?.addEventListener("click",loadArchive);
function selectEssayPhoto(input){
 const file=input.files?.[0];
 if(input===$("essayImage"))$("essayCamera").value="";
 else $("essayImage").value="";
 if(state.photoURL)URL.revokeObjectURL(state.photoURL);
 state.photoURL=null;state.photo=null;
 $("essayPreview").hidden=true;$("essayPreview").removeAttribute("src");
 $("essayPhotoInfo").textContent="";
 if(!file)return;
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>4*1024*1024||file.size<200){
  status("الصورة يجب أن تكون JPG/PNG/WebP وأقل من 4 ميغابايت.","Select a JPG/PNG/WebP image under 4 MB.",true);
  $("essayImage").value="";$("essayCamera").value="";return;
 }
 state.photo=file;state.photoURL=URL.createObjectURL(file);
 $("essayPreview").src=state.photoURL;$("essayPreview").hidden=false;
 $("essayPhotoInfo").textContent=file.name+" · "+Math.ceil(file.size/1024)+" KB";
 status("يمكنك تعديل الإجابة المكتوبة وإضافة الصورة معًا. ستُرسل الصورة للمزوّد عند الموافقة فقط.","You may combine typed work with the photo; it is sent only when you consent.");
}
$("essayImage").addEventListener("change",()=>selectEssayPhoto($("essayImage")));
$("essayCamera").addEventListener("change",()=>selectEssayPhoto($("essayCamera")));
/* Important: image may contain handwriting. Resize locally but preserve sufficient resolution for inspection. */
async function imagePayload(file){
 if(!file)return null;
 const bitmap=await createImageBitmap(file);
 try{
  const max=2000,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  let url=canvas.toDataURL("image/jpeg",.88);
  if(url.length>2_800_000)url=canvas.toDataURL("image/jpeg",.72);
  const encoded=url.split(",")[1];
  if(!encoded||encoded.length>2_800_000)throw Error("IMAGE_TOO_LARGE");
  return {mime:"image/jpeg",base64:encoded,width:canvas.width,height:canvas.height};
 }finally{bitmap.close()}
}
function paragraph(parent,txt,cls){
 const p=elem("p",txt,cls);parent.append(p);return p;
}
function reportDetails(root,q,data,self=false){
 root.replaceChildren();root.hidden=false;
 const h=elem("h3",ar("تقرير التصحيح وخطوات الحل","Grading report & worked solution"));root.append(h);
 if(data?.readable===false){paragraph(root,ar("لم تتمكن أداة الرؤية من قراءة الصورة بوضوح. أعد تصوير الورقة بإضاءة جيدة أو اكتب الحل.","The image could not be read reliably. Photograph the full page clearly or type the answer."),"essay-diagnostics");return}
 const score=data?.score;
 if(score!==undefined && score!==null){
  paragraph(root,(self?ar("درجة التقييم الذاتي: ","Self-assessment: "):ar("درجة مؤقتة بالذكاء الاصطناعي: ","Provisional AI score: "))+score+"/10","essay-score");
  paragraph(root,self?ar("اخترت بنفسك النقاط المنجزة؛ هذه ليست علامة تصحيح آلي.","You marked the criteria yourself; this is not an AI score."):
   ar("الدرجة تقديرية؛ قد يخطئ الذكاء الاصطناعي في قراءة الخط أو تقييم حل صحيح بصياغة مختلفة.","AI scoring is provisional. Handwriting recognition and scientific grading can be incorrect."),"essay-helper");
 }
 if(data?.recognized_text&&state.photo){
  paragraph(root,ar("النص الذي قرأه الذكاء الاصطناعي من الصورة (راجعه قبل الوثوق بالدرجة):","AI transcription of the handwritten photo (verify it before trusting the mark):"),"essay-kicker");
  paragraph(root,String(data.recognized_text).slice(0,3000),"essay-solution");
 }
 if(Array.isArray(data?.criteria)){
  const grid=elem("div",undefined,"essay-grade-breakdown");
  for(let i=0;i<q.rubric.length;i++){
   const criterion=q.rubric[i],result=data.criteria[i]||{score:0};
   const card=elem("div");
   const name=elem("strong",ar(criterion.ar,criterion.en));card.append(name);
   const points=elem("small",String(result.score??0)+"/"+criterion.points+" · "+ar("المعيار","criterion")+" "+(i+1));card.append(points);
   if(result.feedback_ar||result.feedback_en)paragraph(card,ar(result.feedback_ar,result.feedback_en||result.feedback_ar),"essay-helper");
   grid.append(card);
  }
  root.append(grid);
 }
 if(data?.reason_ar||data?.reason_en)paragraph(root,ar(data.reason_ar,data.reason_en||data.reason_ar),"essay-correction");
 if(Array.isArray(data?.missing_ar)&&data.missing_ar.length){
  paragraph(root,ar("نقاط ناقصة تحتاج علاجًا:","Missing steps to improve:"),"essay-kicker");
  const ul=elem("ul");for(let i=0;i<data.missing_ar.length;i++){const txt=ar(data.missing_ar[i],data.missing_en?.[i]||data.missing_ar[i]);ul.append(elem("li",txt))}root.append(ul);
 }
 if(Array.isArray(data?.strengths_ar)&&data.strengths_ar.length){
  paragraph(root,ar("الأجزاء الصحيحة:","What you did well:"),"essay-kicker");
  const ul=elem("ul");data.strengths_ar.forEach((t,i)=>ul.append(elem("li",ar(t,data.strengths_en?.[i]||t))));root.append(ul);
 }
 paragraph(root,ar("الإجابة النموذجية وشرح الصواب:","Model answer with worked reasoning:"),"essay-kicker");
 paragraph(root,q.model_en,"essay-solution").dir="ltr";
 if(q.model_ar){const a=paragraph(root,q.model_ar,"essay-solution");a.dir="rtl"}
 if(q.origin==="NABD_EXISTING_DATABASE"&&q.originalRubric)paragraph(root,ar("معيار الأرشيف: ","Existing archive rubric: ")+q.originalRubric,"essay-helper");
 const btn=elem("button",ar("تنزيل تقرير التصحيح TXT","Download feedback TXT"),"essay-btn");btn.type="button";
 btn.addEventListener("click",()=>downloadFeedback(q,data,self));root.append(btn);
}
function downloadFeedback(q,data,self){
 const content=["NABD Open Doors Essay Lab · Independent practice","Question ID: "+q.id,"Subject: "+q.subject,
 "Original NABD practice. Not an official Open Doors mark.","","Question:",q.prompt_en,"", "Your answer:",
 $("essayAnswer").value.slice(0,6500),state.photo?"[Image was attached; not embedded in report]":"",
 "","Provisional score: "+(data?.score??"unavailable")+"/10","Grading mode: "+(self?"self-review":"AI-provisional"),
 "Feedback:",data?.reason_en||data?.reason_ar||"","AI handwriting transcript:",data?.recognized_text||"(no image transcript)","Model answer:",q.model_en,"",q.model_ar].join("\n");
 const blob=new Blob([content],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=elem("a");
 a.href=url;a.download="nabd-open-doors-essay-"+q.id.replace(/[^a-zA-Z0-9_-]/g,"-")+".txt";
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),12000);
}
function renderSelf(){
 const q=state.questions[state.index],root=$("essaySelfRubric");
 root.replaceChildren();root.hidden=false;
 paragraph(root,ar("مراجعة ذاتية: ضع علامة فقط إذا أنجزت المعيار بالكامل. مجموعك ليس نتيجة رسمية.","Self-review: check a criterion only if you fully achieved it. This is not an official score."));
 const checks=[];
 q.rubric.forEach(c=>{
  const wrap=elem("label",undefined,"essay-checkbox");
  const input=elem("input");input.type="checkbox";
  wrap.append(input,elem("span",ar(c.ar,c.en)+" · "+c.points+"/10"));root.append(wrap);checks.push({input,points:c.points})
 });
 const compute=elem("button",ar("احسب تقييمي الذاتي","Calculate self-review score"),"essay-btn");compute.type="button";
 compute.addEventListener("click",()=>{
  const score=checks.reduce((s,c)=>s+(c.input.checked?c.points:0),0);
  const data={score,criteria:checks.map(c=>({score:c.input.checked?c.points:0})),reason_ar:"تقييم ذاتي وفق معايير معلنة.",reason_en:"Self-scored against the published learning rubric."};
  record(q,data,true);reportDetails($("essayFeedback"),q,data,true);
 });
 root.append(compute);
 reportDetails($("essayFeedback"),q,{reason_en:"Review the worked answer and check the criteria yourself.",reason_ar:"راجع الحل النموذجي ثم حدد المعايير التي حققتها."},true);
}
$("essayReveal").addEventListener("click",renderSelf);
function record(q,data,self){
 const entry={id:q.id,subject:q.subject,score:data.score??null,self,at:Date.now()};
 state.results[state.index]=entry;
 $("essayNext").hidden=false;
}
async function grade(){
 if(state.busy)return;
 const q=state.questions[state.index];
 if(!q)return;
 const answer=$("essayAnswer").value.trim();
 if(answer.length<12&&!state.photo){status("اكتب إجابة من 12 حرفًا على الأقل أو أرفق صورة للحل.","Provide at least 12 characters or attach a readable photo.",true);return}
 if(!$("essayConsent").checked){status("للتصحيح الذكي وافق أولًا على إرسال إجابتك والصورة الاختيارية لخدمة الذكاء الاصطناعي.","Consent to AI-provider processing of your answer and optional image before grading.",true);return}
 if(answer.length>6500){status("الإجابة أطول من الحد المسموح؛ اختصر إلى 6500 حرف.","Answer exceeds 6,500 characters.",true);return}
 state.busy=true;$("essayGrade").disabled=true;status("يجري تحليل الحل حسب المعايير الأربعة، وفحص الخطوات والمعادلات...","Grading your reasoning, equations and four rubric criteria...");
 try{
  const db=await dbPromise;if(!db)throw Error("AI_UNAVAILABLE_OFFLINE");
  const auth=await db.auth.getUser();
  if(auth.error||!auth.data?.user)throw Error("AUTH_REQUIRED");
  const image=state.photo?await imagePayload(state.photo):null;
  const body={question:{id:q.id,subject:q.subject,topic:q.topic,prompt_en:q.prompt_en,prompt_ar:q.prompt_ar,
      model_en:q.model_en,model_ar:q.model_ar,rubric:q.rubric},answer,image};
  const res=await db.functions.invoke("open-doors-essay-grade",{body});
  if(res.error||!res.data?.ok){
   const code=res.data?.error||res.error?.message||"GRADING_UNAVAILABLE";
   throw Error(code);
  }
  const value=res.data.result;
  if(value?.readable===false){
   reportDetails($("essayFeedback"),q,value);
   status("الخط اليدوي غير واضح بما يكفي للتصحيح. أعد تصوير الورقة أو اكتب إجابتك.","Handwriting could not be read reliably. Retake the photo or type your solution.",true);
   return;
  }
  if(!value||!Number.isInteger(value.score)||value.score<0||value.score>10)throw Error("INVALID_GRADE");
  record(q,value,false);
  reportDetails($("essayFeedback"),q,value);
  status("اكتمل التصحيح التقديري، وظهرت نقاط الخطأ والحل النموذجي.","Provisional grading complete with mistakes and worked solution.");
 }catch(e){
  const reason=String(e?.message||"GRADING_UNAVAILABLE").slice(0,140);
  status("التصحيح الذكي غير متاح حاليًا ("+reason+"). يمكنك اختيار المراجعة الذاتية دون ادعاء علامة آلية.",
   "AI grading is unavailable ("+reason+"). You can use self-review without a fabricated AI score.",true);
  $("essayReveal").disabled=false;
 }finally{state.busy=false;$("essayGrade").disabled=false}
}
$("essayGrade").addEventListener("click",grade);
function finish(){
 const root=$("essaySummary");root.replaceChildren();root.hidden=false;
 const title=elem("h3",ar("انتهت جولة المقالي 🎓","Written-response round complete 🎓"));root.append(title);
 const total=state.results.length,graded=state.results.filter(x=>x&&Number.isInteger(x.score));
 const scored=graded.reduce((s,e)=>s+e.score,0),self=graded.filter(x=>x.self).length;
 paragraph(root,ar("أسئلة الجولة: ","Round questions: ")+total+
 " · "+ar("تم تقييمها: ","Reviewed: ")+graded.length+
 " · "+ar("مجموع تقديري/ذاتي فقط: ","Provisional/self total only: ")+scored+"/"+(total*10));
 if(self)paragraph(root,ar("تحتوي هذه الجولة على "+self+" تقييم(ات) ذاتية، فلا تفسر المجموع على أنه تصحيح آلي.","The round includes "+self+" self-reviews, not machine-graded results."),"essay-diagnostics");
 const list=elem("ul");
 for(const [i,q] of state.questions.entries()){
  const entry=state.results[i];list.append(elem("li",q.subject+" · "+q.topic+" — "+(entry?entry.score+"/10"+(entry.self?" (self)":" (AI provisional)"):"not graded")));
 }root.append(list);
 $("essayWorkspace").hidden=true;$("essayMeter").style.width="100%";
 const restart=elem("button",ar("ابدأ تدريبًا جديدًا","Start a new practice round"),"essay-btn primary");
 restart.addEventListener("click",buildDeck);root.append(restart);
}
$("essayNext").addEventListener("click",()=>{
 if(state.index>=state.questions.length-1){finish();return}
 state.index+=1;renderQuestion();
});
function loadInitial(){
 $("essayBankSize").textContent=String(bank.QUESTIONS.length);
 $("essayWorkspace").hidden=true;$("essaySummary").hidden=true;
 updateSourceLinks("chemistry");langUI();
}
loadInitial();
