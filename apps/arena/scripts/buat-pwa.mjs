/**
 * Membuat file PWA di public/:
 *  - public/manifest.webmanifest, public/sw.js, public/arena-ikon/*   → PWA "semua game" di /games/
 *  - public/<id>/manifest.webmanifest, public/<id>/sw.js, public/<id>/ikon/*  → PWA per game di /games/<id>/
 * Halaman index.html per game dibuat saat build (plugin di vite.config.js).
 * Jalankan bila logo/daftar game berubah:  npm i -D playwright && node scripts/buat-pwa.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { META, ID_GAME } from '../src/games/meta.js';
import { LOGO } from './logo-game.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const publik = p => new URL('../public/' + p, import.meta.url);
const tulis = (p, isi) => { mkdirSync(new URL('.', publik(p)), { recursive: true }); writeFileSync(publik(p), isi); };

/** Service worker: halaman diambil dari jaringan dulu (cache bila offline), aset dari cache dulu. */
function serviceWorker(cache, akar) {
  return `/* Service worker ${akar ? 'Arena Games (semua game)' : cache} — dibuat scripts/buat-pwa.mjs */
const CACHE = '${cache}-v2';
const SCOPE = new URL(self.registration.scope);
const ASET = new URL('${akar ? './' : '../'}', SCOPE).pathname;   // akar situs: assets-arena/ ada di sini

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './manifest.webmanifest'])));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('${cache}-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function milikSaya(url) {
  if (url.hostname.endsWith('fonts.gstatic.com') || url.hostname.endsWith('fonts.googleapis.com')) return true;
  if (url.origin !== location.origin) return false;
  if (url.pathname.startsWith(ASET + 'assets-arena/')) return true;
  if (!url.pathname.startsWith(SCOPE.pathname)) return false;
  ${akar ? `// PWA semua game hanya mengurus file di akar; tiap game & Mahjong punya service worker sendiri
  return !url.pathname.slice(SCOPE.pathname.length).includes('/') || url.pathname.startsWith(SCOPE.pathname + 'arena-ikon/');` : 'return true;'}
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
`;
}

function manifest(nama, pendek, deskripsi, folderIkon, warna) {
  return JSON.stringify({
    id: './', name: nama, short_name: pendek, description: deskripsi, lang: 'id',
    start_url: './', scope: './', display: 'standalone', orientation: 'any',
    background_color: '#0F2A25', theme_color: warna || '#0F2A25', categories: ['games'],
    icons: [
      { src: folderIkon + 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: folderIkon + 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: folderIkon + 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }, null, 2) + '\n';
}

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
async function ikon(svg, folder) {
  const varian = {
    any: svg.replace('<rect id="latar"', '<rect id="latar" rx="112"'),
    maskable: svg.replace('<g id="isi">', '<g id="isi" transform="translate(256 256) scale(0.84) translate(-256 -256)">')
  };
  for (const [file, ukuran, jenis] of [['icon-192.png', 192, 'any'], ['icon-512.png', 512, 'any'], ['maskable-512.png', 512, 'maskable'],
    ['apple-touch-icon.png', 180, 'maskable'], ['favicon-32.png', 32, 'any']]) {
    await page.setViewportSize({ width: ukuran, height: ukuran });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${ukuran}px;height:${ukuran}px}</style>${varian[jenis]}`);
    tulis(folder + file, await page.screenshot({ omitBackground: true }));
  }
  tulis(folder + 'favicon.svg', varian.any);
}

// PWA semua game
await ikon(readFileSync(new URL('./logo.svg', import.meta.url), 'utf8'), 'arena-ikon/');
tulis('manifest.webmanifest', manifest('Arena Games — Ludo, Remi, Gaple & lainnya', 'Arena Games',
  'Ludo, Ular Tangga, Catur, Halma, Congklak, Uno, Remi, Cangkul, Capsa, Ceki, Gaple, dan Mahjong. Main bareng teman atau lawan BOT.', 'arena-ikon/'));
tulis('sw.js', serviceWorker('arena', true));

// PWA per game
for (const id of ID_GAME) {
  const m = META[id];
  await ikon(LOGO[id](), `${id}/ikon/`);
  tulis(`${id}/manifest.webmanifest`, manifest(`${m.nama} — Arena Games`, m.nama, m.ringkas, 'ikon/'));
  tulis(`${id}/sw.js`, serviceWorker('arena-' + id, false));
  console.log('✓', id);
}
await browser.close();
