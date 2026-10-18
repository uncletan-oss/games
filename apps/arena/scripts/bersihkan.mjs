// Menghapus aset build lama di akar repo sebelum build baru (karena emptyOutDir dimatikan).
import { rmSync } from 'node:fs';
rmSync(new URL('../../../assets-arena', import.meta.url), { recursive: true, force: true });
