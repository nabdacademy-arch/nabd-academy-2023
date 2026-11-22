/* NABD authenticated exam-notice mini-feed; no drafts or answer keys in student portals. */
(function(){
 "use strict";
 const hosts=document.querySelectorAll("[data-quality-feed]");
 if(!hosts.length)return;
 const cfg=window.NABD_CONFIG||{};
 const client=window.nabdSupabase ||
  (window.supabase&&cfg.supabaseUrl&&cfg.supabaseAnonKey
    ? window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null);
 const create=(tag,text,css)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(css)x.className=css;return x;};
 let generation=0;
 let pending=false;
 let sessionUser;
 function render(active,notice){
   hosts.forEach(host=>{
     const headline=create("strong","الامتحانات المعتمدة · NABD EXAMS","nqf-title");
     const intro=create("p",notice||(active.length?"لديك "+active.length+" امتحان متاح الآن بموافقة الإدارة.":"لن تظهر الامتحانات إلا بعد موافقة المدير وخلال الوقت المحدد."),"nqf-copy");
     const list=create("div","","nqf-list");
     active.slice(0,3).forEach(item=>{
       const link=create("a",item.title+" · حتى "+new Intl.DateTimeFormat("ar-PS",{timeStyle:"short"}).format(new Date(item.closes_at)),"nqf-item");
       link.href=host.dataset.qualityDestination||"student-exams.html";list.append(link);
     });
     const open=create("a","افتح مركز امتحانات الطلاب ←","nqf-link");
     open.href=host.dataset.qualityDestination||"student-exams.html";
     host.replaceChildren(headline,intro,list,open);
   });
 }
 async function update(){
   if(!client||pending||sessionUser===null)return;
   const version=generation;
   pending=true;
   try{
     const {data,error}=await client.auth.getUser();
     if(version!==generation)return;
     if(error)throw error;
     const user=data?.user;
     if(!user){render([]);return;}
     if(sessionUser!==undefined&&user.id!==sessionUser)return;
     const result=await client.rpc("nabd_quality_active_exams");
     if(version!==generation)return;
     if(result.error)throw result.error;
     render(result.data||[]);
   }catch{
     if(version===generation)render([],"تعذّر تحديث قائمة الامتحانات. تحقق من الاتصال. / Could not refresh exams. Check your connection.");
   }finally{
     if(version===generation)pending=false;
   }
 }
 if(client?.auth?.onAuthStateChange)client.auth.onAuthStateChange((event,session)=>{
   const id=session?.user?.id||null;
   if(sessionUser===id)return;
   sessionUser=id;
   generation++;
   pending=false;
   render([],id?"جارٍ التحقق من الامتحانات المتاحة… / Checking available exams…":undefined);
   if(id)setTimeout(update,0);
 });
 update();
 setInterval(()=>{if(!document.hidden&&sessionUser!==null)update()},60000);
 function refreshVisible(){if(!document.hidden&&sessionUser!==null)update();}
 document.addEventListener("visibilitychange",refreshVisible);
 window.addEventListener("online",refreshVisible);
})();
