import { useEffect, useMemo, useState } from 'react';
import { GAMES } from '../games/index.js';
import { buatServer } from './ruang.js';
import { buatJaringan } from './jaringan.js';
import useRuang from './useRuang.js';
import Beranda from './Beranda.jsx';
import RuangTunggu from './RuangTunggu.jsx';
import Meja from './Meja.jsx';
import { Modal } from './ui.jsx';

// Satu server & jaringan per game, bertahan selama halaman terbuka (meja host tetap jalan saat pindah halaman)
const cache = {};
function jaringanUntuk(id) {
  if (!cache[id]) cache[id] = buatJaringan(id, buatServer(GAMES[id].mesin));
  return cache[id];
}

export default function GameShell({ id, kodeUndangan }) {
  const game = GAMES[id];
  const jaringan = useMemo(() => jaringanUntuk(id), [id]);
  const ruang = useRuang(id, jaringan);
  const [aturan, setAturan] = useState(false);
  const s = ruang.view;
  const tautan = s ? `${location.origin}${location.pathname}#/${id}/${encodeURIComponent(s.roomCode)}` : '';

  useEffect(() => { document.body.classList.toggle('sedang-main', ruang.layar === 'game'); }, [ruang.layar]);
  useEffect(() => () => document.body.classList.remove('sedang-main'), []);

  const modalAturan = aturan && {
    judul: `Aturan ${game.nama}`, lebar: true,
    isi: <ol className="aturan">{game.aturan.map((t, i) => <li key={i}>{t}</li>)}</ol>
  };

  return (
    <>
      {ruang.layar !== 'game' && (
        <header className="kepala">
          <a className="kembali" href="#/">← Semua game</a>
          <h1>{game.ikonKecil || game.ikon} {game.nama}</h1>
          <button type="button" className="btn-kecil" onClick={() => setAturan(true)}>Aturan</button>
        </header>
      )}
      {ruang.layar === 'home' && <Beranda game={game} ruang={ruang} kodeUndangan={kodeUndangan} />}
      {ruang.layar === 'lobby' && s && <RuangTunggu game={game} s={s} ruang={ruang} tautan={tautan} />}
      {ruang.layar === 'game' && s && s.status === 'playing' && <Meja game={game} s={s} ruang={ruang} onAturan={() => setAturan(true)} />}
      <Modal modal={ruang.modal || modalAturan} onTutup={() => (ruang.modal ? ruang.tutupModal() : setAturan(false))} />
    </>
  );
}
