/**
 * Hanya untuk pengembangan lokal (`npm run dev`): menjalankan gas/Code.gs langsung di browser
 * dengan tiruan PropertiesService, CacheService, LockService, dan Utilities.
 * Data kamar disimpan di localStorage, jadi beberapa tab browser bisa bermain di meja yang sama.
 * File ini tidak ikut ke hasil build.
 */
import kodeServer from '../../gas/Code.gs?raw';

const AWALAN = 'gasmock:';
const props = {
  getProperty: k => localStorage.getItem(AWALAN + k),
  setProperty: (k, v) => localStorage.setItem(AWALAN + k, v),
  deleteProperty: k => localStorage.removeItem(AWALAN + k),
  getProperties: () => {
    const hasil = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(AWALAN)) hasil[k.slice(AWALAN.length)] = localStorage.getItem(k);
    }
    return hasil;
  }
};
const cache = { get: () => null, put: () => {}, remove: () => {} };   // selalu baca dari "Properties"

const lingkungan = {
  PropertiesService: { getScriptProperties: () => props },
  CacheService: { getScriptCache: () => cache },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
  Utilities: { getUuid: () => crypto.randomUUID() },
  HtmlService: {}
};

const API = ['buatKamar', 'gabungKamar', 'keluarKamar', 'daftarKamar', 'aturKursi', 'aturHint', 'mulaiPermainan',
  'mainLagi', 'getStatusMeja', 'ambilUbin', 'buangUbin', 'klaimUbin', 'tickKlaim', 'deklarasiKong', 'jalankanBot', 'mintaHint'];

const server = new Function(...Object.keys(lingkungan), kodeServer + '\nreturn {' + API.join(',') + '};')(...Object.values(lingkungan));

function runner(sukses, gagal) {
  return new Proxy({}, {
    get(_, nama) {
      if (nama === 'withSuccessHandler') return f => runner(f, gagal);
      if (nama === 'withFailureHandler') return f => runner(sukses, f);
      return (...args) => {
        // Seperti Apps Script: asinkron, argumen & hasil diserialisasi JSON
        const salin = JSON.parse(JSON.stringify(args));
        setTimeout(() => {
          let hasil;
          try { hasil = server[nama](...salin); }
          catch (e) { if (gagal) gagal(new Error(e.message)); return; }
          if (sukses) sukses(hasil === undefined ? null : JSON.parse(JSON.stringify(hasil)));
        }, 80 + Math.random() * 120);
      };
    }
  });
}

window.google = { script: { get run() { return runner(null, null); } } };
