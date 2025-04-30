// service-worker.js

const CACHE_NAME = 'claire-static-cache-v5'; // <<<< VERSION INCRÉMENTÉE ICI

// Vérifier que cette liste correspond EXACTEMENT aux fichiers du dépôt
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js', // Ce fichier a changé
    '/storageUtils.js',
    '/sobrietyTracker.js',
    '/journal.js',
    '/moodTracker.js',
    '/progressView.js',
    '/badges.js',
    '/sosView.js',
    '/exercisesView.js',
    '/routineView.js', // Ce fichier a changé
    '/plannerView.js',
    '/victoriesView.js',
    '/testimonialsView.js',
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
        // Log détaillé de l'erreur addAll
        console.error('Service Worker: Échec de la mise en cache addAll:', error);
        // Essayer d'identifier quel fichier a échoué (plus complexe)
        // Pourrait nécessiter de faire cache.add() fichier par fichier dans une boucle avec des try-catch individuels
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
          if (cacheName.startsWith('claire-static-cache-') && cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
        console.log('Service Worker: Anciens caches nettoyés.');
        // Prendre le contrôle immédiatement
        await self.clients.claim();
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

    // Stratégie Cache First, puis Network, avec mise à jour cache en arrière-plan
    if (APP_SHELL_URLS.includes(requestUrl.pathname) || event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(event.request);

                const networkFetchPromise = fetch(event.request).then(networkResponse => {
                     if (networkResponse.ok) {
                         // Vérifier si la réponse est valide avant de mettre en cache
                         // Et cloner car la réponse ne peut être consommée qu'une fois
                         cache.put(event.request, networkResponse.clone());
                     }
                     return networkResponse;
                 }).catch(error => {
                      console.warn('SW: Fetch réseau échoué (arrière-plan):', event.request.url, error);
                      return null;
                 });

                // Si en cache, retourner la version cachée (rapide)
                // Le networkFetchPromise continue en arrière-plan pour mettre à jour le cache si possible
                if (cachedResponse) { return cachedResponse; }

                // Si pas en cache, attendre la réponse réseau
                const networkResponse = await networkFetchPromise;
                if (networkResponse) { return networkResponse; }

                // Si ni cache ni réseau OK
                console.error('SW: Échec Cache & Réseau:', event.request.url);
                 if (event.request.mode === 'navigate') {
                    const fallbackResponse = await cache.match('/'); // Essayer l'index comme fallback
                    if (fallbackResponse) return fallbackResponse;
                 }
                 return new Response("Contenu indisponible hors ligne.", { status: 503, headers: { 'Content-Type': 'text/plain' }});
            })()
        );
    }
    // Laisser les autres requêtes (CDN etc) passer
});

// --- Événement MESSAGE ---
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Ordre Skip waiting reçu.');
    self.skipWaiting();
  }
});
