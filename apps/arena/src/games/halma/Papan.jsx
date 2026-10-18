import { useMemo, useState } from 'react';
import { ChipPemain, fmt } from '../../platform/ui.jsx';
import { WARNA_KURSI } from '../../platform/Beranda.jsx';
import { PETAK, SUDUT, tujuanDari } from './mesin.js';

const AKAR3 = Math.sqrt(3);
const posisi = (q, r) => [AKAR3 * (q + r / 2), 1.5 * r];
const kunci = (q, r) => q + ',' + r;

export default function PapanHalma({ s, main, ruang }) {
  const [pilih, setPilih] = useState(null);
  const giliranku = s.giliran === s.me && !s.hasil;
  const bolehAksi = giliranku && ruang.pending === 0;
  const tujuan = useMemo(() => (pilih && main.papan[pilih] === s.me ? tujuanDari(main.papan, pilih) : []), [pilih, main.papan, s.me]);
  const bisaJalan = useMemo(() => Object.keys(main.papan).some(k => main.papan[k] === s.me && tujuanDari(main.papan, k).length), [main.papan, s.me]);
  const sudut = main.rumah[s.me];
  const putar = -sudut * 60;   // sudut rumah Anda selalu di bawah
  const pemilikSudut = {};
  main.rumah.forEach((sd, p) => { pemilikSudut[sd] = p; });

  const klik = k => {
    if (!bolehAksi) return;
    if (tujuan.includes(k)) { ruang.aksi({ t: 'jalan', dari: pilih, ke: k }); setPilih(null); return; }
    setPilih(main.papan[k] === s.me ? k : null);
  };

  return (
    <div className="meja-papan">
      <div className="chip-baris">
        {s.seats.map((_, k) => (
          <ChipPemain key={k} view={s} kursi={k} ruang={ruang} warna={WARNA_KURSI[k]}>
            <span className="info-kecil">Tujuan: {SUDUT[main.tujuan[k]].nama}</span>
          </ChipPemain>
        ))}
      </div>
      <div className="papan-wadah">
        <svg className="halma-papan" viewBox="-14 -14 28 28" role="img" aria-label="Papan halma">
          <g transform={`rotate(${putar})`}>
            <polygon points="0,-13.2 11.43,6.6 -11.43,6.6" className="segitiga" />
            <polygon points="0,13.2 11.43,-6.6 -11.43,-6.6" className="segitiga" />
            {PETAK.map(([q, r]) => {
              const k = kunci(q, r), [x, y] = posisi(q, r), sq = -q - r;
              const sd = SUDUT.findIndex(t => t.uji(q, r, sq));
              const warnaSudut = sd >= 0 && pemilikSudut[sd] != null ? WARNA_KURSI[pemilikSudut[sd]] : null;
              const isi = main.papan[k];
              const jadiTujuan = tujuan.includes(k);
              const terakhir = main.terakhir && (main.terakhir.dari === k || main.terakhir.ke === k);
              return (
                <g key={k} onClick={() => klik(k)} className={'lubang-halma' + (bolehAksi && (isi === s.me || jadiTujuan) ? ' bisa' : '')}>
                  <circle cx={x} cy={y} r="0.62" className="lubang" style={warnaSudut ? { fill: warnaSudut, fillOpacity: 0.28 } : undefined} />
                  {terakhir && <circle cx={x} cy={y} r="0.78" className="jejak" />}
                  {isi != null && <circle cx={x} cy={y} r="0.55" className={'kelereng' + (pilih === k ? ' dipilih' : '')} style={{ fill: WARNA_KURSI[isi] }} />}
                  {jadiTujuan && <circle cx={x} cy={y} r="0.3" className="titik-tujuan" />}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="aksi-papan">
        {giliranku && bisaJalan && <span className="petunjuk penting">{pilih ? 'Ketuk lubang bertitik untuk memindahkan.' : 'Ketuk bidak Anda, lalu lubang tujuan.'}</span>}
        {giliranku && !bisaJalan && <button className="btn btn-utama" disabled={!bolehAksi} onClick={() => ruang.aksi({ t: 'lewat' })}>Lewat</button>}
        {!giliranku && !s.hasil && <span className="petunjuk">Giliran {fmt(s, '@' + s.giliran)}...</span>}
      </div>
    </div>
  );
}
