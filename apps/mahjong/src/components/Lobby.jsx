import { useState } from 'react';
import { ANGIN, LEVEL, kapital } from '../konstanta.js';
import { Plakat, Seg } from './Plakat.jsx';

/** Input nama pesanan kursi: dikirim ke server saat selesai mengetik (blur / Enter). */
function InputPesan({ kursi, awal, disabled, onSimpan }) {
  const [v, setV] = useState(awal);
  const kirim = () => { if (v.trim() !== awal) onSimpan(v.trim()); };
  return (
    <input type="text" maxLength={16} placeholder="Pesan untuk nama (opsional)" disabled={disabled}
           aria-label={'Nama pemain untuk kursi ' + ANGIN[kursi]} value={v}
           onChange={e => setV(e.target.value)} onBlur={kirim}
           onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
  );
}

/** Layar 2: ruang tunggu. */
export default function Lobby({ s, meja }) {
  const [labelKode, setLabelKode] = useState('Salin kode');
  const [labelTautan, setLabelTautan] = useState('Salin tautan undangan');
  const { pending, tampilModal, aturKursi } = meja;
  const terkunci = pending > 0;

  // Salin ke clipboard; tombol menampilkan hasilnya sebentar
  const salin = (teks, label, setLabel) => {
    const tandai = t => { setLabel(t); setTimeout(() => setLabel(label), 1600); };
    try {
      navigator.clipboard.writeText(teks).then(() => tandai('Disalin'), () => tandai('Salin manual: ' + teks));
    } catch (e) { tandai('Salin manual: ' + teks); }
  };
  const tautan = location.origin + location.pathname + '?meja=' + encodeURIComponent(s.roomCode);

  const tunggu = s.seats.filter(x => !x.terisi);

  return (
    <div className="screen">
      <div className="lobby">
        <header className="home-head">
          <h1 className="brand">Ruang tunggu<small>{s.isHost ? 'Bagikan kode atau tautan meja ke teman Anda. Biarkan halaman ini tetap terbuka: meja berjalan di perangkat Anda.' : 'Menunggu host memulai permainan.'}</small></h1>
        </header>
        <div className="meja">
          <div className="felt">
            <span className="lbl">Kode meja</span>
            <span className="kode-besar">{s.roomCode}</span>
            <button className="mini" type="button" onClick={() => salin(s.roomCode, 'Salin kode', setLabelKode)}>{labelKode}</button>
            <button className="mini" type="button" onClick={() => salin(tautan, 'Salin tautan undangan', setLabelTautan)}>{labelTautan}</button>
          </div>
          {s.seats.map((seat, i) => {
            const rel = (i - s.me + 4) % 4;
            const tags = [];
            if (i === s.host) tags.push(['Host', 'host']);
            if (i === s.me) tags.push(['Anda', 'anda']);
            if (seat.bot) tags.push([kapital(seat.bot), 'bot']);
            const nama = seat.terisi ? seat.name : (seat.pesan ? 'Menunggu ' + seat.pesan : 'Kursi kosong');

            let isi = null;
            if (s.isHost && i !== s.host) {
              const jadiBot = level => {
                if (!seat.bot && seat.terisi) {
                  tampilModal('Ganti dengan BOT?', `${seat.name} akan dikeluarkan dari kursi ini.`, { label: 'Ganti', onClick: () => aturKursi(i, level) });
                } else aturKursi(i, level);
              };
              isi = <>
                <Seg pilihan={[['teman', '👤 Teman'], ['bot', '🤖 BOT']]} aktif={seat.bot ? 'bot' : 'teman'} disabled={terkunci}
                     onPilih={v => v === 'bot' ? jadiBot('medium') : aturKursi(i, '')} />
                {seat.bot && <Seg pilihan={LEVEL} aktif={seat.bot} kelas="level" disabled={terkunci} onPilih={v => aturKursi(i, v)} />}
                {!seat.bot && !seat.terisi && <>
                  <InputPesan key={seat.pesan || ''} kursi={i} awal={seat.pesan || ''} disabled={terkunci}
                              onSimpan={v => aturKursi(i, '', v)} />
                  <div className="ket">{seat.pesan ? 'Hanya ' + seat.pesan + ' yang bisa duduk di sini.' : 'Siapa saja yang punya kode bisa duduk di sini.'}</div>
                </>}
              </>;
            } else if (!seat.terisi) {
              isi = <div className="ket">{seat.pesan ? 'Dipesan untuk ' + seat.pesan + '.' : 'Belum ada yang duduk.'}</div>;
            }
            return <Plakat key={i} kursi={i} rel={rel} nama={nama} tags={tags} anda={i === s.me} kosong={!seat.terisi}>{isi}</Plakat>;
          })}
        </div>
        <p className="lobby-status">
          {tunggu.length
            ? 'Menunggu ' + tunggu.map(x => x.pesan || 'satu pemain lagi').join(', ') + '.' + (s.isHost ? ' Kursi kosong juga bisa diisi BOT.' : '')
            : (s.isHost ? 'Semua kursi sudah terisi.' : 'Semua kursi sudah terisi. Menunggu host memulai.')}
        </p>
        <div className="lobby-aksi">
          <label className="switch2" style={{ flex: '0 0 auto' }}>
            <input type="checkbox" checked={!!s.hintAktif} disabled={!s.isHost || terkunci}
                   onChange={e => meja.ubahHint(e.target.checked)} />
            <span className="track" /><span>Tampilkan hint</span>
          </label>
          <button className="btn btn-teks" onClick={meja.keluarLobby}>Keluar</button>
          {s.isHost && <button className="btn btn-utama" disabled={tunggu.length > 0 || terkunci} onClick={meja.mulaiPermainan}>Mulai permainan</button>}
        </div>
      </div>
    </div>
  );
}
