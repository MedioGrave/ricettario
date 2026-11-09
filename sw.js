// Ricettario: funziona offline. Prima prova la rete, se manca usa la copia salvata.
const CACHE = 'ricettario-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'recipes.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.github.com') return; // sincronizzazione: sempre dalla rete
  const key = url.origin === self.location.origin ? url.origin + url.pathname : req.url;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(key, copy)).catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(key).then(hit => hit || (req.mode === 'navigate' ? caches.match(self.location.origin + self.registration.scope.replace(self.location.origin, '')) .then(h => h || caches.match('index.html')) : undefined))
    )
  );
});
