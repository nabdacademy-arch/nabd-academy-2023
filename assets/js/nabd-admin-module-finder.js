/* NABD director module finder: presentation only; role and data checks stay intact. */
(()=>{"use strict";
function init(){
 const app=document.getElementById("app"),tabs=app?.querySelector(".tabs");
 const category=document.getElementById("nabdAdminCategory"),search=document.getElementById("nabdAdminSearch"),result=document.getElementById("nabdAdminResults");
 if(!app||!tabs||!category||!search||!result)return;
 const groups={
  essential:["hopeScholarship","overview","students","enrollments","os-admin-suite","executiveTasks","consultations"],
  academic:["hopeScholarship","students","enrollments","claims","certificates","os-admin-suite","consultations"],
  operations:["overview","applications","executives","councilAccounts","mediaReview","executiveTasks","meetings","bulletins"],
  governance:["claims","certificates","feedback","resources","audit","councilAccounts"]
 };
 const aliases={hopeScholarship:"منحة نبض الأمل المنح التسجيل النتائج",students:"الطلاب",enrollments:"التسجيلات الدورات",claims:"طلبات الشهادات",certificates:"الشهادات",feedback:"الشكاوى المقترحات",applications:"الطلبات التنفيذية",overview:"نظرة عامة الملخص التنفيذي",councilAccounts:"حسابات المجالس","os-admin-suite":"التعليم الجودة المقررات الامتحانات",executives:"المناصب",mediaReview:"الإعلام الأخبار",executiveTasks:"المهام",meetings:"الاجتماعات",bulletins:"التعاميم",resources:"الوثائق",audit:"سجل القرارات",consultations:"الاستشارات الطبية",officialDocumentsEntry:"الوثائق الرسمية مركز طباعة المستندات"};
 const norm=value=>String(value||"").toLowerCase().normalize("NFKD").replace(/[\u064b-\u065f\u0670\u0640]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي");
 function render(){
  const query=norm(search.value.trim()),group=category.value;
  let total=0;
  for(const node of tabs.querySelectorAll("[data-tab],#officialDocumentsEntry")){
   const key=node.dataset.tab||node.id;
   const show=query?norm((aliases[key]||"")+" "+node.textContent).includes(query):group==="all"||(key==="officialDocumentsEntry"?group==="governance":(groups[group]||[]).includes(key));
   node.hidden=!show;if(show)total++;
  }
  result.textContent=query?(total?total+" قسم مطابق":"لا توجد أقسام مطابقة؛ جرّب عبارة أخرى."):total+" قسم في هذا العرض. بقية الأقسام متاحة من «جميع الأقسام».";
 }
 category.addEventListener("change",()=>{
  search.value="";render();
  if(app.classList.contains("hidden"))return;
  const selected=tabs.querySelector('[data-tab][aria-selected="true"]');
  if(selected?.hidden)tabs.querySelector('button[data-tab]:not([hidden])')?.click();
 });
 search.addEventListener("input",render);
 const initial=decodeURIComponent(location.hash.slice(1));
 if(initial&&!groups.essential.includes(initial))category.value="all";
 new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length||r.removedNodes.length))render();}).observe(tabs,{childList:true});
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
