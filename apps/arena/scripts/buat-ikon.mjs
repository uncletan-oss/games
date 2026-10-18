// Membuat ikon PWA Arena (PNG) dari scripts/logo.svg memakai Chromium (Playwright).
// Jalankan sekali bila logo berubah: node scripts/buat-ikon.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const svg = readFileSync(new URL('./logo.svg', import.meta.url), 'utf8');
const keluar = p => new URL('../public/' + p, import.meta.url);
// any: latar membulat; maskable: latar penuh, ubin diperkecil agar aman dipotong lingkaran
const varian = {
  any: svg.replace('<rect id="latar"', '<rect id="latar" rx="112"'),
  maskable: svg.replace('<g id="isi">', '<g id="isi" transform="translate(256 256) scale(0.86) translate(-256 -256)">')
};
const daftar = [
  ['arena-ikon/icon-192.png', 192, 'any'], ['arena-ikon/icon-512.png', 512, 'any'],
  ['arena-ikon/maskable-512.png', 512, 'maskable'], ['arena-ikon/apple-touch-icon.png', 180, 'maskable'],
  ['arena-ikon/favicon-32.png', 32, 'any']
];

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
for (const [file, ukuran, jenis] of daftar) {
  await page.setViewportSize({ width: ukuran, height: ukuran });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${ukuran}px;height:${ukuran}px}</style>${varian[jenis]}`);
  writeFileSync(keluar(file), await page.screenshot({ omitBackground: true }));
  console.log(file);
}
writeFileSync(keluar('arena-ikon/favicon.svg'), varian.any);
await browser.close();
