// Service Worker — Loto Accessible
// Stratégie : cache-first pour tous les assets, l'appli fonctionne 100% hors ligne après le premier chargement.

const CACHE_VERSION = 'loto-v1';

// Liste des fichiers à mettre en cache au premier lancement
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo192x192.png',
  './logo512x512.png',
  // Phrases
  './carton_plein.wav',
  './deux_lignes_completes.wav',
  './mode_jeu.wav',
  './mode_revision.wav',
  './une_ligne_complete.wav'
];

// Ajouter dynamiquement les numéros 1 à 90
for (let i = 1; i <= 90; i++) {
  ASSETS.push('./' + i + '.wav');
}

// Installation : on précharge tous les assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        // addAll échoue en bloc si un seul fichier rate.
        // On utilise add() individuellement pour être tolérant aux fichiers manquants.
        return Promise.all(
          ASSETS.map(url =>
            cache.add(url).catch(err =>
              console.warn('[SW] Failed to cache:', url, err.message)
            )
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activation : on nettoie les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch : cache-first, avec fallback réseau et mise en cache au passage
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Mettre en cache la réponse pour la prochaine fois (si OK)
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Hors-ligne et pas en cache : pour le HTML, on retourne la page principale
        if (event.request.mode === 'navigate') {
          return caches.match('./loto-malvoyants.html');
        }
      });
    })
  );
});
