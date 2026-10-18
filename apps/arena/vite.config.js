import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Hasil build ditulis ke akar repo (https://<user>.github.io/<repo>/) yang disajikan GitHub Pages.
// Folder lain di akar (apps/, mahjong/) tidak dihapus; file aset lama dibersihkan scripts/bersihkan.mjs.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../..',
    emptyOutDir: false,
    assetsDir: 'assets-arena',
    target: 'es2019'
  }
});
