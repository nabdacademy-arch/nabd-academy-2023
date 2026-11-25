(()=>{
"use strict";
const el=id=>document.getElementById(id);
if(!el("hope-metrics"))return;
const client=window.supabase.createClient("https://zsmmmljgguycrvyrmakl.supabase.co","sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM",{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const labels={
ar:["أعداد المنحة ↗","أعداد المنحة والنتائج","الأهداف المخططة ليست نتائج قبول، والقبول لا يعني تسليم الدعم.","المقبولون المخطط لهم","حجم قائمة الانتظار المخطط","القبول المنشور فعليًا","قائمة الانتظار المنشورة فعليًا","آخر تحديث","تعذر تحديث الأعداد"],
en:["Scholarship numbers ↗","Scholarship targets and results","Planned targets are not acceptance decisions; acceptance does not mean aid has been delivered.","Planned acceptances","Planned waitlist size","Published acceptances","Published waitlist","Last updated","Unable to refresh figures"],
fr:["Chiffres de la bourse ↗","Objectifs et résultats","Les objectifs ne sont pas des décisions d'admission ; l'admission ne signifie pas que l'aide a été versée.","Admissions prévues","Liste d'attente prévue","Admissions publiées","Liste d'attente publiée","Dernière mise à jour","Actualisation impossible"],
es:["Cifras de la beca ↗","Objetivos y resultados","Los objetivos no son decisiones de admisión; la admisión no implica la entrega de ayuda.","Admisiones previstas","Lista de espera prevista","Admisiones publicadas","Lista de espera publicada","Última actualización","No se pudieron actualizar las cifras"],
zh:["奖助计划人数 ↗","目标与结果","计划人数不代表录取决定，录取也不代表已发放援助。","计划录取人数","计划候补人数","已公布录取人数","已公布候补人数","最后更新","无法刷新人数"],
ru:["Числа программы ↗","Цели и результаты","Плановые показатели не являются решениями о зачислении; зачисление не означает получения помощи.","Планируемые места","Планируемый лист ожидания","Опубликованные решения о приёме","Опубликованный лист ожидания","Последнее обновление","Не удалось обновить данные"]};
const ids=["hope-metrics-link","hope-metrics-heading","hope-metrics-note","hope-plan-accepted-label","hope-plan-wait-label","hope-real-accepted-label","hope-real-wait-label"];
const targets=[...document.querySelectorAll('[data-t="tickerMain"],[data-t="missionText"],[data-t="qFour"],[data-t="aFour"],[data-hope="stickyLabel"]')];
let base=new Map(),data=null,failed=false,loading=false;
function capture(){base=new Map(targets.map(n=>[n,n.textContent]));}
function draw(){
 const lang=document.documentElement.lang||"ar",l=labels[lang]||labels.en;ids.forEach((id,i)=>{el(id).textContent=l[i]});
 const fmt=n=>Number(n).toLocaleString(lang);
 if(data){
  document.querySelectorAll("[data-hope-target]").forEach(n=>n.textContent=fmt(data.beneficiary_target));
  for(const [n,original] of base)n.textContent=original.replace(/100/g,fmt(data.beneficiary_target));
  el("hope-served-count").textContent=fmt(data.beneficiaries_served);
  for(const [id,val] of [["hope-plan-accepted",data.planned_acceptances],["hope-plan-wait",data.planned_waitlist],["hope-real-accepted",data.published_accepted],["hope-real-wait",data.published_waitlisted]]){el(id+"-box").hidden=val===null||val===undefined;el(id).textContent=val==null?"—":fmt(val);}
  el("hope-metrics-updated").textContent=l[7]+": "+new Date(data.updated_at).toLocaleString(lang)+(failed?" · "+l[8]:"");
 }else el("hope-metrics-updated").textContent=failed?l[8]:"";
}
async function refresh(){if(loading)return;loading=true;try{const r=await client.from("nabd_hope_public_metrics").select("beneficiary_target,planned_acceptances,planned_waitlist,beneficiaries_served,published_accepted,published_waitlisted,updated_at").eq("id",1).single();if(r.error||!r.data)throw Error("Unavailable");data=r.data;failed=false;}catch{failed=true;}finally{loading=false;draw();}}
capture();draw();refresh();
document.getElementById("language")?.addEventListener("change",()=>{capture();draw()});
window.addEventListener("focus",refresh);setInterval(()=>{if(!document.hidden)refresh()},30000);
})();