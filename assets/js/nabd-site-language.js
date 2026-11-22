/* NABD Academy: shared non-clinical AR/EN preference across bilingual pages.
 * No external translation provider, no request, and no patient/user data.
 * Homepage 12-language packs are distinct: unsupported inner languages fall back to
 * the most recent Arabic or English preference without pretending to be translated.
 */
(()=>{
  "use strict";
  if(window.NABD_SITE_LANGUAGE) return;
  const CODE_SET=new Set(["ar","en"]);
  const PRIMARY_KEY="nabd_lang";
  const HOMEPAGE_KEY="nabdCompactHomeLanguage";
  let updating=false, initialized=false;
  function get(){
    try{
      const selected=localStorage.getItem(HOMEPAGE_KEY);
      if(CODE_SET.has(selected))return selected;
      const fallback=localStorage.getItem(PRIMARY_KEY);
      if(CODE_SET.has(fallback))return fallback;
    }catch(_){}
    return (document.documentElement.lang||"ar").toLowerCase().startsWith("en")?"en":"ar";
  }
  function save(lang){
    try{
      localStorage.setItem(PRIMARY_KEY,lang);
      localStorage.setItem(HOMEPAGE_KEY,lang);
    }catch(_){}
  }
  function applyText(lang){
    document.querySelectorAll("[data-ar][data-en]").forEach(node=>{
      if(node.children.length)return; // preserve inline controls, icons and links
      const translated=node.getAttribute("data-"+lang);
      if(translated!==null && node.textContent!==translated)node.textContent=translated;
    });
  }
  function apply(lang,{persist=false}={}){
    if(!CODE_SET.has(lang))return;
    updating=true;
    if(persist)save(lang);
    const root=document.documentElement;
    if(root.lang!==lang)root.lang=lang;
    const dir=lang==="ar"?"rtl":"ltr";
    if(root.dir!==dir)root.dir=dir;
    applyText(lang);
    updating=false;
    window.dispatchEvent(new CustomEvent("nabd:site-language",{detail:{language:lang}}));
  }
  window.NABD_SITE_LANGUAGE=Object.freeze({
    get,apply,choose:lang=>apply(lang,{persist:true})
  });
  function start(){
    if(initialized)return; initialized=true;
    // The compact homepage has its own twelve-language UI and translations.
    if(document.getElementById("nabdNeoHome"))return;
    const selected=get();
    apply(selected);
    // Track explicit language changes by existing page controllers (AR/EN only).
    let started=false;
    setTimeout(()=>{started=true;},250);
    const observer=new MutationObserver(mutations=>{
      if(!started||updating)return;
      if(!mutations.some(m=>m.attributeName==="lang"))return;
      const next=document.documentElement.lang;
      if(CODE_SET.has(next)){
        save(next);
        applyText(next);
      }
    });
    observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    window.addEventListener("storage",event=>{
      if(event.key===PRIMARY_KEY||event.key===HOMEPAGE_KEY)apply(get());
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
