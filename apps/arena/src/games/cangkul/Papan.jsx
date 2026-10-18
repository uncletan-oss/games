import { useMemo, useState } from 'react';
import Kartu, { Tangan, JumlahKartu, labelKartu } from '../../ui/Kartu.jsx';
import MejaKartu from '../../ui/MejaKartu.jsx';
import { fmt } from '../../platform/ui.jsx';

const SIMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' };
const URUT_JENIS = 'SHCD';
const KUAT = '23456789TJQKA';
const urutkan = t => t.slice().sort((a, b) => URUT_JENIS.indexOf(a[1]) - URUT_JENIS.indexOf(b[1]) || KUAT.indexOf(a[0]) - KUAT.indexOf(b[0]));

export default function PapanCangkul({ s, main, ruang }) {
  const [pilih, setPilih] = useState(null);
  const tangan = useMemo(() => urutkan(main.tangan[s.me] || []), [main.tangan, s.me]);
  const giliranku = s.giliran === s.me && !s.hasil;
  const bolehAksi = giliranku && ruang.pending === 0;
  const bisaMain = k => !main.jenis || k[1] === main.jenis;
  const adaCocok = tangan.some(bisaMain);
  const terpilih = pilih && tangan.includes(pilih) && bisaMain(pilih) ? pilih : null;

  const main1 = k => { ruang.aksi({ t: 'main', kartu: k }); setPilih(null); };
  const klik = k => {
    if (!bolehAksi || !bisaMain(k)) return;
    if (terpilih === k) main1(k); else setPilih(k);
  };

  const tampilMeja = main.meja.length ? main.meja : (main.terakhir ? main.terakhir.meja : []);
  const tengah = (
    <div className="putaran">
      <div className="info-putaran">
        {main.jenis ? <>Jenis putaran: <b className={'jenis j-' + main.jenis}>{SIMBOL[main.jenis]}</b></> :
          main.terakhir ? <>Putaran lalu: {fmt(s, '@' + main.terakhir.juara)} menang</> : 'Putaran baru'}
        <span className="sisa-dek">Tumpukan: {main.sisaDek}</span>
      </div>
      <div className={'kartu-putaran' + (!main.meja.length && main.terakhir ? ' lalu' : '')}>
        {tampilMeja.map((m, i) => (
          <div key={i} className="main-pemain">
            {m.kartu ? <Kartu k={m.kartu} /> : <div className="kartu kosong">lewat</div>}
            <span>{s.seats[m.p].name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  let aksi;
  if (!giliranku) aksi = <span className="petunjuk">Menunggu giliran {fmt(s, '@' + s.giliran)}...</span>;
  else if (!adaCocok) aksi = main.sisaDek
    ? <button className="btn btn-utama berkilau" disabled={!bolehAksi} onClick={() => ruang.aksi({ t: 'cangkul' })}>⛏️ Cangkul (ambil kartu)</button>
    : <button className="btn btn-teks" disabled={!bolehAksi} onClick={() => ruang.aksi({ t: 'lewat' })}>Lewat</button>;
  else if (!terpilih) aksi = <span className="petunjuk penting">{main.jenis ? `Mainkan kartu ${SIMBOL[main.jenis]}.` : 'Anda membuka: mainkan kartu apa saja.'}</span>;
  else aksi = <button className="btn btn-utama" disabled={!bolehAksi} onClick={() => main1(terpilih)}>Mainkan {labelKartu(terpilih)}</button>;

  return (
    <MejaKartu s={s} ruang={ruang}
      isiLawan={k => <JumlahKartu n={main.jumlahKartu[k]} />}
      tengah={tengah}
      aksi={aksi}
      tangan={
        <Tangan jumlah={tangan.length}>
          {tangan.map(k => <Kartu key={k} k={k} dipilih={terpilih === k} redup={giliranku && !bisaMain(k)} onClick={() => klik(k)} />)}
        </Tangan>
      } />
  );
}
