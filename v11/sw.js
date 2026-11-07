/* NABD Human Universe V11 offline shell, strictly scoped to /v11/.
No cookies, student account URLs, personally identifiable data or API responses are cached. */
const CACHE="nabd-v11-static-v1";
const FILES=["./","./index.html","./style.css?v=1","./app.js?v=1","./manifest.webmanifest","./icon.svg"];
const ROOT=new URL("./",self.registration.scope);
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("nabd-v11-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||!url.pathname.startsWith(ROOT.pathname))return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request).catch(async()=>await caches.match("./index.html")||Response.error()));
    return;
  }
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
});
