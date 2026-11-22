/* NABD internal directory: minimal, bilingual, no accounts or tracking. */
(()=>{
"use strict";
const d=window.NABD_INSTITUTIONAL_DIRECTORY;
if(!d)return;
const $=id=>document.getElementById(id);
const grid=$("directoryGrid"),search=$("directorySearch");
if(!grid||!search)return;
let language=window.NABD_SITE_LANGUAGE?.get()||"ar",filter="essential";
const entries=d.entries,categories=d.categories;
const t=(ar,en)=>language==="ar"?ar:en;
const icon={learning:"◈",opportunities:"✳",research:"◉",initiatives:"✧",management:"▣",governance:"◇"};
const textElement=(name,cl,txt)=>{
 const node=document.createElement(name);
 if(cl)node.className=cl;if(txt!==undefined)node.textContent=txt;return node;
};
const normalize=str=>String(str||"").toLowerCase().normalize("NFKD").replace(/[\u064b-\u065f\u0670\u0640]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي");
const cards=entries.map(entry=>{
 const link=textElement("a","directory-item");
 link.href=d.href(entry.path);link.dataset.group=entry.group;link.dataset.essential=String(entry.essential);
 link.dataset.search=normalize([entry.ar,entry.en,entry.descAr,entry.descEn,categories[entry.group]?.ar,categories[entry.group]?.en].join(" "));
 const head=textElement("div","directory-item-head");
 const symbol=textElement("span","directory-item-icon",icon[entry.group]||"◈");symbol.setAttribute("aria-hidden","true");
 const category=textElement("small","directory-item-category");
 head.append(symbol,category);
 const title=textElement("strong","directory-item-title");
 const description=textElement("p","directory-item-desc");
 link.append(head,title,description);
 if(entry.restricted){
  const tag=textElement("span","directory-item-restricted");
  link.append(tag);link.dataset.restricted="1";
 }
 grid.append(link);
 return {entry,link,category,title,description,tag:link.querySelector(".directory-item-restricted")};
});
function updateContent(){
 document.documentElement.lang=language;
 document.documentElement.dir=language==="ar"?"rtl":"ltr";
 for(const node of document.querySelectorAll("[data-ar][data-en]"))node.textContent=node.dataset[language];
 search.placeholder=t("مثال: امتحانات، منح، أبحاث، مراسلات…","e.g. exams, scholarships, research, messages…");
 $("directoryLang").textContent=language==="ar"?"EN":"عربي";
 $("directoryLang").setAttribute("aria-label",t("Switch to English","التبديل إلى العربية"));
 for(const item of cards){
  const {entry,category,title,description,tag}=item;
  category.textContent=t(categories[entry.group].ar,categories[entry.group].en);
  title.textContent=t(entry.ar,entry.en);
  description.textContent=t(entry.descAr,entry.descEn);
  if(tag)tag.textContent=t("يتطلب تصريحًا","Authorization required");
 }
 render();
}
function render(){
 const query=normalize(search.value.trim());
 let shown=0;
 for(const {entry,link} of cards){
  // A search covers the entire academy, regardless of the active category.
  const matchQuery=!query||link.dataset.search.includes(query);
  const matchGroup=Boolean(query)||filter==="all"||(filter==="essential"?entry.essential:entry.group===filter);
  const visible=matchQuery&&matchGroup;
  link.hidden=!visible;if(visible)shown++;
 }
 // CSS honors the hidden attribute, including with the flex card layout.
 const buttons=document.querySelectorAll(".directory-filter");
 for(const button of buttons){
  const active=!query&&button.dataset.filter===filter;
  button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));
 }
 const head=$("directoryHeading");
 head.textContent=query?t("نتائج البحث","Search results"):filter==="essential"?t("بوابات أساسية","Essential services"):
 filter==="all"?t("جميع خدمات الأكاديمية","All academy services"):
 t(categories[filter].ar,categories[filter].en);
 $("directoryCount").textContent=t(shown+" خدمة",shown+" service"+(shown===1?"":"s"));
 $("directoryEmpty").hidden=shown>0;
}
$("directoryLang").addEventListener("click",()=>{language=language==="ar"?"en":"ar";window.NABD_SITE_LANGUAGE?.choose(language);updateContent()});
search.addEventListener("input",render);
for(const button of document.querySelectorAll(".directory-filter")){
 button.addEventListener("click",()=>{
  filter=button.dataset.filter;search.value="";render();
 });
}
updateContent();
})();