import { useState } from 'react';
import KartuUno from '../../ui/KartuUno.jsx';
import { Tangan, JumlahKartu } from '../../ui/Kartu.jsx';
import MejaKartu from '../../ui/MejaKartu.jsx';
import { bisaDimainkan, WARNA_UNO, NAMA_WARNA_UNO, labelUno } from './mesin.js';
import { fmt } from '../../platform/ui.jsx';

const URUT = 'MKHBW';
const urutkan = t => t.slice().sort((a, b) => URUT.indexOf(a[0]) - URUT.indexOf(b[0]) || a[1].localeCompare(b[1]));

export default function PapanUno({ s, main, ruang }) {
  const [pilih, setPilih] = useState(null);
  const tangan = urutkan(main.tangan[s.me] || []);
  const giliranku = s.giliran === s.me && !s.hasil;
  const bolehAksi = giliranku && ruang.pending === 0;
  const bisa = k => bisaDimainkan(k, main.atas, main.warna) && (main.fase !== 'setelahAmbil' || k === main.diambil);
  const terpilih = pilih != null && tangan[pilih] && bisa(tangan[pilih]) ? tangan[pilih] : null;

  const mainkan = (k, warna) => { ruang.aksi({ t: 'main', kartu: k, warna }); setPilih(null); };
  const klik = i => {
    const k = tangan[i];
    if (!bolehAksi || !bisa(k)) return;
    if (pilih === i && k[0] !== 'W') mainkan(k);
    else setPilih(i);
  };

  const tengah = (
    <div className="uno-tengah">
      <button type="button" className="tumpukan" disabled={!bolehAksi || main.fase !== 'main'} onClick={() => ruang.aksi({ t: 'ambil' })}>
        <KartuUno tertutup /><span>Ambil · {main.sisaDek}</span>
      </button>
      <div className="tumpukan">
        <KartuUno k={main.atas} />
        <span className={'warna-aktif w-' + main.warna}>{NAMA_WARNA_UNO[main.warna]} {main.arah === 1 ? '↻' : '↺'}</span>
      </div>
    </div>
  );

  let aksi;
  if (!giliranku) aksi = <span className="petunjuk">Menunggu giliran {fmt(s, '@' + s.giliran)}...</span>;
  else if (terpilih && terpilih[0] === 'W') aksi = <>
    <span className="petunjuk penting">Pilih warna:</span>
    {WARNA_UNO.map(w => <button key={w} className={'btn tombol-warna w-' + w} disabled={!bolehAksi} onClick={() => mainkan(terpilih, w)}>{NAMA_WARNA_UNO[w]}</button>)}
  </>;
  else if (terpilih) aksi = <button className="btn btn-utama" disabled={!bolehAksi} onClick={() => mainkan(terpilih)}>Mainkan {labelUno(terpilih)}</button>;
  else if (main.fase === 'setelahAmbil') aksi = <>
    <span className="petunjuk penting">Kartu yang diambil bisa dimainkan.</span>
    <button className="btn btn-teks" disabled={!bolehAksi} onClick={() => ruang.aksi({ t: 'lewat' })}>Lewat</button>
  </>;
  else aksi = <span className="petunjuk penting">{tangan.some(bisa) ? 'Mainkan kartu yang menyala, atau ambil kartu.' : 'Tidak ada kartu cocok — ketuk tumpukan untuk mengambil.'}</span>;

  return (
    <MejaKartu s={s} ruang={ruang}
      isiLawan={k => <JumlahKartu n={main.jumlahKartu[k]} />}
      tengah={tengah}
      aksi={aksi}
      infoSaya={tangan.length === 1 ? <span className="lencana host">UNO!</span> : null}
      tangan={
        <Tangan jumlah={tangan.length} kelas="tangan-uno">
          {tangan.map((k, i) => <KartuUno key={k + i} k={k} dipilih={pilih === i && !!terpilih} baru={k === main.diambil}
                                          redup={giliranku && !bisa(k)} onClick={() => klik(i)} />)}
        </Tangan>
      } />
  );
}
