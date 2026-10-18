import { META } from './meta.js';
import ludo from './ludo/mesin.js';
import ulartangga from './ulartangga/mesin.js';
import remi from './remi/mesin.js';
import cangkul from './cangkul/mesin.js';
import capsa from './capsa/mesin.js';
import ceki from './ceki/mesin.js';
import gaple from './gaple/mesin.js';
import uno from './uno/mesin.js';
import catur from './catur/mesin.js';
import halma from './halma/mesin.js';
import congklak from './congklak/mesin.js';
import PapanLudo from './ludo/Papan.jsx';
import PapanUlar from './ulartangga/Papan.jsx';
import PapanRemi from './remi/Papan.jsx';
import PapanCangkul from './cangkul/Papan.jsx';
import PapanCapsa from './capsa/Papan.jsx';
import PapanCeki from './ceki/Papan.jsx';
import PapanGaple from './gaple/Papan.jsx';
import PapanUno from './uno/Papan.jsx';
import PapanCatur from './catur/Papan.jsx';
import PapanHalma from './halma/Papan.jsx';
import PapanCongklak from './congklak/Papan.jsx';

export const KATEGORI = [
  { id: 'papan', nama: 'Papan Dadu', ikon: '🎲', sub: 'Lempar dadu, jalankan bidak.', games: ['ludo', 'ulartangga'] },
  { id: 'strategi', nama: 'Strategi', ikon: '♟\uFE0E', sub: 'Tanpa dadu, adu taktik.', games: ['catur', 'halma', 'congklak'] },
  { id: 'kartu', nama: 'Kartu', ikon: '🃏', sub: 'Uno, Remi, Cangkul, Capsa, dan kartu Ceki.', games: ['uno', 'remi', 'cangkul', 'capsa', 'ceki'] },
  { id: 'domino', nama: 'Domino', ikon: '🁫', sub: 'Sambung kartu balak.', games: ['gaple'] },
  { id: 'ubin', nama: 'Ubin', ikon: '🀄', sub: 'Susun ubin jadi set.', games: ['mahjong'] }
];

export const GAMES = {
  ludo: {
    mesin: ludo, Papan: PapanLudo, kategori: 'papan', min: 2, maks: 4, bawaan: 4, ikon: '🔴',
    aturan: [
      'Lempar dadu di giliran Anda. Bidak keluar kandang hanya dengan angka 6.',
      'Ketuk bidak yang menyala untuk menjalankannya. Jika hanya satu pilihan, bidak jalan otomatis.',
      'Mendarat di petak bidak lawan memulangkan bidak itu ke kandangnya — kecuali di petak aman ★ dan petak start.',
      'Angka 6, memakan bidak, atau memasukkan bidak ke rumah = lempar lagi. Tiga kali 6 berturut-turut = giliran hangus.',
      'Masuk rumah (tengah papan) harus dengan angka pas. Yang pertama memasukkan keempat bidak menang.'
    ]
  },
  ulartangga: {
    mesin: ulartangga, Papan: PapanUlar, kategori: 'papan', min: 2, maks: 4, bawaan: 4, ikon: '🐍',
    aturan: [
      'Lempar dadu dan maju sesuai angka. Angka 6 = lempar lagi.',
      'Berhenti di kaki tangga: naik. Berhenti di kepala ular: turun ke ekornya.',
      'Harus pas di petak 100; kelebihan langkah memantul mundur.'
    ]
  },
  remi: {
    mesin: remi, Papan: PapanRemi, kategori: 'kartu', min: 2, maks: 4, bawaan: 4, ikon: '🂡',
    aturan: [
      'Tiap pemain memegang 7 kartu. Di giliran Anda: ambil 1 kartu dari tumpukan tertutup atau kartu teratas buangan, lalu buang 1 kartu.',
      'Seri: 3 kartu atau lebih berurutan dengan jenis sama (As bisa A-2-3 atau Q-K-A). Trengguli: 3–4 kartu berangka sama.',
      'Jika setelah mengambil, 7 kartu Anda habis tersusun jadi seri/trengguli, pilih kartu ke-8 lalu tekan TUTUP untuk menang.',
      'Poin kalah = jumlah nilai kartu yang tidak masuk susunan (As = 1, J/Q/K = 10).',
      'Tumpukan habis setelah dikocok ulang 3 kali → poin sisa terkecil menang.'
    ]
  },
  cangkul: {
    mesin: cangkul, Papan: PapanCangkul, kategori: 'kartu', min: 2, maks: 4, bawaan: 4, ikon: '♠',
    aturan: [
      'Tiap pemain memegang 7 kartu. Pembuka putaran memainkan kartu apa saja.',
      'Pemain lain wajib membalas dengan jenis yang sama (♠ ♥ ♦ ♣).',
      'Tidak punya jenis itu? Tekan Cangkul untuk mengambil kartu dari tumpukan sampai dapat. Tumpukan habis = Lewat.',
      'Kartu tertinggi dari jenis yang dibuka memenangkan putaran dan membuka putaran berikutnya (2 terendah, As tertinggi).',
      'Yang pertama menghabiskan kartu menang.'
    ]
  },
  capsa: {
    mesin: capsa, Papan: PapanCapsa, kategori: 'kartu', min: 2, maks: 4, bawaan: 4, ikon: '♦',
    aturan: [
      'Tiap pemain 13 kartu. Urutan: 3 terendah … K, As, 2 tertinggi. Jenis: ♦ < ♣ < ♥ < ♠.',
      'Pemegang 3♦ jalan pertama dan wajib memakai 3♦.',
      'Kombinasi: 1 kartu, pasangan, tris, atau 5 kartu (Straight < Flush < Full House < Four of a Kind + 1 < Straight Flush).',
      'Balas dengan jumlah kartu yang sama dan lebih tinggi, atau Lewat. Jika semua lewat, pemain terakhir bebas membuka.',
      'Yang pertama menghabiskan kartu menang.'
    ]
  },
  ceki: {
    mesin: ceki, Papan: PapanCeki, kategori: 'kartu', min: 2, maks: 4, bawaan: 4, ikon: '萬',
    aturan: [
      'Kartu ceki: 3 jenis — Bulat ●, Tali ‖, Ribu 萬 — bernilai 1–9, masing-masing 4 lembar.',
      'Tiap pemain 11 kartu. Di giliran Anda: ambil 1 kartu (tumpukan atau buangan teratas), lalu buang 1 kartu.',
      'Menang (CEKI) bila 12 kartu setelah mengambil habis tersusun jadi 4 set: Serian (3 kartu sama) atau Urutan (3 angka berurutan, jenis sama). Kemenangan dicek otomatis.',
      'Tumpukan habis tanpa pemenang = seri.',
      'Aturan Ceki berbeda di tiap daerah; ini versi sederhana yang mudah dipelajari.'
    ]
  },
  gaple: {
    mesin: gaple, Papan: PapanGaple, kategori: 'domino', min: 2, maks: 4, bawaan: 4, ikon: '🁣',
    aturan: [
      'Tiap pemain 7 kartu domino. Ronde pertama dibuka pemegang balak 6 [6|6]; ronde berikutnya dibuka pemenang sebelumnya.',
      'Pasang kartu yang angkanya cocok dengan salah satu ujung rantai. Jika cocok di dua ujung, pilih ujungnya.',
      'Tidak punya kartu yang cocok = Lewat (ketuk).',
      'Yang pertama menghabiskan kartu menang (GAPLE!). Jika semua buntu, mata terkecil yang menang.'
    ]
  },
  uno: {
    mesin: uno, Papan: PapanUno, kategori: 'kartu', min: 2, maks: 4, bawaan: 4, ikon: 'UNO', ikonKecil: '🃏',
    aturan: [
      'Tiap pemain 7 kartu. Mainkan kartu yang warna ATAU angka/simbolnya sama dengan kartu teratas.',
      'Kartu ganti warna (★) dan +4 bisa dimainkan kapan saja; pilih warna berikutnya.',
      'Lewati (⊘): pemain berikutnya dilewati. Putar (⇄): arah giliran berbalik (dengan 2 pemain sama dengan Lewati).',
      '+2 / +4: pemain berikutnya mengambil 2 / 4 kartu dan kehilangan giliran.',
      'Tidak bisa/mau main: ketuk tumpukan untuk mengambil 1 kartu. Jika kartu itu cocok boleh langsung dimainkan, kalau tidak giliran lewat.',
      'Yang pertama menghabiskan kartu menang.'
    ]
  },
  catur: {
    mesin: catur, Papan: PapanCatur, kategori: 'strategi', min: 2, maks: 2, bawaan: 2, ikon: '♞\uFE0E',
    aturan: [
      'Ketuk bidak Anda, lalu ketuk petak bertitik untuk melangkah. Putih jalan duluan; warna bertukar tiap ronde.',
      'Aturan lengkap: rokade, en passant, dan promosi pion (pilih Menteri, Benteng, Gajah, atau Kuda).',
      'Skak mat = menang. Pat (tidak ada langkah sah tanpa skak), 50 langkah tanpa makan/pion, posisi terulang 3 kali, atau bidak tidak cukup = remis.',
      'Tombol Menyerah bisa dipakai kapan saja.'
    ]
  },
  halma: {
    mesin: halma, Papan: PapanHalma, kategori: 'strategi', min: 2, maks: 4, bawaan: 2, ikon: '✡\uFE0E',
    aturan: [
      'Papan bintang, tiap pemain 10 bidak di satu sudut. Tujuan: memindahkan semua bidak ke sudut seberang.',
      'Di giliran Anda, geser satu bidak ke lubang tetangga yang kosong, ATAU lompati satu bidak (milik siapa saja) ke lubang kosong di baliknya.',
      'Lompatan boleh berantai dalam satu giliran — titik di papan menunjukkan semua tujuan yang bisa dicapai.',
      'Supaya tidak bisa dihalangi: jika sudut tujuan penuh dan hanya berisi bidak Anda atau bidak lawan yang belum keluar dari kandangnya, Anda menang.',
      'Untuk 2–4 pemain (versi 6 pemain belum tersedia).'
    ]
  },
  congklak: {
    mesin: congklak, Papan: PapanCongklak, kategori: 'strategi', min: 2, maks: 2, bawaan: 2, ikon: '◉',
    aturan: [
      'Tiap pemain punya 7 lubang (masing-masing 7 biji) dan 1 lumbung. Lubang Anda di baris bawah, lumbung Anda di kanan.',
      'Pilih satu lubang, biji disebar satu per satu berlawanan arah jarum jam (melewati lumbung lawan).',
      'Biji terakhir di lubang berisi: ambil semua isinya dan lanjut menyebar.',
      'Biji terakhir di lumbung sendiri: main lagi. Di lubang kosong milik sendiri: tembak — biji itu dan isi lubang lawan di seberangnya masuk lumbung Anda.',
      'Permainan selesai bila pemain yang mendapat giliran tidak punya biji. Lumbung terbanyak menang.'
    ]
  },
  mahjong: {
    eksternal: './mahjong/', nama: 'Mahjong', kategori: 'ubin', min: 4, maks: 4, ikon: '🀄',
    ringkas: 'Mahjong 4 pemain dengan Pong, Chow, Kong, dan hint.'
  }
};

// Nama & ringkasan dari META; info min/maks juga disalin ke mesin (dibaca server meja)
Object.entries(GAMES).forEach(([id, g]) => {
  if (META[id]) Object.assign(g, META[id]);
  if (g.mesin) Object.assign(g.mesin, { id, min: g.min, maks: g.maks });
});
