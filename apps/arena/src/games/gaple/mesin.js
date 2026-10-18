/**
 * Gaple / domino (2–4 pemain, 28 kartu balak 0–6, masing-masing 7 kartu).
 * - Ronde pertama dibuka pemegang balak 6 [6|6] (bila tidak terbagi: balak tertinggi).
 *   Ronde berikutnya dibuka pemenang ronde sebelumnya dengan kartu apa saja.
 * - Kartu harus cocok dengan salah satu ujung rantai. Tidak punya kartu yang cocok = lewat (ketuk).
 * - Yang pertama menghabiskan kartu menang. Bila semua pemain buntu (tidak ada yang bisa jalan),
 *   pemenangnya pemain dengan jumlah mata terkecil.
 */
import { acak, tolak, pilihAcak } from '../umum.js';

export const mata = d => d[0] + d[1];
const sama = (a, b) => (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);

function dekDomino() {
  const dek = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) dek.push([a, b]);
  return acak(dek);
}

function mulai(n, opsi, info) {
  const dek = dekDomino();
  const tangan = Array.from({ length: n }, () => dek.splice(0, 7));
  let awal, wajib = null;
  if (info && info.pemenangLalu != null) awal = info.pemenangLalu;
  else {
    for (let v = 6; v >= 0 && awal == null; v--) {
      const p = tangan.findIndex(t => t.some(d => d[0] === v && d[1] === v));
      if (p !== -1) { awal = p; wajib = [v, v]; }
    }
    if (awal == null) awal = 0;
  }
  return {
    n, tangan, giliran: awal, wajib,
    rantai: [],          // [{ d: [kiri, kanan], p }] berurutan dari ujung kiri ke kanan
    lewatBeruntun: 0,
    log: wajib ? `Ronde dimulai. @${awal} membuka dengan balak ${wajib[0]}.` : `Ronde dimulai. @${awal} membuka.`,
    selesai: null
  };
}

const ujung = s => (s.rantai.length ? [s.rantai[0].d[0], s.rantai[s.rantai.length - 1].d[1]] : null);

/** Ke ujung mana saja kartu ini bisa dipasang. */
export function sisiSah(s, d) {
  const u = ujung(s);
  if (!u) return ['kiri'];
  const hasil = [];
  if (d[0] === u[0] || d[1] === u[0]) hasil.push('kiri');
  if (d[0] === u[1] || d[1] === u[1]) hasil.push('kanan');
  return hasil;
}

const bisaJalan = (s, p) => s.tangan[p].some(d => sisiSah(s, d).length);

function aksi(s, p, a) {
  if (s.selesai) tolak('Permainan sudah selesai.');
  if (a.t === 'main') {
    const i = s.tangan[p].findIndex(d => sama(d, a.kartu));
    if (i === -1) tolak('Kartu itu tidak ada di tangan Anda.');
    const d = s.tangan[p][i];
    if (s.wajib && !sama(d, s.wajib)) tolak(`Langkah pertama wajib balak ${s.wajib[0]}.`);
    const sisi = sisiSah(s, d);
    if (!sisi.length) tolak('Kartu ini tidak cocok dengan ujung rantai.');
    const ke = sisi.includes(a.sisi) ? a.sisi : sisi[0];
    const u = ujung(s);
    let pasang;
    if (!u) pasang = [d[0], d[1]];
    else if (ke === 'kiri') pasang = d[1] === u[0] ? [d[0], d[1]] : [d[1], d[0]];
    else pasang = d[0] === u[1] ? [d[0], d[1]] : [d[1], d[0]];
    if (ke === 'kiri') s.rantai.unshift({ d: pasang, p }); else s.rantai.push({ d: pasang, p });
    s.tangan[p].splice(i, 1);
    s.wajib = null;
    s.lewatBeruntun = 0;
    s.log = `@${p} memasang [${d[0]}|${d[1]}].`;
    if (!s.tangan[p].length) {
      s.selesai = { pemenang: [p], teks: `@${p} GAPLE! Kartu habis dan menang.`, mata: s.tangan.map(t => t.reduce((x, y) => x + mata(y), 0)) };
      return;
    }
    s.giliran = (p + 1) % s.n;
    return;
  }
  if (a.t === 'lewat') {
    if (bisaJalan(s, p)) tolak('Anda masih punya kartu yang bisa dipasang.');
    s.lewatBeruntun++;
    s.log = `@${p} lewat (ketuk).`;
    if (s.lewatBeruntun >= s.n) {
      const jumlah = s.tangan.map(t => t.reduce((x, y) => x + mata(y), 0));
      const min = Math.min(...jumlah);
      const p2 = jumlah.indexOf(min);
      s.selesai = { pemenang: [p2], teks: `Semua buntu. @${p2} menang dengan mata terkecil (${min}).`, mata: jumlah };
      return;
    }
    s.giliran = (p + 1) % s.n;
    return;
  }
  tolak('Aksi tidak dikenal.');
}

function bot(s, p, level) {
  const pilihan = [];
  s.tangan[p].forEach(d => {
    if (s.wajib && !sama(d, s.wajib)) return;
    sisiSah(s, d).forEach(sisi => pilihan.push({ d, sisi }));
  });
  if (!pilihan.length) return { t: 'lewat' };
  if (level === 'easy') { const x = pilihAcak(pilihan); return { t: 'main', kartu: x.d, sisi: x.sisi }; }
  const tangan = s.tangan[p];
  const skor = x => {
    let v = mata(x.d) + (x.d[0] === x.d[1] ? 4 : 0);   // buang mata besar & balak lebih dulu
    if (level === 'hard') {
      // Sisakan ujung rantai berangka yang masih banyak kita pegang (lawan cenderung buntu)
      const u = ujung(s);
      const ujungBaru = !u ? x.d : (x.sisi === 'kiri' ? [x.d[0] === u[0] ? x.d[1] : x.d[0], u[1]] : [u[0], x.d[0] === u[1] ? x.d[1] : x.d[0]]);
      const sisaTangan = tangan.filter(d => d !== x.d);
      ujungBaru.forEach(n => { v += sisaTangan.filter(d => d[0] === n || d[1] === n).length * 3; });
    }
    return v;
  };
  pilihan.sort((a, b) => skor(b) - skor(a));
  return { t: 'main', kartu: pilihan[0].d, sisi: pilihan[0].sisi };
}

function pandangan(s, p) {
  return {
    n: s.n, giliran: s.giliran, log: s.log, rantai: s.rantai, ujung: ujung(s), wajib: s.wajib,
    tangan: s.selesai ? s.tangan : s.tangan.map((t, i) => (i === p ? t : [])),
    jumlahKartu: s.tangan.map(t => t.length),
    selesai: s.selesai
  };
}

export default {
  id: 'gaple', mulai, aksi, bot, pandangan,
  giliran: s => (s.selesai ? -1 : s.giliran),
  hasil: s => s.selesai,
  log: s => s.log
};
