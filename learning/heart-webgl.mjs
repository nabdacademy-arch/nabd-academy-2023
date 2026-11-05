/**
 * NABD ATLAS 3D — original depth-tested WebGL geometry.
 * Anatomical CONCEPT illustration only. Not a medically calibrated 3D scan.
 * No external rendering scripts, image services, or patient-data requests.
 */
const TAU=Math.PI*2,clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,s)=>a.map(x=>x*s);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>mul(a,1/Math.max(1e-8,Math.hypot(...a)));
const cubic=(a,b,c,d,t)=>a.map((x,i)=>{const u=1-t;return u*u*u*x+3*u*u*t*b[i]+3*u*t*t*c[i]+t*t*t*d[i]});
export const FLOW_PATHS={
 blue:[
 [[-1.75,1.6,-.1],[-1.1,1.55,.2],[-.8,1,.55],[-.78,.47,.55]],
 [[-.78,.47,.55],[-.85,-.10,.70],[-.79,-.67,.66],[-.61,-.89,.60]],
 [[-.61,-.89,.60],[-.10,-.66,.83],[-.25,.72,.93],[-.23,1.23,.67]],
 [[-.23,1.23,.67],[-.30,1.6,.55],[-.96,1.86,.36],[-1.78,1.78,.17]]
 ],
 red:[
 [[1.72,.87,-.14],[1.3,.82,.2],[1.05,.7,.43],[.81,.52,.52]],
 [[.81,.52,.52],[.85,-.03,.72],[.78,-.62,.73],[.66,-.84,.70]],
 [[.66,-.84,.70],[.26,-.88,.92],[.23,.19,.88],[.45,.99,.67]],
 [[.45,.99,.67],[.53,1.54,.35],[.66,1.97,.11],[1.73,1.70,-.07]]
 ]
};
export const CHAMBERS={
 ra:{center:[-.75,.48,.05],scale:[.53,.54,.46],color:[.18,.61,.91]},
 rv:{center:[-.61,-.55,.13],scale:[.63,.75,.52],color:[.17,.49,.83]},
 la:{center:[.80,.48,-.03],scale:[.49,.53,.47],color:[.96,.46,.58]},
 lv:{center:[.69,-.58,.09],scale:[.67,.85,.55],color:[.88,.28,.42]}
};
const curve=segments=>t=>{
 const s=clamp(t,0,.999999)*segments.length,i=Math.floor(s),c=segments[i];
 return cubic(...c,s-i);
};
const I=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function matrix(a,b){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let y=0;y<4;y++)for(let k=0;k<4;k++)r[c*4+y]+=a[k*4+y]*b[c*4+k];return r;}
function translation(x,y,z){const m=I();m[12]=x;m[13]=y;m[14]=z;return m;}
function yaw(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);}
function pitch(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);}
function projection(a){const f=1/Math.tan(.42),m=new Float32Array(16);m[0]=f/a;m[5]=f;m[10]=-1.005;m[11]=-1;m[14]=-.2005;return m;}
function sphere(center=[0,0,0],scale=[1,1,1],rings=16,steps=24){
 const pos=[],normal=[],ids=[];
 for(let r=0;r<=rings;r++)for(let s=0;s<=steps;s++){
  const theta=Math.PI*r/rings,phi=TAU*s/steps;
  const d=[Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)];
  const bulge=1+.045*d[1]-.055*d[0]*d[1];
  pos.push(...d.map((x,i)=>center[i]+x*scale[i]*bulge));
  normal.push(...unit(d.map((x,i)=>x/scale[i])));
 }
 for(let r=0;r<rings;r++)for(let s=0;s<steps;s++){
  const a=r*(steps+1)+s,b=a+steps+1;ids.push(a,a+1,b,b,a+1,b+1);
 }
 return {pos,normal,ids};
}
function tube(points,radius=.15,steps=36,around=12){
 const f=curve(points),pos=[],normal=[],ids=[];
 for(let k=0;k<=steps;k++){
  const t=k/steps,p=f(t),dir=unit(sub(f(clamp(t+.001,0,1)),f(clamp(t-.001,0,1))));
  const ref=Math.abs(dot(dir,[0,1,0]))>.84?[1,0,0]:[0,1,0];
  const v=unit(cross(dir,ref)),w=unit(cross(dir,v));
  for(let j=0;j<=around;j++){
   const th=TAU*j/around,n=add(mul(v,Math.cos(th)),mul(w,Math.sin(th)));
   pos.push(...add(p,mul(n,radius)));normal.push(...n);
  }
 }
 for(let i=0;i<steps;i++)for(let j=0;j<around;j++){
  const a=i*(around+1)+j,b=a+around+1;ids.push(a,a+1,b,b,a+1,b+1);
 }
 return {pos,normal,ids};
}
function compile(gl,type,src){
 const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);
 if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(sh);gl.deleteShader(sh);throw Error("GL shader "+e)}
 return sh;
}
function program(gl){
 const vert=compile(gl,gl.VERTEX_SHADER,[
 'attribute vec3 aPos;attribute vec3 aNormal;',
 'uniform mat4 uMVP;uniform mat4 uRot;uniform vec3 uOffset;uniform float uScale;',
 'varying vec3 vNormal;',
 'void main(){vec3 p=aPos*uScale+uOffset;vNormal=normalize(mat3(uRot)*aNormal);gl_Position=uMVP*vec4(p,1.0);}'
 ].join('\n'));
 const frag=compile(gl,gl.FRAGMENT_SHADER,[
 'precision mediump float;varying vec3 vNormal;',
 'uniform vec3 uColor;uniform float uOpacity;uniform float uGlow;uniform float uSelect;',
 'void main(){vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-.50,.75,1.05));',
 'float d=max(dot(n,light),0.0);float spec=pow(max(dot(reflect(-light,n),vec3(0.,0.,1.)),0.),20.);',
 'float rim=pow(1.0-max(dot(n,vec3(0.,0.,1.)),0.0),2.5);',
 'vec3 c=uColor*(.24+.75*d+uGlow)+vec3(.92,.93,1.)*.29*spec+vec3(.48,.80,1.)*.18*rim+vec3(.28,.65,.55)*uSelect;',
 'gl_FragColor=vec4(c,uOpacity);}'
 ].join('\n'));
 const prog=gl.createProgram();gl.attachShader(prog,vert);gl.attachShader(prog,frag);gl.linkProgram(prog);
 gl.deleteShader(vert);gl.deleteShader(frag);
 if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog)||"GL program failed");
 const attributes=Object.fromEntries(["aPos","aNormal"].map(x=>[x,gl.getAttribLocation(prog,x)]));
 const uniforms=Object.fromEntries(["uMVP","uRot","uOffset","uScale","uColor","uOpacity","uGlow","uSelect"].map(x=>[x,gl.getUniformLocation(prog,x)]));
 return {prog,attributes,uniforms};
}
function upload(gl,mesh){
 const buffer=(type,data)=>{const b=gl.createBuffer();gl.bindBuffer(type,b);gl.bufferData(type,data,gl.STATIC_DRAW);return b;};
 return {pos:buffer(gl.ARRAY_BUFFER,new Float32Array(mesh.pos)),normal:buffer(gl.ARRAY_BUFFER,new Float32Array(mesh.normal)),index:buffer(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(mesh.ids)),count:mesh.ids.length};
}
export function createHeartWebGL(canvas,{reducedMotion=false,onFrame=()=>{}}={}){
 if(!canvas?.getContext)return null;
 const gl=canvas.getContext("webgl",{alpha:true,antialias:true,powerPreference:"low-power",depth:true})||canvas.getContext("experimental-webgl",{alpha:true,antialias:true,depth:true});
 if(!gl)return null;
 let P,objects=[],buffers=[],dead=false,frame=0,clock=0,previous=0,visible=true;
 try{
  P=program(gl);
  const obj=(id,geometry,color,opacity=1)=>{
   const buff=upload(gl,geometry);buffers.push(buff);const entry={...buff,id,color,opacity};objects.push(entry);return entry;
  };
  obj("body",sphere([.02,-.11,-.61],[1.44,1.59,.58]),[.57,.22,.42],.19);
  for(const [id,p] of Object.entries(CHAMBERS))obj(id,sphere(p.center,p.scale),p.color);
  obj("vena",tube([[[-1.7,1.71,-.27],[-1.46,1.45,-.36],[-.99,1.22,-.22],[-.79,.74,.09]]],.19),[.16,.60,.96]);
  obj("pulmonary",tube([[[-.6,-.46,.16],[-.26,.2,.52],[-.26,1.3,.47],[-.63,1.72,.16]]],.18),[.19,.69,.99]);
  obj("aorta",tube([[[.68,-.61,-.01],[.42,.08,-.17],[.31,1.48,-.24],[.83,1.75,-.40]]],.22),[.94,.32,.48]);
  obj("vein",tube([[[1.64,.90,-.30],[1.35,.87,-.36],[1.04,.72,-.25],[.84,.52,-.19]]],.15),[.97,.51,.60]);
  const particle=upload(gl,sphere([0,0,0],[1,1,1],7,11));buffers.push(particle);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0,0,0,0);
  let angle=.35,vertical=-.12,zoom=5.5,playing=!reducedMotion,autoRotate=false,route="both",focus="none";
  const B=P.uniforms,A=P.attributes;
  function draw(mesh,c,offset=[0,0,0],scale=1,opacity=1,glow=0,highlight=0){
   gl.bindBuffer(gl.ARRAY_BUFFER,mesh.pos);gl.vertexAttribPointer(A.aPos,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(A.aPos);
   gl.bindBuffer(gl.ARRAY_BUFFER,mesh.normal);gl.vertexAttribPointer(A.aNormal,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(A.aNormal);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.index);
   gl.uniform3fv(B.uColor,c);gl.uniform3fv(B.uOffset,offset);
   gl.uniform1f(B.uScale,scale);gl.uniform1f(B.uOpacity,opacity);gl.uniform1f(B.uGlow,glow);gl.uniform1f(B.uSelect,highlight);
   gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
  }
  function dimensions(){
   const rect=canvas.getBoundingClientRect(),dpr=clamp(window.devicePixelRatio||1,1,1.75);
   const w=Math.round(Math.max(1,rect.width)*dpr),h=Math.round(Math.max(1,rect.height)*dpr);
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   gl.viewport(0,0,w,h);
  }
  function render(ts){
   frame=0;if(dead||!canvas.isConnected||!visible)return;
   dimensions();const dt=previous?Math.min(.05,(ts-previous)*.001):0;previous=ts;
   if(playing)clock+=dt;if(autoRotate)angle+=dt*.25;
   const rot=matrix(yaw(angle),pitch(vertical));
   const mvp=matrix(projection(canvas.width/canvas.height),matrix(translation(0,.05,-zoom),rot));
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(P.prog);
   gl.uniformMatrix4fv(B.uMVP,false,mvp);gl.uniformMatrix4fv(B.uRot,false,rot);
   for(const mesh of objects){
    if(mesh.id==="body")continue;
    if(route==="blue"&&["aorta","vein"].includes(mesh.id))continue;
    if(route==="red"&&["vena","pulmonary"].includes(mesh.id))continue;
    draw(mesh,mesh.color,[0,0,0],1,1,0,mesh.id===focus?.65:0);
   }
   gl.depthMask(false);const body=objects[0];draw(body,body.color,[0,0,0],1,body.opacity,.10);gl.depthMask(true);
   for(const lane of route==="both"?["blue","red"]:[route]){
    const fn=curve(FLOW_PATHS[lane]),c=lane==="blue"?[.34,.86,1]:[1,.48,.61];
    for(let n=0;n<14;n++){
     const t=(n/14+clock*(lane==="blue"?.065:.059))%1;
     draw(particle,c,fn(t),.06,1,.30);
    }
   }
   onFrame({angle,vertical,zoom,route,focus});
   if(playing||autoRotate)frame=requestAnimationFrame(render);
  }
  const start=()=>{if(!dead&&canvas.isConnected&&visible&&!frame)frame=requestAnimationFrame(render);};
  const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0;previous=0;};
  let holding=false,startX=0,startY,startAngle=0,startVertical=0;
  canvas.style.touchAction="none";canvas.tabIndex=0;
  function down(e){if(e.pointerType==="mouse"&&e.button!==0)return;holding=true;startX=e.clientX;startY=e.clientY;startAngle=angle;startVertical=vertical;canvas.setPointerCapture?.(e.pointerId);}
  function move(e){if(!holding)return;angle=startAngle+(e.clientX-startX)*.009;vertical=clamp(startVertical+(e.clientY-startY)*.007,-1,1);}
  function up(){holding=false;}
  function wheel(e){e.preventDefault();zoom=clamp(zoom+Math.sign(e.deltaY)*.3,3.2,8.6);}
  function keys(e){
   if(e.key==="ArrowLeft"){angle-=.17;e.preventDefault();}
   if(e.key==="ArrowRight"){angle+=.17;e.preventDefault();}
   if(e.key==="ArrowUp"){zoom=clamp(zoom-.3,3.2,8.6);e.preventDefault();}
   if(e.key==="ArrowDown"){zoom=clamp(zoom+.3,3.2,8.6);e.preventDefault();}
  }
  const events=[["pointerdown",down],["pointermove",move],["pointerup",up],["pointercancel",up],["wheel",wheel],["keydown",keys]];
  for(const [name,handler] of events)canvas.addEventListener(name,handler,name==="wheel"?{passive:false}:undefined);
  const io=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)start();else stop();}):null;
  io?.observe(canvas);
  const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(()=>start()):null;ro?.observe(canvas);
  const lost=e=>{e.preventDefault();stop();};canvas.addEventListener("webglcontextlost",lost);
  start();
  return {
   kind:"webgl-3d",
   get state(){return{playing,autoRotate,angle,vertical,zoom,route,focus,clock,disposed:dead};},
   play(v){playing=Boolean(v);start();},
   spin(v){autoRotate=Boolean(v);start();},
   setRoute(v){if(["both","blue","red"].includes(v)){route=v;start();}},
   setFocus(v){if(["none","ra","rv","la","lv"].includes(v)){focus=v;start();}},
   rotate(dx,dy=0){angle+=dx;vertical=clamp(vertical+dy,-1,1);start();},
   zoomBy(delta){zoom=clamp(zoom+delta,3.2,8.6);start();},
   reset(){angle=.35;vertical=-.12;zoom=5.5;route="both";focus="none";start();},
   pause(){visible=false;stop();},
   resume(){visible=true;start();},
   destroy(){
    if(dead)return;dead=true;stop();io?.disconnect();ro?.disconnect();
    for(const [name,handler] of events)canvas.removeEventListener(name,handler);
    canvas.removeEventListener("webglcontextlost",lost);
    for(const b of buffers){gl.deleteBuffer(b.pos);gl.deleteBuffer(b.normal);gl.deleteBuffer(b.index);}
    gl.deleteProgram(P.prog);
   }
  };
 }catch{
  for(const b of buffers){gl.deleteBuffer(b.pos);gl.deleteBuffer(b.normal);gl.deleteBuffer(b.index);}
  if(P)gl.deleteProgram(P.prog);
  return null;
 }
}
