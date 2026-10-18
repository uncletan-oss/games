import { useState } from 'react';
import { fmt } from './ui.jsx';

/** Kerangka layar permainan: bilah atas, papan game, panel hasil ronde. */
export default function Meja({ game, s, ruang, onAturan }) {
  const [lihatMeja, setLihatMeja] = useState(null);   // idRonde yang panel hasilnya disembunyikan
  const { Papan } = game;
  const h = s.hasil;
  return (
    <div className="layar-main">
      <div className="bar-atas">
        <span className="judul-game">{game.ikonKecil || game.ikon} {game.nama}</span>
        <span className="info-meja">{s.roomCode} · ronde {s.ronde}</span>
        <button type="button" className="btn-kecil" onClick={onAturan}>Aturan</button>
        <button type="button" className="btn-kecil merah" onClick={ruang.keluar}>Keluar</button>
      </div>
      <div className="log-baris" aria-live="polite">{fmt(s, s.log)}</div>
      <div className="papan-area">
        <Papan s={s} main={s.main} ruang={ruang} />
        {ruang.putus && <div className="banner-putus" role="status">Koneksi ke host terputus, menyambung ulang...</div>}
        {h && lihatMeja !== s.idRonde && (
          <div className="panel-hasil" role="dialog" aria-label="Hasil ronde">
            <h3>{h.pemenang.includes(s.me) ? '🎉 Anda menang!' : h.pemenang.length ? '🏁 Ronde selesai' : '⚖️ Seri'}</h3>
            <p>{fmt(s, h.teks)}</p>
            {game.Papan.Hasil && <game.Papan.Hasil s={s} hasil={h} />}
            <div className="papan-skor">
              {s.seats.map((x, i) => (
                <div key={i} className={h.pemenang.includes(i) ? 'juara' : ''}><span>{x.name}</span><b>🏆 {s.skor[i]}</b></div>
              ))}
            </div>
            <div className="baris-tombol">
              <button className="btn btn-teks" onClick={() => setLihatMeja(s.idRonde)}>Lihat meja</button>
              <button className="btn btn-utama" disabled={ruang.pending > 0} onClick={ruang.mainLagi}>🔄 Ronde berikutnya</button>
            </div>
          </div>
        )}
        {h && lihatMeja === s.idRonde && (
          <button className="btn btn-utama tombol-lanjut" onClick={ruang.mainLagi}>🔄 Ronde berikutnya</button>
        )}
      </div>
    </div>
  );
}
