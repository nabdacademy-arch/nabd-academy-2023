/* NABD internal institutional directory – isolated, privacy-preserving navigation.
 * Never changes index.html, identity, access policy, or existing portal forms.
 * Routes are display links only; authorization is enforced by each destination.
 */
(() => {
"use strict";
const script=document.querySelector("script[data-nabd-institutional-nav]");
if(!script)return;
const root=new URL("../../",script.src);
const catalog=[["nabd-campus.html","البيئة التعليمية","NABD Campus","وصول منظم لمسارات التعلم والمنصات.","Learning environment and major pathways.","learning",0,1],["portal.html","بوابة الطالب","Student Portal","الدورات والدرجات وحساب الطالب.","Courses, grades and learner account.","learning",0,1],["nabd-moodle.html","مودل نبض","NABD Moodle","الدروس والمواد الأكاديمية.","Academic lessons and course materials.","learning",0,1],["student-exams.html","امتحانات الطلاب","Student Exams","الاختبارات والنتائج المعتمدة.","Assessments and official results.","learning",0,1],["learning/index.html","مساحة التعلّم","Learning Space","البدء بالدراسة والوصول إلى المصادر.","Access lessons and learning resources.","learning",0,0],["lecturers.html","استوديو المحاضر","Lecturer Studio","إدارة المحاضرات التعليمية.","Teaching and lecture management.","learning",1,0],["global-lectures.html","المحاضرات الدولية","Global Lectures","البرنامج الدولي للمحاضرات الطبية.","International medical lecture program.","learning",0,0],["nabd-medical-knowledge.html","المعرفة الطبية","Medical Knowledge","مكتبة مرجعية ومسارات معرفية.","Reference knowledge and learning.","learning",0,0],["nabd-university-360.html","نبض 360","NABD University 360","التجربة الأكاديمية الرقمية.","Integrated digital academic experience.","learning",0,0],["academy.html","المسارات الأكاديمية","Academic Pathways","تعرف على المسارات المتاحة.","Explore academic pathways.","learning",0,0],["atlas/index.html","أطلس نبض","NABD Atlas","تعلم الطب عبر التجارب المرئية.","Explore visual medical learning.","learning",0,0],["learning/zero.html","نبض دون انقطاع","NABD Zero","موارد ملائمة لضعف الاتصال.","Learning for limited connectivity.","learning",0,0],["scholarships.html","أخبار المنح","Scholarship News","فرص الدراسة وروابط التقديم.","Study opportunities and application links.","opportunities",0,1],["motivation-studio.html","استوديو رسالة الدافع","Motivation Studio","كتابة الرسائل ومراجعتها.","Draft and review motivation letters.","opportunities",0,1],["enroll.html","التسجيل","Enrollment","إجراءات الالتحاق والتسجيل.","Enrollment and joining the academy.","opportunities",0,0],["skill-passport.html","جواز المهارات","Skill Passport","تجميع المهارات والإنجازات.","Record skills and achievements.","opportunities",0,0],["nabd-connect.html","التواصل مع نبض","NABD Connect","المراسلات والمتابعة مع الأكاديمية.","Messages and academy follow-up.","opportunities",0,0],["nabd-hope.html","منحة نبض الأمل","NABD Hope","مبادرة الدعم التعليمي للطلبة.","Student educational support initiative.","opportunities",0,0],["research-office.html","مكتب البحث العلمي","Research Office","تنظيم المقترحات والتعاون البحثي.","Research proposals and collaboration.","research",0,1],["research-starter-lab.html","مختبر الباحث الناشئ","Research Starter Lab","البدء بمشروع بحثي موثق.","Start a documented research project.","research",0,0],["nabd-global-research.html","شبكة الأبحاث العالمية","Global Research Network","التعاون العلمي مع الباحثين.","Researcher collaboration and exchange.","research",0,0],["research-news.html","أخبار البحوث","Research Updates","آخر الأبحاث المنشورة داخل المنصة.","Recent research updates.","research",0,0],["research.html","المكتبة البحثية","Research Library","المحتوى والدراسات البحثية.","Research materials and studies.","research",0,0],["impact-lab/index.html","مختبر الأثر","Impact Lab","مبادرات ذات أثر قابل للقياس.","Projects focused on measurable impact.","initiatives",0,0],["nabd-2050.html","مختبر المستقبل","Future Lab","التجارب والأفكار المستقبلية.","Future-focused explorations and ideas.","initiatives",0,0],["nabd-next-frontier.html","مشاريع آفاق نبض","Next Frontier","مشاريع ومبادرات تطويرية.","Development initiatives and projects.","initiatives",0,0],["councils.html","مجالس نبض","NABD Councils","التنسيق والأدوار المؤسسية.","Council roles and coordination.","initiatives",0,0],["nabd-partners.html","الشراكات","Partnerships","التعاون والعلاقات المؤسسية.","Institutional partnerships.","initiatives",0,0],["medical-consultations.html","الاستشارات الطبية","Medical Consultations","بوابة الاستشارات وفق نطاقها المحدد.","Consultation service within its stated scope.","initiatives",0,0],["admin.html","لوحة الإدارة","Administration","إدارة النظام والأكاديمية؛ يتطلب تفويضًا.","Academy management; authorization required.","management",1,0],["quality-exams.html","الامتحانات والجودة","Assessment & Quality","إدارة التقييم والجودة للمخولين.","Assessment oversight for authorized staff.","management",1,0],["research-manager.html","إدارة الأبحاث","Research Management","إدارة محتوى الأبحاث للمخولين.","Research publishing for authorized staff.","management",1,0],["scholarship-manager.html","إدارة المنح","Scholarship Management","نشر المنح ومراجعتها للمخولين.","Scholarship operations for authorized staff.","management",1,0],["official-documents.html","الوثائق الرسمية","Official Documents","إصدار الوثائق وإدارتها للمخولين.","Document management for authorized staff.","management",1,0],["council-documents.html","وثائق المجالس","Council Documents","وثائق العمل المؤسسي للمخولين.","Authorized council documentation.","management",1,0],["policies.html","السياسات والشفافية","Policies & Transparency","السياسات الرسمية والمسؤوليات.","Policies and institutional responsibility.","governance",0,1],["official-document-verify.html","التحقق من وثيقة","Verify Document","التحقق من صحة الوثائق الصادرة.","Verify issued documents.","governance",0,0],["council-verify.html","التحقق من وثائق المجالس","Council Verification","التحقق من وثائق المجالس الرسمية.","Council document verification.","governance",0,0],["application-status.html","حالة الطلب","Application Status","متابعة الطلبات والنتائج.","Check application progress.","governance",0,0]];
const categories={
 learning:{ar:"التعلّم والتعليم",en:"Learning & Education",icon:"◈"},
 opportunities:{ar:"خدمات الطلاب والفرص",en:"Student Services & Opportunities",icon:"✳"},
 research:{ar:"البحث العلمي والمعرفة",en:"Research & Knowledge",icon:"◉"},
 initiatives:{ar:"المبادرات والتعاون",en:"Initiatives & Collaboration",icon:"✧"},
 management:{ar:"الإدارة والتشغيل",en:"Management & Operations",icon:"▣"},
 governance:{ar:"الحوكمة والشفافية",en:"Governance & Transparency",icon:"◇"}
};
const entries=catalog.map(([path,ar,en,descAr,descEn,group,restricted,essential])=>
 ({path,ar,en,descAr,descEn,group,restricted:Boolean(restricted),essential:Boolean(essential)}));
const pagePath=decodeURIComponent(location.pathname.replace(root.pathname,""))||"index.html";
const lang=()=>document.documentElement.lang.toLowerCase().startsWith("en")?"en":"ar";
const text=(ar,en)=>lang()==="ar"?ar:en;
const href=path=>new URL(path,root).href;
const el=(tag,classes,content)=>{
 const n=document.createElement(tag);if(classes)n.className=classes;
 if(content!==undefined)n.textContent=content;return n;
};
const all=()=>entries;
window.NABD_INSTITUTIONAL_DIRECTORY=Object.freeze({entries,categories,href,root:root.href});
if(pagePath==="academy-directory.html")return;
// One accessible, compact doorway on non-home pages. No content is removed/reordered.
const launcher=el("button","nabd-institutional-launcher");
launcher.type="button";launcher.id="nabdInstitutionalLauncher";
launcher.setAttribute("aria-haspopup","dialog");
launcher.setAttribute("aria-expanded","false");
launcher.setAttribute("aria-controls","nabdInstitutionalPanel");
const badge=el("span","nabd-launcher-mark","N");
const launcherText=el("span","nabd-launcher-label",text("دليل الخدمات","Services"));
launcher.append(badge,launcherText);
document.body.append(launcher);
const backdrop=el("div","nabd-institutional-backdrop");backdrop.hidden=true;
const panel=el("section","nabd-institutional-panel");panel.id="nabdInstitutionalPanel";
panel.hidden=true;panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");
panel.setAttribute("aria-label",text("دليل الخدمات والبوابات","Academy services and portals"));
const header=el("div","nabd-institutional-head");
const title=el("div","nabd-institutional-heading");
title.append(el("strong","",text("دليل خدمات الأكاديمية","Academy Services")),
 el("small","",text("تصفح واضح دون تغيير صفحتك الحالية","Find what you need without leaving this page")));
const close=el("button","nabd-institutional-close","×");close.type="button";
close.setAttribute("aria-label",text("إغلاق القائمة","Close navigation"));
header.append(title,close);
const search=el("input","nabd-institutional-search");
search.type="search";search.autocomplete="off";
search.setAttribute("aria-label",text("ابحث عن خدمة أو بوابة","Search services and portals"));
search.placeholder=text("ابحث عن خدمة أو بوابة…","Search services and portals…");
const toplinks=el("div","nabd-institutional-toplinks");
const link=(path,label,cls)=>{
 const a=el("a",cls||"",label);a.href=href(path);return a;
};
toplinks.append(link("index.html",text("الرئيسية","Home")),link("academy-directory.html",text("كل الخدمات","All services")),
 link("policies.html",text("السياسات","Policies")));
const current=entries.find(e=>e.path===pagePath);
const context=el("p","nabd-institutional-context",
 current?text("أنت الآن في: "+current.ar,"Current: "+current.en):
 text("تنقّل بين الأقسام دون فقدان بيانات الصفحة","Move between services without changing this page"));
const sections=el("div","nabd-institutional-sections");
const headings=Array.from(document.querySelectorAll("main h2, main h3, article h2, article h3, section h2")).filter(n=>{
 const str=n.textContent?.trim()||"";
 return str.length>=4&&str.length<=115&&n.getClientRects().length>0&& !n.closest("#nabdInstitutionalPanel");
}).slice(0,12);
if(headings.length>=2){
 const local=el("div","nabd-institutional-section");
 local.append(el("h3","",text("داخل هذه الصفحة","On this page")));
 const items=el("div","nabd-institutional-links");
 headings.forEach((node,i)=>{
  const button=el("button","nabd-institutional-local",node.textContent.trim().slice(0,55));
  button.type="button";button.addEventListener("click",()=>{
   hide();node.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});
  });items.append(button);
 });
 local.append(items);sections.append(local);
}
for(const [category,meta] of Object.entries(categories)){
 const group=entries.filter(e=>e.group===category);
 if(!group.length)continue;
 const section=el("div","nabd-institutional-section");
 section.dataset.group=category;
 const heading=el("h3","",meta.icon+" "+text(meta.ar,meta.en));section.append(heading);
 const items=el("div","nabd-institutional-links");
 group.forEach(entry=>{
  const a=link(entry.path,text(entry.ar,entry.en),"nabd-institutional-link");
  a.dataset.keywords=[entry.ar,entry.en,entry.descAr,entry.descEn].join(" ").toLowerCase();
  if(entry.path===pagePath){a.setAttribute("aria-current","page");a.classList.add("current");}
  if(entry.restricted)a.title=text("تتطلب صلاحية مناسبة","Requires authorization");
  items.append(a);
 });
 section.append(items);sections.append(section);
}
const foot=el("p","nabd-institutional-foot",
 text("عرض الروابط لا يمنح صلاحيات؛ الدخول المقيّد يخضع لنظام كل بوابة.","Listing a service does not grant access; each portal enforces authorization."));
panel.append(header,toplinks,context,search,sections,foot);
document.body.append(backdrop,panel);
let previousFocus=null,previousOverflow="";
function renderFilter(){
 const query=search.value.trim().toLowerCase();
 for(const section of sections.querySelectorAll(".nabd-institutional-section[data-group]")){
  let visible=0;
  for(const a of section.querySelectorAll("a")){
   const show=!query||a.dataset.keywords.includes(query);
   a.hidden=!show;if(show)visible++;
  }
  section.hidden=visible===0;
 }
}
function open(){
 previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;
 panel.hidden=false;backdrop.hidden=false;launcher.setAttribute("aria-expanded","true");
 document.body.style.overflow="hidden";renderFilter();search.focus();
}
function hide(){
 panel.hidden=true;backdrop.hidden=true;launcher.setAttribute("aria-expanded","false");
 document.body.style.overflow=previousOverflow;
 if(previousFocus?.isConnected)previousFocus.focus();
}
launcher.addEventListener("click",()=>panel.hidden?open():hide());
close.addEventListener("click",hide);backdrop.addEventListener("click",hide);
search.addEventListener("input",renderFilter);
panel.addEventListener("keydown",event=>{
 if(event.key==="Escape"){event.preventDefault();hide();return;}
 if(event.key!=="Tab")return;
 const focusables=[...panel.querySelectorAll("a:not([hidden]),button:not([hidden]),input:not([hidden])")].filter(e=>e.getClientRects().length);
 if(!focusables.length)return;
 const first=focusables[0],last=focusables.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!panel.hidden)hide();});
const refreshLanguage=()=>{
 launcherText.textContent=text("دليل الخدمات","Services");
 panel.setAttribute("aria-label",text("دليل الخدمات والبوابات","Academy services and portals"));
 launcher.setAttribute("aria-label",text("فتح دليل خدمات الأكاديمية","Open academy services directory"));
 close.setAttribute("aria-label",text("إغلاق القائمة","Close navigation"));
 search.placeholder=text("ابحث عن خدمة أو بوابة…","Search services and portals…");
 search.setAttribute("aria-label",text("ابحث عن خدمة أو بوابة","Search services and portals"));
 title.querySelector("strong").textContent=text("دليل خدمات الأكاديمية","Academy Services");
 title.querySelector("small").textContent=text("تصفح واضح دون تغيير صفحتك الحالية","Find what you need without leaving this page");
 const top=toplinks.querySelectorAll("a");
 top[0].textContent=text("الرئيسية","Home");top[1].textContent=text("كل الخدمات","All services");top[2].textContent=text("السياسات","Policies");
 context.textContent=current?text("أنت الآن في: "+current.ar,"Current: "+current.en):text("تنقّل بين الأقسام دون فقدان بيانات الصفحة","Move between services without changing this page");
 sections.querySelectorAll("[data-group]").forEach(section=>{
  const key=section.dataset.group,group=categories[key];
  section.querySelector("h3").textContent=group.icon+" "+text(group.ar,group.en);
  const links=section.querySelectorAll("a");
  entries.filter(e=>e.group===key).forEach((entry,i)=>links[i].textContent=text(entry.ar,entry.en));
 });
 foot.textContent=text("عرض الروابط لا يمنح صلاحيات؛ الدخول المقيّد يخضع لنظام كل بوابة.","Listing a service does not grant access; each portal enforces authorization.");
};
launcher.setAttribute("aria-label",text("فتح دليل خدمات الأكاديمية","Open academy services directory"));
new MutationObserver(mutations=>{if(mutations.some(x=>x.attributeName==="lang"))refreshLanguage();})
 .observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
})();