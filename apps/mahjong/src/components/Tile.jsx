const MERAH = ['🀄', '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏'];
const HIJAU = ['🀅', '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘'];
const BIRU = ['🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'];

export function warnaUbin(sym) {
  if (MERAH.includes(sym)) return 't-red';
  if (HIJAU.includes(sym)) return 't-green';
  if (BIRU.includes(sym)) return 't-blue';
  return 't-dark';
}

/** Satu ubin. sym kosong = ubin tertutup (pakai className "hidden"). */
export default function Tile({ sym, className, ...rest }) {
  const kelas = ['tile', sym ? warnaUbin(sym) : '', className].filter(Boolean).join(' ');
  return <div className={kelas} {...rest}>{sym || null}</div>;
}
