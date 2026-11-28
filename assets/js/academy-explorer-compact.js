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
 const hero=document.getElementById("home");
 if(!hero||groups.some(g=>g[3].some(id=>!document.getElementById(id))))return;
 const panel=document.createElement("div");panel.className="explorer-directory";
 const title=document.createElement("h2");title.className="explorer-section-title";title.dataset.ar="أقسام الدليل";title.dataset.en="Directory sections";panel.append(title);
 const subtitle=document.createElement("p");subtitle.className="explorer-intro";subtitle.dataset.ar="اختر القسم لعرض جميع خدماته وتفاصيله.";subtitle.dataset.en="Open a category to explore all its services and details.";panel.append(subtitle);
 const grid=document.createElement("div");grid.className="explorer-groups";panel.append(grid);
 const artwork={
  learning:"M3 10 12 5l9 5-9 5-9-5Zm4 3v5c3 2 7 2 10 0v-5M21 10v7",
  innovation:"M9 3h6M10 3v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M8 15h8",
  research:"M9 3h5v6H9zM11 9v4M7 13h9M16 9a6 6 0 0 1 0 11H5M5 17h7M4 21h16",
  institution:"M3 9 12 3l9 6M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16M3 21h18",
  support:"M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3ZM8 12l3 3 5-6"
 };
 const descriptions={
 learning:["المسارات والدورات وبوابات التعلم","Pathways, courses and learning portals"],
 innovation:["المحاكاة الطبية والحرم الرقمي","Medical simulation and digital campus"],
 research:["المشاريع والمراجع والأدلة","Projects, research and evidence"],
 institution:["الرؤية والفريق وقصة الأكاديمية","Vision, team and academy story"],
 support:["الشهادات والاستشارات والملاحظات","Certificates, consultations and feedback"]
 };
 function icon(key){const ns="http://www.w3.org/2000/svg";const svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("aria-hidden","true");svg.classList.add("explorer-icon");const p=document.createElementNS(ns,"path");p.setAttribute("d",artwork[key]);svg.append(p);return svg;}

 for(const [key,ar,en,ids] of groups){
  const details=document.createElement("details");details.className="explorer-group";details.id="explorer-"+key;
  const summary=document.createElement("summary");summary.append(icon(key));
  const name=document.createElement("span");name.dataset.ar=ar;name.dataset.en=en;summary.append(name);
  const count=document.createElement("small");count.dataset.ar=ids.length+" أقسام";count.dataset.en=ids.length+" sections";summary.append(count);
  const description=document.createElement("div");description.className="explorer-description";description.dataset.ar=descriptions[key][0];description.dataset.en=descriptions[key][1];summary.append(description);
  details.append(summary);
  const content=document.createElement("div");content.className="explorer-group-content";
  for(const id of ids)content.append(document.getElementById(id));
  details.append(content);grid.append(details);
 }
 hero.after(panel);
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