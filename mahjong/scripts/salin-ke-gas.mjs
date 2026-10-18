// Menyalin hasil build (dist/index.html) menjadi gas/Index.html yang dipanggil doGet().
import { copyFileSync, statSync } from 'node:fs';

const sumber = new URL('../dist/index.html', import.meta.url);
const tujuan = new URL('../gas/Index.html', import.meta.url);
copyFileSync(sumber, tujuan);
console.log(`gas/Index.html diperbarui (${(statSync(tujuan).size / 1024).toFixed(1)} KB)`);
