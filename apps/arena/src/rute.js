/**
 * Rute:
 *  - Halaman game sendiri (/games/ludo/): window.__GAME__ diisi saat build; hash "#/KODE" = undangan meja.
 *  - Halaman utama (/games/): daftar game. Tautan lama "#/ludo/KODE" dialihkan ke /games/ludo/#/KODE.
 *  - Saat pengembangan (npm run dev) semua game dibuka lewat hash: #/ludo, #/ludo/KODE.
 */
import { GAMES } from './games/index.js';

const GAME_TETAP = window.__GAME__;

export function bacaRute() {
  if (GAME_TETAP) return { id: GAME_TETAP, kode: decodeURIComponent(location.hash.replace(/^#\/?/, '')) };
  const [, id, kode] = location.hash.replace(/^#/, '').split('/');
  if (!GAMES[id] || !GAMES[id].mesin) return { id: null };
  if (!import.meta.env.DEV) {
    location.replace(`./${id}/` + (kode ? '#/' + kode : ''));
    return { id: null };
  }
  return { id, kode: kode ? decodeURIComponent(kode) : '' };
}

export const tautanGame = id => (import.meta.env.DEV ? '#/' + id : `./${id}/`);
export const tautanSemuaGame = () => (import.meta.env.DEV || !GAME_TETAP ? '#/' : '../');
export const tautanUndangan = (id, kode) => `${location.origin}${location.pathname}#/${GAME_TETAP ? '' : id + '/'}${encodeURIComponent(kode)}`;

