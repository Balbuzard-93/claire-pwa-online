// service-worker.js

const CACHE_NAME = 'claire-static-cache-v3'; // Incrémentez si les fichiers ci-dessous changent

// Mettre à jour cette liste si des fichiers JS/CSS/HTML sont ajoutés/supprimés
const APP_SHELL_URLS = [
    '/', // Important pour la racine
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
    '/manifest.json', // Ajouter le manifest
    '/icons/icon-192.png', // Ajouter les icônes
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
        // Utiliser { cache: 'reload' } pour forcer le re-téléchargement depuis le réseau
        // pendant l'installation, évitant les problèmes de cache HTTP navigateur.
        const requests = APP_SHELL_URLS.map(url => new Request(url, { cache: 'reload' }));
        await cache.addAll(requests);
        console.log('Service Worker: App Shell mis en cache avec succès.');
      } catch (error) {
        console.error('Service Worker: Échec de la mise en cache de l\'App Shell:', error);
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
          // Supprimer les caches commençant par 'claire-static-cache-' mais différents du actuel
          if (cacheName.startsWith('claire-static-cache-') && cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
        console.log('Service Worker: Anciens caches nettoyés.');
        // Forcer le SW activé à prendre le contrôle immédiatement
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

    // Ignorer les requêtes non-GET ou celles vers des schémas non http/https
     if (event.request.method !== 'GET' || !requestUrl.protocol.startsWith('http')) {
        return; // Laisser le navigateur gérer
     }

    // Stratégie Cache First améliorée (Stale While Revalidate 'lite')
    // pour les ressources de l'App Shell et la navigation.
    if (APP_SHELL_URLS.includes(requestUrl.pathname) || event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(event.request);

                // Lancer la requête réseau en parallèle pour mise à jour future du cache
                const networkFetchPromise = fetch(event.request).then(networkResponse => {
                     if (networkResponse.ok) {
                         // Mettre la nouvelle version en cache pour la prochaine fois
                         cache.put(event.request, networkResponse.clone());
                     }
                     return networkResponse; // Retourner la réponse réseau pour l'étape suivante si besoin
                 }).catch(error => {
                      console.warn('Service Worker: Fetch réseau échoué (arrière-plan):', event.request.url, error);
                      return null; // Indiquer échec réseau
                 });

                // Si on a une réponse en cache, la retourner immédiatement (rapide)
                if (cachedResponse) {
                    // console.log('Servi depuis cache:', event.request.url);
                    return cachedResponse;
                }

                // Si pas de cache, attendre la réponse réseau (première visite ou cache vidé)
                // console.log('Attente réseau (pas de cache):', event.request.url);
                const networkResponse = await networkFetchPromise;
                if (networkResponse) {
                    return networkResponse;
                }

                // Si ni cache ni réseau ne fonctionnent (vraiment hors ligne et ressource non cachée)
                console.error('Service Worker: Échec Cache et Réseau:', event.request.url);
                 // Si c'est une navigation, on pourrait servir une page offline générique
                 if (event.request.mode === 'navigate') {
                    // Essayer de retourner '/' (index.html) du cache comme fallback ultime
                    const fallbackResponse = await cache.match('/');
                    if (fallbackResponse) return fallbackResponse;
                    // Ou retourner une page offline.html si elle est pré-cachée:
                    // const offlinePage = await cache.match('/offline.html');
                    // if (offlinePage) return offlinePage;
                 }
                // Retourner une erreur simple si aucun fallback
                 return new Response("Contenu indisponible hors ligne.", { status: 503, statusText: "Service Unavailable", headers: { 'Content-Type': 'text/plain' }});

            })()
        );
    }
    // Pour les autres requêtes (CDN, etc.), on ne fait rien ici,
    // laissant le navigateur utiliser son propre cache HTTP et gérer la requête.
});

// --- Événement MESSAGE ---
// Permet à la page de communiquer avec le SW (ex: pour skipWaiting)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Ordre Skip waiting reçu. Activation immédiate.');
    self.skipWaiting(); // Force le SW en attente à devenir actif
  }
});