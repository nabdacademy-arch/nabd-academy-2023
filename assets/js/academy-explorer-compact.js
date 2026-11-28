/* Progressive enhancement restricted to the internal academy explorer. */
(()=>{
 "use strict";
 const main=document.querySelector("main");
 if(!main||!document.getElementById("nabd-full-site-banner")||main.dataset.explorerReady)return;
 const groups=[
  ["learning","التعليم والبوابات","Learning & portals",["nabd-unified-campus","global-lectures","learning-universe","executive-recruitment","courses"]],
  ["innovation","المختبرات والابتكار","Labs & innovation",["nabd-future-2050","nsi-home","nfx-home","nabd-one-home","university-os-v22","academy-operations-v16","ncore-home-academic","human-universe-v11","v10-universe"]],
  ["research","البحث والأثر العلمي","Research & impact",["global-research-gateway","research","achievements","impact","student-impact","evidence","testimonials"]],
  ["institution","المؤسسة والفريق","Institution & team",["story","founder","team","about"]],
  ["support","التحقق والدعم","Verification & support",["verify","medical-consultations","feedback"]]
 ];
 const hero=document.getElementById("home"),hope=document.getElementById("nabd-hope-home-entry");
 if(!hero||!hope||groups.some(g=>g[3].some(id=>!document.getElementById(id))))return;
 const panel=document.createElement("div");panel.className="explorer-directory";
 const title=document.createElement("h2");title.dataset.ar="دليل الأكاديمية";title.dataset.en="Academy directory";panel.append(title);
 const subtitle=document.createElement("p");subtitle.className="explorer-intro";subtitle.dataset.ar="اختر القسم لعرض جميع خدماته وتفاصيله.";subtitle.dataset.en="Open a category to explore all its services and details.";panel.append(subtitle);
 const grid=document.createElement("div");grid.className="explorer-groups";panel.append(grid);
 for(const [key,ar,en,ids] of groups){
  const details=document.createElement("details");details.className="explorer-group";details.id="explorer-"+key;
  const summary=document.createElement("summary");
  const name=document.createElement("span");name.dataset.ar=ar;name.dataset.en=en;summary.append(name);
  const count=document.createElement("small");count.dataset.ar=ids.length+" أقسام";count.dataset.en=ids.length+" sections";summary.append(count);
  details.append(summary);
  const content=document.createElement("div");content.className="explorer-group-content";
  for(const id of ids)content.append(document.getElementById(id));
  details.append(content);grid.append(details);
 }
 hope.after(panel);
 const footerLinks=document.querySelector(".footer-links");
 if(footerLinks){const details=document.createElement("details");details.className="explorer-footer-links";const summary=document.createElement("summary");summary.dataset.ar="جميع الروابط والسياسات";summary.dataset.en="All links & policies";details.append(summary);footerLinks.before(details);details.append(footerLinks);}
 function translate(){const ar=document.documentElement.lang.toLowerCase().startsWith("ar");document.querySelectorAll(".explorer-directory [data-ar],.explorer-footer-links > summary").forEach(el=>{if(el.matches("summary")||el.parentElement?.matches(".explorer-group > summary")||el===title||el===subtitle)el.textContent=ar?el.dataset.ar:el.dataset.en;});}
 function reveal(target){if(!target)return;let parent=target.closest("details.explorer-group,details.explorer-footer-links");if(parent)parent.open=true;}
 function hashTarget(){try{return document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{return null;}}
 function onHash(){const target=hashTarget();if(target){reveal(target);requestAnimationFrame(()=>target.scrollIntoView({block:"start"}));}}
 document.addEventListener("click",event=>{const a=event.target.closest("a[href]");if(!a)return;const url=new URL(a.href,location.href);if(url.origin===location.origin&&url.pathname===location.pathname&&url.hash){try{reveal(document.getElementById(decodeURIComponent(url.hash.slice(1))));}catch{}}},true);
 window.addEventListener("hashchange",onHash);
 new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
 translate();main.dataset.explorerReady="1";document.body.classList.add("explorer-compact");
 if(new URLSearchParams(location.search).has("certificate"))reveal(document.getElementById("verify"));
 if(location.hash)onHash();
})();