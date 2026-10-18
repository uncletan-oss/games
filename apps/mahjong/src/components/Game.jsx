import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Tile from './Tile.jsx';
import PanelMenang from './PanelMenang.jsx';
import Sidebar from './Sidebar.jsx';
import { POSISI, NAMA_AKSI, bisaBuang, kapital } from '../konstanta.js';

/** Angka hitung mundur yang diperbarui sendiri tiap 250 ms (tanpa me-render seluruh meja). */
function Hitung({ deadline, format, kelas }) {
  const [, setDetak] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDetak(x => x + 1), 250);
    return () => clearInterval(id);
  }, []);
  const sisa = Math.max(0, Math.ceil((deadline() - Date.now()) / 1000));
  return <span className={kelas ? kelas(sisa) : undefined}>{format(sisa)}</span>;
}

function Badge({ kelas, children }) { return <span className={'badge ' + kelas}>{children}</span>; }

function Melds({ melds }) {
  return (
    <div className="melds">
      {(melds || []).map((m, i) => (
        <div key={i} className="meld" title={m.concealed ? 'Kong tertutup' : (m.type.toUpperCase() + (m.added ? ' (tambahan)' : ''))}>
          {m.tiles.map((t, k) => {
            const tutup = m.concealed && (k === 0 || k === m.tiles.length - 1);
            return <Tile key={k} sym={tutup ? '' : t} className={'small' + (tutup ? ' hidden' : '')} />;
          })}
        </div>
      ))}
    </div>
  );
}

function BarisUbin({ list }) {
  return (
    <div className="row">
      {list.map(x => <span key={x.tile} style={{ display: 'contents' }}>
        <Tile sym={x.tile} className="small" /><span className="sisa">{'×' + x.sisa + ' '}</span>
      </span>)}
    </div>
  );
}

function teksLangkah(sh) {
  if (sh < 0) return 'Tangan Anda sudah lengkap.';
  if (sh === 0) return 'Siap menang (tenpai): tinggal 1 ubin lagi.';
  return `Butuh ${sh} langkah lagi sebelum siap menang.`;
}

/** Kartu saran (hint) untuk giliran membuang atau kondisi tangan. */
function HintPop({ d, onPilih, onTutup, popRef }) {
  let isi;
  if (d.jenis === 'buang') {
    const x = d.saran[0];
    isi = <>
      <div className="row judul">
        <span>Saran: buang </span>
        <Tile sym={x.buang} className="small klik" onClick={() => onPilih(x.buang)} />
      </div>
      <div>{teksLangkah(x.shanten) + (x.ubin.length ? (x.shanten === 0 ? ' Ubin yang ditunggu:' : ` Ubin yang membantu (${x.total} tersisa):`) : '')}</div>
      {x.ubin.length > 0 && <BarisUbin list={x.ubin.slice(0, 8)} />}
      {d.saran.length > 1 && (
        <div className="alt">
          <span className="muted2">Sama bagusnya:</span>
          {d.saran.slice(1).map(y => <Tile key={y.buang} sym={y.buang} className="small" onClick={() => onPilih(y.buang)} />)}
        </div>
      )}
      <div className="muted2">Ketuk ubin saran untuk memilihnya, lalu tekan Buang.</div>
    </>;
  } else if (d.jenis === 'tangan') {
    isi = <>
      <div className="judul">{d.giliran ? 'Ambil ubin dulu' : 'Kondisi tangan Anda'}</div>
      <div>{teksLangkah(d.shanten)}</div>
      {d.ubin.length > 0 && <>
        <div className="muted2">{d.shanten === 0 ? 'Ubin yang Anda tunggu:' : 'Ubin yang akan membantu:'}</div>
        <BarisUbin list={d.ubin.slice(0, 10)} />
      </>}
      {d.shanten === 0 && d.total === 0 && <div className="muted2">Semua ubin tunggu sudah terlihat. Pertimbangkan mengubah tangan.</div>}
    </>;
  } else {
    isi = <div>Tidak ada saran saat ini.</div>;
  }
  return (
    <div className="hint-pop" role="status" ref={popRef}>
      <button type="button" className="hp-tutup" onClick={onTutup} aria-label="Tutup saran">✕</button>
      <div>{isi}</div>
    </div>
  );
}

/** Klaim buangan lawan: muncul di tengah meja. */
function PanelKlaim({ s, meja }) {
  const k = s.klaim;
  const bisaPilih = k.opsi && !k.sudahJawab;
  const hk = meja.hint && meja.hint.data.jenis === 'klaim' ? meja.hint.data : null;
  const tombol = [];
  const tambah = (label, kelas, aksi, tiles, pilih) => {
    const saran = hk && hk.saran.aksi === aksi && (aksi !== 'chow' || hk.saran.pilih === pilih);
    tombol.push(
      <button key={aksi + (pilih || 0)} className={kelas + (saran ? ' disarankan' : '')} disabled={meja.pending > 0}
              onClick={() => meja.aksiKlaim(aksi, pilih)}>
        {label}
        {(tiles || []).map((t, i) => <Tile key={i} sym={t} className="small" />)}
      </button>
    );
  };

  let catatan;
  if (bisaPilih) {
    if (k.opsi.ron) tambah('🏆 Ron, menang!', 'btn-ron', 'ron');
    if (k.opsi.kong) tambah('Kong', 'btn-kong', 'kong', Array(4).fill(k.tile));
    if (k.opsi.pong) tambah('Pong', 'btn-pong', 'pong', Array(3).fill(k.tile));
    (k.opsi.chow || []).forEach((combo, i) => {
      const seri = combo.concat([k.tile]).sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
      tambah('Chow', 'btn-chow', 'chow', seri, i);
    });
    tambah('Lewati', 'btn-pass', 'pass');
    const tips = [];
    if (k.opsi.ron) tips.push('🏆 Buangan ini melengkapi tangan Anda — pilih RON untuk menang sekarang!');
    if (k.opsi.kong || k.opsi.pong) tips.push('Pong/Kong membuat set terbuka & giliran pindah ke Anda (lewati pemain di antaranya).');
    if (k.opsi.chow) tips.push('Chow hanya bisa diambil dari pemain sebelum Anda; kalah prioritas dari Pong/Kong.');
    tips.push('Set terbuka tidak bisa diubah lagi dan menutup opsi 7 pasang.');
    catatan = tips.join(' ');
  } else if (k.opsi) {
    catatan = '✔️ Pilihan Anda terkirim. Menunggu pemain lain...';
  } else {
    catatan = 'Menunggu pemain lain memutuskan klaim...';
  }

  return (
    <div className={'claim-panel' + (bisaPilih ? ' attention' : '')} role="dialog" aria-live="polite">
      <div className="claim-head">
        <div><Tile sym={k.tile} className="big" /></div>
        <div>Dibuang oleh {s.players[k.from].name}</div>
        <div className="claim-timer"><Hitung deadline={meja.deadline.klaim} format={x => x + 's'} /></div>
      </div>
      <div className="claim-actions">{tombol}</div>
      {hk && (
        <div className="claim-saran">
          <div><b>{'💡 Saran: ' + NAMA_AKSI[hk.saran.aksi] + '. '}</b>{hk.alasan}</div>
        </div>
      )}
      <div className="claim-note">{catatan}</div>
    </div>
  );
}

function LogMeja({ s }) {
  if (s.gameOver && s.menang) {
    return (
      <div className="status-log log-win">
        <div>{s.log.split('\n\nSusunan:')[0]}</div>
        <PanelMenang s={s} lengkap={false} />
      </div>
    );
  }
  return (
    <div className={'status-log' + (s.gameOver ? ' log-win' : '')}>
      {s.log + (!s.gameOver ? `\n(Ronde ${s.ronde} · Sisa Tumpukan: ${s.deckCount})` : '')}
    </div>
  );
}

/** Layar 3: meja permainan. */
export default function Game({ s, meja }) {
  const { hand, selected, pending, hint } = meja;
  const [infoBuka, setInfoBuka] = useState(false);
  const refMeja = useRef(), refKursi = useRef(), refBar = useRef(), refPop = useRef();
  const me = s.me;

  const boleh = bisaBuang(s);
  const giliranku = s.turn === me && !s.gameOver && !s.klaim;
  const hd = hint && hint.data;
  const saranBuang = boleh && hd && hd.jenis === 'buang' && hd.saran.length ? hd.saran[0].buang : null;
  const idxBaru = boleh && s.ubinBaru ? hand.lastIndexOf(s.ubinBaru) : -1;
  const bisaKlaim = s.klaim && s.klaim.opsi && !s.klaim.sudahJawab;
  const tampilHint = s.hintAktif && !s.gameOver && (bisaKlaim || giliranku || !s.klaim);

  // Posisikan bar aksi tepat di atas tangan Anda, dan kartu hint di atas bar aksi
  useLayoutEffect(() => {
    if (!refKursi.current || !refMeja.current || !refBar.current) return;
    const bawah = refKursi.current.offsetHeight + refMeja.current.clientWidth * 0.022;
    refBar.current.style.bottom = bawah + 'px';
    if (refPop.current) refPop.current.style.bottom = (bawah + refBar.current.offsetHeight + 10) + 'px';
  });

  return (
    <div className="game-wrapper">
      <div className="table-container" ref={refMeja}>
        {s.players.map((p, i) => {
          const kelas = ['player-seat', POSISI[(i - me + 4) % 4], s.turn === i && 'active-turn', i === me && 'me'].filter(Boolean).join(' ');
          const timer = s.turn === i && !s.bots[i] && !s.klaim && !s.gameOver && s.sisaGiliranMs != null;
          return (
            <div key={i} className={kelas} ref={i === me ? refKursi : undefined}>
              <div>
                {p.name}
                {s.bots[i] && <Badge kelas="bot">{kapital(s.bots[i])}</Badge>}
                {i === s.host && <Badge kelas="host">Host</Badge>}
                {i === me && <Badge kelas="anda">Anda</Badge>}
                {i === s.dealer && <Badge kelas="dealer">🎲</Badge>}
                {s.skor && s.skor[i] > 0 && <Badge kelas="skor">{'🏆' + s.skor[i]}</Badge>}
                {timer && <Hitung deadline={meja.deadline.giliran} format={x => ' ⏱ ' + x + 's'}
                                  kelas={x => 'seat-timer' + (x <= 10 ? ' urgent' : '')} />}
              </div>
              <Melds melds={p.melds} />
              <div className="hand">
                {i === me && !s.gameOver
                  ? hand.map((sym, idx) => {
                      const kls = [idx === selected && 'selected', idx === idxBaru && 'drawn',
                        saranBuang === sym && idx === hand.lastIndexOf(sym) && 'suggest'].filter(Boolean).join(' ');
                      return <Tile key={idx} sym={sym} className={kls} onClick={e => { e.stopPropagation(); meja.klikUbin(idx); }} />;
                    })
                  : s.gameOver
                    ? p.hand.map((sym, k) => <Tile key={k} sym={sym} className={i === me ? '' : 'small'} />)
                    : Array.from({ length: p.handCount }, (_, k) => <Tile key={k} sym="" className="small hidden" />)}
              </div>
            </div>
          );
        })}

        <div className="table-center">
          <div className="discard-pile">
            {s.discards.map((d, k) => (
              <Tile key={k} sym={d.tile} className={'disc' + (k === s.discards.length - 1 ? ' last' : '')}
                    title={s.players[d.p] ? 'Dibuang ' + s.players[d.p].name : ''} />
            ))}
          </div>
        </div>

        {/* Tombol kecil di meja (HP): info & keluar */}
        <div className="table-tools">
          <span className="tt-info">{`${s.roomCode} · ronde ${s.ronde} · sisa ${s.deckCount}`}</span>
          <button type="button" onClick={() => setInfoBuka(true)} aria-label="Log & cara main">☰ Info</button>
          <button type="button" className="tt-keluar" onClick={meja.keluarPermainan} aria-label="Keluar dari meja">Keluar</button>
        </div>

        {meja.putus && <div className="banner-putus" role="status">Koneksi ke host terputus, menyambung ulang...</div>}

        {s.klaim && !s.gameOver && <PanelKlaim s={s} meja={meja} />}

        {hd && hd.jenis !== 'klaim' && (
          <HintPop d={hd} popRef={refPop} onPilih={meja.pilihUbin} onTutup={meja.tutupHint} />
        )}

        {/* Aksi pemain: tepat di atas tangan Anda */}
        <div className="action-bar" ref={refBar}>
          {giliranku && !s.hasDrawn && <button type="button" className="ab-utama" disabled={pending > 0} onClick={meja.aksiAmbil}>Ambil ubin</button>}
          {giliranku && s.hasDrawn && (s.kongSendiri || []).map(tile => (
            <button key={tile} type="button" className="ab-kong" disabled={pending > 0} onClick={() => meja.aksiKong(tile)}>{'Kong ' + tile}</button>
          ))}
          {giliranku && s.hasDrawn && (
            <button type="button" className="ab-buang" disabled={selected === -1 || pending > 0} onClick={meja.buangTerpilih}>
              {selected === -1 ? 'Pilih ubin dulu' : 'Buang ' + hand[selected]}
            </button>
          )}
          {tampilHint && (
            <button type="button" className="ab-hint" disabled={pending > 0 || meja.hintMemuat} onClick={meja.mintaHint}>
              {meja.hintMemuat ? 'Menghitung...' : bisaKlaim ? '💡 Saran klaim' : (giliranku && s.hasDrawn ? '💡 Saran buang' : '💡 Hint')}
            </button>
          )}
        </div>
      </div>

      <Sidebar s={s} buka={infoBuka} onTutup={() => setInfoBuka(false)} onKeluar={meja.keluarPermainan}>
        <LogMeja s={s} />
      </Sidebar>
    </div>
  );
}
