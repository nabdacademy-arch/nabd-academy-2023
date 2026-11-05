/**
 * NABD ATLAS 3D experience. UI, keyboard, fallback and guided cardiac tour.
 * Heavy WebGL module loads only when learner opens the studio.
 */
import {createHeartSimulation} from "./heart-simulator.mjs";
const T={
 ar:{
  open:"ادخل مختبر القلب ثلاثي الأبعاد",kicker:"NABD ATLAS · SIGNATURE EXPERIENCE",title:"مختبر القلب 3D",
  subtitle:"أمسك القلب، دوّره، قرّب حجراته، وراقب جزيئات الدم تتحرك بين المسارات.",
  loading:"جاري تجهيز المشهد ثلاثي الأبعاد…",notSupported:"المتصفح لا يدعم WebGL حاليًا. يمكنك استخدام المحاكاة التعليمية البديلة.",
  paused:"الحركة متوقفة",playing:"المحاكاة تعمل",hint:"حرّك إصبعك لتدوير القلب · استخدم + و − للتقريب",
  both:"الدورة الكاملة",blue:"إلى الرئتين",red:"إلى الجسم",
  play:"تشغيل الدم",pause:"إيقاف الدم",orbit:"دوران تلقائي",stopOrbit:"إيقاف الدوران",
  zoomIn:"تقريب",zoomOut:"إبعاد",reset:"إعادة ضبط",fullscreen:"ملء الشاشة",close:"إغلاق",parts:"تعلّم أجزاء القلب",
  tour:"رحلة الدم خطوة بخطوة",next:"الخطوة التالية",prev:"السابق",step:"مرحلة",of:"من",
  defaultPart:"اختر حجرة من الأزرار لتتعرف على دورها في الدورة الدموية.",
  labels:{ra:"الأذين الأيمن",rv:"البطين الأيمن",la:"الأذين الأيسر",lv:"البطين الأيسر"},
  info:{
   ra:"يستقبل الدم الأقل أكسجة من الدوران الجهازي عبر الوريدين الأجوفين.",
   rv:"يضخ الدم إلى الرئتين عبر الشريان الرئوي لتبادل الغازات.",
   la:"يستقبل الدم الأغنى بالأكسجين من الرئتين عبر الأوردة الرئوية.",
   lv:"يضخ الدم الأغنى بالأكسجين إلى الجسم عبر الأبهر."
  },
  steps:[
   ["الوريدان الأجوفان","الدم العائد من الجسم يدخل الأذين الأيمن.","blue","ra"],
   ["الأذين الأيمن","ينتقل الدم عبر الصمام ثلاثي الشرفات إلى البطين الأيمن.","blue","ra"],
   ["البطين الأيمن","يدفع الدم عبر الصمام الرئوي إلى الشريان الرئوي.","blue","rv"],
   ["الرئتان","تبادل الغازات في الشعيرات الرئوية يرفع أكسجة الدم.","blue","none"],
   ["الأذين الأيسر","يعود الدم عبر الأوردة الرئوية إلى الأذين الأيسر.","red","la"],
   ["البطين الأيسر","ينتقل الدم عبر الصمام التاجي إلى البطين الأيسر.","red","lv"],
   ["الشريان الأبهر","يخرج الدم عبر الصمام الأبهري إلى جميع أنسجة الجسم.","red","none"]
  ],
  caveat:"رسم مولّد برمجيًا بهندسة ثلاثية الأبعاد حقيقية وحركة تعليمية. أشكال الأعضاء والمسارات مبسطة وغير مقيّسة سريريًا؛ لا تصلح للتشخيص أو لتعلّم إجراءات طبية."
 },
 en:{
  open:"Enter the interactive 3D heart lab",kicker:"NABD ATLAS · SIGNATURE EXPERIENCE",title:"The Heart Lab 3D",
  subtitle:"Grab, rotate and zoom the heart. Follow blood particles through the pulmonary and systemic routes.",
  loading:"Preparing the 3D scene…",notSupported:"WebGL is unavailable on this device. You can use the accessible fallback simulation.",
  paused:"Movement paused",playing:"Blood simulation running",hint:"Drag to orbit · use + / − to zoom",
  both:"Full circulation",blue:"To the lungs",red:"To the body",
  play:"Play blood",pause:"Pause blood",orbit:"Auto orbit",stopOrbit:"Stop orbit",
  zoomIn:"Zoom in",zoomOut:"Zoom out",reset:"Reset view",fullscreen:"Full screen",close:"Close",parts:"Explore chambers",
  tour:"Follow the blood, step by step",next:"Next step",prev:"Previous",step:"Step",of:"of",
  defaultPart:"Choose a chamber to learn its role in circulation.",
  labels:{ra:"Right atrium",rv:"Right ventricle",la:"Left atrium",lv:"Left ventricle"},
  info:{
   ra:"Receives relatively deoxygenated blood from the body via the venae cavae.",
   rv:"Pumps blood into the pulmonary artery towards the lungs for gas exchange.",
   la:"Receives oxygen-rich blood from the pulmonary veins.",
   lv:"Pumps oxygen-rich blood to the body through the aorta."
  },
  steps:[
   ["Venae cavae","Blood returning from the body enters the right atrium.","blue","ra"],
   ["Right atrium","Blood passes through the tricuspid valve into the right ventricle.","blue","ra"],
   ["Right ventricle","Blood leaves through the pulmonary valve and enters the pulmonary artery.","blue","rv"],
   ["Lungs","Gas exchange at pulmonary capillaries oxygenates the blood.","blue","none"],
   ["Left atrium","Blood returns through pulmonary veins into the left atrium.","red","la"],
   ["Left ventricle","Blood crosses the mitral valve to the left ventricle.","red","lv"],
   ["Aorta","Blood leaves through the aortic valve to perfuse the body.","red","none"]
  ],
  caveat:"This is genuine depth-rendered procedural 3D geometry with educational motion. Organ shapes and pathways are simplified and not clinically scaled; never use for diagnosis or procedural training."
 }
};
const elt=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=value;return x;};
const control=(text,action,cls="")=>{
 const b=elt("button",cls,text);b.type="button";b.dataset.atlasAction=action;return b;
};
export function createHeartStudio(language="ar"){
 const t=T[language==="en"?"en":"ar"],ar=language!=="en";
 const outer=elt("details","nabd-signature-lab");
 outer.dataset.atlas3d="ready";
 const summary=elt("summary","nabd-signature-launch");
 const mark=elt("span","nabd-signature-mark","✦ 3D");
 const teaser=elt("span","nabd-signature-teaser");
 teaser.append(elt("strong","",t.open),elt("small","",t.kicker));
 const icon=elt("span","nabd-signature-arrow","↗");
 summary.append(mark,teaser,icon);
 outer.append(summary);
 const area=elt("div","nabd-signature-body");
 area.append(elt("div","nabd-signature-kicker","✦ "+t.kicker));
 area.append(elt("h3","nabd-signature-title",t.title),elt("p","nabd-signature-subtitle",t.subtitle));
 const stage=elt("section","nabd-signature-stage");
 stage.setAttribute("aria-label",t.title);
 const canvas=elt("canvas","nabd-signature-canvas");
 canvas.setAttribute("aria-label",ar?"قلب ثلاثي الأبعاد: اسحب لتدويره، الأسهم لتغيير اتجاهه":"Interactive 3D heart: drag to rotate, arrow keys to navigate");
 const overlay=elt("div","nabd-signature-hud");
 overlay.append(elt("span","nabd-hud-pill","● WEBGL · REAL TIME"),elt("span","nabd-hud-led",t.paused));
 const load=elt("div","nabd-signature-loading",t.loading);
 const footer=elt("span","nabd-signature-hint",t.hint);
 stage.append(canvas,load,overlay,footer);
 area.append(stage);
 const panels=elt("div","nabd-signature-panels");
 const actions=elt("section","nabd-signature-controls");
 const routePanel=elt("div","nabd-signature-routes");
 for(const [n,label] of [["both",t.both],["blue",t.blue],["red",t.red]]){
  const b=control(label,"route-"+n,"nabd-signature-route");
  b.setAttribute("aria-pressed",String(n==="both"));routePanel.append(b);
 }
 const buttons=elt("div","nabd-signature-toolbar");
 const play=control("▶ "+t.play,"play","nabd-signature-primary");
 play.setAttribute("aria-pressed","false");
 buttons.append(play,control("↻ "+t.orbit,"orbit"),control("＋","zoom-in"),control("−","zoom-out"),control("⟲ "+t.reset,"reset"),control("⛶ "+t.fullscreen,"fullscreen"));
 for(const b of buttons.children)if(b.dataset.atlasAction==="zoom-in"||b.dataset.atlasAction==="zoom-out")b.setAttribute("aria-label",b.dataset.atlasAction==="zoom-in"?t.zoomIn:t.zoomOut);
 actions.append(routePanel,buttons);
 const parts=elt("div","nabd-signature-parts");
 parts.append(elt("h4","",t.parts));
 const partButtons=elt("div","nabd-chamber-pills");
 for(const [name,label] of Object.entries(t.labels)){
  const b=control(label,"focus-"+name,"nabd-chamber-pill");b.setAttribute("aria-pressed","false");partButtons.append(b);
 }
 const partDescription=elt("p","nabd-chamber-explanation",t.defaultPart);
 parts.append(partButtons,partDescription);
 panels.append(actions,parts);
 area.append(panels);
 const tour=elt("section","nabd-signature-tour");
 tour.append(elt("h4","",t.tour));
 const top=elt("div","nabd-tour-top");
 const count=elt("small","nabd-tour-count");
 const name=elt("h5","nabd-tour-name");
 const expl=elt("p","nabd-tour-explanation");
 top.append(count,name,expl);
 const stepper=elt("div","nabd-tour-steps");
 const back=control("← "+t.prev,"previous-step"),next=control(t.next+" →","next-step");
 stepper.append(back,next);
 tour.append(top,stepper);area.append(tour);
 area.append(elt("p","nabd-signature-disclaimer",t.caveat));
 outer.append(area);
 let engine=null,loading=false,step=0,active=true;
 function sync(){
  if(!engine)return;
  const s=engine.state;
  play.textContent=s.playing?"⏸ "+t.pause:"▶ "+t.play;
  play.setAttribute("aria-pressed",String(s.playing));
  overlay.querySelector(".nabd-hud-led").textContent=s.playing?t.playing:t.paused;
  const orbit=buttons.querySelector('[data-atlas-action="orbit"]');
  orbit.textContent=(s.autoRotate?"◉ "+t.stopOrbit:"↻ "+t.orbit);
  orbit.setAttribute("aria-pressed",String(s.autoRotate));
  for(const b of routePanel.children)b.setAttribute("aria-pressed",String(b.dataset.atlasAction==="route-"+s.route));
  for(const b of partButtons.children)b.setAttribute("aria-pressed",String(b.dataset.atlasAction==="focus-"+s.focus));
 }
 function showStep(){
  const [stepTitle,desc,route,part]=t.steps[step];
  count.textContent=t.step+" "+(step+1)+" "+t.of+" "+t.steps.length;
  name.textContent=stepTitle;expl.textContent=desc;
  back.disabled=step===0;
  next.textContent=step===t.steps.length-1?(ar?"ابدأ من جديد ↺":"Restart ↺"):t.next+" →";
  if(engine){engine.setRoute(route);engine.setFocus(part);sync();}
 }
 async function initialize(){
  if(engine||loading)return;loading=true;load.hidden=false;
  try{
   const {createHeartWebGL}=await import("./heart-webgl.mjs");
   if(!outer.isConnected)return;
   const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false;
   engine=createHeartWebGL(canvas,{reducedMotion:reduced});
   if(!engine)throw Error("WebGL unavailable");
   stage.dataset.renderer="webgl";
   load.hidden=true;engine.play(!reduced);engine.resume();sync();showStep();
  }catch{
   stage.dataset.renderer="fallback";canvas.hidden=true;overlay.hidden=true;footer.hidden=true;
   load.textContent=t.notSupported;
   const fallback=createHeartSimulation(language);
   fallback.open=true;stage.append(fallback);
  }finally{loading=false;}
 }
 function onClick(event){
  const btn=event.target.closest?.("[data-atlas-action]");
  if(!btn||!(area.contains(btn)||fullWrap.contains(btn)))return;
  const action=btn.dataset.atlasAction;
  if(!engine)return;
  if(action==="play")engine.play(!engine.state.playing);
  else if(action==="orbit")engine.spin(!engine.state.autoRotate);
  else if(action==="zoom-in")engine.zoomBy(-.45);
  else if(action==="zoom-out")engine.zoomBy(.45);
  else if(action==="reset"){engine.reset();partDescription.textContent=t.defaultPart;step=0;showStep();}
  else if(action.startsWith("route-"))engine.setRoute(action.slice(6));
  else if(action.startsWith("focus-")){
   const part=action.slice(6);engine.setFocus(part);
   partDescription.textContent=t.info[part]||t.defaultPart;
  }
  else if(action==="next-step"){step=(step+1)%t.steps.length;showStep();partDescription.textContent=t.defaultPart;}
  else if(action==="previous-step"){step=Math.max(0,step-1);showStep();partDescription.textContent=t.defaultPart;}
  else if(action==="fullscreen")openFullScreen();
  sync();
 }
 area.addEventListener("click",onClick);
 const fullDialog=elt("dialog","nabd-signature-dialog");
 const fullWrap=elt("div","nabd-signature-dialog-wrap");
 const dialogClose=control("✕ "+t.close,"close-dialog","nabd-signature-dialog-close");
 fullWrap.append(dialogClose);
 fullDialog.append(fullWrap);
 fullWrap.addEventListener("click",onClick);
 dialogClose.addEventListener("click",()=>fullDialog.close());
 fullDialog.addEventListener("click",event=>{if(event.target===fullDialog)fullDialog.close();});
 function openFullScreen(){
  if(!engine)return;
  if(!fullDialog.isConnected)document.body.append(fullDialog);
  fullWrap.append(stage,panels);
  fullDialog.showModal();
  engine.resume();
  dialogClose.focus();
 }
 function closeFullScreen(){
  if(!active||!outer.isConnected){fullDialog.remove();return;}
  // Restore the original scene → controls → tour order after closing the dialog.
  area.insertBefore(stage,tour);
  area.insertBefore(panels,tour);
  fullDialog.remove();
  engine?.resume();
  const b=buttons.querySelector('[data-atlas-action="fullscreen"]');b?.focus();
 }
 fullDialog.addEventListener("close",closeFullScreen);
 function unmount(){
  active=false;
  if(fullDialog.open)fullDialog.close();
  fullDialog.remove();
  engine?.destroy();engine=null;
  window.removeEventListener("hashchange",onHash);
  window.removeEventListener("pagehide",unmount);
 }
 const originRoute=location.hash.split("/")[0];
 function onHash(){if(location.hash.split("/")[0]!==originRoute)unmount();}
 window.addEventListener("hashchange",onHash);
 window.addEventListener("pagehide",unmount,{once:true});
 outer.nabdDispose=unmount;
 outer.addEventListener("toggle",()=>{
  if(outer.open){if(!engine)initialize();else engine.resume();}
  else engine?.pause();
 });
 showStep();
 return outer;
}
