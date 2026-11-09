/* Static shell cache only: never cache Supabase auth, messages or private records. */
const VERSION='moh-ai-twin-shell-v2';
const SHELL=['./index.html','./style.css?v=2','./app.js?v=2','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('moh-ai-twin-shell-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  if(!/\/mohammed-ai-twin\/(?:index\.html|style\.css|app\.js|manifest\.webmanifest|icon\.svg)(?:\?|$)/.test(new URL(req.url).pathname+new URL(req.url).search))return;
  event.respondWith(fetch(req).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(VERSION).then(c=>c.put(req,copy)).catch(()=>{});}
    return response;
  }).catch(()=>caches.match(req).then(cached=>cached||Response.error())));
});