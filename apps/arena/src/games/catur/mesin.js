/**
 * Catur (2 pemain) dengan aturan lengkap: rokade, en passant, promosi, skak, skak mat, pat (stalemate),
 * remis 50 langkah, pengulangan posisi 3 kali, dan bidak tidak cukup untuk mematikan.
 * Papan: array 64, indeks = baris*8 + kolom, baris 0 = baris ke-8 (sisi hitam).
 * Bidak putih huruf besar (P N B R Q K), hitam huruf kecil, kosong ''.
 * Ronde ganjil: kursi 1 memegang putih; ronde genap warna bertukar.
 */
import { tolak, pilihAcak } from '../umum.js';

const AWAL = 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNR';
const putih = b => b && b === b.toUpperCase();
const warnaBidak = b => (b ? (putih(b) ? 'w' : 'b') : null);
const r = i => i >> 3, c = i => i & 7;
const di = (rr, cc) => (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 ? rr * 8 + cc : -1);
const KUDA = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const RAJA = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const LURUS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const MIRING = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
export const NAMA_PETAK = i => 'abcdefgh'[c(i)] + (8 - r(i));

/** Apakah petak i diserang oleh warna w. */
function diserang(p, i, w) {
  const rr = r(i), cc = c(i);
  const ada = (j, huruf) => j >= 0 && p[j] === (w === 'w' ? huruf.toUpperCase() : huruf);
  const arahPion = w === 'w' ? 1 : -1;   // pion putih menyerang dari baris di bawahnya
  if (ada(di(rr + arahPion, cc - 1), 'p') || ada(di(rr + arahPion, cc + 1), 'p')) return true;
  if (KUDA.some(([a, b]) => ada(di(rr + a, cc + b), 'n'))) return true;
  if (RAJA.some(([a, b]) => ada(di(rr + a, cc + b), 'k'))) return true;
  const geser = (arah, huruf) => arah.some(([a, b]) => {
    for (let k = 1; ; k++) {
      const j = di(rr + a * k, cc + b * k);
      if (j < 0) return false;
      if (p[j]) return huruf.some(h => ada(j, h));
    }
  });
  return geser(LURUS, ['r', 'q']) || geser(MIRING, ['b', 'q']);
}

const posisiRaja = (p, w) => p.indexOf(w === 'w' ? 'K' : 'k');
export const skak = (s, w) => diserang(s.papan, posisiRaja(s.papan, w), w === 'w' ? 'b' : 'w');

/** Langkah semu (belum dicek apakah raja sendiri jadi terserang). */
function langkahSemu(s) {
  const p = s.papan, w = s.warna, hasil = [];
  const tambah = (dari, ke, ekstra) => hasil.push(Object.assign({ dari, ke }, ekstra));
  for (let i = 0; i < 64; i++) {
    const b = p[i];
    if (!b || warnaBidak(b) !== w) continue;
    const t = b.toLowerCase(), rr = r(i), cc = c(i);
    if (t === 'p') {
      const maju = w === 'w' ? -1 : 1, barisAwal = w === 'w' ? 6 : 1, barisAkhir = w === 'w' ? 0 : 7;
      const pion = (ke, ekstra = {}) => {
        if (r(ke) === barisAkhir) ['q', 'r', 'b', 'n'].forEach(pr => tambah(i, ke, Object.assign({ promosi: pr }, ekstra)));
        else tambah(i, ke, ekstra);
      };
      const satu = di(rr + maju, cc);
      if (satu >= 0 && !p[satu]) {
        pion(satu);
        const dua = di(rr + 2 * maju, cc);
        if (rr === barisAwal && !p[dua]) tambah(i, dua, { dua: true });
      }
      [-1, 1].forEach(d => {
        const j = di(rr + maju, cc + d);
        if (j < 0) return;
        if (p[j] && warnaBidak(p[j]) !== w) pion(j);
        else if (j === s.ep) tambah(i, j, { ep: true });
      });
    } else if (t === 'n' || t === 'k') {
      (t === 'n' ? KUDA : RAJA).forEach(([a, bb]) => {
        const j = di(rr + a, cc + bb);
        if (j >= 0 && warnaBidak(p[j]) !== w) tambah(i, j);
      });
      if (t === 'k') {
        const lawan = w === 'w' ? 'b' : 'w', baris = w === 'w' ? 7 : 0;
        if (i === baris * 8 + 4 && !diserang(p, i, lawan)) {
          const hk = w === 'w' ? 'K' : 'k', hq = w === 'w' ? 'Q' : 'q';
          if (s.hak.includes(hk) && !p[i + 1] && !p[i + 2] && !diserang(p, i + 1, lawan) && !diserang(p, i + 2, lawan)) tambah(i, i + 2, { rokade: 'pendek' });
          if (s.hak.includes(hq) && !p[i - 1] && !p[i - 2] && !p[i - 3] && !diserang(p, i - 1, lawan) && !diserang(p, i - 2, lawan)) tambah(i, i - 2, { rokade: 'panjang' });
        }
      }
    } else {
      const arah = t === 'r' ? LURUS : t === 'b' ? MIRING : LURUS.concat(MIRING);
      arah.forEach(([a, bb]) => {
        for (let k = 1; ; k++) {
          const j = di(rr + a * k, cc + bb * k);
          if (j < 0) break;
          if (!p[j]) { tambah(i, j); continue; }
          if (warnaBidak(p[j]) !== w) tambah(i, j);
          break;
        }
      });
    }
  }
  return hasil;
}

/** Menerapkan langkah dan mengembalikan state baru (state lama tidak diubah). */
function terapkan(s, m) {
  const p = s.papan.slice();
  const b = p[m.dari], w = s.warna;
  let dimakan = p[m.ke];
  p[m.ke] = m.promosi ? (w === 'w' ? m.promosi.toUpperCase() : m.promosi) : b;
  p[m.dari] = '';
  if (m.ep) { const j = m.ke + (w === 'w' ? 8 : -8); dimakan = p[j]; p[j] = ''; }
  if (m.rokade === 'pendek') { p[m.ke - 1] = p[m.ke + 1]; p[m.ke + 1] = ''; }
  if (m.rokade === 'panjang') { p[m.ke + 1] = p[m.ke - 2]; p[m.ke - 2] = ''; }
  let hak = s.hak;
  const cabut = huruf => { hak = hak.replace(huruf, ''); };
  if (b === 'K') { cabut('K'); cabut('Q'); }
  if (b === 'k') { cabut('k'); cabut('q'); }
  [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']].forEach(([sq, h]) => { if (m.dari === sq || m.ke === sq) cabut(h); });
  return {
    papan: p, warna: w === 'w' ? 'b' : 'w', hak,
    ep: m.dua ? (m.dari + m.ke) / 2 : -1,
    setengah: b.toLowerCase() === 'p' || dimakan ? 0 : s.setengah + 1,
    dimakan
  };
}

export function langkahSah(s) {
  return langkahSemu(s).filter(m => {
    const t = terapkan(s, m);
    return !diserang(t.papan, posisiRaja(t.papan, s.warna), t.warna);
  });
}

const kunciPosisi = s => s.papan.join('') + s.warna + s.hak + s.ep;

function bidakKurang(p) {
  const sisa = p.filter(b => b && b.toLowerCase() !== 'k');
  return !sisa.length || (sisa.length === 1 && 'nbNB'.includes(sisa[0]));
}

function mulai(n, opsi, info) {
  const ronde = (info && info.ronde) || 1;
  const s = {
    n: 2, papan: AWAL.split('').map(x => (x === '.' ? '' : x)), warna: 'w', hak: 'KQkq', ep: -1, setengah: 0,
    putih: ronde % 2 === 1 ? 0 : 1, riwayat: {}, terakhir: null, dimakan: { w: [], b: [] }, langkah: 0, selesai: null
  };
  s.riwayat[kunciPosisi(s)] = 1;
  s.log = `Permainan dimulai. @${s.putih} memegang putih dan jalan duluan.`;
  return s;
}

const kursiWarna = (s, w) => (w === 'w' ? s.putih : 1 - s.putih);
const SIMBOL = { k: 'Raja', q: 'Menteri', r: 'Benteng', b: 'Gajah', n: 'Kuda', p: 'Pion' };

function aksi(s, p, a) {
  if (s.selesai) tolak('Permainan sudah selesai.');
  if (a.t === 'menyerah') {
    s.selesai = { pemenang: [1 - p], teks: `@${p} menyerah. @${1 - p} menang!` };
    s.log = s.selesai.teks;
    return;
  }
  if (a.t !== 'jalan') tolak('Aksi tidak dikenal.');
  const sah = langkahSah(s);
  const m = sah.find(x => x.dari === a.dari && x.ke === a.ke && (!x.promosi || x.promosi === (a.promosi || 'q')));
  if (!m) tolak('Langkah itu tidak sah.');
  const bidak = s.papan[m.dari];
  const t = terapkan(s, m);
  if (t.dimakan) s.dimakan[s.warna].push(t.dimakan);
  Object.assign(s, { papan: t.papan, warna: t.warna, hak: t.hak, ep: t.ep, setengah: t.setengah });
  s.terakhir = { dari: m.dari, ke: m.ke };
  s.langkah++;
  const k = kunciPosisi(s);
  s.riwayat[k] = (s.riwayat[k] || 0) + 1;

  let teks = `@${p} ${m.rokade ? 'rokade ' + m.rokade : `${SIMBOL[bidak.toLowerCase()]} ${NAMA_PETAK(m.dari)}→${NAMA_PETAK(m.ke)}`}`;
  if (t.dimakan) teks += `, memakan ${SIMBOL[t.dimakan.toLowerCase()]}`;
  if (m.promosi) teks += `, promosi jadi ${SIMBOL[m.promosi]}`;
  const lawan = kursiWarna(s, s.warna);
  const sedangSkak = skak(s, s.warna);
  if (!langkahSah(s).length) {
    s.selesai = sedangSkak
      ? { pemenang: [p], teks: `Skak mat! @${p} menang.` }
      : { pemenang: [], teks: 'Pat (stalemate): tidak ada langkah sah. Remis.' };
  } else if (s.setengah >= 100) s.selesai = { pemenang: [], teks: 'Remis: 50 langkah tanpa memakan atau menggerakkan pion.' };
  else if (s.riwayat[k] >= 3) s.selesai = { pemenang: [], teks: 'Remis: posisi yang sama terulang 3 kali.' };
  else if (bidakKurang(s.papan)) s.selesai = { pemenang: [], teks: 'Remis: bidak tidak cukup untuk skak mat.' };
  s.log = teks + (sedangSkak && !s.selesai ? `. Skak untuk @${lawan}!` : '.');
}

/* ---------------- BOT: alpha-beta dengan nilai bidak + posisi ---------------- */
const NILAI = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const PUSAT = Array.from({ length: 64 }, (_, i) => 6 - (Math.abs(3.5 - r(i)) + Math.abs(3.5 - c(i))) * 2);

function evaluasi(s) {   // dari sudut pandang pihak yang akan jalan
  let v = 0;
  s.papan.forEach((b, i) => {
    if (!b) return;
    const t = b.toLowerCase(), w = putih(b) ? 1 : -1;
    let x = NILAI[t];
    if (t === 'n' || t === 'b') x += PUSAT[i] * 2;
    if (t === 'p') x += (putih(b) ? 6 - r(i) : r(i) - 1) * 6 + (c(i) > 1 && c(i) < 6 ? 4 : 0);
    if (t === 'q') x += PUSAT[i] * 0.5;
    v += w * x;
  });
  return s.warna === 'w' ? v : -v;
}

function negamax(s, dalam, alfa, beta) {
  const sah = langkahSah(s);
  if (!sah.length) return skak(s, s.warna) ? -100000 - dalam : 0;
  if (dalam === 0) return evaluasi(s);
  // Urutkan: makan bidak berharga dulu
  sah.sort((a, b) => (NILAI[(s.papan[b.ke] || ' ').toLowerCase()] || 0) - (NILAI[(s.papan[a.ke] || ' ').toLowerCase()] || 0));
  let best = -Infinity;
  for (const m of sah) {
    const t = terapkan(s, m);
    const v = -negamax(Object.assign({}, s, t), dalam - 1, -beta, -alfa);
    if (v > best) best = v;
    if (v > alfa) alfa = v;
    if (alfa >= beta) break;
  }
  return best;
}

function bot(s, p, level) {
  const sah = langkahSah(s).filter(m => !m.promosi || m.promosi === 'q');
  const jadi = m => ({ t: 'jalan', dari: m.dari, ke: m.ke, promosi: m.promosi });
  if (level === 'easy') {
    const makan = sah.filter(m => s.papan[m.ke]);
    return jadi(makan.length && Math.random() < 0.5 ? pilihAcak(makan) : pilihAcak(sah));
  }
  const dalam = level === 'hard' ? 3 : 2;
  let best = [], skorBest = -Infinity;
  for (const m of sah) {
    const t = terapkan(s, m);
    const anak = Object.assign({}, s, t);
    // Hindari mengulang posisi saat sedang unggul
    const ulang = (s.riwayat[kunciPosisi(anak)] || 0) >= 2 ? -50 : 0;
    const v = -negamax(anak, dalam - 1, -Infinity, Infinity) + ulang + Math.random() * 4;
    if (v > skorBest + 0.001) { skorBest = v; best = [m]; }
  }
  return jadi(best[0] || sah[0]);
}

export default {
  mulai, aksi, bot,
  diLuarGiliran: a => a.t === 'menyerah',
  giliran: s => (s.selesai ? -1 : kursiWarna(s, s.warna)),
  hasil: s => s.selesai,
  pandangan: s => ({ ...s, riwayat: undefined, sah: s.selesai ? [] : langkahSah(s).map(m => [m.dari, m.ke, m.promosi || '']), skak: !s.selesai && skak(s, s.warna) }),
  log: s => s.log
};
