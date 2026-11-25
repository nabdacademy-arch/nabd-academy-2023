(()=>{
"use strict";
const el=id=>document.getElementById(id),panel=el("hopeScholarship");if(!panel)return;
const client=typeof db!=="undefined"?db:null;
const columns="id,full_name,email,phone,governorate,institution,field_of_study,study_stage,support_types,created_at,decision,result_published,reviewed_at";
const labels={pending:"جديد",review:"قيد الدراسة",shortlisted:"مرشح مبدئيًا",accepted:"مقبول",waitlisted:"قائمة الانتظار",rejected:"غير مختار"};
const gov={north_gaza:"شمال غزة",gaza:"غزة",middle:"دير البلح",khan_younis:"خان يونس",rafah:"رفح"};
const stage={prospective:"مقبل على الجامعة",year1:"السنة الأولى",year2:"السنة الثانية",year3:"السنة الثالثة",year4:"السنة الرابعة",year5plus:"السنة الخامسة فأعلى",other:"أخرى"};
const aid={tuition:"رسوم",transport:"مواصلات",device:"جهاز",internet:"إنترنت",supplies:"مستلزمات"};
let rows=[],authorized=false,opened=null,busy=false,page=0,epoch=0,complete=false;
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const msg=t=>el("hopeAdminMessage").textContent=t;
function controls(){el("hopeAdminOpen").disabled=!authorized||busy||opened!==false;el("hopeAdminClose").disabled=!authorized||busy||opened!==true;el("hopeAdminExport").disabled=!authorized||busy||!complete||!rows.length;}
function clear(){epoch++;authorized=false;opened=null;rows=[];complete=false;page=0;el("hopeAdminPrivate").hidden=true;el("hopeAdminRows").replaceChildren();el("hopeAdminStats").textContent="";el("hopeAdminState").textContent="يتطلب حساب المدير العام المخوّل.";controls();}
const date=x=>x?new Date(x).toLocaleString("ar"):"—";
function render(){
 if(!authorized)return;const q=el("hopeAdminSearch").value.trim().toLowerCase(),f=el("hopeAdminFilter").value;
 const found=rows.filter(r=>(!f||r.decision===f)&&(!q||[r.full_name,r.email,r.phone,r.id].some(v=>String(v||"").toLowerCase().includes(q))));
 const pages=Math.max(1,Math.ceil(found.length/25));page=Math.max(0,Math.min(page,pages-1));
 const body=el("hopeAdminRows");body.replaceChildren();
 for(const r of found.slice(page*25,page*25+25)){
  const tr=node("tr"),who=node("td"),study=node("td"),actions=node("td");
  who.append(node("strong",r.full_name),node("div",r.email),node("div",r.phone),node("small",r.id));
  study.append(node("div",r.institution),node("div",r.field_of_study),node("small",stage[r.study_stage]||r.study_stage));
  const select=node("select",undefined,"input");select.setAttribute("aria-label","القرار لـ "+r.full_name);
  for(const [value,title] of Object.entries(labels)){const op=node("option",title);op.value=value;select.append(op);}select.value=r.decision;
  const info=node("small",r.result_published?"النتيجة منشورة للمتقدم":"غير منشورة");
  const save=node("button","حفظ داخلي","btn secondary"),publish=node("button","نشر النتيجة","btn");
  save.type=publish.type="button";save.disabled=publish.disabled=busy;
  save.onclick=()=>decide(r,select.value,false);publish.onclick=()=>decide(r,select.value,true);
  actions.append(select,info,save,publish);tr.append(who,node("td",gov[r.governorate]||r.governorate),study,node("td",(r.support_types||[]).map(x=>aid[x]||x).join("، ")),node("td",date(r.created_at)),actions);body.append(tr);
 }
 if(!found.length){const tr=node("tr"),td=node("td","لا توجد طلبات مطابقة.");td.colSpan=6;tr.append(td);body.append(tr);}
 el("hopeAdminStats").textContent="الطلبات: "+rows.length+" · قيد الدراسة: "+rows.filter(r=>r.decision==="review").length+" · المقبولون: "+rows.filter(r=>r.decision==="accepted").length+" · نتائج منشورة: "+rows.filter(r=>r.result_published).length+(complete?"":" · القائمة غير مكتملة، أعد التحديث");
 el("hopeAdminPage").textContent=(page+1)+" / "+pages+" · "+found.length+" طلب";
 el("hopeAdminPrev").disabled=page===0;el("hopeAdminNext").disabled=page>=pages-1;controls();
}
async function load(){
 if(!client||busy)return;const ticket=++epoch;busy=true;controls();msg("جارٍ تحميل الملف الخاص…");
 try{
  const {data:{user},error}=await client.auth.getUser();if(error||!user)throw Error("الدخول مطلوب.");
  const {data:owner,error:oe}=await client.from("nabd_exam_owner").select("user_id").eq("user_id",user.id).maybeSingle();
  const {data:profile,error:pe}=await client.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(oe||pe||owner?.user_id!==user.id||profile?.role!=="admin")throw Error("هذه المساحة للمدير العام المخوّل فقط.");
  if(ticket!==epoch)return;
  authorized=true;el("hopeAdminPrivate").hidden=false;
  const c=await client.from("nabd_hope_control").select("registration_open,updated_at").eq("id",1).single();if(c.error)throw Error("تعذر قراءة حالة التسجيل.");
  opened=c.data.registration_open;el("hopeAdminState").textContent=(opened?"● التسجيل مفتوح":"■ التسجيل مغلق")+" · آخر تحديث: "+date(c.data.updated_at);
  const all=[];complete=false;
  for(let offset=0;offset<10000;offset+=500){const r=await client.from("nabd_hope_applications").select(columns).order("created_at",{ascending:false}).order("id",{ascending:false}).range(offset,offset+499);if(ticket!==epoch)return;if(r.error)throw Error("تعذر قراءة سجل الطلبات.");all.push(...(r.data||[]));if(r.data.length<500){complete=true;break;}}
  if(ticket!==epoch)return;rows=all;msg(complete?"تم تحديث السجل.":"تجاوز السجل حد عرض 10000 طلب؛ التصدير الكامل غير متاح.");
 }catch(e){if(ticket===epoch){clear();msg(e.message||"تعذر التحقق.");}}finally{busy=false;controls();render();}
}
async function setOpen(value){
 if(!authorized||busy)return;
 if(!confirm(value?"فتح باب التقديم الآن؟ سيستقبل النظام الطلبات الجديدة، ولا يعني ذلك توفر التمويل.":"إغلاق باب التقديم؟ ستُمنع الطلبات الجديدة ويبقى الاستعلام متاحًا."))return;
 busy=true;controls();msg("جارٍ حفظ الحالة…");
 try{const {data,error}=await client.rpc("nabd_hope_director_set_open",{p_open:value});if(error||data?.open!==value)throw Error("تعذر تأكيد التغيير.");opened=value;msg(value?"تم فتح رابط التقديم.":"تم إغلاق رابط التقديم.");}catch(e){msg(e.message);}finally{busy=false;await load();}
}
async function decide(r,d,publish){
 if(!authorized||busy)return;if(publish&&d==="pending"){msg("اختر قرارًا قبل نشر النتيجة.");return;}
 if(!confirm(publish?"نشر قرار «"+labels[d]+"» للمتقدم وحده؟":"حفظ القرار داخليًا وإخفاء نتيجته عن الاستعلام؟"))return;
 busy=true;render();msg("جارٍ حفظ القرار…");
 try{const {data,error}=await client.rpc("nabd_hope_director_decide",{p_id:r.id,p_decision:d,p_publish:publish});if(error||!data?.ok)throw Error("تعذر تأكيد القرار.");msg("تم حفظ القرار.");}catch(e){msg(e.message);}finally{busy=false;await load();}
}
function exportCsv(){
 if(!authorized||busy||!complete||!rows.length)return;
 if(!confirm("يحتوي هذا الملف على بيانات شخصية للمتقدمين. تنزيله للاستخدام الإداري الخاص فقط؟"))return;
 const safe=x=>{let s=String(x??"");if(/^[\s]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const out=[["رقم السجل","الاسم","البريد","الهاتف","المحافظة","الجامعة","التخصص","المرحلة","الدعم","تاريخ التقديم","القرار","النتيجة منشورة","تاريخ المراجعة"],...rows.map(r=>[r.id,r.full_name,r.email,r.phone,gov[r.governorate],r.institution,r.field_of_study,stage[r.study_stage],(r.support_types||[]).map(x=>aid[x]).join("، "),r.created_at,labels[r.decision],r.result_published?"نعم":"لا",r.reviewed_at])].map(r=>r.map(safe).join(",")).join("\r\n");
 const u=URL.createObjectURL(new Blob(["\uFEFF",out],{type:"text/csv;charset=utf-8"})),a=node("a");a.href=u;a.download="NABD-Hope-2027-private-"+new Date().toISOString().slice(0,10)+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
el("hopeScholarshipTab").addEventListener("click",load);el("hopeAdminRefresh").onclick=load;el("hopeAdminOpen").onclick=()=>setOpen(true);el("hopeAdminClose").onclick=()=>setOpen(false);el("hopeAdminExport").onclick=exportCsv;
el("hopeAdminSearch").oninput=()=>{page=0;render();};el("hopeAdminFilter").onchange=()=>{page=0;render();};el("hopeAdminPrev").onclick=()=>{page--;render();};el("hopeAdminNext").onclick=()=>{page++;render();};
client?.auth.onAuthStateChange(event=>{if(event==="SIGNED_OUT")clear();});
controls();
})();