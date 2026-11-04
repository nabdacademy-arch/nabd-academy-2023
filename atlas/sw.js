/* Scope is restricted to /atlas/; never cache student or admin pages. */
const CACHE="nabd-atlas-foundation-v5";
const FILES=["./","./index.html","./heart-lab.html","./clinical-hub.html","./hospital-3d.html","./hospital-3d.css","./hospital-3d.mjs","./styles.css","./clinical-hub.css","./app.mjs","./clinical-hub.mjs","./clinical-cases.mjs","./clinical-authoring.mjs","./cases-critical.mjs","./cases-general.mjs","./cases-specialist.mjs","./cases-injury.mjs","./clinical-engine.mjs","./scenario-data.mjs","./manifest.webmanifest","./icon.svg","./sw.js"];
self.addEventListener("install",(event)=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",(event)=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("nabd-atlas-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",(event)=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL("./",self.registration.scope).pathname))return;
  if(request.mode==="navigate"){
    // Return the requested offline page, not the main page, when navigation fails.
    event.respondWith(fetch(request).catch(async()=>await caches.match(request)||await caches.match("./index.html")));
    return;
  }
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{
    if(response.ok && response.type==="basic"){
      const clone=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,clone)));
    }
    return response;
  })));
});
self.addEventListener("message",(event)=>{if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();});