/* Utilitas bersama untuk mesin game (berjalan di browser host, tanpa DOM). */

export function acak(arr) { // Fisher–Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const pilihAcak = arr => arr[Math.floor(Math.random() * arr.length)];
export const lemparDadu = () => 1 + Math.floor(Math.random() * 6);
export const berikut = (i, n) => (i + 1) % n;

/** Error aturan permainan: pesannya ditampilkan ke pemain. */
export function tolak(pesan) { throw new Error(pesan); }

/* ---------- Kartu remi standar (52 kartu) ----------
 * Kode kartu = peringkat + jenis, mis. "AS" (As sekop), "TH" (10 hati), "QD", "7C".
 * Jenis: S = ♠ sekop, H = ♥ hati, D = ♦ wajik, C = ♣ keriting. */
export const PERINGKAT = 'A23456789TJQK';
export const JENIS = 'SHDC';

export function dekRemi() {
  const dek = [];
  for (const j of JENIS) for (const p of PERINGKAT) dek.push(p + j);
  return acak(dek);
}

const SIMBOL_JENIS = { S: '♠', H: '♥', D: '♦', C: '♣' };
/** Nama kartu untuk log, mis. "TH" → "10♥". */
export const label = k => (k[0] === 'T' ? '10' : k[0]) + SIMBOL_JENIS[k[1]];

export const pkt = k => k[0];
export const jns = k => k[1];
/** Nilai 1..13 (A = 1). */
export const nilai = k => PERINGKAT.indexOf(k[0]) + 1;

export function bagikan(dek, n, jumlah) {
  return Array.from({ length: n }, () => dek.splice(0, jumlah));
}

export function hapusDari(tangan, kartu) {
  const i = tangan.indexOf(kartu);
  if (i === -1) tolak('Kartu itu tidak ada di tangan Anda.');
  tangan.splice(i, 1);
}
