/* NABD homepage translations: full 135-string curated locale files, loaded on demand.
   No external translation services, network tracking, or exposure of personal form data. */
(function() {
"use strict";
const supported=new Set(["ar","en","fr","es","tr","ru","id","de","pt","zh","hi","ur"]);
const rtl=new Set(["ar","ur"]);
const cache=window.NABD_NEO_TRANSLATIONS=window.NABD_NEO_TRANSLATIONS||{};
const pending=new Map();
const key="nabdCompactHomeLanguage";
const arLabel="تعذّر تحميل الترجمة الآن. تحقّق من الاتصال ثم حاول مجددًا.";
const enLabel="Translation could not load. Check your connection and try again.";
function getSaved(){try{return localStorage.getItem(key)||"ar";}catch{return "ar";}}
function save(value){try{localStorage.setItem(key,value);}catch{}}
function loadLocale(code){
 if(code==="ar"||code==="en")return Promise.resolve(null);
 if(Array.isArray(cache[code])&&cache[code].length===135)return Promise.resolve(cache[code]);
 if(pending.has(code))return pending.get(code);
 const promise=new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.async=true;
  script.src="assets/js/nabd-neo-"+code+".js?v=1";
  script.onload=()=>{
   if(Array.isArray(cache[code])&&cache[code].length===135)resolve(cache[code]);
   else reject(Error("Incomplete locale catalog"));
  };
  script.onerror=()=>reject(Error("Locale download unavailable"));
  document.head.appendChild(script);
 }).finally(()=>pending.delete(code));
 pending.set(code,promise);
 return promise;
}
function init(root,selector){
 if(!root||!selector)return;
 const nodes=[...root.querySelectorAll("[data-neo-ar][data-neo-en]")];
 let current="ar",sequence=0;
 const message=document.getElementById("neoLanguageNotice");
 const menu=document.getElementById("neoMenu");
 const nav=document.getElementById("neoNav");
 function apply(code){
  if(code!=="ar"&&code!=="en"&&(!Array.isArray(cache[code])||cache[code].length!==135))return false;
  nodes.forEach((el,index)=>{
   const native=el.getAttribute("data-neo-"+(code==="ar"?"ar":"en"));
   const translated=code==="ar"||code==="en"?native:cache[code][index];
   if(typeof translated==="string"&&translated)el.textContent=translated;
  });
  root.lang=code;
  root.dir=rtl.has(code)?"rtl":"ltr";
  document.documentElement.lang=code;
  document.documentElement.dir=root.dir;
  selector.value=code;
  selector.setAttribute("aria-label",code==="ar"?"اختر لغة الموقع":"Choose website language");
  if(menu)menu.setAttribute("aria-label",code==="ar"?"افتح قائمة التنقل":"Open navigation");
  if(nav)nav.setAttribute("aria-label",code==="ar"?"التنقل الرئيسي":"Main navigation");
  current=code;save(code);
  return true;
 }
 async function change(code){
  if(!supported.has(code))return;
  const id=++sequence;
  message.hidden=true;
  if(code==="ar"||code==="en"){apply(code);return;}
  selector.disabled=true;
  selector.setAttribute("aria-busy","true");
  try{
   await loadLocale(code);
   if(id!==sequence)return;
   if(nodes.length!==135)throw Error("Homepage text catalog changed; translation alignment not verified");
   apply(code);
  }catch{
   if(id===sequence){
    selector.value=current;
    message.textContent=current==="ar"?arLabel:enLabel;
    message.hidden=false;
   }
  }finally{
   if(id===sequence){selector.disabled=false;selector.removeAttribute("aria-busy");}
  }
 }
 selector.addEventListener("change",()=>change(selector.value));
 const saved=getSaved();
 if(supported.has(saved)&&saved!=="ar")change(saved);
 else apply("ar");
}
window.NABD_NEO_I18N=Object.freeze({init,supported:[...supported]});
})();