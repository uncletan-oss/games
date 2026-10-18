/**
 * Ceki (versi sederhana, 2–4 pemain).
 * Kartu ceki: 3 jenis — Bulat (●), Tali (‖), Ribu (萬) — bernilai 1–9, masing-masing 4 lembar (108 kartu).
 * - Tiap pemain 11 kartu; satu kartu dibuka sebagai awal buangan.
 * - Giliran: ambil 1 kartu (tumpukan atau buangan teratas), lalu buang 1 kartu.
 * - CEKI (menang): setelah mengambil, 12 kartu di tangan habis tersusun menjadi 4 set berisi 3 kartu:
 *   Serian (tiga kartu sama persis) atau Urutan (tiga angka berurutan dari jenis yang sama).
 * Aturan Ceki berbeda di tiap daerah; ini versi sederhana yang mudah dipelajari.
 */
import { acak, tolak, pilihAcak } from '../umum.js';

export const JENIS_CEKI = ['B', 'T', 'R'];   // Bulat, Tali, Ribu
const kode = (j, v) => j + v;
export const jenisCeki = k => k[0];
export const angkaCeki = k => Number(k[1]);

function dekCeki() {
  const dek = [];
  JENIS_CEKI.forEach(j => { for (let v = 1; v <= 9; v++) for (let c = 0; c < 4; c++) dek.push(kode(j, v)); });
  return acak(dek);
}

export const urutkanCeki = t => t.slice().sort((a, b) => JENIS_CEKI.indexOf(a[0]) - JENIS_CEKI.indexOf(b[0]) || a[1] - b[1]);

/** Banyak set (3 kartu) maksimum yang bisa dibentuk, beserta susunannya. */
export function susunCeki(kartu) {
  const hitung = {};
  kartu.forEach(k => (hitung[k] = (hitung[k] || 0) + 1));
  const kunci = Object.keys(hitung).sort((a, b) => JENIS_CEKI.indexOf(a[0]) - JENIS_CEKI.indexOf(b[0]) || a[1] - b[1]);
  let terbaik = [];
  const dfs = (i, set) => {
    while (i < kunci.length && !hitung[kunci[i]]) i++;
    if (set.length > terbaik.length) terbaik = set.slice();
    if (i >= kunci.length) return;
    const k = kunci[i], j = k[0], v = Number(k[1]);
    if (hitung[k] >= 3) { hitung[k] -= 3; set.push([k, k, k]); dfs(i, set); set.pop(); hitung[k] += 3; }
    const k2 = kode(j, v + 1), k3 = kode(j, v + 2);
    if (v <= 7 && hitung[k2] && hitung[k3]) {
      hitung[k]--; hitung[k2]--; hitung[k3]--; set.push([k, k2, k3]);
      dfs(i, set);
      set.pop(); hitung[k]++; hitung[k2]++; hitung[k3]++;
    }
    hitung[k]--; dfs(i, set); hitung[k]++;   // lewati satu kartu ini
  };
  dfs(0, []);
  const dipakai = terbaik.flat();
  const sisa = kartu.slice();
  dipakai.forEach(k => sisa.splice(sisa.indexOf(k), 1));
  return { set: terbaik, sisa };
}

/** Nilai potensi tangan untuk BOT: set lengkap + pasangan/calon urutan. */
function potensi(kartu) {
  const { set, sisa } = susunCeki(kartu);
  let skor = set.length * 10;
  const h = {};
  sisa.forEach(k => (h[k] = (h[k] || 0) + 1));
  sisa.forEach(k => {
    if (h[k] >= 2) skor += 1.5;
    const j = k[0], v = Number(k[1]);
    if (h[kode(j, v + 1)] || h[kode(j, v - 1)]) skor += 1;
    if (h[kode(j, v + 2)] || h[kode(j, v - 2)]) skor += 0.5;
  });
  return skor;
}

function mulai(n, opsi, info) {
  const dek = dekCeki();
  const tangan = Array.from({ length: n }, () => urutkanCeki(dek.splice(0, 11)));
  const awal = (info && info.pemenangLalu != null) ? info.pemenangLalu : 0;
  return { n, tangan, dek, buangan: [dek.pop()], giliran: awal, fase: 'ambil', diambil: null,
    log: `Ronde dimulai. @${awal} jalan duluan: ambil kartu.`, selesai: null };
}

function cekMenang(s, p) {
  const { set, sisa } = susunCeki(s.tangan[p]);
  if (set.length === 4 && !sisa.length) {
    s.selesai = { pemenang: [p], teks: `@${p} CEKI! Empat set lengkap.`, susunan: set,
      rincian: s.tangan.map((t, i) => ({ kursi: i, kartu: urutkanCeki(t) })) };
    return true;
  }
  return false;
}

function aksi(s, p, a) {
  if (s.selesai) tolak('Permainan sudah selesai.');
  if (a.t === 'ambil') {
    if (s.fase !== 'ambil') tolak('Anda sudah mengambil kartu. Sekarang buang satu kartu.');
    if (a.dari === 'buangan') {
      if (!s.buangan.length) tolak('Buangan kosong.');
      s.diambil = s.buangan.pop();
      s.log = `@${p} mengambil buangan.`;
    } else {
      if (!s.dek.length) {
        s.selesai = { pemenang: [], teks: 'Tumpukan kartu habis. Ronde seri.' };
        s.log = s.selesai.teks;
        return;
      }
      s.diambil = s.dek.pop();
      s.log = `@${p} mengambil kartu dari tumpukan.`;
    }
    s.tangan[p].push(s.diambil);
    s.fase = 'buang';
    if (cekMenang(s, p)) s.log = `@${p} CEKI!`;
    return;
  }
  if (a.t === 'buang') {
    if (s.fase !== 'buang') tolak('Ambil kartu dulu.');
    const i = s.tangan[p].indexOf(a.kartu);
    if (i === -1) tolak('Kartu itu tidak ada di tangan Anda.');
    s.tangan[p].splice(i, 1);
    s.buangan.push(a.kartu);
    s.log = `@${p} membuang kartu.`;
    s.fase = 'ambil';
    s.diambil = null;
    s.giliran = (p + 1) % s.n;
    return;
  }
  tolak('Aksi tidak dikenal.');
}

function bot(s, p, level) {
  const tangan = s.tangan[p];
  if (s.fase === 'ambil') {
    const atas = s.buangan[s.buangan.length - 1];
    if (atas && level !== 'easy') {
      const dengan = tangan.concat(atas);
      if (susunCeki(dengan).set.length > susunCeki(tangan).set.length) return { t: 'ambil', dari: 'buangan' };
    }
    return { t: 'ambil', dari: 'dek' };
  }
  if (level === 'easy') return { t: 'buang', kartu: pilihAcak(tangan) };
  // Hard: hitung juga berapa lembar kartu (yang belum terlihat) bisa menambah set
  const terlihat = {};
  tangan.concat(s.buangan).forEach(k => (terlihat[k] = (terlihat[k] || 0) + 1));
  const peluang = sisa => {
    const dasar = susunCeki(sisa).set.length;
    let n = 0;
    JENIS_CEKI.forEach(j => { for (let v = 1; v <= 9; v++) {
      const k = kode(j, v), ada = 4 - (terlihat[k] || 0);
      if (ada > 0 && susunCeki(sisa.concat(k)).set.length > dasar) n += ada;
    } });
    return n;
  };
  let terbaik = null;
  new Set(tangan).forEach(k => {
    const sisa = tangan.slice(); sisa.splice(sisa.indexOf(k), 1);
    const skor = level === 'hard' ? susunCeki(sisa).set.length * 100 + peluang(sisa) + potensi(sisa) / 10 : potensi(sisa);
    if (!terbaik || skor > terbaik.skor) terbaik = { k, skor };
  });
  return { t: 'buang', kartu: terbaik.k };
}

function pandangan(s, p) {
  return {
    n: s.n, giliran: s.giliran, fase: s.fase, log: s.log,
    tangan: s.selesai ? s.tangan : s.tangan.map((t, i) => (i === p ? t : [])),
    jumlahKartu: s.tangan.map(t => t.length),
    sisaDek: s.dek.length,
    buanganAtas: s.buangan[s.buangan.length - 1] || null,
    diambil: s.giliran === p ? s.diambil : null,
    selesai: s.selesai
  };
}

export default {
  id: 'ceki', mulai, aksi, bot, pandangan,
  giliran: s => (s.selesai ? -1 : s.giliran),
  hasil: s => s.selesai,
  log: s => s.log
};
