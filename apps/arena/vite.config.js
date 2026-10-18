import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { META, ID_GAME } from './src/games/meta.js';

/**
 * Membuat halaman sendiri per game: /<id>/index.html (mis. /games/ludo/) dari index.html hasil build,
 * dengan judul, manifest, dan ikon PWA milik game itu (file PWA-nya ada di public/<id>/).
 */
function halamanPerGame() {
  return {
    name: 'halaman-per-game',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = String(bundle['index.html'].source);
      for (const id of ID_GAME) {
        const m = META[id];
        const halaman = html
          .replaceAll('./assets-arena/', '../assets-arena/')
          .replaceAll('./arena-ikon/', './ikon/')
          .replace(/<title>[^<]*<\/title>/, `<title>${m.nama} — Arena Games</title>`)
          .replace(/(<meta name="description" content=")[^"]*/, `$1${m.ringkas}`)
          .replace(/(<meta name="theme-color" content=")[^"]*/, `$1#0F2A25`)
          .replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*/, `$1${m.nama}`)
          .replace('<script type="module"', `<script>window.__GAME__ = '${id}';</script>\n  <script type="module"`);
        this.emitFile({ type: 'asset', fileName: `${id}/index.html`, source: halaman });
      }
    }
  };
}

// Hasil build ditulis ke akar repo (https://<user>.github.io/<repo>/) yang disajikan GitHub Pages.
// Folder lain di akar (apps/, mahjong/) tidak dihapus; file aset lama dibersihkan scripts/bersihkan.mjs.
export default defineConfig({
  base: './',
  plugins: [react(), halamanPerGame()],
  build: {
    outDir: '../..',
    emptyOutDir: false,
    assetsDir: 'assets-arena',
    target: 'es2019'
  }
});
