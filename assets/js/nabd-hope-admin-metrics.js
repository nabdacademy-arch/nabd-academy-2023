(()=>{
"use strict";
const el=id=>document.getElementById(id),form=el("hopeMetricsForm");if(!form)return;
const client=typeof db!=="undefined"?db:null;
let baseline=null,busy=false,epoch=0;
const msg=t=>el("hopeMetricsMsg").textContent=t;
const controls=()=>{el("hopeMetricsSave").disabled=busy||!baseline;el("hopeMetricsReload").disabled=busy;el("hopeMetricsEdit").disabled=busy;};
async function guard(){
 const {data:{user},error}=await client.auth.getUser();if(error||!user)throw Error("الدخول مطلوب.");
 const [o,p]=await Promise.all([client.from("nabd_exam_owner").select("user_id").eq("user_id",user.id).maybeSingle(),client.from("profiles").select("role").eq("id",user.id).maybeSingle()]);
 if(o.error||p.error||o.data?.user_id!==user.id||p.data?.role!=="admin")throw Error("المدير العام المخوّل فقط.");
}
function fill(m){
 baseline=m;el("hopeMetricsTarget").value=m.beneficiary_target;el("hopeMetricsAccept").value=m.planned_acceptances??"";el("hopeMetricsWait").value=m.planned_waitlist??"";el("hopeMetricsServed").value=m.beneficiaries_served;el("hopeMetricsShowAccepted").checked=m.published_accepted!==null;el("hopeMetricsShowWait").checked=m.published_waitlisted!==null;controls();
}
async function load(){
 if(!client||busy)return;let ticket=++epoch;busy=true;baseline=null;controls();msg("جارٍ تحميل الإعدادات…");
 try{await guard();const r=await client.from("nabd_hope_public_metrics").select("*").eq("id",1).single();if(r.error||!r.data)throw Error("تعذر تحميل الإعدادات.");if(ticket!==epoch)return;fill(r.data);msg("الإعدادات الحالية جاهزة للتعديل.");}
 catch(e){if(ticket===epoch)msg(e.message||"تعذر الاتصال.");}finally{busy=false;controls();}
}
el("hopeMetricsEdit").onclick=()=>{form.hidden=!form.hidden;if(!form.hidden)load();};
el("hopeMetricsReload").onclick=load;
form.onsubmit=async e=>{
 e.preventDefault();if(busy||!baseline||!form.reportValidity())return;
 const num=id=>el(id).value===""?null:Number(el(id).value);
 const args={p_target:num("hopeMetricsTarget"),p_plan_accept:num("hopeMetricsAccept"),p_plan_wait:num("hopeMetricsWait"),p_served:num("hopeMetricsServed"),p_show_accepted:el("hopeMetricsShowAccepted").checked,p_show_wait:el("hopeMetricsShowWait").checked};
 if(args.p_served!==baseline.beneficiaries_served&&!confirm("أؤكد أن عدد المستفيدين المدخل هو عدد من تلقوا الدعم فعليًا، وفق سجلات التسليم الموثقة."))return;
 if(!confirm("حفظ هذه الأعداد على واجهة المنحة العامة؟ لن تتغير نتائج المتقدمين ولن يغلق التسجيل."))return;
 busy=true;controls();const ticket=++epoch;msg("جارٍ النشر…");
 try{await guard();const r=await client.rpc("nabd_hope_director_metrics_v1",args);if(r.error||!r.data)throw Error("تعذر تأكيد نشر الأعداد.");if(ticket!==epoch)return;fill(r.data);msg("تم حفظ الأعداد ونشر الإعدادات. القبول والانتظار يتحدثان عند نشر النتائج الفردية.");}catch(e){if(ticket===epoch)msg(e.message||"تعذر النشر.");}finally{busy=false;controls();}
};
client?.auth.onAuthStateChange(event=>{if(event==="SIGNED_OUT"){epoch++;baseline=null;form.reset();form.hidden=true;msg("");controls();}});
controls();
})();