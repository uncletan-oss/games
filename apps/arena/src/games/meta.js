/**
 * Data dasar tiap game (tanpa React) — dipakai aplikasi dan saat build
 * untuk membuat halaman + PWA sendiri per game di /<id>/ (mis. /games/ludo/).
 */
export const META = {
  ludo: { nama: 'Ludo', ringkas: 'Balapan 4 bidak keliling papan sampai rumah. Makan bidak lawan!', warna: '#D9483B' },
  ulartangga: { nama: 'Ular Tangga', ringkas: 'Naik tangga, hindari ular. Siapa duluan sampai 100?', warna: '#2E8B57' },
  catur: { nama: 'Catur', ringkas: 'Catur aturan lengkap. Skak mat raja lawan!', warna: '#5A3A22' },
  halma: { nama: 'Halma', ringkas: 'Dam bintang: lompat berantai, pindahkan 10 bidak ke sudut seberang.', warna: '#B58B52' },
  congklak: { nama: 'Congklak', ringkas: 'Dakon: sebar biji, tembak lubang lawan, penuhi lumbungmu.', warna: '#7A4B21' },
  uno: { nama: 'Uno', ringkas: 'Cocokkan warna atau angka, jebak lawan dengan +2 dan +4!', warna: '#D7262E' },
  remi: { nama: 'Remi', ringkas: 'Susun 7 kartu jadi seri & trengguli, lalu TUTUP.', warna: '#1B5E45' },
  cangkul: { nama: 'Cangkul', ringkas: 'Ikuti jenis kartu, tidak punya? Mencangkul! Habiskan kartu duluan.', warna: '#1B5E45' },
  capsa: { nama: 'Capsa', ringkas: 'Capsa banting / Big Two: buang kombinasi lebih tinggi, habiskan 13 kartu.', warna: '#1B5E45' },
  ceki: { nama: 'Ceki', ringkas: 'Kartu ceki versi sederhana: susun 4 set, teriak CEKI!', warna: '#8C1D2C' },
  gaple: { nama: 'Gaple', ringkas: 'Domino balak: sambung ujung rantai, habiskan kartu duluan.', warna: '#1B5E45' }
};

export const ID_GAME = Object.keys(META);
