import ludo from './ludo/mesin.js';
import ulartangga from './ulartangga/mesin.js';
import remi from './remi/mesin.js';
import cangkul from './cangkul/mesin.js';
import capsa from './capsa/mesin.js';
import ceki from './ceki/mesin.js';
import gaple from './gaple/mesin.js';
import PapanLudo from './ludo/Papan.jsx';
import PapanUlar from './ulartangga/Papan.jsx';
import PapanRemi from './remi/Papan.jsx';
import PapanCangkul from './cangkul/Papan.jsx';
import PapanCapsa from './capsa/Papan.jsx';
import PapanCeki from './ceki/Papan.jsx';
import PapanGaple from './gaple/Papan.jsx';

export const KATEGORI = [
  { id: 'papan', nama: 'Papan', ikon: '🎲', sub: 'Lempar dadu, jalankan bidak.', games: ['ludo', 'ulartangga'] },
  { id: 'kartu', nama: 'Kartu', ikon: '🃏', sub: 'Remi, Cangkul, Capsa, dan kartu Ceki.', games: ['remi', 'cangkul', 'capsa', 'ceki'] },
  { id: 'domino', nama: 'Domino', ikon: '🁫', sub: 'Sambung kartu balak.', games: ['gaple'] },
  { id: 'ubin', nama: 'Ubin', ikon: '🀄', sub: 'Susun ubin jadi set.', games: ['mahjong'] }
];

export const GAMES = {
  ludo: {
    mesin: ludo, Papan: PapanLudo, nama: 'Ludo', kategori: 'papan', min: 2, maks: 4, bawaan: 4, ikon: '🔴',
    ringkas: 'Balapan 4 bidak keliling papan sampai rumah. Makan bidak lawan!',
    aturan: [
      'Lempar dadu di giliran Anda. Bidak keluar kandang hanya dengan angka 6.',
      'Ketuk bidak yang menyala untuk menjalankannya. Jika hanya satu pilihan, bidak jalan otomatis.',
      'Mendarat di petak bidak lawan memulangkan bidak itu ke kandangnya — kecuali di petak aman ★ dan petak start.',
      'Angka 6, memakan bidak, atau memasukkan bidak ke rumah = lempar lagi. Tiga kali 6 berturut-turut = giliran hangus.',
      'Masuk rumah (tengah papan) harus dengan angka pas. Yang pertama memasukkan keempat bidak menang.'
    ]
  },
  ulartangga: {
    mesin: ulartangga, Papan: PapanUlar, nama: 'Ular Tangga', kategori: 'papan', min: 2, maks: 4, bawaan: 4, ikon: '🐍',
    ringkas: 'Naik tangga, hindari ular. Siapa duluan sampai 100?',
    aturan: [
      'Lempar dadu dan maju sesuai angka. Angka 6 = lempar lagi.',
      'Berhenti di kaki tangga: naik. Berhenti di kepala ular: turun ke ekornya.',
      'Harus pas di petak 100; kelebihan langkah memantul mundur.'
    ]
  },
  remi: {
    mesin: remi, Papan: PapanRemi, nama: 'Remi', kategori: 'kartu', min: 2, maks: 4, bawaan: 4, ikon: '🂡',
    ringkas: 'Susun 7 kartu jadi seri & trengguli, lalu TUTUP.',
    aturan: [
      'Tiap pemain memegang 7 kartu. Di giliran Anda: ambil 1 kartu dari tumpukan tertutup atau kartu teratas buangan, lalu buang 1 kartu.',
      'Seri: 3 kartu atau lebih berurutan dengan jenis sama (As bisa A-2-3 atau Q-K-A). Trengguli: 3–4 kartu berangka sama.',
      'Jika setelah mengambil, 7 kartu Anda habis tersusun jadi seri/trengguli, pilih kartu ke-8 lalu tekan TUTUP untuk menang.',
      'Poin kalah = jumlah nilai kartu yang tidak masuk susunan (As = 1, J/Q/K = 10).',
      'Tumpukan habis setelah dikocok ulang 3 kali → poin sisa terkecil menang.'
    ]
  },
  cangkul: {
    mesin: cangkul, Papan: PapanCangkul, nama: 'Cangkul', kategori: 'kartu', min: 2, maks: 4, bawaan: 4, ikon: '♠',
    ringkas: 'Ikuti jenis kartu, tidak punya? Mencangkul! Habiskan kartu duluan.',
    aturan: [
      'Tiap pemain memegang 7 kartu. Pembuka putaran memainkan kartu apa saja.',
      'Pemain lain wajib membalas dengan jenis yang sama (♠ ♥ ♦ ♣).',
      'Tidak punya jenis itu? Tekan Cangkul untuk mengambil kartu dari tumpukan sampai dapat. Tumpukan habis = Lewat.',
      'Kartu tertinggi dari jenis yang dibuka memenangkan putaran dan membuka putaran berikutnya (2 terendah, As tertinggi).',
      'Yang pertama menghabiskan kartu menang.'
    ]
  },
  capsa: {
    mesin: capsa, Papan: PapanCapsa, nama: 'Capsa', kategori: 'kartu', min: 2, maks: 4, bawaan: 4, ikon: '♦',
    ringkas: 'Capsa banting / Big Two: buang kombinasi lebih tinggi, habiskan 13 kartu.',
    aturan: [
      'Tiap pemain 13 kartu. Urutan: 3 terendah … K, As, 2 tertinggi. Jenis: ♦ < ♣ < ♥ < ♠.',
      'Pemegang 3♦ jalan pertama dan wajib memakai 3♦.',
      'Kombinasi: 1 kartu, pasangan, tris, atau 5 kartu (Straight < Flush < Full House < Four of a Kind + 1 < Straight Flush).',
      'Balas dengan jumlah kartu yang sama dan lebih tinggi, atau Lewat. Jika semua lewat, pemain terakhir bebas membuka.',
      'Yang pertama menghabiskan kartu menang.'
    ]
  },
  ceki: {
    mesin: ceki, Papan: PapanCeki, nama: 'Ceki', kategori: 'kartu', min: 2, maks: 4, bawaan: 4, ikon: '萬',
    ringkas: 'Kartu ceki versi sederhana: susun 4 set, teriak CEKI!',
    aturan: [
      'Kartu ceki: 3 jenis — Bulat ●, Tali ‖, Ribu 萬 — bernilai 1–9, masing-masing 4 lembar.',
      'Tiap pemain 11 kartu. Di giliran Anda: ambil 1 kartu (tumpukan atau buangan teratas), lalu buang 1 kartu.',
      'Menang (CEKI) bila 12 kartu setelah mengambil habis tersusun jadi 4 set: Serian (3 kartu sama) atau Urutan (3 angka berurutan, jenis sama). Kemenangan dicek otomatis.',
      'Tumpukan habis tanpa pemenang = seri.',
      'Aturan Ceki berbeda di tiap daerah; ini versi sederhana yang mudah dipelajari.'
    ]
  },
  gaple: {
    mesin: gaple, Papan: PapanGaple, nama: 'Gaple', kategori: 'domino', min: 2, maks: 4, bawaan: 4, ikon: '🁣',
    ringkas: 'Domino balak: sambung ujung rantai, habiskan kartu duluan.',
    aturan: [
      'Tiap pemain 7 kartu domino. Ronde pertama dibuka pemegang balak 6 [6|6]; ronde berikutnya dibuka pemenang sebelumnya.',
      'Pasang kartu yang angkanya cocok dengan salah satu ujung rantai. Jika cocok di dua ujung, pilih ujungnya.',
      'Tidak punya kartu yang cocok = Lewat (ketuk).',
      'Yang pertama menghabiskan kartu menang (GAPLE!). Jika semua buntu, mata terkecil yang menang.'
    ]
  },
  mahjong: {
    eksternal: './mahjong/', nama: 'Mahjong', kategori: 'ubin', min: 4, maks: 4, ikon: '🀄',
    ringkas: 'Mahjong 4 pemain dengan Pong, Chow, Kong, dan hint.'
  }
};

// Melengkapi info min/maks ke mesin (dibaca server meja)
Object.entries(GAMES).forEach(([id, g]) => { if (g.mesin) Object.assign(g.mesin, { id, min: g.min, maks: g.maks }); });
