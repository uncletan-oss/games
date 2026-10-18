import { useState } from 'react';
import Domino from '../../ui/Domino.jsx';
import MejaKartu from '../../ui/MejaKartu.jsx';
import { JumlahKartu } from '../../ui/Kartu.jsx';
import { fmt } from '../../platform/ui.jsx';

const sama = (a, b) => a && b && ((a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]));

function sisiSah(main, d) {
  if (!main.ujung) return ['kiri'];
  const h = [];
  if (d[0] === main.ujung[0] || d[1] === main.ujung[0]) h.push('kiri');
  if (d[0] === main.ujung[1] || d[1] === main.ujung[1]) h.push('kanan');
  return h;
}

export default function PapanGaple({ s, main, ruang }) {
  const [pilih, setPilih] = useState(null);
  const tangan = main.tangan[s.me] || [];
  const giliranku = s.giliran === s.me && !s.hasil;
  const bolehAksi = giliranku && ruang.pending === 0;
  const bisa = d => (!main.wajib || sama(d, main.wajib)) && sisiSah(main, d).length > 0;
  const adaCocok = tangan.some(bisa);
  const terpilih = pilih && tangan.some(d => sama(d, pilih)) && bisa(pilih) ? pilih : null;

  const pasang = (d, sisi) => { ruang.aksi({ t: 'main', kartu: d, sisi }); setPilih(null); };
  const klik = d => {
    if (!bolehAksi || !bisa(d)) return;
    const sisi = sisiSah(main, d);
    if (sisi.length === 1 || (main.ujung && main.ujung[0] === main.ujung[1])) pasang(d, sisi[0]);
    else setPilih(d);
  };

  const tengah = (
    <div className="rantai-wadah">
      {main.ujung && <div className="info-putaran">Ujung: <b>{main.ujung[0]}</b> dan <b>{main.ujung[1]}</b></div>}
      <div className="rantai">
        {main.rantai.length === 0 && <span className="petunjuk">Rantai masih kosong.</span>}
        {main.rantai.map((r, i) => <Domino key={i} d={r.d} mendatar kecil />)}
      </div>
    </div>
  );

  let aksi;
  if (!giliranku) aksi = <span className="petunjuk">Menunggu giliran {fmt(s, '@' + s.giliran)}...</span>;
  else if (!adaCocok) aksi = <button className="btn btn-utama" disabled={!bolehAksi} onClick={() => ruang.aksi({ t: 'lewat' })}>Lewat (ketuk)</button>;
  else if (terpilih) aksi = <>
    <button className="btn btn-utama" disabled={!bolehAksi} onClick={() => pasang(terpilih, 'kiri')}>⬅ Pasang di ujung {main.ujung[0]}</button>
    <button className="btn btn-utama" disabled={!bolehAksi} onClick={() => pasang(terpilih, 'kanan')}>Pasang di ujung {main.ujung[1]} ➡</button>
  </>;
  else aksi = <span className="petunjuk penting">{main.wajib ? `Buka dengan balak ${main.wajib[0]}.` : 'Ketuk kartu yang menyala untuk memasang.'}</span>;

  return (
    <MejaKartu s={s} ruang={ruang}
      isiLawan={k => <JumlahKartu n={main.jumlahKartu[k]} />}
      tengah={tengah}
      aksi={aksi}
      tangan={
        <div className="tangan-domino">
          {tangan.map((d, i) => <Domino key={i} d={d} dipilih={sama(terpilih, d)} redup={giliranku && !bisa(d)} onClick={() => klik(d)} />)}
        </div>
      } />
  );
}

PapanGaple.Hasil = function HasilGaple({ s, hasil }) {
  if (!hasil.mata) return null;
  return (
    <div className="rincian">
      {s.main.tangan.map((t, i) => (
        <div key={i} className="rincian-baris">
          <span className="nm">{s.seats[i].name}</span>
          <span className="kartu-mini-baris">{t.map((d, j) => <Domino key={j} d={d} kecil mendatar />)}</span>
          <b>{hasil.mata[i]} mata</b>
        </div>
      ))}
    </div>
  );
};
