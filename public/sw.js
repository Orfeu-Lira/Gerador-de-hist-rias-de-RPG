/* Mesa PWA. Cache estritamente limitado a recursos públicos estáticos. */
const CACHE_NAME='mesa-shell-v1';
const STATIC=['/offline.html','/style.css','/app.js','/icons/mesa-192.png','/icons/mesa-512.png','/manifest.webmanifest'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(['/offline.html'])));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mesa-shell-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 const url=new URL(req.url);
 // Nunca armazenar API, configurações privadas, URLs com tokens, cookies, páginas autenticadas ou respostas pessoais.
 if(url.pathname.startsWith('/api/')||url.pathname==='/config.js'||url.search||req.headers.has('Authorization'))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).catch(()=>caches.match('/offline.html')));
  return;
 }
 if(!STATIC.includes(url.pathname))return;
 event.respondWith(fetch(req).then(response=>{
  if(response.ok&&response.type==='basic'){const clone=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(c=>c.put(req,clone)));}
  return response;
 }).catch(()=>caches.match(req)));
});
