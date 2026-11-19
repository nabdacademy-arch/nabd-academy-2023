/* NABD transparent examination proctoring: best-effort browser signals, NOT screen capture. */
(function(){
"use strict";
if(!document.querySelector("[data-quality-student]"))return;
const client=window.nabdSupabase;
const note=document.getElementById("ql-proctor-student-notice");
let examId=null,enabled=false,poll=null,checking=false,blurDelay=null;
let sessionRevision=0;
const last=new Map();
const speak=(ar,en)=>document.getElementById("ql-student-paper")?.lang==="en"?en:ar;

function showStatus(text,mode="off"){
 if(!note)return;
 note.textContent=text;
 note.dataset.state=mode;
}
async function refresh(){
 const id=examId,revision=sessionRevision;
 if(!client||!id||checking)return;
 checking=true;
 try{
   const {data,error}=await client.rpc("nabd_quality_proctor_student_state",{p_exam:id});
   if(revision!==sessionRevision)return;
   if(error)throw error;
   enabled=Boolean(data?.enabled && data?.open);
   showStatus(enabled?
     speak("المراقبة مفعّلة لهذا الامتحان: قد تسجّل إشارات مغادرة الصفحة وفقدان التركيز واختصارات التصوير والطباعة والنسخ. لا يتم تشغيل كاميرا أو تسجيل شاشة، والإشارات ليست حكمًا نهائيًا.",
       "Monitoring is ON: browser tab/window changes and some screenshot/print/copy shortcuts may be logged. No camera or screen recording; signals do not prove misconduct."):
     speak("مراقبة المتصفح متوقفة حاليًا لهذا الامتحان.",
       "Browser monitoring is currently OFF for this exam."),
     enabled?"on":"off");
 }catch(error){
   if(revision===sessionRevision){
     enabled=false;
     showStatus(speak("تعذّر الاتصال بخدمة المراقبة. لا يمكن تأكيد حالتها حاليًا.",
       "Unable to check monitoring status at the moment."),"error");
   }
 }finally{if(revision===sessionRevision)checking=false;}
}
function resetSession(){
 sessionRevision++;
 checking=false;
 if(poll){clearInterval(poll);poll=null;}
 if(blurDelay){clearTimeout(blurDelay);blurDelay=null;}
 enabled=false;
 last.clear();
}
function start(id){
 if(!id)return;
 resetSession();
 examId=id;
 showStatus(speak("جارٍ التحقق من حالة مراقبة هذا الامتحان…",
   "Checking this exam's monitoring status…"));
 refresh();
 poll=setInterval(refresh,15000);
}
function stop(){
 resetSession();
 examId=null;
 showStatus(speak("انتهت جلسة مراقبة الامتحان.","Exam monitoring session ended."),"off");
}
function record(signal){
 if(!client||!examId||!enabled)return;
 const now=Date.now(),key=String(signal);
 if(now-(last.get(key)||0)<6000)return;
 last.set(key,now);
 const id=examId;
 // Event is always attributed by the database to auth.uid(); no student ID
 // or timestamp can be supplied/forged in this RPC.
 client.rpc("nabd_quality_proctor_report",{p_exam:id,p_signal:key})
   .then(({error})=>{if(error && examId===id)console.info("Proctor signal not delivered");})
   .catch(()=>{if(examId===id)console.info("Proctor signal unavailable");});
}
document.addEventListener("nabd:exam-open",e=>start(e.detail?.examId));
document.addEventListener("nabd:exam-end",stop);
document.addEventListener("visibilitychange",()=>{
 if(document.visibilityState==="hidden")record("tab_hidden");
});
window.addEventListener("blur",()=>{
 if(!examId||!enabled)return;
 if(blurDelay)clearTimeout(blurDelay);
 blurDelay=setTimeout(()=>{
   blurDelay=null;
   if(document.visibilityState==="visible"&&!document.hasFocus())record("window_blur");
 },650);
});
window.addEventListener("focus",()=>{
 if(blurDelay){clearTimeout(blurDelay);blurDelay=null;}
});
document.addEventListener("keydown",event=>{
 if(!examId||!enabled)return;
 if(event.key==="PrintScreen"||event.code==="PrintScreen"){
   record("printscreen_key");
 }else if((event.ctrlKey||event.metaKey)&&String(event.key).toLowerCase()==="p"){
   record("print_shortcut");
 }
 // Browser events do not reliably reveal operating-system screenshots.
});
document.addEventListener("copy",()=>record("copy_attempt"));
})();
