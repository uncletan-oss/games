/* Service worker: tampilan aplikasi tetap bisa dibuka tanpa internet (main melawan BOT). */
const CACHE = 'arena-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './manifest.webmanifest', './arena-ikon/icon-192.png'])));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin && !url.hostname.endsWith('fonts.gstatic.com') && !url.hostname.endsWith('fonts.googleapis.com')) return;
  if (url.origin === location.origin && url.pathname.includes('/mahjong/')) return;   // Mahjong punya service worker sendiri

  // Halaman: ambil versi terbaru dulu, pakai cache bila offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then(res => { const salin = res.clone(); caches.open(CACHE).then(c => c.put('./', salin)); return res; })
      .catch(() => caches.match('./')));
    return;
  }
  // File lain (JS/CSS ber-hash, ikon, font): cache dulu
  e.respondWith(caches.match(req).then(ada => ada || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const salin = res.clone(); caches.open(CACHE).then(c => c.put(req, salin)); }
    return res;
  })));
});
