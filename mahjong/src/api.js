/** URL Web App Apps Script, diisi saat build untuk GitHub Pages (VITE_GAS_URL). */
export const GAS_URL = import.meta.env.VITE_GAS_URL || '';

/**
 * Mode lokal: tanpa Apps Script dan tanpa URL server, Code.gs dijalankan langsung di browser
 * (npm run dev, atau build GitHub Pages yang belum diberi VITE_GAS_URL).
 */
export const MODE_LOKAL = (import.meta.env.DEV || import.meta.env.VITE_TARGET === 'pages')
  && !GAS_URL && !(window.google && window.google.script);

/**
 * Memanggil fungsi server dan mengembalikan Promise: panggil('namaFungsi', arg1, arg2, ...).
 * - Di dalam Apps Script (atau mode lokal): lewat google.script.run.
 * - Di GitHub Pages: lewat fetch ke doPost Web App.
 */
export function panggil(fn, ...args) {
  if (window.google && window.google.script) {
    return new Promise((resolve, reject) => {
      window.google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)[fn](...args);
    });
  }
  if (!GAS_URL) return Promise.reject(new Error('Server belum dikonfigurasi (VITE_GAS_URL kosong).'));
  // text/plain supaya browser tidak mengirim preflight CORS (Apps Script tidak menjawab OPTIONS)
  return fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, args }),
    redirect: 'follow'
  })
    .then(res => {
      if (!res.ok) throw new Error('Server tidak bisa dihubungi (HTTP ' + res.status + '), coba lagi.');
      return res.json();
    }, () => { throw new Error('Koneksi ke server gagal, periksa internet Anda lalu coba lagi.'); })
    .then(r => {
      if (!r.ok) throw new Error(r.error);
      return r.data;
    });
}

export function pesanError(err) {
  return (err && err.message) ? err.message : String(err);
}
