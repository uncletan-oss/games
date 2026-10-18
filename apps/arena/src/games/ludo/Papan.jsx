import { ChipPemain } from '../../platform/ui.jsx';
import Dadu from '../../ui/Dadu.jsx';
import { fmt } from '../../platform/ui.jsx';
import { AMAN, SELESAI } from './mesin.js';

export const WARNA_LUDO = ['#D9483B', '#2E9E5B', '#E2B33B', '#2F7BD6'];
const NAMA_WARNA = ['Merah', 'Hijau', 'Kuning', 'Biru'];

/* Lintasan 52 petak pada kisi 15×15 [baris, kolom], mulai dari petak start Merah. */
const LINTASAN = (() => {
  const t = [];
  for (let c = 1; c <= 5; c++) t.push([6, c]);
  for (let r = 5; r >= 0; r--) t.push([r, 6]);
  t.push([0, 7]);
  for (let r = 0; r <= 5; r++) t.push([r, 8]);
  for (let c = 9; c <= 14; c++) t.push([6, c]);
  t.push([7, 14]);
  for (let c = 14; c >= 9; c--) t.push([8, c]);
  for (let r = 9; r <= 14; r++) t.push([r, 8]);
  t.push([14, 7]);
  for (let r = 14; r >= 9; r--) t.push([r, 6]);
  for (let c = 5; c >= 0; c--) t.push([8, c]);
  t.push([7, 0], [6, 0]);
  return t;
})();
const JALUR_RUMAH = [
  [1, 2, 3, 4, 5].map(c => [7, c]),
  [1, 2, 3, 4, 5].map(r => [r, 7]),
  [13, 12, 11, 10, 9].map(c => [7, c]),
  [13, 12, 11, 10, 9].map(r => [r, 7])
];
const RUMAH = [[7, 6.2], [6.2, 7], [7, 7.8], [7.8, 7]];   // titik tujuan di segitiga tengah
const KANDANG = [[1.5, 1.5], [1.5, 10.5], [10.5, 10.5], [10.5, 1.5]];   // sudut kiri-atas area kandang (4×4 di dalam 6×6)

function koordinat(warna, pos, i) {
  if (pos === -1) {
    const [r, c] = KANDANG[warna];
    return [r + (i >> 1) * 2, c + (i & 1) * 2];
  }
  if (pos === SELESAI) return RUMAH[warna];
  if (pos > 50) return JALUR_RUMAH[warna][pos - 51];
  return LINTASAN[(warna * 13 + pos) % 52];
}

/* Jenis petak untuk menggambar papan */
const PETAK = (() => {
  const peta = {};
  LINTASAN.forEach(([r, c], i) => { peta[r + ',' + c] = { jalur: true, aman: AMAN.includes(i), start: i % 13 === 0 ? i / 13 : null }; });
  JALUR_RUMAH.forEach((jalur, w) => jalur.forEach(([r, c]) => { peta[r + ',' + c] = { rumah: w }; }));
  return peta;
})();

function Papan({ main }) {
  const sel = [];
  for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) {
    const p = PETAK[r + ',' + c];
    let kls = 'sel', isi = null, gaya;
    if (r < 6 && c < 6) kls += ' kandang w0';
    else if (r < 6 && c > 8) kls += ' kandang w1';
    else if (r > 8 && c > 8) kls += ' kandang w2';
    else if (r > 8 && c < 6) kls += ' kandang w3';
    else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) kls += ' pusat';
    else if (p && p.rumah != null) kls += ' jalur-rumah w' + p.rumah;
    else if (p && p.start != null) kls += ' start w' + p.start;
    else if (p && p.jalur) kls += ' jalur';
    if (p && p.aman && p.start == null) isi = '★';
    if (kls.includes('pusat') && r === 7 && c === 7) gaya = { gridArea: '7 / 7 / 10 / 10' };
    if (kls.includes('pusat') && !(r === 7 && c === 7)) continue;
    sel.push(<div key={r + '-' + c} className={kls} style={gaya || { gridRow: r + 1, gridColumn: c + 1 }}>{isi}</div>);
  }
  return <div className="ludo-kisi">{sel}</div>;
}

export default function PapanLudo({ s, main, ruang }) {
  const giliranku = s.giliran === s.me && !s.hasil;
  const bolehAksi = giliranku && ruang.pending === 0;
  const wSaya = main.warna[s.me];

  // Kelompokkan bidak per koordinat supaya yang bertumpuk sedikit digeser
  const bidak = [];
  const tumpuk = {};
  main.bidak.forEach((bs, p) => bs.forEach((pos, i) => {
    const [r, c] = koordinat(main.warna[p], pos, i);
    const kunci = pos === -1 ? 'k' + p + i : r + ',' + c;
    const ke = (tumpuk[kunci] = (tumpuk[kunci] || 0) + 1) - 1;
    const bisa = bolehAksi && p === s.me && main.fase === 'jalan' && main.bisa.includes(i);
    bidak.push({ p, i, r, c, ke, bisa });
  }));

  return (
    <div className="meja-papan">
      <div className="chip-baris">
        {s.seats.map((_, k) => (
          <ChipPemain key={k} view={s} kursi={k} ruang={ruang} warna={WARNA_LUDO[main.warna[k]]}>
            <span className="info-kecil">{main.bidak[k].filter(x => x === SELESAI).length}/4 di rumah</span>
          </ChipPemain>
        ))}
      </div>
      <div className="papan-wadah">
        <div className={'ludo-papan putar-' + wSaya}>
          <Papan main={main} />
          {main.warna.map(w => [0, 1, 2, 3].map(i => {
            const [r, c] = koordinat(w, -1, i);
            return <span key={w + '-' + i} className="tempat-kandang" style={{ top: `${((r + 0.5) / 15) * 100}%`, left: `${((c + 0.5) / 15) * 100}%` }} />;
          }))}
          {bidak.map(b => (
            <button key={b.p + '-' + b.i} type="button"
                    className={'bidak w' + main.warna[b.p] + (b.bisa ? ' bisa' : '')}
                    disabled={!b.bisa}
                    aria-label={`Bidak ${NAMA_WARNA[main.warna[b.p]]} ${b.i + 1}`}
                    onClick={() => b.bisa && ruang.aksi({ t: 'jalan', bidak: b.i })}
                    style={{ top: `${((b.r + 0.5) / 15) * 100}%`, left: `${((b.c + 0.5) / 15) * 100}%`, '--geser': b.ke }} />
          ))}
        </div>
      </div>
      <div className="aksi-papan">
        <Dadu n={main.dadu} kunci={s.version} />
        {giliranku && main.fase === 'lempar' && <button className="btn btn-utama berkilau" disabled={!bolehAksi} onClick={() => ruang.aksi({ t: 'lempar' })}>🎲 Lempar dadu</button>}
        {giliranku && main.fase === 'jalan' && <span className="petunjuk penting">Ketuk bidak {NAMA_WARNA[wSaya]} yang menyala.</span>}
        {!giliranku && !s.hasil && <span className="petunjuk">Giliran {fmt(s, '@' + s.giliran)}...</span>}
      </div>
    </div>
  );
}
