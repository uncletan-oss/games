/**
 * Cangkul (2–4 pemain).
 * - Tiap pemain 7 kartu. Pemain pertama membuka satu kartu (bebas).
 * - Pemain lain WAJIB membalas dengan jenis yang sama (♠♥♦♣). Tidak punya? "Mencangkul":
 *   ambil kartu dari tumpukan satu per satu sampai dapat jenis yang sama. Tumpukan habis = lewat.
 * - Kartu tertinggi dari jenis yang dibuka memenangkan putaran dan membuka putaran berikutnya.
 *   Urutan: 2 terendah … 10, J, Q, K, As tertinggi.
 * - Yang pertama menghabiskan kartu MENANG.
 */
import { dekRemi, bagikan, hapusDari, tolak, jns, nilai, pilihAcak, label } from '../umum.js';

const kuat = k => (nilai(k) === 1 ? 14 : nilai(k));

function mulai(n, opsi, info) {
  const dek = dekRemi();
  const awal = (info && info.pemenangLalu != null) ? info.pemenangLalu : 0;
  return {
    n, tangan: bagikan(dek, n, 7), dek,
    giliran: awal, pembuka: awal, meja: [],   // meja: [{ p, kartu }] di putaran ini; kartu null = lewat
    jenis: null, terakhir: null,
    log: `Ronde dimulai. @${awal} membuka kartu.`, selesai: null
  };
}

const bisaBalas = (s, p) => s.tangan[p].some(k => jns(k) === s.jenis);

function selesaiPutaran(s) {
  const main = s.meja.filter(m => m.kartu && jns(m.kartu) === s.jenis);
  const juara = main.reduce((a, b) => (kuat(b.kartu) > kuat(a.kartu) ? b : a));
  s.terakhir = { meja: s.meja, juara: juara.p };
  s.log += ` @${juara.p} memenangkan putaran dan membuka berikutnya.`;
  s.meja = [];
  s.jenis = null;
  s.pembuka = juara.p;
  s.giliran = juara.p;
}

function lanjut(s, p) {
  if (s.tangan[p].length === 0) {
    s.selesai = { pemenang: [p], teks: `@${p} menghabiskan kartu dan MENANG!`, sisa: s.tangan.map(t => t.length) };
    return;
  }
  s.giliran = (p + 1) % s.n;
  if (s.giliran === s.pembuka) selesaiPutaran(s);
}

function aksi(s, p, a) {
  if (s.selesai) tolak('Permainan sudah selesai.');
  if (a.t === 'main') {
    const k = a.kartu;
    if (!s.tangan[p].includes(k)) tolak('Kartu itu tidak ada di tangan Anda.');
    if (s.jenis && jns(k) !== s.jenis) tolak('Harus membalas dengan jenis kartu yang sama.');
    hapusDari(s.tangan[p], k);
    if (!s.jenis) { s.jenis = jns(k); s.terakhir = null; }
    s.meja.push({ p, kartu: k });
    s.log = `@${p} memainkan ${label(k)}.`;
    return lanjut(s, p);
  }
  if (a.t === 'cangkul') {
    if (!s.jenis) tolak('Anda membuka putaran: mainkan kartu apa saja.');
    if (bisaBalas(s, p)) tolak('Anda masih punya kartu berjenis sama.');
    if (!s.dek.length) tolak('Tumpukan habis. Pilih Lewat.');
    const k = s.dek.pop();
    s.tangan[p].push(k);
    s.log = `@${p} mencangkul 1 kartu.`;
    return;
  }
  if (a.t === 'lewat') {
    if (!s.jenis) tolak('Anda membuka putaran: mainkan kartu apa saja.');
    if (bisaBalas(s, p)) tolak('Anda masih punya kartu berjenis sama.');
    if (s.dek.length) tolak('Tumpukan masih ada. Mencangkul dulu.');
    s.meja.push({ p, kartu: null });
    s.log = `@${p} lewat (tidak punya jenis yang sama).`;
    return lanjut(s, p);
  }
  tolak('Aksi tidak dikenal.');
}

function bot(s, p, level) {
  const tangan = s.tangan[p];
  if (!s.jenis) {
    if (level === 'easy') return { t: 'main', kartu: pilihAcak(tangan) };
    // Buka dari jenis yang paling banyak dimiliki, kartu terkecil
    const hitung = {};
    tangan.forEach(k => (hitung[jns(k)] = (hitung[jns(k)] || 0) + 1));
    const j = Object.keys(hitung).sort((a, b) => hitung[b] - hitung[a])[0];
    const pilihan = tangan.filter(k => jns(k) === j).sort((a, b) => kuat(a) - kuat(b));
    return { t: 'main', kartu: pilihan[0] };
  }
  const cocok = tangan.filter(k => jns(k) === s.jenis).sort((a, b) => kuat(a) - kuat(b));
  if (!cocok.length) return s.dek.length ? { t: 'cangkul' } : { t: 'lewat' };
  if (level === 'easy') return { t: 'main', kartu: pilihAcak(cocok) };
  const tertinggi = Math.max(...s.meja.filter(m => m.kartu && jns(m.kartu) === s.jenis).map(m => kuat(m.kartu)));
  const menang = cocok.filter(k => kuat(k) > tertinggi);
  // Medium: rebut putaran bila bisa (kartu menang terkecil); hard: rebut hanya jika pemain terakhir di putaran
  const terakhirDiPutaran = (p + 1) % s.n === s.pembuka;
  if (menang.length && (level === 'medium' || terakhirDiPutaran)) return { t: 'main', kartu: menang[0] };
  return { t: 'main', kartu: cocok[0] };
}

function pandangan(s, p) {
  return {
    n: s.n, giliran: s.giliran, log: s.log, jenis: s.jenis, meja: s.meja, terakhir: s.terakhir,
    tangan: s.selesai ? s.tangan : s.tangan.map((t, i) => (i === p ? t : [])),
    jumlahKartu: s.tangan.map(t => t.length),
    sisaDek: s.dek.length,
    selesai: s.selesai
  };
}

export default {
  id: 'cangkul', mulai, aksi, bot, pandangan,
  giliran: s => (s.selesai ? -1 : s.giliran),
  hasil: s => s.selesai,
  log: s => s.log
};
