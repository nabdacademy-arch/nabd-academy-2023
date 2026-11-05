/* Only explicit PUBLIC learning assets. Never cache auth, API, account or private course responses. */
const CACHE='nabd-learning-public-v5';
const FILES=['./','./index.html','./styles.css','./visuals.css','./app.mjs','./medical-visuals.mjs','./anatomy-lightbox.mjs','./heart-studio.mjs','./heart-webgl.mjs','./heart-simulator.mjs','./tutor-format.mjs','./core.mjs','./content.mjs','./icon.svg','./manifest.webmanifest'];
const allowed=new Set(FILES.map(path=>new URL(path,self.registration.scope).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nabd-learning-public-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!allowed.has(url.pathname)||request.headers.has('authorization'))return;
 const canonical=new URL(url.pathname,url.origin).href;
 event.respondWith(fetch(request).then(response=>{if(response.ok&&response.type==='basic'){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(canonical,copy)))}return response}).catch(async()=>await caches.match(canonical)||Response.error()));
});
