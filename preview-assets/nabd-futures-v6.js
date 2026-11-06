/* NABD Medical Futures V6 — interaction, bilingual RTL/LTR, dark/light, graceful 3D */
(()=>{"use strict";
const root=document.documentElement;
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const langBtn=$("#languageToggle"),themeBtn=$("#themeToggle"),menuBtn=$("#mobileMenu"),nav=$("#navigation");
const portals={
 student:{number:"01",url:"portal.html",ar:{name:"عالم الطالب",description:"بوابة الطالب هي نقطة انطلاقك إلى المقررات والمواد والأنشطة التعليمية، بحسب ما هو متاح داخل حسابك."},en:{name:"Student Learning Portal",description:"Explore enrolled courses, learning resources and activities in the dedicated student experience."}},
 lecturer:{number:"02",url:"lecturers.html",ar:{name:"مساحة المحاضرين",description:"بوابة أكاديمية لدعم المحاضرين والمساهمات التعليمية وتنظيم أنشطة التعلم."},en:{name:"The Educator Portal",description:"The dedicated environment for lecturers and educational contributors to NABD's learning experience."}},
 admin:{number:"03",url:"admin.html",ar:{name:"إدارة أكاديمية نبض",description:"بوابة مخصصة لفريق الإدارة وأصحاب الصلاحيات؛ للوصول إلى الأدوات التنظيمية والأكاديمية."},en:{name:"Academy Administration",description:"Restricted entry point for authorized administrative and academic team members."}},
 knowledge:{number:"04",url:"nabd-medical-knowledge.html",ar:{name:"مركز المعرفة الطبية",description:"اكتشف المواضيع الطبية والمراجع والموارد الأكاديمية المتاحة داخل منظومة نبض."},en:{name:"Medical Knowledge Hub",description:"Explore medical subject areas, learning resources and knowledge pathways across the academy."}},
 atlas:{number:"05",url:"atlas/clinical-hub.html",ar:{name:"منظومة NABD ATLAS",description:"حالات سريرية تعليمية ومحاكاة وموارد تفاعلية تساعد على التفكير الطبي؛ ولا تحل محل التدريب السريري المباشر."},en:{name:"NABD ATLAS",description:"Educational clinical cases and simulations supporting medical reasoning, not replacing supervised clinical training."}},
 international:{number:"06",url:"global-lectures.html",ar:{name:"المبادرة الطبية الدولية",description:"نتواصل مع محاضرين وجهات تعليمية من أنحاء العالم؛ البرنامج في مرحلة الإعداد ولا توجد شراكات مؤكدة معلنة."},en:{name:"Global Medical Lectures",description:"Outreach is underway to volunteer clinicians and educators; no collaborations or lecture sessions are confirmed yet."}}
};
let activePortal="student",activeFilter="all";
const code=()=>root.lang==="en"?"en":"ar";
const getStore=(k,d)=>{try{return localStorage.getItem(k)||d}catch(_){return d}};
const setStore=(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}};
function renderPortal(){
 const x=portals[activePortal],l=x[code()];
 $("#gatewayTitle").textContent=l.name;
 $("#gatewayDescription").textContent=l.description;
 $("#gatewayCounter").textContent=x.number+" / 06";
 $("#gatewayLink").href=x.url;
 $$(".gateway-option").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.portal===activePortal)));
}
function renderCourses(){
 const text=$("#courseSearch").value.trim().toLocaleLowerCase(),matches=[];
 $$(".course").forEach(c=>{
  const name=(c.dataset.search+" "+c.textContent).toLocaleLowerCase();
  const show=(activeFilter==="all"||c.dataset.group===activeFilter)&&(!text||name.includes(text));
  c.hidden=!show;if(show)matches.push(c);
 });
 $("#courseEmpty").classList.toggle("show",matches.length===0);
 $$(".filter").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.filter===activeFilter)));
}
function applyLanguage(v){
 const lang=v==="en"?"en":"ar";
 root.lang=lang;root.dir=lang==="ar"?"rtl":"ltr";
 $$("[data-ar][data-en]").forEach(el=>{el.textContent=el.getAttribute("data-"+lang)});
 langBtn.textContent=lang==="ar"?"EN":"عربي";
 langBtn.setAttribute("aria-label",lang==="ar"?"Switch to English":"التبديل إلى العربية");
 $("#courseSearch").placeholder=lang==="ar"?"ابحث عن مادة أو تخصص…":"Search for a subject…";
 document.title=lang==="ar"?"أكاديمية نبض للعلوم الطبية | معاينة التصميم المستقبلي":"NABD Academy for Medical Sciences | Medical Futures Preview";
 setStore("nabd-v6-lang",lang);renderPortal();renderCourses();
}
function applyTheme(v){
 const theme=v==="light"?"light":"dark";
 root.dataset.theme=theme;
 themeBtn.setAttribute("aria-label",theme==="dark"?"Switch to light mode":"التحويل إلى الوضع الليلي");
 themeBtn.setAttribute("title",theme==="dark"?"Light mode":"Dark mode");
 themeBtn.innerHTML=theme==="dark"
 ?'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
 :'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.5 15.8A8.7 8.7 0 0 1 8.2 3.5a8.8 8.8 0 1 0 12.3 12.3Z"/></svg>';
 setStore("nabd-v6-theme",theme);
}
$$(".gateway-option").forEach(b=>b.addEventListener("click",()=>{activePortal=b.dataset.portal;renderPortal();}));
$$(".filter").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;renderCourses();}));
$("#courseSearch").addEventListener("input",renderCourses);
langBtn.addEventListener("click",()=>applyLanguage(code()==="ar"?"en":"ar"));
themeBtn.addEventListener("click",()=>applyTheme(root.dataset.theme==="dark"?"light":"dark"));
menuBtn.addEventListener("click",()=>{
 const open=menuBtn.getAttribute("aria-expanded")!=="true";
 menuBtn.setAttribute("aria-expanded",String(open));nav.classList.toggle("open",open);
 menuBtn.textContent=open?"✕":"☰";
 menuBtn.setAttribute("aria-label",open?"Close navigation":"Open navigation");
});
$$(".nav a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menuBtn.textContent="☰";menuBtn.setAttribute("aria-expanded","false")}));
$("#copyrightYear").textContent=String(new Date().getFullYear());
applyLanguage(getStore("nabd-v6-lang","ar"));applyTheme(getStore("nabd-v6-theme","dark"));
// WebGL is optional, loaded only near the Atlas section with a small device-independent procedural DNA model.
// A self-contained SVG remains visible in the markup if JavaScript, WebGL, or the external module is blocked.
let render3D=null;const mount=$("#atlas3d");
const reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reducedData=!!(navigator.connection&&navigator.connection.saveData);
async function createDNA(){
 if(!mount||reduceMotion||reducedData||!window.WebGLRenderingContext)return;
 let THREE;
 try{THREE=await import("https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js")}catch(_){return}
 if(!mount.isConnected)return;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"})}catch(_){return}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(34,1,0.1,100);
 camera.position.set(0,0,12.5);
 const light=new THREE.DirectionalLight(0xe9ffff,2);light.position.set(2,4,7);scene.add(light);
 const fill=new THREE.PointLight(0x28d7e5,26,25);fill.position.set(-4,-2,5);scene.add(fill);
 scene.add(new THREE.AmbientLight(0x9ac9d9,1.1));
 const helix=new THREE.Group();scene.add(helix);
 const matA=new THREE.MeshPhysicalMaterial({color:0x39dbe8,metalness:.24,roughness:.14,transparent:true,opacity:.88,clearcoat:1});
 const matB=new THREE.MeshPhysicalMaterial({color:0xc7d3df,metalness:.25,roughness:.22,transparent:true,opacity:.83,clearcoat:1});
 const barMat=new THREE.MeshStandardMaterial({color:0x0a6f78,metalness:.35,roughness:.25,transparent:true,opacity:.9});
 const sphere=new THREE.SphereGeometry(.145,10,8);
 const pA=[],pB=[];
 for(let i=0;i<=50;i++){
  const t=i/50,y=(t-.5)*7.3,angle=t*Math.PI*7.4;
  const a=new THREE.Vector3(Math.cos(angle)*1.15,y,Math.sin(angle)*1.15);
  const b=new THREE.Vector3(Math.cos(angle+Math.PI)*1.15,y,Math.sin(angle+Math.PI)*1.15);
  pA.push(a);pB.push(b);
  if(i%3===0){
   for(const [p,mat] of [[a,matA],[b,matB]]){const bead=new THREE.Mesh(sphere,mat);bead.position.copy(p);helix.add(bead)}
   const direction=new THREE.Vector3().subVectors(b,a),rod=new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,direction.length(),5),barMat);
   rod.position.copy(a).add(b).multiplyScalar(.5);rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());helix.add(rod);
  }
 }
 for(const [points,mat] of [[pA,matA],[pB,matB]]){
  const curve=new THREE.CatmullRomCurve3(points),mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,150,.07,5,false),mat);helix.add(mesh);
 }
 const canvas=renderer.domElement;canvas.setAttribute("aria-hidden","true");mount.appendChild(canvas);
 let running=false,raf=0,last=0;let visible=true;
 function resize(){const w=mount.clientWidth,h=mount.clientHeight;if(w===0||h===0)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(mount);resize();
 function frame(t){if(!running)return;const dt=Math.min(.05,(t-last)/1000||.016);last=t;helix.rotation.y+=dt*.18;helix.rotation.z=.13;renderer.render(scene,camera);raf=requestAnimationFrame(frame)}
 function start(){if(!running&&visible&&!document.hidden){running=true;last=performance.now();raf=requestAnimationFrame(frame)}}
 function stop(){running=false;cancelAnimationFrame(raf)}
 const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop()},{threshold:.01});io.observe(mount);
 document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();else start()});
 render3D={stop};start();
}
if(mount&&"IntersectionObserver"in window){const once=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){once.disconnect();createDNA()}},{rootMargin:"200px"});once.observe(mount)}
})();
