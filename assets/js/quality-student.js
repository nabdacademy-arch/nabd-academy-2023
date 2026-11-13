/* NABD Exams & Quality — authenticated student view. Server-time window enforced by PostgreSQL. */
(function(){
"use strict";
if(!document.querySelector("[data-quality-student]"))return;
const $=id=>document.getElementById(id),client=window.nabdSupabase;
let student=null,exam=null,questions=[],timer=null,attempted=new Map(),submitting=false,autoRequested=false,paperLang="ar";
const tr=(ar,en)=>paperLang==="en"?en:ar;
function setPaperLanguage(language){
 paperLang=language==="en"?"en":"ar";
 const paper=document.getElementById("ql-student-paper");
 paper.lang=paperLang;paper.dir=paperLang==="en"?"ltr":"rtl";
 $("ql-paper-note").textContent=tr("الوقت المتبقي حتى إغلاق الامتحان على الخادم",
   "Time remaining until this exam closes on the server");
 $("ql-submit-answers").textContent=tr("تسليم الإجابات للتصحيح البشري","Submit answers for human grading");
 $("ql-exit-paper").textContent=tr("العودة للقائمة","Return to exam list");
}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n}
function message(id,txt,kind){const n=$(id);n.hidden=!txt;n.textContent=txt||"";n.className="ql-status"+(kind?" "+kind:"")}
const date=x=>{try{return new Intl.DateTimeFormat("ar-PS",{dateStyle:"medium",timeStyle:"short"}).format(new Date(x))}catch{return ""}};
async function auth(){
 if(!client){$("ql-student-locked").hidden=false;return}
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user){$("ql-student-locked").hidden=false;return}
 const {data:role}=await client.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(role?.role!=="student"){$("ql-student-locked").hidden=false;$("ql-student-locked").querySelector("p").textContent="هذا القسم مخصّص لحسابات الطلاب المسجلين في الأكاديمية.";return}
 student=user;$("ql-student-locked").hidden=true;$("ql-student-dashboard").hidden=false;
 $("ql-student-history").hidden=false;
 await load();
 // Deep link from the authenticated NABD Moodle dashboard. A student can open
 // only an exam returned by the server's approved-and-current RPC.
 const requested=new URLSearchParams(window.location.search).get("exam");
 if(requested && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requested)
   && !attempted.has(requested)){
   const active=await client.rpc("nabd_quality_active_exams");
   if(!active.error && (active.data||[]).some(x=>x.id===requested))await openPaper(requested);
 }
}
function renderHistory(rows,error){
 const list=$("ql-history-list");list.replaceChildren();
 if(error){list.append(el("p","ql-empty","تعذر تحميل نتائج الامتحانات السابقة."));return;}
 if(!(rows||[]).length){list.append(el("p","ql-empty","لم تسلّم أي امتحان بعد."));return;}
 rows.forEach(item=>{
   const card=el("article","ql-list-item");
   card.append(el("h3","",item.title));
   card.append(el("p","ql-muted","تاريخ التسليم: "+date(item.submitted_at)));
   const final=item.human_score!==null&&item.human_score!==undefined;
   const hasAI=item.ai_score!==null&&item.ai_score!==undefined;
   const message=final?"الدرجة البشرية المعتمدة: "+item.human_score+" / 100":
     hasAI?"درجة آلية أولية: "+item.ai_score+" / 100"+(item.ai_review_required?" (بانتظار اعتماد بشري)":""):
     item.ai_status==="needs_review"?"تحتاج مراجعة بشرية":
     item.ai_status==="processing"?"التصحيح الآلي جارٍ…":"بانتظار التصحيح";
   card.append(el("span","ql-tag"+(final?" ql-tag-green":""),message));
   if(final&&item.grade_notes)card.append(el("p","ql-muted","ملاحظات المصحح: "+item.grade_notes));
   else if(item.ai_notes){
     const details=el("details","ql-muted");
     details.append(el("summary","","ملاحظات التقييم الآلي والأسئلة التي تحتاج إلى مراجعة"));
     details.append(el("p","",item.ai_notes));
     card.append(details);
   }
   list.append(card);
 });
}
async function load(){
 if(!student||!client)return;
 message("ql-student-status","جارٍ تحميل الامتحانات…");
 const [examsResult,submitted,history]=await Promise.all([
  client.rpc("nabd_quality_active_exams"),
  client.from("nabd_quality_submissions").select("exam_id,human_score,submitted_at,ai_score,ai_notes,ai_review_required,ai_status").eq("student_id",student.id).limit(200),
  client.rpc("nabd_quality_student_history")
 ]);
 const aiByExam=new Map((submitted.data||[]).map(row=>[row.exam_id,row]));
 renderHistory((history.data||[]).map(row=>({...row,...(aiByExam.get(row.exam_id)||{})})),history.error||submitted.error);
 if(examsResult.error)return message("ql-student-status","تعذّر تحميل الامتحانات حاليًا. حاول لاحقًا.","error");
 attempted=new Map((submitted.data||[]).map(a=>[a.exam_id,a]));
 const list=$("ql-student-list");list.replaceChildren();
 const active=examsResult.data||[];
 if(!active.length){list.append(el("p","ql-empty","لا توجد امتحانات مفتوحة الآن. ستظهر هنا تلقائيًا بعد موافقة مدير الأكاديمية على النشر."));message("ql-student-status","");return}
 for(const item of active){
   const card=el("article","ql-list-item");
   const top=el("div","ql-list-heading");top.append(el("h3","",item.title));
   top.append(el("span","ql-tag ql-tag-green","متاح الآن"));card.append(top);
   const meta=el("div","ql-list-meta");
   for(const t of [(item.course_title||"جميع المسارات"),item.question_count+" سؤال",
     item.duration_minutes+" دقيقة", "الإغلاق: "+date(item.closes_at)])meta.append(el("span","",t));
   card.append(meta);
   const prior=attempted.get(item.id),button=el("button","ql-button",prior?"تم تسليم الإجابات": "بدء الامتحان");
   button.disabled=Boolean(prior);
   if(prior){
     const resultText=prior.human_score!==null?"الدرجة المعتمدة: "+prior.human_score+" / 100":
       prior.ai_score!==null&&prior.ai_score!==undefined?"درجة آلية أولية: "+prior.ai_score+" / 100":
       "بانتظار التصحيح";
     card.append(el("p","ql-muted",resultText));
   }
   button.addEventListener("click",()=>openPaper(item.id));
   const actions=el("div","ql-list-actions");actions.append(button);card.append(actions);list.append(card);
 }
 message("ql-student-status","");
}
$("ql-refresh").addEventListener("click",load);
async function openPaper(id){
 if(!student)return;
 message("ql-student-status","جارٍ فتح نموذج الامتحان المعتمد…");
 const {data,error}=await client.rpc("nabd_quality_student_questions",{p_exam:id});
 if(error||!data||!Array.isArray(data.questions))return message("ql-student-status","لم يعد هذا الامتحان متاحًا؛ ربما انتهت مدة النشر.","error");
 exam=data;questions=data.questions;autoRequested=false;
 const arabic=/[\u0600-\u06FF]/u;
 setPaperLanguage(questions.some(q=>arabic.test(q.prompt||""))?"ar":"en");
 $("ql-paper-title").textContent=data.title;
 $("ql-paper-questions").replaceChildren();
 questions.forEach((q,i)=>{
   const card=el("section","ql-question"),head=el("h3","",(i+1)+". "+q.prompt);
   card.append(head);
   const id=String(q.id);
   if(q.type==="mcq"||q.type==="true_false"){
     const options=q.type==="true_false"?[tr("صحيح","True"),tr("خطأ","False")]:(Array.isArray(q.options)?q.options:[]);
     const group=el("div","ql-choices");
     options.forEach((option,j)=>{
       const label=el("label","ql-inline"),input=el("input");
       input.type="radio";input.name="q_"+id;input.value=q.type==="true_false"?(j===0?"true":"false"):String(j);
       label.append(input,el("span","",String(option)));group.append(label);
     });
     card.append(group);
   } else if(q.type==="matching"){
     (q.left_items||[]).forEach((left,i)=>{
       const label=el("label","",(i+1)+". "+left);
       const select=el("select");select.dataset.question=id;select.dataset.matchIndex=String(i);
       const empty=el("option","",tr("اختر المطابقة","Select a match"));empty.value="";select.append(empty);
       (q.right_items||[]).forEach((right,j)=>{const opt=el("option","",(j+1)+". "+right);opt.value=String(j);select.append(opt);});
       label.append(select);card.append(label);
     });
   } else if(q.type==="essay"){
     const area=el("textarea");area.name="q_"+id;area.rows=6;area.maxLength=8000;area.placeholder=tr("اكتب إجابتك المقالية هنا…","Write your essay answer here…");
     const label=el("label","",tr("الإجابة","Answer"));label.append(area);card.append(label);
   } else {
     const input=el("input");input.type="text";input.name="q_"+id;input.maxLength=700;input.placeholder=tr("أكمل الفراغ هنا","Complete the blank here");
     const label=el("label","",tr("الإجابة","Answer"));label.append(input);card.append(label);
   }
   $("ql-paper-questions").append(card);
 });
 $("ql-student-paper").hidden=false;$("ql-student-dashboard").hidden=true;message("ql-paper-status","");
 if(timer)clearInterval(timer);
 timer=setInterval(tick,1000);tick();$("ql-student-paper").scrollIntoView({behavior:"smooth",block:"start"});
}
function captureAnswers(){
 const result={};
 questions.forEach(q=>{
   const id=String(q.id);
   if(q.type==="matching"){
     result[id]=(q.left_items||[]).map((_,i)=>{
       const choice=document.querySelector('select[data-question="'+id+'"][data-match-index="'+i+'"]');
       return choice&&choice.value!==""?Number(choice.value):null;
     });
   }else if(q.type==="mcq"||q.type==="true_false"){
     const selected=document.querySelector('input[name="q_'+id+'"]:checked');
     result[id]=selected?(q.type==="mcq"?Number(selected.value):selected.value):null;
   }else result[id]=document.querySelector('[name="q_'+id+'"]')?.value?.trim()||"";
 });
 return result;
}
async function submit(auto=false){
 if(!student||!exam||submitting)return;
 if(!auto&&!window.confirm(tr("هل تريد تسليم إجاباتك الآن؟ هذه محاولة واحدة ولا يمكن تعديل الإجابات بعد التسليم.",
 "Submit your answers now? You have one attempt and cannot change submitted answers.")))return;
 submitting=true;const b=$("ql-submit-answers");b.disabled=true;
 message("ql-paper-status",auto?
 tr("اقترب وقت الإغلاق، جارٍ محاولة التسليم تلقائيًا…","Exam closing soon, submitting automatically…"):
 tr("جارٍ تسجيل الإجابات في النظام…","Submitting your answers…"));
 const answers=captureAnswers();
 const {data,error}=await client.from("nabd_quality_submissions")
   .insert({exam_id:exam.id,student_id:student.id,answers}).select("id,submitted_at").maybeSingle();
 submitting=false;
 if(error||!data){
   b.disabled=false;
   message("ql-paper-status",tr("تعذر التسليم. قد يكون وقت الامتحان قد انتهى، أو ربما سبق التسليم. تحقق من اتصالك ثم حدّث الصفحة.",
 "Submission failed. The exam may have closed or you may have already submitted. Check your connection and refresh."),"error");
   return;
 }
 if(timer){clearInterval(timer);timer=null}
 $("ql-student-paper").hidden=true;
 $("ql-student-dashboard").hidden=false;
 exam=null;questions=[];autoRequested=false;
 b.disabled=false;$("ql-student-form").hidden=false;
 await load();
 message("ql-student-status",tr("تم تسليم إجاباتك بنجاح. يمكنك متابعة حالة التصحيح البشري من قائمة الامتحانات.",
 "Answers submitted successfully. You can review your grading status in the exam list."),"success");
}
function tick(){
 if(!exam)return;
 const ms=Date.parse(exam.closes_at)-Date.now();
 if(ms<=0){
   $("ql-timer").textContent="00:00";$("ql-timer").classList.add("alert");
   $("ql-submit-answers").disabled=true;
   message("ql-paper-status",tr("انتهت فترة الامتحان المحددة من الإدارة. لن يقبل الخادم تسليمًا جديدًا.",
 "This exam has closed. The server will no longer accept new answers."),"error");
   if(timer){clearInterval(timer);timer=null}
   return;
 }
 const seconds=Math.ceil(ms/1000),minutes=Math.floor(seconds/60);
 $("ql-timer").textContent=String(minutes).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
 $("ql-timer").classList.toggle("alert",ms<60000);
 if(ms<8000 && !autoRequested){
   autoRequested=true;
   submit(true);
 }
}
$("ql-student-form").addEventListener("submit",e=>{e.preventDefault();submit(false)});
$("ql-exit-paper").addEventListener("click",()=>{
 if(!window.confirm(tr("العودة لقائمة الامتحانات دون تسليم؟ لن تُحفظ الإجابات غير المرسلة.",
 "Return to exam list without submitting? Unsaved answers will be lost.")))return;
 if(timer){clearInterval(timer);timer=null}
 exam=null;questions=[];$("ql-student-form").hidden=false;
 $("ql-student-paper").hidden=true;$("ql-student-dashboard").hidden=false;load();
});
auth();
})();