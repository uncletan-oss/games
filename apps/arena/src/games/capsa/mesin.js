/**
 * Capsa Banting / Big Two (2–4 pemain, 13 kartu per pemain).
 * - Urutan kartu: 3 < 4 < … < K < As < 2. Urutan jenis: ♦ < ♣ < ♥ < ♠.
 * - Pemegang 3♦ jalan pertama dan wajib memakai 3♦ (bila 3♦ tidak terbagi: pemegang kartu terkecil).
 * - Kombinasi: satu kartu, pasangan, tris, dan 5 kartu
 *   (Straight < Flush < Full House < Four of a kind + 1 < Straight Flush).
 * - Lawan harus membalas dengan jumlah kartu yang sama dan nilainya lebih tinggi, atau Lewat.
 *   Bila semua lawan lewat, pemain terakhir bebas membuka kombinasi baru.
 * - Yang pertama menghabiskan kartu MENANG.
 */
import { dekRemi, tolak, pkt, jns, pilihAcak, label } from '../umum.js';

const URUT_PKT = '3456789TJQKA2';
const URUT_JNS = 'DCHS';
export const kekuatan = k => URUT_PKT.indexOf(pkt(k)) * 4 + URUT_JNS.indexOf(jns(k));
const nPkt = k => URUT_PKT.indexOf(pkt(k));
export const urutkan = kartu => kartu.slice().sort((a, b) => kekuatan(a) - kekuatan(b));
const NAMA_LIMA = ['Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush'];

/** Mengenali kombinasi. Hasil: { jenis: 1|2|3|5, kelas (khusus 5 kartu), nilai } atau null. */
export function kenali(kartu) {
  const k = urutkan(kartu);
  const n = k.length;
  if (n === 1) return { n: 1, nilai: kekuatan(k[0]), nama: 'Satu kartu' };
  if (n === 2 || n === 3) {
    if (!k.every(x => pkt(x) === pkt(k[0]))) return null;
    return { n, nilai: kekuatan(k[n - 1]), nama: n === 2 ? 'Pasangan' : 'Tris' };
  }
  if (n !== 5) return null;
  const hitung = {};
  k.forEach(x => (hitung[pkt(x)] = (hitung[pkt(x)] || 0) + 1));
  const jumlah = Object.values(hitung).sort((a, b) => b - a);
  const flush = k.every(x => jns(x) === jns(k[0]));
  const urut = k.map(nPkt);
  const straight = new Set(urut).size === 5 && urut[4] - urut[0] === 4 && !urut.includes(12); // tanpa kartu 2
  let kelas = -1, nilai = 0;
  if (straight && flush) { kelas = 4; nilai = kekuatan(k[4]); }
  else if (jumlah[0] === 4) { kelas = 3; nilai = nPkt(Object.keys(hitung).find(p => hitung[p] === 4) + 'D'); }
  else if (jumlah[0] === 3 && jumlah[1] === 2) { kelas = 2; nilai = nPkt(Object.keys(hitung).find(p => hitung[p] === 3) + 'D'); }
  else if (flush) { kelas = 1; nilai = kekuatan(k[4]); }
  else if (straight) { kelas = 0; nilai = kekuatan(k[4]); }
  else return null;
  return { n: 5, kelas, nilai, nama: NAMA_LIMA[kelas] };
}

export function lebihTinggi(baru, lama) {
  if (baru.n !== lama.n) return false;
  if (baru.n === 5 && baru.kelas !== lama.kelas) return baru.kelas > lama.kelas;
  return baru.nilai > lama.nilai;
}

function mulai(n) {
  const dek = dekRemi();
  const tangan = Array.from({ length: n }, () => urutkan(dek.splice(0, 13)));
  let awal = tangan.findIndex(t => t.includes('3D'));
  let wajib = '3D';
  if (awal === -1) {
    const semua = urutkan(tangan.flat());
    wajib = semua[0];
    awal = tangan.findIndex(t => t.includes(wajib));
  }
  return {
    n, tangan, giliran: awal, wajib,
    meja: null,          // { p, kartu, kombinasi }
    lewat: [],           // pemain yang lewat sejak kombinasi terakhir
    log: `Ronde dimulai. @${awal} memegang ${label(wajib)} dan jalan duluan.`, selesai: null
  };
}

function aksi(s, p, a) {
  if (s.selesai) tolak('Permainan sudah selesai.');
  if (a.t === 'main') {
    const kartu = a.kartu || [];
    const tangan = s.tangan[p];
    if (!kartu.length || new Set(kartu).size !== kartu.length || !kartu.every(k => tangan.includes(k))) tolak('Pilih kartu dari tangan Anda.');
    const kombo = kenali(kartu);
    if (!kombo) tolak('Kombinasi tidak sah. Pilih 1 kartu, pasangan, tris, atau 5 kartu (straight/flush/full house/four/straight flush).');
    if (s.wajib && !kartu.includes(s.wajib)) tolak(`Langkah pertama wajib memakai ${label(s.wajib)}.`);
    if (s.meja && !lebihTinggi(kombo, s.meja.kombinasi)) {
      tolak(kombo.n !== s.meja.kombinasi.n ? `Harus ${s.meja.kombinasi.n} kartu.` : 'Kombinasi Anda kurang tinggi.');
    }
    s.tangan[p] = tangan.filter(k => !kartu.includes(k));
    s.meja = { p, kartu: urutkan(kartu), kombinasi: kombo };
    s.wajib = null;
    s.lewat = [];
    s.log = `@${p} memainkan ${kombo.nama} (${urutkan(kartu).map(label).join(' ')}).`;
    if (!s.tangan[p].length) {
      s.selesai = { pemenang: [p], teks: `@${p} menghabiskan kartu dan MENANG!`, sisa: s.tangan.map(t => t.length) };
      return;
    }
    s.giliran = (p + 1) % s.n;
    return;
  }
  if (a.t === 'lewat') {
    if (!s.meja) tolak('Anda yang membuka: mainkan kombinasi apa saja.');
    s.lewat.push(p);
    s.log = `@${p} lewat.`;
    let g = (p + 1) % s.n;
    if (g === s.meja.p) {   // semua lawan lewat
      s.log += ` Semua lewat — @${g} bebas membuka.`;
      s.meja = null;
      s.lewat = [];
    }
    s.giliran = g;
    return;
  }
  tolak('Aksi tidak dikenal.');
}

/** Semua kombinasi sah dari tangan. */
export function semuaKombinasi(tangan) {
  const hasil = [];
  const t = urutkan(tangan);
  t.forEach(k => hasil.push([k]));
  const perPkt = {};
  t.forEach(k => (perPkt[pkt(k)] = perPkt[pkt(k)] || []).push(k));
  Object.values(perPkt).forEach(g => {
    for (let a = 0; a < g.length; a++) for (let b = a + 1; b < g.length; b++) {
      hasil.push([g[a], g[b]]);
      for (let c = b + 1; c < g.length; c++) hasil.push([g[a], g[b], g[c]]);
    }
  });
  const n = t.length;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++)
    for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++) {
      const lima = [t[a], t[b], t[c], t[d], t[e]];
      if (kenali(lima)) hasil.push(lima);
    }
  return hasil;
}

function bot(s, p, level) {
  const tangan = s.tangan[p];
  let pilihan = semuaKombinasi(tangan).map(k => ({ k, c: kenali(k) }));
  if (s.wajib) pilihan = pilihan.filter(x => x.k.includes(s.wajib));
  if (s.meja) pilihan = pilihan.filter(x => lebihTinggi(x.c, s.meja.kombinasi));
  if (!pilihan.length) return { t: 'lewat' };
  if (level === 'easy') return { t: 'main', kartu: pilihAcak(pilihan).k };

  // Hitung berapa kombinasi yang "dirusak" bila kartu dipakai — hard menjaga pasangan/tris
  const perPkt = {};
  tangan.forEach(k => (perPkt[pkt(k)] = (perPkt[pkt(k)] || 0) + 1));
  const biaya = x => {
    let b = x.c.n === 5 ? x.c.kelas * 100 + x.c.nilai / 4 : x.c.nilai;
    if (level === 'hard') {
      if (x.c.n === 1 && perPkt[pkt(x.k[0])] > 1) b += 30;                 // jangan pecah pasangan
      if (x.k.some(k => pkt(k) === '2') && tangan.length > 4) b += 40;      // simpan kartu 2
    }
    return b;
  };
  if (!s.meja) {
    // Membuka: utamakan buang banyak kartu (5 > 3 > 2 > 1), lalu yang termurah
    pilihan.sort((a, b) => b.c.n - a.c.n || biaya(a) - biaya(b));
    if (level === 'medium' && Math.random() < 0.3) pilihan.sort((a, b) => biaya(a) - biaya(b));
    return { t: 'main', kartu: pilihan[0].k };
  }
  pilihan.sort((a, b) => biaya(a) - biaya(b));
  // Hard: kadang lewat agar tidak menghabiskan kartu kuat terlalu cepat
  if (level === 'hard' && tangan.length > 6 && pilihan[0].k.some(k => pkt(k) === '2') && s.meja.p !== (p + s.n - 1) % s.n) return { t: 'lewat' };
  return { t: 'main', kartu: pilihan[0].k };
}

function pandangan(s, p) {
  return {
    n: s.n, giliran: s.giliran, log: s.log, meja: s.meja, wajib: s.wajib, lewat: s.lewat,
    tangan: s.selesai ? s.tangan : s.tangan.map((t, i) => (i === p ? t : [])),
    jumlahKartu: s.tangan.map(t => t.length),
    selesai: s.selesai
  };
}

export default {
  id: 'capsa', mulai, aksi, bot, pandangan,
  giliran: s => (s.selesai ? -1 : s.giliran),
  hasil: s => s.selesai,
  log: s => s.log
};
