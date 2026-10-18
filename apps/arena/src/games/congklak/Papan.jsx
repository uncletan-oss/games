import { ChipPemain, fmt } from '../../platform/ui.jsx';
import { LUMBUNG, lubangMilik } from './mesin.js';

function Biji({ n }) {
  const tampil = Math.min(n, 14);
  return (
    <span className="biji-wadah" aria-hidden="true">
      {Array.from({ length: tampil }, (_, i) => <span key={i} className="biji" style={{ '--i': i }} />)}
    </span>
  );
}

export default function PapanCongklak({ s, main, ruang }) {
  const me = s.me, lawan = 1 - me;
  const giliranku = s.giliran === me && !s.hasil;
  const bolehAksi = giliranku && ruang.pending === 0;
  const jejak = main.terakhir ? main.terakhir.jejak : [];
  const akhir = jejak.length ? jejak[jejak.length - 1] : -1;

  const Lubang = ({ i, milikSaya }) => {
    const n = main.lubang[i];
    const bisa = milikSaya && bolehAksi && n > 0;
    return (
      <button type="button" className={'lubang-ck' + (bisa ? ' bisa' : '') + (main.terakhir && main.terakhir.dari === i ? ' asal' : '') + (i === akhir ? ' akhir' : '')}
              disabled={!bisa} onClick={() => ruang.aksi({ t: 'pilih', lubang: i })} aria-label={`lubang berisi ${n} biji`}>
        <Biji n={n} /><b>{n}</b>
      </button>
    );
  };

  return (
    <div className="meja-papan">
      <div className="chip-baris dua">
        {[lawan, me].map(k => (
          <ChipPemain key={k} view={s} kursi={k} ruang={ruang}>
            <span className="info-kecil">Lumbung: {main.lubang[LUMBUNG[k]]} biji</span>
          </ChipPemain>
        ))}
      </div>
      <div className="papan-wadah">
        <div className="congklak-papan">
          <div className={'lumbung' + (akhir === LUMBUNG[lawan] ? ' akhir' : '')}><Biji n={main.lubang[LUMBUNG[lawan]]} /><b>{main.lubang[LUMBUNG[lawan]]}</b><small>{s.seats[lawan].name}</small></div>
          <div className="baris-ck">
            <div className="deret-ck">{lubangMilik(lawan).slice().reverse().map(i => <Lubang key={i} i={i} />)}</div>
            <div className="deret-ck">{lubangMilik(me).map(i => <Lubang key={i} i={i} milikSaya />)}</div>
          </div>
          <div className={'lumbung' + (akhir === LUMBUNG[me] ? ' akhir' : '')}><Biji n={main.lubang[LUMBUNG[me]]} /><b>{main.lubang[LUMBUNG[me]]}</b><small>Anda</small></div>
        </div>
      </div>
      <div className="aksi-papan">
        {giliranku ? <span className="petunjuk penting">Ketuk salah satu lubang Anda (baris bawah). Biji disebar ke kanan →</span>
          : !s.hasil && <span className="petunjuk">Giliran {fmt(s, '@' + s.giliran)}...</span>}
      </div>
    </div>
  );
}
