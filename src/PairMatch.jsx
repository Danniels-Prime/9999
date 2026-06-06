import { useState, useCallback } from 'react';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRound(items) {
  const pool = items.length > 6 ? shuffle(items).slice(0, 6) : [...items];
  const tiles = pool.flatMap(it => [
    { id: it.id, side: 'es', text: it.es },
    { id: it.id, side: 'en', text: it.en },
  ]);
  return shuffle(tiles).map((t, idx) => ({ ...t, idx }));
}

export default function PairMatch({ items, onRate, theme, godMode }) {
  const cc = godMode ? '#FFD700' : (theme.color || '#00F5D4');
  const cg = theme.glow || `${cc}60`;

  const [tiles, setTiles]       = useState(() => pickRound(items));
  const [selected, setSelected] = useState(null);
  const [matched, setMatched]   = useState(new Set());
  const [wrong, setWrong]       = useState(new Set());
  const [roundDone, setRoundDone] = useState(false);
  const [pairsFound, setPairsFound] = useState(0);

  const total = tiles.length / 2;

  const newRound = useCallback(() => {
    setTiles(pickRound(items));
    setSelected(null);
    setMatched(new Set());
    setWrong(new Set());
    setRoundDone(false);
    setPairsFound(0);
  }, [items]);

  const handleTap = useCallback((tile) => {
    if (roundDone) return;
    if (matched.has(tile.id)) return;
    if (wrong.has(tile.idx)) return;

    if (selected === null) {
      setSelected(tile.idx);
      return;
    }

    const selTile = tiles[selected];
    if (selTile.idx === tile.idx) {
      setSelected(null);
      return;
    }

    if (selTile.id === tile.id && selTile.side !== tile.side) {
      const newMatched = new Set(matched);
      newMatched.add(tile.id);
      setMatched(newMatched);
      setSelected(null);
      onRate?.(tile.id, true);
      const newPairs = pairsFound + 1;
      setPairsFound(newPairs);
      if (newPairs >= total) setRoundDone(true);
    } else {
      const newWrong = new Set([selTile.idx, tile.idx]);
      setWrong(newWrong);
      setSelected(null);
      setTimeout(() => setWrong(new Set()), 700);
    }
  }, [selected, tiles, matched, wrong, onRate, pairsFound, total, roundDone]);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', position:'relative' }}>
      {/* Progress bar */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px 4px', flexShrink:0 }}>
        <p style={{ fontSize:'11px', color:cc, fontWeight:800 }}>🃏 {pairsFound}/{total} pairs</p>
        <div style={{ flex:1, height:'4px', background:'#1a1835', borderRadius:'2px', overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(pairsFound/total)*100}%`, background:cc, borderRadius:'2px',
            transition:'width .3s ease', boxShadow:`0 0 6px ${cg}` }}/>
        </div>
      </div>

      {/* Tile grid */}
      <div style={{ flex:1, padding:'8px 12px 12px', overflowY:'auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', maxWidth:'480px', margin:'0 auto' }}>
          {tiles.map(tile => {
            const isMatched  = matched.has(tile.id);
            const isSelected = selected === tile.idx;
            const isWrong    = wrong.has(tile.idx);
            const isES       = tile.side === 'es';
            const borderColor = isMatched  ? '#00FF88'
              : isWrong    ? '#FF006E'
              : isSelected ? cc
              : isES       ? '#FFD70040' : `${cc}40`;
            const bg = isMatched  ? 'rgba(0,255,136,0.12)'
              : isWrong    ? 'rgba(255,0,110,0.12)'
              : isSelected ? `${cc}20`
              : 'rgba(255,255,255,0.04)';
            return (
              <button
                key={tile.idx}
                onClick={() => handleTap(tile)}
                disabled={isMatched}
                style={{
                  padding:'10px 6px', minHeight:'64px', borderRadius:'14px',
                  border:`2px solid ${borderColor}`, background:bg,
                  color: isMatched ? '#00FF88' : isWrong ? '#FF006E' : isES ? '#FFD700' : cc,
                  fontSize: tile.text.length > 18 ? '10px' : tile.text.length > 12 ? '11px' : '13px',
                  fontWeight:800, cursor:isMatched ? 'default' : 'pointer',
                  transition:'all .15s', fontFamily:'inherit', lineHeight:1.3,
                  boxShadow: isSelected ? `0 0 14px ${cg}` : isMatched ? '0 0 10px rgba(0,255,136,0.3)' : 'none',
                  animation: isWrong ? 'ratePop .15s ease' : isMatched ? 'knownPop .3s ease' : 'none',
                  opacity: isMatched ? 0.5 : 1,
                }}
              >
                <div style={{ fontSize:'9px', opacity:0.6, marginBottom:'3px', fontWeight:700 }}>
                  {isES ? '🇪🇸' : '🇺🇸'}
                </div>
                {tile.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Round done overlay */}
      {roundDone && (
        <div style={{
          position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:'16px',
          background:'rgba(8,7,22,0.88)', backdropFilter:'blur(8px)',
          zIndex:10, animation:'fadeUp .3s ease',
        }}>
          <div style={{ fontSize:'52px', animation:'knownPop .4s ease' }}>🎉</div>
          <p style={{ fontSize:'24px', fontWeight:900, color:cc, textShadow:`0 0 20px ${cc}` }}>¡Perfecto!</p>
          <p style={{ fontSize:'13px', color:'#9b99c0', fontWeight:700 }}>All {total} pairs matched · +{total} XP</p>
          <button onClick={newRound} style={{
            padding:'13px 32px', borderRadius:'16px', border:`2px solid ${cc}`,
            background:`${cc}18`, color:cc, fontSize:'15px', fontWeight:800,
            cursor:'pointer', boxShadow:`0 0 20px ${cg}`, fontFamily:'inherit',
          }}>
            ▶ Next Round
          </button>
        </div>
      )}
    </div>
  );
}
