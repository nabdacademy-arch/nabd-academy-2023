/* NABD INFINITY — local offline shell only; intentionally no GLB CDN, user inputs, auth or API caching. */
const NAME="nabd-infinity-v1";
const SHELL=["./","./index.html","./style.css?v=1","./app.mjs?v=1","./data.mjs","./manifest.webmanifest","../v11/art/heart-3d.svg","../v11/art/brain-3d.svg","../v11/art/lungs-3d.svg","../v11/art/renal-3d.svg","../v11/art/digestive-3d.svg","../v11/art/musculoskeletal-3d.svg"];
const ROOT=new URL("./",self.registration.scope);
const LOCAL_ART=new Set(SHELL.filter(x=>x.startsWith("../")).map(x=>new URL(x,ROOT).pathname));
self.addEventListener("install",event=>event.waitUntil(caches.open(NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("nabd-infinity-")&&k!==NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 const owned=url.pathname.startsWith(ROOT.pathname),art=LOCAL_ART.has(url.pathname);
 if(!owned&&!art)return;
 if(request.mode==="navigate"&&owned){
   event.respondWith(fetch(request).catch(()=>caches.match("./index.html").then(hit=>hit||Response.error())));return
 }
 event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
});
