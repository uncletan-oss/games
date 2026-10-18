/** Membungkus google.script.run menjadi Promise: panggil('namaFungsi', arg1, arg2, ...). */
export function panggil(fn, ...args) {
  return new Promise((resolve, reject) => {
    window.google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)[fn](...args);
  });
}

export function pesanError(err) {
  return (err && err.message) ? err.message : String(err);
}
