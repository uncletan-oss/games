import { useMemo, useState } from 'react';
import Kartu, { Tangan, JumlahKartu, labelKartu } from '../../ui/Kartu.jsx';
import MejaKartu from '../../ui/MejaKartu.jsx';
import { susunTerbaik } from './mesin.js';
import { fmt } from '../../platform/ui.jsx';

const URUT_JENIS = 'SHCD';
const urutkan = t => t.slice().sort((a, b) => URUT_JENIS.indexOf(a[1]) - URUT_JENIS.indexOf(b[1]) || 'A23456789TJQK'.indexOf(a[0]) - 'A23456789TJQK'.indexOf(b[0]));

export default function PapanRemi({ s, main, ruang }) {
  const [pilih, setPilih] = useState(null);
  const tangan = useMemo(() => urutkan(main.tangan[s.me] || []), [main.tangan, s.me]);
  const giliranku = s.giliran === s.me && !s.hasil;
  const bolehAksi = giliranku && ruang.pending === 0;
  const susun = useMemo(() => susunTerbaik(tangan), [tangan]);
  const masuk = new Set(susun.kombinasi.flat());
  const terpilih = pilih && tangan.includes(pilih) && main.fase === 'buang' ? pilih : null;
  const bisaTutup = terpilih && susunTerbaik(tangan.filter((k, i) => i !== tangan.indexOf(terpilih))).sisa.length === 0;

  const klik = k => {
    if (!bolehAksi || main.fase !== 'buang') return;
    if (terpilih === k) { ruang.aksi({ t: 'buang', kartu: k }); setPilih(null); }
    else setPilih(k);
  };
  const ambil = dari => bolehAksi && main.fase === 'ambil' && ruang.aksi({ t: 'ambil', dari });

  const tengah = (
    <div className="tumpukan-tengah">
      <button type="button" className="tumpukan" disabled={!bolehAksi || main.fase !== 'ambil'} onClick={() => ambil('dek')}>
        <Kartu tertutup /><span>Tumpukan · {main.sisaDek}</span>
      </button>
      <button type="button" className="tumpukan" disabled={!bolehAksi || main.fase !== 'ambil' || !main.buanganAtas} onClick={() => ambil('buangan')}>
        {main.buanganAtas ? <Kartu k={main.buanganAtas} /> : <div className="kartu kosong" />}<span>Buangan</span>
      </button>
    </div>
  );

  let aksi;
  if (!giliranku) aksi = <span className="petunjuk">Menunggu giliran {fmt(s, '@' + s.giliran)}...</span>;
  else if (main.fase === 'ambil') aksi = <span className="petunjuk penting">Giliran Anda: ambil dari tumpukan atau buangan.</span>;
  else aksi = <>
    {!terpilih && <span className="petunjuk penting">Pilih kartu yang akan dibuang.</span>}
    {terpilih && <button className="btn btn-merah" disabled={!bolehAksi} onClick={() => { ruang.aksi({ t: 'buang', kartu: terpilih }); setPilih(null); }}>Buang {labelKartu(terpilih)}</button>}
    {bisaTutup && <button className="btn btn-utama berkilau" disabled={!bolehAksi} onClick={() => { ruang.aksi({ t: 'tutup', kartu: terpilih }); setPilih(null); }}>🏆 TUTUP</button>}
  </>;

  return (
    <MejaKartu s={s} ruang={ruang}
      isiLawan={k => <JumlahKartu n={main.jumlahKartu[k]} />}
      tengah={tengah}
      aksi={aksi}
      infoSaya={<span className="info-kecil">Poin sisa: {susun.poin} · titik hijau = masuk susunan</span>}
      tangan={
        <Tangan jumlah={tangan.length}>
          {tangan.map((k, i) => (
            <Kartu key={k + i} k={k} dipilih={terpilih === k} onClick={() => klik(k)} tanda={masuk.has(k)} baru={k === main.diambil}
                   judul={labelKartu(k) + (masuk.has(k) ? ', masuk susunan' : '')} />
          ))}
        </Tangan>
      } />
  );
}

/** Rincian di panel hasil: kartu tiap pemain dan poin sisanya. */
PapanRemi.Hasil = function HasilRemi({ s, hasil }) {
  if (!hasil.rincian) return null;
  return (
    <div className="rincian">
      {hasil.rincian.map(r => (
        <div key={r.kursi} className="rincian-baris">
          <span className="nm">{s.seats[r.kursi].name}</span>
          <span className="kartu-mini-baris">{urutkan(r.kartu).map((k, i) => <Kartu key={i} k={k} kecil />)}</span>
          <b>{hasil.pemenang.includes(r.kursi) ? 'Menang' : r.poin + ' poin'}</b>
        </div>
      ))}
    </div>
  );
};
