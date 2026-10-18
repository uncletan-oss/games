import { useMemo, useState } from 'react';
import Kartu, { Tangan, JumlahKartu, labelKartu } from '../../ui/Kartu.jsx';
import MejaKartu from '../../ui/MejaKartu.jsx';
import { kenali, lebihTinggi, urutkan } from './mesin.js';
import { fmt } from '../../platform/ui.jsx';

export default function PapanCapsa({ s, main, ruang }) {
  const [pilih, setPilih] = useState([]);
  const tangan = useMemo(() => urutkan(main.tangan[s.me] || []), [main.tangan, s.me]);
  const giliranku = s.giliran === s.me && !s.hasil;
  const bolehAksi = giliranku && ruang.pending === 0;
  const terpilih = pilih.filter(k => tangan.includes(k));
  const kombo = terpilih.length ? kenali(terpilih) : null;
  const wajibOk = !main.wajib || terpilih.includes(main.wajib);
  const sah = kombo && wajibOk && (!main.meja || lebihTinggi(kombo, main.meja.kombinasi));

  const klik = k => {
    if (!giliranku) return;
    setPilih(p => (p.includes(k) ? p.filter(x => x !== k) : p.concat(k)));
  };
  const mainkan = () => { ruang.aksi({ t: 'main', kartu: terpilih }); setPilih([]); };

  const tengah = (
    <div className="putaran">
      <div className="info-putaran">
        {main.meja ? <>{fmt(s, '@' + main.meja.p)} memainkan <b>{main.meja.kombinasi.nama}</b></> : <>Meja kosong — {fmt(s, '@' + s.giliran)} bebas membuka</>}
      </div>
      <div className="kartu-putaran rapat">
        {main.meja && main.meja.kartu.map(k => <Kartu key={k} k={k} />)}
      </div>
      {main.wajib && <div className="info-putaran">Langkah pertama wajib memakai <b>{labelKartu(main.wajib)}</b></div>}
    </div>
  );

  let aksi;
  if (!giliranku) aksi = <span className="petunjuk">Menunggu giliran {fmt(s, '@' + s.giliran)}...</span>;
  else aksi = <>
    {main.meja && <button className="btn btn-teks" disabled={!bolehAksi} onClick={() => { ruang.aksi({ t: 'lewat' }); setPilih([]); }}>Lewat</button>}
    {terpilih.length > 0 && <button className="btn btn-teks" onClick={() => setPilih([])}>Batal pilih</button>}
    <button className="btn btn-utama" disabled={!bolehAksi || !sah} onClick={mainkan}>
      {!terpilih.length ? 'Pilih kartu' : !kombo ? 'Kombinasi tidak sah' : !wajibOk ? `Harus pakai ${labelKartu(main.wajib)}` : !sah ? `${kombo.nama} kurang tinggi` : `Mainkan ${kombo.nama}`}
    </button>
  </>;

  return (
    <MejaKartu s={s} ruang={ruang}
      isiLawan={k => <>{<JumlahKartu n={main.jumlahKartu[k]} />}{main.lewat.includes(k) && <span className="lencana lewat">Lewat</span>}</>}
      tengah={tengah}
      aksi={aksi}
      tangan={
        <Tangan jumlah={tangan.length}>
          {tangan.map(k => <Kartu key={k} k={k} dipilih={terpilih.includes(k)} onClick={() => klik(k)} />)}
        </Tangan>
      } />
  );
}
