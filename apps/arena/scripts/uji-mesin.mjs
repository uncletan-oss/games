// Simulasi permainan antar-BOT untuk menguji semua mesin game: node scripts/uji-mesin.mjs
import ludo from '../src/games/ludo/mesin.js';
import ular from '../src/games/ulartangga/mesin.js';
import remi from '../src/games/remi/mesin.js';
import cangkul from '../src/games/cangkul/mesin.js';
import capsa from '../src/games/capsa/mesin.js';
import ceki from '../src/games/ceki/mesin.js';
import gaple from '../src/games/gaple/mesin.js';
import uno from '../src/games/uno/mesin.js';
import catur from '../src/games/catur/mesin.js';
import halma from '../src/games/halma/mesin.js';
import congklak from '../src/games/congklak/mesin.js';

// Jumlah pemain yang didukung tiap game (sama dengan games/index.js)
const JUMLAH = { catur: [2, 2], congklak: [2, 2] };
const PUTARAN = { catur: 12, halma: 60 };   // game yang lambat disimulasikan lebih sedikit

const LEVEL = ['easy', 'medium', 'hard'];
let gagal = 0;
const DAFTAR = { ludo, ulartangga: ular, remi, cangkul, capsa, ceki, gaple, uno, catur, halma, congklak };
const pilih = process.argv[2] ? process.argv[2].split(',') : Object.keys(DAFTAR);
for (const id of pilih) {
  const g = DAFTAR[id];
  g.id = g.id || id;
  const menang = {}, langkah = [];
  let seri = 0;
  const t0 = Date.now();
  const [min, maks] = JUMLAH[id] || [2, 4];
  for (let r = 0; r < (PUTARAN[id] || 200); r++) {
    const n = min + (r % (maks - min + 1));
    const lv = Array.from({ length: n }, (_, i) => LEVEL[(i + r) % 3]);
    const s = g.mulai(n, {}, { ronde: r + 1, pemenangLalu: r % 2 ? r % n : null });
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
