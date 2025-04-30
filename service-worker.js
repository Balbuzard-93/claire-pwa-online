// service-worker.js

const CACHE_NAME = 'claire-static-cache-v21'; // <<<< VERSION INCRÉMENTÉE

// Liste à jour incluant tous les fichiers JS connus
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',           // Potentiellement modifié
    '/storageUtils.js',
    '/sobrietyTracker.js',
    '/journal.js',       // Modifié avec logs
    '/moodTracker.js',   // Modifié avec logs
    '/progressView.js',
    '/badges.js',
    '/sosView.js',
    '/exercisesView.js',
    '/routineView.js',   // Potentiellement modifié
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
  // Ne pas appeler skipWaiting() ici par défaut, permet une activation contrôlée
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('Service Worker: Mise en cache de l\'App Shell...');
        // Forcer le re-téléchargement lors de l'installation
        const requests = APP_SHELL_URLS.map(url => new Request(url, { cache: 'reload' }));
        await cache.addAll(requests);
        console.log('Service Worker: App Shell mis en cache avec succès.');
      } catch (error) {
        console.error('Service Worker: Échec de la mise en cache addAll:', error);
        // Log détaillé pour aider au debug
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
        // Nettoyage des anciens caches
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

        // Prendre le contrôle des clients non contrôlés immédiatement
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

    // Stratégie: Cache d'abord, puis réseau, avec mise à jour cache en arrière-plan (Stale-While-Revalidate 'lite')
    // pour les ressources de l'App Shell et la navigation.
    if (APP_SHELL_URLS.includes(url.pathname) || request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(request);

                    // Tenter de récupérer depuis le réseau en arrière-plan pour mettre à jour le cache
                    const networkFetchPromise = fetch(request).then(networkResponse => {
                         if (networkResponse.ok) {
                             cache.put(request, networkResponse.clone()); // Mettre à jour le cache avec la nouvelle version
                         }
                         return networkResponse;
                     }).catch(error => {
                          // Échec réseau en arrière-plan n'est pas critique si on a le cache
                          console.warn('SW: Fetch réseau (arrière-plan) échoué:', request.url, error);
                          return null; // Retourner null pour indiquer l'échec
                     });

                    // Si trouvé en cache, servir immédiatement
                    if (cachedResponse) {
                        // console.log('SW: Servi depuis cache:', request.url);
                        return cachedResponse;
                    }

                    // Si pas en cache, attendre la réponse réseau (peut avoir déjà été lancée)
                    // console.log('SW: Attente réseau (pas en cache):', request.url);
                    const networkResponse = await networkFetchPromise; // Attendre ici
                    if (networkResponse) {
                        // console.log('SW: Servi depuis réseau:', request.url);
                        return networkResponse;
                    }

                    // Fallback ultime si ni cache ni réseau n'ont fonctionné
                    console.error('SW: Échec Cache & Réseau pour ressource App Shell:', request.url);
                    if (request.mode === 'navigate') {
                        const fallbackResponse = await cache.match('/'); // Essayer l'index
                        if (fallbackResponse) return fallbackResponse;
                    }
                    // Retourner une réponse d'erreur générique
                    return new Response("Contenu indisponible hors ligne.", { status: 503, headers: { 'Content-Type': 'text/plain' }});

                } catch (error) {
                     console.error('SW: Erreur inattendue dans le gestionnaire fetch:', error);
                     // Erreur générale, retourner une réponse d'erreur
                      return new Response("Erreur interne du Service Worker.", { status: 500, headers: { 'Content-Type': 'text/plain' }});
                }
            })()
        );
    }
    // Laisser les autres requêtes (CDN, etc.) passer au navigateur
});

// --- Événement MESSAGE ---
// Permet à la page de forcer l'activation du SW en attente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Ordre Skip waiting reçu. Activation...');
    self.skipWaiting(); // Force l'activation
  }
});
