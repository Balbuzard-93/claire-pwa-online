// service-worker.js

const CACHE_NAME = 'claire-static-cache-v37'; // <<<< VERSION INCRÉMENTÉE

// Liste à jour incluant tous les fichiers JS connus
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/storageUtils.js',       // Modifié
    '/sobrietyTracker.js',
    '/journal.js',
    '/moodTracker.js',
    '/progressView.js',
    '/badges.js',
    '/sosView.js',
    '/exercisesView.js',
    '/routineView.js',
    '/plannerView.js',
    '/victoriesView.js',
    '/testimonialsView.js',
    '/settingsView.js',
    '/cravingsView.js',
    '/focusView.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// --- Événement INSTALL ---
self.addEventListener('install', event => {
  console.log('Service Worker: Installation (Cache version:', CACHE_NAME, ')');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('Service Worker: Mise en cache de l\'App Shell...');
        const requests = APP_SHELL_URLS.map(url => new Request(url, { cache: 'reload' }));
        await cache.addAll(requests);
        console.log('Service Worker: App Shell mis en cache avec succès.');
      } catch (error) {
        console.error('Service Worker: Échec de la mise en cache addAll:', error);
        console.error('URLs tentées:', APP_SHELL_URLS);
         try { const dC=await caches.open(CACHE_NAME+'-debug'); for(const u of APP_SHELL_URLS){try{await dC.add(new Request(u,{cache:'reload'}));}catch(aE){console.error(`SW Debug: ÉCHEC ${u}`,aE);}} } catch(e){}
      }
    })()
  );
});

// --- Événement ACTIVATE ---
self.addEventListener('activate', event => {
  console.log('Service Worker: Activation (Cache version:', CACHE_NAME, ')');
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(cacheName => {
          if ((cacheName.startsWith('claire-static-cache-') || cacheName.endsWith('-debug-failed')) && cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
        console.log('Service Worker: Anciens caches nettoyés.');
        await self.clients.claim();
        console.log('Service Worker: Contrôle clients revendiqué.');
      } catch (error) {
        console.error('Service Worker: Échec nettoyage anciens caches:', error);
      }
    })()
  );
});

// --- Événement FETCH ---
self.addEventListener('fetch', event => {
    const { request } = event; const url = new URL(request.url);
    if (request.method !== 'GET' || !url.protocol.startsWith('http')) { return; }
    if (APP_SHELL_URLS.includes(url.pathname) || request.mode === 'navigate') {
        event.respondWith( (async () => { try { const c = await caches.open(CACHE_NAME); const cR = await c.match(request); const nFP = fetch(request).then(nR => { if(nR.ok){c.put(request, nR.clone());} return nR; }).catch(e => {console.warn('SW: Fetch BKG échoué:',request.url,e); return null;}); if(cR){return cR;} const nR = await nFP; if(nR){return nR;} console.error('SW: Échec Cache&Net:', request.url); if(request.mode==='navigate'){const fR=await c.match('/'); if(fR)return fR;} return new Response("Hors ligne.",{status:503,headers:{'Content-Type':'text/plain'}});} catch (e) { console.error('SW: Err fetch:',e); return new Response("Erreur.",{status:500});}})());
    }
});

// --- Événement MESSAGE ---
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') { console.log('SW: Skip waiting reçu.'); self.skipWaiting(); }});
