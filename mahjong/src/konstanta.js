export const POSISI = ['pos-bottom', 'pos-right', 'pos-top', 'pos-left'];
export const ANGIN = ['Timur', 'Selatan', 'Barat', 'Utara'];
export const ANGIN_HURUF = ['東', '南', '西', '北'];
export const AREA = ['a-bottom', 'a-right', 'a-top', 'a-left'];   // posisi relatif: Anda selalu di bawah
export const LEVEL = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];
export const POLL_MS = 1500;
export const BOT_DELAY_MS = 1200;
export const BOT_MACET_MS = 6000;   // jika host tidak menjalankan bot, pemain lain mengambil alih
export const NAMA_AKSI = { ron: 'Ron (menang)', pong: 'Pong', chow: 'Chow', kong: 'Kong', pass: 'Lewati' };

export const PESAN_ERROR = {
  KAMAR_TIDAK_ADA: 'Meja dengan kode itu tidak ditemukan. Periksa lagi kodenya, atau minta host membuat meja dulu.',
  KAMAR_PENUH: 'Semua kursi di meja ini sudah terisi.',
  KAMAR_SUDAH_MAIN: 'Meja ini sedang bermain dan tidak ada kursi kosong. Buat meja sendiri, atau tunggu ada pemain yang keluar.',
  BUKAN_PEMAIN: 'Anda tidak lagi duduk di meja ini. Mungkin host mengganti kursi Anda, Anda sudah keluar, atau meja dibuat ulang.',
  KAMAR_DIPAKAI: 'Kode ini sedang dipakai meja lain. Tekan "Acak kode" untuk kode baru, atau gabung ke meja itu lewat panel kanan.'
};

export function kodeAcak() {
  const huruf = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let k = 'MJ-';
  for (let i = 0; i < 4; i++) k += huruf[Math.floor(Math.random() * huruf.length)];
  return k;
}

export function samaIsi(a, b) {
  if (a.length !== b.length) return false;
  const x = a.slice().sort(), y = b.slice().sort();
  return x.every((t, i) => t === y[i]);
}

/** Pertahankan urutan manual pemain, ubin baru dari server ditaruh di belakang. */
export function gabungUrutan(lokal, server) {
  const sisa = server.slice(), hasil = [];
  lokal.forEach(t => { const k = sisa.indexOf(t); if (k !== -1) { hasil.push(t); sisa.splice(k, 1); } });
  return hasil.concat(sisa);
}

export function bisaBuang(s) {
  return !!s && s.status === 'playing' && s.turn === s.me && s.hasDrawn && !s.gameOver && !s.klaim;
}

/** Saran hint hanya berlaku selama situasi meja belum berubah. */
export function konteksHint(s) {
  if (!s || s.gameOver) return 'x';
  if (s.klaim) return 'k|' + s.klaim.from + '|' + s.discards.length + '|' + (s.klaim.sudahJawab ? 1 : 0);
  return 't|' + s.turn + '|' + s.hasDrawn + '|' + s.discards.length + '|' + s.players[s.me].handCount;
}

export const kapital = s => s[0].toUpperCase() + s.slice(1);
