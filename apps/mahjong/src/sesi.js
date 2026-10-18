/* Penyimpanan sesi (rejoin) di localStorage */
const SESI_KEY = 'mahjong_sesi_v2';

export function simpanSesi(obj) { try { localStorage.setItem(SESI_KEY, JSON.stringify(obj)); } catch (e) {} }
export function bacaSesi() { try { return JSON.parse(localStorage.getItem(SESI_KEY) || 'null'); } catch (e) { return null; } }
export function hapusSesi() {
  try {
    const s = bacaSesi();
    localStorage.removeItem(SESI_KEY);
    if (s && s.nama) simpanSesi({ nama: s.nama });
  } catch (e) {}
}
