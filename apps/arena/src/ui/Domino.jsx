/* Kartu domino (balak 0–6) dengan titik mata. */
const POSISI = {   // titik pada kisi 3×3 (0..8)
  0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
};

function Sisi({ n }) {
  return (
    <span className="sisi-domino">
      {Array.from({ length: 9 }, (_, i) => <span key={i} className={POSISI[n].includes(i) ? 'titik' : ''} />)}
    </span>
  );
}

export default function Domino({ d, mendatar, dipilih, redup, onClick, tertutup, kecil }) {
  const kls = ['domino', mendatar ? 'mendatar' : 'tegak', dipilih && 'dipilih', redup && 'redup', kecil && 'kecil',
    tertutup && 'belakang', onClick && 'klik', d && d[0] === d[1] && 'balak'].filter(Boolean).join(' ');
  if (tertutup) return <div className={kls} aria-hidden="true" />;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={kls} onClick={onClick} type={onClick ? 'button' : undefined} aria-label={`domino ${d[0]} dan ${d[1]}`}>
      <Sisi n={d[0]} /><span className="garis" /><Sisi n={d[1]} />
    </Tag>
  );
}
