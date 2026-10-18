/* Kartu remi. Kode: peringkat + jenis, mis. "AS", "TH", "7C". */
const SIMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' };
const PKT = { T: '10' };

export const labelKartu = k => (PKT[k[0]] || k[0]) + SIMBOL[k[1]];

export default function Kartu({ k, tertutup, dipilih, redup, onClick, kecil, judul, tanda, baru }) {
  if (tertutup || !k) return <div className={'kartu belakang' + (kecil ? ' kecil' : '')} aria-hidden="true" />;
  const merah = k[1] === 'H' || k[1] === 'D';
  const kls = ['kartu', merah ? 'merah' : 'hitam', dipilih && 'dipilih', redup && 'redup', kecil && 'kecil', onClick && 'klik', tanda && 'tanda', baru && 'baru'].filter(Boolean).join(' ');
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={kls} onClick={onClick} type={onClick ? 'button' : undefined} aria-label={judul || labelKartu(k)} aria-pressed={onClick ? !!dipilih : undefined}>
      <span className="pojok">{PKT[k[0]] || k[0]}<br />{SIMBOL[k[1]]}</span>
      <span className="tengah">{SIMBOL[k[1]]}</span>
    </Tag>
  );
}

/** Deretan kartu yang menumpuk otomatis bila tempat sempit. */
export function Tangan({ children, jumlah, kelas }) {
  return <div className={'tangan' + (kelas ? ' ' + kelas : '')} style={{ '--n': Math.max(1, jumlah) }}>{children}</div>;
}

/** Tumpukan kartu tertutup kecil sebagai penanda jumlah kartu lawan. */
export function JumlahKartu({ n }) {
  return (
    <div className="jumlah-kartu" aria-label={n + ' kartu'}>
      <span className="mini-tumpuk">{Array.from({ length: Math.min(n, 5) }, (_, i) => <span key={i} />)}</span>
      <b>{n}</b>
    </div>
  );
}
