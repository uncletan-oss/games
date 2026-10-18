# Arena Games (apps/arena)

Halaman utama dan game Ludo, Ular Tangga, Catur, Halma, Congklak, Uno, Remi, Cangkul, Capsa, Ceki, Gaple. Lihat README di akar repo.

- `src/platform/ruang.js` — server meja yang berjalan di browser host (kursi, BOT, ronde, skor, batas waktu 45 detik per aksi).
- `src/platform/jaringan.js` — koneksi peer-to-peer lewat PeerJS (server signaling publik; bisa diganti lewat `VITE_PEER_HOST/PORT/PATH`).
- `src/platform/useRuang.js` — pengendali sisi pemain (sinkronisasi, menjalankan BOT, aksi).
- `src/games/<id>/mesin.js` — aturan & BOT tiap game (murni JavaScript, bisa diuji dengan `npm run uji`).
- `src/games/<id>/Papan.jsx` — tampilan meja tiap game.
- `scripts/logo.svg` + `scripts/buat-ikon.mjs` — logo & ikon PWA (`npm i -D playwright && node scripts/buat-ikon.mjs`).
