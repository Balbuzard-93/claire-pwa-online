// service-worker.js

const CACHE_NAME = 'claire-static-cache-v12'; // <<<< VERSION INCRÉMENTÉE ICI

// Vérifier et maintenir cette liste à jour !
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
    '/plannerView.js',
    '/victoriesView.js',
    '/testimonialsView.js',
    '/settingsView.js',      // *** AJOUTÉ PRÉCÉDEMMENT ***
    '/cravingsView.js',      // *** AJOUTÉ MAINTENANT ***
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
        // Utiliser { cache: 'reload' } pour éviter le cache HTTP navigateur
        const requests = APP_SHELL_URLS.map(url => new Request(url, { cache: 'reload' }));
        await cache.addAll(requests);
        console.log('Service Worker: App Shell mis en cache avec succès.');
      } catch (error) {
        console.error('Service Worker: Échec de la mise en cache addAll:', error);
        // Log détaillé pour aider au debug si ça échoue encore
         console.error('Tentative de mise en cache des URLs:', APP_SHELL_URLS);
         // Essayer de mettre en cache un par un pour voir lequel échoue
         try {
              const cache = await caches.open(CACHE_NAME + '-debug'); // Cache temporaire pour debug
              for (const url of APP_SHELL_URLS) {
                   try {
                        await cache.add(new Request(url, { cache: 'reload' }));
                        console.log(`SW Debug Cache: ${url} OK`);
                   } catch (addError) {
                        console.error(`SW Debug Cache: ÉCHEC pour ${url}`, addError);
                   }
              }
         } catch (debugCacheError) {
              console.error("Erreur ouverture cache debug", debugCacheError);
         }
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
          // Supprimer les caches commençant par 'claire-static-cache-' (y compris -debug) mais différents du actuel
          if ((cacheName.startsWith('claire-static-cache-') || cacheName.endsWith('-debug')) && cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
        console.log('Service Worker: Anciens caches nettoyés.');
        await self.clients.claim(); // Prendre le contrôle
        console.log('Service Worker: Contrôle immédiat des clients revendiqué.');
      } catch (error) {
        console.error('Service Worker: Échec du nettoyage des anciens caches:', error);
      }
    })()
  );
});

// --- Événement FETCH ---
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== 'GET' || !requestUrl.protocol.startsWith('http')) { return; }

    // Stratégie Cache First, puis Network, avec màj cache en arrière-plan
    if (APP_SHELL_URLS.includes(requestUrl.pathname) || event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(event.request);

                const networkFetchPromise = fetch(event.request).then(networkResponse => {
                     if (networkResponse.ok) {
                         cache.put(event.request, networkResponse.clone());
                     }
                     return networkResponse;
                 }).catch(error => {
                      console.warn('SW: Fetch réseau échoué (arrière-plan):', event.request.url, error);
                      return null;
                 });

                if (cachedResponse) { return cachedResponse; } // Servi depuis cache
                const networkResponse = await networkFetchPromise; // Attendre réseau si pas en cache
                if (networkResponse) { return networkResponse; }

                // Fallback si tout échoue
                console.error('SW: Échec Cache & Réseau:', event.request.url);
                 if (event.request.mode === 'navigate') {
                    const fallbackResponse = await cache.match('/');
                    if (fallbackResponse) return fallbackResponse;
                 }
                return new Response("Contenu indisponible hors ligne.", { status: 503, headers: { 'Content-Type': 'text/plain' }});
            })()
        );
    }
    // Autres requêtes (CDN, etc.) laissées au navigateur
});

// --- Événement MESSAGE ---
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Ordre Skip waiting reçu.');
    self.skipWaiting();
  }
});
