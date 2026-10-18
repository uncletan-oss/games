import { useEffect, useState } from 'react';

/** Ganti "@<kursi>" di teks log/hasil dengan nama pemain. */
export function fmt(view, teks) {
  if (!teks) return '';
  return String(teks).replace(/@(\d+)/g, (_, i) => (view.seats[i] && view.seats[i].name) || 'Pemain ' + (Number(i) + 1));
}

export const kapital = s => s[0].toUpperCase() + s.slice(1);

export function Modal({ modal, onTutup }) {
  if (!modal) return null;
  const klikUtama = () => { const f = modal.utama && modal.utama.onClick; onTutup(); if (f) f(); };
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onTutup(); }}>
      <div className={'modal-card' + (modal.lebar ? ' lebar' : '')} role="dialog" aria-modal="true" aria-labelledby="modal-judul">
        <h3 id="modal-judul">{modal.judul}</h3>
        <div className="modal-isi">{modal.isi || modal.teks}</div>
        <div className="modal-aksi">
          <button className="btn btn-teks" onClick={onTutup}>{modal.utama ? 'Batal' : 'Tutup'}</button>
          {modal.utama && <button className="btn btn-utama" onClick={klikUtama}>{modal.utama.label}</button>}
        </div>
      </div>
    </div>
  );
}

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

/** Angka hitung mundur yang memperbarui dirinya sendiri. */
export function Hitung({ deadline, kelas }) {
  const [, setDetak] = useState(0);
  useEffect(() => { const id = setInterval(() => setDetak(x => x + 1), 500); return () => clearInterval(id); }, []);
  const sisa = Math.max(0, Math.ceil((deadline() - Date.now()) / 1000));
  return <span className={'hitung' + (sisa <= 10 ? ' mendesak' : '') + (kelas ? ' ' + kelas : '')}>⏱ {sisa}s</span>;
}

/** Label pemain: nama, lencana, sorotan giliran, dan isi tambahan (mis. jumlah kartu). */
export function ChipPemain({ view, kursi, ruang, warna, children, kelas }) {
  const seat = view.seats[kursi];
  const giliran = view.giliran === kursi && !view.hasil;
  return (
    <div className={'chip' + (giliran ? ' giliran' : '') + (kursi === view.me ? ' saya' : '') + (kelas ? ' ' + kelas : '')}
         style={warna ? { '--warna-pemain': warna } : undefined}>
      <div className="chip-nama">
        {warna && <span className="titik-warna" />}
        <span className="nm">{seat.name}</span>
        {seat.bot && <span className="lencana bot">{kapital(seat.bot)}</span>}
        {kursi === view.me && <span className="lencana anda">Anda</span>}
        {kursi === view.host && <span className="lencana host">Host</span>}
        {view.skor[kursi] > 0 && <span className="lencana skor">🏆{view.skor[kursi]}</span>}
        {giliran && !seat.bot && view.sisaGiliranMs != null && ruang && <Hitung deadline={ruang.deadlineGiliran} />}
      </div>
      {children}
    </div>
  );
}

/** Urutan kursi lawan mulai dari pemain sesudah saya. */
export const urutanLawan = view => Array.from({ length: view.seats.length - 1 }, (_, k) => (view.me + 1 + k) % view.seats.length);
