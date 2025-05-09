// service-worker.js

const CACHE_NAME = 'claire-static-cache-v55'; // <<<< VERSION INCRÉMENTÉE

const APP_SHELL_URLS = [
    '/', '/index.html', '/style.css', '/app.js',
    '/storageUtils.js',       // Modifié
    '/consumptionView.js',
    '/journal.js',
    '/moodTracker.js',
    '/progressView.js',
    '/badges.js',
    '/sosView.js',
    '/exercisesView.js',
    '/thoughtRecordView.js',
    '/routineView.js',
    '/plannerView.js',
    '/victoriesView.js',
    '/testimonialsView.js',
    '/settingsView.js',      // Modifié
    '/cravingsView.js',
    '/focusView.js',
    '/motivationUtils.js',
    '/activityLogView.js',   // Modifié
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// --- Le reste du code (install, activate, fetch, message) ---
self.addEventListener('install', event => {
  console.log('Service Worker: Installation (Cache version:', CACHE_NAME, ')');
  event.waitUntil( (async () => { try { const c = await caches.open(CACHE_NAME); console.log('SW: Mise en cache App Shell...'); const reqs = APP_SHELL_URLS.map(u=>new Request(u,{cache:'reload'})); await c.addAll(reqs); console.log('SW: App Shell mis en cache.'); } catch (e) { console.error('SW: Échec cache addAll:',e); console.error('URLs:',APP_SHELL_URLS); try{const dC=await caches.open(CACHE_NAME+'-debug-failed'); for(const u of APP_SHELL_URLS){try{await dC.add(new Request(u,{cache:'reload'}));}catch(aE){console.error(`SW Debug: ÉCHEC ${u}`,aE);}}}catch(e){}} })() );
});
self.addEventListener('activate', event => {
  console.log('SW: Activation (Cache:', CACHE_NAME, ')');
  event.waitUntil( (async () => { try { const cN=await caches.keys(); const dP=cN.map(cN=>{if((cN.startsWith('claire-static-cache-')||cN.endsWith('-debug-failed'))&&cN!==CACHE_NAME){console.log('SW: Nettoyage ancien cache:',cN);return caches.delete(cN);}return Promise.resolve();}); await Promise.all(dP); console.log('SW: Anciens caches nettoyés.'); await self.clients.claim(); console.log('SW: Contrôle clients revendiqué.'); } catch (e) { console.error('SW: Échec nettoyage:', e); } })() );
});
self.addEventListener('fetch', event => {
    const {request}=event; const url=new URL(request.url); if(request.method!=='GET'||!url.protocol.startsWith('http'))return;
    if(APP_SHELL_URLS.includes(url.pathname)||request.mode==='navigate'){event.respondWith((async()=>{try{const c=await caches.open(CACHE_NAME); const cR=await c.match(request); const nFP=fetch(request).then(nR=>{if(nR.ok){c.put(request,nR.clone());}return nR;}).catch(e=>{return null;}); if(cR)return cR; const nR=await nFP; if(nR)return nR; if(request.mode==='navigate'){const fR=await c.match('/'); if(fR)return fR;} return new Response("Hors ligne.",{status:503,headers:{'Content-Type':'text/plain'}});}catch(e){return new Response("Erreur.",{status:500});}})());}
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') { self.skipWaiting(); }});
