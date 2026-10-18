export { panggil, lepasMeja } from './jaringan.js';

export function pesanError(err) {
  return (err && err.message) ? err.message : String(err);
}
