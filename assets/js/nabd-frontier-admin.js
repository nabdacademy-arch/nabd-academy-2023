/* NABD NEXT FRONTIER / director console. RLS and real profile role guard every privileged write.
 * Moderators explicitly publish; the code never manufactures medical data, editorial decisions, or awards.
*/
(()=>{"use strict";const register=window.NABD_ADMIN_REGISTER_MODULE;if(typeof register!=="function")return;
const S={panel:null,db:null,user:null,entries:{},section:"overview",busy:false,serial:0,questCount:null};
const $=id=>S.panel?.querySelector("#"+id);
const el=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=String(content);return e};
const date=x=>{const d=new Date(x);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat("ar",{dateStyle:"short"}).format(d):""};
const urlOk=u=>/^https:\/\/[^\s<>"]{5,600}$/i.test(u);
const tasks=[
 ["evidence","nfx_evidence_entries","الأدلة العلمية","status","draft","published"],
 ["congress","nfx_congress_submissions","ملخصات المؤتمر","status","submitted","accepted"],
 ["press","nfx_manuscripts","التحكيم التحريري","status","submitted","published"],
 ["mentor","nfx_mentor_profiles","ملفات المرشدين","status","pending","approved"],
 ["mentorship","nfx_mentor_requests","طلبات الإرشاد","status","requested","accepted"],
 ["innovation","nfx_innovation_projects","مشاريع الابتكار","status","submitted","showcased"],
 ["wallet","nfx_badge_requests","طلبات محفظة الثقة","status","requested","ready"],
 ["observatory","nfx_observatory_records","مؤشرات المرصد","status","draft","published"]
];
const statuses={
 evidence:[["draft","مسودة"],["published","معروض بمصدره"]],
 congress:[["submitted","قيد الاستقبال"],["reviewing","قيد التحكيم"],["accepted","مقبول للعرض"],["rejected","مرفوض"]],
 press:[["submitted","قيد الاستلام"],["reviewing","مراجعة تحريرية"],["accepted","مقبول بعد تحكيم"],["published","نشر الملخص"],["rejected","مرفوض"]],
 mentor:[["pending","قيد التقييم"],["approved","اعتماد العرض العام"],["hidden","إخفاء الملف"]],
 mentorship:[["requested","بانتظار موافقة بشرية"],["accepted","مطابقة بموافقة الطرفين"],["declined","إغلاق الطلب"]],
 innovation:[["submitted","قيد الاستلام"],["shortlisted","قائمة قصيرة"],["showcased","قبول المعرض"],["rejected","غير مقبول"]],
 wallet:[["requested","طلب جديد"],["reviewing","قيد فحص الأصل"],["ready","جاهز لتجهيز مستند، لا شارة موقعة"],["rejected","رفض الطلب"]],
 observatory:[["draft","مسودة"],["published","عرض قيمة موثقة"]]
};
function note(message,bad=false){const x=$("nfx-admin-status");if(!x)return;x.textContent=message;x.classList.toggle("bad",bad)}
function link(url,name){const a=el("a","nfx-adm-link",name);a.href=url;return a}
function btn(title,action,cls="nfx-adm-btn"){const b=el("button",cls,title);b.type="button";b.addEventListener("click",action);return b}
function scaffold(){
 S.panel.replaceChildren();S.panel.classList.add("nfx-adm");
 const top=el("div","nfx-adm-head"),intro=el("div"),actions=el("div","nfx-adm-actions");
 intro.append(el("small","nfx-adm-kicker","NABD NEXT FRONTIER / DIRECTOR MISSION"),el("h2","", "✧ إدارة المختبرات العلمية الثمانية"),el("p","", "مراجعات بشرية ومسارات نشر حقيقية لثمانية مشروعات: أدلة، مؤتمر، تحرير، مرشدون، ابتكار، محفظة، تحديات، ومرصد. لا إصدار شهادات أو DOI تلقائيًا."));
 actions.append(link("nabd-next-frontier.html","المختبرات الثمانية ↗"),link("nabd-one.html","NABD ONE ↗"),link("nabd-university-360.html","UNIVERSITY 360 ↗"));
 top.append(intro,actions);S.panel.append(top);
 const tabs=el("div","nfx-adm-tabs");
 for(const [id,label] of [["overview","◈ مركز الرصد"],["review","✦ المراجعات والنشر"],["curate","⌘ إضافة المصادر والبيانات"],["quality","✓ الأمان والحوكمة"]]){
  const b=btn(label,()=>{S.section=id;draw()},"nfx-adm-tab");b.dataset.tab=id;tabs.append(b)
 }S.panel.append(tabs);
 const msg=el("p","nfx-adm-status","");msg.id="nfx-admin-status";msg.setAttribute("role","status");S.panel.append(msg);
 const container=el("div","nfx-adm-main");container.id="nfx-admin-main";S.panel.append(container)
}
async function load(){
 const serial=++S.serial;note("جارٍ التحقق من سجلات المختبرات المرتبطة بحساب المدير…");
 const queries=tasks.map(async ([key,table])=>{
  const {data,error}=await S.db.from(table).select("*").order("created_at",{ascending:false}).limit(75);
  if(error)throw error;return data||[]
 });
 queries.push(S.db.from("nfx_quest_attempts").select("id",{count:"exact",head:true}));
 const responses=await Promise.allSettled(queries);if(serial!==S.serial)return;
 tasks.forEach(([key],i)=>{const v=responses[i];S.entries[key]=v.status==="fulfilled"?v.value:null});
 const qc=responses.at(-1);S.questCount=qc.status==="fulfilled"&&!qc.value.error?qc.value.count:null;
 const errors=tasks.filter(([k])=>S.entries[k]===null).length+(S.questCount===null?1:0);
 note(errors?"تعذّر التحقق من "+errors+" مؤشرات؛ لا نعاملها كصفر.":"تم استرجاع السجلات المصرّح بها. النشر يتطلب قرارًا بشريًا.",!!errors);draw()
}
function draw(){
 const host=$("nfx-admin-main");if(!host)return;host.replaceChildren();
 S.panel.querySelectorAll(".nfx-adm-tab").forEach(b=>{const yes=b.dataset.tab===S.section;b.classList.toggle("active",yes);b.setAttribute("aria-pressed",String(yes))});
 if(S.section==="overview")overview(host);
 else if(S.section==="review")reviews(host);
 else if(S.section==="curate")curate(host);
 else quality(host)
}
function overview(host){
 host.append(el("h3","", "الوضع الفعلي للمشروعات الثمانية"),el("p","nfx-adm-help","القيم تأتي من سجلات الإنتاج المصرح بها، ولا تمثل اعتمادات أكاديمية أو بيانات تم اختلاقها."));
 const grid=el("div","nfx-adm-grid");
 for(const [key,table,label,field,initial,final] of tasks){
  const rows=S.entries[key],c=el("article","nfx-adm-metric");
  c.append(el("small","",label),el("strong","",Array.isArray(rows)?String(rows.length):"—"),el("span","",Array.isArray(rows)?rows.filter(r=>r.status===final).length+" قابل للعرض بعد مراجعة": "تعذر التحقق من الجدول"));
  grid.append(c)
 }
 const quest=el("article","nfx-adm-metric");quest.append(el("small","","محاولات تحديات العلم"),el("strong","",S.questCount===null?"—":String(S.questCount)),el("span","", "نتائج تدريبية لا تدخل في الشهادات"));grid.append(quest);
 host.append(grid);const hold=el("div","nfx-adm-warning");hold.append(el("strong","", "الجاهزية التشغيلية تحتاج اعتماد البشر"),el("p","", "تشغيل مؤتمر علمي، نشر أبحاث، إصدار شارات رقمية موقعة، وإجراء إرشاد بشري، كلها تتطلب فرق تحرير ومراجعين ومحاضرين وأدلة وموافقات فعلية. عدّ السجلات ليس إثباتًا لجودتها."));
 host.append(hold,link("admin.html#nabd-university-360","فحص دفعة الطلاب وجاهزية التشغيل ↗"))
}
function field(text,name,opts={}){
 const l=el("label","nfx-adm-field",text);const x=el(opts.long?"textarea":"input","nfx-adm-input");x.name=name;x.required=true;if(opts.long){x.rows=opts.rows||3}else x.type=opts.type||"text";if(opts.max)x.maxLength=opts.max;if(opts.min)x.minLength=opts.min;if(opts.placeholder)x.placeholder=opts.placeholder;l.append(x);return l
}
function reviews(host){
 host.append(el("h3","", "صندوق قرار النشر والتحكيم البشري"),el("p","nfx-adm-help","لا تصنع الموافقة هنا DOI أو شارة صادرة أو تكليف مرشد؛ بل تحفظ قرار مراجعة فقط. قرار نشر علمي يحتاج محكمين حقيقيين وفحص حقوق المحتوى."));
 const list=el("div","nfx-adm-reviews");
 let total=0;
 for(const [key,table,label] of tasks){
  const rows=S.entries[key];if(!Array.isArray(rows)){list.append(el("p","nfx-adm-error","تعذّر الوصول إلى "+label));continue}
  for(const row of rows){
   total++;
   const c=el("article","nfx-adm-entry"),head=el("div","nfx-adm-entry-head");
   const title=row.claim_ar||row.title||row.display_name||row.team_name||row.indicator_ar||row.record_reference||("طلب إرشاد #"+row.id?.slice(0,8));
   head.append(el("h4","",label+" · "+title),el("span","nfx-adm-chip",row.status));c.append(head);
   if(key==="evidence"){c.append(el("p","",row.source_title+" — "+row.source_url))}
   else if(key==="observatory"){c.append(el("p","",row.figure+" "+row.units+" · "+row.source_title+" — "+row.source_url))}
   else if(key==="mentor"){c.append(el("p","",row.expertise+" / "+row.bio))}
   else if(key==="mentorship"){c.append(el("p","",row.goal+" · "+row.learner_id?.slice(0,8)+" / "+row.mentor_id?.slice(0,8)))}
   else if(key==="press"||key==="congress")c.append(el("p","",row.abstract));
   else if(key==="innovation")c.append(el("p","",row.problem+"\n"+row.solution));
   else if(key==="wallet")c.append(el("p","",row.description+" — "+row.record_type+" / "+row.record_reference));
   const controls=el("div","nfx-adm-controls"),select=el("select","nfx-adm-select");select.setAttribute("aria-label","قرار المراجعة");
   for(const [value,text] of statuses[key]){const opt=el("option","",text);opt.value=value;opt.selected=row.status===value;select.append(opt)}
   controls.append(select);const submit=btn("حفظ القرار",()=>{void updateStatus(key,table,row,select.value,submit)});
   controls.append(submit);c.append(controls);list.append(c)
  }
 }
 if(!total)list.append(el("p","nfx-adm-empty","لا توجد طلبات أو مصادر مرئية بعد. ابدأ بإضافة مصدر علمي أو مؤشر موثق في قسم «إضافة المصادر والبيانات»."));
 host.append(list)
}
async function updateStatus(key,table,row,newStatus,button){
 if(S.busy||newStatus===row.status)return;
 if(!statuses[key]?.some(x=>x[0]===newStatus)){note("حالة غير مصرح بها.",true);return}
 const publishing=["published","approved","accepted","showcased","ready"];
 if(publishing.includes(newStatus)){
  const caution=key==="wallet"?"هل راجعت الشهادة الأصلية؟ «جاهز» لا يعني إصدار شارة رقمية أو توقيعًا."
  :key==="mentorship"?"هل تحققت من موافقة المرشد والمتعلم على المطابقة خارج النظام؟"
  :"هل تحققت من المراجع والموافقات والمحتوى وحقوق النشر؟ ستظهر بعض البيانات للجمهور.";
  if(!window.confirm(caution))return
 }
 if(key==="press"&&newStatus==="published"&&row.status!=="accepted"){note("لا تنشر بحثًا دون المرور بحالة القبول التحريري بعد المراجعة البشرية.",true);return}
 S.busy=true;button.disabled=true;
 try{
  const payload={status:newStatus};
  if((key==="evidence"||key==="observatory")&&newStatus==="published"){payload.reviewed_by=S.user.id;payload.reviewed_at=new Date().toISOString()}
  const column=key==="mentor"?"user_id":"id",ident=key==="mentor"?row.user_id:row.id;
  const {data,error}=await S.db.from(table).update(payload).eq(column,ident).select("status").maybeSingle();
  if(error||!data||data.status!==newStatus)throw error||Error("Not confirmed");
  row.status=newStatus;note("تم حفظ قرار المراجعة الحقيقي. تحقق من المحتوى العام بعد النشر.");draw()
 }catch(err){note("لم يُؤكد تحديث الحالة، راجع صلاحيات الإدارة والاتصال.",true)}
 finally{S.busy=false;button.disabled=false}
}
function curate(host){
 host.append(el("h3","", "مختبر الأدلة والبيانات — إضافة يدوية مع مصدر أصلي"),el("p","nfx-adm-help","أضف مدخلًا موثقًا من مصدر HTTPS مع عنوانه. يُحفظ أولًا كمسودة، ولا يظهر للجمهور حتى تتخذ قرار النشر المراجع."));
 const columns=el("div","nfx-adm-curators");
 const evidence=el("form","nfx-adm-form");
 evidence.append(el("h4","", "EVIDENCE UNIVERSE · توثيق معلومة"),
  field("الادعاء العلمي بالعربية","claim_ar",{long:true,min:15,max:1200}),
  field("Scientific claim in English","claim_en",{long:true,min:15,max:1200}),
  field("التخصص / الوسم","topic",{min:3,max:90}),
  field("اسم الدراسة أو المنظمة الناشرة","source_title",{min:6,max:220}),
  field("رابط المصدر الأصلي HTTPS","source_url",{type:"url",min:12,max:600}));
 const lab=el("label","nfx-adm-field","علاقة المصدر بالمعلومة"),select=el("select","nfx-adm-select");select.name="relation";
 for(const [v,t] of [["supports","يؤيد"],["questions","يضع موضع تساؤل"],["context","سياق علمي"]]){const opt=el("option","",t);opt.value=v;select.append(opt)}
 lab.append(select);evidence.append(lab);
 const eb=el("button","nfx-adm-btn","حفظ دليل كمسودة");eb.type="submit";evidence.append(eb);
 evidence.addEventListener("submit",e=>{e.preventDefault();void addCurated("evidence",evidence,eb)});
 const obs=el("form","nfx-adm-form");obs.append(el("h4","", "HEALTH OBSERVATORY · مؤشر من مصدر موثق"),
  field("اسم المؤشر بالعربية","indicator_ar",{min:6,max:180}),
  field("English indicator label","indicator_en",{min:6,max:180}),
  field("المكان / المنطقة","location_label",{min:3,max:110}),
  field("السنة أو فترة القياس","period_label",{min:4,max:55}),
  field("القيمة الرقمية ≥ 0","figure",{type:"number"}),
  field("الوحدة","units",{min:1,max:45}),
  field("اسم المصدر","source_title",{min:6,max:160}),
  field("رابط المصدر الأصلي HTTPS","source_url",{type:"url",min:12,max:600}));
 obs.querySelector('[name="figure"]').step="any";obs.querySelector('[name="figure"]').min="0";
 const ob=el("button","nfx-adm-btn","حفظ مؤشر كمسودة");ob.type="submit";obs.append(ob);
 obs.addEventListener("submit",e=>{e.preventDefault();void addCurated("observatory",obs,ob)});
 columns.append(evidence,obs);host.append(columns)
}
async function addCurated(key,form,button){
 if(S.busy)return;
 const columns=key==="evidence"?["claim_ar","claim_en","topic","source_title","source_url","relation"]:["indicator_ar","indicator_en","location_label","period_label","figure","units","source_title","source_url"];
 const values=Object.fromEntries(columns.map(field=>[field,form.elements.namedItem(field).value.trim()]));
 if(!validSources(values)||Object.values(values).some(v=>typeof v==="string"&&/patient\s*id|اسم\s*مريض/i.test(v))){note("المصدر أو الحقول غير صالحة. لا تُدخل معلومات مرضى.",true);return}
 if(key==="observatory"){values.figure=Number(values.figure);if(!Number.isFinite(values.figure)||values.figure<0){note("القيمة الرقمية غير صالحة.",true);return}}
 values.status="draft";S.busy=true;button.disabled=true;
 try{
  const table=key==="evidence"?"nfx_evidence_entries":"nfx_observatory_records";
  const {data,error}=await S.db.from(table).insert(values).select("id,status").single();
  if(error||!data?.id)throw error||Error("No confirmation");
  form.reset();note("حُفظت مسودة فعلية، ولن تظهر للعموم قبل مراجعة ونشر المدير.");await load()
 }catch(err){note("تعذّر حفظ المسودة أو لم تؤكدها قاعدة البيانات.",true)}
 finally{S.busy=false;button.disabled=false}
}
function validSources(values){return !!values.source_title?.trim()&&urlOk(values.source_url||"")}
function quality(host){
 host.append(el("h3","", "قواعد الحوكمة العلمية والعلمية المفتوحة"));
 const warnings=[
 ["مراجعات الأدلة","كل مصدر يحتاج تاريخًا ومستوى بحث ومراجعة مختص؛ وسم «يدعم» ليس تقديرًا آليًا لليقين.","nabd-medical-knowledge.html"],
 ["المؤتمر والمجلة","لا يُعتمد برنامج مؤتمر أو مقال منشور دون لجنة تحرير/تحكيم وموافقات حقوقية. هذه البرمجيات لا تُنشئ DOI.","nabd-global-research.html"],
 ["الإرشاد","تتطلب المطابقة موافقة متبادلة؛ لا تفتح رسائل شخصية تلقائيًا. تُستخدم قنوات التواصل المعتمدة.","nabd-connect.html"],
 ["الابتكار","المشاريع قيد المشاركة؛ لا تُنسب إلى أشخاص أو جهات دون رضاهم؛ لا درجات أو جوائز تلقائية.","nabd-university-360.html"],
 ["محفظة الثقة","التحقق من السجلات الحالية مختلف عن إصدار شارة موقّعة متوافقة مع Open Badges؛ يتطلب خادم توقيع وتحقيقًا مستقلاً.","skill-passport.html"],
 ["Quest","الأسئلة تدريبية عامة، لا يجوز استخدامها لاجتياز امتحان أو لإثبات كفاءة طبية؛ نتائج الواجهة قابلة لإعادة المحاولة.","learning/"],
 ["مرصد الصحة","القيم لا تُستورد آليًا، وتحتاج مراجعة المصدر والوحدة والفترة؛ منع التفسيرات السريرية المباشرة.","https://www.who.int/data/gho"],
 ["الخصوصية وRLS","النشر يحتاج صلاحية مدير فعلية؛ ملفات خاصة ورسائل وطلبات لا تُقرأ من حساب آخر.","policies.html"]
 ];
 const list=el("div","nfx-adm-curators");
 for(const [name,desc,url] of warnings){const c=el("article","nfx-adm-entry");c.append(el("h4","",name),el("p","",desc),link(url,"مرجع أو بوابة ↗"));list.append(c)}
 host.append(list,el("p","nfx-adm-warning","إطلاق الأنظمة التشغيلية الكبرى يحتاج مسؤول تحرير علمي ومحاضرين ومرشدين حقيقيين، إجراءات حماية بيانات، استضافة تتناسب مع الحمل واختبارات مستخدمين بأدوار مختلفة."))
}
async function render(panel,{db,user}){
 S.panel=panel;S.db=db;S.user=user;S.serial++;
 scaffold();
 if(!db||!user){panel.replaceChildren(el("p","nfx-adm-error","تسجيل الدخول الإداري مطلوب."));return}
 note("جارٍ إثبات صلاحية المدير عبر الحساب وقاعدة البيانات…");
 try{
  const [auth,profile]=await Promise.all([db.auth.getUser(),db.from("profiles").select("role").eq("id",user.id).maybeSingle()]);
  if(auth.error||auth.data?.user?.id!==user.id||profile.error||profile.data?.role!=="admin"){panel.replaceChildren(el("p","nfx-adm-error","تم منع قراءة الطلبات الخاصة؛ لم يتم التحقق من صلاحية المدير."));return}
  await load()
 }catch(err){panel.replaceChildren(el("p","nfx-adm-error","تعذر التأكد من هوية وصلاحيات الإدارة."))}
}
register({id:"nabd-next-frontier",title:"✧ FRONTIER · المختبرات الثمانية",render});
})();