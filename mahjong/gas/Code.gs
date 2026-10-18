/**
 * Mahjong 4 Pemain + BOT AI — Server (Google Apps Script)
 * Fitur: Pong / Chow / Kong dari buangan, Kong sendiri (tertutup & tambahan),
 *        Ron (menang dari buangan), Tsumo, hint langsung untuk pemain.
 *
 * Client-nya ditulis dengan React (folder src/) dan di-build menjadi satu file Index.html.
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Mahjong 4 Pemain + BOT AI')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

const DICT = {
  "🀙":"d1","🀚":"d2","🀛":"d3","🀜":"d4","🀝":"d5","🀞":"d6","🀟":"d7","🀠":"d8","🀡":"d9",
  "🀐":"b1","🀑":"b2","🀒":"b3","🀓":"b4","🀔":"b5","🀕":"b6","🀖":"b7","🀗":"b8","🀘":"b9",
  "🀇":"c1","🀈":"c2","🀉":"c3","🀊":"c4","🀋":"c5","🀌":"c6","🀍":"c7","🀎":"c8","🀏":"c9",
  "🀀":"h1","🀁":"h2","🀂":"h3","🀃":"h4","🀄":"h5","🀅":"h6","🀆":"h7"
};
const REV_DICT = Object.keys(DICT).reduce((acc, key) => { acc[DICT[key]] = key; return acc; }, {});
const SEMUA_UBIN = Object.keys(DICT);          // 34 jenis ubin, urutan: Bulat, Bambu, Karakter, Honor
const LEVEL_BOT = ['easy', 'medium', 'hard'];
const NAMA_KURSI = ['Timur', 'Selatan', 'Barat', 'Utara'];
const PREFIX = 'ROOM_';
const CACHE_TTL_DETIK = 21600;                  // 6 jam (maks CacheService)
const KAMAR_AKTIF_MS = 30 * 60 * 1000;          // kamar dianggap "sedang dipakai" bila aktif < 30 menit
const UMUR_KAMAR_MAKS_MS = 12 * 60 * 60 * 1000; // kamar idle > 12 jam dihapus otomatis
const KLAIM_MS = 10000;                         // waktu pemain manusia memutuskan klaim
const GILIRAN_MS = 60000;                       // batas waktu giliran pemain manusia (AFK → dimainkan otomatis)
const MAKS_NAMA = 16;
const AKSI_KLAIM = ['ron', 'kong', 'pong', 'chow', 'pass'];
const PRIORITAS = { pass: 0, chow: 1, pong: 2, kong: 2, ron: 3 };

/* ======================= API yang dipanggil client ======================= */

/**
 * Host membuat kamar → status "lobby". cfg = { nama, bots: {1:'easy'|..|'', 2:.., 3:..}, hint: bool }
 * Mengembalikan { token, view }. Token disimpan client untuk identitas & rejoin.
 */
function buatKamar(kodeKamar, cfg, paksa, tokenLama) {
  const kode = normalKode_(kodeKamar);
  cfg = cfg || {};
  const nama = normalNama_(cfg.nama);
  return denganKunci_(() => {
    const lama = bacaState_(kode);
    if (lama && Date.now() - (lama.updatedAt || 0) < KAMAR_AKTIF_MS) {
      // Kamar masih dipakai: orang lain TIDAK boleh menimpa. Host kamar itu sendiri boleh (dengan konfirmasi).
      const sayaHost = tokenLama && lama.seats[lama.host] && lama.seats[lama.host].token === tokenLama;
      if (!sayaHost) throw new Error('KAMAR_DIPAKAI');
      if (!paksa) throw new Error('KAMAR_AKTIF');
    }
    bersihkanKamarLama_();
    const token = Utilities.getUuid();
    const state = kamarBaru_(kode, cfg, nama, token);
    simpanState_(state);
    return { token: token, view: untukPemain_(state, 0) };
  });
}

/** Gabung ke kamar: rejoin jika token dikenal, kalau tidak ambil kursi manusia kosong pertama (hanya saat lobby). */
function gabungKamar(kodeKamar, nama, token) {
  const kode = normalKode_(kodeKamar);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) throw new Error('KAMAR_TIDAK_ADA');
    if (token) {
      const lama = state.seats.findIndex(s => !s.bot && s.token === token);
      if (lama !== -1) return { token: token, view: untukPemain_(state, lama) };
    }
    const nm = normalNama_(nama);
    if (state.status !== 'lobby') {
      // Kursi yang ditinggal pemain (sementara dimainkan BOT) boleh diambil alih
      const kosong = state.seats.findIndex(s => s.ditinggal);
      if (kosong === -1) throw new Error('KAMAR_SUDAH_MAIN');
      const tk2 = Utilities.getUuid();
      const nm2 = namaUnik_(state, nm, kosong);
      state.seats[kosong] = { name: nm2, token: tk2, bot: null };
      delete state.bots[kosong];
      state.players[kosong].name = nm2;
      state.log = `👋 ${nm2} bergabung dan mengambil alih kursi ${NAMA_KURSI[kosong]}.`;
      simpanState_(state);
      return { token: tk2, view: untukPemain_(state, kosong) };
    }
    const kosong = state.seats.filter(s => !s.bot && !s.token);
    let idx = state.seats.findIndex(s => !s.bot && !s.token && s.pesan && s.pesan.toLowerCase() === nm.toLowerCase());
    if (idx === -1) idx = state.seats.findIndex(s => !s.bot && !s.token && !s.pesan);
    if (idx === -1) {
      if (!kosong.length) throw new Error('KAMAR_PENUH');
      throw new Error('KURSI_DIPESAN:' + kosong.map(s => s.pesan).join(', '));
    }
    const tk = Utilities.getUuid();
    state.seats[idx].token = tk;
    state.seats[idx].name = state.seats[idx].pesan || namaUnik_(state, nm, idx);
    state.log = `${state.seats[idx].name} bergabung.`;
    simpanState_(state);
    return { token: tk, view: untukPemain_(state, idx) };
  });
}

/**
 * Keluar dari kamar.
 * - Lobby  : kursi kosong lagi.
 * - Bermain: kursi dilanjutkan BOT (Medium) agar permainan tidak macet; orang lain boleh mengambil alih kursi itu.
 * Host yang keluar → peran host pindah ke pemain manusia berikutnya. Tidak ada manusia tersisa → kamar dihapus.
 */
function keluarKamar(kodeKamar, token) {
  const kode = normalKode_(kodeKamar);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) return null;
    const idx = state.seats.findIndex(s => !s.bot && s.token && s.token === token);
    if (idx === -1) return null;
    const nama = state.seats[idx].name;

    if (state.status === 'lobby') {
      state.seats[idx] = { name: null, token: null, bot: null, pesan: state.seats[idx].pesan || null };
    } else {
      state.seats[idx] = { name: 'BOT (' + nama + ')', token: null, bot: 'medium', ditinggal: true };
      state.bots[idx] = 'medium';
      state.players[idx].name = state.seats[idx].name;
      // Klaim yang sedang menunggu jawaban pemain ini → diputuskan BOT
      const c = state.claim;
      if (c && c.opsi[idx] && !c.jawab[idx]) {
        c.jawab[idx] = keputusanBot_(c.opsi[idx], 'medium');
        cobaSelesaikanKlaim_(state, false);
      }
    }

    const manusia = state.seats.map((s, i) => (!s.bot && s.token) ? i : -1).filter(i => i !== -1);
    if (manusia.length === 0) { hapusKamar_(kode); return null; }

    let log = `🚪 ${nama} keluar` + (state.status === 'lobby' ? '.' : ' — kursinya dilanjutkan BOT.');
    if (idx === state.host) {
      state.host = manusia[0];
      log += ` Host sekarang: ${state.seats[state.host].name}.`;
    }
    state.log = log;
    simpanState_(state);
    return null;
  });
}

/** Daftar kamar yang aktif dalam 30 menit terakhir (untuk layar awal). Tidak memuat data rahasia. */
function daftarKamar() {
  const semua = PropertiesService.getScriptProperties().getProperties();
  const now = Date.now();
  const hasil = [];
  Object.keys(semua).forEach(k => {
    if (k.indexOf(PREFIX) !== 0) return;
    try {
      const s = JSON.parse(semua[k]);
      if (!s.seats || now - (s.updatedAt || 0) > KAMAR_AKTIF_MS) return;
      const kosong = s.status === 'lobby'
        ? s.seats.filter(x => !x.bot && !x.token).length
        : s.seats.filter(x => x.ditinggal).length;
      hasil.push({
        kode: s.roomCode,
        status: s.status,
        host: (s.seats[s.host || 0] || {}).name || '-',
        manusia: s.seats.filter(x => !x.bot && x.token).length,
        bot: s.seats.filter(x => x.bot).length,
        kosong: kosong,
        menunggu: s.status === 'lobby' ? s.seats.filter(x => !x.bot && !x.token && x.pesan).map(x => x.pesan) : [],
        ronde: s.ronde || 0,
        updatedAt: s.updatedAt
      });
    } catch (e) {}
  });
  return hasil.sort((a, b) => (b.kosong > 0) - (a.kosong > 0) || b.updatedAt - a.updatedAt).slice(0, 20);
}

/** Host mengubah kursi saat lobby: level BOT ('easy'|'medium'|'hard') atau '' untuk kursi orang asli. */
function aturKursi(kodeKamar, token, seat, level, namaPesan) {
  const kode = normalKode_(kodeKamar);
  const s = validIdx_(seat);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) throw new Error('KAMAR_TIDAK_ADA');
    if (idxDariToken_(state, token) !== state.host) throw new Error('Hanya host yang bisa mengatur kursi.');
    if (state.status !== 'lobby') throw new Error('Kursi hanya bisa diatur sebelum permainan dimulai.');
    if (s === state.host) throw new Error('Kursi host tidak bisa diubah.');
    if (LEVEL_BOT.indexOf(level) !== -1) {
      state.seats[s] = { name: null, token: null, bot: level };
    } else if (state.seats[s].bot || namaPesan !== undefined) {
      const pesan = namaPesan ? normalNama_(namaPesan) : null;
      if (pesan && state.seats.some((x, i) => i !== s && [x.name, x.pesan].some(n => n && n.toLowerCase() === pesan.toLowerCase()))) {
        throw new Error('Nama "' + pesan + '" sudah dipakai di kamar ini.');
      }
      state.seats[s] = { name: null, token: null, bot: null, pesan: pesan };
    }
    namaiBot_(state);
    simpanState_(state);
    return untukPemain_(state, state.host);
  });
}

/** Host mengubah opsi hint saat lobby. */
function aturHint(kodeKamar, token, aktif) {
  const kode = normalKode_(kodeKamar);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) throw new Error('KAMAR_TIDAK_ADA');
    if (idxDariToken_(state, token) !== state.host) throw new Error('Hanya host yang bisa mengubah opsi hint.');
    if (state.status !== 'lobby') throw new Error('Opsi hint hanya bisa diubah sebelum permainan dimulai.');
    state.hintAktif = !!aktif;
    simpanState_(state);
    return untukPemain_(state, state.host);
  });
}

function mulaiPermainan(kodeKamar, token) {
  const kode = normalKode_(kodeKamar);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) throw new Error('KAMAR_TIDAK_ADA');
    const me = idxDariToken_(state, token);
    if (me !== state.host) throw new Error('Hanya host yang bisa memulai permainan.');
    if (state.status !== 'lobby') return untukPemain_(state, me);
    const kosong = state.seats.filter(s => !s.bot && !s.token).length;
    if (kosong) throw new Error(`Masih ada ${kosong} kursi kosong. Tunggu pemain bergabung atau jadikan BOT.`);
    mulaiRonde_(state);
    simpanState_(state);
    return untukPemain_(state, me);
  });
}

function mainLagi(kodeKamar, token) {
  const kode = normalKode_(kodeKamar);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) throw new Error('KAMAR_TIDAK_ADA');
    const viewer = idxDariToken_(state, token);
    if (state.status === 'playing' && state.gameOver) {
      mulaiRonde_(state);
      simpanState_(state);
    }
    return untukPemain_(state, viewer);
  });
}

function getStatusMeja(kodeKamar, token) {
  const state = bacaState_(normalKode_(kodeKamar), true);
  if (!state) throw new Error('KAMAR_TIDAK_ADA');
  return untukPemain_(state, idxDariToken_(state, token));
}

function ambilUbin(kodeKamar, token, clientHand) {
  const kode = normalKode_(kodeKamar);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) throw new Error('KAMAR_TIDAK_ADA');
    const idx = idxDariToken_(state, token);
    if (state.status !== 'playing') return untukPemain_(state, idx);
    if (state.claim || state.turn !== idx || state.hasDrawn || state.gameOver || state.bots[idx]) {
      return untukPemain_(state, idx);
    }
    const p = state.players[idx];
    if (samaIsi_(clientHand, p.hand)) p.hand = clientHand.slice(); // simpan urutan manual

    if (state.deck.length === 0) {
      selesaiSeri_(state);
    } else {
      ambilDariDeck_(state, idx);
      state.hasDrawn = true;
      if (!cekMenangSendiri_(state, idx, 'TSUMO')) state.log = `${p.name} mengambil 1 ubin.`;
    }
    simpanState_(state);
    return untukPemain_(state, idx);
  });
}

function buangUbin(kodeKamar, token, newHand, discarded) {
  const kode = normalKode_(kodeKamar);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) throw new Error('KAMAR_TIDAK_ADA');
    const idx = idxDariToken_(state, token);
    if (state.status !== 'playing') return untukPemain_(state, idx);
    if (state.claim || state.turn !== idx || !state.hasDrawn || state.gameOver) return untukPemain_(state, idx);

    const p = state.players[idx];
    const pos = p.hand.indexOf(discarded);
    if (pos === -1) throw new Error('Ubin yang dibuang tidak ada di tangan Anda.');
    const sisa = p.hand.slice();
    sisa.splice(pos, 1);
    p.hand = samaIsi_(newHand, sisa) ? newHand.slice() : sisa;

    setelahBuang_(state, idx, discarded, `${p.name} membuang ${discarded}`);
    simpanState_(state);
    return untukPemain_(state, idx);
  });
}

/** Jawaban pemain atas buangan lawan: 'ron' | 'kong' | 'pong' | 'chow' | 'pass'. */
function klaimUbin(kodeKamar, token, aksi, pilih) {
  const kode = normalKode_(kodeKamar);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) throw new Error('KAMAR_TIDAK_ADA');
    const idx = idxDariToken_(state, token);
    if (state.status !== 'playing') return untukPemain_(state, idx);
    const c = state.claim;
    if (!c || state.gameOver || !c.opsi[idx] || c.jawab[idx]) return untukPemain_(state, idx);
    if (AKSI_KLAIM.indexOf(aksi) === -1) throw new Error('Aksi klaim tidak dikenal.');
    if (aksi !== 'pass' && !c.opsi[idx][aksi]) throw new Error('Anda tidak bisa ' + aksi.toUpperCase() + ' ubin ini.');

    let pil = 0;
    if (aksi === 'chow') {
      pil = Number(pilih) || 0;
      if (!c.opsi[idx].chow[pil]) throw new Error('Pilihan Chow tidak valid.');
    }
    c.jawab[idx] = { aksi: aksi, pilih: pil };
    cobaSelesaikanKlaim_(state, false);
    simpanState_(state);
    return untukPemain_(state, idx);
  });
}

/** Dipanggil client saat hitung mundur klaim habis; pemain yang belum menjawab dianggap "lewati". */
function tickKlaim(kodeKamar, token) {
  const kode = normalKode_(kodeKamar);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) throw new Error('KAMAR_TIDAK_ADA');
    const viewer = idxDariToken_(state, token);
    if (state.claim && !state.gameOver && Date.now() >= state.claim.deadline) {
      cobaSelesaikanKlaim_(state, true);
      simpanState_(state);
    }
    return untukPemain_(state, viewer);
  });
}

/** Kong di giliran sendiri: 4 ubin sama di tangan (tertutup) atau menambah Pong yang sudah terbuka. */
function deklarasiKong(kodeKamar, token, tile) {
  const kode = normalKode_(kodeKamar);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) throw new Error('KAMAR_TIDAK_ADA');
    const idx = idxDariToken_(state, token);
    if (state.status !== 'playing') return untukPemain_(state, idx);
    if (state.claim || state.turn !== idx || !state.hasDrawn || state.gameOver) return untukPemain_(state, idx);
    if (!lakukanKongSendiri_(state, idx, tile)) throw new Error('Ubin ini tidak bisa di-Kong.');
    simpanState_(state);
    return untukPemain_(state, idx);
  });
}

/**
 * expectedVersion: bot hanya jalan jika state masih versi yang dilihat client,
 * sehingga panggilan ganda tidak membuat bot main 2x.
 */
function jalankanBot(kodeKamar, token, expectedVersion) {
  const kode = normalKode_(kodeKamar);
  return denganKunci_(() => {
    const state = bacaState_(kode);
    if (!state) throw new Error('KAMAR_TIDAK_ADA');
    const viewer = idxDariToken_(state, token);
    if (state.status !== 'playing' || state.gameOver || state.claim) return untukPemain_(state, viewer);
    const turn = state.turn;
    const afk = !state.bots[turn] && Date.now() - (state.turnSince || 0) >= GILIRAN_MS;
    const level = state.bots[turn] || (afk ? 'afk' : null);
    if (!level) return untukPemain_(state, viewer);
    if (expectedVersion != null && state.version !== expectedVersion) return untukPemain_(state, viewer);

    const p = state.players[turn];
    // Setelah Pong/Chow, bot sudah memegang ubin ekstra dan langsung membuang
    if (!state.hasDrawn) {
      if (state.deck.length === 0) {
        selesaiSeri_(state);
        simpanState_(state);
        return untukPemain_(state, viewer);
      }
      ambilDariDeck_(state, turn);
      state.hasDrawn = true;
      if (cekMenangSendiri_(state, turn, 'TSUMO')) {
        simpanState_(state);
        return untukPemain_(state, viewer);
      }
    }

    botKongSendiri_(state, turn, level);
    if (!state.gameOver) {
      const di = level === 'afk'
        ? (state.lastDrawn && state.lastDrawn.p === turn ? p.hand.lastIndexOf(state.lastDrawn.tile) : p.hand.length - 1)
        : pilihBuangBot_(p.hand, level);
      const discarded = p.hand.splice(di, 1)[0];
      if (level !== 'afk') p.hand = urutkan_(p.hand); // urutan manual pemain AFK dipertahankan
      setelahBuang_(state, turn, discarded, afk
        ? `⏱️ Waktu ${p.name} habis — otomatis membuang ${discarded}`
        : `🤖 ${p.name} membuang ${discarded}`);
    }
    simpanState_(state);
    return untukPemain_(state, viewer);
  });
}

/* ============================ Alur klaim buangan ============================ */

function setelahBuang_(state, idx, tile, log) {
  state.discards.push({ p: idx, tile: tile });
  state.hasDrawn = false;
  state.lastDrawn = null;
  state.log = log;

  const opsi = {};
  for (let k = 1; k < 4; k++) {
    const j = (idx + k) % 4;
    const o = opsiKlaim_(state, j, idx, tile);
    if (o) opsi[j] = o;
  }
  if (Object.keys(opsi).length === 0) { lanjutGiliran_(state, idx); return; }

  state.claim = { tile: tile, from: idx, opsi: opsi, jawab: {}, deadline: Date.now() + KLAIM_MS };
  Object.keys(opsi).forEach(j => {
    const lvl = state.bots[j];
    if (lvl) state.claim.jawab[j] = keputusanBot_(opsi[j], lvl);
  });
  cobaSelesaikanKlaim_(state, false);
}

function opsiKlaim_(state, j, from, tile) {
  const p = state.players[j];
  const n = p.hand.filter(t => t === tile).length;
  const o = {};
  if (cekValidasiMahjong(p.hand.concat([tile])).valid) o.ron = true;
  if (state.deck.length > 0) { // saat tumpukan habis hanya Ron yang boleh
    if (n >= 2) o.pong = true;
    if (n >= 3) o.kong = true;
    if (j === (from + 1) % 4) {
      const combos = kombinasiChow_(p.hand, tile);
      if (combos.length) o.chow = combos;
    }
  }
  return Object.keys(o).length ? o : null;
}

/** Pasangan ubin di tangan yang bisa membentuk seri dengan ubin buangan. */
function kombinasiChow_(hand, tile) {
  const code = DICT[tile];
  if (!code || code[0] === 'h') return [];
  const suit = code[0], v = parseInt(code[1], 10);
  const ada = n => n >= 1 && n <= 9 && hand.indexOf(REV_DICT[suit + n]) !== -1;
  const hasil = [];
  [[v - 2, v - 1], [v - 1, v + 1], [v + 1, v + 2]].forEach(pair => {
    if (ada(pair[0]) && ada(pair[1])) hasil.push([REV_DICT[suit + pair[0]], REV_DICT[suit + pair[1]]]);
  });
  return hasil;
}

function maxPrioritas_(o) {
  return Math.max.apply(null, Object.keys(o).map(k => PRIORITAS[k]));
}

/** Prioritas: Ron > Kong/Pong > Chow. Ron ganda → pemain terdekat setelah pembuang. */
function cobaSelesaikanKlaim_(state, waktuHabis) {
  const c = state.claim;
  if (!c) return;
  const urutan = [1, 2, 3].map(k => (c.from + k) % 4).filter(j => c.opsi[j]);

  let best = null, prior = 0;
  urutan.forEach(j => {
    const a = c.jawab[j];
    if (a && PRIORITAS[a.aksi] > prior) { prior = PRIORITAS[a.aksi]; best = { j: j, aksi: a.aksi, pilih: a.pilih }; }
  });

  if (!waktuHabis) {
    const posBest = best ? urutan.indexOf(best.j) : Infinity;
    const masihTunggu = urutan.some((j, pos) => {
      if (c.jawab[j]) return false;
      const mp = maxPrioritas_(c.opsi[j]);
      return mp > prior || (mp === prior && prior === PRIORITAS.ron && pos < posBest);
    });
    if (masihTunggu) return;
  }

  if (best) eksekusiKlaim_(state, best);
  else lanjutGiliran_(state, c.from);
}

function eksekusiKlaim_(state, best) {
  const c = state.claim;
  const tile = c.tile;
  const p = state.players[best.j];
  const dari = state.players[c.from].name;
  state.discards.pop();     // ubin diambil dari tumpukan buangan
  state.claim = null;

  if (best.aksi === 'ron') {
    p.hand.push(tile);
    const w = cekValidasiMahjong(p.hand);
    selesaiMenang_(state, best.j, w.sets, `RON dari buangan ${dari}`, tile);
    return;
  }

  if (best.aksi === 'chow') {
    const combo = c.opsi[best.j].chow[best.pilih] || c.opsi[best.j].chow[0];
    buangDariTangan_(p, combo);
    p.melds.push({ type: 'chow', tiles: urutkan_(combo.concat([tile])), from: c.from });
  } else {
    const n = best.aksi === 'kong' ? 3 : 2;
    buangDariTangan_(p, Array(n).fill(tile));
    p.melds.push({ type: best.aksi, tiles: Array(n + 1).fill(tile), from: c.from });
  }

  state.turn = best.j;
  state.hasDrawn = true; // langsung wajib membuang (tanpa mengambil dari tumpukan)
  state.lastDrawn = null;
  state.log = `📣 ${p.name} ${best.aksi.toUpperCase()}! Mengambil ${tile} dari ${dari}.`;
  if (best.aksi === 'kong') ambilPengganti_(state, best.j);
}

function lanjutGiliran_(state, from) {
  state.claim = null;
  if (state.deck.length === 0) { selesaiSeri_(state); return; }
  state.turn = (from + 1) % 4;
  state.hasDrawn = false;
}

function lakukanKongSendiri_(state, idx, tile) {
  if (state.deck.length === 0 || !DICT[tile]) return false;
  const p = state.players[idx];
  const n = p.hand.filter(t => t === tile).length;
  if (n === 4) {
    buangDariTangan_(p, [tile, tile, tile, tile]);
    p.melds.push({ type: 'kong', tiles: [tile, tile, tile, tile], from: idx, concealed: true });
    state.log = `📣 ${p.name} KONG TERTUTUP ${tile}!`;
  } else {
    const m = p.melds.find(x => x.type === 'pong' && x.tiles[0] === tile);
    if (!m || n < 1) return false;
    buangDariTangan_(p, [tile]);
    m.type = 'kong';
    m.tiles.push(tile);
    m.added = true;
    state.log = `📣 ${p.name} menambah Pong ${tile} menjadi KONG!`;
  }
  ambilPengganti_(state, idx);
  return true;
}

/** Setelah Kong, pemain mengambil 1 ubin pengganti (bisa langsung menang). */
function ambilPengganti_(state, idx) {
  if (state.deck.length === 0) return;
  ambilDariDeck_(state, idx);
  if (!cekMenangSendiri_(state, idx, 'ubin pengganti KONG')) state.log += ' Mengambil ubin pengganti.';
}

function ambilDariDeck_(state, idx) {
  const t = state.deck.pop();
  state.players[idx].hand.push(t);
  state.lastDrawn = { p: idx, tile: t };
  return t;
}

function cekMenangSendiri_(state, idx, keterangan) {
  const w = cekValidasiMahjong(state.players[idx].hand);
  if (!w.valid) return false;
  selesaiMenang_(state, idx, w.sets, keterangan, state.lastDrawn ? state.lastDrawn.tile : null);
  return true;
}

function buangDariTangan_(p, tiles) {
  tiles.forEach(t => {
    const k = p.hand.indexOf(t);
    if (k === -1) throw new Error('Ubin ' + t + ' tidak ditemukan di tangan.');
    p.hand.splice(k, 1);
  });
}

/* ============================ Validasi menang ============================ */

/** hand = ubin di tangan saja (tanpa meld terbuka). Panjang harus 3n+2. */
function cekValidasiMahjong(handArray) {
  if (!Array.isArray(handArray) || handArray.length % 3 !== 2) return { valid: false };
  const counts = {};
  for (const t of handArray) {
    const code = DICT[t];
    if (!code) return { valid: false };
    counts[code] = (counts[code] || 0) + 1;
  }
  const kinds = Object.keys(counts).sort();

  // Tujuh pasang berbeda (hanya tanpa meld terbuka)
  if (handArray.length === 14 && kinds.length === 7 && kinds.every(k => counts[k] === 2)) {
    return { valid: true, sets: kinds.map(k => [k, k]) };
  }

  for (const pair of kinds) {
    if (counts[pair] >= 2) {
      const temp = Object.assign({}, counts);
      temp[pair] -= 2;
      const sets = cekSisaSet_(temp, []);
      if (sets) return { valid: true, sets: sets.concat([[pair, pair]]) };
    }
  }
  return { valid: false };
}

function cekSisaSet_(counts, currentSets) {
  const firstTile = Object.keys(counts).sort().find(k => counts[k] > 0);
  if (!firstTile) return currentSets;

  if (counts[firstTile] >= 3) {
    counts[firstTile] -= 3;
    const res = cekSisaSet_(counts, currentSets.concat([[firstTile, firstTile, firstTile]]));
    counts[firstTile] += 3;
    if (res) return res;
  }

  const suit = firstTile[0];
  const val = parseInt(firstTile[1], 10);
  if (suit !== 'h' && val <= 7) {
    const t2 = suit + (val + 1), t3 = suit + (val + 2);
    if (counts[t2] > 0 && counts[t3] > 0) {
      counts[firstTile]--; counts[t2]--; counts[t3]--;
      const res = cekSisaSet_(counts, currentSets.concat([[firstTile, t2, t3]]));
      counts[firstTile]++; counts[t2]++; counts[t3]++;
      if (res) return res;
    }
  }
  return null;
}

function ubinMenang_(hand) {
  return SEMUA_UBIN.filter(t => cekValidasiMahjong(hand.concat([t])).valid);
}

/* ================================ BOT AI ================================= */

function keputusanBot_(opsi, level) {
  if (opsi.ron) return { aksi: 'ron', pilih: 0 };
  const mau = {
    easy:   { kong: 0.5, pong: 0.4, chow: 0.3 },
    medium: { kong: 1,   pong: 0.7, chow: 0.5 },
    hard:   { kong: 1,   pong: 1,   chow: 0.8 }
  }[level] || { kong: 0, pong: 0, chow: 0 };
  const r = Math.random();
  if (opsi.kong && r < mau.kong) return { aksi: 'kong', pilih: 0 };
  if (opsi.pong && r < mau.pong) return { aksi: 'pong', pilih: 0 };
  if (opsi.chow && r < mau.chow) return { aksi: 'chow', pilih: 0 };
  return { aksi: 'pass', pilih: 0 };
}

function botKongSendiri_(state, turn, level) {
  if (level === 'easy' || level === 'afk') return;
  for (let guard = 0; guard < 4 && !state.gameOver && state.deck.length > 0; guard++) {
    const p = state.players[turn];
    const counts = {};
    p.hand.forEach(t => counts[t] = (counts[t] || 0) + 1);
    const empat = Object.keys(counts).find(t => counts[t] === 4);
    const tambah = p.melds.find(m => m.type === 'pong' && counts[m.tiles[0]]);
    const t = empat || (tambah && tambah.tiles[0]);
    if (!t || !lakukanKongSendiri_(state, turn, t)) return;
  }
}

function pilihBuangBot_(hand, level) {
  const acak = n => Math.floor(Math.random() * n);
  if (level === 'easy') return acak(hand.length);

  const counts = {};
  hand.forEach(t => counts[t] = (counts[t] || 0) + 1);
  const singles = hand.map((t, i) => ({ t, i })).filter(o => counts[o.t] === 1);

  if (level === 'medium') return singles.length ? singles[acak(singles.length)].i : acak(hand.length);

  // hard: utamakan buangan yang membuat tenpai, kalau tidak ada buang ubin paling terisolasi
  const unik = Array.from(new Set(hand));
  let tenpaiBest = null, tenpaiJumlah = 0;
  if (hand.length % 3 === 2) {
    unik.forEach(b => {
      const h = hand.slice(); h.splice(h.indexOf(b), 1);
      const w = ubinMenang_(h).length;
      if (w > tenpaiJumlah) { tenpaiJumlah = w; tenpaiBest = b; }
    });
  }
  if (tenpaiBest) return hand.indexOf(tenpaiBest);
  return indeksTerisolasi_(hand, counts);
}

function indeksTerisolasi_(hand, counts) {
  let best = 0, bestSkor = Infinity;
  hand.forEach((t, i) => {
    const code = DICT[t], suit = code[0], val = parseInt(code[1], 10);
    let skor = (counts[t] - 1) * 4;
    if (suit === 'h') {
      skor -= 1;
    } else {
      [-2, -1, 1, 2].forEach(d => {
        const n = val + d;
        if (n >= 1 && n <= 9 && counts[REV_DICT[suit + n]]) skor += Math.abs(d) === 1 ? 2 : 1;
      });
      if (val === 1 || val === 9) skor -= 0.5;
    }
    if (skor < bestSkor) { bestSkor = skor; best = i; }
  });
  return best;
}

/* ================================ Hint ================================= */

function hitungTerlihat_(state, viewer) {
  const c = {};
  const tambah = t => c[t] = (c[t] || 0) + 1;
  state.players[viewer].hand.forEach(tambah);
  state.discards.forEach(d => tambah(d.tile));
  state.players.forEach(p => p.melds.forEach(m => m.tiles.forEach(tambah)));
  return c;
}

/* ---------- Shanten: berapa ubin lagi sampai tenpai (0 = tenpai, -1 = menang) ---------- */

function keHitungan_(hand) {
  const c = new Array(34).fill(0);
  hand.forEach(t => { const k = SEMUA_UBIN.indexOf(t); if (k !== -1) c[k]++; });
  return c;
}

function shantenNormal_(c, k) {
  let best = 8;
  const batas = 4 - k;
  const dfs = (i, m, t, head) => {
    while (i < 34 && c[i] === 0) i++;
    if (i === 34) {
      const s = 8 - 2 * (m + k) - Math.min(t, Math.max(0, batas - m)) - head;
      if (s < best) best = s;
      return;
    }
    const suit = i < 27, pos = i % 9;
    if (c[i] >= 3) { c[i] -= 3; dfs(i, m + 1, t, head); c[i] += 3; }
    if (suit && pos <= 6 && c[i + 1] && c[i + 2]) { c[i]--; c[i + 1]--; c[i + 2]--; dfs(i, m + 1, t, head); c[i]++; c[i + 1]++; c[i + 2]++; }
    if (c[i] >= 2) {
      c[i] -= 2;
      if (!head) dfs(i, m, t, 1);
      dfs(i, m, t + 1, head);
      c[i] += 2;
    }
    if (suit && pos <= 7 && c[i + 1]) { c[i]--; c[i + 1]--; dfs(i, m, t + 1, head); c[i]++; c[i + 1]++; }
    if (suit && pos <= 6 && c[i + 2]) { c[i]--; c[i + 2]--; dfs(i, m, t + 1, head); c[i]++; c[i + 2]++; }
    c[i]--; dfs(i, m, t, head); c[i]++;
  };
  dfs(0, 0, 0, 0);
  return best;
}

function shanten_(hand, jumlahMeld) {
  const c = keHitungan_(hand);
  let s = shantenNormal_(c, jumlahMeld);
  if (jumlahMeld === 0) { // tujuh pasang berbeda
    let pasang = 0, jenis = 0;
    c.forEach(n => { if (n) jenis++; if (n >= 2) pasang++; });
    s = Math.min(s, 6 - pasang + Math.max(0, 7 - jenis));
  }
  return s;
}

/** Ubin yang membuat shanten turun, beserta sisa yang belum terlihat. */
function ukeire_(hand, jumlahMeld, terlihat) {
  const s0 = shanten_(hand, jumlahMeld);
  const hasil = [];
  SEMUA_UBIN.forEach(t => {
    const sisa = Math.max(0, 4 - (terlihat[t] || 0));
    if (!sisa) return;
    if (shanten_(hand.concat([t]), jumlahMeld) < s0) hasil.push({ tile: t, sisa: sisa });
  });
  return { shanten: s0, ubin: hasil, total: hasil.reduce((a, x) => a + x.sisa, 0) };
}

/** Evaluasi tangan yang harus membuang 1 ubin: buangan terbaik (shanten terendah, ukeire terbanyak). */
function evaluasiBuang_(hand, jumlahMeld, terlihat) {
  const kandidat = Array.from(new Set(hand)).map(b => {
    const h = hand.slice(); h.splice(h.indexOf(b), 1);
    return { buang: b, sisaTangan: h, shanten: shanten_(h, jumlahMeld) };
  });
  const min = Math.min.apply(null, kandidat.map(x => x.shanten));
  const terbaik = kandidat.filter(x => x.shanten === min).map(x => {
    const u = ukeire_(x.sisaTangan, jumlahMeld, terlihat);
    return { buang: x.buang, shanten: x.shanten, ubin: u.ubin, total: u.total };
  });
  terbaik.sort((a, b) => b.total - a.total);
  return terbaik;
}

/**
 * Hint sesuai situasi (dipanggil saat pemain menekan tombol Hint):
 *  - 'klaim' : ada buangan lawan yang bisa diambil → sarankan Ron/Pong/Chow/Kong atau Lewati
 *  - 'buang' : giliran membuang → sarankan ubin yang dibuang
 *  - 'tangan': selain itu → kondisi tangan (berapa langkah lagi / ubin yang ditunggu)
 */
function mintaHint(kodeKamar, token) {
  const state = bacaState_(normalKode_(kodeKamar));
  if (!state) throw new Error('KAMAR_TIDAK_ADA');
  const viewer = idxDariToken_(state, token);
  if (!state.hintAktif) throw new Error('Hint dinonaktifkan host untuk meja ini.');
  if (state.status !== 'playing' || state.gameOver) return { jenis: 'kosong', version: state.version };

  const p = state.players[viewer];
  const k = p.melds.length;
  const terlihat = hitungTerlihat_(state, viewer);
  const c = state.claim;

  if (c && c.opsi[viewer] && !c.jawab[viewer]) {
    const o = c.opsi[viewer];
    const dasar = ukeire_(p.hand, k, terlihat);
    const pilihan = [{ aksi: 'pass', shanten: dasar.shanten, total: dasar.total }];
    if (o.ron) pilihan.push({ aksi: 'ron', shanten: -1, total: 99 });
    const coba = (aksi, pakai, pilih) => {
      const h = p.hand.slice();
      pakai.forEach(t => h.splice(h.indexOf(t), 1));
      if (aksi === 'kong') { // setelah Kong ambil ubin pengganti → nilai tangan 3n+1
        const u = ukeire_(h, k + 1, terlihat);
        pilihan.push({ aksi, pilih, shanten: u.shanten, total: u.total });
      } else {
        const e = evaluasiBuang_(h, k + 1, terlihat)[0];
        pilihan.push({ aksi, pilih, shanten: e.shanten, total: e.total, buang: e.buang });
      }
    };
    if (o.kong) coba('kong', [c.tile, c.tile, c.tile], 0);
    if (o.pong) coba('pong', [c.tile, c.tile], 0);
    (o.chow || []).forEach((combo, i) => coba('chow', combo, i));

    // Ambil hanya jika benar-benar mendekatkan ke menang; kalau sama saja lebih baik tetap tertutup
    let saran = pilihan[0];
    pilihan.forEach(x => {
      if (x.aksi === 'pass') return;
      if (x.shanten < saran.shanten || (x.shanten === saran.shanten && saran.aksi !== 'pass' && x.total > saran.total)) saran = x;
    });
    let alasan;
    if (saran.aksi === 'ron') alasan = 'Ubin ini melengkapi tangan Anda. Ambil dan menang sekarang.';
    else if (saran.aksi === 'pass') alasan = dasar.shanten === 0
      ? 'Tangan Anda sudah siap menang (tenpai). Mengambil ubin ini tidak membuatnya lebih dekat ke menang.'
      : `Mengambil ubin ini tidak mendekatkan Anda ke menang. Lebih baik lewati dan biarkan tangan tetap fleksibel.`;
    else {
      alasan = saran.shanten === 0
        ? `${saran.aksi.toUpperCase()} membuat tangan Anda siap menang (tenpai).`
        : `${saran.aksi.toUpperCase()} membuat tangan Anda tinggal ${saran.shanten} langkah lagi dari siap menang (sekarang ${dasar.shanten}).`;
      if (saran.buang) alasan += ` Setelah itu buang ${saran.buang}.`;
    }
    return { jenis: 'klaim', version: state.version, tile: c.tile, saran: { aksi: saran.aksi, pilih: saran.pilih || 0, buang: saran.buang || null }, alasan: alasan, shanten: dasar.shanten };
  }

  if (state.turn === viewer && state.hasDrawn && !c) {
    const daftar = evaluasiBuang_(p.hand, k, terlihat).slice(0, 3);
    return { jenis: 'buang', version: state.version, saran: daftar.map(x => ({ buang: x.buang, shanten: x.shanten, ubin: x.ubin, total: x.total })) };
  }

  const u = ukeire_(p.hand, k, terlihat);
  return { jenis: 'tangan', version: state.version, shanten: u.shanten, ubin: u.ubin, total: u.total, giliran: state.turn === viewer };
}

function kongSendiriUntuk_(state, viewer) {
  if (state.gameOver || state.claim || state.turn !== viewer || !state.hasDrawn || state.deck.length === 0) return [];
  const p = state.players[viewer];
  const counts = {};
  p.hand.forEach(t => counts[t] = (counts[t] || 0) + 1);
  const hasil = Object.keys(counts).filter(t => counts[t] === 4);
  p.melds.forEach(m => { if (m.type === 'pong' && counts[m.tiles[0]]) hasil.push(m.tiles[0]); });
  return hasil;
}

/* ================================ Helpers ================================ */

function kamarBaru_(kode, cfg, namaHost, token) {
  const seats = [0, 1, 2, 3].map(i => {
    if (i === 0) return { name: namaHost, token: token, bot: null };
    const v = cfg.bots && cfg.bots[i];
    if (LEVEL_BOT.indexOf(v) !== -1) return { name: null, token: null, bot: v };
    const pesan = cfg.namaKursi && cfg.namaKursi[i] ? normalNama_(cfg.namaKursi[i]) : null;
    return { name: null, token: null, bot: null, pesan: pesan };
  });
  const semuaNama = [namaHost].concat(seats.map(s => s.pesan).filter(Boolean)).map(n => n.toLowerCase());
  if (new Set(semuaNama).size !== semuaNama.length) throw new Error('Nama pemain tidak boleh sama (termasuk nama host).');
  const state = {
    roomCode: kode,
    status: 'lobby',
    host: 0,
    hintAktif: cfg.hint !== false,
    seats: seats,
    bots: {},
    skor: [0, 0, 0, 0],
    ronde: 0,
    dealer: 0,
    gameId: null,
    deck: [],
    players: [],
    turn: -1,
    hasDrawn: false,
    gameOver: false,
    result: null,
    winner: null,
    menang: null,
    claim: null,
    lastDrawn: null,
    discards: [],
    log: `Kamar dibuat oleh ${namaHost}. Menunggu pemain...`,
    version: 0,
    updatedAt: Date.now()
  };
  namaiBot_(state);
  return state;
}

/** BOT diberi nama berurutan sesuai kursi: BOT 1, BOT 2, BOT 3. */
function namaiBot_(state) {
  let n = 0;
  state.bots = {};
  state.seats.forEach((s, i) => {
    if (s.bot) { n++; if (!s.ditinggal) s.name = 'BOT ' + n; state.bots[i] = s.bot; }
  });
}

function mulaiRonde_(state) {
  const deck = [];
  SEMUA_UBIN.forEach(t => deck.push(t, t, t, t));
  acak_(deck);

  state.ronde = (state.ronde || 0) + 1;
  state.dealer = (state.ronde - 1) % 4;   // dealer bergiliran tiap ronde
  namaiBot_(state);
  state.players = state.seats.map((s, i) => ({
    id: i,
    name: s.name,
    hand: urutkan_(deck.splice(0, 13)),
    melds: []
  }));
  Object.assign(state, {
    status: 'playing',
    gameId: Utilities.getUuid(),
    deck: deck,
    turn: state.dealer,
    hasDrawn: false,
    gameOver: false,
    result: null,
    winner: null,
    menang: null,
    claim: null,
    lastDrawn: null,
    discards: [],
    log: `Ronde ${state.ronde} dimulai. Dealer: ${state.players[state.dealer].name}. Giliran ${state.players[state.dealer].name}!`
  });
}

function selesaiSeri_(state) {
  state.log = 'Ubin di tumpukan habis! Permainan Seri.';
  state.turn = -1;
  state.gameOver = true;
  state.result = 'draw';
  state.claim = null;
}

function selesaiMenang_(state, idx, sets, keterangan, ubinMenang) {
  const p = state.players[idx];
  // Data terstruktur untuk ditampilkan client sebagai ubin berwarna
  state.menang = {
    winner: idx,
    keterangan: keterangan,
    ubinMenang: ubinMenang || null,
    tujuhPasang: p.melds.length === 0 && sets.length === 7,
    melds: p.melds.map(m => ({ type: m.type, tiles: m.tiles.slice(), concealed: !!m.concealed })),
    sets: sets.map(set => set.map(code => REV_DICT[code]))
  };
  const ikon = state.bots[idx] ? '🤖🏆' : '🏆';
  const meldTeks = p.melds.map(m => '{' + m.tiles.join(' ') + '}').join(' ');
  state.log = `${ikon} ${p.name} MENANG — ${keterangan}!\n\nSusunan:\n` +
    (meldTeks ? meldTeks + ' ' : '') + formatKemenangan_(sets);
  state.turn = -1;
  state.gameOver = true;
  state.result = 'win';
  state.winner = idx;
  state.claim = null;
  if (state.skor) state.skor[idx]++;
}

function formatKemenangan_(sets) {
  return sets.map(set => '[' + set.map(code => REV_DICT[code]).join(' ') + ']').join(' ');
}

/** Hanya kirim data yang boleh dilihat pemain tersebut (token pemain lain tidak pernah dikirim). */
function untukPemain_(state, viewer) {
  const umum = {
    roomCode: state.roomCode,
    status: state.status,
    me: viewer,
    isHost: viewer === state.host,
    host: state.host,
    hintAktif: !!state.hintAktif,
    ronde: state.ronde || 0,
    dealer: state.dealer || 0,
    skor: state.skor || [0, 0, 0, 0],
    version: state.version,
    log: state.log,
    bots: state.bots || {},
    seats: state.seats.map(s => ({ name: s.name, bot: s.bot || null, terisi: !!(s.bot || s.token), ditinggal: !!s.ditinggal, pesan: s.pesan || null }))
  };
  if (state.status !== 'playing') return umum;

  const buka = state.gameOver;
  const c = state.claim;
  const giliranManusia = !state.gameOver && !c && state.turn >= 0 && !state.bots[state.turn];
  return Object.assign(umum, {
    gameId: state.gameId,
    turn: state.turn,
    hasDrawn: state.hasDrawn,
    gameOver: state.gameOver,
    result: state.result || null,
    winner: state.winner != null ? state.winner : null,
    menang: state.gameOver ? (state.menang || null) : null,
    deckCount: state.deck.length,
    discards: state.discards,
    sisaGiliranMs: giliranManusia ? Math.max(0, GILIRAN_MS - (Date.now() - (state.turnSince || 0))) : null,
    ubinBaru: state.lastDrawn && state.lastDrawn.p === viewer ? state.lastDrawn.tile : null,
    klaim: c ? {
      tile: c.tile,
      from: c.from,
      sisaMs: Math.max(0, c.deadline - Date.now()),
      opsi: c.opsi[viewer] || null,
      sudahJawab: !!c.jawab[viewer]
    } : null,
    kongSendiri: kongSendiriUntuk_(state, viewer),
    players: state.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      handCount: p.hand.length,
      hand: (buka || i === viewer) ? p.hand : [],
      melds: p.melds
    }))
  });
}

function idxDariToken_(state, token) {
  const idx = token ? state.seats.findIndex(s => !s.bot && s.token === token) : -1;
  if (idx === -1) throw new Error('BUKAN_PEMAIN');
  return idx;
}

function normalNama_(nama) {
  const n = String(nama || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAKS_NAMA);
  if (!n) throw new Error('Nama pemain wajib diisi.');
  if (/^bot\b/i.test(n)) throw new Error('Nama tidak boleh diawali "BOT" (dipakai untuk pemain komputer).');
  return n;
}

function namaUnik_(state, nama, kecuali) {
  const dipakai = state.seats.filter((s, i) => i !== kecuali && s.name).map(s => s.name.toLowerCase());
  let n = nama, k = 2;
  while (dipakai.indexOf(n.toLowerCase()) !== -1) n = nama.slice(0, MAKS_NAMA - 3) + ' ' + (k++);
  return n;
}

function denganKunci_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Server sedang sibuk, coba lagi.');
  try { return fn(); } finally { lock.releaseLock(); }
}

/** dariCache=true dipakai polling (hemat kuota Properties); operasi tulis selalu baca Properties. */
function bacaState_(kode, dariCache) {
  const key = PREFIX + kode;
  let raw = dariCache ? CacheService.getScriptCache().get(key) : null;
  if (!raw) raw = PropertiesService.getScriptProperties().getProperty(key);
  if (!raw) return null;
  const s = JSON.parse(raw);
  if (!s.seats) return null; // kamar format lama → dianggap tidak ada (buat ulang)
  if (s.host == null) s.host = 0;
  s.bots = s.bots || {};
  (s.players || []).forEach(p => p.melds = p.melds || []);
  return s;
}

function simpanState_(state) {
  const kunciGiliran = [state.gameId, state.turn, state.hasDrawn, state.claim ? 1 : 0].join('|');
  if (state.kunciGiliran !== kunciGiliran) { state.kunciGiliran = kunciGiliran; state.turnSince = Date.now(); }
  state.version = Math.max((state.version || 0) + 1, Date.now());
  state.updatedAt = Date.now();
  const raw = JSON.stringify(state);
  const key = PREFIX + state.roomCode;
  PropertiesService.getScriptProperties().setProperty(key, raw);
  CacheService.getScriptCache().put(key, raw, CACHE_TTL_DETIK);
}

function hapusKamar_(kode) {
  PropertiesService.getScriptProperties().deleteProperty(PREFIX + kode);
  CacheService.getScriptCache().remove(PREFIX + kode);
}

function bersihkanKamarLama_() {
  const props = PropertiesService.getScriptProperties();
  const cache = CacheService.getScriptCache();
  const semua = props.getProperties();
  const now = Date.now();
  Object.keys(semua).forEach(k => {
    if (k.indexOf(PREFIX) !== 0) return;
    let hapus = false;
    try { hapus = now - (JSON.parse(semua[k]).updatedAt || 0) > UMUR_KAMAR_MAKS_MS; }
    catch (e) { hapus = true; }
    if (hapus) { props.deleteProperty(k); cache.remove(k); }
  });
}

function normalKode_(kode) {
  const k = String(kode || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30);
  if (!k) throw new Error('Kode kamar tidak valid (gunakan huruf, angka, - atau _).');
  return k;
}

function validIdx_(i) {
  const n = Number(i);
  if (!Number.isInteger(n) || n < 0 || n > 3) throw new Error('Kursi pemain tidak valid.');
  return n;
}

function acak_(arr) { // Fisher–Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function urutkan_(hand) {
  return hand.slice().sort((a, b) => SEMUA_UBIN.indexOf(a) - SEMUA_UBIN.indexOf(b));
}

function samaIsi_(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const x = a.slice().sort(), y = b.slice().sort();
  return x.every((t, i) => t === y[i]);
}
