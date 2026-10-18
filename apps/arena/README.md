# Arena Games (apps/arena)

Halaman utama dan game Ludo, Ular Tangga, Catur, Halma, Congklak, Uno, Remi, Cangkul, Capsa, Ceki, Gaple. Lihat README di akar repo.

- `src/platform/ruang.js` — server meja yang berjalan di browser host (kursi, BOT, ronde, skor, batas waktu 45 detik per aksi).
- `src/platform/jaringan.js` — koneksi peer-to-peer lewat PeerJS (server signaling publik; bisa diganti lewat `VITE_PEER_HOST/PORT/PATH`).
- `src/platform/useRuang.js` — pengendali sisi pemain (sinkronisasi, menjalankan BOT, aksi).
- `src/games/<id>/mesin.js` — aturan & BOT tiap game (murni JavaScript, bisa diuji dengan `npm run uji`).
- `src/games/<id>/Papan.jsx` — tampilan meja tiap game.
- `src/games/meta.js` — nama & ringkasan tiap game (dipakai aplikasi dan plugin build).
- `vite.config.js` — plugin `halamanPerGame` membuat `/<id>/index.html` untuk tiap game saat build.
- `scripts/logo.svg` (semua game) + `scripts/logo-game.mjs` (tiap game) + `scripts/buat-pwa.mjs` —
  membuat manifest, service worker, dan ikon PWA di `public/` (`npm i -D playwright && node scripts/buat-pwa.mjs`).
