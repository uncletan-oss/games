import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Hasil build ditulis ke folder /mahjong di akar repo, yang langsung disajikan GitHub Pages
// (https://<user>.github.io/<repo>/mahjong/). base relatif supaya jalan di sub-folder.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../../mahjong',
    emptyOutDir: true,
    target: 'es2019'
  }
});
