/**
 * Congklak / dakon (2 pemain). Tiap pemain punya 7 lubang kecil (masing-masing 7 biji) dan 1 lumbung.
 * Indeks: 0–6 lubang pemain 1, 7 lumbung pemain 1, 8–14 lubang pemain 2, 15 lumbung pemain 2.
 * - Pilih satu lubang sendiri, sebar bijinya satu per satu berlawanan arah jarum jam
 *   (melewati lumbung lawan, mengisi lumbung sendiri).
 * - Biji terakhir jatuh di lubang berisi (bukan lumbung): ambil semua isinya dan lanjut menyebar.
 * - Biji terakhir jatuh di lumbung sendiri: main lagi.
 * - Biji terakhir jatuh di lubang kosong milik sendiri: "tembak" — biji itu dan isi lubang lawan
 *   di seberangnya masuk lumbung. Lubang kosong milik lawan: giliran selesai.
 * - Permainan berakhir bila pemain yang mendapat giliran tidak punya biji; sisa biji masuk lumbung pemiliknya.
 *   Lumbung terbanyak menang.
 */
import { tolak, pilihAcak } from '../umum.js';

export const LUMBUNG = [7, 15];
export const lubangMilik = p => Array.from({ length: 7 }, (_, i) => p * 8 + i);
const seberang = i => 14 - i;
const pemilik = i => (i < 8 ? 0 : 1);

function mulai(n, opsi, info) {
  const lubang = Array(16).fill(7);
  lubang[7] = 0; lubang[15] = 0;
  const awal = (info && info.pemenangLalu != null) ? info.pemenangLalu : 0;
  return { n: 2, lubang, giliran: awal, terakhir: null, log: `Permainan dimulai. @${awal} jalan duluan.`, selesai: null };
}

/** Menjalankan satu langkah pada salinan papan. Hasil: { lubang, mainLagi, tembak, jejak }. */
export function sebar(lubangAwal, p, mulaiDari) {
  const lubang = lubangAwal.slice();
  const lawan = LUMBUNG[1 - p];
  let tangan = lubang[mulaiDari];
  lubang[mulaiDari] = 0;
  let i = mulaiDari, jejak = [mulaiDari], putaran = 0;
  for (;;) {
    while (tangan > 0) {
      i = (i + 1) % 16;
      if (i === lawan) continue;
      lubang[i]++;
      tangan--;
    }
    jejak.push(i);
    if (i === LUMBUNG[p]) return { lubang, mainLagi: true, tembak: 0, jejak };
    if (lubang[i] > 1 && ++putaran < 200) {   // lubang berisi: ambil dan lanjut
      tangan = lubang[i];
      lubang[i] = 0;
      continue;
    }
    if (pemilik(i) === p && lubang[i] === 1 && lubang[seberang(i)] > 0) {
      const dapat = lubang[seberang(i)] + 1;
      lubang[LUMBUNG[p]] += dapat;
      lubang[i] = 0;
      lubang[seberang(i)] = 0;
      return { lubang, mainLagi: false, tembak: dapat, jejak };
    }
    return { lubang, mainLagi: false, tembak: 0, jejak };
  }
}

const punyaBiji = (lubang, p) => lubangMilik(p).some(i => lubang[i] > 0);

function cekAkhir(s) {
  const g = s.giliran;
  if (punyaBiji(s.lubang, g)) return;
  [0, 1].forEach(p => lubangMilik(p).forEach(i => { s.lubang[LUMBUNG[p]] += s.lubang[i]; s.lubang[i] = 0; }));
  const [a, b] = [s.lubang[7], s.lubang[15]];
  const pemenang = a === b ? [] : [a > b ? 0 : 1];
  s.selesai = { pemenang, teks: a === b ? `Seri ${a}–${b}.` : `@${pemenang[0]} menang ${Math.max(a, b)}–${Math.min(a, b)}!`, lumbung: [a, b] };
}

function aksi(s, p, a) {
  if (s.selesai) tolak('Permainan sudah selesai.');
  if (a.t !== 'pilih') tolak('Aksi tidak dikenal.');
  const i = Number(a.lubang);
  if (!lubangMilik(p).includes(i)) tolak('Pilih lubang di sisi Anda.');
  if (!s.lubang[i]) tolak('Lubang itu kosong.');
  const h = sebar(s.lubang, p, i);
  s.lubang = h.lubang;
  s.terakhir = { p, dari: i, jejak: h.jejak };
  let teks = `@${p} memilih lubang ${i - p * 8 + 1}`;
  if (h.mainLagi) teks += ', biji terakhir masuk lumbung — main lagi!';
  else if (h.tembak) teks += `, menembak dan mendapat ${h.tembak} biji!`;
  else teks += '.';
  s.log = teks;
  if (!h.mainLagi) s.giliran = 1 - p;
  else if (!punyaBiji(s.lubang, p)) s.giliran = 1 - p;
  cekAkhir(s);
}

/** Nilai posisi untuk p: selisih lumbung (plus biji di sisi sendiri sedikit). */
const nilai = (lubang, p) => lubang[LUMBUNG[p]] - lubang[LUMBUNG[1 - p]];

/** Minimax sederhana. "Main lagi" dihitung berantai paling banyak 2 kali per tingkat supaya cepat. */
function terbaik(lubang, p, dalam, rantai = 0) {
  const pilihan = lubangMilik(p).filter(i => lubang[i] > 0);
  if (!pilihan.length || dalam === 0) return { skor: nilai(lubang, p), i: pilihan[0] };
  let best = { skor: -Infinity, i: pilihan[0] };
  pilihan.forEach(i => {
    const h = sebar(lubang, p, i);
    let skor;
    if (h.mainLagi && punyaBiji(h.lubang, p) && rantai < 2) skor = terbaik(h.lubang, p, dalam, rantai + 1).skor + 0.5;
    else if (h.mainLagi) skor = nilai(h.lubang, p) + 0.5;
    else skor = -terbaik(h.lubang, 1 - p, dalam - 1).skor;
    if (skor > best.skor) best = { skor, i };
  });
  return best;
}

function bot(s, p, level) {
  const pilihan = lubangMilik(p).filter(i => s.lubang[i] > 0);
  if (level === 'easy') return { t: 'pilih', lubang: pilihAcak(pilihan) };
  // Tingkat atas: nilai tiap lubang + sedikit acak supaya permainan tidak selalu sama
  const dalam = level === 'hard' ? 3 : 1, acakan = level === 'hard' ? 0.4 : 3;
  let best = null;
  pilihan.forEach(i => {
    const h = sebar(s.lubang, p, i);
    const skor = (h.mainLagi && punyaBiji(h.lubang, p) ? terbaik(h.lubang, p, dalam, 1).skor + 0.5 : -terbaik(h.lubang, 1 - p, dalam - 1).skor)
      + Math.random() * acakan;
    if (!best || skor > best.skor) best = { skor, i };
  });
  return { t: 'pilih', lubang: best.i };
}

export default {
  mulai, aksi, bot,
  pandangan: s => s,
  giliran: s => (s.selesai ? -1 : s.giliran),
  hasil: s => s.selesai,
  log: s => s.log
};
