export default function Modal({ modal, onTutup }) {
  if (!modal) return null;
  const klikUtama = () => { const f = modal.utama && modal.utama.onClick; onTutup(); if (f) f(); };
  return (
    <div className="modal-overlay">
      <div className={'modal-card' + (modal.isi ? ' wide' : '')} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 id="modal-title">{modal.judul}</h3>
        <div className="modal-content-text">{modal.isi || modal.teks}</div>
        <div className="modal-actions">
          <button className="btn btn-teks" onClick={onTutup}>Tutup</button>
          {modal.utama && <button className="btn btn-utama" onClick={klikUtama}>{modal.utama.label}</button>}
        </div>
      </div>
    </div>
  );
}
