import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { panggil, pesanError, lepasMeja } from './api.js';
import { simpanSesi, hapusSesi } from './sesi.js';
import {
  POLL_MS, BOT_DELAY_MS, BOT_MACET_MS, PUTUS_MAKS_MS, PESAN_ERROR,
  samaIsi, gabungUrutan, bisaBuang, konteksHint
} from './konstanta.js';
import PanelMenang from './components/PanelMenang.jsx';

/** useState yang juga menyimpan nilai terbaru di ref (dibaca oleh timer & callback async). */
function useStateRef(awal) {
  const [nilai, setNilai] = useState(awal);
  const ref = useRef(nilai);
  const set = useCallback(x => {
    ref.current = typeof x === 'function' ? x(ref.current) : x;
    setNilai(ref.current);
  }, []);
  return [nilai, set, ref];
}

/**
 * Seluruh logika client: sinkronisasi state dengan server (polling), menjalankan BOT,
 * hitung mundur klaim/giliran, dan aksi pemain. Komponen hanya menampilkan hasilnya.
 */
export default function useMeja() {
  const [layar, setLayar, layarRef] = useStateRef('home');
  const [view, setView, viewRef] = useStateRef(null);          // state meja dari server (lastState)
  const [hand, setHand, handRef] = useStateRef([]);            // urutan tangan lokal
  const [selected, setSelected, selRef] = useStateRef(-1);
  const [pending, setPending, pendingRef] = useStateRef(0);    // aksi yang sedang dikirim
  const [hint, setHint, hintRef] = useStateRef(null);          // { data, konteks }
  const [hintMemuat, setHintMemuat] = useState(false);
  const [sibuk, setSibuk] = useState(false);                   // tombol layar awal/ruang tunggu
  const [modal, setModal] = useState(null);
  const [putus, setPutus] = useState(false);                   // tamu: sedang menyambung ulang ke host

  // Nilai yang tidak perlu memicu render
  const r = useRef({
    room: '', token: '',
    // Penanda sesi: naik setiap kali keluar meja. Respons server dari sesi lama diabaikan
    // supaya tidak "menghidupkan" kembali meja yang sudah ditinggalkan.
    gen: 0,
    lastVersion: -1, versiSejak: Date.now(),
    pollTimer: null, pollInFlight: false, pollLagi: false, botThinking: false, tickInFlight: false,
    klaimDeadline: 0, giliranDeadline: 0, gameOverShown: false, putusSejak: 0
  }).current;

  /** Panggil server; hasil diabaikan bila pemain sudah keluar meja di tengah jalan. */
  const panggilSesi = (fn, ...args) => {
    const g = r.gen;
    return new Promise((resolve, reject) => {
      panggil(fn, ...args).then(
        v => { if (g === r.gen) resolve(v); },
        e => { if (g === r.gen) reject(e); }
      );
    });
  };

  const tampilModal = useCallback((judul, teks, utama, isi) => setModal({ judul, teks, utama, isi }), []);
  const tutupModal = useCallback(() => setModal(null), []);

  /* ---------------- Navigasi ---------------- */
  const keHome = (lepas = true) => {
    r.gen++;
    if (lepas) lepasMeja();
    if (r.pollTimer) clearInterval(r.pollTimer);
    Object.assign(r, {
      pollTimer: null, room: '', token: '', lastVersion: -1,
      pollInFlight: false, botThinking: false, tickInFlight: false,
      gameOverShown: false, klaimDeadline: 0, giliranDeadline: 0, pollLagi: false, putusSejak: 0
    });
    setPutus(false);
    setView(null); setHand([]); setSelected(-1); setPending(0); setHint(null); setHintMemuat(false);
    setModal(null);
    hapusSesi();
    setLayar('home');
  };

  const tampilError = err => {
    const m = pesanError(err);
    if (m.includes('KURSI_DIPESAN:')) {
      const nama = m.split('KURSI_DIPESAN:')[1];
      return tampilModal('Kursi sudah dipesan', `Kursi kosong di meja ini dipesan untuk ${nama}. Gabung dengan nama yang sama, atau minta host mengubah pesanannya.`);
    }
    const kode = Object.keys(PESAN_ERROR).find(k => m.includes(k));
    if (['BUKAN_PEMAIN', 'KAMAR_TIDAK_ADA', 'MEJA_DITUTUP', 'HOST_PUTUS'].includes(kode) && r.room) keHome();
    tampilModal('Tidak bisa dilanjutkan', kode ? PESAN_ERROR[kode] : m);
  };

  /* ---------------- Sinkronisasi state ---------------- */
  const terapkanState = (s, dariPoll, paksa) => {
    if (!s || !r.room || s.roomCode !== r.room) return;
    if (dariPoll && pendingRef.current > 0) return;
    if (s.version < r.lastVersion) return;

    if (s.status === 'lobby') {
      r.lastVersion = s.version;
      setView(s);
      setLayar('lobby');
      return;
    }

    const berubah = s.version !== r.lastVersion;
    if (berubah || paksa || layarRef.current !== 'game') {
      const lama = viewRef.current;
      let tangan = handRef.current, sel = selRef.current;
      if (lama && s.gameId !== lama.gameId) { tangan = []; sel = -1; }
      if (berubah) { r.lastVersion = s.version; r.versiSejak = Date.now(); }
      if (s.klaim) r.klaimDeadline = Date.now() + s.klaim.sisaMs;
      r.giliranDeadline = s.sisaGiliranMs != null ? Date.now() + s.sisaGiliranMs : 0;

      const server = s.players[s.me].hand;
      if (s.gameOver) { tangan = server.slice(); sel = -1; }
      else if (!samaIsi(tangan, server)) {
        tangan = tangan.length ? gabungUrutan(tangan, server) : server.slice();
        sel = -1;
      }
      setHand(tangan);
      setSelected(sel);
      setView(s);
      setLayar('game');
      if (hintRef.current && hintRef.current.konteks !== konteksHint(s)) setHint(null);
      cekGameOver(s);
    }
    cekBot(s);
  };

  const cekGameOver = s => {
    if (!s.gameOver) { r.gameOverShown = false; return; }
    if (r.gameOverShown) return;
    r.gameOverShown = true;
    tampilModal(s.result === 'win' ? '🎉 PERMAINAN SELESAI' : '⚖️ PERMAINAN SERI', s.log,
      { label: '🔄 Ronde Berikutnya', onClick: aksiMainLagi },
      s.menang ? createElement(PanelMenang, { s, lengkap: true }) : null);
  };

  /* BOT dijalankan oleh host; pemain lain mengambil alih jika host diam. Juga menangani pemain AFK. */
  const cekBot = s => {
    if (s.status !== 'playing' || s.gameOver || s.klaim || r.botThinking) return;
    const giliranBot = s.bots && s.bots[s.turn];
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
    if (!r.room || pendingRef.current > 0 || document.hidden) return;
    if (r.pollInFlight) { r.pollLagi = true; return; }   // ada perubahan saat menunggu: ambil lagi setelahnya
    r.pollInFlight = true;
    r.pollLagi = false;
    const selesai = () => { r.pollInFlight = false; if (r.pollLagi) poll(); };
    panggilSesi('getStatusMeja', r.room, r.token).then(
      s => {
        if (r.putusSejak) { r.putusSejak = 0; setPutus(false); }
        if (s) terapkanState(s, true);
        selesai();
      },
      err => {
        const m = pesanError(err);
        if (m.includes('HOST_PUTUS')) {
          // Host mungkin hanya me-refresh halaman: coba terus sampai batas waktu
          if (!r.putusSejak) { r.putusSejak = Date.now(); setPutus(true); }
          else if (Date.now() - r.putusSejak > PUTUS_MAKS_MS) return tampilError(err);
        } else if (['BUKAN_PEMAIN', 'KAMAR_TIDAK_ADA', 'MEJA_DITUTUP'].some(k => m.includes(k))) return tampilError(err);
        selesai();
      });
  };

  /* Hitung mundur klaim & giliran (tampilan angkanya diurus komponen Hitung) */
  const tick = () => {
    const s = viewRef.current;
    if (!s || s.status !== 'playing' || s.gameOver) return;
    if (s.klaim) {
      const sisa = Math.max(0, r.klaimDeadline - Date.now());
      if (sisa === 0 && !r.tickInFlight && pendingRef.current === 0) {
        r.tickInFlight = true;
        panggilSesi('tickKlaim', r.room, r.token).then(
          ns => {
            r.tickInFlight = false;
            if (ns && ns.klaim && ns.version === r.lastVersion) r.klaimDeadline = Date.now() + Math.max(500, ns.klaim.sisaMs);
            terapkanState(ns);
          },
          () => { r.tickInFlight = false; r.klaimDeadline = Date.now() + 1000; });
      }
      return;
    }
    if (r.giliranDeadline && Date.now() >= r.giliranDeadline) cekBot(s);
  };

  // Callback terbaru disimpan di ref supaya interval/event tidak memegang closure lama
  const fnRef = useRef({});
  fnRef.current = { poll, tick };
  useEffect(() => {
    const id = setInterval(() => fnRef.current.tick(), 250);
    const onVis = () => { if (!document.hidden) fnRef.current.poll(); };
    const onBerubah = () => fnRef.current.poll();   // dikirim lapisan jaringan saat state meja berubah
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('meja-berubah', onBerubah);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('meja-berubah', onBerubah);
    };
  }, []);

  const masukKamar = (res, nama) => {
    r.room = res.view.roomCode;
    r.token = res.token;
    simpanSesi({ room: r.room, token: r.token, nama: nama || (res.view.seats[res.view.me] || {}).name });
    r.lastVersion = -1;
    terapkanState(res.view, false, true);
    if (r.pollTimer) clearInterval(r.pollTimer);
    r.pollTimer = setInterval(() => fnRef.current.poll(), POLL_MS);
  };

  /* ---------------- Layar awal ---------------- */
  const buatKamar = (kode, cfg, nama, tokenLama, paksa) => {
    setSibuk(true);
    panggil('buatKamar', kode, cfg, paksa === true, tokenLama || '').then(
      res => { setSibuk(false); masukKamar(res, nama); },
      err => {
        setSibuk(false);
        if (pesanError(err).includes('KAMAR_AKTIF')) {
          tampilModal('Meja Anda masih aktif',
            `Meja ${kode} masih berjalan. Buat ulang meja ini? Pemain yang sedang duduk akan terputus.`,
            { label: 'Buat ulang', onClick: () => buatKamar(kode, cfg, nama, tokenLama, true) });
        } else tampilError(err);
      });
  };

  const gabungKamar = (kode, nama, tokenLama) => {
    setSibuk(true);
    panggil('gabungKamar', kode, nama, tokenLama || '').then(
      res => { setSibuk(false); masukKamar(res, nama); },
      err => { setSibuk(false); tampilError(err); });
  };

  const keluarKamarSaya = () => {
    const room = r.room, tok = r.token;
    keHome(false);   // koneksi diputus oleh keluarKamar setelah pesan keluar terkirim
    if (room && tok) panggil('keluarKamar', room, tok).catch(() => {});
  };

  const lainManusia = s => s.seats.filter((x, i) => i !== s.me && x.terisi && !x.bot).length;

  const keluarLobby = () => {
    const s = viewRef.current;
    if (s && s.isHost) {
      tampilModal('Keluar dari meja?', lainManusia(s)
        ? 'Meja berjalan di perangkat Anda sebagai host, jadi meja akan ditutup untuk semua pemain.'
        : 'Anda satu-satunya pemain, jadi meja ini akan ditutup.', { label: 'Keluar', onClick: keluarKamarSaya });
    } else keluarKamarSaya();
  };

  const keluarPermainan = () => {
    const s = viewRef.current; if (!s) return;
    const pesan = s.isHost
      ? (lainManusia(s)
        ? 'Meja berjalan di perangkat Anda sebagai host. Jika Anda keluar, meja ditutup untuk semua pemain.'
        : 'Meja ini akan ditutup.')
      : 'Kursi Anda dilanjutkan BOT supaya permainan tidak berhenti. Anda atau orang lain bisa mengambil alih kursi itu lewat Gabung.';
    tampilModal('Keluar dari permainan?', pesan, { label: 'Keluar', onClick: keluarKamarSaya });
  };

  /* ---------------- Aksi ke server ---------------- */
  const paksaRefresh = () => {
    if (!r.room) return;
    panggilSesi('getStatusMeja', r.room, r.token).then(s => terapkanState(s, false, true), () => {});
  };

  const kirimAksi = (fn, args, setelahGagal) => {
    setPending(n => n + 1);
    panggilSesi(fn, ...args).then(
      s => { setPending(n => n - 1); terapkanState(s, false, true); },
      err => { setPending(n => n - 1); tampilError(err); (setelahGagal || paksaRefresh)(); });
  };

  const aturKursi = (seat, level, namaPesan) =>
    kirimAksi('aturKursi', namaPesan === undefined ? [r.room, r.token, seat, level] : [r.room, r.token, seat, level, namaPesan]);
  const ubahHint = aktif => kirimAksi('aturHint', [r.room, r.token, aktif]);
  const mulaiPermainan = () => kirimAksi('mulaiPermainan', [r.room, r.token]);

  function aksiMainLagi() {
    panggilSesi('mainLagi', r.room, r.token).then(s => terapkanState(s, false, true), tampilError);
  }

  const eksekusiBuang = idx => {
    if (pendingRef.current > 0 || !bisaBuang(viewRef.current)) return;
    const discarded = handRef.current[idx];
    const handBaru = handRef.current.slice();
    handBaru.splice(idx, 1);
    setHand(handBaru);
    setSelected(-1);
    kirimAksi('buangUbin', [r.room, r.token, handBaru, discarded]);
  };

  const aksiAmbil = () => {
    if (pendingRef.current > 0) return;
    setSelected(-1);
    kirimAksi('ambilUbin', [r.room, r.token, handRef.current.slice()], () => {});
  };

  const aksiKlaim = (aksi, pilih) => {
    if (pendingRef.current > 0) return;
    kirimAksi('klaimUbin', [r.room, r.token, aksi, pilih || 0]);
  };

  const aksiKong = tile => {
    if (pendingRef.current > 0) return;
    setSelected(-1);
    kirimAksi('deklarasiKong', [r.room, r.token, tile]);
  };

  const buangTerpilih = () => { if (selRef.current !== -1) eksekusiBuang(selRef.current); };

  /** Klik ubin: pilih → klik lagi untuk buang; klik ubin lain untuk menukar posisi. */
  const klikUbin = idx => {
    const s = viewRef.current;
    if (!s || s.gameOver || pendingRef.current > 0) return;
    const sel = selRef.current;
    if (sel === -1) setSelected(idx);
    else if (sel === idx) {
      if (bisaBuang(s)) return eksekusiBuang(idx);
      setSelected(-1);
    } else {
      const h = handRef.current.slice();
      [h[sel], h[idx]] = [h[idx], h[sel]];
      setHand(h);
      setSelected(-1);
    }
  };

  const pilihUbin = tile => {
    if (!bisaBuang(viewRef.current)) return;
    const idx = handRef.current.lastIndexOf(tile);
    if (idx !== -1) setSelected(idx);
  };

  /* ---------------- Hint ---------------- */
  const mintaHint = () => {
    const s = viewRef.current; if (!s || pendingRef.current > 0) return;
    const konteks = konteksHint(s);
    setHintMemuat(true);
    panggilSesi('mintaHint', r.room, r.token).then(
      data => {
        setHintMemuat(false);
        if (konteksHint(viewRef.current) === konteks) setHint({ data, konteks });   // situasi belum berubah
      },
      err => { setHintMemuat(false); tampilError(err); });
  };
  const tutupHint = () => setHint(null);

  return {
    layar, view, hand, selected, pending, hint, hintMemuat, sibuk, modal, putus,
    deadline: { klaim: () => r.klaimDeadline, giliran: () => r.giliranDeadline },
    tampilModal, tutupModal,
    buatKamar, gabungKamar, keluarLobby, keluarPermainan,
    aturKursi, ubahHint, mulaiPermainan,
    aksiAmbil, aksiKlaim, aksiKong, buangTerpilih, klikUbin, pilihUbin,
    mintaHint, tutupHint
  };
}
