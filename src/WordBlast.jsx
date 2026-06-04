import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PHRASES, SLANG, CATEGORY_THEMES } from './langData';

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

function buildPool(mode, catKey) {
  const source = mode === 'slang' ? SLANG : PHRASES;
  const items = catKey === 'all'
    ? Object.values(source).flat()
    : (source[catKey] || []);
  return shuffle(items.filter(x => x.en && x.es));
}

export default function WordBlast({ themeColor, onBack }) {
  const [mode, setMode]               = useState('phrases'); // 'phrases' | 'slang'
  const [catKey, setCatKey]           = useState('all');
  const [gameState, setGameState]     = useState('idle');
  const [countdown, setCountdown]     = useState(3);
  const [timeLeft, setTimeLeft]       = useState(60);
  const [pool, setPool]               = useState([]);
  const [idx, setIdx]                 = useState(0);
  const [typed, setTyped]             = useState('');
  const [score, setScore]             = useState(0);
  const [streak, setStreak]           = useState(0);
  const [bestStreak, setBestStreak]   = useState(0);
  const [burst, setBurst]             = useState(false);
  const [shake, setShake]             = useState(false);
  const [showHint, setShowHint]       = useState(false);
  const inputRef = useRef(null);

  const current = pool[idx];
  const themeKey = catKey === 'all' ? null : catKey;
  const theme = (themeKey && CATEGORY_THEMES[themeKey]) || { color: themeColor, glow: `${themeColor}60`, dim: `${themeColor}15` };

  const startGame = useCallback(() => {
    const p = buildPool(mode, catKey);
    setPool(p);
    setIdx(0);
    setTyped('');
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setShowHint(false);
    setGameState('countdown');
    setCountdown(3);
  }, [mode, catKey]);

  useEffect(() => {
    if (gameState !== 'countdown') return;
    if (countdown <= 0) { setGameState('playing'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [gameState, countdown]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) { setGameState('done'); return; }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === 'playing') inputRef.current?.focus();
  }, [gameState]);

  const handleInput = useCallback((e) => {
    if (gameState !== 'playing' || !current) return;
    const val = e.target.value;
    setTyped(val);
    if (val.trim().toLowerCase() === current.en.toLowerCase()) {
      const ns = streak + 1;
      setScore(s => s + 10 + Math.floor(ns / 3) * 5);
      setStreak(ns);
      setBestStreak(b => Math.max(b, ns));
      setTyped('');
      setShowHint(false);
      setIdx(i => (i + 1) % pool.length);
      setBurst(true);
      setTimeout(() => setBurst(false), 500);
    }
  }, [gameState, current, streak, pool]);

  useEffect(() => {
    if (!typed || !current) return;
    const wrong = typed.split('').some((ch, i) =>
      ch.toLowerCase() !== (current.en[i] || '').toLowerCase()
    );
    if (wrong) {
      setShake(true);
      setTimeout(() => setShake(false), 350);
    }
  }, [typed, current]);

  const timerPct = timeLeft / 60;
  const timerColor = timeLeft > 20 ? theme.color : timeLeft > 10 ? '#FFD700' : '#FF006E';

  const letterColors = useMemo(() => {
    if (!current) return [];
    return current.en.split('').map((ch, i) => {
      if (i >= typed.length) return '#ffffff30';
      return typed[i]?.toLowerCase() === ch.toLowerCase() ? '#00FF88' : '#FF006E';
    });
  }, [current, typed]);

  // Category picker options
  const source = mode === 'slang' ? SLANG : PHRASES;
  const catOptions = Object.keys(source);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', padding:'0 20px 20px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'16px 0 12px' }}>
        <button onClick={onBack} style={{ background:'none',border:'none',color:'#6b69a0',fontSize:'22px',cursor:'pointer',padding:'4px' }}>←</button>
        <h2 style={{ fontSize:'22px',fontWeight:900,color:theme.color,flex:1,textShadow:`0 0 20px ${theme.color}` }}>
          🚀 WordBlast
        </h2>
        {gameState === 'playing' && (
          <div style={{ display:'flex',gap:'16px',alignItems:'center' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'20px',fontWeight:900,color:theme.color }}>{score}</div>
              <div style={{ fontSize:'10px',color:'#6b69a0',fontWeight:700 }}>SCORE</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'20px',fontWeight:900,color:streak>=3?'#FFD700':'#fff' }}>
                {streak>=3?`🔥${streak}`:streak}
              </div>
              <div style={{ fontSize:'10px',color:'#6b69a0',fontWeight:700 }}>STREAK</div>
            </div>
          </div>
        )}
      </div>

      {/* Timer */}
      {gameState === 'playing' && (
        <div style={{ marginBottom:'12px' }}>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'4px' }}>
            <span style={{ fontSize:'12px',color:'#6b69a0',fontWeight:700 }}>TIME</span>
            <span style={{ fontSize:'14px',fontWeight:900,color:timerColor }}>{timeLeft}s</span>
          </div>
          <div style={{ height:'6px',background:'#1a1835',borderRadius:'3px',overflow:'hidden' }}>
            <div style={{
              height:'100%',borderRadius:'3px',width:`${timerPct*100}%`,
              background:timerColor,boxShadow:`0 0 10px ${timerColor}`,
              transition:'width 1s linear,background 0.3s ease',
            }}/>
          </div>
        </div>
      )}

      {/* IDLE */}
      {gameState === 'idle' && (
        <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'20px' }}>
          <div style={{ fontSize:'60px',filter:`drop-shadow(0 0 20px ${theme.color})` }}>🚀</div>
          <p style={{ color:'#9b99c0',fontSize:'15px',fontWeight:600,textAlign:'center',maxWidth:'280px' }}>
            See the <span style={{color:'#FFD700'}}>Spanish</span>, type the <span style={{color:'#00FF88'}}>English</span>!
            60 seconds, go!
          </p>

          {/* Mode toggle */}
          <div style={{ display:'flex',gap:'8px' }}>
            {[['phrases','📚 Phrases'],['slang','🔥 Slang']].map(([m,label]) => (
              <button key={m} onClick={() => { setMode(m); setCatKey('all'); }} style={{
                padding:'9px 20px',borderRadius:'50px',
                border:`2px solid ${mode===m ? theme.color : '#27254a'}`,
                background:mode===m ? `${theme.color}22` : 'transparent',
                color:mode===m ? theme.color : '#6b69a0',
                fontSize:'13px',fontWeight:700,cursor:'pointer',
                boxShadow:mode===m?`0 0 14px ${theme.color}50`:'none',
              }}>{label}</button>
            ))}
          </div>

          {/* Category picker */}
          <div style={{ display:'flex',flexWrap:'wrap',gap:'7px',justifyContent:'center',maxWidth:'400px' }}>
            <button onClick={() => setCatKey('all')} style={{
              padding:'6px 14px',borderRadius:'50px',
              border:`2px solid ${catKey==='all' ? '#fff' : '#27254a'}`,
              background:catKey==='all' ? 'rgba(255,255,255,0.12)' : 'transparent',
              color:catKey==='all'?'#fff':'#6b69a0',fontSize:'12px',fontWeight:700,cursor:'pointer',
            }}>⚡ All</button>
            {catOptions.map(k => {
              const t = CATEGORY_THEMES[k];
              if (!t) return null;
              return (
                <button key={k} onClick={() => setCatKey(k)} style={{
                  padding:'6px 12px',borderRadius:'50px',
                  border:`2px solid ${catKey===k ? t.color : '#27254a'}`,
                  background:catKey===k ? `${t.color}22` : 'transparent',
                  color:catKey===k ? t.color : '#6b69a0',
                  fontSize:'11px',fontWeight:700,cursor:'pointer',
                  boxShadow:catKey===k?`0 0 10px ${t.color}50`:'none',
                }}>{t.icon} {t.label}</button>
              );
            })}
          </div>

          <button onClick={startGame} style={{
            padding:'16px 48px',borderRadius:'50px',
            background:`linear-gradient(135deg,${theme.color},${theme.color}aa)`,
            border:'none',color:'#fff',fontSize:'18px',fontWeight:900,
            cursor:'pointer',boxShadow:`0 8px 32px ${theme.glow}`,letterSpacing:'1px',
          }}>
            LAUNCH 🚀
          </button>
        </div>
      )}

      {/* COUNTDOWN */}
      {gameState === 'countdown' && (
        <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ fontSize:'120px',fontWeight:900,color:theme.color,textShadow:`0 0 60px ${theme.color}` }}>
            {countdown === 0 ? 'GO!' : countdown}
          </div>
        </div>
      )}

      {/* PLAYING */}
      {gameState === 'playing' && current && (
        <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'20px' }}>
          {/* Spanish prompt */}
          <div style={{
            background:'rgba(255,255,255,0.04)',border:`1px solid ${theme.color}40`,
            borderRadius:'20px',padding:'18px 28px',textAlign:'center',maxWidth:'340px',width:'100%',
          }}>
            <p style={{ fontSize:'11px',color:'#6b69a0',fontWeight:800,marginBottom:'6px',letterSpacing:'1px' }}>
              🇪🇸 EN ESPAÑOL
            </p>
            <p style={{ fontSize:'clamp(18px,5vw,28px)',fontWeight:900,color:'#FFD700',lineHeight:1.3 }}>
              {current.es}
            </p>
            {current.meaning && (
              <p style={{ fontSize:'12px',color:'#6b69a0',marginTop:'6px',fontStyle:'italic' }}>
                ({current.meaning})
              </p>
            )}
          </div>

          {/* English target letters */}
          <div style={{
            fontSize:'clamp(26px,7vw,52px)',fontWeight:900,letterSpacing:'3px',
            animation:shake?'shakeFX 0.35s ease':burst?'burstFX 0.4s ease':'none',
          }}>
            {current.en.split('').map((ch, i) => (
              <span key={i} style={{
                color:letterColors[i],
                textShadow:letterColors[i]!=='#ffffff30'?`0 0 12px ${letterColors[i]}`:'none',
                transition:'color 0.08s,text-shadow 0.08s',
              }}>{ch}</span>
            ))}
          </div>

          {/* Hint */}
          {showHint && (
            <div style={{ fontSize:'13px',color:'#9b99c0',background:'rgba(255,255,255,0.04)',padding:'8px 16px',borderRadius:'12px' }}>
              💡 {current.en_ex}
            </div>
          )}
          {!showHint && (
            <button onClick={() => setShowHint(true)} style={{
              background:'none',border:'1px solid #27254a',color:'#4a4870',
              fontSize:'11px',fontWeight:700,padding:'5px 12px',borderRadius:'20px',cursor:'pointer',
            }}>💡 hint</button>
          )}

          <input
            ref={inputRef}
            value={typed}
            onChange={handleInput}
            style={{
              background:'rgba(255,255,255,0.05)',
              border:`2px solid ${typed && letterColors.some(c=>c==='#FF006E') ? '#FF006E' : theme.color}`,
              borderRadius:'16px',padding:'14px 24px',
              fontSize:'20px',fontWeight:700,color:'#fff',
              outline:'none',textAlign:'center',width:'100%',maxWidth:'320px',
              letterSpacing:'2px',boxShadow:`0 0 20px ${theme.glow}`,fontFamily:'inherit',
            }}
            placeholder="type in English…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />

          {burst && (
            <div style={{ position:'absolute',fontSize:'48px',animation:'burstFX 0.5s ease forwards',pointerEvents:'none' }}>
              {streak>=5?'🔥':streak>=3?'⭐':'✨'}
            </div>
          )}
        </div>
      )}

      {/* DONE */}
      {gameState === 'done' && (
        <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'20px' }}>
          <div style={{ fontSize:'56px' }}>🏆</div>
          <h3 style={{ fontSize:'28px',fontWeight:900,color:theme.color,textShadow:`0 0 24px ${theme.color}` }}>
            ¡Misión cumplida!
          </h3>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',width:'100%',maxWidth:'300px' }}>
            {[['Final Score',score,theme.color],['Best Streak',`🔥 ${bestStreak}`,'#FFD700'],['Words',idx,'#00FF88'],['Time','60s','#4D79FF']].map(([label,val,col]) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.04)',border:`1px solid ${col}40`,borderRadius:'16px',padding:'16px',textAlign:'center' }}>
                <div style={{ fontSize:'24px',fontWeight:900,color:col }}>{val}</div>
                <div style={{ fontSize:'11px',color:'#6b69a0',fontWeight:700,marginTop:'4px' }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex',gap:'12px',marginTop:'8px' }}>
            <button onClick={startGame} style={{
              padding:'14px 32px',borderRadius:'50px',
              background:`linear-gradient(135deg,${theme.color},${theme.color}99)`,
              border:'none',color:'#fff',fontSize:'16px',fontWeight:900,cursor:'pointer',
              boxShadow:`0 6px 24px ${theme.glow}`,
            }}>🔄 Play Again</button>
            <button onClick={onBack} style={{
              padding:'14px 32px',borderRadius:'50px',
              background:'rgba(255,255,255,0.06)',border:'2px solid #27254a',
              color:'#9b99c0',fontSize:'16px',fontWeight:700,cursor:'pointer',
            }}>← Back</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shakeFX{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
        @keyframes burstFX{0%{transform:scale(0.8) translateY(0);opacity:1}100%{transform:scale(1.4) translateY(-40px);opacity:0}}
      `}</style>
    </div>
  );
}
