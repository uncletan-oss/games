import { KATEGORI, GAMES } from '../games/index.js';

/** Halaman utama: daftar kategori dan game. */
export default function Hub() {
  return (
    <div className="layar-gulir">
      <div className="hub">
        <header className="hub-kepala">
          <img src="./arena-ikon/icon-192.png" alt="" width="56" height="56" />
          <div>
            <h1>Arena Games</h1>
            <p>Main bareng teman lewat kode meja, atau lawan BOT. Gratis, langsung di browser.</p>
          </div>
        </header>
        {KATEGORI.map(kat => (
          <section key={kat.id} className="kategori">
            <h2><span aria-hidden="true">{kat.ikon}</span> {kat.nama}<small>{kat.sub}</small></h2>
            <div className="kartu-game-grid">
              {kat.games.map(id => {
                const g = GAMES[id];
                return (
                  <a key={id} className={'kartu-game g-' + id} href={g.eksternal || '#/' + id}>
                    <span className="ikon-game" aria-hidden="true">{g.ikon}</span>
                    <span className="nama-game">{g.nama}</span>
                    <span className="ringkas">{g.ringkas}</span>
                    <span className="pemain">{g.min === g.maks ? g.min : `${g.min}–${g.maks}`} pemain · BOT</span>
                  </a>
                );
              })}
            </div>
          </section>
        ))}
        <p className="kaki">Semua permainan tanpa taruhan, hanya untuk hiburan. Bisa dipasang di layar utama HP.</p>
      </div>
    </div>
  );
}
