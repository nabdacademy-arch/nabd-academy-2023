/* NABD official document center — immutable templates, signed-in authorized operators. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const E=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const defs=[
 {id:"statement",name:"إفادة قيد بيانات",en:"Statement of Account Registration",icon:"▤",hint:"إثبات قيد الاسم داخل منصة نبض.",lines:["تفيد أكاديمية نبض للعلوم الطبية بأن صاحب المستند الموضح اسمه أعلاه مُدرج في سجل حسابات المنصة المؤسسية التابعة للأكاديمية، وذلك وفق بيانات الحساب المتاحة بتاريخ إصدار هذه الإفادة.","تُعرض أي عضويات أو دورات مذكورة أدناه فقط إذا وُجد لها تكليف نشط أو شهادة صالحة في سجلات نبض بتاريخ الإصدار. هذه الإفادة وثيقة داخلية ولا تُعد اعتمادًا حكوميًا أو مؤهلًا جامعيًا أو ترخيصًا مهنيًا."]},
 {id:"permit",name:"تصريح مشاركة تنظيمي",en:"Internal Participation Authorization",icon:"♙",hint:"تصريح مؤسسي محدود لأنشطة الأكاديمية.",lines:["تُصدر أكاديمية نبض هذا التصريح التنظيمي لصاحب الاسم الموضح أعلاه للمشاركة في الأنشطة الداخلية التي توافق عليها إدارة الأكاديمية، شريطة الالتزام بالتعليمات والأنظمة المؤسسية ذات الصلة.","هذا التصريح صالح لأغراض التنظيم الداخلي فقط، ولا يُعد تصريح سفر أو دخول رسمي أو مزاولة مهنة أو ممارسة طبية."]},
 {id:"report",name:"تقرير إداري",en:"Administrative Report",icon:"▥",hint:"تقرير سجل مؤسسي غير طبي.",lines:["يُثبت هذا التقرير الإداري أن صاحب المستند الموضح أعلاه مسجل في قاعدة حسابات أكاديمية نبض، وقد أُنشئ السجل الإلكتروني بتاريخ الإصدار لغرض التوثيق المؤسسي.","لا يتضمن هذا التقرير تشخيصًا أو نتائج طبية أو تقييمًا أكاديميًا، ولا يُستخدم بدلًا عن التقارير المهنية الصادرة من الجهات المؤهلة."]},
 {id:"treatment_request",name:"نموذج طلب علاج / إحالة",en:"Treatment / Referral Request Form",icon:"♡",hint:"طلب تنسيق فقط، ليس وصفة دوائية.",lines:["يُصدر هذا النموذج الإداري لتوثيق طلب تنسيق إحالة صاحب الاسم المذكور أعلاه إلى الجهة الطبية المختصة، وفق الإجراءات المتبعة وبموافقة صاحب العلاقة.","هذا النموذج ليس وصفة علاجية أو تشخيصًا طبيًا ولا يجيز صرف دواء أو إجراء تدخل طبي. يُترك القرار الطبي والتقييم والعلاج حصريًا لممارس صحي مرخّص ومستقل عن نظام الطباعة."]},
 {id:"consultation_request",name:"نموذج طلب استشارة",en:"Consultation Request",icon:"✧",hint:"طلب تنسيق استشارة، دون رأي علاجي.",lines:["تسجل أكاديمية نبض بموجب هذا النموذج طلب استشارة مؤسسية أو تعليمية لصاحب المستند المذكور، ويُحال الطلب عند الحاجة إلى القسم المختص وفق الصلاحيات المتاحة.","لا يتضمن هذا النموذج أي استشارة طبية فعلية أو توصية علاجية، ولا يمثل رأيًا صادرًا عن طبيب أو مختص مرخص."]},
 {id:"complaint",name:"استمارة تقديم شكوى",en:"Complaint Submission Form",icon:"☷",hint:"استمارة موحدة لتقديم الملاحظات والشكاوى.",lines:["استمارة إدارية موحدة لتوثيق رغبة صاحب الاسم المذكور أعلاه في تقديم شكوى أو ملاحظة إلى أكاديمية نبض للعلوم الطبية؛ ويُستكمل وصف الموضوع من مقدم الشكوى عند التسليم إلى الجهة المختصة.","موضوع الشكوى: ................................................................................","الجهة أو القسم المعني: .........................................................................","توقيع مقدم الشكوى عند التسليم (اختياري): ......................................................"]}
];
const bilingualTemplates={
 statement:[
  "NABD Academy for Medical Sciences confirms that the individual identified above has an account on the Academy’s institutional platform, according to the records available on the issue date.",
  "Any council appointments or completed courses listed on this statement are drawn only from active membership records or valid Academy certificates. This internal statement is not a government accreditation, degree, or professional licence."
 ],
 permit:[
  "NABD Academy issues this internal participation permission to the person named above for Academy-organized activities authorized by its administration, subject to applicable internal procedures.",
  "This document is for Academy coordination only. It is not a travel, entry, professional-practice, or medical-treatment permit."
 ],
 report:[
  "This administrative report confirms that the person named above has an account on NABD Academy's institutional platform as of the document's issue date.",
  "Any listed verified memberships or certified training records are derived from the Academy's registers. This is not a clinical report, medical diagnosis, or external academic evaluation."
 ],
 treatment_request:[
  "This administrative form records a request to coordinate a referral for the person named above to an appropriate healthcare provider, subject to consent and applicable procedures.",
  "It is not a diagnosis, prescription, treatment order, or approval to dispense medication. All clinical decisions remain the responsibility of an appropriately licensed healthcare practitioner."
 ],
 consultation_request:[
  "This form documents a request for institutional or educational consultation for the person named above. The request may be referred to the responsible Academy team.",
  "This form does not constitute a medical consultation, clinical diagnosis, or treatment advice from a licensed practitioner."
 ],
 complaint:[
  "This standardized form records the named individual's intention to submit a complaint or feedback to NABD Academy. The complainant provides the particulars separately through authorized channels.",
  "Complaint subject: ................................................................",
  "Relevant department: ...............................................................",
  "Complainant's signature on submission (optional): ........................................"
 ]
};
// These are verified names from the Academy's bilingual course catalogue, not inferred achievements.
// A title unknown in Arabic is explicitly marked as recorded in English rather than silently mistranslated.
const confirmedCourseTitles={
 "Medical Terminology":["المصطلحات الطبية","Medical Terminology"],
 "General Anatomy":["التشريح العام","General Anatomy"],
 "Physiology":["علم وظائف الأعضاء","Physiology"],
 "Biochemistry":["الكيمياء الحيوية","Biochemistry"],
 "Pathology":["علم الأمراض","Pathology"]
};
function localizedCourse(course){
 const ar=String(course.title_ar||"").trim(),en=String(course.title_en||"").trim();
 const known=confirmedCourseTitles[en]||confirmedCourseTitles[ar];
 const arabicScript=/[\u0600-\u06FF]/;
 return {
  ar:arabicScript.test(ar)?ar:(known?.[0]||"عنوان الدورة كما في السجل: "+(ar||en||"—")),
  en:en||known?.[1]||ar||"—"
 };
}
const roleLabels={
 admin:["إدارة الأكاديمية","Academy administration"],
 student:["طالب مسجل في المنصة","Registered Academy student"],
 lecturer:["محاضر في المنصة","Academy lecturer"],
 instructor:["محاضر في المنصة","Academy instructor"],
 member:["عضو مجلس","Council member"]
};
const councilLabels={
 trustees:["المجلس الأعلى للأمناء","Board of Trustees"],
 academic:["المجلس العلمي والأكاديمي","Scientific and Academic Council"],
 research:["مجلس البحث العلمي والابتكار","Research and Innovation Council"],
 students:["المجلس الطلابي الأعلى","Student Council"],
 international:["مجلس العلاقات والشراكات الدولية","International Relations Council"],
 quality:["مجلس الجودة والنزاهة الأكاديمية","Quality and Academic Integrity Council"],
 digital:["مجلس الذكاء الاصطناعي والتحول الرقمي","AI and Digital Transformation Council"],
 humanitarian:["مجلس العمل الإنساني والاستدامة","Humanitarian and Sustainability Council"]
};
const positionLabels={
 member:["عضو مجلس","Member"],
 chair:["رئيس المجلس","Chair"],
 vice_chair:["نائب رئيس المجلس","Vice Chair"],
 secretary:["مقرر المجلس","Council Secretary"]
};

const docName=id=>defs.find(t=>t.id===id)?.name||"مستند غير معروف";
const kinds={student:"طالب",member:"عضو مجلس",other:"حساب بالأكاديمية"};
const db=window.nabdSupabase;
const state={allowed:[],admin:false,type:"statement",person:null,issuer:null,items:[],doc:null,ready:false,busy:false};
function validEnglishName(name){
 const normalized=String(name||"").trim().replace(/\s+/g," ");
 return /^[A-Za-z][A-Za-z .'-]{2,159}$/.test(normalized)&&/[A-Za-z]{2}/.test(normalized)?normalized:null;
}
function canIssueSelected(){
 return Boolean(state.person && state.allowed.includes(state.type)
  && validEnglishName($("subject-name-en").value)
  && $("english-name-confirmed").checked);
}
function updateIssueButton(){$("issue").disabled=!canIssueSelected()||state.busy;}
function message(m="",error=false){const n=$("feedback");n.textContent=m;n.classList.toggle("error",error);n.hidden=!m;}
// The public interface should not show raw internal server identifiers to members or administrators.
const serviceMessages={
 account_profile_missing:"هذا الحساب غير مرتبط بملف شخصي في أكاديمية نبض. يرجى التواصل مع المدير لإصلاح الربط.",
 profile_lookup_failed:"تعذر قراءة ملف الحساب بسبب مشكلة في صلاحيات الخادم. أعد المحاولة أو تواصل مع إدارة النظام.",
 issuer_not_authorized:"ليس لدى حسابك صلاحية إصدار المستندات. اطلب تفويضًا من المدير العام.",
 invalid_session:"انتهت جلسة الدخول. سجّل الدخول مرة أخرى من لوحة المدير.",
 authentication_required:"سجّل الدخول بحساب المدير أو الحساب المخوّل أولًا.",
 authorization_unavailable:"تعذر التحقق من التفويض حاليًا. أعد المحاولة.",
 service_unavailable:"خدمة المستندات غير متاحة حاليًا. حاول لاحقًا.",
 request_failed:"تعذّر إتمام العملية. حاول مرة أخرى.",
 search_failed:"تعذر البحث في حسابات الأكاديمية.",
 issue_failed:"تعذر إصدار المستند. لم يتم تأكيد إصدار مستند جديد.",
 subject_profile_missing:"الحساب المختار ليس له ملف شخصي صالح. اختر حسابًا آخر.",
 list_failed:"تعذّر تحميل سجل المستندات.",
 cannot_save_permission:"تعذر حفظ التفويض. حاول مجددًا.",
 english_name_required:"يجب إدخال الاسم الإنجليزي كما أكّده صاحب المستند والموافقة على صحة تهجئته.",
 english_name_already_recorded:"الاسم الإنجليزي مثبت بالفعل في هذه الوثيقة ولا يمكن تغييره تلقائيًا.",
 english_name_save_failed:"تعذر حفظ تهجئة الاسم الإنجليزي. حاول مجددًا.",
 document_void:"لا يمكن تعديل وثيقة ملغاة."
};
function userFriendlyError(code,fallback){
 return serviceMessages[code]||fallback||"حدث خطأ أثناء الاتصال بمركز المستندات.";
}
async function call(action,args={}){
 if(!db)throw Error("خدمة قاعدة بيانات نبض غير متاحة");
 const {data,error}=await db.functions.invoke("nabd-official-documents",{body:{action,...args}});
 if(error){let details=null;try{details=await error.context?.json?.();}catch(_){}throw Error(userFriendlyError(details?.error,error.message));}
 if(data?.error)throw Error(userFriendlyError(data.error));
 return data;
}
function chooseType(id){
 if(!state.allowed.includes(id))return;
 state.type=id;
 $("template-grid").querySelectorAll("[data-type]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.type===id)));
 updateIssueButton();
}
function renderTypes(){
 $("template-grid").innerHTML=defs.map(t=>{
 const forbidden=!state.allowed.includes(t.id);
 return '<button type="button" class="template-card" data-type="'+t.id+'" '+(forbidden?'disabled title="ليست لديك صلاحية إصدار هذا النوع"':'')+' aria-pressed="false"><span class="template-symbol" aria-hidden="true">'+t.icon+'</span><span class="template-info"><strong>'+E(t.name)+'</strong><small>'+E(t.hint)+'</small></span></button>';
 }).join("");
 $("template-grid").querySelectorAll("[data-type]").forEach(b=>b.addEventListener("click",()=>chooseType(b.dataset.type)));
 chooseType(state.allowed[0]||"statement");
}
function selectPerson(p,issuer=false){
 if(issuer){
  state.issuer=p;
  $("issuer-name").textContent=p.name||"—";$("issuer-selected").hidden=false;
  $("save-issuer").disabled=false;
  $("issuer-results").replaceChildren();
  return;
 }
 state.person=p;
 $("selected-name").textContent=p.name||"—";
 $("selected-kind").textContent=p.role==="student"?"حساب طالب":"حساب مرتبط بالأكاديمية";
 $("selected-subject").hidden=false;
 $("english-name-fields").hidden=false;
 // A Latin profile name may already be the person's chosen English spelling;
 // otherwise request confirmation instead of guessing an Arabic transliteration.
 $("subject-name-en").value=/^[A-Za-z][A-Za-z .'-]{2,159}$/.test(String(p.name||"").trim())?p.name:"";
 $("english-name-confirmed").checked=false;
 updateIssueButton();
 $("search-results").replaceChildren();
}
async function doSearch(issuer=false){
 const field=$(issuer?"issuer-query":"subject-query");
 const target=$(issuer?"issuer-results":"search-results");
 const query=field.value.trim();
 if(query.length<2){message("اكتب حرفين على الأقل للبحث.",true);return;}
 target.textContent="جارٍ البحث في حسابات نبض...";
 try{
  const data=await call("search_subjects",{query});
  const list=data.subjects||[];
  target.innerHTML=list.length?list.map(s=>'<div class="search-result"><div><strong>'+E(s.name||"دون اسم")+'</strong><small>'+E(s.role==="student"?"طالب أو حساب عام":"حساب بالأكاديمية")+'</small></div><button type="button" data-id="'+E(s.id)+'">اختيار</button></div>').join(""):'<div class="no-results">لم يُعثر على حساب بهذا الاسم.</div>';
  target.querySelectorAll("[data-id]").forEach(btn=>btn.addEventListener("click",()=>selectPerson(list.find(p=>p.id===btn.dataset.id),issuer)));
 }catch(e){target.textContent="";message("تعذر البحث: "+e.message,true);}
}
function fmt(date){try{return new Intl.DateTimeFormat("ar-PS",{timeZone:"Asia/Hebron",year:"numeric",month:"long",day:"numeric"}).format(new Date(date));}catch{return "—";}}
function viewUrl(token){return new URL("official-document-verify.html?token="+encodeURIComponent(token),location.href).href;}
function qr(parent,url){
 parent.replaceChildren();
 if(typeof QRCode!=="function")return false;
 try{new QRCode(parent,{text:url,width:180,height:180,correctLevel:QRCode.CorrectLevel?.M});return true;}catch(_){return false;}
}
function englishDate(date){
 try{return new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Hebron",year:"numeric",month:"long",day:"numeric"}).format(new Date(date));}
 catch{return "—";}
}
function textSection(lang,lines){
 const section=document.createElement("section");
 section.className="bilingual-text bilingual-text--"+lang;
 section.lang=lang;section.dir=lang==="en"?"ltr":"rtl";
 // The bilingual document titles are already above; start both sections directly
 // with the formal statement, without distracting "Arabic text / English version" labels.
 lines.forEach(line=>{const p=document.createElement("p");p.textContent=line;section.append(p);});
 return section;
}
function addEvidenceRow(root,titleAr,titleEn,valueAr,valueEn){
 const entry=document.createElement("div");entry.className="evidence-row";
 const labels=document.createElement("div");
 const ar=document.createElement("b");ar.textContent=titleAr;
 const en=document.createElement("small");en.lang="en";en.dir="ltr";en.textContent=titleEn;
 labels.append(ar,en);
 const vals=document.createElement("div");vals.className="evidence-value";
 const va=document.createElement("strong");va.textContent=valueAr;
 const ve=document.createElement("small");ve.lang="en";ve.dir="ltr";ve.textContent=valueEn;
 vals.append(va,ve);entry.append(labels,vals);root.append(entry);
}
function renderVerifiedDetails(row){
 const root=$("sheet-verified-details");
 root.replaceChildren();
 const d=row.subject_details;
 if(!d||typeof d!=="object"||!d.role){root.hidden=true;return;}
 const heading=document.createElement("div");
 heading.className="evidence-heading";
 const har=document.createElement("strong");har.textContent="البيانات والمناصب والدورات المثبتة";
 const hen=document.createElement("small");hen.textContent="VERIFIED ROLES, APPOINTMENTS & TRAINING";hen.lang="en";hen.dir="ltr";
 heading.append(har,hen);root.append(heading);
 const role=roleLabels[d.role]||[String(d.role).slice(0,60),String(d.role).slice(0,60)];
 addEvidenceRow(root,"صفة الحساب المثبتة","Verified account role",role[0],role[1]);
 const members=Array.isArray(d.memberships)?d.memberships:[];
 members.slice(0,2).forEach(m=>{
  const c=councilLabels[m.council_code]||[m.council_code||"—",m.council_code||"—"];
  const pos=positionLabels[m.position]||[m.position||"—",m.position||"—"];
  addEvidenceRow(root,"تكليف مجلس موثق","Verified council appointment",
   pos[0]+" — "+c[0],pos[1]+" — "+c[1]+(m.member_code?" · "+m.member_code:""));
 });
 if(members.length>2)addEvidenceRow(root,"عضويات إضافية","Other appointments",
  "توجد عضويات أخرى مثبتة في السجل","Additional memberships on record");
 const certified=Array.isArray(d.certified_courses)?d.certified_courses:[];
 certified.slice(0,3).forEach((c,i)=>{
  const hours=typeof c.hours==="number"&&c.hours>0?" ("+c.hours+" ساعة)":"";
  const hoursEn=typeof c.hours==="number"&&c.hours>0?" ("+c.hours+" hours)":"";
  addEvidenceRow(root,"دورة بشهادة صالحة "+(i+1),"Course with valid certificate "+(i+1),
   localizedCourse(c).ar+hours,
   localizedCourse(c).en+hoursEn);
 });
 if(certified.length>3)addEvidenceRow(root,"دورات إضافية موثقة","Other certified courses",
   "توجد شهادات صالحة أخرى في السجل","Additional valid certificates on record");
 const ongoing=Array.isArray(d.ongoing_courses)?d.ongoing_courses:[];
 ongoing.slice(0,2).forEach((c,i)=>addEvidenceRow(root,"دورة مسجل بها حاليًا "+(i+1),"Enrolled course (not completed) "+(i+1),
  localizedCourse(c).ar+" — لم يُثبت إتمامها",
  localizedCourse(c).en+" — completion not certified"));
 root.hidden=false;
}
function linearBarcode(row){
 const svg=$("sheet-barcode");
 while(svg.firstChild)svg.removeChild(svg.firstChild);
 if(typeof JsBarcode!=="function")return false;
 try{
  JsBarcode(svg,row.number,{format:"CODE128",width:1.25,height:38,fontSize:10,
    textMargin:3,displayValue:true,margin:1,background:"#fffdfa",lineColor:"#173848"});
  return true;
 }catch(_){return false;}
}
function printDoc(row){
 state.doc=row;
 const t=defs.find(x=>x.id===row.doc_type);
 if(!t){message("نوع المستند غير معروف",true);return;}
 $("sheet-kicker").textContent=t.en;
 $("sheet-title").textContent=t.name;
 $("sheet-subtitle").textContent=t.en.toUpperCase();
 $("sheet-name").textContent=row.subject_name;
 $("sheet-name-en").textContent=row.subject_name_en||"ENGLISH NAME NOT YET RECORDED";
 $("sheet-name-en").classList.toggle("name-not-recorded",!row.subject_name_en);
 $("sheet-date").textContent=fmt(row.issued_at);
 $("sheet-date-en").textContent=englishDate(row.issued_at);
 $("sheet-issuer").textContent="المُصدر المسجل · Registered issuer: "+row.issuer_name;
 $("sheet-number").textContent=row.number;
 const signatory=String(row.signatory_name||row.issuer_name||"إدارة أكاديمية نبض");
 const isDirector=row.signatory_kind==="director";
 $("sheet-signatory").textContent=signatory;
 $("sheet-signature-role").textContent=isDirector?"اعتماد المدير العام · General Director":
  "اعتماد المُصدر المفوّض · Authorized Issuer";
 $("sheet-signatory-en").textContent=isDirector?"GENERAL DIRECTOR · DIGITAL AUTHORIZATION":
  "AUTHORIZED ISSUER · DIGITAL APPROVAL";
 renderVerifiedDetails(row);
 const evidenceCount=$("sheet-verified-details").querySelectorAll(".evidence-row").length;
 document.querySelector(".official-sheet")?.classList.toggle("document-dense",evidenceCount>5);
 const body=$("sheet-body");
 body.replaceChildren(
  textSection("ar",t.lines),
  textSection("en",bilingualTemplates[row.doc_type]||[])
 );
 $("sheet-note").textContent=row.doc_type==="complaint"?
  "تسجيل نموذج الشكوى لا يُثبت صحة الوقائع. / Registering a complaint does not validate allegations.":
  "الصفات والدورات الواردة، إن وجدت، مستخرجة من سجلات أكاديمية نبض عند الإصدار. / Any listed roles or courses were verified against the Academy records when this document was issued." ;
 const valid=row.status==="issued";
 const link=viewUrl(row.verify_token);
 $("verify-document").href=link;
 const qrReady=qr($("sheet-qr"),link);
 const barcodeReady=linearBarcode(row);
 $("print-button").disabled=!valid||!qrReady||!barcodeReady||!row.subject_name_en;
 $("legacy-english-name-editor").hidden=Boolean(row.subject_name_en)||!valid;
 $("legacy-subject-name-en").value="";
 $("legacy-english-name-confirmed").checked=false;
 $("workspace").hidden=true;
 $("print-area").hidden=false;
 window.scrollTo(0,0);
 message(!valid?"هذه الوثيقة ملغاة ولا يجوز طباعتها على أنها سارية.":
  !row.subject_name_en?"هذا المستند قديم ولا يحفظ الاسم الإنجليزي. اعتمد الاسم بالإنجليزية من الخانة أسفل الورقة لتفعيل الطباعة دون إصدار رقم جديد.":
  (!qrReady||!barcodeReady)?"بيانات المستند جاهزة لكن رمز التحقق أو الباركود لم يُحمّل؛ تأكد من الإنترنت قبل الطباعة.":
  "المستند ثنائي اللغة وجاهز للطباعة، مع الاسم والتاريخ باللغتين والختم ورمز QR والباركود.",
  !valid||!qrReady||!barcodeReady||!row.subject_name_en);
}
async function issue(){
 if(state.busy||!canIssueSelected()){
  message("يرجى كتابة الاسم بالإنجليزية كما أكّده صاحب الحساب، ثم تأكيد صحة تهجئته قبل الإصدار.",true);
  return;
 }
 state.busy=true;$("issue").disabled=true;
 message("جارٍ إصدار المستند برقم وتاريخ معتمدين...");
 try{const result=await call("issue",{doc_type:state.type,subject_user_id:state.person.id,subject_name_en:validEnglishName($("subject-name-en").value),english_name_confirmed:true});if(!result.document)throw Error("لم يؤكد الخادم الإصدار");printDoc(result.document);await loadHistory(true);}
 catch(e){message("تعذر إصدار المستند: "+e.message,true);}
 finally{state.busy=false;updateIssueButton();}
}
async function confirmLegacyEnglishName(){
 const row=state.doc;
 if(!row||row.status!=="issued"||row.subject_name_en)return;
 const english=validEnglishName($("legacy-subject-name-en").value);
 if(!english||!$("legacy-english-name-confirmed").checked){
  message("أدخل الاسم بالإنجليزية وأكد أن صاحبه راجع صحة التهجئة قبل اعتمادها.",true);return;
 }
 const button=$("save-legacy-english-name");button.disabled=true;
 try{
  const result=await call("add_english_name",{id:row.id,subject_name_en:english,english_name_confirmed:true});
  if(!result.document)throw Error("لم يؤكد الخادم تحديث الاسم");
  printDoc(result.document);
  await loadHistory(true);
  message("تم حفظ الاسم الإنجليزي في السجل الأصلي دون تغيير رقم المستند أو تاريخ إصداره.");
 }catch(e){message("تعذر استكمال الاسم الإنجليزي: "+e.message,true);}
 finally{button.disabled=false;}
}
async function loadHistory(silent=false){
 try{
  const data=await call("list");state.items=data.documents||[];
  $("history-list").innerHTML=state.items.length?state.items.map(r=>{
   const status=r.status==="issued"?"ساري":"ملغى";
   const btn='<button type="button" class="secondary" data-open="'+r.id+'">فتح المستند</button>';
   const cancel=state.admin&&r.status==="issued"?'<button type="button" class="secondary" data-void="'+r.id+'">إلغاء المستند</button>':"";
   return '<div class="history-item"><div><strong>'+E(docName(r.doc_type))+' · '+E(r.subject_name)+'</strong><small dir="ltr">'+E(r.number)+'</small><small>'+E(fmt(r.issued_at))+' · '+E(status)+'</small></div><div class="row-actions">'+btn+cancel+'</div></div>';
  }).join(""):'<div class="no-results">لا توجد مستندات صادرة من حسابك بعد.</div>';
  document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>open(Number(b.dataset.open))));
  document.querySelectorAll("[data-void]").forEach(b=>b.addEventListener("click",()=>voidDoc(Number(b.dataset.void))));
  if(!silent)message("تم تحديث سجل المستندات.");
 }catch(e){message("تعذر تحميل السجل: "+e.message,true);}
}
async function open(id){try{const d=await call("get",{id});printDoc(d.document);}catch(e){message("تعذر فتح المستند: "+e.message,true);}}
async function voidDoc(id){
 if(!state.admin||!confirm("هل تريد إلغاء المستند نهائيًا؟ سيظهر عبر QR أنه ملغى."))return;
 try{await call("void",{id});message("تم إلغاء المستند في السجل الرسمي.");await loadHistory(true);}
 catch(e){message("تعذر الإلغاء: "+e.message,true);}
}
function renderScopes(){
 $("issuer-scopes").innerHTML=defs.map(t=>'<label><input type="checkbox" value="'+t.id+'"> '+E(t.name)+'</label>').join("");
}
async function grant(){
 if(!state.issuer)return;
 const allowed_types=Array.from($("issuer-scopes").querySelectorAll("input:checked")).map(b=>b.value);
 const active=$("issuer-enabled").checked;
 try{
  const data=await call("grant_issuer",{user_id:state.issuer.id,allowed_types,active});
  if(!data.ok)throw Error("لم يؤكد الخادم عملية التفويض");
  message("تم تحديث تفويض الإصدار لهذا الحساب.");
  loadIssuers();
 }catch(e){message("تعذر التفويض: "+e.message,true);}
}
async function loadIssuers(){
 if(!state.admin)return;
 try{
  const d=await call("list_issuers");
  $("issuer-roster").innerHTML=(d.issuers||[]).length?d.issuers.map(p=>
   '<div class="history-item"><div><strong>'+E(p.name||p.user_id)+'</strong><small>'+E(p.allowed_types.map(docName).join("، ")||"دون صلاحيات")+'</small><small>'+E(p.active?"مخوّل":"التفويض معطّل")+'</small></div><button type="button" class="secondary" data-edit="'+E(p.user_id)+'">تعديل</button></div>').join(""):'<p class="muted">لا توجد تفويضات مسجلة بعد.</p>';
  $("issuer-roster").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>{
   const p=(d.issuers||[]).find(x=>x.user_id===b.dataset.edit);if(!p)return;
   selectPerson({id:p.user_id,name:p.name},true);
   $("issuer-enabled").checked=p.active;
   $("issuer-scopes").querySelectorAll("input").forEach(i=>i.checked=p.allowed_types.includes(i.value));
   $("permissions-panel").scrollIntoView({behavior:"smooth"});
  }));
 }catch(e){message("تعذر تحميل التفويضات: "+e.message,true);}
}
function init(){
 $("search-subject").addEventListener("click",()=>doSearch(false));
 $("issuer-search-button").addEventListener("click",()=>doSearch(true));
 $("subject-query").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();doSearch(false);}});
 $("issuer-query").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();doSearch(true);}});
 $("issue").addEventListener("click",issue);
 ["subject-name-en","english-name-confirmed"].forEach(id=>{
  $(id).addEventListener(id==="subject-name-en"?"input":"change",updateIssueButton);
 });
 $("save-legacy-english-name").addEventListener("click",confirmLegacyEnglishName);
 $("refresh-list").addEventListener("click",()=>loadHistory());
 $("save-issuer").addEventListener("click",grant);
 $("print-button").addEventListener("click",()=>{if(state.doc?.status==="issued"&&!$("print-button").disabled)window.print();});
 $("zoom-document").addEventListener("click",()=>{
  const area=$("print-area");
  const active=area.classList.toggle("doc-preview-zoom");
  $("zoom-document").setAttribute("aria-pressed",String(active));
  $("zoom-document").innerHTML=active
    ?'عرض الصفحة كاملة <span lang="en" dir="ltr">· Fit page</span>'
    :'تكبير المعاينة للقراءة <span lang="en" dir="ltr">· Zoom</span>';
 });
 $("back-to-workspace").addEventListener("click",()=>{$("print-area").hidden=true;$("workspace").hidden=false;message("يمكنك اختيار مستند جديد.");window.scrollTo(0,0);});
 renderScopes();
 (async()=>{try{
  if(!db)throw Error("اتصال نبض غير متاح");
  const {data,error}=await db.auth.getUser();
  if(error||!data?.user)throw Error("سجل الدخول من حساب المدير أو الحساب المفوّض أولًا.");
  const auth=await call("whoami");
  if(!auth.can_issue)throw Error("حسابك ليس مخوّلًا لإصدار المستندات. اطلب التفويض من المدير العام.");
  state.allowed=auth.allowed_types||[];state.admin=auth.is_admin;
  $("workspace").hidden=false;$("permissions-panel").hidden=!state.admin;
  renderTypes();message("تم التحقق من صلاحياتك. يمكنك إصدار المستندات ضمن القوالب المصرح بها.");
  loadHistory(true);if(state.admin)loadIssuers();
 }catch(e){message(e.message,true);}})();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();