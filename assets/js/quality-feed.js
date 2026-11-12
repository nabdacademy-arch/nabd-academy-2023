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
 async function update(){
   if(!client)return;
   const {data:{user}}=await client.auth.getUser();
   let active=[];
   if(user){
     const {data,error}=await client.rpc("nabd_quality_active_exams");
     if(!error)active=data||[];
   }
   hosts.forEach(host=>{
     const headline=create("strong","الامتحانات المعتمدة · NABD EXAMS","nqf-title");
     const intro=create("p",active.length?"لديك "+active.length+" امتحان متاح الآن بموافقة الإدارة.":"لن تظهر الامتحانات إلا بعد موافقة المدير وخلال الوقت المحدد.","nqf-copy");
     const list=create("div","","nqf-list");
     active.slice(0,3).forEach(item=>{
       const link=create("a",item.title+" · حتى "+new Intl.DateTimeFormat("ar-PS",{timeStyle:"short"}).format(new Date(item.closes_at)),"nqf-item");
       link.href="student-exams.html";list.append(link);
     });
     const open=create("a","افتح مركز امتحانات الطلاب ←","nqf-link");
     open.href="student-exams.html";
     host.replaceChildren(headline,intro,list,open);
   });
 }
 if(client?.auth?.onAuthStateChange)client.auth.onAuthStateChange(()=>{setTimeout(update,100)});
 update();
 setInterval(()=>{if(!document.hidden)update()},60000);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)update()});
})();