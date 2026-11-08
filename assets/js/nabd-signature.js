/* NABD SIGNATURE: accessible local navigation, shared identity and optional command search. */
(function(){
 "use strict";
 var NAME_AR="أكاديمية نبض العلوم الطبية",NAME_EN="NABD Academy of Medical Sciences";
 var pages=[
  ["index.html","الرئيسية","Home"],
  ["nabd-campus.html","الحرم الرقمي الشخصي","Personal Campus"],
  ["campus.html","الحرم الخفيف","Lite Campus"],
  ["portal.html","بوابة الطالب","Student Portal"],
  ["university-os.html","المقررات والاختبارات V22","Academic OS V22"],
  ["academy.html","مسارات الأكاديمية","Pathways"],
  ["lecturers.html","استوديو المحاضر","Faculty Studio"],
  ["skill-passport.html","جواز المهارات","Skill Passport"],
  ["learning/","مكتبة التعليم","Learning Universe"],
  ["atlas/index.html","الأطلس الطبي","NABD ATLAS"],
  ["infinity/","العالم الطبي التفاعلي","NABD INFINITY"],
  ["nabd-medical-knowledge.html","المعرفة الطبية","Medical Knowledge"],
  ["global-lectures.html","المحاضرات الدولية","Global Lectures"],
  ["nabd-global-research.html","الشبكة البحثية","Research Network"],
  ["research-starter-lab.html","مختبر الباحث الناشئ","Research Starter Lab"],
  ["research-office.html","المكتب البحثي","Research Office"],
  ["nabd-partners.html","الشراكات","Partnerships"],
  ["executive-application.html","طلبات التطوع","Volunteer Applications"],
  ["application-status.html","حالة الطلب","Application Status"],
  ["admin.html","الإدارة (مصرح فقط)","Administration (restricted)"],
  ["index.html#founder","المؤسس","Founder"],
  ["index.html#verify","التحقق من الشهادات","Certificate Verification"],
  ["policies.html","الخصوصية والسياسات","Policies & Privacy"]
 ];
 function ar(){return (document.documentElement.lang||"ar").toLowerCase().startsWith("ar");}
 function route(){var p=window.location.pathname.split("/").pop();return p||"index.html";}
 function identityBar(){
  if(document.querySelector(".nfs-mini-bar"))return;
  var bar=document.createElement("div");bar.className="nfs-mini-bar";
  bar.setAttribute("role","navigation");bar.setAttribute("aria-label","NABD universal navigation");
  var inner=document.createElement("div");inner.className="nfs-mini-bar-inner";
  var brand=document.createElement("a");brand.className="nfs-mini-identity";brand.href="index.html";
  var pic=document.createElement("img");pic.src="assets/images/founder.jpg";pic.alt="";pic.loading="lazy";pic.width=34;pic.height=34;
  var text=document.createElement("span");var small=document.createElement("small");small.textContent="Mohammed Khaled Al-Arja · Founder";text.textContent=ar()?NAME_AR:NAME_EN;text.appendChild(small);
  brand.appendChild(pic);brand.appendChild(text);
  var nav=document.createElement("nav");nav.className="nfs-mini-links";nav.setAttribute("aria-label","NABD quick navigation");
  pages.slice(0,6).forEach(function(p){var link=document.createElement("a");link.href=p[0];link.dataset.ar=p[1];link.dataset.en=p[2];link.textContent=ar()?p[1]:p[2];if(route()===p[0])link.setAttribute("aria-current","page");nav.appendChild(link);});
  inner.appendChild(brand);inner.appendChild(nav);bar.appendChild(inner);
  var skip=document.querySelector("a.skip");if(skip&&skip.parentElement===document.body){document.body.insertBefore(bar,skip.nextSibling)}else{document.body.insertBefore(bar,document.body.firstChild)}
  return {brand:brand,text:text,small:small,nav:nav};
 }
 function commandPalette(){
  var overlay=document.createElement("div");overlay.className="nfs-command";overlay.hidden=true;overlay.setAttribute("role","presentation");
  overlay.innerHTML='<div class="nfs-command-box" role="dialog" aria-modal="true" aria-label="NABD quick search"><div class="nfs-command-head"><h2 id="nfs-search-title">بحث سريع في نبض</h2><button type="button" class="nfs-command-close" aria-label="إغلاق">✕</button></div><label for="nfs-command-input" class="sr-only" style="position:absolute;left:-9999px">بحث</label><input id="nfs-command-input" type="search" autocomplete="off" placeholder="ابحث عن صفحة أو بوابة..."><div class="nfs-command-results"></div><p class="nfs-command-footer">Ctrl/⌘ + K · Esc</p></div>';
  document.body.appendChild(overlay);
  var input=overlay.querySelector("input"),results=overlay.querySelector(".nfs-command-results"),title=overlay.querySelector("h2"),close=overlay.querySelector("button");
  var focusBefore=null;
  function render(){results.textContent="";var q=input.value.trim().toLowerCase();var filtered=pages.filter(function(p){return !q||p[1].toLowerCase().includes(q)||p[2].toLowerCase().includes(q)||p[0].toLowerCase().includes(q)});filtered.forEach(function(p){var a=document.createElement("a");a.href=p[0];a.textContent=ar()?p[1]:p[2];var span=document.createElement("span");span.textContent="↗";span.setAttribute("aria-hidden","true");a.appendChild(span);results.appendChild(a);});if(!filtered.length){var empty=document.createElement("p");empty.textContent=ar()?"لا توجد نتائج":"No matching pages";results.appendChild(empty)}}
  function open(){focusBefore=document.activeElement;overlay.hidden=false;title.textContent=ar()?"بحث سريع في نبض":"Search NABD";input.placeholder=ar()?"ابحث عن صفحة أو بوابة...":"Find a page or portal...";input.value="";render();input.focus();}
  function dismiss(){overlay.hidden=true;if(focusBefore&&focusBefore.focus)focusBefore.focus();}
  close.addEventListener("click",dismiss);
  overlay.addEventListener("mousedown",function(e){if(e.target===overlay)dismiss()});
  overlay.addEventListener("keydown",function(e){if(e.key==="Escape"){e.preventDefault();dismiss()}else if(e.key==="Tab"){var nodes=[input].concat(Array.from(results.querySelectorAll("a"))).concat([close]);if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes[nodes.length-1].focus()}else if(!e.shiftKey&&document.activeElement===nodes[nodes.length-1]){e.preventDefault();nodes[0].focus()}}});
  input.addEventListener("input",render);
  document.addEventListener("keydown",function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();overlay.hidden?open():dismiss()}});
  document.querySelectorAll("[data-nfs-search]").forEach(function(b){b.addEventListener("click",open)});
  return open;
 }
 function main(){
  var bar=null;
  if(!document.body.classList.contains("nfs-home"))bar=identityBar();
  var search=commandPalette();
  if(!document.querySelector("[data-nfs-search]")){
   var launcher=document.createElement("button");launcher.type="button";
   launcher.className="nfs-floating-search";launcher.setAttribute("aria-haspopup","dialog");
   launcher.textContent=ar()?"◈ دليل نبض":"◈ NABD guide";
   launcher.setAttribute("aria-label",ar()?"فتح البحث في بوابات نبض":"Search NABD portals");
   launcher.addEventListener("click",search);document.body.appendChild(launcher);
  }
  var mo=new MutationObserver(function(){if(bar){bar.text.textContent=ar()?NAME_AR:NAME_EN;bar.text.appendChild(bar.small);bar.nav.querySelectorAll("[data-ar][data-en]").forEach(function(n){n.textContent=n.getAttribute(ar()?"data-ar":"data-en")})}var button=document.querySelector(".nfs-floating-search");if(button)button.textContent=ar()?"◈ دليل نبض":"◈ NABD guide";});
  mo.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  window.NABDOpenSearch=search;
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",main);else main();
})();