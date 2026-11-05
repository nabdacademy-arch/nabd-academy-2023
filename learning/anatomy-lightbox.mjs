/*
 * Accessible, scoped image viewer. Opens only fixed, whitelisted Commons files
 * from the anatomy catalog; never renders model-supplied HTML.
 */
import {commonsImage,commonsSource} from "./medical-visuals.mjs";
function el(tag,cls,text){
 const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;
}
export function openAnatomyLightbox(item,language="ar",opener=null){
 if(!item||typeof item.file!=="string"||item.file.length>180)return;
 const ar=language!=="en",dlg=el("dialog","nabd-anatomy-lightbox");
 dlg.setAttribute("aria-label",ar?"عارض الصورة التشريحية":"Anatomy image viewer");
 const view=el("div","nabd-lightbox-shell");
 const head=el("div","nabd-lightbox-top");
 head.append(el("h3","",item[ar?"ar":"en"]));
 const close=el("button","nabd-lightbox-close",ar?"إغلاق ✕":"Close ✕");
 close.type="button";close.setAttribute("aria-label",ar?"إغلاق الصورة":"Close image");
 head.append(close);
 const tools=el("div","nabd-lightbox-tools");
 const less=el("button","","−");
 const reset=el("button","",ar?"إعادة 100%":"Reset 100%");
 const more=el("button","","+");
 for(const btn of [less,reset,more])btn.type="button";
 const reading=el("span","nabd-lightbox-scale","100%");
 less.setAttribute("aria-label",ar?"تصغير الصورة":"Zoom out");
 more.setAttribute("aria-label",ar?"تكبير الصورة":"Zoom in");
 tools.append(less,reading,more,reset);
 const viewport=el("div","nabd-lightbox-viewport");
 const image=document.createElement("img");
 // SVG is embedded as an image: scripts in remote SVG documents cannot execute in the page.
 image.src=commonsImage(item.file,1600);image.referrerPolicy="no-referrer";
 image.alt=item.alt?.[ar?"ar":"en"]||item[ar?"ar":"en"];
 image.decoding="async";image.loading="eager";
 const error=el("p","nabd-lightbox-error",ar?"تعذّر تحميل الصورة. يمكنك فتحها من المصدر الأصلي أدناه.":"Image unavailable. You can open its source below.");
 error.hidden=true;
 image.addEventListener("error",()=>{image.hidden=true;error.hidden=false;});
 viewport.append(image,error);
 const footer=el("div","nabd-lightbox-footer");
 footer.append(el("span","",item.author+" · "+item.license+" · Wikimedia Commons"));
 const source=el("a","",ar?"المصدر والترخيص ↗":"Source and license ↗");
 source.href=commonsSource(item.file);source.target="_blank";source.rel="noopener noreferrer";footer.append(source);
 view.append(head,tools,viewport,footer);dlg.append(view);document.body.append(dlg);
 let scale=1;
 function setScale(v){
  scale=Math.max(1,Math.min(4,Math.round(v*4)/4));
  image.style.transform="scale("+scale+")";
  reading.textContent=Math.round(scale*100)+"%";
  viewport.classList.toggle("is-zoomed",scale>1);
  less.disabled=scale<=1;more.disabled=scale>=4;
 }
 more.addEventListener("click",()=>setScale(scale+.25));
 less.addEventListener("click",()=>setScale(scale-.25));
 reset.addEventListener("click",()=>setScale(1));
 viewport.addEventListener("wheel",event=>{
  if(!event.ctrlKey)return;
  event.preventDefault();setScale(scale+(event.deltaY<0?.25:-.25));
 },{passive:false});
 close.addEventListener("click",()=>dlg.close());
 dlg.addEventListener("click",event=>{if(event.target===dlg)dlg.close();});
 dlg.addEventListener("close",()=>{
  dlg.remove();
  if(opener?.isConnected)opener.focus({preventScroll:true});
 });
 setScale(1);dlg.showModal();
 return dlg;
}
