/**
 * Lapisan jaringan peer-to-peer (WebRTC lewat PeerJS) — pengganti google.script.run.
 *
 * - HOST  : browser yang membuat meja. Mesin permainan (server/mesin.js) berjalan di sini,
 *           dan host menerima panggilan API dari pemain lain lewat koneksi data WebRTC.
 * - TAMU  : browser yang bergabung. Setiap panggilan API dikirim ke host lalu menunggu jawabannya.
 *
 * Kode meja dipakai sebagai ID peer host, jadi tamu cukup tahu kodenya untuk tersambung.
 * Server PeerJS hanya dipakai untuk "perkenalan" (signaling); data permainan dikirim langsung antar-browser.
 */
import Peer from 'peerjs';
import * as mesin from './server/mesin.js';

const AWALAN_ID = 'uncletanmahjong';
const BATAS_TUNGGU_MS = 12000;
// Fungsi yang tidak mengubah state (tidak perlu memberi tahu tamu lain)
const BACA_SAJA = ['getStatusMeja', 'mintaHint', 'daftarKamar'];
// Fungsi yang tidak boleh dipanggil tamu dari jauh
const KHUSUS_HOST = ['buatKamar', 'daftarKamar'];

/** Server signaling: default server publik PeerJS; bisa diganti lewat variabel VITE_PEER_*. */
function opsiPeer() {
  const env = import.meta.env;
  const o = { debug: 0 };
  if (env.VITE_PEER_HOST) {
    o.host = env.VITE_PEER_HOST;
    o.port = Number(env.VITE_PEER_PORT) || 443;
    o.path = env.VITE_PEER_PATH || '/';
    o.secure = env.VITE_PEER_SECURE !== 'false';
  }
  return o;
}

/** ID peer hanya boleh huruf/angka, jadi kode meja diubah ke heksadesimal. */
function idMeja(kode) {
  return AWALAN_ID + Array.from(new TextEncoder().encode(kode)).map(b => b.toString(16).padStart(2, '0')).join('');
}

let peran = null;            // 'host' | 'tamu' | null
let peer = null;
let kodeAktif = '';
let ditutupHost = false;     // tamu: host sudah menutup meja
const tamu = new Set();      // host: koneksi tamu yang terbuka
let koneksi = null;          // tamu: koneksi ke host
let menyambung = null;       // tamu: Promise penyambungan yang sedang berjalan
const menunggu = new Map();  // tamu: id pesan → { resolve, reject, timer }
let nomorPesan = 0;

const galat = kode => new Error(kode);
const salinJson = x => (x === undefined ? null : JSON.parse(JSON.stringify(x)));

/** Memberi tahu UI di browser ini bahwa state meja berubah (UI langsung mengambil state baru). */
function beriTahuUi() { setTimeout(() => window.dispatchEvent(new Event('meja-berubah')), 0); }

function putuskan() {
  menunggu.forEach(m => { clearTimeout(m.timer); m.reject(galat('HOST_PUTUS')); });
  menunggu.clear();
  tamu.forEach(c => { try { c.close(); } catch (e) {} });
  tamu.clear();
  if (koneksi) { try { koneksi.close(); } catch (e) {} }
  if (peer) { try { peer.destroy(); } catch (e) {} }
  peer = null; koneksi = null; menyambung = null; peran = null; kodeAktif = ''; ditutupHost = false;
}

function tungguBuka(p) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(galat('JARINGAN_GAGAL')), BATAS_TUNGGU_MS);
    p.on('open', () => { clearTimeout(t); resolve(p); });
    p.on('error', e => { clearTimeout(t); reject(e); });
  });
}

/* ================================ HOST ================================ */

function jalankanLokal(fn, args) {
  const hasil = salinJson(mesin[fn](...args));
  if (BACA_SAJA.indexOf(fn) === -1) {
    tamu.forEach(c => { if (c.open) c.send({ t: 'berubah' }); });
    beriTahuUi();
  }
  return hasil;
}

function layaniTamu(c) {
  c.on('open', () => tamu.add(c));
  c.on('close', () => tamu.delete(c));
  c.on('error', () => tamu.delete(c));
  c.on('data', pesan => {
    if (!pesan || pesan.t !== 'rpc') return;
    let balasan;
    try {
      if (KHUSUS_HOST.indexOf(pesan.fn) !== -1 || typeof mesin[pesan.fn] !== 'function' || /_$/.test(pesan.fn) || pesan.fn === 'adalahHostLokal') {
        throw new Error('Fungsi tidak dikenal.');
      }
      const args = Array.isArray(pesan.args) ? pesan.args.slice() : [];
      args[0] = kodeAktif;   // tamu hanya boleh menyentuh meja yang sedang dibuka host ini
      balasan = { t: 'hasil', id: pesan.id, ok: true, data: jalankanLokal(pesan.fn, args) };
    } catch (e) {
      balasan = { t: 'hasil', id: pesan.id, ok: false, error: e && e.message ? e.message : String(e) };
    }
    if (c.open) c.send(balasan);
  });
}

/** Selain host, semua kursi BOT: meja tetap bisa dimainkan tanpa internet. */
function semuaBot(view) {
  return view.seats.every((x, i) => i === view.me || x.bot);
}

/**
 * Mendaftarkan ID peer meja. ID mungkin masih "dipegang" sesaat setelah refresh, jadi dicoba ulang.
 * bolehOffline: bila jaringan tidak tersedia, meja tetap dibuka hanya di perangkat ini.
 */
async function bukaMeja(kode, bolehOffline) {
  const offline = () => { peran = 'host'; kodeAktif = kode; };
  if (bolehOffline && navigator.onLine === false) return offline();
  for (let coba = 0; ; coba++) {
    const p = new Peer(idMeja(kode), opsiPeer());
    try {
      await tungguBuka(p);
      peer = p;
      peran = 'host';
      kodeAktif = kode;
      p.on('connection', layaniTamu);
      // Terputus dari server signaling: sambung lagi supaya tamu baru tetap bisa masuk
      p.on('disconnected', () => setTimeout(() => { if (peer === p && !p.destroyed) p.reconnect(); }, 1500));
      p.on('error', () => {});
      return;
    } catch (e) {
      p.destroy();
      if (e && e.type === 'unavailable-id') {
        if (coba < 4) { await new Promise(r => setTimeout(r, 2500)); continue; }
        throw galat('KAMAR_DIPAKAI');
      }
      if (bolehOffline) return offline();
      throw galat('JARINGAN_GAGAL');
    }
  }
}

/* ================================ TAMU ================================ */

function terimaDariHost(pesan) {
  if (!pesan) return;
  if (pesan.t === 'berubah') return beriTahuUi();
  if (pesan.t === 'tutup') { ditutupHost = true; return beriTahuUi(); }
  if (pesan.t === 'hasil') {
    const m = menunggu.get(pesan.id);
    if (!m) return;
    menunggu.delete(pesan.id);
    clearTimeout(m.timer);
    if (pesan.ok) m.resolve(pesan.data); else m.reject(new Error(pesan.error));
  }
}

function sambungKeHost(kode) {
  if (koneksi && koneksi.open && kodeAktif === kode) return Promise.resolve();
  if (menyambung && kodeAktif === kode) return menyambung;
  if (kodeAktif !== kode) putuskan();
  peran = 'tamu';
  kodeAktif = kode;
  menyambung = (async () => {
    if (!peer || peer.destroyed) {
      peer = new Peer(opsiPeer());
      try { await tungguBuka(peer); } catch (e) { peer.destroy(); peer = null; throw galat('JARINGAN_GAGAL'); }
    } else if (peer.disconnected) {
      peer.reconnect();
    }
    const p = peer;
    koneksi = await new Promise((resolve, reject) => {
      const c = p.connect(idMeja(kode), { reliable: true, serialization: 'json' });
      const t = setTimeout(() => { c.close(); reject(galat('KAMAR_TIDAK_ADA')); }, BATAS_TUNGGU_MS);
      const gagal = e => {
        if (e && e.type === 'peer-unavailable') { clearTimeout(t); reject(galat('KAMAR_TIDAK_ADA')); }
      };
      p.on('error', gagal);
      c.on('open', () => { clearTimeout(t); p.off('error', gagal); resolve(c); });
    });
    koneksi.on('data', terimaDariHost);
    koneksi.on('close', () => {
      koneksi = null;
      menunggu.forEach(m => { clearTimeout(m.timer); m.reject(galat('HOST_PUTUS')); });
      menunggu.clear();
    });
  })();
  return menyambung.finally(() => { menyambung = null; });
}

async function kirimKeHost(fn, args) {
  if (ditutupHost) throw galat('MEJA_DITUTUP');
  try { await sambungKeHost(kodeAktif); }
  catch (e) { throw galat(e.message === 'KAMAR_TIDAK_ADA' ? 'HOST_PUTUS' : e.message); }
  return new Promise((resolve, reject) => {
    const id = ++nomorPesan;
    const timer = setTimeout(() => { menunggu.delete(id); reject(galat('Host tidak merespons, coba lagi.')); }, BATAS_TUNGGU_MS);
    menunggu.set(id, { resolve, reject, timer });
    koneksi.send({ t: 'rpc', id, fn, args });
  });
}

/* ============================ API untuk UI ============================ */

/** Memanggil fungsi server: di host dijalankan langsung, di tamu dikirim ke host. */
export async function panggil(fn, ...args) {
  if (fn === 'daftarKamar') return [];

  if (fn === 'buatKamar') {
    putuskan();
    const kode = mesin.normalKode_(args[0]);
    const hasil = salinJson(mesin.buatKamar(kode, ...args.slice(1)));
    try { await bukaMeja(kode, semuaBot(hasil.view)); }
    catch (e) { mesin.hapusKamar_(kode); throw e; }
    return hasil;
  }

  if (fn === 'gabungKamar') {
    const kode = mesin.normalKode_(args[0]);
    // Meja ini milik perangkat ini (host me-refresh halaman): buka lagi mejanya
    if (mesin.adalahHostLokal(kode, args[2])) {
      if (peran !== 'host' || kodeAktif !== kode) {
        putuskan();
        await bukaMeja(kode, semuaBot(mesin.getStatusMeja(kode, args[2])));
      }
      return jalankanLokal('gabungKamar', [kode, ...args.slice(1)]);
    }
    await sambungKeHost(kode);
    return kirimKeHost(fn, [kode, ...args.slice(1)]);
  }

  if (fn === 'keluarKamar') {
    if (peran === 'host') {
      // Server ada di browser host, jadi meja ditutup untuk semua orang
      tamu.forEach(c => { if (c.open) c.send({ t: 'tutup' }); });
      mesin.hapusKamar_(kodeAktif);
      setTimeout(putuskan, 300);
      return null;
    }
    try { return await kirimKeHost(fn, args); } finally { putuskan(); }
  }

  if (peran === 'host') return jalankanLokal(fn, args);
  if (peran === 'tamu') return kirimKeHost(fn, args);
  throw galat('BUKAN_PEMAIN');
}

/** Dipakai UI saat kembali ke layar awal tanpa lewat tombol Keluar (mis. setelah error). */
export function lepasMeja() {
  if (peran === 'host') return;   // host tetap membuka meja; tamu masih bisa bermain dengan BOT
  putuskan();
}

export function adalahHost() { return peran === 'host'; }
