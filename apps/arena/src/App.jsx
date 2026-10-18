import { useEffect, useState } from 'react';
import Hub from './hub/Hub.jsx';
import GameShell from './platform/GameShell.jsx';
import { GAMES } from './games/index.js';
import { bacaRute } from './rute.js';

export default function App() {
  const [rute, setRute] = useState(bacaRute);
  useEffect(() => {
    const ubah = () => setRute(bacaRute());
    window.addEventListener('hashchange', ubah);
    return () => window.removeEventListener('hashchange', ubah);
  }, []);
  useEffect(() => {
    document.title = rute.id ? `${GAMES[rute.id].nama} — Arena Games` : 'Arena Games — Ludo, Remi, Gaple & lainnya';
  }, [rute.id]);
  if (!rute.id) return <Hub />;
  return <GameShell key={rute.id} id={rute.id} kodeUndangan={rute.kode} />;
}
