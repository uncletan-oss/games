/* Kartu ceki: sempit memanjang, jenis Bulat (●), Tali (‖), Ribu (萬), angka 1–9. */
const ANGKA = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const NAMA_JENIS_CEKI = { B: 'Bulat', T: 'Tali', R: 'Ribu' };
const SIMBOL = { B: '●', T: '‖', R: '萬' };

export const labelCeki = k => `${k[1]} ${NAMA_JENIS_CEKI[k[0]]}`;

export default function KartuCeki({ k, dipilih, redup, onClick, kecil, tertutup, baru }) {
  if (tertutup || !k) return <div className={'ceki belakang' + (kecil ? ' kecil' : '')} aria-hidden="true" />;
  const kls = ['ceki', 'j-' + k[0], dipilih && 'dipilih', redup && 'redup', kecil && 'kecil', onClick && 'klik', baru && 'baru'].filter(Boolean).join(' ');
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={kls} onClick={onClick} type={onClick ? 'button' : undefined} aria-label={labelCeki(k)} aria-pressed={onClick ? !!dipilih : undefined}>
      <span className="angka">{k[1]}</span>
      <span className="han">{ANGKA[k[1]]}</span>
      <span className="simbol">{SIMBOL[k[0]]}</span>
    </Tag>
  );
}
