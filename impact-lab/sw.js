/* NABD Impact V2 · cache only static public assets. No reports, keys or user text. */
const CACHE="nabd-impact-v2-20261115";
const FILES=["./","./index.html","./app.css?v=2","./app.js?v=1","./tech-v2-core.js?v=2","./tech-v2.js?v=2","./tech-v2.css?v=2","./manifest.webmanifest"];
const offlineResponse=()=>new Response("Offline and this resource is not cached",{status:503,headers:{"Content-Type":"text/plain;charset=UTF-8"}});
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
 self.skipWaiting();
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(k=>k.startsWith("nabd-impact-")&&k!==CACHE).map(k=>caches.delete(k))
 )));
 self.clients.claim();
});
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin||!url.pathname.includes("/impact-lab/"))return;
 // Requests for public Crossref metadata and all private document uploads are never intercepted.
 event.respondWith((async()=>{
  try{
   const response=await fetch(request);
   if(response.ok&&response.type==="basic"&&url.pathname.startsWith(new URL(self.registration.scope).pathname)){
    const clone=response.clone();
    event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,clone)).catch(()=>{}));
   }
   return response;
  }catch{
   const cached=await caches.match(request);
   if(cached)return cached;
   if(request.mode==="navigate")return await caches.match("./index.html")||offlineResponse();
   return offlineResponse();
  }
 })());
});
