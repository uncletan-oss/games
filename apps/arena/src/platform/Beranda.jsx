import { useRef, useState } from 'react';
import { Seg } from './ui.jsx';
import { bacaSesi, namaTersimpan } from './useRuang.js';

const LEVEL = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];
const CFG_AWAL = { tipe: 'bot', level: 'medium', nama: '' };
export const WARNA_KURSI = ['#D9483B', '#2E9E5B', '#E2B33B', '#2F7BD6'];

export function kodeAcak(awalan) {
  const huruf = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let k = awalan + '-';
  for (let i = 0; i < 4; i++) k += huruf[Math.floor(Math.random() * huruf.length)];
  return k;
}

/** Layar awal sebuah game: buat meja baru atau gabung meja teman. */
export default function Beranda({ game, ruang, kodeUndangan }) {
  const { tampilModal, sibuk } = ruang;
  const sesi = bacaSesi(ruang.gameId);
  const [nama, setNama] = useState(() => (sesi && sesi.nama) || namaTersimpan());
  const [kode, setKode] = useState(() => kodeAcak(game.nama.slice(0, 2).toUpperCase()));
  const [jumlah, setJumlah] = useState(game.bawaan);
  const [kursi, setKursi] = useState(() => Array.from({ length: game.maks - 1 }, () => ({ ...CFG_AWAL })));
  const [joinKode, setJoinKode] = useState(kodeUndangan || '');
  const [wajib, setWajib] = useState({});
  const refNama = useRef(), refJoin = useRef(), refKursi = useRef({});
  const resume = sesi && sesi.room && sesi.token ? sesi : null;

  const tandai = k => setWajib(w => ({ ...w, [k]: true }));
  const lepas = k => setWajib(w => ({ ...w, [k]: false }));
  const ubah = (i, x) => setKursi(c => c.map((k, j) => (j === i ? { ...k, ...x } : k)));

  const bacaNama = () => {
    const n = nama.trim();
    if (!n) { tandai('nama'); refNama.current.focus(); tampilModal('Tulis nama Anda dulu', 'Nama dipakai supaya pemain lain tahu siapa Anda.'); return null; }
    if (/^bot\b/i.test(n)) { tampilModal('Nama tidak bisa dipakai', 'Nama yang diawali "BOT" khusus untuk pemain komputer.'); return null; }
    return n;
  };

  const buat = () => {
    const nm = bacaNama(); if (!nm) return;
    const k = kode.trim().toUpperCase();
    if (!k) { setKode(kodeAcak(game.nama.slice(0, 2).toUpperCase())); return; }
    const dipakai = [nm.toLowerCase()];
    const cfg = { nama: nm, kursi: [] };
    for (let i = 0; i < jumlah - 1; i++) {
      const c = kursi[i];
      if (c.tipe === 'bot') { cfg.kursi.push({ tipe: 'bot', level: c.level }); continue; }
      const n = c.nama.trim();
      const tandaiKursi = () => { tandai('k' + i); refKursi.current[i] && refKursi.current[i].focus(); };
      if (n && /^bot\b/i.test(n)) { tandaiKursi(); return tampilModal('Nama tidak bisa dipakai', 'Nama teman tidak boleh diawali "BOT".'); }
      if (n && dipakai.includes(n.toLowerCase())) { tandaiKursi(); return tampilModal('Nama kembar', `"${n}" dipakai lebih dari sekali.`); }
      if (n) dipakai.push(n.toLowerCase());
      cfg.kursi.push({ tipe: 'teman', nama: n });
    }
    ruang.buatKamar(k, cfg, nm, resume && resume.room === k ? resume.token : '');
  };

  const gabung = () => {
    const nm = bacaNama(); if (!nm) return;
    const k = joinKode.trim().toUpperCase();
    if (!k) { tandai('join'); refJoin.current.focus(); return; }
    ruang.gabungKamar(k, nm, resume && resume.room === k ? resume.token : '');
  };

  const pilihanJumlah = [];
  for (let n = game.min; n <= game.maks; n++) pilihanJumlah.push([n, n + ' pemain']);

  return (
    <div className="layar-gulir">
      <div className="beranda">
        <div className="nama-wrap">
          <label htmlFor="nama-pemain">Nama Anda</label>
          <input id="nama-pemain" ref={refNama} className={'in' + (wajib.nama ? ' wajib' : '')} maxLength={16}
                 autoComplete="nickname" placeholder="Tulis nama Anda" value={nama}
                 onChange={e => { setNama(e.target.value); lepas('nama'); }} />
        </div>

        {resume && (
          <div className="resume">
            <p>Anda masih tercatat di meja <b>{resume.room}</b>.</p>
            <button className="btn btn-kedua" disabled={sibuk} onClick={() => ruang.gabungKamar(resume.room, resume.nama || nama || 'Pemain', resume.token)}>Kembali ke meja</button>
          </div>
        )}

        <div className="beranda-grid">
          <section className="panel">
            <h2>Buat meja baru</h2>
            <div className="baris-kode">
              <label>Kode meja
                <input className="in kode" maxLength={30} spellCheck={false} value={kode} onChange={e => setKode(e.target.value)} />
              </label>
              <button type="button" className="btn btn-teks" disabled={sibuk} onClick={() => setKode(kodeAcak(game.nama.slice(0, 2).toUpperCase()))}>🎲 Acak</button>
            </div>
            {game.min !== game.maks && <Seg pilihan={pilihanJumlah} aktif={jumlah} onPilih={setJumlah} disabled={sibuk} kelas="seg-gelap" />}
            <div className="daftar-kursi">
              <div className="kursi anda" style={{ '--warna-pemain': WARNA_KURSI[0] }}>
                <div className="kursi-judul"><span className="titik-warna" />{nama.trim() || 'Anda'} <span className="lencana host">Host</span></div>
                <div className="ket">Anda membuka meja dan memulai permainan.</div>
              </div>
              {kursi.slice(0, jumlah - 1).map((c, i) => (
                <div key={i} className="kursi" style={{ '--warna-pemain': WARNA_KURSI[i + 1] }}>
                  <div className="kursi-judul"><span className="titik-warna" />Kursi {i + 2}</div>
                  <Seg pilihan={[['teman', '👤 Teman'], ['bot', '🤖 BOT']]} aktif={c.tipe} disabled={sibuk} onPilih={v => ubah(i, { tipe: v })} />
                  {c.tipe === 'bot'
                    ? <Seg pilihan={LEVEL} aktif={c.level} kelas="level" disabled={sibuk} onPilih={v => ubah(i, { level: v })} />
                    : <input type="text" className={'in kecil' + (wajib['k' + i] ? ' wajib' : '')} maxLength={16}
                             placeholder="Nama teman (opsional)" ref={x => { refKursi.current[i] = x; }}
                             value={c.nama} onChange={e => { ubah(i, { nama: e.target.value }); lepas('k' + i); }} />}
                </div>
              ))}
            </div>
            <button className="btn btn-utama penuh" disabled={sibuk} onClick={buat}>Buat meja</button>
          </section>

          <section className="panel">
            <h2>Gabung meja teman</h2>
            <p className="sub">Masukkan kode atau buka tautan undangan dari host.</p>
            <div className="baris-gabung">
              <input ref={refJoin} className={'in kode' + (wajib.join ? ' wajib' : '')} maxLength={30} placeholder="Kode meja" spellCheck={false}
                     value={joinKode} onChange={e => { setJoinKode(e.target.value); lepas('join'); }}
                     onKeyDown={e => { if (e.key === 'Enter') gabung(); }} />
              <button className="btn btn-kedua" disabled={sibuk} onClick={gabung}>Gabung</button>
            </div>
            <p className="catatan">Meja berjalan langsung di browser host (peer-to-peer), jadi host perlu tetap membuka halaman meja selama permainan.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
