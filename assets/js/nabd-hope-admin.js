(()=>{
"use strict";
const el=id=>document.getElementById(id),panel=el("hopeScholarship");if(!panel)return;
const client=typeof db!=="undefined"?db:null;
const columns="id,full_name,email,phone,governorate,institution,field_of_study,study_stage,support_types,created_at,decision,result_published,reviewed_at";
const labels={pending:"جديد",review:"قيد الدراسة",shortlisted:"مرشح مبدئيًا",accepted:"مقبول",waitlisted:"قائمة الانتظار",rejected:"غير مختار"};
const gov={north_gaza:"شمال غزة",gaza:"غزة",middle:"دير البلح",khan_younis:"خان يونس",rafah:"رفح"};
const stage={prospective:"مقبل على الجامعة",year1:"السنة الأولى",year2:"السنة الثانية",year3:"السنة الثالثة",year4:"السنة الرابعة",year5plus:"السنة الخامسة فأعلى",other:"أخرى"};
const aid={tuition:"رسوم",transport:"مواصلات",device:"جهاز",internet:"إنترنت",supplies:"مستلزمات"};
let verificationMap=new Map();
const verificationLabels={missing:"وثائق غير مكتملة",submitted:"وثيقة بانتظار المراجعة",verified:"تم اعتماد الوثيقة",needs_correction:"مطلوب تصحيح الوثيقة"};
let rows=[],authorized=false,opened=null,busy=false,page=0,epoch=0,snapshot=null,hasMore=false,cursors=[null],stats=null,searchTimer=null,exporting=false,exportCancelled=false;
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const msg=t=>el("hopeAdminMessage").textContent=t;
function controls(){el("hopeAdminOpen").disabled=!authorized||busy||opened!==false;el("hopeAdminClose").disabled=!authorized||busy||opened!==true;el("hopeAdminExport").disabled=!authorized||busy||exporting||!stats?.total;el("hopeAdminPrev").disabled=!authorized||busy||page===0;el("hopeAdminNext").disabled=!authorized||busy||!hasMore;el("hopeAdminCancelExport").disabled=!exporting||exportCancelled;}
function clear(){epoch++;authorized=false;opened=null;rows=[];verificationMap.clear();stats=null;page=0;snapshot=null;hasMore=false;cursors=[null];exportCancelled=true;el("hopeAdminPrivate").hidden=true;el("hopeAdminRows").replaceChildren();el("hopeAdminStats").textContent="";el("hopeAdminState").textContent="يتطلب حساب المدير العام المخوّل.";controls();}
const date=x=>x?new Date(x).toLocaleString("ar"):"—";
function render(){
 if(!authorized)return;const found=rows;
 const body=el("hopeAdminRows");body.replaceChildren();
 for(const r of found){
  const tr=node("tr"),who=node("td"),study=node("td"),actions=node("td"),verification=node("td");
  who.append(node("strong",r.full_name),node("div",r.email),node("div",r.phone),node("small",r.id));
  study.append(node("div",r.institution),node("div",r.field_of_study),node("small",stage[r.study_stage]||r.study_stage));
  const select=node("select",undefined,"input");select.setAttribute("aria-label","القرار لـ "+r.full_name);
  for(const [value,title] of Object.entries(labels)){const op=node("option",title);op.value=value;select.append(op);}select.value=r.decision;
  const info=node("small",r.result_published?"النتيجة منشورة للمتقدم":"غير منشورة");
  const save=node("button","حفظ داخلي","btn secondary"),publish=node("button","نشر النتيجة","btn");
  save.type=publish.type="button";save.disabled=publish.disabled=busy;
  save.onclick=()=>decide(r,select.value,false);publish.onclick=()=>decide(r,select.value,true);
  const v=verificationMap.get(r.id),vs=v?.verification_state||"missing";
  const tag=node("strong",verificationLabels[vs]||verificationLabels.missing);tag.style.color=vs==="verified"?"#86efac":vs==="needs_correction"?"#ffb8b8":vs==="submitted"?"#ffda89":"#adc4cc";verification.append(tag);
  if(v){verification.append(node("div",(v.identity_kind==="passport"?"جواز سفر":"هوية وطنية")+" · "+v.identity_issuer+" · ••••"+v.identity_last4),node("small",Math.ceil(v.document_bytes/1024)+" KB · "+date(v.submitted_at)));
   const download=node("button","تنزيل شهادة القيد","btn secondary");download.type="button";download.disabled=busy;download.onclick=()=>downloadDocument(v);verification.append(download);
   const approve=node("button","اعتماد التحقق","btn"),correct=node("button","طلب تصحيح","btn secondary");approve.type=correct.type="button";approve.disabled=busy||vs==="verified";correct.disabled=busy||vs==="needs_correction";approve.onclick=()=>reviewVerification(r,"verified");correct.onclick=()=>reviewVerification(r,"needs_correction");verification.append(approve,correct);
  }
  actions.append(select,info,save,publish);tr.append(who,node("td",gov[r.governorate]||r.governorate),study,node("td",(r.support_types||[]).map(x=>aid[x]||x).join("، ")),node("td",date(r.created_at)),verification,actions);body.append(tr);
 }
 if(!found.length){const tr=node("tr"),td=node("td","لا توجد طلبات مطابقة.");td.colSpan=7;tr.append(td);body.append(tr);}
 el("hopeAdminStats").textContent=stats?"إجمالي الطلبات: "+stats.total.toLocaleString("ar")+" · جديد: "+stats.pending+" · قيد الدراسة: "+stats.review+" · المقبولون: "+stats.accepted+" · نتائج منشورة: "+stats.published:"تعذر قراءة الإحصاءات.";
 el("hopeAdminPage").textContent="صفحة "+(page+1)+" · "+rows.length+" طلب"+(hasMore?" · المزيد متاح":"");
 controls();
}
function filters(){return {p_query:el("hopeAdminSearch").value.trim().slice(0,150)||null,p_decision:el("hopeAdminFilter").value||null,p_governorate:el("hopeAdminGovernorate").value||null};}
async function fetchPage(cursor,limit,snap,filter){const {data,error}=await client.rpc("nabd_hope_admin_page_v2",{...filter,p_before_at:cursor?.created_at||null,p_before_id:cursor?.id||null,p_snapshot:snap,p_limit:limit});if(error||!Array.isArray(data?.rows))throw Error("تعذر قراءة صفحة الطلبات.");return data;}
async function load(reset=true){
 if(!client||busy)return;const ticket=++epoch;busy=true;controls();msg("جارٍ تحميل سجل الطلبات…");
 try{
  const {data:{user},error}=await client.auth.getUser();if(error||!user)throw Error("الدخول مطلوب.");
  const {data:owner,error:oe}=await client.from("nabd_exam_owner").select("user_id").eq("user_id",user.id).maybeSingle();
  const {data:profile,error:pe}=await client.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(oe||pe||owner?.user_id!==user.id||profile?.role!=="admin")throw Error("هذه المساحة للمدير العام المخوّل فقط.");
  if(ticket!==epoch)return;
  authorized=true;el("hopeAdminPrivate").hidden=false;
  if(reset){page=0;snapshot=null;cursors=[null];}
  const f=filters();
  const [c,summary,result]=await Promise.all([client.from("nabd_hope_control").select("registration_open,updated_at").eq("id",1).single(),client.rpc("nabd_hope_admin_stats_v2"),fetchPage(cursors[page],25,snapshot,f)]);
  if(ticket!==epoch)return;
  if(c.error||summary.error)throw Error("تعذر قراءة حالة التسجيل أو الإحصاءات.");
  opened=c.data.registration_open;stats=summary.data;el("hopeAdminState").textContent=(opened?"● التسجيل مفتوح":"■ التسجيل مغلق")+" · آخر تحديث: "+date(c.data.updated_at);
  rows=result.rows;snapshot=result.snapshot;hasMore=result.has_more;if(hasMore&&rows.length)cursors[page+1]=rows.at(-1);
  verificationMap.clear();
  if(rows.length){const v=await client.from("nabd_hope_verifications").select("application_id,identity_kind,identity_issuer,identity_last4,document_path,document_mime,document_bytes,verification_state,submitted_at,reviewed_at").in("application_id",rows.map(r=>r.id));if(ticket!==epoch)return;if(v.error)throw Error("تعذر تحميل حالة توثيق الطلبات.");verificationMap=new Map(v.data.map(x=>[x.application_id,x]));}
  msg("تم تحديث الصفحة. البحث والتصفية على السجل الكامل.");
 }catch(e){if(ticket===epoch){clear();msg(e.message||"تعذر التحقق.");}}finally{busy=false;controls();render();}
}
async function setOpen(value){
 if(!authorized||busy)return;
 if(!confirm(value?"فتح باب التقديم الآن؟ سيستقبل النظام الطلبات الجديدة، ولا يعني ذلك توفر التمويل.":"إغلاق باب التقديم؟ ستُمنع الطلبات الجديدة ويبقى الاستعلام متاحًا."))return;
 busy=true;controls();msg("جارٍ حفظ الحالة…");
 try{const {data,error}=await client.rpc("nabd_hope_director_set_open",{p_open:value});if(error||data?.open!==value)throw Error("تعذر تأكيد التغيير.");opened=value;msg(value?"تم فتح رابط التقديم.":"تم إغلاق رابط التقديم.");}catch(e){msg(e.message);}finally{busy=false;await load(false);}
}
async function downloadDocument(v){
 if(!authorized||busy||!v?.document_path)return;
 if(!confirm("تنزيل وثيقة شخصية للمراجعة الإدارية فقط؟ افتحها ببرنامج موثوق ولا تشاركها."))return;
 const ticket=epoch;busy=true;controls();render();
 try{const {data,error}=await client.storage.from("nabd-hope-enrollment-private").download(v.document_path);if(error||!data||ticket!==epoch||!authorized)throw Error("تعذر تنزيل الوثيقة الخاصة.");
 const ext=v.document_mime==="application/pdf"?"pdf":v.document_mime==="image/png"?"png":"jpg";
 const u=URL.createObjectURL(data),a=node("a");a.href=u;a.download="NABD-enrollment-"+v.application_id+"."+ext;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
 msg("تم تنزيل الوثيقة للمراجعة.");
 }catch(e){msg(e.message||"تعذر تنزيل الوثيقة.");}finally{busy=false;controls();render();}
}
async function reviewVerification(r,state){
 if(!authorized||busy)return;
 const question=state==="verified"?"هل راجعت شهادة القيد أو القبول وطابقت الاسم والمؤسسة والبيانات المتاحة؟ هذا اعتماد إداري وليس تحققًا من جهة حكومية.":"طلب تصحيح الوثيقة أو البيانات من المتقدم؟ سيظهر له زر إعادة الرفع.";
 if(!confirm(question))return;
 busy=true;render();msg("جارٍ حفظ مراجعة الوثيقة…");
 try{const {data,error}=await client.rpc("nabd_hope_director_verify",{p_id:r.id,p_state:state});if(error||!data?.ok)throw Error("تعذر تأكيد مراجعة الوثيقة.");msg("تم حفظ حالة التحقق.");}
 catch(e){msg(e.message);}finally{busy=false;await load(false);}
}
async function decide(r,d,publish){
 if(!authorized||busy)return;if(d==="accepted"&&verificationMap.get(r.id)?.verification_state!=="verified"&&(r.decision!=="accepted"||(publish&&!r.result_published))){msg("اعتمد التحقق من شهادة القيد أولًا قبل القبول.");return;}if(publish&&d==="pending"){msg("اختر قرارًا قبل نشر النتيجة.");return;}
 if(!confirm(publish?"نشر قرار «"+labels[d]+"» للمتقدم وحده؟":"حفظ القرار داخليًا وإخفاء نتيجته عن الاستعلام؟"))return;
 busy=true;render();msg("جارٍ حفظ القرار…");
 try{const {data,error}=await client.rpc("nabd_hope_director_decide",{p_id:r.id,p_decision:d,p_publish:publish});if(error||!data?.ok)throw Error(error?.message?.includes("VERIFICATION_REQUIRED")?"يجب اعتماد وثيقة القيد أولًا.":"تعذر تأكيد القرار.");msg("تم حفظ القرار.");}catch(e){msg(e.message);}finally{busy=false;await load(false);}
}
async function exportCsv(){
 if(!authorized||busy||exporting||!stats?.total)return;
 if(!confirm("تصدير جميع الطلبات في ملف خاص؟ يتضمن بيانات شخصية. احفظه في مكان آمن."))return;
 const safe=x=>{let s=String(x??"");if(/^[\s]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const line=r=>r.map(safe).join(",")+"\r\n";
 const header="\uFEFF"+line(["رقم السجل","الاسم","البريد","الهاتف","المحافظة","الجامعة","التخصص","المرحلة","الدعم","تاريخ التقديم","القرار","النتيجة منشورة","تاريخ المراجعة"]);
 const file="NABD-Hope-2027-private-"+new Date().toISOString().slice(0,10)+".csv";
 let writer=null,parts=[header],cursor=null,snap=null,n=0;
 exporting=true;exportCancelled=false;controls();
 try{
  if(typeof window.showSaveFilePicker==="function"){
   const handle=await window.showSaveFilePicker({suggestedName:file,types:[{description:"CSV",accept:{"text/csv":[".csv"]}}]});
   writer=await handle.createWritable();await writer.write(header);parts=[];
  }
  while(!exportCancelled&&authorized){
   const result=await fetchPage(cursor,500,snap,{p_query:null,p_decision:null,p_governorate:null});
   if(exportCancelled||!authorized)throw Error("تم إلغاء التصدير.");
   snap=result.snapshot;const batch=result.rows;const csv=batch.map(r=>line([r.id,r.full_name,r.email,r.phone,gov[r.governorate],r.institution,r.field_of_study,stage[r.study_stage],(r.support_types||[]).map(x=>aid[x]).join("، "),r.created_at,labels[r.decision],r.result_published?"نعم":"لا",r.reviewed_at])).join("");
   if(writer)await writer.write(csv);else parts.push(csv);
   n+=batch.length;msg("جارٍ تصدير السجل: "+n.toLocaleString("ar")+" طلب");
   if(!result.has_more)break;if(!batch.length)throw Error("تعذر متابعة التصدير.");cursor=batch.at(-1);
  }
  if(exportCancelled||!authorized)throw Error("تم إلغاء التصدير.");
  if(writer){await writer.close();writer=null;}else{const u=URL.createObjectURL(new Blob(parts,{type:"text/csv;charset=utf-8"})),a=node("a");a.href=u;a.download=file;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  msg("اكتمل تصدير "+n.toLocaleString("ar")+" طلبًا. لم يُنشر الملف للعامة.");
 }catch(e){if(writer)try{await writer.abort();}catch{}msg(e?.name==="AbortError"?"تم إلغاء التصدير.":e.message||"تعذر إكمال التصدير.");}
 finally{exporting=false;controls();}
}
el("hopeScholarshipTab").addEventListener("click",()=>load(true));el("hopeAdminRefresh").onclick=()=>load(true);el("hopeAdminOpen").onclick=()=>setOpen(true);el("hopeAdminClose").onclick=()=>setOpen(false);el("hopeAdminExport").onclick=exportCsv;
function search(){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{if(busy){search();return;}load(true);},350);}
el("hopeAdminSearch").oninput=search;el("hopeAdminFilter").onchange=search;el("hopeAdminGovernorate").onchange=search;el("hopeAdminPrev").onclick=()=>{if(!busy&&page>0){page--;load(false);}};el("hopeAdminNext").onclick=()=>{if(!busy&&hasMore){page++;load(false);}};el("hopeAdminCancelExport").onclick=()=>{exportCancelled=true;el("hopeAdminCancelExport").disabled=true;};
client?.auth.onAuthStateChange(event=>{if(event==="SIGNED_OUT")clear();});
controls();
})();