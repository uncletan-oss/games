/* Service worker arena-uno — dibuat scripts/buat-pwa.mjs */
const CACHE = 'arena-uno-v2';
const SCOPE = new URL(self.registration.scope);
const ASET = new URL('../', SCOPE).pathname;   // akar situs: assets-arena/ ada di sini

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './manifest.webmanifest'])));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('arena-uno-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function milikSaya(url) {
  if (url.hostname.endsWith('fonts.gstatic.com') || url.hostname.endsWith('fonts.googleapis.com')) return true;
  if (url.origin !== location.origin) return false;
  if (url.pathname.startsWith(ASET + 'assets-arena/')) return true;
  if (!url.pathname.startsWith(SCOPE.pathname)) return false;
  return true;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!milikSaya(url)) return;
  if (req.mode === 'navigate') {
    const kunci = url.origin + url.pathname;
    e.respondWith(fetch(req)
      .then(res => { const salin = res.clone(); caches.open(CACHE).then(c => c.put(kunci, salin)); return res; })
      .catch(() => caches.match(kunci).then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(ada => ada || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const salin = res.clone(); caches.open(CACHE).then(c => c.put(req, salin)); }
    return res;
  })));
});
