import { useState, useCallback, useEffect, useRef } from 'react';
import { PHRASES, SLANG, CATEGORY_THEMES, TOTAL_PHRASES, TOTAL_SLANG } from './langData';
import WordBlast from './WordBlast';
import SpeakCoach from './SpeakCoach';
import Settings from './Settings';

/* ── Persistent store ── */
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ── Global CSS ── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;font-family:'Nunito',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
  #root{height:100%;position:relative}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#2e2c48;border-radius:4px}

  @keyframes nebula-a{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}50%{transform:translate(40px,-30px) scale(1.15) rotate(8deg)}}
  @keyframes nebula-b{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}50%{transform:translate(-30px,40px) scale(1.1) rotate(-6deg)}}
  @keyframes nebula-c{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,20px) scale(1.08)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rippleOut{0%{transform:scale(0.85);opacity:0.9}100%{transform:scale(2.4);opacity:0}}
  @keyframes glowPulse{0%,100%{opacity:0.7}50%{opacity:1}}
  @keyframes aurora{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes flipIn{0%{transform:rotateY(-90deg);opacity:0}100%{transform:rotateY(0deg);opacity:1}}
  @keyframes rainbowShift{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
  @keyframes legendaryPulse{0%,100%{box-shadow:0 0 12px #FFD700,0 0 24px #FFD70050}50%{box-shadow:0 0 24px #FFD700,0 0 48px #FFD700}}
  @keyframes waveBar{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}
  @keyframes knownPop{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
  @keyframes ratePop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}

  .lang-card{
    position:relative;
    display:flex;flex-direction:column;gap:5px;padding:14px 12px 11px;
    background:rgba(255,255,255,0.03);
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    border:1.5px solid rgba(255,255,255,0.08);
    border-radius:20px;cursor:pointer;user-select:none;overflow:hidden;
    transition:border-color .2s ease,box-shadow .2s ease,transform .12s ease;
    animation:fadeUp .3s ease both;
    -webkit-tap-highlight-color:transparent;
    min-height:155px;
  }
  .lang-card:hover{border-color:var(--cc);transform:translateY(-3px) scale(1.015);box-shadow:0 14px 36px rgba(0,0,0,0.5)}
  .lang-card:active{transform:scale(0.93)}
  .lang-card.flipped{animation:flipIn .22s ease both}
  .lang-card.god-mode{animation:legendaryPulse 2s ease-in-out infinite,fadeUp .3s ease both!important;border-color:#FFD700!important}
  .lang-card.known-glow{border-color:rgba(0,255,136,0.35)!important;box-shadow:0 0 14px rgba(0,255,136,0.12)!important}
  .card-glow{position:absolute;inset:0;border-radius:19px;pointer-events:none;background:radial-gradient(ellipse at 50% -10%,var(--cd) 0%,transparent 65%);opacity:0;transition:opacity .2s}
  .lang-card:hover .card-glow,.lang-card.flipped .card-glow{opacity:1}
  .ripple-ring{position:absolute;inset:0;border-radius:19px;border:2px solid var(--cc);pointer-events:none;animation:rippleOut .9s ease-out infinite}

  .card-action-row{display:flex;gap:4px;margin-top:auto;padding-top:6px;width:100%}
  .card-audio-btn{
    flex-shrink:0;padding:5px 8px;border-radius:8px;
    border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);
    color:#5e5c88;cursor:pointer;font-size:13px;
    display:flex;align-items:center;justify-content:center;
    font-family:inherit;transition:all .15s;-webkit-tap-highlight-color:transparent;min-width:32px;
  }
  .card-audio-btn.playing{border-color:var(--cc)!important;background:var(--cd)!important;color:var(--cc)!important;box-shadow:0 0 10px var(--cg)!important}
  .card-rate-btn{
    flex:1;padding:5px 3px;border-radius:8px;
    border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);
    color:#4a4870;cursor:pointer;font-size:12px;font-weight:800;
    font-family:inherit;transition:all .15s;-webkit-tap-highlight-color:transparent;
    animation:ratePop .2s ease both;
  }
  .card-rate-btn.yes{border-color:#00FF8860!important;background:rgba(0,255,136,0.14)!important;color:#00FF88!important;box-shadow:0 0 8px rgba(0,255,136,0.25)!important}
  .card-rate-btn.no{border-color:rgba(255,0,110,0.4)!important;background:rgba(255,0,110,0.09)!important;color:#FF006E!important}

  .tab-pill{display:flex;align-items:center;gap:5px;padding:9px 15px;border-radius:50px;border:2px solid #27254a;background:rgba(255,255,255,0.03);color:#7a789e;font-size:12.5px;font-weight:800;font-family:inherit;white-space:nowrap;cursor:pointer;transition:all .18s ease;-webkit-tap-highlight-color:transparent;outline:none}
  .tab-pill:hover:not(.active){border-color:var(--tc);color:var(--tc)}
  .tab-pill.active{background:var(--tc);border-color:var(--tc);color:#fff;box-shadow:0 4px 20px var(--tg)}
  .cnt-badge{padding:1px 7px;border-radius:20px;font-size:11px;font-weight:900;background:rgba(0,0,0,0.3);transition:background .18s}
  .tab-pill.active .cnt-badge{background:rgba(255,255,255,0.25)}
  .bottom-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;cursor:pointer;padding:8px 4px;font-family:inherit;transition:transform .12s;-webkit-tap-highlight-color:transparent;outline:none}
  .bottom-nav-btn:active{transform:scale(0.9)}
  .mode-toggle-btn{padding:8px 18px;border-radius:50px;border:2px solid #27254a;background:rgba(255,255,255,0.03);color:#7a789e;font-size:12px;font-weight:800;font-family:inherit;cursor:pointer;transition:all .18s;-webkit-tap-highlight-color:transparent;outline:none;white-space:nowrap}
  .mode-toggle-btn.active{background:var(--mc);border-color:var(--mc);color:#fff;box-shadow:0 4px 16px var(--mg)}
`;

/* ── Starfield ── */
function StarCanvas({ warp }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const mkWarp = () => ({ angle: Math.random() * Math.PI * 2, dist: Math.random() * 0.12, speed: Math.random() * 0.005 + 0.002 });
    const mkStar = () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.2, o: Math.random() * 0.6 + 0.15, do: (Math.random() - 0.5) * 0.008 });
    let stars = warp ? Array.from({ length: 300 }, mkWarp) : Array.from({ length: 240 }, mkStar);
    let raf;
    const draw = () => {
      if (warp) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const maxD = Math.sqrt(cx * cx + cy * cy);
        ctx.fillStyle = 'rgba(8,7,22,0.22)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => {
          const pd = s.dist * maxD;
          s.dist += s.speed * (1 + s.dist * 4);
          if (s.dist > 1.1) { Object.assign(s, mkWarp()); return; }
          const cd = s.dist * maxD;
          ctx.strokeStyle = `rgba(255,255,240,${Math.min(s.dist * 1.8, 1)})`;
          ctx.lineWidth = Math.max(0.5, s.dist * 2.5);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(s.angle) * pd, cy + Math.sin(s.angle) * pd);
          ctx.lineTo(cx + Math.cos(s.angle) * cd, cy + Math.sin(s.angle) * cd);
          ctx.stroke();
        });
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => {
          s.o += s.do;
          if (s.o > 0.8 || s.o < 0.1) s.do *= -1;
          ctx.beginPath();
          ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${s.o.toFixed(2)})`;
          ctx.fill();
        });
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [warp]);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

/* ── Nebulae ── */
function Nebulae({ color, godMode }) {
  return (
    <>
      <div style={{ position:'fixed',width:'70vw',height:'70vw',borderRadius:'50%',background:`radial-gradient(circle,${color}18 0%,transparent 70%)`,top:'-20%',left:'-15%',filter:'blur(60px)',animation:`nebula-a 22s ease-in-out infinite${godMode?',rainbowShift 6s linear infinite':''}`,pointerEvents:'none',zIndex:0,transition:'background 0.8s' }}/>
      <div style={{ position:'fixed',width:'55vw',height:'55vw',borderRadius:'50%',background:`radial-gradient(circle,${color}12 0%,transparent 65%)`,top:'35%',right:'-15%',filter:'blur(50px)',animation:`nebula-b 28s ease-in-out infinite${godMode?',rainbowShift 8s linear infinite':''}`,pointerEvents:'none',zIndex:0,transition:'background 0.8s' }}/>
      <div style={{ position:'fixed',width:'45vw',height:'45vw',borderRadius:'50%',background:`radial-gradient(circle,${color}0d 0%,transparent 60%)`,bottom:'-15%',left:'25%',filter:'blur(40px)',animation:`nebula-c 19s ease-in-out infinite${godMode?',rainbowShift 10s linear infinite':''}`,pointerEvents:'none',zIndex:0,transition:'background 0.8s' }}/>
    </>
  );
}

/* ── Mini wave bars for audio indicator ── */
function MiniWave({ color }) {
  return (
    <span style={{ display:'inline-flex', gap:'2px', alignItems:'center', height:'14px' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          display: 'inline-block', width: '2px', height: '100%',
          borderRadius: '1px', background: color, transformOrigin: 'bottom',
          animation: `waveBar .7s ${i * 0.12}s ease-in-out infinite`,
        }} />
      ))}
    </span>
  );
}

/* ── Lang Card ── */
function LangCard({ item, theme, isFlipped, onFlip, index, godMode, isPlaying, onSpeak, rateStatus, onRate }) {
  const cc    = godMode ? '#FFD700' : theme.color;
  const fs_es = item.es.length > 26 ? '11px' : item.es.length > 18 ? '13px' : item.es.length > 12 ? '15px' : '17px';
  const fs_en = item.en.length > 26 ? '10px' : item.en.length > 18 ? '12px' : item.en.length > 12 ? '13px' : '15px';

  const isKnown = rateStatus === 'yes';
  const isMissed = rateStatus === 'no';

  return (
    <div
      className={`lang-card${isFlipped ? ' flipped' : ''}${godMode ? ' god-mode' : ''}${isKnown ? ' known-glow' : ''}`}
      role="button"
      tabIndex={0}
      style={{ '--cc': cc, '--cg': theme.glow, '--cd': theme.dim, animationDelay: `${index * 0.022}s` }}
      onClick={onFlip}
      onKeyDown={e => e.key === 'Enter' && onFlip()}
    >
      <div className="card-glow" />
      {isFlipped && <div className="ripple-ring" />}

      {/* Known / missed badge */}
      {(isKnown || isMissed) && !isFlipped && (
        <div style={{
          position: 'absolute', top: '6px', right: '7px', fontSize: '11px',
          lineHeight: 1, pointerEvents: 'none',
          animation: 'knownPop .3s ease',
        }}>
          {isKnown ? '✅' : '❌'}
        </div>
      )}

      {/* Spanish */}
      <div style={{ fontSize: '10px', color: '#6b69a0', fontWeight: 800, letterSpacing: '0.8px' }}>🇪🇸 ES</div>
      <div style={{
        fontSize: fs_es, fontWeight: 900, color: '#FFD700', lineHeight: 1.3,
        textShadow: isFlipped ? '0 0 14px #FFD70080' : 'none', transition: 'text-shadow .2s',
      }}>
        {item.es}
      </div>

      {isFlipped ? (
        <>
          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.07)', margin: '1px 0', flexShrink: 0 }} />

          {/* English answer */}
          <div style={{ fontSize: '10px', color: cc, fontWeight: 800, letterSpacing: '0.8px' }}>🇺🇸 EN</div>
          <div style={{ fontSize: fs_en, fontWeight: 900, color: cc, lineHeight: 1.3, textShadow: `0 0 10px ${cc}` }}>
            {item.en}
          </div>
          {item.meaning && (
            <div style={{ fontSize: '9px', color: '#5e5c88', fontStyle: 'italic', lineHeight: 1.3 }}>
              {item.meaning}
            </div>
          )}

          {/* ── Action row: Audio + Yes/No ──
               stopPropagation prevents the click from un-flipping the card */}
          <div className="card-action-row" onClick={e => e.stopPropagation()}>

            {/* Audio button */}
            <button
              className={`card-audio-btn${isPlaying ? ' playing' : ''}`}
              style={{ '--cc': cc, '--cd': theme.dim, '--cg': theme.glow }}
              onClick={onSpeak}
              title="Replay audio"
            >
              {isPlaying ? <MiniWave color={cc} /> : '🔊'}
            </button>

            {/* ✅ YES — ¿Lo sabías? → Sí */}
            <button
              className={`card-rate-btn${rateStatus === 'yes' ? ' yes' : ''}`}
              onClick={() => onRate(true)}
              title="¡Sí lo sabía!"
            >
              ✅ Sí
            </button>

            {/* ❌ NO */}
            <button
              className={`card-rate-btn${rateStatus === 'no' ? ' no' : ''}`}
              onClick={() => onRate(false)}
              title="No lo sabía"
            >
              ❌ No
            </button>
          </div>

          {/* Answer feedback line */}
          {rateStatus === 'yes' && (
            <div style={{ fontSize: '9px', color: '#00FF88', fontWeight: 700, textAlign: 'center', animation: 'ratePop .2s ease' }}>
              🌟 ¡Lo sabías!
            </div>
          )}
          {rateStatus === 'no' && (
            <div style={{ fontSize: '9px', color: '#FF006E', fontWeight: 700, textAlign: 'center', animation: 'ratePop .2s ease' }}>
              🔁 ¡A repasar!
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: '10px', color: '#3d3b60', fontWeight: 700, marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>👆</span> tap · hear 🔊 · rate ✅❌
        </div>
      )}
    </div>
  );
}

/* ── Learn View ── */
function LearnView({ godMode, voices, known, onRate, onThemeChange }) {
  const [mode, setMode]           = useState('phrases');
  const [activeCat, setActiveCat] = useState(null);
  const [flipped, setFlipped]     = useState(new Set());
  const [playingId, setPlayingId] = useState(null);

  const source       = mode === 'phrases' ? PHRASES : SLANG;
  const catKeys      = Object.keys(source);
  const activeCatKey = activeCat || catKeys[0];
  const theme        = CATEGORY_THEMES[activeCatKey] || {};
  const items        = source[activeCatKey] || [];
  const themeColor   = godMode ? '#FFD700' : (theme.color || '#00F5D4');

  // Count known (yes) cards in this category
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

  /* Speak English with American accent */
  const speak = useCallback((item) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(item.en);
    utt.lang  = 'en-US';
    utt.rate  = 0.82;
    utt.pitch = 1.05;
    const pref = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
    if (pref) utt.voice = pref;
    utt.onstart = () => setPlayingId(item.id);
    utt.onend   = () => setPlayingId(null);
    utt.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utt);
  }, [voices]);

  /* Flip a card — auto-speak on reveal */
  const toggleFlip = useCallback((item) => {
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
  }, [flipped, speak]);

  const getRateStatus = (id) => {
    if (known.has(id)) return 'yes';
    if (known.has('no_' + id)) return 'no';
    return null;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '14px 20px 6px', textAlign: 'center', flexShrink: 0, background: 'linear-gradient(180deg,rgba(10,8,30,0.95) 0%,transparent 100%)' }}>
        <h1 style={{
          fontSize: 'clamp(20px,5.5vw,34px)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1,
          background: `linear-gradient(120deg,${themeColor} 0%,#fff 50%,${themeColor} 100%)`,
          backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          animation: 'aurora 4s linear infinite',
        }}>
          {godMode ? '👁 LucidLand OMEGA' : 'LucidLand 🌙'}
        </h1>
        <p style={{ color: '#5e5c88', fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
          {TOTAL_PHRASES + TOTAL_SLANG} cards · flip → hear 🔊 · ¿Lo sabías? ✅❌
          {godMode && <span style={{ color: '#FFD700', marginLeft: '6px' }}>· LEGENDARY</span>}
        </p>
      </header>

      {/* Mode toggle */}
      <div style={{ flexShrink: 0, display: 'flex', gap: '8px', padding: '5px 16px 0', justifyContent: 'center' }}>
        {[['phrases', '📚 Phrases', TOTAL_PHRASES], ['slang', '🔥 Slang', TOTAL_SLANG]].map(([m, label, cnt]) => (
          <button key={m} className={`mode-toggle-btn${mode === m ? ' active' : ''}`}
            style={{ '--mc': m === 'slang' ? '#FF006E' : '#4D79FF', '--mg': m === 'slang' ? '#FF006E60' : '#4D79FF60' }}
            onClick={() => setMode(m)}>
            {label} <span style={{ opacity: 0.55, fontSize: '11px' }}>({cnt})</span>
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <nav style={{ flexShrink: 0, overflowX: 'auto', borderBottom: '1px solid #1a1835', paddingBottom: '9px', marginTop: '7px' }}>
        <div style={{ display: 'flex', gap: '7px', padding: '7px 16px 0', width: 'max-content' }}>
          {catKeys.map(k => {
            const t = CATEGORY_THEMES[k];
            if (!t) return null;
            return (
              <button key={k} className={`tab-pill${activeCatKey === k ? ' active' : ''}`} style={{ '--tc': t.color, '--tg': t.glow }} onClick={() => setActiveCat(k)}>
                <span>{t.icon}</span><span>{t.label}</span>
                <span className="cnt-badge">{(source[k] || []).length}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Section label + progress bar */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 18px 5px' }}>
        <div style={{ width: '5px', height: '30px', borderRadius: '3px', background: themeColor, boxShadow: `0 0 14px ${themeColor}`, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 900, color: themeColor, lineHeight: 1.2, textShadow: `0 0 10px ${themeColor}50` }}>
            {theme.icon} {theme.label}
          </h2>
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <div style={{ flex: 1, height: '4px', background: '#1a1835', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${knownPct}%`, background: '#00FF88', borderRadius: '2px',
                transition: 'width .5s ease', boxShadow: catKnownCount > 0 ? '0 0 6px #00FF88' : 'none',
              }} />
            </div>
            <span style={{ fontSize: '10px', color: '#5e5c88', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {catKnownCount}/{items.length} ✅
            </span>
          </div>
        </div>
        {flipped.size > 0 && (
          <button
            onClick={() => { setFlipped(new Set()); window.speechSynthesis.cancel(); setPlayingId(null); }}
            style={{ fontSize: '11px', color: '#5e5c88', background: 'rgba(255,255,255,0.04)', border: '1px solid #27254a', borderRadius: '20px', padding: '4px 10px', cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}
          >🔄 Reset</button>
        )}
      </div>

      {/* Card grid */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '0 12px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: '10px', maxWidth: '880px', margin: '0 auto' }}>
          {items.map((item, i) => (
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
            />
          ))}
        </div>
      </main>
    </div>
  );
}

/* ── Bottom Nav ── */
function BottomNav({ view, setView, themeColor }) {
  const tabs = [
    { id: 'learn',    icon: '🌙', label: 'Learn' },
    { id: 'blast',    icon: '🚀', label: 'WordBlast' },
    { id: 'speak',    icon: '🎤', label: 'SpeakCoach' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];
  return (
    <nav style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', background: 'rgba(8,7,22,0.92)', borderTop: '1px solid #1a1835', paddingBottom: 'env(safe-area-inset-bottom,0px)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
      {tabs.map(t => (
        <button key={t.id} className="bottom-nav-btn" onClick={() => setView(t.id)}>
          <span style={{ fontSize: '22px', filter: view === t.id ? `drop-shadow(0 0 8px ${themeColor})` : 'none', transition: 'filter .2s' }}>{t.icon}</span>
          <span style={{ fontSize: '10px', fontWeight: 800, color: view === t.id ? themeColor : '#4a4870', transition: 'color .2s' }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ── Main App ── */
export default function LucidApp() {
  const [view, setView]         = useState('learn');
  const [appColor, setAppColor] = useState('#00F5D4');
  const [voices, setVoices]     = useState([]);

  // Persistent state
  const [lifetimeScore,  _setXP]     = useState(() => LS.get('lucid_xp', 0));
  const [bestEverStreak, _setStreak] = useState(() => LS.get('lucid_streak', 0));
  const [hideAnswer,     _setHide]   = useState(() => LS.get('lucid_hide', false));
  // known: 'id' = rated YES ✅;  'no_id' = rated NO ❌
  const [known, setKnown] = useState(() => new Set(LS.get('lucid_known', [])));

  const setLifetimeScore  = v => { _setXP(v);     LS.set('lucid_xp', v); };
  const setBestEverStreak = v => { _setStreak(v); LS.set('lucid_streak', v); };
  const toggleHideAnswer  = () => _setHide(prev => { const n = !prev; LS.set('lucid_hide', n); return n; });

  const markCard = useCallback((id, yes) => {
    setKnown(prev => {
      const next = new Set(prev);
      if (yes) { next.add(id); next.delete('no_' + id); }
      else     { next.delete(id); next.add('no_' + id); }
      LS.set('lucid_known', [...next]);
      return next;
    });
  }, []);

  const godMode   = lifetimeScore  >= 9_999_999_999;
  const beastMode = bestEverStreak >= 50;
  // Count only YES-rated cards (not 'no_' prefixed)
  const knownCount = [...known].filter(id => !id.startsWith('no_')).length;

  const handleGameEnd = useCallback(({ score, streak }) => {
    setLifetimeScore(prev => prev + score);
    setBestEverStreak(prev => Math.max(prev, streak));
  }, []);

  // Load voices globally — shared with all children
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Theme color is pushed directly via onThemeChange callback from LearnView — no MutationObserver needed

  const themeColor = godMode ? '#FFD700' : appColor;

  return (
    <div style={{ height: '100%', position: 'relative', background: '#080716', color: '#e8e6ff', overflow: 'hidden' }}>
      <StarCanvas warp={godMode} />
      <Nebulae color={themeColor} godMode={godMode} />

      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'hidden', paddingBottom: '62px' }}>
          {view === 'learn' && (
            <LearnView
              godMode={godMode}
              voices={voices}
              known={known}
              onRate={markCard}
              onThemeChange={setAppColor}
            />
          )}
          {view === 'blast' && (
            <WordBlast
              themeColor={themeColor}
              hideAnswer={hideAnswer}
              beastModeUnlocked={beastMode}
              godModeActive={godMode}
              voices={voices}
              onGameEnd={handleGameEnd}
              onBack={() => setView('learn')}
            />
          )}
          {view === 'speak' && (
            <SpeakCoach
              themeColor={themeColor}
              voices={voices}
              onBack={() => setView('learn')}
            />
          )}
          {view === 'settings' && (
            <Settings
              lifetimeScore={lifetimeScore}
              bestEverStreak={bestEverStreak}
              hideAnswer={hideAnswer}
              onToggleHideAnswer={toggleHideAnswer}
              knownCount={knownCount}
              totalCards={TOTAL_PHRASES + TOTAL_SLANG}
            />
          )}
        </div>
        <BottomNav view={view} setView={setView} themeColor={themeColor} />
      </div>
    </div>
  );
}
