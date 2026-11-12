/* NABD Exams & Quality — authenticated student view. Server-time window enforced by PostgreSQL. */
(function(){
"use strict";
if(!document.querySelector("[data-quality-student]"))return;
const $=id=>document.getElementById(id),client=window.nabdSupabase;
let student=null,exam=null,questions=[],timer=null,attempted=new Map(),submitting=false,autoRequested=false;
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
 await load();
}
async function load(){
 if(!student||!client)return;
 message("ql-student-status","جارٍ تحميل الامتحانات…");
 const [examsResult,submitted]=await Promise.all([
  client.rpc("nabd_quality_active_exams"),
  client.from("nabd_quality_submissions").select("exam_id,human_score,submitted_at").eq("student_id",student.id).limit(200)
 ]);
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
   if(prior)card.append(el("p","ql-muted",prior.human_score===null?"بانتظار التصحيح البشري":"الدرجة: "+prior.human_score+" / 100"));
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
 $("ql-paper-title").textContent=data.title;
 $("ql-paper-questions").replaceChildren();
 questions.forEach((q,i)=>{
   const card=el("section","ql-question"),head=el("h3","",(i+1)+". "+q.prompt);
   card.append(head);
   const id=String(q.id);
   if(q.type==="mcq"||q.type==="true_false"){
     const options=q.type==="true_false"?["صحيح","خطأ"]:(Array.isArray(q.options)?q.options:[]);
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
       const empty=el("option","","اختر المطابقة");empty.value="";select.append(empty);
       (q.right_items||[]).forEach((right,j)=>{const opt=el("option","",(j+1)+". "+right);opt.value=String(j);select.append(opt);});
       label.append(select);card.append(label);
     });
   } else if(q.type==="essay"){
     const area=el("textarea");area.name="q_"+id;area.rows=6;area.maxLength=8000;area.placeholder="اكتب إجابتك المقالية هنا…";
     const label=el("label","","الإجابة");label.append(area);card.append(label);
   } else {
     const input=el("input");input.type="text";input.name="q_"+id;input.maxLength=700;input.placeholder="أكمل الفراغ هنا";
     const label=el("label","","الإجابة");label.append(input);card.append(label);
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
 if(!auto&&!window.confirm("هل تريد تسليم إجاباتك الآن؟ هذه محاولة واحدة ولا يمكن تعديل الإجابات بعد التسليم."))return;
 submitting=true;const b=$("ql-submit-answers");b.disabled=true;
 message("ql-paper-status",auto?"اقترب وقت الإغلاق، جارٍ محاولة التسليم تلقائيًا…":"جارٍ تسجيل الإجابات في النظام…");
 const answers=captureAnswers();
 const {data,error}=await client.from("nabd_quality_submissions")
   .insert({exam_id:exam.id,student_id:student.id,answers}).select("id,submitted_at").maybeSingle();
 submitting=false;
 if(error||!data){
   b.disabled=false;
   message("ql-paper-status","تعذر التسليم. قد يكون وقت الامتحان قد انتهى، أو ربما سبق التسليم. تحقق من اتصالك ثم حدّث الصفحة.","error");
   return;
 }
 if(timer){clearInterval(timer);timer=null}
 $("ql-student-paper").hidden=true;
 $("ql-student-dashboard").hidden=false;
 exam=null;questions=[];autoRequested=false;
 b.disabled=false;$("ql-student-form").hidden=false;
 await load();
 message("ql-student-status","تم تسليم إجاباتك بنجاح. يمكنك متابعة حالة التصحيح البشري من قائمة الامتحانات.","success");
}
function tick(){
 if(!exam)return;
 const ms=Date.parse(exam.closes_at)-Date.now();
 if(ms<=0){
   $("ql-timer").textContent="00:00";$("ql-timer").classList.add("alert");
   $("ql-submit-answers").disabled=true;
   message("ql-paper-status","انتهت فترة الامتحان المحددة من الإدارة. لن يقبل الخادم تسليمًا جديدًا.","error");
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
 if(!window.confirm("العودة لقائمة الامتحانات دون تسليم؟ لن تُحفظ الإجابات غير المرسلة."))return;
 if(timer){clearInterval(timer);timer=null}
 exam=null;questions=[];$("ql-student-form").hidden=false;
 $("ql-student-paper").hidden=true;$("ql-student-dashboard").hidden=false;load();
});
auth();
})();