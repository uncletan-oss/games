/**
 * Halma / dam bintang (2–4 pemain, papan bintang 121 lubang, 10 bidak per pemain).
 * - Giliran: geser satu bidak ke lubang tetangga yang kosong, ATAU lompati satu bidak (milik siapa saja)
 *   ke lubang kosong di baliknya. Lompatan boleh berantai dalam satu giliran.
 * - Tujuan: memindahkan semua bidak ke sudut seberang.
 * - Supaya tidak bisa dihalangi: sudut tujuan yang penuh dan hanya berisi bidak sendiri atau bidak lawan
 *   yang belum keluar dari kandangnya juga dihitung menang.
 * Koordinat kubus (q, r, s) dengan q + r + s = 0; kunci petak "q,r".
 */
import { tolak, pilihAcak } from '../umum.js';

const ARAH = [[1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1]];
// Enam sudut searah jarum jam mulai dari bawah. uji(q, r, s) → apakah petak di sudut itu.
export const SUDUT = [
  { nama: 'bawah', uji: (q, r) => r >= 5 },
  { nama: 'kiri bawah', uji: q => q <= -5 },
  { nama: 'kiri atas', uji: (q, r, s) => s >= 5 },
  { nama: 'atas', uji: (q, r) => r <= -5 },
  { nama: 'kanan atas', uji: q => q >= 5 },
  { nama: 'kanan bawah', uji: (q, r, s) => s <= -5 }
];
const SUDUT_UNTUK = { 2: [0, 3], 3: [0, 2, 4], 4: [1, 2, 4, 5] };

export const PETAK = (() => {
  const daftar = [];
  for (let q = -8; q <= 8; q++) for (let r = -8; r <= 8; r++) {
    const s = -q - r;
    const naik = q >= -4 && r >= -4 && s >= -4, turun = q <= 4 && r <= 4 && s <= 4;
    if (naik || turun) daftar.push([q, r]);
  }
  return daftar;
})();
const ADA = new Set(PETAK.map(([q, r]) => q + ',' + r));
const kunci = (q, r) => q + ',' + r;
const urai = k => k.split(',').map(Number);
export const diSudut = (k, sd) => { const [q, r] = urai(k); return SUDUT[sd].uji(q, r, -q - r); };
const petakSudut = sd => PETAK.filter(([q, r]) => SUDUT[sd].uji(q, r, -q - r)).map(([q, r]) => kunci(q, r));

/** Seberapa dekat petak ke ujung sudut tujuan (makin besar makin dekat). */
function kemajuan(k, tujuan) {
  const [q, r] = urai(k), s = -q - r;
  return [r, -q, s, -r, q, -s][tujuan];   // koordinat yang bertambah besar ke arah sudut tujuan
}

function mulai(n) {
  const rumah = SUDUT_UNTUK[n];
  const papan = {};
  rumah.forEach((sd, p) => petakSudut(sd).forEach(k => { papan[k] = p; }));
  return { n, papan, rumah, tujuan: rumah.map(sd => (sd + 3) % 6), giliran: 0, terakhir: null, langkah: 0,
    log: 'Permainan dimulai. Pindahkan semua bidak ke sudut seberang!', selesai: null };
}

/** Semua petak tujuan yang bisa dicapai dari petak k (geser satu atau lompat berantai). */
export function tujuanDari(papan, k) {
  const [q, r] = urai(k);
  const hasil = new Set();
  ARAH.forEach(([dq, dr]) => {
    const t = kunci(q + dq, r + dr);
    if (ADA.has(t) && papan[t] == null) hasil.add(t);
  });
  const dikunjungi = new Set([k]);
  const antre = [k];
  while (antre.length) {
    const [cq, cr] = urai(antre.shift());
    ARAH.forEach(([dq, dr]) => {
      const tengah = kunci(cq + dq, cr + dr), t = kunci(cq + 2 * dq, cr + 2 * dr);
      if (papan[tengah] != null && ADA.has(t) && papan[t] == null && t !== k && !dikunjungi.has(t)) {
        dikunjungi.add(t); hasil.add(t); antre.push(t);
      }
    });
  }
  hasil.delete(k);
  return [...hasil];
}

function menang(s, p) {
  const target = petakSudut(s.tujuan[p]);
  const milik = Object.keys(s.papan).filter(k => s.papan[k] === p);
  if (milik.every(k => target.includes(k))) return true;
  // Anti-halang: sudut tujuan penuh, berisi bidak sendiri atau bidak lawan yang masih di kandangnya
  return target.every(k => s.papan[k] != null && (s.papan[k] === p || s.rumah[s.papan[k]] === s.tujuan[p])) && target.some(k => s.papan[k] === p);
}

function aksi(s, p, a) {
  if (s.selesai) tolak('Permainan sudah selesai.');
  if (a.t === 'lewat') {
    const bisa = Object.keys(s.papan).some(k => s.papan[k] === p && tujuanDari(s.papan, k).length);
    if (bisa) tolak('Masih ada bidak yang bisa jalan.');
    s.log = `@${p} tidak bisa jalan dan dilewati.`;
    s.giliran = (p + 1) % s.n;
    return;
  }
  if (a.t !== 'jalan') tolak('Aksi tidak dikenal.');
  if (s.papan[a.dari] !== p) tolak('Pilih bidak Anda sendiri.');
  if (!tujuanDari(s.papan, a.dari).includes(a.ke)) tolak('Bidak tidak bisa ke lubang itu.');
  delete s.papan[a.dari];
  s.papan[a.ke] = p;
  s.terakhir = { dari: a.dari, ke: a.ke };
  s.langkah++;
  s.log = `@${p} menjalankan bidak.`;
  if (menang(s, p)) {
    s.selesai = { pemenang: [p], teks: `@${p} memindahkan semua bidak ke sudut seberang dan MENANG!` };
    return;
  }
  if (s.langkah >= 400 * s.n) {
    // Batas langkah: kemajuan total terbesar menang
    const total = Array.from({ length: s.n }, (_, i) => Object.keys(s.papan).filter(k => s.papan[k] === i).reduce((x, k) => x + kemajuan(k, s.tujuan[i]), 0));
    const best = total.indexOf(Math.max(...total));
    s.selesai = { pemenang: [best], teks: `Batas langkah tercapai. @${best} paling dekat ke tujuan dan menang.` };
    return;
  }
  s.giliran = (p + 1) % s.n;
}

function bot(s, p, level) {
  const tujuan = s.tujuan[p];
  const milik = Object.keys(s.papan).filter(k => s.papan[k] === p);
  const semua = [];
  milik.forEach(dari => tujuanDari(s.papan, dari).forEach(ke => semua.push({ dari, ke, maju: kemajuan(ke, tujuan) - kemajuan(dari, tujuan) })));
  if (!semua.length) return { t: 'lewat' };
  if (level === 'easy') {
    const maju = semua.filter(m => m.maju > 0);
    const m = pilihAcak(maju.length ? maju : semua);
    return { t: 'jalan', dari: m.dari, ke: m.ke };
  }
  const minKemajuan = Math.min(...milik.map(k => kemajuan(k, tujuan)));
  const target = new Set(petakSudut(tujuan));
  const skor = m => {
    let v = m.maju * 10;
    if (kemajuan(m.dari, tujuan) === minKemajuan) v += 4;              // tarik bidak yang tertinggal
    if (target.has(m.dari) && !target.has(m.ke)) v -= 30;              // jangan keluar dari tujuan
    if (target.has(m.ke)) v += 3;
    // jaga bidak dekat poros tengah sudut tujuan (lebih banyak jalur lompat)
    const [q, r] = urai(m.ke); const s2 = -q - r;
    const samping = [Math.abs(q - s2), Math.abs(r - s2), Math.abs(q - r)][tujuan % 3];
    v -= samping * (level === 'hard' ? 0.8 : 0.3);
    if (level === 'hard') {
      // Lihat satu langkah ke depan: lompatan lanjutan yang terbuka setelah langkah ini
      const papan2 = Object.assign({}, s.papan); delete papan2[m.dari]; papan2[m.ke] = p;
      const lanjut = Math.max(0, ...tujuanDari(papan2, m.ke).map(k => kemajuan(k, tujuan) - kemajuan(m.ke, tujuan)));
      v += lanjut * 3;
    }
    return v;
  };
  semua.sort((a, b) => skor(b) - skor(a));
  return { t: 'jalan', dari: semua[0].dari, ke: semua[0].ke };
}

export default {
  mulai, aksi, bot,
  pandangan: s => s,
  giliran: s => (s.selesai ? -1 : s.giliran),
  hasil: s => s.selesai,
  log: s => s.log
};
