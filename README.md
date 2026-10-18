# games — Arena Games

Kumpulan game web statis, gratis di GitHub Pages: **https://uncletan-oss.github.io/games/**

| Kategori | Game | Pemain |
|---|---|---|
| 🎲 Papan | Ludo, Ular Tangga | 2–4 |
| 🃏 Kartu | Remi, Cangkul, Capsa (banting / Big Two), Ceki (versi sederhana) | 2–4 |
| 🁫 Domino | Gaple | 2–4 |
| 🀄 Ubin | [Mahjong](https://uncletan-oss.github.io/games/mahjong/) | 4 |

- Main bareng teman lewat **kode meja / tautan undangan** (peer-to-peer, meja berjalan di browser host), atau lawan **BOT** Easy/Medium/Hard.
- Bisa dipasang ke layar utama HP (PWA). Lawan BOT tetap bisa tanpa internet.

## Struktur

```
apps/arena/     # kode sumber halaman utama + semua game kecuali Mahjong (React + Vite)
  src/platform/ #   fondasi bersama: server meja (ruang.js), peer-to-peer (jaringan.js), layar buat/gabung/ruang tunggu
  src/games/    #   satu folder per game: mesin.js (aturan + BOT) dan Papan.jsx (tampilan)
apps/mahjong/   # kode sumber Mahjong
index.html, assets-arena/, arena-ikon/, sw.js, manifest.webmanifest   # HASIL BUILD apps/arena (akar situs)
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
3. Daftarkan di `src/games/index.js` (nama, kategori, jumlah pemain, aturan).
