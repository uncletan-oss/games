import { useState } from 'react';
import { ChipPemain, fmt } from '../../platform/ui.jsx';

// Simbol bidak dengan pemilih variasi teks (︎) supaya tidak tampil sebagai emoji
const GLIF = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const glif = b => GLIF[b.toLowerCase()] + '︎';
const NAMA_PROMOSI = { q: 'Menteri', r: 'Benteng', b: 'Gajah', n: 'Kuda' };

export default function PapanCatur({ s, main, ruang }) {
  const [pilih, setPilih] = useState(null);
  const [promosi, setPromosi] = useState(null);   // { dari, ke }
  const wSaya = main.putih === s.me ? 'w' : 'b';
  const giliranku = s.giliran === s.me && !s.hasil;
  const bolehAksi = giliranku && ruang.pending === 0;
  const tujuan = pilih != null ? main.sah.filter(m => m[0] === pilih) : [];
  const urutan = Array.from({ length: 64 }, (_, i) => (wSaya === 'w' ? i : 63 - i));
  const raja = main.skak ? main.papan.indexOf(main.warna === 'w' ? 'K' : 'k') : -1;

  const klik = i => {
    if (!bolehAksi) return;
    const b = main.papan[i];
    const ke = tujuan.filter(m => m[1] === i);
    if (ke.length) {
      if (ke.length > 1) setPromosi({ dari: pilih, ke: i });
      else { ruang.aksi({ t: 'jalan', dari: pilih, ke: i }); setPilih(null); }
      return;
    }
    if (b && (b === b.toUpperCase() ? 'w' : 'b') === wSaya && main.sah.some(m => m[0] === i)) setPilih(i);
    else setPilih(null);
  };

  const menyerah = () => ruang.tampilModal('Menyerah?', 'Lawan akan dinyatakan menang ronde ini.', { label: 'Menyerah', onClick: () => ruang.aksi({ t: 'menyerah' }) });
  const kursiPutih = main.putih;
  const dimakanOleh = w => main.dimakan[w].map((b, i) => <span key={i} className={'mini-bidak ' + (b === b.toUpperCase() ? 'putih' : 'hitam')}>{glif(b)}</span>);

  return (
    <div className="meja-papan">
      <div className="chip-baris dua">
        {[1 - s.me, s.me].map(k => {
          const w = k === kursiPutih ? 'w' : 'b';
          return (
            <ChipPemain key={k} view={s} kursi={k} ruang={ruang} warna={w === 'w' ? '#F4F0E6' : '#222'}>
              <span className="info-kecil">{w === 'w' ? 'Putih' : 'Hitam'} <span className="dimakan">{dimakanOleh(w)}</span></span>
            </ChipPemain>
          );
        })}
      </div>
      <div className="papan-wadah">
        <div className="catur-papan">
          {urutan.map(i => {
            const b = main.papan[i];
            const gelap = ((i >> 3) + (i & 7)) % 2 === 1;
            const jadiTujuan = tujuan.some(m => m[1] === i);
            const kls = ['kotak', gelap ? 'gelap' : 'terang', pilih === i && 'dipilih', main.terakhir && (main.terakhir.dari === i || main.terakhir.ke === i) && 'terakhir',
              i === raja && 'skak', jadiTujuan && (b ? 'bisa-makan' : 'bisa-jalan')].filter(Boolean).join(' ');
            return (
              <button key={i} type="button" className={kls} onClick={() => klik(i)} disabled={!bolehAksi} aria-label={'petak ' + 'abcdefgh'[i & 7] + (8 - (i >> 3))}>
                {b && <span className={'bidak-catur ' + (b === b.toUpperCase() ? 'putih' : 'hitam')}>{glif(b)}</span>}
              </button>
            );
          })}
        </div>
        {promosi && (
          <div className="pilih-promosi">
            <span>Promosi jadi:</span>
            {['q', 'r', 'b', 'n'].map(pr => (
              <button key={pr} className="btn btn-kedua" onClick={() => { ruang.aksi({ t: 'jalan', dari: promosi.dari, ke: promosi.ke, promosi: pr }); setPromosi(null); setPilih(null); }}>
                <span className={'bidak-catur ' + (wSaya === 'w' ? 'putih' : 'hitam')}>{glif(pr)}</span> {NAMA_PROMOSI[pr]}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="aksi-papan">
        {giliranku ? <span className="petunjuk penting">{main.skak ? 'Raja Anda diskak! ' : ''}Giliran Anda ({wSaya === 'w' ? 'putih' : 'hitam'}).</span>
          : !s.hasil && <span className="petunjuk">Giliran {fmt(s, '@' + s.giliran)}...</span>}
        {!s.hasil && <button className="btn btn-teks" onClick={menyerah}>Menyerah</button>}
      </div>
    </div>
  );
}
