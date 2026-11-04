import {clinicalCases,clinicalDepartments} from "./clinical-cases.mjs";

// NABD MEDVERSE 3D — lightweight perspective-projected geometry, zero external dependencies.
// Architectural learning environment, not an anatomically accurate hospital.
// All scenarios are fictional / clinically unreviewed; no network or patient data is used.
const $=id=>document.getElementById(id);
const dictionaries={
  ar:{
    skip:"تخطَّ إلى العالم التفاعلي",caseLibrary:"مكتبة الحالات",title:"ادخل الطب.\nواكتشف عالمه.",
    description:"مستشفى تعليمي افتراضي ثلاثي الأبعاد يمكنك تدويره واستكشاف أجنحته، ثم الانتقال مباشرة إلى الحالات السريرية في كل قسم.",
    departments:"جناحًا طبيًا",cases:"حالة افتراضية",offlineReady:"متاح دون إنترنت بعد التنزيل",
    experienceLabel:"مخطط المستشفى ثلاثي الأبعاد",campus:"مجمع نبض الطبي الافتراضي",wing:"داخل الجناح التعليمي",
    dragHint:"اسحب لتدوير المشهد · اختر جناحًا",reset:"إعادة ضبط",autoOrbit:"دوران تلقائي",
    chooseWing:"اختر الجناح",selectedWing:"الجناح المحدد",demo:"سيناريوهات تعليمية",
    enterWing:"ادخل إلى الجناح",returnCampus:"العودة للمجمع",startTraining:"ابدأ الحالات",
    allDepartments:"كل الأقسام",selectAny:"اختر أي تخصص أدناه",learningTitle:"حالات لاكتساب مهارات القرار الطبي",
    learningText:"86 خطوة تعليمية، وأسئلة تفاعلية، وتغذية راجعة لكل اختيار. النتائج محلية وغير معتمدة كشهادات.",
    exploreCases:"استكشف الحالات ←",offlineTitle:"تعلّم حتى عند انقطاع الشبكة",
    offlineText:"بعد تحميل الحزمة من صفحة أطلس، تعمل مشاهد المستشفى والحالات على الجهاز نفسه دون إنترنت.",
    prepareOffline:"جهّز الحزمة ←",safety:"محاكاة تعليمية خيالية غير مخصصة لعلاج المرضى، ولم تُراجع سريريًا للاعتماد.",
    online:"متصل",offline:"دون إنترنت",casesSuffix:"حالة تعليمية",canvasFallback:"لا يدعم جهازك العرض ثلاثي الأبعاد؛ اختر القسم من القائمة."
  },
  en:{
    skip:"Skip to interactive world",caseLibrary:"Clinical cases",title:"Enter medicine.\nExplore its universe.",
    description:"An interactive 3D educational hospital that you can rotate, explore by specialty and enter to reach fictional clinical learning cases.",
    departments:"clinical wings",cases:"fictional cases",offlineReady:"Offline after download",
    experienceLabel:"3D HOSPITAL CAMPUS",campus:"NABD virtual medical campus",wing:"Inside the learning wing",
    dragHint:"Drag to orbit · Select a wing",reset:"Reset view",autoOrbit:"Auto rotate",
    chooseWing:"SELECT A WING",selectedWing:"SELECTED WING",demo:"Educational scenarios",
    enterWing:"Enter this wing",returnCampus:"Return to campus",startTraining:"Start scenarios",
    allDepartments:"All departments",selectAny:"Choose a specialty below",learningTitle:"Clinical reasoning through fictional cases",
    learningText:"86 learning decisions, interactive questions and option-specific feedback. Local scores are not clinical qualifications.",
    exploreCases:"Explore cases ←",offlineTitle:"Learning without a network",
    offlineText:"After downloading the pack from ATLAS, the 3D scenes and clinical cases work offline on the same device.",
    prepareOffline:"Prepare offline pack ←",safety:"Fictional educational simulation only, not for treating patients or accredited assessment.",
    online:"Online",offline:"Offline",casesSuffix:"learning cases",canvasFallback:"3D drawing is unavailable on this device. Select a department from the list."
  }
};
const icons={cardiology:"♡",neurology:"◈",emergency:"✚",respiratory:"◉",endocrine:"◇",gastro:"◎",surgery:"⚕",pediatrics:"✿",obstetrics:"◌",renal:"♢",toxicology:"△",trauma:"✦",mentalhealth:"☼"};
const descriptions={
  ar:{
    cardiology:"حالات قلبية تعليمية وتقييم أولويات الطوارئ.",
    neurology:"تعرّف العلامات العصبية المهمة وتوقيت ظهور الأعراض.",
    emergency:"مهارات التقييم الأولي والتصعيد والتسليم الآمن.",
    respiratory:"تعلّم تحديد علامات الخطر في مشكلات التنفس.",
    endocrine:"تقييم أعراض اضطراب السكر وتأثيراتها العامة.",
    gastro:"التعرّف على علامات النزف الهضمي ودرجة الإلحاح.",
    surgery:"بناء قصة مرضية منظّمة وتجنب التشخيص المتسرع.",
    pediatrics:"متابعة مؤشرات الجفاف والحمى لدى الأطفال.",
    obstetrics:"مواقف تعليمية تتطلب رعاية تخصصية حساسة.",
    renal:"تفسير التغيرات الكلوية والمخبرية في السياق السريري.",
    toxicology:"مهارات الاستجابة الأولية لمادة مجهولة.",
    trauma:"تقييم الإصابات والتنبيه للعلامات العصبية والدورانية.",
    mentalhealth:"ممارسة التواصل المتعاطف وتقييم السلامة."
  },
  en:{
    cardiology:"Fictional cardiac emergencies and assessment priorities.",
    neurology:"Recognizing neurologic warning signs and symptom timing.",
    emergency:"Initial assessment, escalation and structured handover.",
    respiratory:"Learning respiratory warning signs and observations.",
    endocrine:"Exploring systemic symptoms of glucose disturbance.",
    gastro:"Recognizing possible gastrointestinal bleeding red flags.",
    surgery:"Focused history and avoiding diagnostic anchoring.",
    pediatrics:"Dehydration and fever assessment in children.",
    obstetrics:"Sensitive scenarios requiring specialist obstetric review.",
    renal:"Interpreting kidney and laboratory changes in context.",
    toxicology:"Initial safety response to unknown exposure.",
    trauma:"Recognizing neurovascular and trauma warning signs.",
    mentalhealth:"Practicing compassionate safety communication."
  }
};
const departments=clinicalDepartments.filter(item=>item.id!=="all").map((dep,i)=>({
  ...dep,
  icon:icons[dep.id]||"✚",
  count:clinicalCases.filter(c=>c.department===dep.id).length,
  x:Math.sin(2*Math.PI*i/13)*15.4,
  z:Math.cos(2*Math.PI*i/13)*12.2,
  h:2.3+(i%3)*0.32,
  code:String(i+1).padStart(2,"0")
}));
const canvas=$("hospitalCanvas"),ctx=canvas.getContext("2d",{alpha:false});
let lang="ar",selected="emergency",scene="campus",yaw=-0.52,pitch=0.55,distance=40,auto=false;
let width=720,height=520,dpr=1,hitTargets=[],lastTime=0,request=0,drag=null;
let reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const t=key=>dictionaries[lang][key]||key;
const name=dep=>dep[lang];
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const mul=(v,k)=>({x:v.x*k,y:v.y*k,z:v.z*k});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const norm=v=>mul(v,1/(Math.hypot(v.x,v.y,v.z)||1));
let camera;
function configureCamera(){
  const pivot=scene==="campus"?{x:0,y:1,z:0}:{x:0,y:1.9,z:0};
  const rad=scene==="campus"?distance:Math.min(distance,24);
  const position={
    x:pivot.x+Math.sin(yaw)*Math.cos(pitch)*rad,
    y:pivot.y+Math.sin(pitch)*rad,
    z:pivot.z+Math.cos(yaw)*Math.cos(pitch)*rad
  };
  const f=norm(sub(pivot,position)),r=norm(cross(f,{x:0,y:1,z:0})),u=norm(cross(r,f));
  camera={position,f,r,u,focal:Math.min(width*1.15,height*1.36),cx:width/2,cy:height/2+7};
}
function project(x,y,z){
  const v={x:x-camera.position.x,y:y-camera.position.y,z:z-camera.position.z};
  const depth=dot(v,camera.f);
  if(depth<=0.3)return null;
  const k=camera.focal/depth;
  return {x:camera.cx+dot(v,camera.r)*k,y:camera.cy-dot(v,camera.u)*k,depth};
}
function drawLine(a,b,color,lw=1){
  if(!a||!b)return;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
  ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.stroke();
}
function fillPolygon(points,color,outline="#54bbcf33",lw=1){
  if(points.some(p=>!p))return;
  ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
  ctx.closePath();ctx.fillStyle=color;ctx.fill();
  if(outline){ctx.strokeStyle=outline;ctx.lineWidth=lw;ctx.stroke();}
}
function addBox(faces,x,y,z,w,h,d,palette,key=null){
  const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2;
  const V=[
    [a,y,c],[b,y,c],[b,y,e],[a,y,e],
    [a,y+h,c],[b,y+h,c],[b,y+h,e],[a,y+h,e]
  ];
  const surfaces=[
    [[0,1,5,4],palette.back],
    [[2,3,7,6],palette.front],
    [[3,0,4,7],palette.left],
    [[1,2,6,5],palette.right],
    [[4,5,6,7],palette.roof]
  ];
  surfaces.forEach(([indices,color],i)=>{
    const points=indices.map(n=>project(...V[n]));
    if(points.some(p=>!p))return;
    faces.push({points,color,depth:points.reduce((s,p)=>s+p.depth,0)/4,key,face:i});
  });
}
function drawFloor(size=31){
  const gradient=ctx.createLinearGradient(0,0,0,height);
  gradient.addColorStop(0,"#0b2a3d");gradient.addColorStop(.63,"#071d2b");gradient.addColorStop(1,"#0b2836");
  ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
  // Projected planes, rather than flat image distortion, create real 3D perspective.
  fillPolygon([project(-size,0,-size),project(size,0,-size),project(size,0,size),project(-size,0,size)],"#0b3341","#2c71803b");
  for(let n=-size;n<=size;n+=3.25){
    drawLine(project(n,.012,-size),project(n,.012,size),"#3ca39e1d");
    drawLine(project(-size,.012,n),project(size,.012,n),"#3ca39e1d");
  }
}
function glow(cx,cz,r,color){
  const pts=[];for(let i=0;i<=32;i++){
    const a=i*2*Math.PI/32;
    pts.push(project(cx+Math.cos(a)*r,.025,cz+Math.sin(a)*r));
  }
  fillPolygon(pts,color,"#9bf9e644");
}
function labelPlate(text,x,y,z,active=false,code=""){
  const p=project(x,y,z);if(!p)return;
  const txt=lang==="ar"?text:text.toUpperCase();
  const font=lang==="ar"?"700 11px system-ui,Tahoma,sans-serif":"700 10px system-ui,sans-serif";
  ctx.font=font;const tw=Math.min(140,ctx.measureText(txt).width);
  const lw=Math.min(154,tw+23);
  if(p.x<-60||p.x>width+60||p.y<-40||p.y>height+40)return;
  const h=active?30:24;
  ctx.fillStyle=active?"#92f5d9":"#0d3244ef";ctx.strokeStyle=active?"#d5fff5":"#55a7ac";
  ctx.lineWidth=1;
  ctx.beginPath();
  ctx.roundRect(p.x-lw/2,p.y-h/2,lw,h,7);ctx.fill();ctx.stroke();
  ctx.fillStyle=active?"#063830":"#d6f4f6";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(txt,p.x,p.y,142);
  hitTargets.push({x:p.x,y:p.y,w:Math.max(lw,55),h:Math.max(h,33),id:code});
}
function drawCampus(){
  drawFloor();
  const faces=[];
  // A medical-campus learning model made of architectural 3D solids.
  addBox(faces,0,0,0,8.6,5.25,7.5,{back:"#10405a",front:"#195064",left:"#0b3148",right:"#123f52",roof:"#29717c"});
  addBox(faces,0,5.25,0,5.4,1.45,5.35,{back:"#134d5a",front:"#1e6672",left:"#19505d",right:"#245b65",roof:"#68b5a7"});
  // Architectural pod buildings connected to the central educational atrium.
  departments.forEach(dep=>{
    const active=dep.id===selected;
    if(active)glow(dep.x,dep.z,3.55,"#56ddc426");
    const a=active?{back:"#1a7072",front:"#287e7b",left:"#15575e",right:"#206b6d",roof:"#69d7b6"}:
      {back:"#183d53",front:"#1d5365",left:"#113548",right:"#1b4658",roof:"#357484"};
    const base=active?.12:.04;
    addBox(faces,dep.x,0,dep.z,3.7,dep.h,3.45,a,dep.id);
    const dx=dep.x/Math.hypot(dep.x,dep.z),dz=dep.z/Math.hypot(dep.x,dep.z);
    drawLine(project(dep.x-dx*1.8,.04,dep.z-dz*1.8),project(dep.x-dx*5,.04,dep.z-dz*5),active?"#79ebc8c0":"#4c919570",active?4:2);
  });
  faces.sort((a,b)=>b.depth-a.depth);
  faces.forEach(face=>fillPolygon(face.points,face.color,face.key===selected?"#87f1dc99":"#51b9c544"));
  // Roof accents and glazing strips; all coordinates belong to the same 3D scene.
  departments.forEach(dep=>{
    const pos=project(dep.x,dep.h+.055,dep.z);
    if(!pos)return;
    ctx.beginPath();ctx.arc(pos.x,pos.y,dep.id===selected?3.5:2.3,0,Math.PI*2);
    ctx.fillStyle=dep.id===selected?"#b6ffe3":"#70c5c2";ctx.fill();
  });
  labelPlate("NABD MEDICAL ATRIUM",0,7.4,0,false,"");
  // draw labels from far to near so nearby departments are unobscured
  const ordered=departments.map(dep=>({dep,p:project(dep.x,dep.h+.85,dep.z)})).filter(x=>x.p).sort((a,b)=>b.p.depth-a.p.depth);
  ordered.forEach(({dep})=>labelPlate(name(dep),dep.x,dep.h+.8,dep.z,dep.id===selected,dep.id));
}
function drawWard(){
  drawFloor(15);
  const faces=[];
  // An intentionally simplified educational room, not a clinical facility blueprint.
  addBox(faces,0,0,-8.1,17,5.5,.9,{back:"#0e3548",front:"#255366",left:"#0c283d",right:"#194256",roof:"#2b6473"});
  addBox(faces,-8.1,0,0,.7,4.7,15,{back:"#15394c",front:"#1e485d",left:"#0e293d",right:"#1b485d",roof:"#2c6678"});
  addBox(faces,8.1,0,0,.7,4.7,15,{back:"#15394c",front:"#1e485d",left:"#0e293d",right:"#1b485d",roof:"#2c6678"});
  // Examination beds, monitor consoles, medical cabinets
  [-4.5,4.5].forEach(x=>{
    addBox(faces,x,0,0,3.4,.95,5.2,{back:"#2b5565",front:"#477285",left:"#224c60",right:"#3e6c7c",roof:"#b4d8dc"});
    addBox(faces,x,.95,-1.6,2.95,.28,1.2,{back:"#c4e0e2",front:"#cce8eb",left:"#8fbbbc",right:"#9bc9ce",roof:"#f1f9f8"});
    addBox(faces,x-2.1,0,-2.2,1.2,2.1,.55,{back:"#143747",front:"#1c4552",left:"#092935",right:"#184854",roof:"#397b81"});
    addBox(faces,x-2.1,2.1,-2.2,1.4,.85,.55,{back:"#173d4f",front:"#256b76",left:"#163e4f",right:"#235767",roof:"#82cabc"});
  });
  addBox(faces,0,0,-6,3.8,1.35,1.1,{back:"#175062",front:"#23586c",left:"#1a4157",right:"#25596d",roof:"#88baae"});
  faces.sort((a,b)=>b.depth-a.depth);faces.forEach(face=>fillPolygon(face.points,face.color,"#91dcd836"));
  labelPlate(name(departments.find(d=>d.id===selected)||departments[0]),0,5.85,-7.2,true,selected);
  labelPlate("NABD · SIMULATION ROOM",0,3.35,-6,false,"");
}
function render(){
  if(!ctx)return;
  hitTargets=[];
  const grad=ctx.createLinearGradient(0,0,0,height);
  grad.addColorStop(0,"#071b2b");grad.addColorStop(1,"#0d3a46");
  ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
  configureCamera();
  if(scene==="campus")drawCampus();else drawWard();
  // Projection-based distance fog to soften the software-rendered campus.
  const vignette=ctx.createRadialGradient(width*.5,height*.45,Math.min(width,height)*.12,width*.5,height*.5,Math.max(width,height)*.84);
  vignette.addColorStop(0,"#071a2800");vignette.addColorStop(1,"#06162499");
  ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
  $("compassNeedle").style.transform="rotate("+(-yaw*180/Math.PI)+"deg)";
}
function resize(){
  if(!ctx)return;
  const rect=canvas.getBoundingClientRect();width=Math.max(240,rect.width);height=Math.max(280,rect.height);
  dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);render();
}
function setLanguage(next){
  lang=next==="en"?"en":"ar";
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  document.querySelectorAll("[data-i18n]").forEach(node=>node.textContent=t(node.dataset.i18n));
  $("toggleLanguage").textContent=lang==="ar"?"English":"العربية";
  updateSelection();updateOnline();render();
}
function setSelected(id){
  if(!departments.some(dep=>dep.id===id))return;
  selected=id;updateSelection();render();
}
function updateSelection(){
  const dep=departments.find(d=>d.id===selected)||departments[0];
  $("selectedTitle").textContent=name(dep);
  $("selectedDescription").textContent=descriptions[lang][dep.id]||"";
  $("selectedIcon").textContent=dep.icon;
  $("selectedCount").textContent=dep.count+" "+t("casesSuffix");
  const url=new URL("./clinical-hub.html",location.href);
  url.searchParams.set("department",dep.id);
  $("openCases").href=url.href;
  const list=$("wingList");list.replaceChildren();
  departments.forEach(dept=>{
    const button=document.createElement("button");button.type="button";button.className="wing-option";
    button.setAttribute("aria-pressed",String(dept.id===selected));
    const icon=document.createElement("span");icon.className="symbol";icon.textContent=dept.icon;
    const wrap=document.createElement("span");
    const title=document.createElement("strong");title.textContent=name(dept);
    const count=document.createElement("small");count.textContent=dept.count+" "+t("casesSuffix");
    wrap.append(title,count);button.append(icon,wrap);
    button.addEventListener("click",()=>setSelected(dept.id));
    list.append(button);
  });
  $("modeHeading").textContent=t(scene==="campus"?"campus":"wing");
  $("openWing").querySelector("[data-i18n]").textContent=t(scene==="campus"?"enterWing":"returnCampus");
  $("viewStatus").textContent=scene==="campus"?"CAMPUS":"WING";
}
function updateOnline(){
  $("onlineStatus").textContent=t(navigator.onLine?"online":"offline");
  $("onlineStatus").classList.toggle("is-offline",!navigator.onLine);
}
function reset(){
  yaw=-0.52;pitch=.55;distance=40;scene="campus";auto=false;
  $("toggleOrbit").setAttribute("aria-pressed","false");
  updateSelection();render();
}
function loop(now){
  request=0;
  if(!auto||document.hidden)return;
  const delta=Math.min(48,Math.max(0,now-(lastTime||now)));lastTime=now;
  yaw+=delta*.00012;render();request=requestAnimationFrame(loop);
}
function setAuto(next){
  auto=next&&!reduced;
  $("toggleOrbit").setAttribute("aria-pressed",String(auto));
  if(request){cancelAnimationFrame(request);request=0;}
  if(auto){lastTime=0;request=requestAnimationFrame(loop);}
}
function spin(delta){yaw+=delta;render();}
function zoom(delta){distance=clamp(distance+delta,22,62);render();}
$("toggleLanguage").addEventListener("click",()=>setLanguage(lang==="ar"?"en":"ar"));
$("rotateLeft").addEventListener("click",()=>spin(-.24));
$("rotateRight").addEventListener("click",()=>spin(.24));
$("zoomIn").addEventListener("click",()=>zoom(-3));
$("zoomOut").addEventListener("click",()=>zoom(3));
$("resetView").addEventListener("click",reset);
$("toggleOrbit").addEventListener("click",()=>setAuto(!auto));
$("openWing").addEventListener("click",()=>{
  scene=scene==="campus"?"ward":"campus";
  if(scene==="ward"){distance=24;pitch=.42;}else{distance=40;pitch=.55;}
  setAuto(false);updateSelection();render();
});
canvas.addEventListener("pointerdown",event=>{
  drag={x:event.clientX,y:event.clientY,total:0};
  try{canvas.setPointerCapture(event.pointerId);}catch{}
});
canvas.addEventListener("pointermove",event=>{
  if(!drag)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  drag.total+=Math.abs(dx)+Math.abs(dy);
  drag.x=event.clientX;drag.y=event.clientY;
  yaw-=dx*.008;pitch=clamp(pitch+dy*.004,.25,1.12);
  setAuto(false);render();
});
canvas.addEventListener("pointerup",event=>{
  if(!drag)return;
  const moved=drag.total;drag=null;
  if(moved>13 || scene!=="campus")return;
  const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
  const hit=hitTargets.filter(item=>item.id && Math.abs(item.x-x)<=item.w/2+8 && Math.abs(item.y-y)<=item.h/2+12)
    .sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
  if(hit)setSelected(hit.id);
});
canvas.addEventListener("pointercancel",()=>{drag=null;});
canvas.addEventListener("wheel",event=>{event.preventDefault();zoom(event.deltaY>0?3:-3);},{passive:false});
canvas.addEventListener("keydown",event=>{
  if(event.key==="ArrowLeft"){event.preventDefault();spin(-.17);}
  if(event.key==="ArrowRight"){event.preventDefault();spin(.17);}
  if(event.key==="ArrowUp"){event.preventDefault();zoom(-3);}
  if(event.key==="ArrowDown"){event.preventDefault();zoom(3);}
  if(event.key==="Escape"){event.preventDefault();reset();}
});
window.addEventListener("online",updateOnline);
window.addEventListener("offline",updateOnline);
document.addEventListener("visibilitychange",()=>{
  if(document.hidden && request){cancelAnimationFrame(request);request=0;}
  else if(!document.hidden && auto && !request){lastTime=0;request=requestAnimationFrame(loop);}
});
if("ResizeObserver" in window)new ResizeObserver(resize).observe(canvas);
else window.addEventListener("resize",resize);
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{});
if(!ctx){$("canvasFallback").hidden=false;}
const initial=new URLSearchParams(location.search).get("department");
if(initial&&departments.some(d=>d.id===initial))selected=initial;
setLanguage("ar");
resize();
