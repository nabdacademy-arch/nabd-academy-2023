/* NABD Examinations & Quality — Director dashboard. No auto-publication. */
(function(){
"use strict";
const root=document.querySelector("[data-quality-director]");if(!root)return;
const $=id=>document.getElementById(id);
const client=window.nabdSupabase;
const kinds={mcq:"اختيار من متعدد",true_false:"صح أو خطأ",essay:"مقالي",matching:"توصيل ومطابقة",fill_blank:"أكمل الفراغ"};
const bucket="nabd-quality-lecture-pdfs";
let director=null,questions=[],exams=[],editingId=null,editingSourcePath=null,editingSourceFilename="",selectedCourse=null;
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;}
function status(id,msg,kind){const x=$(id);if(!x)return;x.hidden=!msg;x.textContent=msg||"";x.className="ql-status"+(kind?" "+kind:"");}
function btn(label,fn,extra=""){const b=el("button","ql-mini "+extra,label);b.type="button";b.addEventListener("click",fn);return b;}
function field(name,value,onchange,tag="input"){const label=el("label","",name);const input=el(tag);if(tag==="input")input.type="text";input.value=value||"";input.addEventListener("input",()=>onchange(input.value));label.append(input);return label;}
function isoDate(x){try{return new Intl.DateTimeFormat("ar-PS",{dateStyle:"medium",timeStyle:"short"}).format(new Date(x))}catch{return ""}}
function freshQuestion(type){
 const q={id:crypto.randomUUID(),type,prompt:"",source_excerpt:"",rubric:"",answer_key:null};
 if(type==="mcq"){q.options=["","","",""];q.answer_key=0;}
 if(type==="true_false")q.answer_key=true;
 if(type==="matching"){q.left_items=["","",""];q.right_items=["","",""];q.answer_key=[0,1,2];}
 if(type==="fill_blank")q.answer_key="";
 if(type==="essay")q.answer_key="";
 return q;
}
function validateQuestions(){
 if(!questions.length||questions.length>40)throw Error("يجب أن يحتوي الامتحان على 1 إلى 40 سؤالًا.");
 const ids=new Set();
 for(const [i,q] of questions.entries()){
   if(ids.has(q.id))throw Error("معرّف سؤال مكرر.");ids.add(q.id);
   if(!kinds[q.type]||typeof q.prompt!=="string"||q.prompt.trim().length<5)throw Error("راجع نص السؤال رقم "+(i+1));
   if(q.type==="mcq"&&(!Array.isArray(q.options)||q.options.length!==4||q.options.some(v=>!String(v).trim())))throw Error("راجع خيارات السؤال "+(i+1));
   if(q.type==="matching"&&(!Array.isArray(q.left_items)||!Array.isArray(q.right_items)||q.left_items.length<2||q.left_items.length!==q.right_items.length||[...q.left_items,...q.right_items].some(v=>!String(v).trim())))throw Error("راجع عناصر التوصيل في السؤال "+(i+1));
 }
}
function renderEditor(){
 const container=$("ql-question-editor");container.replaceChildren();
 $("ql-question-counter").textContent=questions.length+" سؤال";
 if(!questions.length){container.append(el("p","ql-empty","لا توجد أسئلة بعد. ارفع المحاضرة وولّد الأسئلة، أو أضف سؤالًا يدويًا."));return;}
 questions.forEach((q,index)=>{
   const card=el("article","ql-question"),top=el("div","ql-question-top"),meta=el("div");
   meta.append(el("span","ql-type-label",String(index+1).padStart(2,"0")+" · "+kinds[q.type]));
   top.append(meta,btn("حذف السؤال",()=>{questions.splice(index,1);renderEditor()},"danger"));
   card.append(top,field("نص السؤال",q.prompt,v=>q.prompt=v,"textarea"));
   if(q.type==="mcq"){
     q.options.forEach((option,i)=>card.append(field("الخيار "+String.fromCharCode(65+i),option,v=>q.options[i]=v)));
     const label=el("label","","مفتاح التصحيح للمدير فقط");
     const select=el("select");
     for(let i=0;i<4;i++){const opt=el("option","",String.fromCharCode(65+i));opt.value=String(i);select.append(opt);}
     select.value=String(q.answer_key??0);
     select.addEventListener("change",()=>q.answer_key=Number(select.value));label.append(select);card.append(label);
   }else if(q.type==="true_false"){
     const label=el("label","","الجواب الصحيح (خاص بالمدير)");
     const select=el("select");
     for(const [val,txt] of [["true","صحيح"],["false","خطأ"]]){const opt=el("option","",txt);opt.value=val;select.append(opt);}
     select.value=String(q.answer_key??true);select.addEventListener("change",()=>q.answer_key=select.value==="true");
     label.append(select);card.append(label);
   }else if(q.type==="matching"){
     card.append(el("p","ql-muted","اربط كل عنصر في العمود الأول برقم الاختيار الصحيح من العمود الثاني. مفاتيح التوصيل تبقى للمدير فقط."));
     q.left_items.forEach((value,i)=>{
       card.append(field("العنصر الأيسر "+(i+1),value,v=>q.left_items[i]=v));
     });
     q.right_items.forEach((value,i)=>{
       card.append(field("الخيار الأيمن "+(i+1),value,v=>q.right_items[i]=v));
     });
     q.left_items.forEach((_,i)=>{
       const label=el("label","","إجابة العنصر "+(i+1));
       const select=el("select");
       for(let j=0;j<q.right_items.length;j++){const opt=el("option","",String(j+1));opt.value=String(j);select.append(opt);}
       select.value=String(Array.isArray(q.answer_key)?q.answer_key[i]??i:i);
       select.addEventListener("change",()=>{if(!Array.isArray(q.answer_key))q.answer_key=[];q.answer_key[i]=Number(select.value)});
       label.append(select);card.append(label);
     });
   }else{
     card.append(field("إجابة مقترحة للمدير فقط",String(q.answer_key||""),v=>q.answer_key=v,"textarea"));
     if(q.type==="essay")card.append(field("معايير التصحيح (اختياري)",q.rubric||"",v=>q.rubric=v,"textarea"));
   }
   if(q.source_excerpt)card.append(el("p","ql-question-source","مقتطف داعم من المحاضرة: "+q.source_excerpt));
   container.append(card);
 });
}
function resetBuilder(){
 const preferredLanguage=$("ql-language").value;
 $("ql-config").reset();$("ql-count").value="10";$("ql-duration").value="60";
 $("ql-language").value=preferredLanguage;
 $("ql-file-label").textContent="لم يتم اختيار ملف بعد";
 questions=[];editingId=null;editingSourcePath=null;editingSourceFilename="";
 $("ql-save-draft").textContent="حفظ الامتحان كمسودة";
 renderEditor();status("ql-save-status","");status("ql-generate-status","");
}
async function authenticate(){
 if(!client){status("ql-login-status","اتصال Supabase غير متاح.","error");return;}
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user){$("ql-login-panel").hidden=false;$("ql-workspace").hidden=true;return;}
 const {data:owner,error:roleError}=await client.from("nabd_exam_owner").select("user_id").eq("user_id",user.id).maybeSingle();
 if(roleError||owner?.user_id!==user.id){
   director=null;$("ql-login-panel").hidden=false;$("ql-workspace").hidden=true;
   status("ql-login-status","هذا الحساب ليس حساب المدير المخوّل. بوابة الامتحانات والجودة للمدير العام فقط.","error");
   return;
 }
 director=user;$("ql-login-panel").hidden=true;$("ql-workspace").hidden=false;
 $("ql-director-email").textContent=user.email||"";
 await Promise.all([loadCourses(),loadExams(),loadGraderStatus()]);
}
// Persistent server-side AI grading agent. Only the logged-in director may toggle it.
let graderEnabled=false,graderBusy=false;
function graderButtons(){
 $("ql-bot-start").disabled=graderBusy||graderEnabled;
 $("ql-bot-stop").disabled=!graderEnabled;
 $("ql-bot-run").disabled=graderBusy||!graderEnabled;
 $("ql-bot-refresh").disabled=graderBusy;
}
async function loadGraderStatus(){
 if(!director)return;
 const {data,error}=await client.rpc("nabd_gradebot_status");
 if(error||!data){
   status("ql-bot-status","تعذّر قراءة حالة بوت التصحيح. تحقق من اتصال قاعدة البيانات.","error");
   return;
 }
 graderEnabled=Boolean(data.enabled);
 const state=$("ql-bot-state");
 state.textContent=graderEnabled?"يعمل تلقائيًا":"متوقف";
 state.className="ql-tag"+(graderEnabled?" ql-tag-green":"");
 const last=data.last_run?isoDate(data.last_run):"لم يبدأ بعد";
 $("ql-bot-summary").textContent=
   "بانتظار التصحيح الآلي: "+(data.pending||0)+
   " · تتطلب مراجعة: "+(data.needs_review||0)+
   " · مرات التصحيح: "+(data.total_graded||0)+
   " · آخر تشغيل: "+last;
 if(data.last_error)status("ql-bot-status","آخر مشكلة تشغيل: "+String(data.last_error).slice(0,200),"error");
 graderButtons();
}
async function setGrader(enabled){
 if(!director||(graderBusy&&enabled))return;
 if(enabled&&!window.confirm("تشغيل بوت التصحيح الذكي؟ سيصحح جميع الإجابات المعلّقة تدريجيًا، ويعرض درجات أولية وملاحظات للطلاب. ستظل درجات الأسئلة المقالية قابلة لمراجعتك واعتمادك."))return;
 if(!enabled&&!window.confirm("إيقاف بوت التصحيح؟ سيتوقف التقييم الآلي الجديد على الخادم، وستبقى النتائج المحفوظة كما هي."))return;
 graderBusy=true;graderButtons();
 status("ql-bot-status",enabled?"جارٍ تشغيل بوت التصحيح على الخادم…":"جارٍ إيقاف بوت التصحيح…");
 try{
   const {data,error}=await client.rpc("nabd_gradebot_toggle",{p_enabled:enabled});
   if(error||data?.enabled!==enabled)throw Error(error?.message||"لم يؤكد الخادم تحديث حالة البوت.");
   graderEnabled=enabled;
   await loadGraderStatus();
   status("ql-bot-status",enabled?"تم تشغيل البوت على الخادم؛ سيصحح الإجابات المعلّقة تلقائيًا كل دقيقة.":"تم إيقاف البوت. لن تُعتمد نتائج آلية جديدة حتى تعيد تشغيله.","success");
   if(enabled)await runGraderNow(true);
 }catch(e){status("ql-bot-status","تعذّر تغيير حالة البوت: "+String(e?.message||e).slice(0,190),"error");}
 finally{graderBusy=false;graderButtons();}
}
async function runGraderNow(fromStart=false){
 if(!director||!graderEnabled||(!fromStart&&graderBusy))return;
 if(!fromStart){graderBusy=true;graderButtons();}
 status("ql-bot-status","جارٍ فحص طابور الإجابات وتصحيح الدفعة الأولى…");
 try{
   const {data,error}=await client.functions.invoke("nabd-quality-autograde",{body:{action:"run"}});
   let details=data;
   if(error?.context?.clone){try{details=await error.context.clone().json()}catch{}}
   if(error||!details?.ok)throw Error(details?.error||error?.message||"لم يستجب خادم التصحيح.");
   status("ql-bot-status",details.enabled?
     "اكتمل فحص الدفعة: "+details.graded+" درجة أولية، "+details.review+" تتطلب مراجعة، "+details.errors+" أخطاء. يتابع البوت بقية الإجابات تلقائيًا.":
     "البوت متوقف. لم يتم إجراء أي تصحيح.","success");
   await Promise.all([loadExams(),loadGraderStatus()]);
 }catch(e){status("ql-bot-status","تعذّر تصحيح الدفعة: "+String(e?.message||e).slice(0,190),"error");}
 finally{if(!fromStart){graderBusy=false;graderButtons();}}
}
$("ql-bot-start").addEventListener("click",()=>setGrader(true));
$("ql-bot-stop").addEventListener("click",()=>setGrader(false));
$("ql-bot-run").addEventListener("click",()=>runGraderNow());
$("ql-bot-refresh").addEventListener("click",loadGraderStatus);
graderButtons();
$("ql-login-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!client)return;
 const email=$("ql-email").value.trim(),password=$("ql-password").value;
 const b=$("ql-login-btn");b.disabled=true;status("ql-login-status","جارٍ التحقق…");
 const {error}=await client.auth.signInWithPassword({email,password});
 $("ql-password").value="";b.disabled=false;
 if(error)return status("ql-login-status","فشل تسجيل الدخول. راجع البريد وكلمة المرور.","error");
 await authenticate();
});
$("ql-logout").addEventListener("click",async()=>{
 await client.auth.signOut();director=null;$("ql-workspace").hidden=true;$("ql-login-panel").hidden=false;
 status("ql-login-status","تم تسجيل الخروج.","success");
});
$("ql-pdf").addEventListener("change",()=>{
 const f=$("ql-pdf").files[0];
 $("ql-file-label").textContent=f?f.name+" · "+(f.size/1048576).toFixed(2)+" MB":"لم يتم اختيار ملف بعد";
});
$("ql-new").addEventListener("click",resetBuilder);
$("ql-language").addEventListener("change",()=>{
 if(questions.length){
   status("ql-generate-status","تغيير اللغة لا يترجم الأسئلة الموجودة تلقائيًا. اضغط «توليد الأسئلة من PDF» لتوليد نسخة كاملة باللغة المختارة.");
 }
});
function generatedLanguageMatches(items,lang){
 const arabic=/[\u0600-\u06FF]/u;
 return items.every(q=>{
   const texts=[q.prompt,q.source_excerpt,q.rubric,q.answer_key,
     ...(q.options||[]),...(q.left_items||[]),...(q.right_items||[])]
     .filter(x=>typeof x==="string"&&x.length);
   return lang==="en"?texts.every(x=>!arabic.test(x)):
     arabic.test(q.prompt||"");
 });
}
$("ql-add-question").addEventListener("click",()=>{
 questions.push(freshQuestion($("ql-manual-type").value));renderEditor();
 $("ql-preview").scrollIntoView({behavior:"smooth"});
});
async function loadCourses(){
 const {data,error}=await client.from("courses").select("id,title_ar,title_en").order("title_ar").limit(150);
 if(error)return;
 const sel=$("ql-course");sel.replaceChildren(new Option("جميع طلاب الأكاديمية",""));
 (data||[]).forEach(c=>sel.append(new Option(c.title_ar||c.title_en||"مقرر",c.id)));
}
// Scanned PDFs are first-class inputs. Text PDFs use the fast route; image PDFs
// use native PDF vision (Gemini) or sampled page images (Groq vision fallback).
function encodeBase64(bytes){
 const parts=[];
 for(let i=0;i<bytes.length;i+=16384){
   const block=bytes.subarray(i,i+16384);
   let str="";
   for(let j=0;j<block.length;j++)str+=String.fromCharCode(block[j]);
   parts.push(str);
 }
 return btoa(parts.join(""));
}
async function renderPageAsJpeg(page){
 // Keep image uploads small enough for low-bandwidth networks and Groq Vision.
 const base=page.getViewport({scale:1});
 const scale=Math.min(1.5,1100/Math.max(base.width,base.height));
 const viewport=page.getViewport({scale:Math.max(.8,scale)});
 let canvas=document.createElement("canvas");
 canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
 const ctx=canvas.getContext("2d",{alpha:false});
 if(!ctx)throw Error("لا يدعم هذا المتصفح معالجة صفحات PDF المصوّرة.");
 ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);
 await page.render({canvasContext:ctx,viewport}).promise;
 let url="";
 for(let attempt=0;attempt<5;attempt++){
   url=canvas.toDataURL("image/jpeg",Math.max(.4,.69-attempt*.06));
   if(url.length<=210000)break;
   const factor=Math.max(.65,Math.min(.87,Math.sqrt(200000/url.length)));
   const smaller=document.createElement("canvas");
   smaller.width=Math.max(480,Math.floor(canvas.width*factor));
   smaller.height=Math.max(480,Math.floor(canvas.height*factor));
   if(smaller.width===canvas.width&&smaller.height===canvas.height)break;
   const cx=smaller.getContext("2d",{alpha:false});
   if(!cx)break;
   cx.fillStyle="#ffffff";cx.fillRect(0,0,smaller.width,smaller.height);
   cx.drawImage(canvas,0,0,smaller.width,smaller.height);
   canvas.width=0;canvas.height=0;canvas=smaller;
 }
 canvas.width=0;canvas.height=0;
 if(url.length>280000)throw Error("تعذّر ضغط صورة المحاضرة. جرّب PDF أقل دقة.");
 return url.slice(url.indexOf(",")+1);
}
async function extractPDF(file){
 if(!file||file.size<100||file.size>15728640||!/\.pdf$/i.test(file.name))throw Error("يرجى اختيار PDF حجمه لا يتجاوز 15 ميغابايت.");
 if(await file.slice(0,5).text()!=="%PDF-")throw Error("الملف ليس PDF صالحًا.");
 const pdfjs=await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs");
 pdfjs.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
 const buffer=await file.arrayBuffer();
 const pdf=await pdfjs.getDocument({data:new Uint8Array(buffer.slice(0)),isEvalSupported:false}).promise;
 const chunks=[],pagesWithText=[];
 const maxPages=Math.min(pdf.numPages,60);
 let chars=0;
 for(let p=1;p<=maxPages;p++){
   const page=await pdf.getPage(p),items=await page.getTextContent();
   const line=items.items.map(i=>typeof i.str==="string"?i.str:"").join(" ").trim();
   if(line.length>=55)pagesWithText.push(p);
   if(line&&chars<32000){const segment=("صفحة "+p+": "+line+"\n").slice(0,32000-chars);
     chunks.push(segment);chars+=segment.length;}
 }
 const content=chunks.join("").slice(0,32000);
 // Also detects mixed PDFs where most material is scanned but an introduction
 // or decorative page contains enough selectable text to fool basic detection.
 const scanned=content.length<200 || pagesWithText.length<Math.ceil(maxPages*.50);
 if(!scanned)return {mode:"text",text:content,page_count:pdf.numPages};
 status("ql-generate-status","تعرّفت على PDF مصوّر. جارٍ تجهيز صور الصفحات لقراءتها بالذكاء الاصطناعي…");
 // Up to nine evenly spread pages for the Groq vision fallback. Gemini receives
 // the full PDF (<=5 MB), not just these samples.
 const samples=Math.min(maxPages,9),numbers=[];
 for(let i=0;i<samples;i++){
   const p=samples===1?1:Math.min(maxPages,1+Math.round(i*(maxPages-1)/(samples-1)));
   if(!numbers.includes(p))numbers.push(p);
 }
 const images=[];
 for(const p of numbers){
   status("ql-generate-status","PDF مصوّر: تجهيز الصفحة "+p+" من "+pdf.numPages+"…");
   const page=await pdf.getPage(p);
   images.push({page:p,mime_type:"image/jpeg",data:await renderPageAsJpeg(page)});
 }
 let pdfBase64=(file.size<=5*1024*1024 && pdf.numPages<=5) ? encodeBase64(new Uint8Array(buffer)) : null;
 const imagePayloadSize=images.reduce((total,p)=>total+p.data.length,0);
 // Keep the complete request below the Edge Function body guard; when too large,
 // vision falls back to carefully selected image pages rather than failing.
 if(pdfBase64&&pdfBase64.length+imagePayloadSize>8500000)pdfBase64=null;
 return {mode:"vision",source_text:content.slice(0,16000),page_images:images,
   pdf_base64:pdfBase64,page_count:pdf.numPages};
}
$("ql-generate").addEventListener("click",async()=>{
 if(!director)return;
 const file=$("ql-pdf").files[0],title=$("ql-title").value.trim();
 const chosenLanguage=$("ql-language").value;
 const count=Number($("ql-count").value),types=Array.from($("ql-config").querySelectorAll(".ql-types input:checked")).map(x=>x.value);
 if(!file)return status("ql-generate-status","ارفع المحاضرة بصيغة PDF أولًا.","error");
 if(title.length<3)return status("ql-generate-status","اكتب عنوان الامتحان أولًا.","error");
 if(!types.length||!Number.isInteger(count)||count<1||count>30)return status("ql-generate-status","اختر نوعًا واحدًا على الأقل، وعددًا بين 1 و30.","error");
 const b=$("ql-generate");b.disabled=true;status("ql-generate-status","جارٍ قراءة PDF واستخراج نص المحاضرة…");
 try{
   const extracted=await extractPDF(file);
   status("ql-generate-status",extracted.mode==="vision"?
      "الملف مصوّر. يجري تحليل الصفحات بصريًا واستنباط الأسئلة من محتواها…":
      "تم استخراج نص المحاضرة. يجري توليد الأسئلة المطلوبة…");
   const body={title,types,count,language:chosenLanguage,
     source_text:extracted.mode==="text"?extracted.text:extracted.source_text||"",
     page_count:extracted.page_count};
   if(extracted.mode==="vision"){body.page_images=extracted.page_images;body.pdf_base64=extracted.pdf_base64;}
   const {data,error}=await client.functions.invoke("nabd-quality-generate",{body});
   if(error||!data?.ok||!Array.isArray(data.questions)){
     let detail=data;
     if(error?.context && typeof error.context.json==="function"){
       try{detail=await error.context.clone().json();}catch{}
     }
     const code=detail?.error,network=!navigator.onLine;
     const messages={
       AI_PROVIDER_NOT_CONFIGURED:"مفاتيح الذكاء الاصطناعي غير مُعَدّة في الخادم.",
       AI_PROVIDER_AUTH_FAILED:"مفتاح خدمة الذكاء الاصطناعي غير مقبول؛ يحتاج إلى تحديث.",
       AI_RATE_LIMITED:"وصل مزود الذكاء الاصطناعي لحد الاستخدام. أعد المحاولة لاحقًا.",
       VISION_REQUEST_TOO_LARGE:"الصور المرسلة كبيرة جدًا. جرّب ملفًا أقصر أو أقل دقة.",
       AI_PROVIDER_UNAVAILABLE:"خدمة الذكاء الاصطناعي مشغولة مؤقتًا. حاول مجددًا بعد قليل.",
       AUTH_EXPIRED:"انتهت جلسة تسجيل الدخول. سجل الدخول مجددًا.",
       DIRECTOR_ONLY:"هذا الحساب غير مخوّل بتوليد أسئلة الامتحانات.",
       INVALID_PDF_IMAGES:"حدث خطأ في تجهيز صفحات PDF. جرّب ملفًا آخر.",
       AI_LANGUAGE_MISMATCH:"لم تلتزم خدمة التوليد بلغة الامتحان المختارة. يرجى إعادة المحاولة."
     };
     throw Error(detail?.message||messages[code]||(network?
       "يبدو أن اتصال الإنترنت انقطع أثناء التوليد.":
       "تعذّر توليد الأسئلة. تحقق من اتصال الإنترنت أو حاول تقليل عدد الأسئلة."));
   }
   if($("ql-language").value!==chosenLanguage){
     throw Error("تغيّرت لغة الامتحان أثناء توليد الأسئلة. أعد التوليد باللغة التي تريدها.");
   }
   if(data.language!==chosenLanguage||!generatedLanguageMatches(data.questions,chosenLanguage)){
     throw Error("تم رفض النتيجة لأن لغة الأسئلة لا تطابق اللغة المختارة. حاول التوليد مجددًا.");
   }
   if(questions.length && !window.confirm("يوجد بنك أسئلة غير محفوظ. هل تريد استبداله بالأسئلة الجديدة؟"))return;
   questions=data.questions;renderEditor();
   const coverage=data.source_mode==="sampled_images"?
      " جرى تحليل صفحات ممثّلة من الملف؛ لم تُحلَّل كل صفحاته، فراجع تغطية المحاضرة.":
      " راجع دقة الأسئلة ومفاتيحها مقارنة بالمحاضرة.";
   status("ql-generate-status","تم توليد "+questions.length+" سؤالًا باللغة "+(chosenLanguage==="en"?"الإنجليزية":"العربية")+" من "+(extracted.mode==="vision"?"الصفحات المصوّرة":"نص المحاضرة")+"."+coverage,"success");
   $("ql-preview").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){status("ql-generate-status",e.message||"تعذر إنشاء الأسئلة من هذا الملف.","error")}
 finally{b.disabled=false;}
});
async function uploadFile(f){
 if(!f)return null;
 if(f.size<100||f.size>15728640||!/\.pdf$/i.test(f.name)||await f.slice(0,5).text()!=="%PDF-")
   throw Error("ملف PDF غير صالح أو أكبر من 15 ميغابايت.");
 const path=director.id+"/"+crypto.randomUUID()+".pdf";
 const {error}=await client.storage.from(bucket).upload(path,f,{contentType:"application/pdf",upsert:false});
 if(error)throw Error("تعذر رفع المحاضرة إلى التخزين الخاص. تحقق من الاتصال وصلاحيات الحساب.");
 return path;
}
$("ql-save-draft").addEventListener("click",async()=>{
 if(!director)return;
 try{validateQuestions()}catch(e){return status("ql-save-status",e.message,"error");}
 const title=$("ql-title").value.trim(),mins=Number($("ql-duration").value),course=$("ql-course").value||null;
 if(title.length<3||title.length>220||!Number.isInteger(mins)||mins<5||mins>180)return status("ql-save-status","تحقق من عنوان الامتحان والمدة من 5 إلى 180 دقيقة.","error");
 const b=$("ql-save-draft");b.disabled=true;status("ql-save-status","جارٍ حفظ المسودة…");
 let uploaded=null;
 try{
   const file=$("ql-pdf").files[0];
   if(file)uploaded=await uploadFile(file);
   const values={title,course_id:course,source_filename:file?.name||editingSourceFilename||"",
     source_path:uploaded||editingSourcePath||null,questions,duration_minutes:mins,updated_at:new Date().toISOString()};
   const result=editingId
     ? await client.from("nabd_quality_exams").update(values).eq("id",editingId).eq("status","draft").select("id").maybeSingle()
     : await client.from("nabd_quality_exams").insert({...values,status:"draft",created_by:director.id}).select("id").maybeSingle();
   if(result.error||!result.data)throw Error("تعذر حفظ المسودة. تحقق من الصلاحيات أو حدّث الصفحة.");
   const previousPath=editingSourcePath;
   resetBuilder();
   status("ql-save-status","تم حفظ المسودة. لا تظهر للطلاب حتى تضغط «اعتماد ونشر الآن» من قسم التحكم.","success");
   if(uploaded&&previousPath&&previousPath!==uploaded)await client.storage.from(bucket).remove([previousPath]);
   await loadExams();
 }catch(e){if(uploaded)await client.storage.from(bucket).remove([uploaded]);status("ql-save-status",e.message||"تعذر حفظ المسودة.","error")}
 finally{b.disabled=false}
});
async function loadExams(){
 if(!director)return;
 const {data,error}=await client.from("nabd_quality_exams")
   .select("id,title,source_filename,source_path,questions,course_id,duration_minutes,status,opens_at,closes_at,created_at")
   .eq("created_by",director.id).order("created_at",{ascending:false}).limit(100);
 if(error){status("ql-list-status","تعذر تحميل الامتحانات.","error");return;}
 exams=data||[];
 $("ql-draft-count").textContent=exams.filter(x=>x.status==="draft").length;
 $("ql-active-count").textContent=exams.filter(x=>x.status==="published"&&new Date(x.closes_at)>new Date()).length;
 await countPending();
 renderExams();
}
async function countPending(){
 const liveIds=exams.filter(x=>x.status!=="draft").map(x=>x.id);
 if(!liveIds.length){$("ql-pending-count").textContent="0";return;}
 const {data}=await client.from("nabd_quality_submissions").select("id,human_score").in("exam_id",liveIds).limit(1500);
 $("ql-pending-count").textContent=(data||[]).filter(x=>x.human_score===null).length;
}
// Deliberate deletion only. Never delete an active published exam or any
// exam that has student submissions. Retain source files if another exam uses them.
async function deleteExam(x,trigger){
 if(!director)return;
 if(x.status==="published" && new Date(x.closes_at)>new Date()){
   status("ql-list-status","لا يمكن حذف امتحان منشور ونشط. أغلقه أولًا من قسم التحكم، ثم حاول مجددًا.","error");
   return;
 }
 trigger.disabled=true;
 try{
   const {count,error:countError}=await client.from("nabd_quality_submissions")
     .select("id",{count:"exact",head:true}).eq("exam_id",x.id);
   if(countError)throw Error("تعذّر التحقق من إجابات الطلاب؛ لم يُحذف الامتحان.");
   if(count>0)throw Error("لا يمكن حذف هذا الامتحان لوجود إجابات طلاب محفوظة. ستبقى النتائج والتسليمات محمية.");
   const label="«"+x.title+"»";
   if(!window.confirm("هل تريد حذف الامتحان "+label+" نهائيًا؟ ستُحذف أسئلته وإعداداته ولا يمكن استعادتها."))return;
   if(!window.confirm("تأكيد أخير: حذف "+label+" بشكل نهائي؟"))return;
   status("ql-list-status","جارٍ حذف الامتحان والتحقق من نجاح العملية…");
   // Scope deletion to this director, the selected row, and its current state.
   // A concurrent publication or edit must not cause the wrong exam to be deleted.
   const {data:deleted,error}=await client.from("nabd_quality_exams")
     .delete().eq("id",x.id).eq("created_by",director.id)
     .eq("status",x.status).select("id").maybeSingle();
   if(error){
     if(error.code==="23503")throw Error("لا يمكن حذف الامتحان بسبب وجود تسليمات مرتبطة به.");
     throw Error("فشل حذف الامتحان: "+String(error.message||"خطأ في الخادم").slice(0,190));
   }
   if(deleted?.id!==x.id)throw Error("لم يُحذف الامتحان؛ ربما تغيّرت حالته. حدّث القائمة وحاول مجددًا.");
   if(editingId===x.id)resetBuilder();
   let fileNotice="";
   if(x.source_path){
     const {data:references,error:referenceError}=await client.from("nabd_quality_exams")
       .select("id").eq("source_path",x.source_path).limit(1);
     if(referenceError){
       fileNotice=" تعذّر التأكد من استخدام ملف المحاضرة، لذا احتُفظ به احتياطيًا.";
     }else if(!references?.length){
       const {error:storageError}=await client.storage.from(bucket).remove([x.source_path]);
       if(storageError)fileNotice=" حُذف الامتحان، لكن تعذّر تنظيف ملف PDF المرتبط.";
     }
   }
   await loadExams();
   status("ql-list-status","تم حذف الامتحان "+label+" بنجاح."+fileNotice,"success");
 }catch(e){
   status("ql-list-status",String(e?.message||"تعذّر حذف الامتحان."),"error");
 }finally{trigger.disabled=false;}
}
function renderExams(){
 const list=$("ql-exam-list");list.replaceChildren();
 if(!exams.length){list.append(el("p","ql-empty","لم تنشئ امتحانات بعد. ارفع محاضرة وابدأ أول مسودة."));return;}
 exams.forEach(x=>{
   const card=el("article","ql-list-item"),top=el("div","ql-list-heading");
   top.append(el("h3","",x.title));
   const isLive=x.status==="published"&&new Date(x.closes_at)>new Date();
   const phase=x.status==="draft"?"مسودة غير منشورة":isLive?"منشور الآن":x.status==="closed"?"مغلق يدويًا":"انتهت المدة تلقائيًا";
   top.append(el("span","ql-tag"+(isLive?" ql-tag-green":""),phase));card.append(top);
   const meta=el("div","ql-list-meta");
   for(const v of [(x.questions||[]).length+" سؤال",x.duration_minutes+" دقيقة",x.source_filename||"أسئلة يدوية",
     x.opens_at?"من "+isoDate(x.opens_at):"بانتظار الموافقة",
     x.closes_at?"إغلاق "+isoDate(x.closes_at):""]){if(v)meta.append(el("span","",v));}
   card.append(meta);
   const actions=el("div","ql-list-actions");
   if(x.status==="draft"){
     actions.append(btn("مراجعة وتعديل",()=>editExam(x)));
     const publish=btn("✓ اعتماد ونشر الآن",async()=>{
       if(!window.confirm("اعتماد ونشر الامتحان «"+x.title+"» الآن لمدة "+x.duration_minutes+" دقيقة؟ سيتمكن طلاب الأكاديمية من دخوله فورًا ولا يمكن التراجع عن تسليماتهم."))return;
       publish.disabled=true;
       status("ql-list-status","جارٍ طلب الاعتماد والتحقق من حالة الامتحان…");
       try{
         // A successful HTTP response can be lost if the connection drops.
         // Verify the record before reporting failure or issuing another publish.
         const {data,error}=await client.rpc("nabd_quality_publish_exam",{p_exam:x.id});
         const returned=Array.isArray(data)?data[0]:data;
         if(!error && returned?.closes_at){
           status("ql-list-status","نُشر الامتحان الآن، وسيغلق تلقائيًا عند "+isoDate(returned.closes_at)+".","success");
           await loadExams();
           return;
         }
         const {data:current,error:readError}=await client.from("nabd_quality_exams")
           .select("status,opens_at,closes_at").eq("id",x.id).maybeSingle();
         if(!readError && current?.status==="published"){
           status("ql-list-status","تم تأكيد النشر بنجاح، ويغلق الامتحان عند "+isoDate(current.closes_at)+".","success");
           await loadExams();
           return;
         }
         const code=String(error?.code||"");
         const raw=String(error?.message||"");
         const friendly={
           PGRST202:"خدمة قاعدة البيانات لم تُحدّث تعريف دالة النشر. أعد تحديث الصفحة ثم المحاولة.",
           PGRST301:"انتهت جلسة الدخول؛ سجّل الدخول مجددًا.",
           "42501":"لا توجد صلاحية كافية لتنفيذ اعتماد الامتحان.",
           "23514":"بيانات المسودة لم تستوفِ شروط نشر الامتحان."
         };
         const msg=friendly[code]||
           (/EXAM_NOT_READY_OR_NOT_FOUND/.test(raw)?"لم تُعثر على مسودة جاهزة للنشر لهذا الحساب.":
           /DIRECTOR_ONLY/.test(raw)?"يجب الدخول بحساب مدير الامتحانات المخوّل.":
           /Failed to fetch|NetworkError/i.test(raw)?"تعذر الاتصال بالخادم؛ راجع اتصال الإنترنت وحاول من جديد.":
           (raw ? "تعذر النشر: "+raw.slice(0,220) : "تعذر النشر: لم تُرجع قاعدة البيانات نتيجة اعتماد."));
         console.warn("NABD exam publishing error",{code,message:raw,details:error?.details,hint:error?.hint});
         status("ql-list-status",msg+(code?" (رمز "+code+")":""),"error");
       }catch(err){
         status("ql-list-status","تعذر الاتصال أثناء النشر: "+String(err?.message||err).slice(0,180),"error");
       }finally{publish.disabled=false;}
     });publish.classList.add("ql-tag-green");actions.append(publish);
   } else {
     actions.append(btn("عرض إجابات الطلاب",()=>showGrading(x)));
     if(isLive)actions.append(btn("إغلاق الامتحان الآن",async()=>{
       if(!window.confirm("هل تريد إغلاق الامتحان الآن؟ سيُمنع تسليم إجابات جديدة."))return;
       const {error}=await client.from("nabd_quality_exams").update({status:"closed",updated_at:new Date().toISOString()}).eq("id",x.id);
       if(error)status("ql-list-status","تعذر الإغلاق.","error");else{status("ql-list-status","أُغلق الامتحان.","success");await loadExams();}
     },"danger"));
   }
   // Consistent deletion control for draft, closed and expired examinations.
   // Active examinations remain protected until the director closes them.
   const remove=btn("حذف الامتحان",()=>deleteExam(x,remove),"danger");
   actions.append(remove);
   card.append(actions);list.append(card);
 });
}
function editExam(x){
 editingId=x.id;editingSourcePath=x.source_path;editingSourceFilename=x.source_filename;
 $("ql-title").value=x.title;$("ql-duration").value=x.duration_minutes;$("ql-course").value=x.course_id||"";
 $("ql-pdf").value="";$("ql-file-label").textContent=x.source_filename?"المحاضرة الحالية: "+x.source_filename+" (يمكن اختيار بديل)":"لم يُرفع PDF";
 questions=structuredClone(x.questions||[]);
 if(questions.length){
   const arabic=/[\u0600-\u06FF]/u;
   const arCount=questions.filter(q=>arabic.test(q.prompt||"")).length;
   $("ql-language").value=arCount>=questions.length/2?"ar":"en";
 }
 renderEditor();
 $("ql-save-draft").textContent="حفظ تعديلات المسودة";
 status("ql-save-status","أنت تعدّل مسودة. تغييراتك لا تُنشر إلا بعد موافقتك.");
 $("ql-builder").scrollIntoView({behavior:"smooth",block:"start"});
}
async function showGrading(exam){
 $("ql-grading").hidden=false;$("ql-grading-title").textContent="التصحيح البشري · "+exam.title;
 $("ql-submissions").replaceChildren(el("p","ql-muted","جارٍ جلب إجابات الطلاب…"));
 const {data,error}=await client.from("nabd_quality_submissions")
  .select("id,student_id,answers,submitted_at,human_score,grade_notes,graded_at,ai_score,ai_notes,ai_status,ai_review_required,ai_graded_at")
  .eq("exam_id",exam.id).order("submitted_at",{ascending:false}).limit(250);
 if(error)return status("ql-grade-status","تعذر تحميل الإجابات.","error");
 const list=data||[];$("ql-submissions").replaceChildren();
 if(!list.length){$("ql-submissions").append(el("p","ql-empty","لم تُسلَّم إجابات لهذا الامتحان بعد."));return;}
 const ids=[...new Set(list.map(x=>x.student_id))];
 const {data:profiles}=await client.from("profiles").select("id,full_name,email").in("id",ids);
 const names=new Map((profiles||[]).map(p=>[p.id,p.full_name||p.email||p.id]));
 list.forEach(a=>{
   const wrap=el("article","ql-grade");
   wrap.append(el("h3","",(names.get(a.student_id)||a.student_id)+" · "+isoDate(a.submitted_at)));
   const summary=a.human_score!==null?"الدرجة البشرية المعتمدة: "+a.human_score+" / 100":
     a.ai_score!==null&&a.ai_score!==undefined?"الدرجة الآلية الأولية: "+a.ai_score+" / 100"+(a.ai_review_required?" — تحتاج مراجعة بشرية":""):
     a.ai_status==="needs_review"?"تعذّر حساب درجة آلية مؤكدة؛ يلزم تصحيح بشري.":
     a.ai_status==="processing"?"البوت يصحح هذه الإجابة الآن…":"بانتظار التصحيح";
   wrap.append(el("p","ql-muted",summary));
   if(a.ai_notes){
     const note=el("details","ql-muted");
     note.append(el("summary","","ملاحظات بوت التصحيح ومواطن الأخطاء"));
     note.append(el("p","",a.ai_notes));
     wrap.append(note);
   }
   const answer=el("div","ql-grade-answers");
   (exam.questions||[]).forEach((q,i)=>{
     const detail=el("div","ql-question-source",(i+1)+". "+q.prompt);
     const ans=a.answers?.[q.id];
     let val=Array.isArray(ans)?ans.map((v,j)=>"عنصر "+(j+1)+": "+(Number(v)+1)).join("، "):ans;
     if(q.type==="mcq" && Number.isInteger(Number(ans)))val="الخيار "+String.fromCharCode(65+Number(ans));
     if(q.type==="true_false")val=ans==="true"?"صحيح":ans==="false"?"خطأ":ans;
     detail.append(el("p","",val===null||val===undefined||val===""?"لم يُجب":String(val)));
     answer.append(detail);
   });
   wrap.append(answer);
   const grade=el("div","ql-two");
   const score=field("الدرجة البشرية المعتمدة من 100",
     a.human_score!==null?String(a.human_score):a.ai_score!==null&&a.ai_score!==undefined?String(a.ai_score):"",()=>{});
   const input=score.querySelector("input");input.type="number";input.min="0";input.max="100";input.step="0.5";
   const notes=field("ملاحظات المصحّح (اختياري)",a.grade_notes||a.ai_notes||"",()=>{},"textarea");grade.append(score,notes);
   wrap.append(grade,btn("اعتماد أو تعديل التصحيح يدويًا",async()=>{
     const n=Number(input.value);
     if(input.value===""||!Number.isFinite(n)||n<0||n>100)return status("ql-grade-status","أدخل درجة صحيحة بين 0 و100.","error");
     const {error:err}=await client.from("nabd_quality_submissions")
       .update({human_score:n,grade_notes:notes.querySelector("textarea").value.trim()||null,
        graded_at:new Date().toISOString(),graded_by:director.id}).eq("id",a.id);
     if(err)return status("ql-grade-status","تعذر حفظ التصحيح.","error");
     status("ql-grade-status","تم تسجيل تصحيح الطالب بنجاح.","success");
     await showGrading(exam);await countPending();
   }));
   $("ql-submissions").append(wrap);
 });
 $("ql-grading").scrollIntoView({behavior:"smooth",block:"start"});
}
$("ql-close-grading").addEventListener("click",()=>{$("ql-grading").hidden=true;});
document.addEventListener("visibilitychange",()=>{if(!document.hidden && director){loadExams();loadGraderStatus();}});
setInterval(()=>{if(director&&!document.hidden){loadExams();loadGraderStatus();}},60000);
renderEditor();authenticate();
})();