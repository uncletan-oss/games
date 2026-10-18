/**
 * Remi (2–4 pemain, versi 7 kartu).
 * - Tiap pemain 7 kartu; satu kartu dibuka sebagai awal tumpukan buangan.
 * - Giliran: ambil 1 kartu (dari tumpukan tertutup ATAU kartu teratas buangan), lalu buang 1 kartu.
 * - TUTUP (menang): setelah mengambil, jika 7 kartu bisa disusun habis menjadi kombinasi
 *   (Seri: 3+ kartu berurutan satu jenis, As bisa di bawah A-2-3 atau di atas Q-K-A;
 *    Trengguli: 3–4 kartu peringkat sama), buang kartu ke-8 dan tutup.
 * - Poin kalah = jumlah nilai kartu yang tidak masuk kombinasi (As 1, J/Q/K 10).
 * - Bila tumpukan sudah dikocok ulang 3 kali tanpa ada yang tutup, ronde berakhir:
 *   pemain dengan poin sisa terkecil menang.
 */
import { dekRemi, bagikan, hapusDari, tolak, pkt, jns, nilai, acak, pilihAcak, label } from '../umum.js';

const poinKartu = k => Math.min(10, nilai(k));

/** Semua kombinasi yang mungkin dari kumpulan kartu (indeks). */
function semuaKombinasi(kartu) {
  const hasil = [];
  const perPeringkat = {};
  kartu.forEach((k, i) => (perPeringkat[pkt(k)] = perPeringkat[pkt(k)] || []).push(i));
  Object.values(perPeringkat).forEach(ix => {
    if (ix.length >= 3) {
      // semua subset ukuran 3 dan 4
      const n = ix.length;
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) {
        hasil.push([ix[a], ix[b], ix[c]]);
        for (let d = c + 1; d < n; d++) hasil.push([ix[a], ix[b], ix[c], ix[d]]);
      }
    }
  });
  // Seri: per jenis, nilai 1..14 (As = 1 dan 14)
  const perJenis = {};
  kartu.forEach((k, i) => {
    const j = jns(k);
    perJenis[j] = perJenis[j] || {};
    (perJenis[j][nilai(k)] = perJenis[j][nilai(k)] || []).push(i);
    if (nilai(k) === 1) (perJenis[j][14] = perJenis[j][14] || []).push(i);
  });
  Object.values(perJenis).forEach(peta => {
    for (let awal = 1; awal <= 12; awal++) {
      const seri = [];
      for (let v = awal; v <= 14 && peta[v]; v++) {
        seri.push(peta[v][0]);
        if (seri.length >= 3 && new Set(seri).size === seri.length) hasil.push(seri.slice());
      }
    }
  });
  return hasil;
}

/** Susunan terbaik: kombinasi yang tidak tumpang tindih dengan sisa poin terkecil. */
export function susunTerbaik(kartu) {
  const kombo = semuaKombinasi(kartu);
  let terbaik = { kombinasi: [], sisa: kartu.map((_, i) => i), poin: kartu.reduce((a, k) => a + poinKartu(k), 0) };
  const dfs = (mulaiDari, dipakai, pilih) => {
    const sisa = kartu.map((_, i) => i).filter(i => !dipakai.has(i));
    const poin = sisa.reduce((a, i) => a + poinKartu(kartu[i]), 0);
    if (poin < terbaik.poin) terbaik = { kombinasi: pilih.slice(), sisa, poin };
    for (let c = mulaiDari; c < kombo.length; c++) {
      if (kombo[c].some(i => dipakai.has(i))) continue;
      kombo[c].forEach(i => dipakai.add(i));
      pilih.push(kombo[c]);
      dfs(c + 1, dipakai, pilih);
      pilih.pop();
      kombo[c].forEach(i => dipakai.delete(i));
    }
  };
  dfs(0, new Set(), []);
  return {
    kombinasi: terbaik.kombinasi.map(c => c.map(i => kartu[i])),
    sisa: terbaik.sisa.map(i => kartu[i]),
    poin: terbaik.poin
  };
}

function mulai(n, opsi, info) {
  const dek = dekRemi();
  const tangan = bagikan(dek, n, 7);
  const awal = (info && info.pemenangLalu != null) ? info.pemenangLalu : 0;
  return {
    n, tangan, dek, buangan: [dek.pop()],
    giliran: awal, fase: 'ambil', diambil: null, kocokUlang: 0,
    log: `Ronde dimulai. @${awal} jalan duluan: ambil kartu.`, selesai: null
  };
}

/** Mengocok ulang buangan menjadi tumpukan. Mengembalikan false bila ronde harus diakhiri. */
function isiUlangDek(s) {
  if (s.dek.length) return true;
  if (s.kocokUlang >= 3 || s.buangan.length < 2) return false;
  s.kocokUlang++;
  const atas = s.buangan.pop();
  s.dek = acak(s.buangan);
  s.buangan = [atas];
  return true;
}

function akhiriBuntu(s) {
  const poin = s.tangan.map(t => susunTerbaik(t).poin);
  const min = Math.min(...poin);
  const p = poin.indexOf(min);
  s.selesai = {
    pemenang: [p],
    teks: `Tumpukan habis tanpa ada yang tutup. @${p} menang dengan poin sisa terkecil (${min}).`,
    rincian: s.tangan.map((t, i) => ({ kursi: i, kartu: t.slice(), poin: poin[i] }))
  };
  s.log = s.selesai.teks;
}

function aksi(s, p, a) {
  if (s.selesai) tolak('Permainan sudah selesai.');
  const tangan = s.tangan[p];
  if (a.t === 'ambil') {
    if (s.fase !== 'ambil') tolak('Anda sudah mengambil kartu. Sekarang buang satu kartu.');
    if (a.dari === 'buangan') {
      if (!s.buangan.length) tolak('Tumpukan buangan kosong.');
      s.diambil = s.buangan.pop();
      s.log = `@${p} mengambil ${label(s.diambil)} dari buangan.`;
    } else {
      if (!isiUlangDek(s)) return akhiriBuntu(s);
      s.diambil = s.dek.pop();
      s.log = `@${p} mengambil kartu dari tumpukan.`;
    }
    tangan.push(s.diambil);
    s.fase = 'buang';
    return;
  }
  if (a.t === 'buang' || a.t === 'tutup') {
    if (s.fase !== 'buang') tolak('Ambil kartu dulu.');
    hapusDari(tangan, a.kartu);
    if (a.t === 'tutup') {
      const susun = susunTerbaik(tangan);
      if (susun.sisa.length) { tangan.push(a.kartu); tolak('Kartu Anda belum bisa ditutup: masih ada kartu yang tidak masuk kombinasi.'); }
      s.buangan.push(a.kartu);
      const kalah = s.tangan.map((t, i) => (i === p ? 0 : susunTerbaik(t).poin));
      s.selesai = {
        pemenang: [p],
        teks: `@${p} TUTUP dan menang!`,
        rincian: s.tangan.map((t, i) => ({ kursi: i, kartu: t.slice(), poin: kalah[i] })),
        susunan: susun.kombinasi
      };
      s.log = `@${p} membuang ${label(a.kartu)} dan TUTUP!`;
      return;
    }
    s.buangan.push(a.kartu);
    s.log = `@${p} membuang ${label(a.kartu)}.`;
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
      // Ambil buangan jika menurunkan poin sisa setelah membuang kartu terburuk
      const sekarang = susunTerbaik(tangan).poin;
      const dengan = Math.min(...tangan.map((_, i) => susunTerbaik(tangan.filter((__, j) => j !== i).concat(atas)).poin));
      if (dengan < sekarang - (level === 'hard' ? 0 : 2)) return { t: 'ambil', dari: 'buangan' };
    }
    return { t: 'ambil', dari: 'dek' };
  }
  // Fase buang: cari kartu yang jika dibuang memberi sisa poin terkecil
  let terbaik = null;
  tangan.forEach(k => {
    const sisa = tangan.slice(); sisa.splice(sisa.indexOf(k), 1);
    const sz = susunTerbaik(sisa);
    const skor = sz.poin * 10 - poinKartu(k);
    if (!terbaik || skor < terbaik.skor) terbaik = { k, skor, bisaTutup: sz.sisa.length === 0 };
  });
  if (terbaik.bisaTutup) return { t: 'tutup', kartu: terbaik.k };
  if (level === 'easy') return { t: 'buang', kartu: pilihAcak(tangan) };
  return { t: 'buang', kartu: terbaik.k };
}

function pandangan(s, p) {
  return {
    n: s.n, giliran: s.giliran, fase: s.fase, log: s.log,
    tangan: s.selesai ? s.tangan : s.tangan.map((t, i) => (i === p ? t : [])),
    jumlahKartu: s.tangan.map(t => t.length),
    sisaDek: s.dek.length,
    buanganAtas: s.buangan[s.buangan.length - 1] || null,
    jumlahBuangan: s.buangan.length,
    diambil: s.giliran === p ? s.diambil : null,
    selesai: s.selesai
  };
}

export default {
  id: 'remi', mulai, aksi, bot, pandangan,
  giliran: s => (s.selesai ? -1 : s.giliran),
  hasil: s => s.selesai,
  log: s => s.log
};
