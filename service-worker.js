// service-worker.js

const CACHE_NAME = 'claire-static-cache-v22'; // <<<< VERSION INCRÉMENTÉE

// Liste à jour incluant tous les fichiers JS connus
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/storageUtils.js',
    '/sobrietyTracker.js',
    '/journal.js',
    '/moodTracker.js',
    '/progressView.js',
    '/badges.js',
    '/sosView.js',
    '/exercisesView.js',
    '/routineView.js',
    '/plannerView.js',       // Modifié
    '/victoriesView.js',
    '/testimonialsView.js',
    '/settingsView.js',
    '/cravingsView.js',
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
         try {
              const debugCache = await caches.open(CACHE_NAME + '-debug-failed');
              for (const url of APP_SHELL_URLS) {
                   try { await debugCache.add(new Request(url, { cache: 'reload' })); }
                   catch (addError) { console.error(`SW Debug Cache: ÉCHEC pour ${url}`, addError); }
              }
         } catch (debugCacheError) {}
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
    const { request } = event;
    const url = new URL(request.url);
    if (request.method !== 'GET' || !url.protocol.startsWith('http')) { return; }

    // Stratégie Cache First, puis Network, avec màj cache en arrière-plan
    if (APP_SHELL_URLS.includes(url.pathname) || request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(request);
                    const networkFetchPromise = fetch(request).then(networkResponse => { if (networkResponse.ok) { cache.put(request, networkResponse.clone()); } return networkResponse; }).catch(error => { console.warn('SW: Fetch réseau (arrière-plan) échoué:', request.url, error); return null; });
                    if (cachedResponse) { return cachedResponse; }
                    const networkResponse = await networkFetchPromise;
                    if (networkResponse) { return networkResponse; }
                    console.error('SW: Échec Cache & Réseau:', request.url);
                     if (request.mode === 'navigate') { const fallback = await cache.match('/'); if (fallback) return fallback; }
                    return new Response("Contenu indisponible hors ligne.", { status: 503, headers: { 'Content-Type': 'text/plain' }});
                } catch (error) { console.error('SW: Erreur fetch:', error); return new Response("Erreur interne.", { status: 500 }); }
            })()
        );
    }
});

// --- Événement MESSAGE ---
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Ordre Skip waiting reçu.');
    self.skipWaiting();
  }
});
