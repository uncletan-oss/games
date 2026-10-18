import { ChipPemain, fmt } from '../../platform/ui.jsx';
import Dadu from '../../ui/Dadu.jsx';
import { TANGGA, ULAR } from './mesin.js';
import { WARNA_LUDO } from '../ludo/Papan.jsx';

/** Pusat petak n (1..100) dalam koordinat 0..10 (baris 0 di atas). */
function pusat(n) {
  const r = Math.floor((n - 1) / 10);
  const c = r % 2 === 0 ? (n - 1) % 10 : 9 - ((n - 1) % 10);
  return [c + 0.5, 9 - r + 0.5];
}

function Tangga({ dari, ke }) {
  const [x1, y1] = pusat(dari), [x2, y2] = pusat(ke);
  const dx = x2 - x1, dy = y2 - y1, pjg = Math.hypot(dx, dy);
  const nx = (-dy / pjg) * 0.18, ny = (dx / pjg) * 0.18;
  const anak = [];
  const n = Math.max(2, Math.floor(pjg / 0.45));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    anak.push(<line key={i} x1={x1 + dx * t - nx} y1={y1 + dy * t - ny} x2={x1 + dx * t + nx} y2={y1 + dy * t + ny} />);
  }
  return (
    <g className="tangga">
      <line x1={x1 - nx} y1={y1 - ny} x2={x2 - nx} y2={y2 - ny} />
      <line x1={x1 + nx} y1={y1 + ny} x2={x2 + nx} y2={y2 + ny} />
      {anak}
    </g>
  );
}

function Ular({ dari, ke, i }) {
  const [x1, y1] = pusat(dari), [x2, y2] = pusat(ke);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const lengkung = (i % 2 ? 1 : -1) * 0.9;
  const c1 = [x1 + dx * 0.25 - dy * 0.18 * lengkung, y1 + dy * 0.25 + dx * 0.18 * lengkung];
  const c2 = [mx + dy * 0.18 * lengkung, my - dx * 0.18 * lengkung];
  const d = `M${x1} ${y1} Q${c1[0]} ${c1[1]} ${(x1 + mx) / 2} ${(y1 + my) / 2} T${mx} ${my} Q${c2[0]} ${c2[1]} ${x2} ${y2}`;
  return (
    <g className="ular">
      <path d={d} className="badan" />
      <path d={d} className="corak" />
      <circle cx={x1} cy={y1} r="0.22" className="kepala" />
    </g>
  );
}

export default function PapanUlar({ s, main, ruang }) {
  const giliranku = s.giliran === s.me && !s.hasil;
  const bolehAksi = giliranku && ruang.pending === 0;
  const warna = k => WARNA_LUDO[k % 4];
  const petak = [];
  for (let n = 100; n >= 1; n--) petak.push(n);
  const urutKisi = petak.map(n => { const [x, y] = pusat(n); return { n, x: Math.floor(x), y: Math.floor(y) }; });

  return (
    <div className="meja-papan">
      <div className="chip-baris">
        {s.seats.map((_, k) => (
          <ChipPemain key={k} view={s} kursi={k} ruang={ruang} warna={warna(k)}>
            <span className="info-kecil">Petak {main.posisi[k] || 'start'}</span>
          </ChipPemain>
        ))}
      </div>
      <div className="papan-wadah">
        <div className="ular-papan">
          {urutKisi.map(p => (
            <div key={p.n} className={'petak' + ((p.x + p.y) % 2 ? ' gelap' : '')} style={{ gridRow: p.y + 1, gridColumn: p.x + 1 }}>
              <span>{p.n}</span>
            </div>
          ))}
          <svg viewBox="0 0 10 10" className="lapisan" aria-hidden="true">
            {Object.entries(TANGGA).map(([a, b]) => <Tangga key={'t' + a} dari={+a} ke={b} />)}
            {Object.entries(ULAR).map(([a, b], i) => <Ular key={'u' + a} dari={+a} ke={b} i={i} />)}
          </svg>
          {main.posisi.map((pos, k) => {
            if (!pos) return null;
            const [x, y] = pusat(pos);
            return <span key={k} className="pion" style={{ left: `${x * 10}%`, top: `${y * 10}%`, '--warna-pemain': warna(k), '--geser': k }} aria-label={s.seats[k].name} />;
          })}
        </div>
      </div>
      <div className="aksi-papan">
        <Dadu n={main.dadu} kunci={s.version} />
        {giliranku && <button className="btn btn-utama berkilau" disabled={!bolehAksi} onClick={() => ruang.aksi({ t: 'lempar' })}>🎲 Lempar dadu</button>}
        {!giliranku && !s.hasil && <span className="petunjuk">Giliran {fmt(s, '@' + s.giliran)}...</span>}
      </div>
    </div>
  );
}
