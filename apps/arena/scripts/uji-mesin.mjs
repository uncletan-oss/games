// Simulasi permainan antar-BOT untuk menguji semua mesin game: node scripts/uji-mesin.mjs
import ludo from '../src/games/ludo/mesin.js';
import ular from '../src/games/ulartangga/mesin.js';
import remi from '../src/games/remi/mesin.js';
import cangkul from '../src/games/cangkul/mesin.js';
import capsa from '../src/games/capsa/mesin.js';
import ceki from '../src/games/ceki/mesin.js';
import gaple from '../src/games/gaple/mesin.js';

const LEVEL = ['easy', 'medium', 'hard'];
let gagal = 0;
for (const g of [ludo, ular, remi, cangkul, capsa, ceki, gaple]) {
  const menang = {}, langkah = [];
  let seri = 0;
  const t0 = Date.now();
  for (let r = 0; r < 200; r++) {
    const n = 2 + (r % 3);
    const lv = Array.from({ length: n }, (_, i) => LEVEL[(i + r) % 3]);
    const s = g.mulai(n, {}, { pemenangLalu: r % 2 ? r % n : null });
    let k = 0;
    try {
      while (!g.hasil(s)) {
        const p = g.giliran(s);
        const a = g.bot(JSON.parse(JSON.stringify(s)), p, lv[p]);
        g.aksi(s, p, a);
        JSON.stringify(g.pandangan(s, 0));
        if (++k > 20000) throw new Error('tidak selesai');
      }
    } catch (e) { gagal++; console.log(g.id, 'ronde', r, 'ERROR', e.message); continue; }
    const h = g.hasil(s);
    if (!h.pemenang.length) seri++;
    h.pemenang.forEach(p => { const l = lv[p]; menang[l] = (menang[l] || 0) + 1; });
    langkah.push(k);
  }
  const rata = Math.round(langkah.reduce((a, b) => a + b, 0) / langkah.length);
  console.log(`${g.id.padEnd(10)} ok, rata-rata ${rata} aksi/ronde, seri ${seri}, menang per level`, menang, `${Date.now() - t0} ms`);
}
process.exit(gagal ? 1 : 0);
