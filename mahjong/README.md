# Meja Mahjong — 4 Pemain + BOT AI (React + Google Apps Script)

Mahjong online untuk 4 pemain (teman atau BOT Easy/Medium/Hard) dengan Pong / Chow / Kong,
Kong tertutup & tambahan, Ron, Tsumo, batas waktu giliran, dan hint shanten/ukeire.

- **Server**: Google Apps Script (`gas/Code.gs`), state meja disimpan di `PropertiesService`.
- **Client**: React 19 + Vite (`src/`), di-build menjadi **satu file** `gas/Index.html`
  (semua JS & CSS di-inline) karena Apps Script hanya bisa menyajikan file HTML.

## Struktur

```
mahjong/
├─ gas/
│  ├─ Code.gs            # server (doGet + API yang dipanggil lewat google.script.run)
│  ├─ appsscript.json    # manifest web app
│  └─ Index.html         # HASIL BUILD — jangan diedit manual
├─ src/
│  ├─ main.jsx           # entry React
│  ├─ App.jsx            # pemilih layar: Home → Lobby → Game
│  ├─ useMeja.js         # semua logika client: polling, BOT, timer, aksi pemain
│  ├─ api.js             # google.script.run → Promise
│  ├─ konstanta.js, sesi.js
│  ├─ styles.css
│  ├─ components/        # Home, Lobby, Game, Sidebar, PanelMenang, Plakat, Tile, Modal
│  └─ dev/gasMock.js     # server tiruan untuk `npm run dev` (tidak ikut build)
├─ scripts/salin-ke-gas.mjs
├─ index.html, vite.config.js, package.json
```

## Menjalankan di komputer (tanpa Apps Script)

```bash
npm install
npm run dev
```

Buka http://localhost:5173. Dalam mode ini `gas/Code.gs` dijalankan langsung di browser
(`src/dev/gasMock.js`) dan data meja disimpan di `localStorage`, jadi beberapa tab bisa
bermain di meja yang sama. Karena tab di browser yang sama berbagi sesi, gunakan jendela
penyamaran/profil lain untuk pemain kedua, atau hapus `mahjong_sesi_v2` dari localStorage.

## Deploy ke Google Apps Script

### Cara A — dengan clasp (disarankan)

```bash
npm install -g @google/clasp
clasp login
cp .clasp.json.example .clasp.json   # isi scriptId proyek Apps Script Anda
npm run push                          # build + clasp push (isi folder gas/)
```

Lalu di editor Apps Script: **Deploy → New deployment → Web app**
(Execute as: *Me*, Who has access: *Anyone*). Setelah itu cukup `npm run deploy`
atau perbarui deployment yang sama.

### Cara B — salin manual

1. `npm install && npm run build`
2. Di editor Apps Script, salin isi `gas/Code.gs` ke file `Code.gs`.
3. Buat file HTML bernama **`Index`** dan tempel seluruh isi `gas/Index.html`.
4. Deploy sebagai Web app.

`gas/Index.html` hasil build ikut di-commit, jadi Cara B bisa dipakai tanpa Node.js.
