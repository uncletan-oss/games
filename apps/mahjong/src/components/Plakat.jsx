import { ANGIN, ANGIN_HURUF, AREA } from '../konstanta.js';

/** Plakat kursi (dipakai di layar Buat meja & Ruang tunggu). */
export function Plakat({ kursi, rel, nama, tags = [], anda, kosong, children }) {
  const kelas = ['plakat', AREA[rel], anda && 'anda', kosong && 'kosong'].filter(Boolean).join(' ');
  return (
    <div className={kelas}>
      <div className="plakat-head">
        <div className={'angin' + (kursi === 0 ? ' timur' : '')} aria-hidden="true">{ANGIN_HURUF[kursi]}</div>
        <div className="plakat-id">
          <div className="nm">{nama}{tags.map(([t, k]) => <span key={k} className={'tag ' + k}>{t}</span>)}</div>
          <div className="kursi">Kursi {ANGIN[kursi]}</div>
        </div>
      </div>
      {children && <div className="plakat-body">{children}</div>}
    </div>
  );
}

/** Tombol segmen: pilihan = [[nilai, label], ...] */
export function Seg({ pilihan, aktif, onPilih, kelas, disabled }) {
  return (
    <div className={'seg' + (kelas ? ' ' + kelas : '')} role="group">
      {pilihan.map(([v, t]) => (
        <button key={v} type="button" className={v === aktif ? 'on' : ''} aria-pressed={v === aktif}
                disabled={disabled} onClick={() => { if (v !== aktif) onPilih(v); }}>{t}</button>
      ))}
    </div>
  );
}
