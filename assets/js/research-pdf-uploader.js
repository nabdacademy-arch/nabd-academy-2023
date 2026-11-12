/* NABD Academy Research PDF Upload v3
   Accepts PDF chosen from any browser-accessible Android/iOS file provider.
   Validates PDF content rather than extension or provider MIME. Uploads via
   TUS resumable chunks when available, with a standard fallback.
*/
(function(){
"use strict";
const MAX=50*1024*1024;
const SIX=6*1024*1024;
function formatSize(bytes){
 if(!Number.isFinite(bytes)||bytes<0)return "غير معروف";
 if(bytes<1024)return bytes+" بايت";
 if(bytes<1048576)return (bytes/1024).toFixed(1)+" كيلوبايت";
 return (bytes/1048576).toFixed(2)+" ميغابايت";
}
function create({client,bucket,userId,showStatus}){
 const input=document.getElementById("res-pdf");
 const details=document.getElementById("res-pdf-details");
 const dropzone=document.getElementById("res-dropzone");
 const progressArea=document.getElementById("res-upload-progress-wrap");
 const progress=document.getElementById("res-upload-progress");
 const progressText=document.getElementById("res-upload-progress-text");
 const cfg=window.NABD_CONFIG||{};
 let selected=null;
 let pending=null;
 const show=(message,kind)=>{if(typeof showStatus==="function")showStatus(message,kind);};
 function progressState(value,label){
   if(!progressArea||!progress||!progressText)return;
   progressArea.hidden=value===null;
   if(value===null){progress.value=0;progressText.textContent="";return;}
   progress.value=Math.max(0,Math.min(100,value));
   progressText.textContent=label||"";
 }
 function info(){
   if(!details)return;
   details.hidden=!selected;
   if(!selected){details.textContent="";details.dataset.invalid="false";return;}
   const oversize=selected.size>MAX;
   details.dataset.invalid=String(oversize);
   details.textContent="ملف البحث: "+(selected.name||"مستند من الهاتف")+
      " · الحجم الظاهر: "+formatSize(selected.size)+
      (oversize?" · أكبر من 50 ميغابايت":selected.size===0?
        " · جاري التحقق من محتواه عند الرفع، فقد لا يعلن التطبيق المصدر عن حجمه.":
        " · يمكن المتابعة إذا كان محتواه PDF صالحًا");
 }
 function select(file){
   selected=file||null;
   pending=null;
   progressState(null);
   info();
 }
 input?.addEventListener("change",()=>{
   select(input.files?.[0]||null);
 });
 if(dropzone){
   for(const evt of ["dragenter","dragover"]){
     dropzone.addEventListener(evt,e=>{e.preventDefault();dropzone.classList.add("is-dragging")});
   }
   for(const evt of ["dragleave","drop"]){
     dropzone.addEventListener(evt,e=>{
       e.preventDefault();
       dropzone.classList.remove("is-dragging");
       if(evt==="drop" && e.dataTransfer?.files?.length){
         select(e.dataTransfer.files[0]);
         // This is optional; some mobile browsers don't permit assigning files.
         try{
           if(typeof DataTransfer!=="undefined"){
             const data=new DataTransfer();data.items.add(selected);
             input.files=data.files;
           }
         }catch(_){}
       }
     });
   }
 }
 function clear(){
   selected=null;pending=null;
   if(input)input.value="";
   progressState(null);info();
 }
 function getFile(){return selected||input?.files?.[0]||null;}
 function readFileReader(file){
   return new Promise((resolve,reject)=>{
     if(typeof FileReader==="undefined")return reject(Error("FileReader unavailable"));
     const reader=new FileReader();
     reader.onload=()=>resolve(reader.result);
     reader.onerror=()=>reject(reader.error||Error("FileReader error"));
     try{reader.readAsArrayBuffer(file);}catch(err){reject(err);}
   });
 }
 async function access(file){
   if(!file)throw Error("اختر ملف البحث أولًا.");
   let body=file, size=Number(file.size)||0;
   if(size===0){
     // Virtual/share documents may lack metadata; try reading their actual bytes.
     let buffer=null;
     try{buffer=await file.arrayBuffer()}catch(_){}
     if(!buffer?.byteLength)try{buffer=await readFileReader(file)}catch(_){}
     if(buffer?.byteLength){body=new Blob([buffer],{type:"application/pdf"});size=buffer.byteLength;}
   }
   if(size===0)throw Error("لم يرسل تطبيق المصدر محتوى الملف إلى المتصفح (0 بايت). لا يمكن للموقع قراءة ملف لم يمنح التطبيق إذن الوصول إليه. افتح البوابة في متصفح الهاتف الكامل، ثم اختر الملف من أي مزود ملفات يسمح بالمشاركة.");
   if(size>MAX)throw Error("حجم الملف "+formatSize(size)+"؛ الحد الحالي 50 ميغابايت. اختر نسخة أصغر أو اضغط PDF.");
   if(size<5)throw Error("الملف غير مكتمل: "+formatSize(size)+". اختر المستند الأصلي وأعد المحاولة.");
   let bytes;
   try{
     bytes=new Uint8Array(await body.slice(0,5).arrayBuffer());
   }catch(_){try{bytes=new Uint8Array((await readFileReader(body)).slice(0,5));}catch(err){
     throw Error("المتصفح لا يستطيع قراءة البيانات التي أتاحها التطبيق المصدر. أعد اختيار الملف باستخدام متصفح Chrome أو Firefox في الهاتف.");
   }}
   if(bytes.length<5||bytes[0]!==37||bytes[1]!==80||bytes[2]!==68||bytes[3]!==70||bytes[4]!==45)
     throw Error("المستند ليس PDF صالحًا. يمكن اختيار الملف من أي تطبيق، لكن الأبحاث المنشورة يجب أن تكون بصيغة PDF.");
   return {body,size};
 }
 function errorText(error,size){
   const code=String(error?.statusCode||error?.status||error?.originalResponse?.getStatus?.()||"");
   const description=String(error?.message||error||"");
   if(code==="413"||/file size|payload too large|exceed.*limit|maximum.*size/i.test(description))
     return "الخادم رفض حجم الملف "+formatSize(size)+"؛ الحد الأعلى 50 ميغابايت (ويُطبّق حد المشروع العام أيضًا).";
   if(code==="401"||code==="403"||/row.level.security|unauthorized|not.authorized|permission denied/i.test(description))
     return "خادم التخزين رفض صلاحية رفع البحث. سجّل دخولك بحساب الباحث المعتمد ثم أعد المحاولة.";
   if(/mime|content.?type|invalid file type/i.test(description))
     return "الخادم رفض نوع الملف؛ يجب أن تكون البيانات PDF أصليًا.";
   if(/network|failed to fetch|offline|timeout/i.test(description))
     return "الاتصال انقطع أثناء الرفع. احتفظ بالصفحة مفتوحة وأعد المحاولة؛ الملفات الكبيرة تدعم إعادة المحاولة المجزأة.";
   return "تعذر رفع البحث ("+(code||"اتصال أو تخزين")+")؛ تحقق من الإنترنت وحاول مجددًا.";
 }
 async function uploadTus(body,size,path){
   const tus=window.tus;
   if(!tus?.Upload)throw Error("TUS_NOT_AVAILABLE");
   const {data:{session},error}=await client.auth.getSession();
   if(error||!session?.access_token)throw Error("انتهت جلسة الدخول؛ أعد تسجيل دخول الباحث.");
   const projectUrl=new URL(cfg.supabaseUrl);
   if(!/\.supabase\.co$/.test(projectUrl.hostname))throw Error("إعدادات خادم التخزين غير صحيحة.");
   const endpoint="https://"+projectUrl.hostname.replace(/\.supabase\.co$/,".storage.supabase.co")+"/storage/v1/upload/resumable";
   await new Promise((resolve,reject)=>{
     let uploader=new tus.Upload(body,{
       endpoint,
       headers:{
         authorization:"Bearer "+session.access_token,
         apikey:cfg.supabaseAnonKey
       },
       metadata:{bucketName:bucket,objectName:path,contentType:"application/pdf",cacheControl:"3600"},
       chunkSize:SIX,
       retryDelays:[0,2000,5000,10000,20000],
       uploadDataDuringCreation:true,
       removeFingerprintOnSuccess:true,
       fingerprint:()=>Promise.resolve("nabd-research-v3:"+path+":"+size),
       onProgress:(sent,total)=>progressState(total?Math.floor(sent/total*100):0,
         "رفع مجزّأ: "+Math.floor(sent/total*100)+"% من "+formatSize(total)),
       onSuccess:()=>resolve(),
       onError:e=>reject(e)
     });
     // Only resume an upload with the same unique path, avoiding stale objects.
     uploader.findPreviousUploads().then(previous=>{
       if(previous.length)uploader.resumeFromPreviousUpload(previous[0]);
       uploader.start();
     }).catch(reject);
   });
 }
 async function uploadPdf(file){
   const id=userId();
   if(!id)throw Error("يجب تسجيل دخول الباحث قبل رفع البحث.");
   const {body,size}=await access(file);
   const key=pending && pending.file===file && pending.size===size
     ? pending.path : id+"/"+crypto.randomUUID()+".pdf";
   pending={file,size,path:key};
   progressState(0,"جارٍ تجهيز الرفع…");
   try{
     if(size>SIX && window.tus?.Upload){
       await uploadTus(body,size,key);
     } else {
       // Native upload works for small files, or as a fallback if the CDN fails.
       show(size>SIX?"الرفع المتدرج غير متاح في هذا المتصفح؛ سأستخدم الرفع العادي.":"جارٍ إرسال الملف إلى التخزين…");
       const {error}=await client.storage.from(bucket).upload(key,body,{
         contentType:"application/pdf",cacheControl:"3600",upsert:false
       });
       if(error)throw error;
       progressState(100,"اكتمل رفع ملف PDF · "+formatSize(size));
     }
     pending=null;
     progressState(100,"تم رفع البحث بنجاح · "+formatSize(size));
     return key;
   }catch(err){
     progressState(null);
     // Preserve pending path on a TUS retry only; a standard upload can be
     // retried with a new path if the remote server reports a conflict.
     if(!window.tus?.Upload)pending=null;
     throw Error(errorText(err,size));
   }
 }
 return {getFile,clear,uploadPdf,formatSize};
}
window.NABDResearchPDFUploader={create,formatSize,maxBytes:MAX};
})();