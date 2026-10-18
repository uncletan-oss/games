/**
 * Ular Tangga (2–4 pemain). Papan 1–100. Naik tangga, turun lewat ular.
 * Harus pas di 100; kelebihan langkah memantul mundur. Angka 6 = lempar lagi.
 */
import { lemparDadu, tolak } from '../umum.js';

export const TANGGA = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92 };
export const ULAR = { 27: 5, 40: 3, 43: 18, 54: 31, 66: 45, 76: 58, 89: 53, 95: 77, 99: 41 };

function mulai(n) {
  return { n, posisi: Array(n).fill(0), giliran: 0, dadu: null, log: 'Permainan dimulai. Lempar dadu!', selesai: null };
}

function aksi(s, p, a) {
  if (s.selesai) tolak('Permainan sudah selesai.');
  if (a.t !== 'lempar') tolak('Aksi tidak dikenal.');
  const d = lemparDadu();
  s.dadu = d;
  let pos = s.posisi[p] + d;
  let teks = `@${p} melempar ${d}`;
  if (pos > 100) { pos = 200 - pos; teks += ', kelebihan langkah dan memantul'; }
  if (TANGGA[pos]) { teks += `, naik tangga ${pos} → ${TANGGA[pos]}`; pos = TANGGA[pos]; }
  else if (ULAR[pos]) { teks += `, dimakan ular ${pos} → ${ULAR[pos]}`; pos = ULAR[pos]; }
  s.posisi[p] = pos;
  if (pos === 100) {
    s.selesai = { pemenang: [p], teks: `@${p} sampai di petak 100 dan MENANG!` };
    s.log = teks + '!';
    return;
  }
  if (d === 6) s.log = teks + '. Lempar lagi!';
  else { s.log = teks + '.'; s.giliran = (p + 1) % s.n; }
}

export default {
  id: 'ulartangga',
  mulai,
  aksi,
  bot: () => ({ t: 'lempar' }),
  giliran: s => (s.selesai ? -1 : s.giliran),
  hasil: s => s.selesai,
  pandangan: s => s,
  log: s => s.log
};
