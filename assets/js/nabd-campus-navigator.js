/* Load NABD Messenger once from either of the shared public navigation systems. */
(()=>{const source=document.currentScript?.src;
if(!source||window.__NABD_MESSENGER_REQUESTED)return;
window.__NABD_MESSENGER_REQUESTED=true;
const script=document.createElement("script");script.src=new URL("nabd-assistant.js?v=2",source).href;
script.defer=true;document.head.append(script);
})();

/* NABD Cross-Campus Navigator — public routes only; no account data or browser storage. */
(()=>{"use strict";
if(document.getElementById("ncn-open"))return;
const D=document, siteRoot=D.currentScript?new URL("../../",D.currentScript.src):new URL("./",location.href), tr=(ar,en)=>D.documentElement.lang==="en"?en:ar;
const data=[
["portal","study","بوابة الطالب","Student portal","حسابي مقرراتي الشهادات login", "My courses, certificates and account","portal.html"],
["university","study","نظام الجامعة V22","University OS V22","مقررات اختبارات درجات حضور شهادات","Academic courses, exams, grades, attendance","university-os.html"],
["one","study","NABD ONE · الحرم المتكامل","NABD ONE Campus","مقررات محاضرات مباشرة استاد ذكي مراسلات جودة","Courses, live lectures, AI Professor, messaging, quality","nabd-one.html"],
["360","study","NABD UNIVERSITY 360","NABD UNIVERSITY 360","خطة الدراسة الشخصية الأستاذ إنجازات المسار الجامعي الدفعة التجريبية","Personal learning journey, verified achievements and pilot readiness","nabd-university-360.html"],
["volunteer-faculty","faculty","شبكة المحاضرين المتطوعين","Volunteer Faculty Network","تطوع دولي محاضر جامعة تدريس نموذج","Volunteer lecturer applications and review","nabd-360-lecturers.html"],
["connect","management","NABD CONNECT · مراسلاتي","NABD CONNECT · My Tickets","رسائل الإدارة تذاكر الدعم ردود الطلاب","Secure private support tickets and replies","nabd-connect.html"],
["future","study","مختبر نبض 2050","NABD 2050 Future Lab","آلة الزمن الطبي الواقع المعزز المجسمات رحلة التعلم","Medical time machine, augmented reality and connected learning journey","nabd-2050.html"],
["campus","study","الحرم الرقمي الشخصي","My digital campus","ملف الطالب محاضرات تسجيل","Personal learning and lecture workspace","nabd-campus.html"],
["courses","study","كتالوج المقررات","Course catalogue","تسجيل المواد المقررات","Browse the academy's courses","index.html#courses"],
["learning","study","عالم التعلم","Learning universe","دروس مراجعة تعليم","Learning and revision resources","learning/"],
["atlas","study","أطلس التشريح","NABD ATLAS","تشريح ثلاثي الأبعاد جسم الانسان","Interactive anatomy exploration","atlas/index.html"],
["infinity","study","NABD INFINITY","NABD INFINITY","تفاعل طبي تعليمي","Immersive medical learning","infinity/"],
["passport","study","جواز المهارات","Skill passport","سجل المهارات إنجازات","Your recorded learning skills","skill-passport.html"],
["knowledge","study","مركز المعرفة الطبية","Medical knowledge","موسوعة تخصصات مراجعة","Specialty reference and review","nabd-medical-knowledge.html"],
["lectures","study","المحاضرات الدولية","Global lectures","لقاءات دولية محاضرين","Emerging international lecture programme","global-lectures.html"],
["faculty","faculty","استوديو المحاضر","Lecturer studio","تكليف المحاضرات جدول تدريس","Teaching assignments and resources","lecturers.html"],
["research","research","شبكة نبض البحثية","Research network","البحث العلمي تعاون دولي","Research programmes and cooperation","nabd-global-research.html"],
["starter","research","مختبر الباحث الناشئ","Research starter lab","خطة بحث PICO منهجية","Structure a research proposal","research-starter-lab.html"],
["office","research","مكتب البحث العلمي","Research office","تنسيق الباحثين علمي","Research administration and oversight","research-office.html"],
["academic","management","مسارات الأكاديمية","Academic pathways","الخدمات أكاديمية نبض","Find your academic pathway","academy.html"],
["admin","management","مركز الإدارة","Administration","مدير طلبات شؤون الطلاب","Restricted administration workspace","admin.html"],
["apply","management","الطلبات الإدارية","Applications","تطوع مجلس تنفيذي","Apply to support the academy","executive-application.html"],
["status","management","متابعة الطلبات","Application status","حالة التسجيل التطوع","Track application status","application-status.html"],
["partners","management","الشراكات والمبادرات","Partnerships","تعاون دعم","Partnerships and initiatives","nabd-partners.html"],
["consult","management","الاستشارات والتواصل","Consultation contact","تواصل استشارة طبية","Consultation contact services","medical-consultations.html"],
["policies","management","السياسات والخصوصية","Policies and privacy","نظام خصوصية حقوق","Read academy policies","policies.html"]
];
const categories=[["all","الكل","All"],["study","الطلاب والتعلم","Students & learning"],["faculty","المحاضرون","Faculty"],["research","البحث","Research"],["management","المؤسسة","Academy"]];
const el=(tag,cls,text)=>{const n=D.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const open=el("button","ncn-launch"),overlay=el("div","ncn-overlay"),panel=el("section","ncn-panel"),head=el("div","ncn-head"),hgroup=el("div","ncn-heading"),title=el("h2"),hint=el("p"),close=el("button","ncn-close","×"),search=el("input","ncn-search"),filters=el("nav","ncn-filters"),meta=el("p","ncn-meta"),results=el("div","ncn-results"),footer=el("p","ncn-footer");
let current="all",priorFocus=null,previousOverflow="",isOpen=false;
open.id="ncn-open";open.type="button";open.setAttribute("aria-haspopup","dialog");open.setAttribute("aria-controls","ncn-dialog");
overlay.id="ncn-overlay";overlay.hidden=true;overlay.setAttribute("aria-hidden","true");
panel.id="ncn-dialog";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-labelledby","ncn-title");
title.id="ncn-title";hgroup.append(title,hint);head.append(hgroup,close);
search.type="search";search.id="ncn-search";search.maxLength=100;search.autocomplete="off";search.spellcheck=false;search.setAttribute("aria-label","Find an academy page");
filters.setAttribute("aria-label","Filter academy routes");
close.type="button";close.setAttribute("aria-label","Close");
meta.setAttribute("aria-live","polite");footer.className="ncn-footer";
panel.append(head,search,filters,meta,results,footer);overlay.append(panel);
function labels(){
 open.textContent=tr("◈ بوابات نبض","◈ NABD portals");
 open.setAttribute("aria-label",tr("فتح دليل بوابات أكاديمية نبض","Open NABD campus navigator"));
 title.textContent=tr("جميع مسارات نبض، في مكان واحد","Your whole NABD campus");
 hint.textContent=tr("انتقل إلى المساحات الحقيقية حسب دورك. صلاحيات الدخول تُفحص داخل كل بوابة.","Move between real workspaces. Each portal enforces its own account permissions.");
 search.placeholder=tr("ابحث عن مقرر، بوابة، محاضر أو بحث…","Search for a course, portal, lecturer or research…");
 close.setAttribute("aria-label",tr("إغلاق الدليل","Close navigator"));
 footer.textContent=tr("الدليل لا يعرض بيانات الحسابات ولا يمنح صلاحيات جديدة. Ctrl/⌘ + K للفتح.","This navigator never exposes account data or grants access. Ctrl/⌘ + K to open.");
 filters.replaceChildren();
 for(const [id,ar,en] of categories){
  const b=el("button","ncn-filter"+(id===current?" active":""),tr(ar,en));
  b.type="button";b.dataset.group=id;b.setAttribute("aria-pressed",String(id===current));filters.append(b);
 }
 render();
}
function render(){
 const q=search.value.trim().toLocaleLowerCase();
 const found=data.filter(x=>(current==="all"||x[1]===current)&&(!q||[x[2],x[3],x[4],x[5]].join(" ").toLocaleLowerCase().includes(q)));
 results.replaceChildren();
 meta.textContent=tr("المسارات المتاحة: ","Available routes: ")+found.length;
 if(!found.length){results.append(el("p","ncn-empty",tr("لم نجد مسارًا مطابقًا. جرب عبارة أخرى.","No matching route. Try another term.")));return}
 for(const x of found){
  const link=el("a","ncn-link");link.href=new URL(x[6],siteRoot).href;link.dataset.route=x[0];
  const symbol=el("span","ncn-mark",({study:"✦",faculty:"⌘",research:"⌬",management:"▣"}[x[1]]||"◈"));
  symbol.setAttribute("aria-hidden","true");
  const body=el("span","ncn-link-body"),name=el("strong","",tr(x[2],x[3])),desc=el("small","",tr(x[4],x[5]));
  body.append(name,desc);link.append(symbol,body,el("span","ncn-arrow","↗"));results.append(link);
 }
}
function show(){
 if(isOpen)return;isOpen=true;priorFocus=D.activeElement;previousOverflow=D.body.style.overflow;D.body.style.overflow="hidden";
 labels();overlay.hidden=false;overlay.setAttribute("aria-hidden","false");open.setAttribute("aria-expanded","true");search.focus();
}
function hide(){
 if(!isOpen)return;isOpen=false;overlay.hidden=true;overlay.setAttribute("aria-hidden","true");open.setAttribute("aria-expanded","false");
 D.body.style.overflow=previousOverflow;search.value="";current="all";priorFocus?.focus?.();
}
open.addEventListener("click",show);close.addEventListener("click",hide);
overlay.addEventListener("click",e=>{if(e.target===overlay)hide()});
search.addEventListener("input",render);
filters.addEventListener("click",e=>{const b=e.target.closest("button[data-group]");if(!b)return;current=b.dataset.group;labels()});
D.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&isOpen){e.preventDefault();hide();return}
 const target=e.target,editable=target?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName||"");
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"||e.key==="/"&&!editable&&!e.altKey&&!e.ctrlKey&&!e.metaKey){
  e.preventDefault();isOpen?hide():show();return;
 }
 if(!isOpen||e.key!=="Tab")return;
 const focusable=[...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled])')].filter(n=>n.offsetParent!==null);
 if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];
 if(e.shiftKey&&D.activeElement===first){e.preventDefault();last.focus()}
 else if(!e.shiftKey&&D.activeElement===last){e.preventDefault();first.focus()}
});
const observer=new MutationObserver(()=>labels());
observer.observe(D.documentElement,{attributes:true,attributeFilter:["lang"]});
D.body.append(open,overlay);labels();
})();