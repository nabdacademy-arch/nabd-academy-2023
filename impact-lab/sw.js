/* NABD World Impact: offline access limited to this microsite. No user data cached. */
const VERSION="nabd-impact-v1-20261115";
const STATIC=["./","./index.html","./app.css?v=1","./app.js?v=1"];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(STATIC)));
 self.skipWaiting();
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("nabd-impact-")&&k!==VERSION).map(k=>caches.delete(k)))));
 self.clients.claim();
});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET"||new URL(req.url).origin!==self.location.origin)return;
 const url=new URL(req.url);
 if(!url.pathname.includes("/impact-lab/"))return;
 event.respondWith(
  fetch(req).then(response=>{
   if(response.ok&&response.type==="basic"){
    const toCache=response.clone();
    caches.open(VERSION).then(cache=>cache.put(req,toCache)).catch(()=>{});
   }
   return response;
  }).catch(()=>caches.match(req).then(cached=>cached||caches.match("./index.html")))
 );
});
