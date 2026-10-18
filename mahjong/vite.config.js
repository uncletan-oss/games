import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relatif supaya bisa dibuka di sub-folder GitHub Pages (/games/mahjong/)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2019' }
});
