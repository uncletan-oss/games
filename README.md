# games — Arena Games

Kumpulan game web statis, gratis di GitHub Pages: **https://uncletan-oss.github.io/games/**

Setiap game punya alamat dan PWA (logo) sendiri, jadi bisa dipasang terpisah di layar utama HP.
Halaman utama juga bisa dipasang sebagai PWA **Arena Games** yang berisi semua game.

| Kategori | Game | Alamat | Pemain |
|---|---|---|---|
| — | **Semua game** | https://uncletan-oss.github.io/games/ | — |
| 🎲 Papan Dadu | Ludo | https://uncletan-oss.github.io/games/ludo/ | 2–4 |
| 🎲 Papan Dadu | Ular Tangga | https://uncletan-oss.github.io/games/ulartangga/ | 2–4 |
| ♟ Strategi | Catur | https://uncletan-oss.github.io/games/catur/ | 2 |
| ♟ Strategi | Halma (dam bintang) | https://uncletan-oss.github.io/games/halma/ | 2–4 |
| ♟ Strategi | Congklak | https://uncletan-oss.github.io/games/congklak/ | 2 |
| 🃏 Kartu | Uno | https://uncletan-oss.github.io/games/uno/ | 2–4 |
| 🃏 Kartu | Remi | https://uncletan-oss.github.io/games/remi/ | 2–4 |
| 🃏 Kartu | Cangkul | https://uncletan-oss.github.io/games/cangkul/ | 2–4 |
| 🃏 Kartu | Capsa (banting / Big Two) | https://uncletan-oss.github.io/games/capsa/ | 2–4 |
| 🃏 Kartu | Ceki (versi sederhana) | https://uncletan-oss.github.io/games/ceki/ | 2–4 |
| 🁫 Domino | Gaple | https://uncletan-oss.github.io/games/gaple/ | 2–4 |
| 🀄 Ubin | Mahjong | https://uncletan-oss.github.io/games/mahjong/ | 4 |

- Main bareng teman lewat **kode meja / tautan undangan** (peer-to-peer, meja berjalan di browser host), atau lawan **BOT** Easy/Medium/Hard.
- Bisa dipasang ke layar utama HP (PWA). Lawan BOT tetap bisa tanpa internet.

## Struktur

```
apps/arena/     # kode sumber halaman utama + semua game kecuali Mahjong (React + Vite)
  src/platform/ #   fondasi bersama: server meja (ruang.js), peer-to-peer (jaringan.js), layar buat/gabung/ruang tunggu
  src/games/    #   satu folder per game: mesin.js (aturan + BOT) dan Papan.jsx (tampilan)
apps/mahjong/   # kode sumber Mahjong
index.html, assets-arena/, arena-ikon/, sw.js, manifest.webmanifest   # HASIL BUILD apps/arena (akar situs, PWA semua game)
ludo/, catur/, remi/, …   # HASIL BUILD: halaman + PWA (manifest, sw.js, ikon/) tiap game
mahjong/        # HASIL BUILD apps/mahjong
```

Jangan edit hasil build secara manual. Ubah kode di `apps/…`, lalu `npm run build` di folder app itu
(atau biarkan workflow **Build Games** yang mem-build dan meng-commit).

## Menjalankan di komputer

```bash
cd apps/arena
npm install
npm run dev     # http://localhost:5173
npm run uji     # simulasi ratusan ronde antar-BOT untuk semua game
npm run build   # menulis hasil ke akar repo
```

## Menambah game baru

1. Buat `apps/arena/src/games/<id>/mesin.js` dengan fungsi `mulai`, `aksi`, `bot`, `giliran`, `hasil`, `pandangan`, `log`
   (lihat komentar di `src/platform/ruang.js`).
2. Buat `Papan.jsx` untuk tampilan mejanya.
3. Tambahkan nama & ringkasan di `src/games/meta.js`, lalu daftarkan di `src/games/index.js` (kategori, jumlah pemain, aturan).
4. Buat logonya di `scripts/logo-game.mjs`, lalu `npm i -D playwright && node scripts/buat-pwa.mjs`
   untuk membuat manifest, service worker, dan ikon PWA di `public/<id>/`.
