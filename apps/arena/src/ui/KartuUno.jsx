/* Kartu Uno. Kode: warna (M/K/H/B, W = kartu bebas) + nilai (0–9, S lewati, R putar, D +2, W ganti warna, 4 = +4). */
const SIMBOL = { S: '⊘', R: '⇄', D: '+2', W: '', 4: '+4' };

export default function KartuUno({ k, dipilih, redup, onClick, kecil, tertutup, baru }) {
  if (tertutup || !k) return <div className={'uno belakang' + (kecil ? ' kecil' : '')} aria-hidden="true"><span>UNO</span></div>;
  const bebas = k[0] === 'W';
  const nilai = SIMBOL[k[1]] != null ? SIMBOL[k[1]] : k[1];
  const kls = ['uno', 'w-' + k[0], dipilih && 'dipilih', redup && 'redup', kecil && 'kecil', onClick && 'klik', baru && 'baru'].filter(Boolean).join(' ');
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={kls} onClick={onClick} type={onClick ? 'button' : undefined} aria-pressed={onClick ? !!dipilih : undefined}>
      <span className="pojok">{nilai || '★'}</span>
      <span className="oval">{bebas && k[1] === 'W' ? <span className="roda" /> : nilai}</span>
    </Tag>
  );
}
