import { useState } from 'react';

const MiniTile = ({ warna, children }) => <div className={'mini-tile ' + warna}>{children}</div>;

function TabMenang() {
  return (
    <div className="contoh-menang">
      <div className="ket">Contoh Susunan Sah (4 Set + 1 Pasang Kepala):</div>
      <div className="meld-group" title="Seri (Chow)"><MiniTile warna="t-green">🀐</MiniTile><MiniTile warna="t-green">🀑</MiniTile><MiniTile warna="t-green">🀒</MiniTile></div>
      <div className="meld-group" title="Trio (Pong)"><MiniTile warna="t-red">🀄</MiniTile><MiniTile warna="t-red">🀄</MiniTile><MiniTile warna="t-red">🀄</MiniTile></div>
      <div className="meld-group" title="Seri (Chow)"><MiniTile warna="t-blue">🀙</MiniTile><MiniTile warna="t-blue">🀚</MiniTile><MiniTile warna="t-blue">🀛</MiniTile></div>
      <div className="meld-group" title="Kong (4 sama) — dihitung 1 set"><MiniTile warna="t-red">🀇</MiniTile><MiniTile warna="t-red">🀇</MiniTile><MiniTile warna="t-red">🀇</MiniTile><MiniTile warna="t-red">🀇</MiniTile></div>
      <div className="meld-group" style={{ border: '1px solid #f1c40f' }} title="Kepala (Pair)"><MiniTile warna="t-dark">🀀</MiniTile><MiniTile warna="t-dark">🀀</MiniTile></div>
      <div className="ket2">Alternatif: <b>7 pasang berbeda</b> (hanya jika belum punya set terbuka).</div>
    </div>
  );
}

function TabKlaim() {
  return (
    <ul className="rules">
      <li><b>RON</b> 🏆 — buangan lawan melengkapi tangan Anda → langsung menang. Bisa dari siapa saja.</li>
      <li><b>KONG</b> — punya 3 ubin sama + buangan = 4. Set terbuka, lalu ambil 1 ubin pengganti dan buang.</li>
      <li><b>PONG</b> — punya 2 ubin sama + buangan = trio terbuka. Bisa dari siapa saja.</li>
      <li><b>CHOW</b> — buangan melengkapi seri (mis. 🀇🀈 + 🀉). <i>Hanya</i> dari pemain tepat sebelum Anda.</li>
      <li><b>Prioritas:</b> Ron &gt; Kong/Pong &gt; Chow. Ron ganda → pemain terdekat setelah pembuang.</li>
      <li>Anda punya <b>10 detik</b> untuk memutuskan. Tidak memilih = <b>Lewati</b>.</li>
      <li>Setelah Pong/Chow, Anda <b>tidak</b> mengambil ubin — langsung buang 1 ubin.</li>
      <li>Saat tumpukan habis, hanya <b>Ron</b> yang boleh diklaim.</li>
    </ul>
  );
}

function TabMain() {
  return (
    <ul className="rules">
      <li><b>Giliran Anda:</b> tekan <b>Ambil ubin</b> di atas tangan Anda, pilih satu ubin, lalu tekan <b>Buang ubin</b> (atau ketuk ubin yang sama 2x).</li>
      <li><b>💡 Hint</b> (jika diaktifkan host): saat lawan membuang ubin, Hint menyarankan apakah ubin itu sebaiknya diambil (Ron/Pong/Chow/Kong) atau dilewati. Saat giliran membuang, Hint menyarankan ubin yang sebaiknya dibuang.</li>
      <li><b>Geser Manual (Swap):</b> Klik ubin pertama (naik kuning), lalu klik ubin kedua untuk bertukar posisi.</li>
      <li><b>Kong sendiri:</b> Saat giliran membuang, jika punya 4 ubin sama (Kong tertutup) atau ubin ke-4 dari Pong terbuka, tombol ungu <b>KONG</b> akan muncul.</li>
      <li>Ubin yang baru diambil muncul di paling kanan.</li>
      <li><b>Tsumo</b> (menang dari ubin sendiri) dideteksi otomatis.</li>
      <li><b>Batas waktu giliran 60 detik.</b> Jika lewat, sistem membuang ubin terakhir yang Anda ambil secara otomatis supaya permainan tidak macet.</li>
      <li><b>Dealer</b> 🎲 bergiliran setiap ronde. Badge 🏆 = jumlah kemenangan di kamar ini.</li>
      <li>Tutup/refresh halaman? Buka lagi aplikasinya dan tekan <b>Kembali ke meja</b> — kursi Anda tetap aman.</li>
      <li><b>🚪 Keluar</b> di tengah permainan: kursi Anda dilanjutkan BOT supaya meja tidak macet. Orang lain (atau Anda lagi) bisa mengambil alih kursi itu lewat <b>Gabung</b>. Jika host keluar, peran host pindah ke pemain lain.</li>
    </ul>
  );
}

const TABS = [
  ['menang', '💡 Cara Menang', TabMenang],
  ['klaim', '📣 Klaim', TabKlaim],
  ['main', '🕹️ Main', TabMain]
];

/** Panel samping: log permainan & cara main. Di HP tampil sebagai lembar bawah (tombol ☰ Info). */
export default function Sidebar({ s, buka, onTutup, onKeluar, children }) {
  const [tab, setTab] = useState('menang');
  const Isi = TABS.find(t => t[0] === tab)[2];
  return (
    <div className={'sidebar' + (buka ? ' open' : '')}>
      <button type="button" className="sb-tutup" onClick={onTutup} aria-label="Tutup">✕ Tutup</button>
      <div className="sidebar-top">
        <div className="top-bar">
          <div className="info">{`Meja ${s.roomCode}, ronde ${s.ronde}` + (s.isHost ? ', Anda host' : '')}</div>
          <button className="btn-red" onClick={onKeluar} title="Keluar dari meja">🚪 Keluar</button>
        </div>
        {children}
      </div>
      <div className="tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={'tab' + (tab === id ? ' active' : '')} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="tab-body"><Isi /></div>
    </div>
  );
}
