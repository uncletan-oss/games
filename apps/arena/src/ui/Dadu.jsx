const POSISI = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

/** Dadu dengan titik; animasi goyang setiap kali angkanya berubah (kunci = versi). */
export default function Dadu({ n, kunci, kecil }) {
  return (
    <span key={kunci} className={'dadu' + (kecil ? ' kecil' : '') + (n ? ' goyang' : ' kosong')} aria-label={n ? 'dadu ' + n : 'dadu'}>
      {Array.from({ length: 9 }, (_, i) => <span key={i} className={n && POSISI[n].includes(i) ? 'titik' : ''} />)}
    </span>
  );
}
