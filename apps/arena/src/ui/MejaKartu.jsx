import { ChipPemain, urutanLawan } from '../platform/ui.jsx';

/**
 * Tata letak meja kartu: lawan di atas, meja di tengah, tombol aksi dan kartu Anda di bawah.
 * isiLawan(kursi) → isi tambahan di label lawan (mis. jumlah kartu).
 */
export default function MejaKartu({ s, ruang, isiLawan, tengah, aksi, tangan, infoSaya }) {
  return (
    <div className="meja-kartu">
      <div className="lawan-baris">
        {urutanLawan(s).map(k => <ChipPemain key={k} view={s} kursi={k} ruang={ruang}>{isiLawan && isiLawan(k)}</ChipPemain>)}
      </div>
      <div className="tengah-meja">{tengah}</div>
      <div className="bawah-meja">
        <div className="aksi-baris">{aksi}</div>
        <ChipPemain view={s} kursi={s.me} ruang={ruang} kelas="chip-saya">{infoSaya}</ChipPemain>
        {tangan}
      </div>
    </div>
  );
}
