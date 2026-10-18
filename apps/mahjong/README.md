# Meja Mahjong — 4 Pemain + BOT AI (React, peer-to-peer, GitHub Pages)

Mahjong online untuk 4 pemain (teman atau BOT Easy/Medium/Hard) dengan Pong / Chow / Kong,
Kong tertutup & tambahan, Ron, Tsumo, batas waktu giliran, dan hint shanten/ukeire.

Semuanya di GitHub: kode di repo ini, situsnya di GitHub Pages. **Tidak ada server sendiri**
(tidak memakai Google Apps Script lagi). Bisa dipasang ke layar utama HP sebagai aplikasi (PWA)
dan dibuka tanpa internet untuk main melawan BOT.

**Alamat:** https://uncletan-oss.github.io/games/mahjong/

## Cara kerjanya

GitHub Pages hanya menyajikan file statis, jadi "server" permainan berjalan di **browser host**:

```
Browser tamu ──WebRTC (langsung)──▶ Browser host: src/server/mesin.js (aturan, BOT, state meja)
       ▲                                   ▲
       └────── server signaling PeerJS ────┘   (hanya untuk saling menemukan; data permainan tidak lewat sini)
```

- Host membuat meja → kode meja menjadi alamat peer host.
- Tamu memasukkan kode (atau membuka tautan `.../mahjong/?meja=KODE`) → tersambung langsung ke host.
- State meja disimpan di `localStorage` host. Jika host me-refresh halaman lalu menekan
  **Kembali ke meja**, meja dibuka lagi dan tamu tersambung ulang otomatis (ditunggu sampai 30 detik).
- Jika host menekan **Keluar**, meja ditutup untuk semua pemain. Jika tamu keluar, kursinya dilanjutkan BOT.

Keterbatasan:
- Host harus tetap membuka halaman meja selama permainan (di HP, jangan pindah aplikasi terlalu lama).
- Daftar "meja yang sedang buka" tidak ada lagi karena tidak ada server pusat; bagikan kode/tautan.
- Perkenalan antar-browser memakai server publik gratis PeerJS (`0.peerjs.com`). Di sebagian jaringan
  (mis. beberapa jaringan seluler/kantor dengan NAT ketat) koneksi WebRTC langsung bisa gagal karena
  tidak ada server TURN.

## Struktur repo

```
games/
├─ apps/mahjong/               # KODE SUMBER (edit di sini)
│  ├─ src/
│  │  ├─ server/mesin.js       # aturan & BOT (dulu Code.gs), berjalan di browser host
│  │  ├─ jaringan.js           # PeerJS: host melayani panggilan, tamu mengirim ke host
│  │  ├─ useMeja.js            # logika client: sinkronisasi state, BOT, timer, aksi pemain
│  │  └─ components/           # Home, Lobby, Game, Sidebar, PanelMenang, Plakat, Tile, Modal
│  ├─ public/                  # manifest PWA, service worker, ikon
│  ├─ scripts/logo.svg         # logo aplikasi (sumber ikon)
│  └─ scripts/buat-ikon.mjs    # membuat ikon PNG dari logo.svg
├─ mahjong/                    # HASIL BUILD yang disajikan GitHub Pages (jangan diedit manual)
├─ index.html                  # akar situs → mengarah ke mahjong/
└─ .github/workflows/build.yml # build ulang otomatis bila apps/mahjong berubah
```

## Menjalankan di komputer

```bash
cd apps/mahjong
npm install
npm run dev      # http://localhost:5173
npm run build    # menulis hasil ke ../../mahjong
```

Untuk mencoba main berdua di satu komputer, buka pemain kedua di jendela penyamaran.

## Publikasi di GitHub Pages (gratis)

1. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   pilih branch yang berisi folder `mahjong/` dan folder **/ (root)**, lalu **Save**.
2. Buka `https://<user>.github.io/<repo>/mahjong/`.

Setiap mengubah kode di `apps/mahjong`, jalankan `npm run build` lalu commit folder `mahjong/`.
Kalau lupa (atau mengedit lewat web GitHub), workflow **Build Mahjong** mem-build dan
meng-commit `mahjong/` secara otomatis.

## Pasang di HP (PWA)

- **Android (Chrome):** buka situsnya → menu ⋮ → **Tambahkan ke layar utama / Instal aplikasi**.
- **iPhone (Safari):** tombol Bagikan → **Tambahkan ke Layar Utama**.

Aplikasi terbuka layar penuh dengan logo ubin 中. Tanpa internet, meja yang semua lawannya BOT
tetap bisa dimainkan; main bersama teman butuh internet.

Mengganti logo: edit `scripts/logo.svg`, lalu `npm i -D playwright && node scripts/buat-ikon.mjs`.

## Server signaling sendiri (opsional)

Default memakai server publik PeerJS. Untuk memakai server sendiri (mis. `npx peer --port 9000`),
isi variabel `VITE_PEER_HOST`, `VITE_PEER_PORT`, `VITE_PEER_PATH` saat build
(untuk workflow: **Settings → Secrets and variables → Actions → Variables**).
