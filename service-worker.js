// service-worker.js

const CACHE_NAME = 'claire-static-cache-v13'; // <<<< VERSION INCRÉMENTÉE

// Vérifier que cette liste correspond EXACTEMENT aux fichiers du dépôt
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/storageUtils.js',       // Corrigé potentiellement
    '/sobrietyTracker.js',
    '/journal.js',
    '/moodTracker.js',
    '/progressView.js',       // Corrigé potentiellement
    '/badges.js',
    '/sosView.js',
    '/exercisesView.js',
    '/routineView.js',
    '/plannerView.js',
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
        // Log pour aider au debug si ça échoue encore
        console.error('URLs tentées:', APP_SHELL_URLS);
         try { // Tentative de cache individuel pour debug
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

    // Ignorer requêtes non-GET ou non-HTTP(S)
     if (request.method !== 'GET' || !url.protocol.startsWith('http')) { return; }

    // Stratégie Cache First, puis Network, avec mise à jour cache en arrière-plan (Stale-While-Revalidate 'lite')
    // pour les ressources de l'App Shell et la navigation.
    if (APP_SHELL_URLS.includes(url.pathname) || request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(request);

                // Tenter de rafraîchir depuis le réseau en arrière-plan
                const networkFetchPromise = fetch(request).then(networkResponse => {
                     if (networkResponse.ok) {
                         cache.put(request, networkResponse.clone()); // Mettre à jour le cache
                     }
                     return networkResponse; // Toujours retourner la réponse réseau
                 }).catch(error => {
                      console.warn('SW: Fetch réseau échoué (arrière-plan):', request.url, error);
                      return null;
                 });

                // Si trouvé en cache, servir immédiatement
                if (cachedResponse) { return cachedResponse; }

                // Sinon, attendre la réponse réseau
                const networkResponse = await networkFetchPromise;
                if (networkResponse) { return networkResponse; }

                // Fallback ultime si tout échoue
                console.error('SW: Échec Cache & Réseau:', request.url);
                 if (request.mode === 'navigate') {
                    const fallbackResponse = await cache.match('/');
                    if (fallbackResponse) { return fallbackResponse; }
                 }
                 return new Response("Contenu indisponible hors ligne.", { status: 503, headers: { 'Content-Type': 'text/plain' }});
            })()
        );
    }
    // Laisser les autres requêtes (CDN, etc.) passer
});

// --- Événement MESSAGE ---
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Ordre Skip waiting reçu.');
    self.skipWaiting();
  }
});
