/**
 * Uno (2–4 pemain, 108 kartu).
 * Kode kartu: warna + nilai. Warna M (merah), K (kuning), H (hijau), B (biru); nilai 0–9,
 * S (lewati), R (putar arah), D (+2). Kartu bebas: "WW" (ganti warna) dan "W4" (+4).
 * - Mainkan kartu yang warna ATAU angka/simbolnya sama dengan kartu teratas, atau kartu bebas.
 * - Tidak bisa/mau main: ambil 1 kartu; kartu itu boleh langsung dimainkan bila cocok, kalau tidak lewat.
 * - +2 / +4: pemain berikutnya mengambil 2 / 4 kartu dan kehilangan giliran.
 *   Putar arah dengan 2 pemain berlaku seperti Lewati.
 * - Yang pertama menghabiskan kartu menang.
 */
import { acak, tolak, pilihAcak } from '../umum.js';

export const WARNA_UNO = ['M', 'K', 'H', 'B'];
export const NAMA_WARNA_UNO = { M: 'Merah', K: 'Kuning', H: 'Hijau', B: 'Biru' };
const NAMA_NILAI = { S: 'Lewati', R: 'Putar', D: '+2', W: 'Ganti warna', 4: '+4' };
export const labelUno = k => (k[0] === 'W' ? (k[1] === '4' ? '+4' : 'Ganti warna') : `${NAMA_WARNA_UNO[k[0]]} ${NAMA_NILAI[k[1]] || k[1]}`);

function dekUno() {
  const dek = [];
  WARNA_UNO.forEach(w => {
    dek.push(w + '0');
    '123456789SRD'.split('').forEach(n => dek.push(w + n, w + n));
  });
  for (let i = 0; i < 4; i++) dek.push('WW', 'W4');
  return acak(dek);
}

export function bisaDimainkan(k, atas, warna) {
  if (k[0] === 'W') return true;
  return k[0] === warna || k[1] === atas[1];
}

function mulai(n, opsi, info) {
  const dek = dekUno();
  const tangan = Array.from({ length: n }, () => dek.splice(0, 7));
  // Kartu pembuka: kartu angka
  let i = dek.findIndex(k => /^[MKHB]\d$/.test(k));
  const atas = dek.splice(i, 1)[0];
  const awal = (info && info.pemenangLalu != null) ? info.pemenangLalu : 0;
  return { n, tangan, dek, buangan: [atas], warna: atas[0], arah: 1, giliran: awal, fase: 'main', diambil: null,
    log: `Ronde dimulai. Kartu pembuka ${labelUno(atas)}. @${awal} jalan duluan.`, selesai: null };
}

const berikutnya = (s, dari, langkah = 1) => ((dari + s.arah * langkah) % s.n + s.n) % s.n;

function ambilKartu(s, p, jumlah) {
  const dapat = [];
  for (let i = 0; i < jumlah; i++) {
    if (!s.dek.length) {
      if (s.buangan.length <= 1) break;
      const atas = s.buangan.pop();
      s.dek = acak(s.buangan);
      s.buangan = [atas];
    }
    const k = s.dek.pop();
    s.tangan[p].push(k);
    dapat.push(k);
  }
  return dapat;
}

function mainkan(s, p, k, warna) {
  const atas = s.buangan[s.buangan.length - 1];
  if (!bisaDimainkan(k, atas, s.warna)) tolak('Kartu itu tidak cocok dengan warna atau angka teratas.');
  if (k[0] === 'W' && !WARNA_UNO.includes(warna)) tolak('Pilih warna untuk kartu bebas.');
  s.tangan[p].splice(s.tangan[p].indexOf(k), 1);
  s.buangan.push(k);
  s.warna = k[0] === 'W' ? warna : k[0];
  s.diambil = null;
  s.fase = 'main';
  let teks = `@${p} memainkan ${labelUno(k)}` + (k[0] === 'W' ? `, warna jadi ${NAMA_WARNA_UNO[warna]}` : '');
  if (!s.tangan[p].length) {
    s.selesai = { pemenang: [p], teks: `@${p} menghabiskan kartu dan MENANG!`, sisa: s.tangan.map(t => t.length) };
    s.log = teks + '. UNO habis!';
    return;
  }
  if (s.tangan[p].length === 1) teks += '. UNO!';
  let lompat = 1;
  if (k[1] === 'R') {
    s.arah = -s.arah;
    if (s.n === 2) lompat = 2;
  } else if (k[1] === 'S') lompat = 2;
  else if (k[1] === 'D' || k === 'W4') {
    const korban = berikutnya(s, p);
    const jml = k[1] === 'D' ? 2 : 4;
    ambilKartu(s, korban, jml);
    teks += `. @${korban} mengambil ${jml} kartu dan dilewati`;
    lompat = 2;
  }
  s.giliran = berikutnya(s, p, lompat);
  s.log = teks + '.';
}

function aksi(s, p, a) {
  if (s.selesai) tolak('Permainan sudah selesai.');
  if (a.t === 'main') {
    if (!s.tangan[p].includes(a.kartu)) tolak('Kartu itu tidak ada di tangan Anda.');
    if (s.fase === 'setelahAmbil' && a.kartu !== s.diambil) tolak('Setelah mengambil, hanya kartu yang baru diambil yang boleh dimainkan.');
    return mainkan(s, p, a.kartu, a.warna);
  }
  if (a.t === 'ambil') {
    if (s.fase !== 'main') tolak('Anda sudah mengambil kartu.');
    const dapat = ambilKartu(s, p, 1);
    const atas = s.buangan[s.buangan.length - 1];
    if (dapat.length && bisaDimainkan(dapat[0], atas, s.warna)) {
      s.fase = 'setelahAmbil';
      s.diambil = dapat[0];
      s.log = `@${p} mengambil 1 kartu.`;
      return;
    }
    s.log = `@${p} mengambil 1 kartu dan lewat.`;
    s.giliran = berikutnya(s, p);
    return;
  }
  if (a.t === 'lewat') {
    if (s.fase !== 'setelahAmbil') tolak('Ambil kartu dulu.');
    s.fase = 'main';
    s.diambil = null;
    s.log = `@${p} lewat.`;
    s.giliran = berikutnya(s, p);
    return;
  }
  tolak('Aksi tidak dikenal.');
}

function warnaTerbanyak(tangan) {
  const h = { M: 0, K: 0, H: 0, B: 0 };
  tangan.forEach(k => { if (k[0] !== 'W') h[k[0]]++; });
  return WARNA_UNO.reduce((a, b) => (h[b] > h[a] ? b : a));
}

function bot(s, p, level) {
  const tangan = s.tangan[p];
  const atas = s.buangan[s.buangan.length - 1];
  let bisa = tangan.filter(k => bisaDimainkan(k, atas, s.warna));
  if (s.fase === 'setelahAmbil') bisa = bisa.filter(k => k === s.diambil);
  if (!bisa.length) return s.fase === 'setelahAmbil' ? { t: 'lewat' } : { t: 'ambil' };
  const warna = k => (k[0] === 'W' ? warnaTerbanyak(tangan.filter(x => x !== k)) : undefined);
  if (level === 'easy') { const k = pilihAcak(bisa); return { t: 'main', kartu: k, warna: k[0] === 'W' ? pilihAcak(WARNA_UNO) : undefined }; }
  const lawanBerikut = berikutnya(s, p);
  const bahaya = s.tangan[lawanBerikut].length <= 2;
  const skor = k => {
    let v = 0;
    if (k[0] === 'W') v = bahaya && k === 'W4' ? 60 : -30;         // simpan kartu bebas untuk saat terdesak
    else if ('SDR'.includes(k[1])) v = bahaya ? 50 : 15;
    else v = Number(k[1]);                                           // buang angka besar dulu
    if (k[0] === s.warna) v += 3;
    if (level === 'hard') v += tangan.filter(x => x[0] === k[0]).length * 2;   // pertahankan warna yang dominan
    return v;
  };
  bisa.sort((a, b) => skor(b) - skor(a));
  return { t: 'main', kartu: bisa[0], warna: warna(bisa[0]) };
}

function pandangan(s, p) {
  return {
    n: s.n, giliran: s.giliran, log: s.log, fase: s.fase, warna: s.warna, arah: s.arah,
    atas: s.buangan[s.buangan.length - 1], sisaDek: s.dek.length,
    tangan: s.selesai ? s.tangan : s.tangan.map((t, i) => (i === p ? t : [])),
    jumlahKartu: s.tangan.map(t => t.length),
    diambil: s.giliran === p ? s.diambil : null,
    selesai: s.selesai
  };
}

export default {
  mulai, aksi, bot, pandangan,
  giliran: s => (s.selesai ? -1 : s.giliran),
  hasil: s => s.selesai,
  log: s => s.log
};
