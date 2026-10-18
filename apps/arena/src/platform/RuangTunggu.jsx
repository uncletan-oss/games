import { useState } from 'react';
import { Seg, kapital } from './ui.jsx';
import { WARNA_KURSI } from './Beranda.jsx';

const LEVEL = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];

function InputPesan({ awal, disabled, onSimpan }) {
  const [v, setV] = useState(awal);
  const kirim = () => { if (v.trim() !== awal) onSimpan(v.trim()); };
  return <input type="text" className="in kecil" maxLength={16} placeholder="Pesan untuk nama (opsional)" disabled={disabled}
                value={v} onChange={e => setV(e.target.value)} onBlur={kirim} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}

export default function RuangTunggu({ game, s, ruang, tautan }) {
  const [label, setLabel] = useState({ kode: 'Salin kode', link: 'Salin tautan undangan' });
  const terkunci = ruang.pending > 0;
  const salin = (teks, k, awal) => {
    const tandai = t => { setLabel(l => ({ ...l, [k]: t })); setTimeout(() => setLabel(l => ({ ...l, [k]: awal })), 1600); };
    try { navigator.clipboard.writeText(teks).then(() => tandai('Disalin ✓'), () => tandai(teks)); } catch (e) { tandai(teks); }
  };
  const tunggu = s.seats.filter(x => !x.terisi);

  return (
    <div className="layar-gulir">
      <div className="beranda">
        <section className="panel kode-panel">
          <span className="sub">Kode meja</span>
          <span className="kode-besar">{s.roomCode}</span>
          <div className="baris-tombol">
            <button className="btn btn-teks" onClick={() => salin(s.roomCode, 'kode', 'Salin kode')}>{label.kode}</button>
            <button className="btn btn-teks" onClick={() => salin(tautan, 'link', 'Salin tautan undangan')}>{label.link}</button>
          </div>
          <p className="catatan">{s.isHost ? 'Bagikan kode atau tautan ke teman. Biarkan halaman ini terbuka: meja berjalan di perangkat Anda.' : 'Menunggu host memulai permainan.'}</p>
        </section>

        <section className="panel">
          <h2>Kursi ({s.seats.length} pemain)</h2>
          <div className="daftar-kursi">
            {s.seats.map((seat, i) => {
              const nama = seat.terisi ? seat.name : (seat.pesan ? 'Menunggu ' + seat.pesan : 'Kursi kosong');
              return (
                <div key={i} className={'kursi' + (i === s.me ? ' anda' : '') + (!seat.terisi ? ' kosong' : '')} style={{ '--warna-pemain': WARNA_KURSI[i] }}>
                  <div className="kursi-judul">
                    <span className="titik-warna" />{nama}
                    {i === s.host && <span className="lencana host">Host</span>}
                    {i === s.me && <span className="lencana anda">Anda</span>}
                    {seat.bot && <span className="lencana bot">{kapital(seat.bot)}</span>}
                  </div>
                  {s.isHost && i !== s.host ? <>
                    <Seg pilihan={[['teman', '👤 Teman'], ['bot', '🤖 BOT']]} aktif={seat.bot ? 'bot' : 'teman'} disabled={terkunci}
                         onPilih={v => {
                           if (v === 'bot' && seat.terisi) ruang.tampilModal('Ganti dengan BOT?', `${seat.name} akan dikeluarkan dari kursi ini.`, { label: 'Ganti', onClick: () => ruang.aturKursi(i, 'medium') });
                           else ruang.aturKursi(i, v === 'bot' ? 'medium' : '');
                         }} />
                    {seat.bot && <Seg pilihan={LEVEL} aktif={seat.bot} kelas="level" disabled={terkunci} onPilih={v => ruang.aturKursi(i, v)} />}
                    {!seat.bot && !seat.terisi && <InputPesan key={seat.pesan || ''} awal={seat.pesan || ''} disabled={terkunci} onSimpan={v => ruang.aturKursi(i, '', v)} />}
                  </> : (!seat.terisi && <div className="ket">{seat.pesan ? 'Dipesan untuk ' + seat.pesan + '.' : 'Belum ada yang duduk.'}</div>)}
                </div>
              );
            })}
          </div>
          <p className="catatan">{tunggu.length ? 'Menunggu ' + tunggu.map(x => x.pesan || 'satu pemain lagi').join(', ') + '.' : 'Semua kursi terisi.'}</p>
          <div className="baris-tombol">
            <button className="btn btn-teks" onClick={ruang.keluar}>Keluar</button>
            {s.isHost && <button className="btn btn-utama" disabled={tunggu.length > 0 || terkunci} onClick={ruang.mulaiPermainan}>Mulai permainan</button>}
          </div>
        </section>
      </div>
    </div>
  );
}
