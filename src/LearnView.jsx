import { useState, useCallback, useEffect } from 'react';
import { PHRASES, SLANG, CATEGORY_THEMES, TOTAL_PHRASES, TOTAL_SLANG } from './langData';
import LangCard from './LangCard';
import PairMatch from './PairMatch';

const STUDY_MODES = [
  { id:'flip_es_en',  icon:'🇪🇸', label:'ES→EN' },
  { id:'flip_en_es',  icon:'🇺🇸', label:'EN→ES' },
  { id:'flip_both',   icon:'👁',   label:'Both'  },
  { id:'flip_random', icon:'🎲',   label:'Random' },
  { id:'type',        icon:'⌨️',  label:'Type'  },
  { id:'listen',      icon:'🎧',  label:'Listen' },
  { id:'weak',        icon:'📊',  label:'Weak'  },
  { id:'speed',       icon:'⚡',  label:'Speed' },
  { id:'match',       icon:'🃏',  label:'Match' },
];

export default function LearnView({ godMode, voices, known, srs = {}, onRate, onThemeChange, level, levelPct, lifetimeScore, studyStreak = 0, username = '', studyMode = 'flip_es_en', onStudyModeChange, defMode = false, autoRead = true }) {
  const [mode, setMode]           = useState('phrases');
  const [activeCat, setActiveCat] = useState(null);
  const [flipped, setFlipped]     = useState(new Set());
  const [playingId, setPlayingId] = useState(null);
  const [timeLeft, setTimeLeft]   = useState(30);
  const [timerDone, setTimerDone] = useState(false);

  const source       = mode === 'phrases' ? PHRASES : SLANG;
  const catKeys      = Object.keys(source);
  const activeCatKey = activeCat || catKeys[0];
  const theme        = CATEGORY_THEMES[activeCatKey] || {};
  const items        = source[activeCatKey] || [];
  const themeColor   = godMode ? '#FFD700' : (theme.color || '#00F5D4');

  const displayItems = (studyMode === 'weak'
    ? items.filter(it => known.has('no_' + it.id))
    : items
  ).sort((a, b) => {
    // Due cards (not yet reviewed or past interval) come first
    const aDue = !srs[a.id] || Date.now() >= srs[a.id].nextReview;
    const bDue = !srs[b.id] || Date.now() >= srs[b.id].nextReview;
    return aDue === bDue ? 0 : aDue ? -1 : 1;
  });

  const catKnownCount = items.filter(it => known.has(it.id)).length;
  const knownPct      = items.length ? (catKnownCount / items.length) * 100 : 0;

  useEffect(() => { setActiveCat(null); setFlipped(new Set()); }, [mode]);

  useEffect(() => {
    setFlipped(new Set());
    window.speechSynthesis?.cancel();
    setPlayingId(null);
    document.documentElement.style.setProperty('--app-theme', themeColor);
    onThemeChange?.(themeColor);
  }, [activeCatKey, themeColor, onThemeChange]);

  useEffect(() => {
    if (studyMode !== 'speed') { setTimeLeft(30); setTimerDone(false); return; }
    setTimeLeft(30);
    setTimerDone(false);
    const t = setInterval(() => setTimeLeft(s => {
      if (s <= 1) { clearInterval(t); setTimerDone(true); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [studyMode, activeCatKey]);

  const speak = useCallback((item) => {
    window.speechSynthesis.cancel();
    const mkUtt = (text) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = 0.82; u.pitch = 1.05;
      const pref = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
      if (pref) u.voice = pref;
      return u;
    };
    const utt1 = mkUtt(item.en);
    utt1.onstart = () => setPlayingId(item.id);
    if (!autoRead || !item.en_ex) utt1.onend = () => setPlayingId(null);
    utt1.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utt1);
    if (autoRead && item.en_ex) {
      const utt2 = mkUtt(item.en_ex);
      utt2.onend = () => setPlayingId(null);
      utt2.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utt2);
    }
  }, [voices, autoRead]);

  const toggleFlip = useCallback((item) => {
    if (studyMode === 'speed' && timerDone) return;
    const wasFlipped = flipped.has(item.id);
    setFlipped(prev => {
      const next = new Set(prev);
      wasFlipped ? next.delete(item.id) : next.add(item.id);
      return next;
    });
    if (!wasFlipped) {
      setTimeout(() => speak(item), 180);
    } else {
      window.speechSynthesis.cancel();
      setPlayingId(null);
    }
  }, [flipped, speak, studyMode, timerDone]);

  const getRateStatus = (id) => {
    if (known.has(id)) return 'yes';
    if (known.has('no_' + id)) return 'no';
    return null;
  };

  const currentMode = STUDY_MODES.find(m => m.id === studyMode) || STUDY_MODES[0];

  const cycleMode = () => {
    const idx = STUDY_MODES.findIndex(m => m.id === studyMode);
    const next = STUDY_MODES[(idx + 1) % STUDY_MODES.length];
    onStudyModeChange?.(next.id);
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <header style={{ padding:'14px 20px 6px', textAlign:'center', flexShrink:0, background:'linear-gradient(180deg,rgba(10,8,30,0.95) 0%,transparent 100%)' }}>
        <h1 style={{
          fontSize:'clamp(20px,5.5vw,34px)', fontWeight:900, letterSpacing:'-1px', lineHeight:1,
          background:`linear-gradient(120deg,${themeColor} 0%,#fff 50%,${themeColor} 100%)`,
          backgroundSize:'200% 100%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          animation:'aurora 4s linear infinite',
        }}>
          {godMode ? '👁 LucidLand OMEGA' : 'LucidLand 🌙'}
        </h1>

        {/* XP bar */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'5px', padding:'0 4px' }}>
          <span style={{ fontSize:'10px', fontWeight:900, color:godMode?'#FFD700':themeColor, whiteSpace:'nowrap' }}>Lv {level}</span>
          <div style={{ flex:1, height:'5px', background:'#1a1835', borderRadius:'3px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${levelPct}%`, borderRadius:'3px', transition:'width .6s ease',
              background:godMode?'#FFD700':themeColor, boxShadow:`0 0 8px ${godMode?'#FFD700':themeColor}80` }}/>
          </div>
          <span style={{ fontSize:'10px', color:'#5e5c88', fontWeight:700, whiteSpace:'nowrap' }}>
            {lifetimeScore >= 1000 ? `${(lifetimeScore/1000).toFixed(1)}K` : lifetimeScore} XP
          </span>
          {studyStreak >= 2 && (
            <span style={{
              fontSize:'10px', fontWeight:900, whiteSpace:'nowrap', padding:'2px 7px', borderRadius:'20px',
              background:studyStreak>=20?'rgba(255,215,0,0.15)':studyStreak>=10?'rgba(255,60,0,0.15)':'rgba(255,120,0,0.12)',
              color:studyStreak>=20?'#FFD700':studyStreak>=10?'#FF3C00':'#FF7800',
              border:`1px solid ${studyStreak>=20?'#FFD70050':'#FF780040'}`,
              animation:'fadeUp .2s ease',
            }}>
              🔥×{studyStreak>=20?5:studyStreak>=10?3:2}
            </span>
          )}
        </div>

        <p style={{ color:'#5e5c88', fontSize:'10px', fontWeight:700, marginTop:'3px' }}>
          {username ? `Hey ${username}! ` : ''}{TOTAL_PHRASES + TOTAL_SLANG} cards · {currentMode.icon} {currentMode.label}
          {godMode && <span style={{ color:'#FFD700', marginLeft:'6px' }}>· LEGENDARY</span>}
        </p>
      </header>

      {/* Mode toggles + study mode chip */}
      <div style={{ flexShrink:0, display:'flex', gap:'8px', padding:'5px 16px 0', justifyContent:'center', alignItems:'center', flexWrap:'wrap' }}>
        {[['phrases','📚 Phrases',TOTAL_PHRASES],['slang','🔥 Slang',TOTAL_SLANG]].map(([m, label, cnt]) => (
          <button key={m} className={`mode-toggle-btn${mode===m?' active':''}`}
            style={{ '--mc':m==='slang'?'#FF006E':'#4D79FF', '--mg':m==='slang'?'#FF006E60':'#4D79FF60' }}
            onClick={() => setMode(m)}>
            {label} <span style={{ opacity:0.55, fontSize:'11px' }}>({cnt})</span>
          </button>
        ))}
        <button onClick={cycleMode} title="Tap to cycle study mode" style={{
          padding:'7px 11px', borderRadius:'50px', border:`1.5px solid ${themeColor}50`,
          background:`${themeColor}12`, color:themeColor, fontSize:'11px', fontWeight:800,
          cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', flexShrink:0,
        }}>
          {currentMode.icon} {currentMode.label}
        </button>
      </div>

      {/* Category tabs */}
      <nav style={{ flexShrink:0, overflowX:'auto', borderBottom:'1px solid #1a1835', paddingBottom:'9px', marginTop:'7px' }}>
        <div style={{ display:'flex', gap:'7px', padding:'7px 16px 0', width:'max-content' }}>
          {catKeys.map(k => {
            const t = CATEGORY_THEMES[k];
            if (!t) return null;
            return (
              <button key={k} className={`tab-pill${activeCatKey===k?' active':''}`} style={{ '--tc':t.color, '--tg':t.glow }} onClick={() => setActiveCat(k)}>
                <span>{t.icon}</span><span>{t.label}</span>
                <span className="cnt-badge">{(source[k]||[]).length}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Section label + progress */}
      <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:'10px', padding:'8px 18px 5px' }}>
        <div style={{ width:'5px', height:'30px', borderRadius:'3px', background:themeColor, boxShadow:`0 0 14px ${themeColor}`, flexShrink:0 }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <h2 style={{ fontSize:'15px', fontWeight:900, color:themeColor, lineHeight:1.2, textShadow:`0 0 10px ${themeColor}50` }}>
            {theme.icon} {theme.label}
          </h2>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'4px' }}>
            <div style={{ flex:1, height:'4px', background:'#1a1835', borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${knownPct}%`, background:'#00FF88', borderRadius:'2px',
                transition:'width .5s ease', boxShadow:catKnownCount>0?'0 0 6px #00FF88':'none' }}/>
            </div>
            <span style={{ fontSize:'10px', color:'#5e5c88', fontWeight:800, whiteSpace:'nowrap', flexShrink:0 }}>
              {catKnownCount}/{items.length} ✅
            </span>
          </div>
        </div>
        {flipped.size > 0 && studyMode !== 'match' && (
          <button onClick={() => { setFlipped(new Set()); window.speechSynthesis.cancel(); setPlayingId(null); }}
            style={{ fontSize:'11px', color:'#5e5c88', background:'rgba(255,255,255,0.04)', border:'1px solid #27254a', borderRadius:'20px', padding:'4px 10px', cursor:'pointer', fontWeight:700, flexShrink:0 }}>
            🔄 Reset
          </button>
        )}
      </div>

      {/* Speed timer bar */}
      {studyMode === 'speed' && (
        <div style={{ flexShrink:0, padding:'0 18px 6px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'12px', fontWeight:900, color:timeLeft<=10?'#FF006E':'#FF7800', minWidth:'30px' }}>
              ⚡{timeLeft}s
            </span>
            <div style={{ flex:1, height:'4px', background:'#1a1835', borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(timeLeft/30)*100}%`,
                background:timeLeft<=10?'#FF006E':'#FF7800', borderRadius:'2px', transition:'width 1s linear' }}/>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex:1, overflowY:'auto', padding:'0 12px 14px', position:'relative' }}>
        {studyMode === 'match' ? (
          <PairMatch items={items} onRate={onRate} theme={theme} godMode={godMode} />
        ) : studyMode === 'weak' && displayItems.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'10px', padding:'20px' }}>
            <div style={{ fontSize:'44px' }}>🎉</div>
            <p style={{ fontSize:'17px', fontWeight:900, color:'#00FF88', textAlign:'center' }}>No weak spots here!</p>
            <p style={{ fontSize:'12px', color:'#5e5c88', fontWeight:700, textAlign:'center' }}>Flip some cards and tap ❌ to build your weak spots list</p>
          </div>
        ) : timerDone ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'12px' }}>
            <div style={{ fontSize:'44px' }}>⏱</div>
            <p style={{ fontSize:'17px', fontWeight:900, color:'#FF006E' }}>Time's up!</p>
            <p style={{ fontSize:'12px', color:'#5e5c88', fontWeight:700 }}>{flipped.size} cards flipped</p>
            <button onClick={() => { setTimeLeft(30); setTimerDone(false); setFlipped(new Set()); }}
              style={{ padding:'12px 28px', borderRadius:'14px', border:'2px solid #FF006E', background:'rgba(255,0,110,0.12)', color:'#FF006E', fontSize:'14px', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
              ↩ Play Again
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:'10px', maxWidth:'880px', margin:'0 auto' }}>
            {displayItems.map((item, i) => (
              <LangCard
                key={item.id}
                item={item}
                theme={theme}
                isFlipped={flipped.has(item.id)}
                onFlip={() => toggleFlip(item)}
                index={i}
                godMode={godMode}
                isPlaying={playingId === item.id}
                onSpeak={() => speak(item)}
                rateStatus={getRateStatus(item.id)}
                onRate={yes => onRate(item.id, yes)}
                studyMode={studyMode}
                defMode={defMode}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
