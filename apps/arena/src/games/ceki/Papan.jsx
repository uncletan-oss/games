import { useMemo, useState } from 'react';
import KartuCeki, { labelCeki } from '../../ui/KartuCeki.jsx';
import { Tangan, JumlahKartu } from '../../ui/Kartu.jsx';
import MejaKartu from '../../ui/MejaKartu.jsx';
import { susunCeki, urutkanCeki } from './mesin.js';
import { fmt } from '../../platform/ui.jsx';

export default function PapanCeki({ s, main, ruang }) {
  const [pilih, setPilih] = useState(null);
  const tangan = useMemo(() => urutkanCeki(main.tangan[s.me] || []), [main.tangan, s.me]);
  const giliranku = s.giliran === s.me && !s.hasil;
  const bolehAksi = giliranku && ruang.pending === 0;
  const susun = useMemo(() => susunCeki(tangan), [tangan]);
  const terpilih = main.fase === 'buang' && pilih != null && tangan[pilih] ? pilih : null;
  const idxBaru = main.diambil ? tangan.lastIndexOf(main.diambil) : -1;

  const buang = i => { ruang.aksi({ t: 'buang', kartu: tangan[i] }); setPilih(null); };
  const klik = i => {
    if (!bolehAksi || main.fase !== 'buang') return;
    if (terpilih === i) buang(i); else setPilih(i);
  };
  const ambil = dari => bolehAksi && main.fase === 'ambil' && ruang.aksi({ t: 'ambil', dari });

  const tengah = (
    <div className="tumpukan-tengah">
      <button type="button" className="tumpukan" disabled={!bolehAksi || main.fase !== 'ambil'} onClick={() => ambil('dek')}>
        <KartuCeki tertutup /><span>Tumpukan · {main.sisaDek}</span>
      </button>
      <button type="button" className="tumpukan" disabled={!bolehAksi || main.fase !== 'ambil' || !main.buanganAtas} onClick={() => ambil('buangan')}>
        {main.buanganAtas ? <KartuCeki k={main.buanganAtas} /> : <div className="ceki kosong" />}<span>Buangan</span>
      </button>
    </div>
  );

  let aksi;
  if (!giliranku) aksi = <span className="petunjuk">Menunggu giliran {fmt(s, '@' + s.giliran)}...</span>;
  else if (main.fase === 'ambil') aksi = <span className="petunjuk penting">Giliran Anda: ambil dari tumpukan atau buangan.</span>;
  else if (terpilih == null) aksi = <span className="petunjuk penting">Pilih kartu yang akan dibuang (ketuk 2× untuk langsung buang).</span>;
  else aksi = <button className="btn btn-merah" disabled={!bolehAksi} onClick={() => buang(terpilih)}>Buang {labelCeki(tangan[terpilih])}</button>;

  return (
    <MejaKartu s={s} ruang={ruang}
      isiLawan={k => <JumlahKartu n={main.jumlahKartu[k]} />}
      tengah={tengah}
      aksi={aksi}
      infoSaya={<span className="info-kecil">Set lengkap: {susun.set.length}/4</span>}
      tangan={
        <Tangan jumlah={tangan.length} kelas="tangan-ceki">
          {tangan.map((k, i) => <KartuCeki key={i} k={k} dipilih={terpilih === i} baru={i === idxBaru} onClick={() => klik(i)} />)}
        </Tangan>
      } />
  );
}

PapanCeki.Hasil = function HasilCeki({ s, hasil }) {
  if (!hasil.susunan) return null;
  return (
    <div className="rincian">
      <div className="rincian-baris">
        <span className="nm">{s.seats[hasil.pemenang[0]].name}</span>
        <span className="kartu-mini-baris">
          {hasil.susunan.map((set, i) => <span key={i} className="grup-set">{set.map((k, j) => <KartuCeki key={j} k={k} kecil />)}</span>)}
        </span>
      </div>
    </div>
  );
};
