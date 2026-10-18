import Tile from './Tile.jsx';

function labelSet(set, tujuhPasang) {
  if (set.length === 2) return tujuhPasang ? 'Pasang' : 'Kepala';
  return set[0] === set[1] ? 'Trio' : 'Seri';
}

function GrupMenang({ tiles, label, kelas, ubinTandai }) {
  return (
    <div className={'win-group' + (kelas ? ' ' + kelas : '')}>
      <div className="tiles">
        {tiles.map((t, k) => <Tile key={k} sym={t} className={'win' + (k === ubinTandai ? ' win-tile' : '')} />)}
      </div>
      <div className="lbl">{label}</div>
    </div>
  );
}

/** Susunan menang ditampilkan sebagai ubin berwarna, dikelompokkan per set. */
export default function PanelMenang({ s, lengkap }) {
  const m = s.menang;
  const p = s.players[m.winner];
  // Ubin penentu ditandai sekali saja, pada kemunculan pertamanya di set tertutup
  let sudah = false;
  const tandai = set => {
    if (sudah || !m.ubinMenang) return -1;
    const k = set.indexOf(m.ubinMenang);
    if (k !== -1) sudah = true;
    return k;
  };
  return (
    <div>
      {lengkap && <>
        <div className="win-head">{(s.bots[m.winner] ? '🤖🏆 ' : '🏆 ') + p.name + ' MENANG!'}</div>
        <div className="win-sub">{m.keterangan}</div>
      </>}
      <div className="win-groups">
        {m.sets.map((set, i) => {
          const lbl = labelSet(set, m.tujuhPasang);
          return <GrupMenang key={'s' + i} tiles={set} label={lbl} kelas={lbl === 'Kepala' ? 'head' : ''} ubinTandai={tandai(set)} />;
        })}
        {m.melds.map((md, i) => (
          <GrupMenang key={'m' + i} tiles={md.tiles} label={md.concealed ? 'Kong tertutup' : md.type + ' terbuka'}
                      kelas={md.concealed ? '' : 'open'} ubinTandai={-1} />
        ))}
      </div>
      <div className="win-legend">
        {m.ubinMenang && <><span>Ubin penentu:</span><Tile sym={m.ubinMenang} className="small win-tile" /></>}
        {m.melds.length > 0 && <><span className="dot" /><span>set terbuka (Pong/Chow/Kong)</span></>}
      </div>
      {lengkap && s.skor && (
        <div className="win-legend">
          {'🏆 Skor kemenangan — ' + s.players.map((pl, i) => `${pl.name}: ${s.skor[i]}`).join('   ·   ')}
        </div>
      )}
    </div>
  );
}
