# Meja Mahjong — 4 Pemain + BOT AI (React, peer-to-peer, GitHub Pages)

Mahjong online untuk 4 pemain (teman atau BOT Easy/Medium/Hard) dengan Pong / Chow / Kong,
Kong tertutup & tambahan, Ron, Tsumo, batas waktu giliran, dan hint shanten/ukeire.

Semuanya di GitHub: kode di repo ini, situsnya di GitHub Pages. **Tidak ada server sendiri**
(tidak memakai Google Apps Script lagi).

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

## Struktur

```
mahjong/
├─ src/
│  ├─ server/mesin.js    # aturan & BOT (dulu Code.gs), berjalan di browser host
│  ├─ jaringan.js        # PeerJS: host melayani panggilan, tamu mengirim panggilan ke host
│  ├─ api.js             # panggil('namaFungsi', ...args) → Promise
│  ├─ useMeja.js         # logika client: sinkronisasi state, BOT, timer, aksi pemain
│  ├─ App.jsx, main.jsx, konstanta.js, sesi.js, styles.css
│  └─ components/        # Home, Lobby, Game, Sidebar, PanelMenang, Plakat, Tile, Modal
├─ index.html, vite.config.js, package.json
../.github/workflows/pages.yml   # build & deploy ke GitHub Pages
```

## Menjalankan di komputer

```bash
npm install
npm run dev
```

Buka http://localhost:5173. Untuk mencoba main berdua di satu komputer, buka pemain kedua di
jendela penyamaran (sesi disimpan per browser).

## Deploy ke GitHub Pages

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push ke branch default. Workflow **GitHub Pages** (tab **Actions**) mem-build dan men-deploy.
   Bisa juga dijalankan manual dengan *Run workflow*.

Opsional — memakai server signaling PeerJS sendiri (mis. `npx peer --port 9000`) daripada server publik:
isi repository variable `VITE_PEER_HOST`, `VITE_PEER_PORT`, `VITE_PEER_PATH`
(**Settings → Secrets and variables → Actions → Variables**).
