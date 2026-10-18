import { useEffect } from 'react';
import useMeja from './useMeja.js';
import Home from './components/Home.jsx';
import Lobby from './components/Lobby.jsx';
import Game from './components/Game.jsx';
import Modal from './components/Modal.jsx';

export default function App() {
  const meja = useMeja();
  const { layar, view } = meja;

  useEffect(() => { document.body.classList.toggle('main', layar === 'game'); }, [layar]);

  return (
    <>
      {layar === 'game' && <h2 className="judul">🀄 Meja Mahjong</h2>}
      <Modal modal={meja.modal} onTutup={meja.tutupModal} />
      {/* Layar awal tetap terpasang supaya isian form tidak hilang saat kembali */}
      <Home aktif={layar === 'home'} meja={meja} />
      {layar === 'lobby' && view && <Lobby s={view} meja={meja} />}
      {layar === 'game' && view && view.status === 'playing' && <Game s={view} meja={meja} />}
    </>
  );
}
