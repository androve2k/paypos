// ── Service Worker PayPOS ─────────────────────────────────────────────────
// ⚠️ INCREMENTA questo numero ad ogni deploy per forzare aggiornamento cache
var CACHE_NAME = 'paypos-v2';

var FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/chat.js'
];

// Install: skipWaiting immediato + pre-cache file core
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES).catch(function(err) {
        console.warn('[SW] Pre-cache parziale:', err);
      });
    })
  );
});

// Activate: elimina cache vecchie + prendi controllo subito
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// Fetch: network-first per file same-origin (JS/CSS sempre aggiornati)
self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(req).then(function(resp) {
      if (!resp || resp.status !== 200) return resp;
      var clone = resp.clone();
      caches.open(CACHE_NAME).then(function(c) { c.put(req, clone); });
      return resp;
    }).catch(function() {
      return caches.match(req).then(function(r) { return r || Response.error(); });
    })
  );
});
