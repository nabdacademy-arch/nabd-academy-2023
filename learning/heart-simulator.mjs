/*
 * NABD original 2.5D interactive cardiac flow illustration.
 * Visual teaching schematic, not a patient scan or a true anatomical 3D reconstruction.
 * Inline SVG stays inside the first-party site. No patient data, no external libraries.
 */
const LABELS={
 ar:{open:"شاهد حركة الدم داخل القلب • منظور مجسّم",title:"محاكاة رحلة الدم 🫀",note:"رسم تعليمي تقريبي بمظهر مجسّم وحركة دم افتراضية؛ ليس نموذجًا تشريحيًا ثلاثي الأبعاد ولا تصويرًا طبيًا.",play:"شغّل الدم",pause:"أوقف الحركة",all:"كلا المسارين",blue:"دم إلى الرئتين",red:"دم إلى الجسم",left:"أدر يسارًا",right:"أدر يمينًا",ra:"أذين أيمن",rv:"بطين أيمن",la:"أذين أيسر",lv:"بطين أيسر",body:"الجسم",lungs:"الرئتان",low:"أقل أكسجة",rich:"أغنى بالأكسجين",path:"الجسم ← الأذين الأيمن ← البطين الأيمن ← الرئتان ← الأذين الأيسر ← البطين الأيسر ← الجسم.",tilt:"تغيير الزاوية يضيف عمقًا بصريًا فقط، ولا يعرض البنية الخلفية الحقيقية للقلب."},
 en:{open:"Watch blood flow • depth-style view",title:"The blood-flow journey 🫀",note:"Original simplified 2.5D teaching simulation with illustrative blood particles. Not true 3D anatomy or a medical scan.",play:"Play blood flow",pause:"Pause flow",all:"Both paths",blue:"Blood to lungs",red:"Blood to body",left:"Tilt left",right:"Tilt right",ra:"Right atrium",rv:"Right ventricle",la:"Left atrium",lv:"Left ventricle",body:"Body",lungs:"Lungs",low:"Less oxygenated",rich:"Oxygen-rich",path:"Body → right atrium → right ventricle → lungs → left atrium → left ventricle → body.",tilt:"Tilting adds visual depth only; it does not reveal a true posterior heart surface."}
};
function el(tag,cls,txt){
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(txt!==undefined)node.textContent=txt;
 return node;
}

const HEART_MARKUP="<svg class=\"nabd-heart-svg\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 740 450\" role=\"img\" aria-label=\"Blood-flow schematic\"><defs>\n<linearGradient id=\"nabd-heart-bg\" x2=\".8\" y2=\"1\"><stop stop-color=\"#173d5b\"/><stop offset=\"1\" stop-color=\"#07182d\"/></linearGradient>\n<linearGradient id=\"nabd-heart-muscle\" x2=\"1\" y2=\"1\"><stop stop-color=\"#e4769b\"/><stop offset=\".6\" stop-color=\"#b63a7f\"/><stop offset=\"1\" stop-color=\"#60234d\"/></linearGradient>\n<radialGradient id=\"nabd-heart-venous\"><stop stop-color=\"#80dfff\"/><stop offset=\"1\" stop-color=\"#1a6ba9\"/></radialGradient>\n<radialGradient id=\"nabd-heart-arterial\"><stop stop-color=\"#ffd0be\"/><stop offset=\"1\" stop-color=\"#ce3762\"/></radialGradient>\n<filter id=\"nabd-heart-depth\"><feGaussianBlur stdDeviation=\"7\"/></filter></defs>\n<rect width=\"740\" height=\"450\" rx=\"28\" fill=\"url(#nabd-heart-bg)\"/>\n<g opacity=\".14\" stroke=\"#8ededd\"><path d=\"M0 90H740M0 180H740M0 270H740M0 360H740M100 0V450M200 0V450M300 0V450M400 0V450M500 0V450M600 0V450\"/></g>\n<path d=\"M366 390 C292 362 248 309 251 248 C253 177 281 137 326 145 C355 150 375 170 384 190 C420 130 483 142 506 183 C554 270 499 354 399 397Z\" transform=\"translate(10 12)\" fill=\"#000e24\" opacity=\".65\" filter=\"url(#nabd-heart-depth)\"/>\n<path d=\"M366 390 C292 362 248 309 251 248 C253 177 281 137 326 145 C355 150 375 170 384 190 C420 130 483 142 506 183 C554 270 499 354 399 397Z\" fill=\"url(#nabd-heart-muscle)\" stroke=\"#f6b5bf\" stroke-width=\"3\"/>\n<path d=\"M385 181 C365 226 379 314 384 371\" stroke=\"#f3cad2\" stroke-width=\"12\" opacity=\".55\" stroke-linecap=\"round\" fill=\"none\"/>\n<ellipse cx=\"319\" cy=\"207\" rx=\"43\" ry=\"51\" fill=\"url(#nabd-heart-venous)\" stroke=\"#91eaff\" stroke-width=\"2.5\"/>\n<path d=\"M315 254 C273 279 291 340 356 352 C373 314 351 273 336 251Z\" fill=\"url(#nabd-heart-venous)\" stroke=\"#91eaff\" stroke-width=\"2.5\"/>\n<ellipse cx=\"447\" cy=\"211\" rx=\"42\" ry=\"51\" fill=\"url(#nabd-heart-arterial)\" stroke=\"#ffd5ca\" stroke-width=\"2.5\"/>\n<path d=\"M432 257 C403 270 401 345 446 375 C489 343 498 269 468 249Z\" fill=\"url(#nabd-heart-arterial)\" stroke=\"#ffd5ca\" stroke-width=\"2.5\"/>\n<g fill=\"#eafaff\" font-size=\"15\" font-family=\"system-ui,sans-serif\" text-anchor=\"middle\" paint-order=\"stroke\" stroke=\"#14304e\" stroke-width=\"3\">\n<text data-chamber=\"ra\" x=\"319\" y=\"213\"></text><text data-chamber=\"rv\" x=\"327\" y=\"316\"></text>\n<text data-chamber=\"la\" x=\"447\" y=\"216\"></text><text data-chamber=\"lv\" x=\"445\" y=\"322\"></text></g>\n<g data-flow=\"blue\">\n<path id=\"nabd-heart-blue\" d=\"M116 133 C183 112 260 139 307 180 C331 208 318 240 318 257 C304 292 322 343 354 322 C431 259 522 138 621 109\" fill=\"none\" stroke=\"#58cff9\" stroke-width=\"9\" stroke-linecap=\"round\" stroke-dasharray=\"10 9\" opacity=\".87\"/>\n<g fill=\"#bbf1ff\"><circle r=\"8\"><animateMotion dur=\"5s\" begin=\"0s\" repeatCount=\"indefinite\"><mpath href=\"#nabd-heart-blue\"/></animateMotion></circle><circle r=\"7\"><animateMotion dur=\"5s\" begin=\"-1.6s\" repeatCount=\"indefinite\"><mpath href=\"#nabd-heart-blue\"/></animateMotion></circle><circle r=\"6\"><animateMotion dur=\"5s\" begin=\"-3.2s\" repeatCount=\"indefinite\"><mpath href=\"#nabd-heart-blue\"/></animateMotion></circle></g></g>\n<g data-flow=\"red\">\n<path id=\"nabd-heart-red\" d=\"M620 186 C564 179 493 162 446 193 C427 222 459 263 462 273 C480 300 463 357 445 356 C367 386 258 399 114 383\" fill=\"none\" stroke=\"#ff9b96\" stroke-width=\"9\" stroke-linecap=\"round\" stroke-dasharray=\"10 9\" opacity=\".9\"/>\n<g fill=\"#ffd1ba\"><circle r=\"8\"><animateMotion dur=\"5.5s\" begin=\"0s\" repeatCount=\"indefinite\"><mpath href=\"#nabd-heart-red\"/></animateMotion></circle><circle r=\"7\"><animateMotion dur=\"5.5s\" begin=\"-1.8s\" repeatCount=\"indefinite\"><mpath href=\"#nabd-heart-red\"/></animateMotion></circle><circle r=\"6\"><animateMotion dur=\"5.5s\" begin=\"-3.6s\" repeatCount=\"indefinite\"><mpath href=\"#nabd-heart-red\"/></animateMotion></circle></g></g>\n<rect x=\"25\" y=\"102\" width=\"130\" height=\"48\" rx=\"15\" fill=\"#153c56\" stroke=\"#50cff1\"/><text data-external=\"body\" x=\"90\" y=\"131\" fill=\"white\" font-size=\"19\" font-family=\"system-ui,sans-serif\" text-anchor=\"middle\"></text>\n<rect x=\"562\" y=\"59\" width=\"151\" height=\"54\" rx=\"15\" fill=\"#153c56\" stroke=\"#89eaca\"/><text data-external=\"lungs\" x=\"638\" y=\"93\" fill=\"white\" font-size=\"19\" font-family=\"system-ui,sans-serif\" text-anchor=\"middle\"></text>\n<g font-family=\"system-ui,sans-serif\" font-size=\"14\"><circle cx=\"36\" cy=\"427\" r=\"8\" fill=\"#58bfff\"/><text data-legend=\"blue\" x=\"54\" y=\"432\" fill=\"#c3eeff\"></text><circle cx=\"425\" cy=\"427\" r=\"8\" fill=\"#fa918a\"/><text data-legend=\"red\" x=\"445\" y=\"432\" fill=\"#ffd3c8\"></text></g>\n</svg>";

export function createHeartSimulation(language="ar"){
 const t=LABELS[language==="en"?"en":"ar"];
 const details=el("details","nabd-heart-simulation");
 const summary=el("summary","nabd-heart-summary","✦ "+t.open);
 details.append(summary);
 const content=el("div","nabd-heart-content");
 content.append(el("h4","nabd-heart-heading",t.title),el("p","nabd-heart-disclaimer",t.note));
 const scene=el("div","nabd-heart-scene");
 // SVG markup is a fixed, first-party constant; no model-supplied content goes into innerHTML.
 scene.innerHTML=HEART_MARKUP;
 const svg=scene.querySelector("svg");
 const lookups={ra:t.ra,rv:t.rv,la:t.la,lv:t.lv};
 for(const [name,txt] of Object.entries(lookups))svg.querySelector('[data-chamber="'+name+'"]').textContent=txt;
 svg.querySelector('[data-external="body"]').textContent=t.body;
 svg.querySelector('[data-external="lungs"]').textContent=t.lungs;
 svg.querySelector('[data-legend="blue"]').textContent=t.low;
 svg.querySelector('[data-legend="red"]').textContent=t.rich;
 svg.setAttribute("aria-label",t.title+": "+t.path);
 const controls=el("div","nabd-heart-controls");
 const make=(label,cls)=>{const b=el("button",cls,label);b.type="button";return b;};
 const play=make("▶ "+t.play,"nabd-heart-toggle");
 const both=make(t.all,"nabd-heart-route");
 const blue=make(t.blue,"nabd-heart-route");
 const red=make(t.red,"nabd-heart-route");
 const left=make("↶ "+t.left,"nabd-heart-tilt");
 const right=make(t.right+" ↷","nabd-heart-tilt");
 controls.append(play,both,blue,red,left,right);
 let playing=false,angle=0;
 const reduce=typeof window!=="undefined"&&Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
 function toggle(active){
   playing=active;
   play.setAttribute("aria-pressed",String(active));
   play.textContent=active?"⏸ "+t.pause:"▶ "+t.play;
   if(typeof svg.pauseAnimations==="function"){if(active)svg.unpauseAnimations();else svg.pauseAnimations();}
 }
 function focus(name){
  scene.dataset.route=name;
  for(const [b,n] of [[both,"both"],[blue,"blue"],[red,"red"]]){
   b.classList.toggle("is-selected",n===name);b.setAttribute("aria-pressed",String(n===name));
  }
 }
 play.addEventListener("click",()=>toggle(!playing));
 for(const [b,n] of [[both,"both"],[blue,"blue"],[red,"red"]])b.addEventListener("click",()=>focus(n));
 left.addEventListener("click",()=>{angle=Math.max(-25,angle-12.5);scene.style.setProperty("--nabd-yaw",angle+"deg");});
 right.addEventListener("click",()=>{angle=Math.min(25,angle+12.5);scene.style.setProperty("--nabd-yaw",angle+"deg");});
 details.addEventListener("toggle",()=>toggle(details.open&&!reduce));
 focus("both");toggle(false);
 content.append(scene,controls,el("p","nabd-heart-flow-caption",t.path),el("small","nabd-heart-caveat",t.tilt));
 details.append(content);return details;
}
