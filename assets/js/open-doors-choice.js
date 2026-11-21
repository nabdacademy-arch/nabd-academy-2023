/* NABD Open Doors — dedicated single-choice and multiple-choice practice, no new AI billing.
 * Original NABD bank + public read-only Supabase question bank. Official samples are linked,
 * never passed off as official reused questions. Selection and grading are local.
 */
import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const db=createClient("https://zsmmmljgguycrvyrmakl.supabase.co","sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM",
 {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const BANK=window.OpenDoorsChoiceBank;
const $=id=>document.getElementById(id);
const SUBJECTS=["chemistry","biology","medicine"];
if(!BANK||!$("choiceSingle")||!$("choiceMulti"))throw Error("NABD_CHOICES_SETUP_MISSING");
const sessions={
 single:{kind:"single",id:"choiceSingle",questions:[],index:0,choices:new Set(),reviewed:[],locked:false,showTranslation:false,translation:new Map(),loaded:false},
 multi:{kind:"multi",id:"choiceMulti",questions:[],index:0,choices:new Set(),reviewed:[],locked:false,showTranslation:false,translation:new Map(),loaded:false}
};
let existing=[],loading=null;
function make(tag,txt,className){
 const e=document.createElement(tag);
 if(txt!==undefined&&txt!==null)e.textContent=String(txt);
 if(className)e.className=className;
 return e;
}
function randomize(list){
 const a=[...list];
 for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[j],a[i]]=[a[i],a[j]]}
 return a;
}
const textOnly=txt=>String(txt??"").slice(0,12000);
function setStatus(ctx,msg,error=false){
 const el=$(ctx.id+"Status");el.textContent=msg;el.classList.toggle("error",error);
}
function current(ctx){return ctx.questions[ctx.index]}
function trans(ctx,q){return ctx.translation.get(q?.id)||null}
function scoreLabel(q){return q.kind==="single"?"1 mark / علامة واحدة":"3 practice marks / 3 علامات تدريبية"}
function getResult(ctx){return ctx.reviewed[ctx.index]||null}
function getQuestionTag(q){return q.origin==="NABD_EXISTING_DATABASE"?"NABD BANK · existing":"NABD ORIGINAL · new practice"}
function translateText(ctx,english,arabic){
 return ctx.showTranslation&&arabic?arabic:english;
}
async function readExisting(){
 if(loading)return loading;
 loading=(async()=>{
  // Public read-only Open Doors bank: no email, password, or user session required.
  const res=await db.from("open_doors_questions")
   .select("id,subject,kind,topic,difficulty,question,options,answers,explanation,origin,source_note")
   .in("kind",["single","multi"]).in("subject",SUBJECTS).limit(400);
  if(res.error)throw Error("BANK_UNAVAILABLE");
  if(!res.data?.length)throw Error("BANK_EMPTY");
  existing=res.data.map(BANK.normalizeDatabase).filter(Boolean);
  return existing;
 })().catch(err=>{loading=null;throw err});
 return loading;
}
function setOfficialSources(ctx,subject){
 const area=$(ctx.id+"Sources");area.replaceChildren();
 area.append(make("strong","📚 Open Doors · official program and published sample PDF"));
 area.append(make("p","Official samples establish the task format. Questions inside this trainer are labeled NABD-authored or existing NABD practice; the trainer does not claim they appeared in the live exam."));
 const subjects=subject==="all"?SUBJECTS:[subject];
 for(const s of subjects){
  const source=BANK.SOURCES[s];
  const row=make("div",undefined,"choice-source-row");
  row.append(make("span",source.ar+" · "));
  const a=make("a","Official subject ↗");a.href=source.url;a.target="_blank";a.rel="noopener noreferrer";
  const b=make("a","Sample tasks PDF ↗");b.href=source.sample;b.target="_blank";b.rel="noopener noreferrer";
  row.append(a,b);area.append(row);
 }
}
function showExam(ctx){
 $(ctx.id+"Summary").hidden=true;
 const deck=current(ctx);
 if(!deck)return;
 ctx.locked=false;ctx.choices.clear();ctx.showTranslation=false;
 $(ctx.id+"Translate").textContent="🌐 Show Arabic · إظهار الترجمة";
 $(ctx.id+"Translate").setAttribute("aria-pressed","false");
 $(ctx.id+"Result").hidden=true;
 $(ctx.id+"Result").replaceChildren();
 $(ctx.id+"Next").hidden=true;$(ctx.id+"Check").disabled=false;
 $(ctx.id+"Panel").hidden=false;
 $(ctx.id+"No").textContent=(ctx.index+1)+"/"+ctx.questions.length;
 $(ctx.id+"Meter").style.width=Math.round(100*ctx.index/ctx.questions.length)+"%";
 $(ctx.id+"Meta").textContent=(BANK.SOURCES[deck.q.subject]?.ar||deck.q.subject)+" · "+(deck.q.topic||"Science")+" · "+getQuestionTag(deck.q);
 $(ctx.id+"Format").textContent=scoreLabel(deck.q);
 $(ctx.id+"Prompt").textContent=deck.q.question;
 $(ctx.id+"PromptArabic").hidden=true;
 setOfficialSources(ctx,deck.q.subject);
 renderChoices(ctx);
 setStatus(ctx,ctx.kind==="single"?"اختر إجابة واحدة ثم اضغط «تصحيح».":"اختر جميع الإجابات التي تراها صحيحة، ثم اضغط «تصحيح».",false);
}
function renderChoices(ctx){
 const deck=current(ctx);if(!deck)return;
 const q=deck.q,translation=trans(ctx,q),area=$(ctx.id+"Options");
 const source=ctx.showTranslation?(q.question_ar||translation?.question_ar||""):"";
 const prompt=$(ctx.id+"PromptArabic");
 prompt.textContent=source;prompt.hidden=!source;
 area.replaceChildren();
 const result=getResult(ctx);
 for(let display=0;display<deck.order.length;display++){
  const original=deck.order[display];
  const label=make("label",undefined,"choice-option");
  const input=make("input");input.type=ctx.kind==="single"?"radio":"checkbox";
  input.name=ctx.id+"-group";input.value=String(original);
  input.checked=ctx.choices.has(original);input.disabled=ctx.locked;
  const letter=make("strong",String.fromCharCode(65+display));
  const copy=make("div",undefined,"choice-opt-copy");
  const english=make("span",q.options[original],"en");english.lang="en";copy.append(english);
  const arabicOption=ctx.showTranslation?(q.options_ar?.[original]||translation?.options_ar?.[original]):null;
  if(arabicOption){const arabic=make("span",arabicOption,"ar");arabic.lang="ar";copy.append(arabic)}
  label.append(input,letter,copy);
  if(result){
   if(q.correct.includes(original)){label.classList.add("is-correct");label.append(make("span","✓ correct / صحيح","choice-indicator"))}
   else if(ctx.choices.has(original)){label.classList.add("is-wrong");label.append(make("span","✗ incorrect / خطأ","choice-indicator"))}
  }
  input.addEventListener("change",()=>{
   if(ctx.locked)return;
   if(ctx.kind==="single"){ctx.choices.clear();ctx.choices.add(original)}
   else{if(input.checked)ctx.choices.add(original);else ctx.choices.delete(original)}
   renderChoices(ctx);
  });
  area.append(label);
 }
}
async function switchTranslation(ctx){
 const deck=current(ctx);if(!deck)return;const q=deck.q;
 if(ctx.showTranslation){
  ctx.showTranslation=false;$(ctx.id+"Translate").textContent="🌐 Show Arabic · إظهار الترجمة";
  $(ctx.id+"Translate").setAttribute("aria-pressed","false");
  renderChoices(ctx);renderResult(ctx);return;
 }
 ctx.showTranslation=true;
 $(ctx.id+"Translate").textContent="🌐 Hide Arabic · إخفاء الترجمة";
 $(ctx.id+"Translate").setAttribute("aria-pressed","true");
 if(q.question_ar){renderChoices(ctx);renderResult(ctx);return}
 const cached=trans(ctx,q);
 if(cached){renderChoices(ctx);renderResult(ctx);return}
 if(!q.dbId){setStatus(ctx,"هذه المسألة بالإنجليزية فقط حاليًا؛ الأسئلة الجديدة متاحة باللغتين.",true);return}
 const btn=$(ctx.id+"Translate");btn.disabled=true;setStatus(ctx,"جارٍ تحميل الترجمة العربية المحفوظة…");
 try{
  // Cached database translations are public read-only; paid AI translation is admin-only.
  const {data:t,error}=await db.from("open_doors_question_translations")
   .select("question_ar,options_ar,explanation_ar,rubric_ar").eq("question_id",q.dbId).maybeSingle();
  if(error||!t)throw Error("SAVED_TRANSLATION_MISSING");
  if(!Array.isArray(t.options_ar)||t.options_ar.length!==q.options.length||
     typeof t.question_ar!=="string"||!t.question_ar.trim())throw Error("INCOMPLETE_TRANSLATION");
  ctx.translation.set(q.id,t);
  if(current(ctx)?.q.id!==q.id)return;
  renderChoices(ctx);renderResult(ctx);
  setStatus(ctx,"تمت الترجمة. عند اختلاف مصطلح علمي راجع السؤال الإنجليزي الأصلي.");
 }catch(err){
  if(current(ctx)?.q.id===q.id){
   setStatus(ctx,"لا توجد ترجمة عربية محفوظة لهذا السؤال؛ استخدم بنك الأسئلة الجديدة المؤلفة باللغتين.",true);
  }
 }finally{btn.disabled=false}
}
function renderResult(ctx){
 const result=getResult(ctx),deck=current(ctx),area=$(ctx.id+"Result");
 if(!result||!deck)return;
 const q=deck.q,translated=trans(ctx,q);
 area.hidden=false;area.replaceChildren();
 area.append(make("h3","📊 Answer review · مراجعة الإجابة"));
 area.append(make("div",result.score+"/"+result.max,"choice-grade-score"));
 const accuracy=result.exact?"✓ Correct / إجابة صحيحة":
 result.score>0?"◔ Partially correct / صحيحة جزئيًا":"✗ Incorrect / غير صحيحة";
 area.append(make("p",accuracy));
 const letters=q.options.map((_,i)=>String.fromCharCode(65+deck.order.indexOf(i)));
 const selected=result.selected.map(i=>letters[i]).join(", ")||"—";
 const correct=result.correct.map(i=>letters[i]).join(", ");
 area.append(make("p","Your selection / اختيارك: "+selected+"   ·   Correct / الصحيح: "+correct));
 const ol=make("ol");
 deck.order.forEach((idx,i)=>{
  const p=q.correct.includes(idx);
  const chosen=result.selected.includes(idx);
  let msg=p?"✓ This is part of the correct answer.":"✗ Not part of the correct answer.";
  if(chosen&&!p)msg+=" You selected it incorrectly.";
  const li=make("li",String.fromCharCode(65+i)+". "+q.options[idx]+" — "+msg);
  ol.append(li);
 });area.append(ol);
 area.append(make("h4","🔬 Scientific explanation · الشرح العلمي"));
 if(q.explanation_en)area.append(make("p",q.explanation_en,"choice-explain"));
 if(ctx.showTranslation&&(q.explanation_ar||translated?.explanation_ar)){
  const a=make("p",q.explanation_ar||translated.explanation_ar,"choice-explain ar");a.lang="ar";area.append(a);
 }else if(!q.explanation_en&&q.explanation_ar){
  const a=make("p",q.explanation_ar,"choice-explain ar");a.lang="ar";area.append(a);
 }
 if(!q.explanation_en&&!q.explanation_ar&&q.originalExplanation){
  area.append(make("p",q.originalExplanation,"choice-explain"));
 }
 if(ctx.kind==="multi")area.append(make("p",
  "NABD practice marking: 3 for exactly correct; correct-only partial subsets earn floor(3 × hits ÷ correct count); any wrong selection earns 0. This is NOT the official Open Doors marking rule.",
  "choice-note"));
 else area.append(make("p","One training point only for the correct option. Not an official Open Doors exam score.","choice-note"));
 if(q.origin==="NABD_EXISTING_DATABASE"){
  area.append(make("p","Existing Academy item. The official link documents the syllabus format; this question is not claimed as verbatim official content.","choice-note"));
 }
}
function check(ctx){
 if(ctx.locked||!current(ctx))return;
 if(!ctx.choices.size){setStatus(ctx,"اختر إجابة واحدة على الأقل قبل طلب التصحيح.",true);return}
 const q=current(ctx).q;
 const result=BANK.grade(q,[...ctx.choices]);
 ctx.reviewed[ctx.index]={...result,id:q.id,subject:q.subject,topic:q.topic};
 ctx.locked=true;
 $(ctx.id+"Check").disabled=true;$(ctx.id+"Next").hidden=false;
 $(ctx.id+"Next").textContent=ctx.index===ctx.questions.length-1?
  "📊 Finish and review · إنهاء وعرض النتيجة":"Next question · السؤال التالي ←";
 $(ctx.id+"Meter").style.width=Math.round(100*(ctx.index+1)/ctx.questions.length)+"%";
 renderChoices(ctx);renderResult(ctx);
 setStatus(ctx,result.exact?"✓ إجابة صحيحة! اعرض الشرح ثم انتقل للسؤال التالي.":result.score>0?
  "◔ هناك جزء صحيح، اقرأ العناصر الناقصة قبل الانتقال.":"✗ الإجابة غير مكتملة أو بها خطأ، اقرأ التصحيح والحل.");
}
function finish(ctx){
 const area=$(ctx.id+"Summary");area.hidden=false;area.replaceChildren();
 $(ctx.id+"Panel").hidden=true;$(ctx.id+"Result").hidden=true;
 const max=ctx.questions.reduce((s,v)=>s+(v.q.kind==="single"?1:3),0);
 const earned=ctx.reviewed.reduce((s,r)=>s+(r?.score||0),0);
 const correct=ctx.reviewed.filter(r=>r?.exact).length;
 area.append(make("h3","🏁 Your practice report · نتيجة التدريب"));
 area.append(make("p",earned+" / "+max+" · "+correct+" / "+ctx.questions.length+
  " exactly correct · "+(max?Math.round(100*earned/max):0)+"%","choice-grade-score"));
 const list=make("ol");ctx.questions.forEach((deck,i)=>{
  const r=ctx.reviewed[i];
  list.append(make("li",deck.q.topic+" · "+(r?r.score+"/"+r.max:"not graded")+(r?.exact?" ✓":"")));
 });area.append(list);
 const actions=make("div",undefined,"choice-actions");
 const redo=make("button","↺ Review wrong answers · أعد الأخطاء","choice-btn gold");redo.type="button";
 const wrong=ctx.questions.filter((v,i)=>!ctx.reviewed[i]?.exact);
 redo.disabled=wrong.length===0;
 redo.addEventListener("click",()=>{
  ctx.questions=randomize(wrong).map(d=>({q:d.q,order:randomize(d.q.options.map((_,i)=>i))}));
  ctx.index=0;ctx.reviewed=[];showExam(ctx);
 });
 const fresh=make("button","New randomized round · جولة جديدة","choice-btn primary");fresh.type="button";
 fresh.addEventListener("click",()=>start(ctx));
 const exportBtn=make("button","Download report TXT · تنزيل التقرير","choice-btn secondary");exportBtn.type="button";
 exportBtn.addEventListener("click",()=>exportReport(ctx));
 actions.append(redo,fresh,exportBtn);area.append(actions);
 area.append(make("p","Independent practice only; scores do not predict Open Doors results.","choice-legend"));
 setStatus(ctx,"انتهت الجولة. يمكنك مراجعة أخطائك أو بدء اختبار عشوائي جديد.");
}
function exportReport(ctx){
 const lines=["NABD Open Doors · "+ctx.kind.toUpperCase()+" choice independent practice",
 "NOT OFFICIAL · educational scoring rubric · "+new Date().toISOString()];
 for(let i=0;i<ctx.questions.length;i++){
  const q=ctx.questions[i].q,r=ctx.reviewed[i];
  lines.push("","Question "+(i+1)+" / "+q.subject+" / "+q.topic,q.question);
  for(let k=0;k<q.options.length;k++)lines.push(String.fromCharCode(65+k)+") "+q.options[k]+(q.correct.includes(k)?" [CORRECT]":""));
  lines.push("Marked: "+(r?r.selected.join(","):"none"),"Points: "+(r?r.score+"/"+r.max:"not graded"),
   "Explanation: "+(q.explanation_en||q.explanation_ar||q.originalExplanation||"Not supplied"));
 }
 const blob=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=make("a");a.href=url;
 a.download="nabd-open-doors-"+ctx.kind+"-review.txt";
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);
}
async function start(ctx){
 const btn=$(ctx.id+"Start");btn.disabled=true;
 const subject=$(ctx.id+"Subject").value,source=$(ctx.id+"Source").value;
 const countOption=$(ctx.id+"Count").value;
 setStatus(ctx,source==="new"||source==="generated"
  ?"يجري إعداد جولة محلية من أسئلة نبض دون انتظار الشبكة…"
  :"جارٍ تحميل بنك التدريب وتوليد جولة عشوائية…");
 // Purely local original or generated questions must never wait for the network.
 let archiveAllowed=source==="archive"||source==="mixed";
 if(archiveAllowed){
  try{await readExisting()}catch(err){archiveAllowed=false;
   setStatus(ctx,"تعذر تحميل بنك الأسئلة المؤرشف؛ ستظل الأسئلة الجديدة متاحة. حاول لاحقًا.",true);
  }
 }
 let pool=[];
 if(source==="new"||source==="mixed")pool.push(...BANK.sample(ctx.kind,subject));
 if(archiveAllowed&&(source==="archive"||source==="mixed"))pool.push(...existing.filter(x=>x.kind===ctx.kind&&(subject==="all"||x.subject===subject)));
 if(source==="generated"){
  const subjects=subject==="all"?SUBJECTS:[subject];
  const seed=Math.floor(Math.random()*100000);
  pool=Array.from({length:countOption==="all"?24:Number(countOption)||10},(_,i)=>BANK.generated(subjects[i%subjects.length],ctx.kind,seed+i));
 }
 let requested=countOption==="all"?pool.length:Number(countOption)||10;
 if(source!=="generated"){pool=randomize(pool).slice(0,Math.min(requested,pool.length))}
 if(!pool.length){setStatus(ctx,"لا توجد أسئلة في هذا المصدر. اختر «مختلط» أو «مؤلَّف» ثم أعد المحاولة.",true);
  btn.disabled=false;return}
 ctx.questions=pool.map(q=>({q,order:randomize(q.options.map((_,i)=>i))}));
 ctx.index=0;ctx.reviewed=[];showExam(ctx);
 btn.disabled=false;
}
function init(kind){
 const ctx=sessions[kind];if(!$(ctx.id))return;
 $(ctx.id+"Start").addEventListener("click",()=>start(ctx));
 $(ctx.id+"Translate").addEventListener("click",()=>switchTranslation(ctx));
 $(ctx.id+"Check").addEventListener("click",()=>check(ctx));
 $(ctx.id+"Next").addEventListener("click",()=>ctx.index===ctx.questions.length-1?finish(ctx):(ctx.index++,showExam(ctx)));
 const tab=document.querySelector('[data-tab="'+ctx.id+'"]');
 tab?.addEventListener("click",()=>{
  if(!ctx.loaded){ctx.loaded=true;readExisting().catch(()=>{});}
 });
 $(ctx.id+"Panel").hidden=true;
 $(ctx.id+"Result").hidden=true;
 $(ctx.id+"Summary").hidden=true;
 setOfficialSources(ctx,"all");
}
init("single");init("multi");
for(const [id,kind] of [["choiceSingleQuick","single"],["choiceMultiQuick","multi"]]){
 $(id)?.addEventListener("click",()=>{
  document.querySelector('[data-tab="'+sessions[kind].id+'"]')?.click();
  $(sessions[kind].id)?.scrollIntoView({behavior:"smooth",block:"start"});
 });
}
