import { useEffect, useRef, useState } from 'react';
import { bacaSesi } from '../sesi.js';
import { ANGIN, LEVEL, kodeAcak } from '../konstanta.js';
import { Plakat, Seg } from './Plakat.jsx';

const CFG_AWAL = { tipe: 'bot', level: 'medium', nama: '' };

/** Layar 1: nama, buat meja, gabung. */
export default function Home({ aktif, meja }) {
  const { tampilModal, sibuk } = meja;
  const [nama, setNama] = useState(() => (bacaSesi() || {}).nama || '');
  const [kode, setKode] = useState(kodeAcak);
  const [hintOn, setHintOn] = useState(true);
  // Tautan undangan: .../mahjong/?meja=KODE langsung mengisi kode meja
  const [joinKode, setJoinKode] = useState(() => new URLSearchParams(location.search).get('meja') || '');
  const [seatCfg, setSeatCfg] = useState({ 1: CFG_AWAL, 2: CFG_AWAL, 3: CFG_AWAL });
  const [wajib, setWajib] = useState({});           // field yang ditandai merah
  const [resume, setResume] = useState(() => { const s = bacaSesi(); return s && s.room && s.token ? s : null; });
  const refNama = useRef(), refJoin = useRef(), refKursi = useRef({});

  // Kembali ke layar awal (setelah keluar meja): kode baru & sesi lama sudah dihapus
  const pernahAktif = useRef(aktif);
  useEffect(() => {
    if (aktif && !pernahAktif.current) {
      setKode(kodeAcak());
      const s = bacaSesi();
      setResume(s && s.room && s.token ? s : null);
    }
    pernahAktif.current = aktif;
  }, [aktif]);


  const tandai = k => setWajib(w => ({ ...w, [k]: true }));
  const lepas = k => setWajib(w => ({ ...w, [k]: false }));
  const ubahCfg = (i, ubah) => setSeatCfg(c => ({ ...c, [i]: { ...c[i], ...ubah } }));

  const bacaNama = () => {
    const n = nama.trim();
    if (!n) {
      tandai('nama'); refNama.current.focus();
      tampilModal('Tulis nama Anda dulu', 'Nama dipakai supaya pemain lain tahu siapa Anda di meja.');
      return null;
    }
    if (/^bot\b/i.test(n)) { tampilModal('Nama tidak bisa dipakai', 'Nama yang diawali "BOT" khusus untuk pemain komputer.'); return null; }
    return n;
  };

  const buatKamarBaru = () => {
    const nm = bacaNama(); if (!nm) return;
    const k = kode.trim().toUpperCase();
    if (!k) { setKode(kodeAcak()); return tampilModal('Kode meja kosong', 'Kode baru sudah dibuatkan. Tekan "Buat meja" lagi.'); }
    const cfg = { nama: nm, hint: hintOn, bots: {}, namaKursi: {} };
    const dipakai = [nm.toLowerCase()];
    for (const i of [1, 2, 3]) {
      const c = seatCfg[i];
      if (c.tipe === 'bot') { cfg.bots[i] = c.level; continue; }
      cfg.bots[i] = '';
      const n = c.nama.trim();
      const tandaiKursi = () => { tandai('kursi' + i); refKursi.current[i] && refKursi.current[i].focus(); };
      if (!n) { tandaiKursi(); return tampilModal('Nama teman belum diisi', `Tulis nama teman untuk kursi ${ANGIN[i]}, atau ganti kursinya menjadi BOT.`); }
      if (/^bot\b/i.test(n)) { tandaiKursi(); return tampilModal('Nama tidak bisa dipakai', `Nama di kursi ${ANGIN[i]} tidak boleh diawali "BOT".`); }
      if (dipakai.includes(n.toLowerCase())) { tandaiKursi(); return tampilModal('Nama kembar', `"${n}" dipakai lebih dari sekali. Setiap pemain perlu nama yang berbeda.`); }
      dipakai.push(n.toLowerCase());
      cfg.namaKursi[i] = n;
    }
    const sesi = bacaSesi() || {};
    meja.buatKamar(k, cfg, nm, sesi.room === k ? sesi.token : '');
  };

  const gabung = () => {
    const nm = bacaNama(); if (!nm) return;
    const k = joinKode.trim().toUpperCase();
    if (!k) { tandai('join'); refJoin.current.focus(); return; }
    lepas('join');
    const sesi = bacaSesi();
    meja.gabungKamar(k, nm, sesi && sesi.room === k ? sesi.token : '');
  };

  const lanjutkan = () => {
    const s = bacaSesi(); if (!s || !s.token) return;
    meja.gabungKamar(s.room, s.nama || 'Pemain', s.token);
  };

  // Pratinjau nama BOT: BOT 1, BOT 2, ... sesuai urutan kursi
  const namaBot = {};
  let nBot = 0;
  [1, 2, 3].forEach(i => { if (seatCfg[i].tipe === 'bot') namaBot[i] = 'BOT ' + (++nBot); });

  return (
    <div className="screen" style={{ display: aktif ? 'block' : 'none' }}>
      <div className="home">
        <header className="home-head">
          <h1 className="brand">Meja Mahjong<small><a className="ke-arena" href="../">← Semua game</a> · Main ber-4 bersama teman atau BOT.</small></h1>
          <div className="nama-wrap">
            <label htmlFor="nama-pemain">Nama Anda</label>
            <input className={'in' + (wajib.nama ? ' wajib' : '')} type="text" id="nama-pemain" ref={refNama}
                   placeholder="Tulis nama Anda" maxLength={16} autoComplete="nickname"
                   value={nama} onChange={e => { setNama(e.target.value); lepas('nama'); }} />
          </div>
        </header>


        {resume && (
          <div className="resume">
            <p>Anda masih tercatat di meja <b>{resume.room}</b> sebagai {resume.nama || 'Anda'}.</p>
            <button className="btn btn-kedua" disabled={sibuk} onClick={lanjutkan}>Kembali ke meja</button>
          </div>
        )}

        <div className="home-main">
          <section className="zona">
            <h2>Buat meja baru</h2>
            <p className="sub">Atur siapa yang duduk di tiap kursi. Kursi teman dipesan atas nama yang Anda tulis.</p>
            <div className="meja">
              <div className="felt">
                <span className="lbl">Kode meja</span>
                <input className="kode" type="text" maxLength={30} aria-label="Kode meja" spellCheck={false}
                       value={kode} onChange={e => setKode(e.target.value)} />
                <button className="mini" type="button" disabled={sibuk} onClick={() => setKode(kodeAcak())}>🎲 Acak kode</button>
              </div>
              <Plakat kursi={0} rel={0} nama={nama.trim() || 'Anda'} anda tags={[['Host', 'host']]}>
                <div className="ket">Anda membuka meja dan memulai permainan.</div>
              </Plakat>
              {[1, 2, 3].map(i => {
                const c = seatCfg[i];
                return (
                  <Plakat key={i} kursi={i} rel={i} nama={c.tipe === 'bot' ? namaBot[i] : (c.nama.trim() || 'Teman')}>
                    <Seg pilihan={[['teman', '👤 Teman'], ['bot', '🤖 BOT']]} aktif={c.tipe} disabled={sibuk}
                         onPilih={v => ubahCfg(i, { tipe: v })} />
                    {c.tipe === 'teman'
                      ? <input type="text" maxLength={16} placeholder="Nama teman" autoFocus
                               ref={x => { refKursi.current[i] = x; }}
                               className={wajib['kursi' + i] ? 'wajib' : ''}
                               aria-label={'Nama teman di kursi ' + ANGIN[i]}
                               value={c.nama} onChange={e => { ubahCfg(i, { nama: e.target.value }); lepas('kursi' + i); }} />
                      : <Seg pilihan={LEVEL} aktif={c.level} kelas="level" disabled={sibuk} onPilih={v => ubahCfg(i, { level: v })} />}
                  </Plakat>
                );
              })}
            </div>
            <div className="meja-foot">
              <label className="switch2">
                <input type="checkbox" checked={hintOn} onChange={e => setHintOn(e.target.checked)} />
                <span className="track" />
                <span>Tampilkan hint<small>Tiap pemain melihat saran untuk tangannya sendiri.</small></span>
              </label>
              <button className="btn btn-utama" disabled={sibuk} onClick={buatKamarBaru}>Buat meja</button>
            </div>
          </section>

          <section className="zona">
            <div className="panel-gabung">
              <h2>Gabung meja teman</h2>
              <p className="sub">Masukkan kode yang dibagikan teman Anda.</p>
              <div className="gabung-row">
                <input className={'in' + (wajib.join ? ' wajib' : '')} type="text" maxLength={30} placeholder="Kode meja"
                       spellCheck={false} ref={refJoin} value={joinKode}
                       onChange={e => setJoinKode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') gabung(); }} />
                <button className="btn btn-kedua" disabled={sibuk} onClick={() => gabung()}>Gabung</button>
              </div>
              <div className="daftar-judul">Cara main bersama</div>
              <div className="kosong-state">
                <span className="ubin">🀄</span>
                Host membuat meja lalu membagikan kode atau tautannya. Meja berjalan langsung di browser host,
                jadi host perlu tetap membuka halaman meja selama permainan.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

