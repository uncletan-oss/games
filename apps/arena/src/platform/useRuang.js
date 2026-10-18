import { useCallback, useEffect, useRef, useState } from 'react';

const POLL_MS = 1500;
const BOT_DELAY_MS = 900;     // jeda aksi BOT supaya bisa diikuti mata
const BOT_MACET_MS = 6000;    // host diam: pemain lain yang menjalankan BOT
const PUTUS_MAKS_MS = 30000;  // koneksi ke host boleh putus selama ini (mis. host me-refresh)

export const PESAN_ERROR = {
  KAMAR_TIDAK_ADA: 'Meja dengan kode itu tidak ditemukan. Periksa lagi kodenya, dan pastikan host masih membuka halaman meja.',
  KAMAR_PENUH: 'Semua kursi di meja ini sudah terisi.',
  KAMAR_SUDAH_MAIN: 'Meja ini sedang bermain dan tidak ada kursi kosong.',
  BUKAN_PEMAIN: 'Anda tidak lagi duduk di meja ini. Mungkin host mengganti kursi Anda atau meja dibuat ulang.',
  KAMAR_DIPAKAI: 'Kode ini sedang dipakai meja lain. Tekan "Acak kode" untuk kode baru.',
  MEJA_DITUTUP: 'Host menutup meja ini.',
  HOST_PUTUS: 'Koneksi ke host terputus. Mungkin host menutup halaman atau internetnya bermasalah.',
  JARINGAN_GAGAL: 'Tidak bisa terhubung ke jaringan peer-to-peer. Periksa koneksi internet Anda lalu coba lagi.'
};

export const pesanError = err => ((err && err.message) ? err.message : String(err));

/* Sesi (untuk kembali ke meja setelah refresh), per game */
const kunciSesi = id => 'arena_sesi_' + id;
export function bacaSesi(id) { try { return JSON.parse(localStorage.getItem(kunciSesi(id)) || 'null'); } catch (e) { return null; } }
function simpanSesi(id, obj) { try { localStorage.setItem(kunciSesi(id), JSON.stringify(obj)); } catch (e) {} }
function hapusSesi(id) {
  const s = bacaSesi(id);
  try { localStorage.removeItem(kunciSesi(id)); } catch (e) {}
  if (s && s.nama) simpanSesi(id, { nama: s.nama });
}
/** Nama terakhir yang dipakai di game mana pun. */
export function namaTersimpan() {
  try { return localStorage.getItem('arena_nama') || ''; } catch (e) { return ''; }
}
function ingatNama(n) { try { localStorage.setItem('arena_nama', n); } catch (e) {} }

/**
 * Pengendali sisi pemain untuk satu game: sinkronisasi state dengan host, menjalankan BOT,
 * batas waktu giliran, dan aksi pemain. jaringan = { panggil, lepasMeja } dari buatJaringan().
 */
export default function useRuang(gameId, jaringan) {
  const [layar, setLayar] = useState('home');
  const [view, setView] = useState(null);
  const [pending, setPending] = useState(0);
  const [sibuk, setSibuk] = useState(false);
  const [modal, setModal] = useState(null);
  const [putus, setPutus] = useState(false);

  const r = useRef({
    room: '', token: '', gen: 0, lastVersion: -1, versiSejak: Date.now(), view: null, layar: 'home', pending: 0,
    pollTimer: null, pollInFlight: false, pollLagi: false, botThinking: false,
    giliranDeadline: 0, hasilDitampilkan: null, putusSejak: 0
  }).current;

  const panggilSesi = (fn, ...args) => {
    const g = r.gen;
    return new Promise((resolve, reject) => {
      jaringan.panggil(fn, ...args).then(v => { if (g === r.gen) resolve(v); }, e => { if (g === r.gen) reject(e); });
    });
  };

  const tampilModal = useCallback((judul, teks, utama, isi) => setModal({ judul, teks, utama, isi }), []);
  const tutupModal = useCallback(() => setModal(null), []);
  const ubahPending = d => { r.pending += d; setPending(r.pending); };
  const ubahLayar = l => { r.layar = l; setLayar(l); };

  const keHome = (lepas = true) => {
    r.gen++;
    if (lepas) jaringan.lepasMeja();
    if (r.pollTimer) clearInterval(r.pollTimer);
    Object.assign(r, { pollTimer: null, room: '', token: '', lastVersion: -1, view: null, pending: 0,
      pollInFlight: false, pollLagi: false, botThinking: false, giliranDeadline: 0, hasilDitampilkan: null, putusSejak: 0 });
    setView(null); setPending(0); setPutus(false); setModal(null);
    hapusSesi(gameId);
    ubahLayar('home');
  };

  const tampilError = err => {
    const m = pesanError(err);
    if (m.includes('KURSI_DIPESAN:')) {
      return tampilModal('Kursi sudah dipesan', `Kursi kosong di meja ini dipesan untuk ${m.split('KURSI_DIPESAN:')[1]}. Gabung dengan nama yang sama, atau minta host mengubahnya.`);
    }
    const kode = Object.keys(PESAN_ERROR).find(k => m.includes(k));
    if (['BUKAN_PEMAIN', 'KAMAR_TIDAK_ADA', 'MEJA_DITUTUP', 'HOST_PUTUS'].includes(kode) && r.room) keHome();
    tampilModal('Tidak bisa dilanjutkan', kode ? PESAN_ERROR[kode] : m);
  };

  const terapkanState = (s, dariPoll) => {
    if (!s || !r.room || s.roomCode !== r.room) return;
    if (dariPoll && r.pending > 0) return;
    if (s.version < r.lastVersion) return;
    if (s.version !== r.lastVersion) { r.lastVersion = s.version; r.versiSejak = Date.now(); }
    r.view = s;
    r.giliranDeadline = s.sisaGiliranMs != null ? Date.now() + s.sisaGiliranMs : 0;
    setView(s);
    ubahLayar(s.status === 'lobby' ? 'lobby' : 'game');
    if (s.status === 'playing') cekBot(s);
  };

  /* BOT dijalankan host; pemain lain mengambil alih bila host diam. Juga pemain yang waktunya habis. */
  const cekBot = s => {
    if (s.status !== 'playing' || s.hasil || s.giliran < 0 || r.botThinking) return;
    const giliranBot = s.seats[s.giliran] && s.seats[s.giliran].bot;
    const afk = !giliranBot && r.giliranDeadline && Date.now() >= r.giliranDeadline;
    if (!giliranBot && !afk) return;
    if (giliranBot && !s.isHost && Date.now() - r.versiSejak < BOT_MACET_MS) return;
    r.botThinking = true;
    const v = s.version, g = r.gen;
    setTimeout(() => {
      if (g !== r.gen) return;
      panggilSesi('jalankanBot', r.room, r.token, v)
        .then(ns => { r.botThinking = false; terapkanState(ns); }, () => { r.botThinking = false; });
    }, giliranBot && s.isHost ? BOT_DELAY_MS : 0);
  };

  const poll = () => {
    if (!r.room || r.pending > 0 || document.hidden) return;
    if (r.pollInFlight) { r.pollLagi = true; return; }
    r.pollInFlight = true;
    r.pollLagi = false;
    const selesai = () => { r.pollInFlight = false; if (r.pollLagi) poll(); };
    panggilSesi('getStatus', r.room, r.token).then(
      s => {
        if (r.putusSejak) { r.putusSejak = 0; setPutus(false); }
        terapkanState(s, true);
        selesai();
      },
      err => {
        const m = pesanError(err);
        if (m.includes('HOST_PUTUS')) {
          if (!r.putusSejak) { r.putusSejak = Date.now(); setPutus(true); }
          else if (Date.now() - r.putusSejak > PUTUS_MAKS_MS) return tampilError(err);
        } else if (['BUKAN_PEMAIN', 'KAMAR_TIDAK_ADA', 'MEJA_DITUTUP'].some(k => m.includes(k))) return tampilError(err);
        selesai();
      });
  };

  const tick = () => {
    const s = r.view;
    if (s && s.status === 'playing' && !s.hasil && r.giliranDeadline && Date.now() >= r.giliranDeadline) cekBot(s);
  };

  const fnRef = useRef({});
  fnRef.current = { poll, tick };
  useEffect(() => {
    const id = setInterval(() => fnRef.current.tick(), 500);
    const onVis = () => { if (!document.hidden) fnRef.current.poll(); };
    const onBerubah = () => fnRef.current.poll();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('meja-berubah', onBerubah);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('meja-berubah', onBerubah);
      // Meninggalkan halaman game (kembali ke daftar game): hentikan sinkronisasi, sesi tetap disimpan
      r.gen++;
      if (r.pollTimer) clearInterval(r.pollTimer);
    };
  }, []);

  const masukKamar = (res, nama) => {
    r.room = res.view.roomCode;
    r.token = res.token;
    simpanSesi(gameId, { room: r.room, token: r.token, nama: nama || (res.view.seats[res.view.me] || {}).name });
    if (nama) ingatNama(nama);
    r.lastVersion = -1;
    terapkanState(res.view);
    if (r.pollTimer) clearInterval(r.pollTimer);
    r.pollTimer = setInterval(() => fnRef.current.poll(), POLL_MS);
  };

  const buatKamar = (kode, cfg, nama, tokenLama, paksa) => {
    setSibuk(true);
    jaringan.panggil('buatKamar', kode, cfg, paksa === true, tokenLama || '').then(
      res => { setSibuk(false); masukKamar(res, nama); },
      err => {
        setSibuk(false);
        if (pesanError(err).includes('KAMAR_AKTIF')) {
          tampilModal('Meja Anda masih aktif', `Meja ${kode} masih berjalan. Buat ulang meja ini? Pemain yang sedang duduk akan terputus.`,
            { label: 'Buat ulang', onClick: () => buatKamar(kode, cfg, nama, tokenLama, true) });
        } else tampilError(err);
      });
  };

  const gabungKamar = (kode, nama, tokenLama) => {
    setSibuk(true);
    jaringan.panggil('gabungKamar', kode, nama, tokenLama || '').then(
      res => { setSibuk(false); masukKamar(res, nama); },
      err => { setSibuk(false); tampilError(err); });
  };

  const keluarKamarSaya = () => {
    const room = r.room, tok = r.token;
    keHome(false);
    if (room && tok) jaringan.panggil('keluarKamar', room, tok).catch(() => {});
  };

  const keluar = () => {
    const s = r.view;
    if (!s) return keluarKamarSaya();
    const lain = s.seats.filter((x, i) => i !== s.me && x.terisi && !x.bot).length;
    const teks = s.isHost
      ? (lain ? 'Meja berjalan di perangkat Anda sebagai host. Jika Anda keluar, meja ditutup untuk semua pemain.' : 'Meja ini akan ditutup.')
      : (s.status === 'playing' ? 'Kursi Anda dilanjutkan BOT supaya permainan tidak berhenti.' : 'Anda akan meninggalkan ruang tunggu.');
    tampilModal('Keluar dari meja?', teks, { label: 'Keluar', onClick: keluarKamarSaya });
  };

  const kirim = (fn, args) => {
    ubahPending(1);
    panggilSesi(fn, r.room, r.token, ...args).then(
      s => { ubahPending(-1); terapkanState(s); },
      err => { ubahPending(-1); tampilError(err); poll(); });
  };

  return {
    gameId, layar, view, pending, sibuk, modal, putus,
    deadlineGiliran: () => r.giliranDeadline,
    tampilModal, tutupModal,
    buatKamar, gabungKamar, keluar,
    aturKursi: (seat, level, namaPesan) => kirim('aturKursi', namaPesan === undefined ? [seat, level] : [seat, level, namaPesan]),
    mulaiPermainan: () => kirim('mulaiPermainan', []),
    mainLagi: () => kirim('mainLagi', []),
    aksi: a => { if (r.pending === 0) kirim('aksi', [a]); }
  };
}
