/**
 * Ludo (2–4 pemain).
 * - Bidak keluar dari kandang dengan angka 6.
 * - Angka 6, memakan bidak lawan, atau memasukkan bidak ke rumah = lempar lagi (6 tiga kali berturut-turut = giliran hangus).
 * - Mendarat di petak lawan (bukan petak aman ★) mengembalikan bidak lawan ke kandang.
 * - Masuk rumah harus dengan angka pas. Menang bila keempat bidak sampai rumah.
 *
 * Posisi bidak (relatif terhadap pemiliknya): -1 kandang, 0..50 lintasan, 51..55 jalur rumah, 56 sampai.
 */
import { lemparDadu, tolak, pilihAcak } from '../umum.js';

export const SELESAI = 56;
export const AMAN = [0, 8, 13, 21, 26, 34, 39, 47];   // petak start & bintang (indeks lintasan absolut)
const WARNA_UNTUK = { 2: [0, 2], 3: [0, 1, 2], 4: [0, 1, 2, 3] };

export const absolut = (warna, pos) => (warna * 13 + pos) % 52;

function mulai(n) {
  const warna = WARNA_UNTUK[n];
  return {
    n, warna,
    bidak: warna.map(() => [-1, -1, -1, -1]),
    giliran: 0,
    fase: 'lempar',      // 'lempar' | 'jalan'
    dadu: null,
    enam: 0,             // jumlah 6 berturut-turut
    bisa: [],            // bidak yang boleh dijalankan
    log: 'Permainan dimulai. Lempar dadu!',
    selesai: null
  };
}

function langkahSah(s, p, d) {
  return s.bidak[p].map((pos, i) => {
    if (pos === SELESAI) return -1;
    if (pos === -1) return d === 6 ? i : -1;
    return pos + d <= SELESAI ? i : -1;
  }).filter(i => i !== -1);
}

/** Siapa yang menempati petak lintasan absolut (untuk memakan & menilai bahaya). */
function penghuni(s, abs) {
  const hasil = [];
  s.bidak.forEach((bs, p) => bs.forEach((pos, i) => {
    if (pos >= 0 && pos <= 50 && absolut(s.warna[p], pos) === abs) hasil.push({ p, i });
  }));
  return hasil;
}

function giliranBerikut(s) {
  s.giliran = (s.giliran + 1) % s.n;
  s.enam = 0;
  s.fase = 'lempar';
  s.bisa = [];
}

function lempar(s, p) {
  const d = lemparDadu();
  s.dadu = d;
  s.enam = d === 6 ? s.enam + 1 : 0;
  if (s.enam === 3) {
    s.log = `@${p} melempar 6 tiga kali — giliran hangus.`;
    return giliranBerikut(s);
  }
  s.bisa = langkahSah(s, p, d);
  if (!s.bisa.length) {
    s.log = `@${p} melempar ${d}, tidak ada bidak yang bisa jalan.`;
    if (d === 6) { s.fase = 'lempar'; return; }
    return giliranBerikut(s);
  }
  s.fase = 'jalan';
  s.log = `@${p} melempar ${d}.`;
  if (s.bisa.length === 1) jalan(s, p, s.bisa[0]);   // hanya satu pilihan: jalan otomatis
}

function jalan(s, p, i) {
  if (!s.bisa.includes(i)) tolak('Bidak itu tidak bisa dijalankan.');
  const d = s.dadu;
  const lama = s.bidak[p][i];
  const baru = lama === -1 ? 0 : lama + d;
  s.bidak[p][i] = baru;
  let bonus = d === 6;
  let teks = lama === -1 ? `@${p} mengeluarkan bidak dari kandang` : `@${p} menjalankan bidak ${d} langkah`;

  if (baru <= 50) {
    const abs = absolut(s.warna[p], baru);
    if (!AMAN.includes(abs)) {
      const lawan = penghuni(s, abs).filter(x => x.p !== p);
      if (lawan.length) {
        lawan.forEach(x => { s.bidak[x.p][x.i] = -1; });
        teks += ` dan memakan bidak @${lawan[0].p}!`;
        bonus = true;
      }
    }
  } else if (baru === SELESAI) {
    teks += ' — bidak sampai di rumah!';
    bonus = true;
  }

  if (s.bidak[p].every(x => x === SELESAI)) {
    s.selesai = { pemenang: [p], teks: `@${p} memasukkan keempat bidak dan MENANG!` };
    s.log = teks + '.';
    s.fase = 'selesai';
    return;
  }
  s.log = teks + (bonus ? '. Lempar lagi!' : '.');
  s.bisa = [];
  if (bonus) s.fase = 'lempar';
  else giliranBerikut(s);
}

function aksi(s, p, a) {
  if (s.selesai) tolak('Permainan sudah selesai.');
  if (a.t === 'lempar') { if (s.fase !== 'lempar') tolak('Jalankan bidak dulu.'); return lempar(s, p); }
  if (a.t === 'jalan') { if (s.fase !== 'jalan') tolak('Lempar dadu dulu.'); return jalan(s, p, a.bidak); }
  tolak('Aksi tidak dikenal.');
}

/** BOT: nilai tiap langkah (makan, masuk rumah, keluar kandang, aman, hindari bahaya). */
function bot(s, p, level) {
  if (s.fase === 'lempar') return { t: 'lempar' };
  if (level === 'easy') return { t: 'jalan', bidak: pilihAcak(s.bisa) };
  const d = s.dadu;
  let terbaik = s.bisa[0], skorTerbaik = -Infinity;
  s.bisa.forEach(i => {
    const lama = s.bidak[p][i];
    const baru = lama === -1 ? 0 : lama + d;
    let skor = baru / 10;
    if (lama === -1) skor += 30;
    if (baru === SELESAI) skor += 45;
    else if (baru > 50) skor += 25;
    else {
      const abs = absolut(s.warna[p], baru);
      const aman = AMAN.includes(abs);
      if (!aman && penghuni(s, abs).some(x => x.p !== p)) skor += 60;
      if (aman) skor += 12;
      if (!aman && level === 'hard') {
        // Bahaya: bidak lawan 1–6 petak di belakang petak tujuan
        const terancam = s.bidak.some((bs, q) => q !== p && bs.some(pos => {
          if (pos < 0 || pos > 50) return false;
          const jarak = (abs - absolut(s.warna[q], pos) + 52) % 52;
          return jarak >= 1 && jarak <= 6;
        }));
        if (terancam) skor -= 25;
      }
      if (level === 'hard' && lama >= 0 && lama <= 50 && !AMAN.includes(absolut(s.warna[p], lama))) skor += 5;
    }
    if (skor > skorTerbaik) { skorTerbaik = skor; terbaik = i; }
  });
  return { t: 'jalan', bidak: terbaik };
}

export default {
  id: 'ludo',
  mulai,
  aksi,
  bot,
  giliran: s => (s.selesai ? -1 : s.giliran),
  hasil: s => s.selesai,
  pandangan: s => s,   // tidak ada informasi tersembunyi
  log: s => s.log
};
