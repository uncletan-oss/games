/**
 * Server meja (berjalan di browser HOST) — dipakai semua game.
 * Mengurus kamar, kursi, token pemain, BOT, ronde & skor, batas waktu giliran.
 * Aturan permainannya sendiri ada di mesin tiap game (games/<id>/mesin.js) dengan antarmuka:
 *   mulai(n, opsi, info) → state     aksi(state, kursi, aksi)     bot(state, kursi, level) → aksi
 *   giliran(state) → kursi | -1      hasil(state) → null | { pemenang: [kursi], teks }
 *   pandangan(state, kursi) → data yang boleh dilihat kursi itu      log(state) → teks
 * Teks log/hasil memakai "@<kursi>" sebagai pengganti nama pemain.
 */

export const LEVEL_BOT = ['easy', 'medium', 'hard'];
const KAMAR_AKTIF_MS = 30 * 60 * 1000;
const UMUR_KAMAR_MAKS_MS = 12 * 60 * 60 * 1000;
export const GILIRAN_MS = 45000;
const MAKS_NAMA = 16;

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function normalKode(kode) {
  const k = String(kode || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30);
  if (!k) throw new Error('Kode meja tidak valid (gunakan huruf, angka, - atau _).');
  return k;
}

export function normalNama(nama) {
  const n = String(nama || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAKS_NAMA);
  if (!n) throw new Error('Nama pemain wajib diisi.');
  if (/^bot\b/i.test(n)) throw new Error('Nama tidak boleh diawali "BOT" (dipakai untuk pemain komputer).');
  return n;
}

export function buatServer(game) {
  const AWALAN = 'arena_meja:' + game.id + ':';
  const memori = {};
  const simpanan = {
    get: k => { try { return localStorage.getItem(AWALAN + k); } catch (e) { return memori[k] || null; } },
    set: (k, v) => { memori[k] = v; try { localStorage.setItem(AWALAN + k, v); } catch (e) {} },
    del: k => { delete memori[k]; try { localStorage.removeItem(AWALAN + k); } catch (e) {} },
    semua: () => {
      const hasil = Object.assign({}, memori);
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.indexOf(AWALAN) === 0) hasil[k.slice(AWALAN.length)] = localStorage.getItem(k);
        }
      } catch (e) {}
      return hasil;
    }
  };

  const baca = kode => {
    const raw = simpanan.get(kode);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  };

  function simpan(s) {
    s.version = Math.max((s.version || 0) + 1, Date.now());
    s.updatedAt = Date.now();
    simpanan.set(s.roomCode, JSON.stringify(s));
  }

  function bersihkan() {
    const now = Date.now();
    Object.entries(simpanan.semua()).forEach(([k, raw]) => {
      let hapus = false;
      try { hapus = now - (JSON.parse(raw).updatedAt || 0) > UMUR_KAMAR_MAKS_MS; } catch (e) { hapus = true; }
      if (hapus) simpanan.del(k);
    });
  }

  const idxDariToken = (s, token) => {
    const i = token ? s.seats.findIndex(x => !x.bot && x.token === token) : -1;
    if (i === -1) throw new Error('BUKAN_PEMAIN');
    return i;
  };

  function namaiBot(s) {
    let n = 0;
    s.seats.forEach(x => { if (x.bot) { n++; if (!x.ditinggal) x.name = 'BOT ' + n; } });
  }

  function namaUnik(s, nama, kecuali) {
    const dipakai = s.seats.filter((x, i) => i !== kecuali && x.name).map(x => x.name.toLowerCase());
    let n = nama, k = 2;
    while (dipakai.includes(n.toLowerCase())) n = nama.slice(0, MAKS_NAMA - 3) + ' ' + (k++);
    return n;
  }

  /** Data untuk satu pemain (token pemain lain tidak pernah dikirim). */
  function untukPemain(s, me) {
    const umum = {
      roomCode: s.roomCode, game: game.id, status: s.status, me, host: s.host, isHost: me === s.host,
      ronde: s.ronde, skor: s.skor, version: s.version, log: s.log,
      seats: s.seats.map(x => ({ name: x.name, bot: x.bot || null, terisi: !!(x.bot || x.token), ditinggal: !!x.ditinggal, pesan: x.pesan || null }))
    };
    if (s.status !== 'playing') return umum;
    const giliran = game.giliran(s.main);
    const manusia = giliran >= 0 && !s.seats[giliran].bot;
    return Object.assign(umum, {
      idRonde: s.idRonde,
      main: game.pandangan(s.main, me),
      giliran,
      hasil: s.hasil,
      sisaGiliranMs: manusia && !s.hasil ? Math.max(0, GILIRAN_MS - (Date.now() - (s.giliranSejak || 0))) : null
    });
  }

  function mulaiRonde(s) {
    s.ronde = (s.ronde || 0) + 1;
    namaiBot(s);
    const info = { ronde: s.ronde, pemenangLalu: s.hasil && s.hasil.pemenang.length ? s.hasil.pemenang[0] : null };
    s.main = game.mulai(s.seats.length, s.opsi || {}, info);
    s.status = 'playing';
    s.idRonde = uuid();
    s.hasil = null;
    s.log = game.log(s.main);
    s.giliranSejak = Date.now();
  }

  /** Setelah setiap aksi: salin log dan catat pemenang. */
  function setelahAksi(s) {
    s.log = game.log(s.main);
    s.giliranSejak = Date.now();   // batas waktu dihitung per aksi
    const h = game.hasil(s.main);
    if (h && !s.hasil) {
      s.hasil = h;
      h.pemenang.forEach(i => { s.skor[i] = (s.skor[i] || 0) + 1; });
    }
  }

  const API = {
    buatKamar(kodeKamar, cfg, paksa, tokenLama) {
      const kode = normalKode(kodeKamar);
      cfg = cfg || {};
      const nama = normalNama(cfg.nama);
      const kursi = Array.isArray(cfg.kursi) ? cfg.kursi : [];
      const n = kursi.length + 1;
      if (n < game.min || n > game.maks) throw new Error(`Game ini untuk ${game.min}–${game.maks} pemain.`);
      const lama = baca(kode);
      if (lama && Date.now() - (lama.updatedAt || 0) < KAMAR_AKTIF_MS) {
        const sayaHost = tokenLama && lama.seats[lama.host] && lama.seats[lama.host].token === tokenLama;
        if (!sayaHost) throw new Error('KAMAR_DIPAKAI');
        if (!paksa) throw new Error('KAMAR_AKTIF');
      }
      bersihkan();
      const token = uuid();
      const seats = [{ name: nama, token, bot: null }].concat(kursi.map(k => {
        if (LEVEL_BOT.includes(k.level) && k.tipe === 'bot') return { name: null, token: null, bot: k.level };
        return { name: null, token: null, bot: null, pesan: k.nama ? normalNama(k.nama) : null };
      }));
      const semuaNama = [nama].concat(seats.map(x => x.pesan).filter(Boolean)).map(x => x.toLowerCase());
      if (new Set(semuaNama).size !== semuaNama.length) throw new Error('Nama pemain tidak boleh sama (termasuk nama host).');
      const s = {
        roomCode: kode, game: game.id, status: 'lobby', host: 0, seats, opsi: cfg.opsi || {},
        skor: seats.map(() => 0), ronde: 0, main: null, hasil: null,
        log: `Meja dibuat oleh ${nama}. Menunggu pemain...`, version: 0
      };
      namaiBot(s);
      simpan(s);
      return { token, view: untukPemain(s, 0) };
    },

    gabungKamar(kodeKamar, nama, token) {
      const kode = normalKode(kodeKamar);
      const s = baca(kode);
      if (!s) throw new Error('KAMAR_TIDAK_ADA');
      if (token) {
        const lama = s.seats.findIndex(x => !x.bot && x.token === token);
        if (lama !== -1) return { token, view: untukPemain(s, lama) };
      }
      const nm = normalNama(nama);
      if (s.status !== 'lobby') {
        const i = s.seats.findIndex(x => x.ditinggal);
        if (i === -1) throw new Error('KAMAR_SUDAH_MAIN');
        const tk = uuid();
        s.seats[i] = { name: namaUnik(s, nm, i), token: tk, bot: null };
        s.log = `👋 ${s.seats[i].name} bergabung dan mengambil alih kursi yang ditinggal.`;
        simpan(s);
        return { token: tk, view: untukPemain(s, i) };
      }
      let i = s.seats.findIndex(x => !x.bot && !x.token && x.pesan && x.pesan.toLowerCase() === nm.toLowerCase());
      if (i === -1) i = s.seats.findIndex(x => !x.bot && !x.token && !x.pesan);
      if (i === -1) {
        const kosong = s.seats.filter(x => !x.bot && !x.token);
        if (!kosong.length) throw new Error('KAMAR_PENUH');
        throw new Error('KURSI_DIPESAN:' + kosong.map(x => x.pesan).join(', '));
      }
      const tk = uuid();
      s.seats[i].token = tk;
      s.seats[i].name = s.seats[i].pesan || namaUnik(s, nm, i);
      s.log = `${s.seats[i].name} bergabung.`;
      simpan(s);
      return { token: tk, view: untukPemain(s, i) };
    },

    keluarKamar(kodeKamar, token) {
      const s = baca(normalKode(kodeKamar));
      if (!s) return null;
      const i = s.seats.findIndex(x => !x.bot && x.token && x.token === token);
      if (i === -1) return null;
      const nama = s.seats[i].name;
      if (s.status === 'lobby') s.seats[i] = { name: null, token: null, bot: null, pesan: s.seats[i].pesan || null };
      else s.seats[i] = { name: 'BOT (' + nama + ')', token: null, bot: 'medium', ditinggal: true };
      s.log = `🚪 ${nama} keluar` + (s.status === 'lobby' ? '.' : ' — kursinya dilanjutkan BOT.');
      simpan(s);
      return null;
    },

    aturKursi(kodeKamar, token, seat, level, namaPesan) {
      const s = baca(normalKode(kodeKamar));
      if (!s) throw new Error('KAMAR_TIDAK_ADA');
      if (idxDariToken(s, token) !== s.host) throw new Error('Hanya host yang bisa mengatur kursi.');
      if (s.status !== 'lobby') throw new Error('Kursi hanya bisa diatur sebelum permainan dimulai.');
      const i = Number(seat);
      if (!Number.isInteger(i) || i < 0 || i >= s.seats.length || i === s.host) throw new Error('Kursi tidak valid.');
      if (LEVEL_BOT.includes(level)) s.seats[i] = { name: null, token: null, bot: level };
      else if (s.seats[i].bot || namaPesan !== undefined) {
        const pesan = namaPesan ? normalNama(namaPesan) : null;
        if (pesan && s.seats.some((x, j) => j !== i && [x.name, x.pesan].some(n => n && n.toLowerCase() === pesan.toLowerCase()))) {
          throw new Error('Nama "' + pesan + '" sudah dipakai di meja ini.');
        }
        s.seats[i] = { name: null, token: null, bot: null, pesan };
      }
      namaiBot(s);
      simpan(s);
      return untukPemain(s, s.host);
    },

    mulaiPermainan(kodeKamar, token) {
      const s = baca(normalKode(kodeKamar));
      if (!s) throw new Error('KAMAR_TIDAK_ADA');
      const me = idxDariToken(s, token);
      if (me !== s.host) throw new Error('Hanya host yang bisa memulai permainan.');
      if (s.status !== 'lobby') return untukPemain(s, me);
      const kosong = s.seats.filter(x => !x.bot && !x.token).length;
      if (kosong) throw new Error(`Masih ada ${kosong} kursi kosong. Tunggu pemain bergabung atau jadikan BOT.`);
      mulaiRonde(s);
      simpan(s);
      return untukPemain(s, me);
    },

    mainLagi(kodeKamar, token) {
      const s = baca(normalKode(kodeKamar));
      if (!s) throw new Error('KAMAR_TIDAK_ADA');
      const me = idxDariToken(s, token);
      if (s.status === 'playing' && s.hasil) { mulaiRonde(s); simpan(s); }
      return untukPemain(s, me);
    },

    getStatus(kodeKamar, token) {
      const s = baca(normalKode(kodeKamar));
      if (!s) throw new Error('KAMAR_TIDAK_ADA');
      return untukPemain(s, idxDariToken(s, token));
    },

    aksi(kodeKamar, token, aksi) {
      const s = baca(normalKode(kodeKamar));
      if (!s) throw new Error('KAMAR_TIDAK_ADA');
      const me = idxDariToken(s, token);
      if (s.status !== 'playing' || s.hasil) return untukPemain(s, me);
      if (game.giliran(s.main) !== me) throw new Error('Belum giliran Anda.');
      game.aksi(s.main, me, aksi || {});
      setelahAksi(s);
      simpan(s);
      return untukPemain(s, me);
    },

    /** Menjalankan satu aksi untuk BOT (atau pemain yang waktunya habis). */
    jalankanBot(kodeKamar, token, versiDiharapkan) {
      const s = baca(normalKode(kodeKamar));
      if (!s) throw new Error('KAMAR_TIDAK_ADA');
      const me = idxDariToken(s, token);
      if (s.status !== 'playing' || s.hasil) return untukPemain(s, me);
      if (versiDiharapkan != null && s.version !== versiDiharapkan) return untukPemain(s, me);
      const g = game.giliran(s.main);
      if (g < 0) return untukPemain(s, me);
      const seat = s.seats[g];
      const afk = !seat.bot && Date.now() - (s.giliranSejak || 0) >= GILIRAN_MS;
      if (!seat.bot && !afk) return untukPemain(s, me);
      const a = game.bot(JSON.parse(JSON.stringify(s.main)), g, seat.bot || 'medium');
      game.aksi(s.main, g, a);
      setelahAksi(s);
      if (afk) s.log = '⏱️ Waktu @' + g + ' habis — dimainkan otomatis. ' + s.log;
      simpan(s);
      return untukPemain(s, me);
    },

    hapusKamar: kode => simpanan.del(normalKode(kode)),
    adalahHostLokal(kodeKamar, token) {
      const s = baca(normalKode(kodeKamar));
      return !!(s && token && s.seats[s.host] && s.seats[s.host].token === token);
    }
  };
  return API;
}
