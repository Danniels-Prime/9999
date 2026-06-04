import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SOUNDS, CATEGORY_THEMES, TOTAL_SOUNDS } from './phonicsData';
import TypeShip from './TypeShip';
import RecordCompare from './RecordCompare';

/* ── Global CSS ── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#2e2c48;border-radius:4px}

  @keyframes nebula-a{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-30px) scale(1.15)}}
  @keyframes nebula-b{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-30px,40px) scale(1.1)}}
  @keyframes nebula-c{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,20px) scale(1.08)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes cardWave{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}
  @keyframes rippleOut{0%{transform:scale(0.85);opacity:0.9}100%{transform:scale(2.4);opacity:0}}
  @keyframes glowPulse{0%,100%{opacity:0.7}50%{opacity:1}}
  @keyframes aurora{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

  .phonic-card{
    position:relative;display:flex;flex-direction:column;align-items:center;
    justify-content:flex-start;gap:4px;padding:16px 10px 14px;
    background:rgba(255,255,255,0.03);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    border:1.5px solid rgba(255,255,255,0.08);border-radius:20px;cursor:pointer;
    user-select:none;overflow:hidden;
    transition:border-color .18s ease,box-shadow .18s ease,transform .12s ease;
    animation:fadeUp .3s ease both;-webkit-tap-highlight-color:transparent;outline:none;min-height:160px;
  }
  .phonic-card:hover{border-color:var(--cc);transform:translateY(-4px) scale(1.02);box-shadow:0 16px 40px rgba(0,0,0,.5)}
  .phonic-card:active{transform:scale(0.92)}
  .phonic-card.playing{border-color:var(--cc);box-shadow:0 0 0 2px var(--cg),0 16px 50px rgba(0,0,0,.6);animation:glowPulse .7s ease infinite}
  .card-glow-overlay{position:absolute;inset:0;border-radius:19px;pointer-events:none;background:radial-gradient(ellipse at 50% -10%,var(--cd) 0%,transparent 65%);opacity:0;transition:opacity .2s}
  .phonic-card:hover .card-glow-overlay,.phonic-card.playing .card-glow-overlay{opacity:1}
  .ripple-ring{position:absolute;inset:0;border-radius:19px;border:2px solid var(--cc);pointer-events:none;animation:rippleOut .9s ease-out infinite}
  .wave-bars{display:flex;gap:3px;align-items:center;height:20px;margin-top:2px}
  .wave-bar{width:3px;border-radius:2px;background:var(--cc);height:100%;transform-origin:bottom;animation:cardWave .7s ease-in-out infinite}
  .tab-pill{display:flex;align-items:center;gap:5px;padding:9px 15px;border-radius:50px;border:2px solid #27254a;background:rgba(255,255,255,0.03);color:#7a789e;font-size:12.5px;font-weight:800;font-family:inherit;white-space:nowrap;cursor:pointer;transition:all .18s ease;-webkit-tap-highlight-color:transparent;outline:none}
  .tab-pill:hover:not(.active){border-color:var(--tc);color:var(--tc)}
  .tab-pill.active{background:var(--tc);border-color:var(--tc);color:#fff;box-shadow:0 4px 20px var(--tg)}
  .cnt-badge{padding:1px 7px;border-radius:20px;font-size:11px;font-weight:900;background:rgba(0,0,0,0.3);transition:background .18s}
  .tab-pill.active .cnt-badge{background:rgba(255,255,255,0.25)}
  .bottom-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;cursor:pointer;padding:8px 4px;font-family:inherit;transition:transform .12s;-webkit-tap-highlight-color:transparent;outline:none}
  .bottom-nav-btn:active{transform:scale(0.9)}
`;

/* ── Error Boundary ── */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding: '40px 24px', color: '#FF006E', fontFamily: 'monospace', fontSize: '14px', background: '#0d0c18', minHeight: '100vh' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️ App crashed</div>
        <div style={{ color: '#ff6b9d', marginBottom: '8px', wordBreak: 'break-all' }}>{String(this.state.error)}</div>
        <button onClick={() => this.setState({ error: null })} style={{ marginTop: '20px', padding: '12px 24px', background: '#FF006E', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
    return this.props.children;
  }
}

/* ── Starfield ── */
function StarCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
      resize();
      window.addEventListener('resize', resize);
      const stars = Array.from({ length: 200 }, () => ({
        x: Math.random(), y: Math.random(),
        r: Math.random() * 1.4 + 0.2,
        o: Math.random() * 0.6 + 0.15,
        do: (Math.random() - 0.5) * 0.008,
      }));
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => {
          s.o = Math.max(0.1, Math.min(0.85, s.o + s.do));
          if (s.o >= 0.85 || s.o <= 0.1) s.do *= -1;
          ctx.beginPath();
          ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${s.o.toFixed(2)})`;
          ctx.fill();
        });
        raf = requestAnimationFrame(draw);
      };
      draw();
      return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    } catch (_) { /* canvas not supported — just skip stars */ }
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

/* ── Nebulae ── */
function Nebulae({ color }) {
  return (
    <>
      {[
        { style: { top: '-20%', left: '-15%' }, anim: 'nebula-a 22s ease-in-out infinite' },
        { style: { top: '35%', right: '-15%' }, anim: 'nebula-b 28s ease-in-out infinite' },
        { style: { bottom: '-15%', left: '25%' }, anim: 'nebula-c 19s ease-in-out infinite' },
      ].map((n, i) => (
        <div key={i} style={{
          position: 'fixed', width: `${70 - i * 10}vw`, height: `${70 - i * 10}vw`,
          borderRadius: '50%', filter: 'blur(55px)', pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(circle,${color}${['18', '12', '0d'][i]} 0%,transparent 70%)`,
          animation: n.anim, transition: 'background 0.8s ease', ...n.style,
        }} />
      ))}
    </>
  );
}

/* ── Sound Card ── */
function SoundCard({ sound, theme, isPlaying, onPlay, index }) {
  return (
    <button
      className={`phonic-card${isPlaying ? ' playing' : ''}`}
      style={{ '--cc': theme.color, '--cg': theme.glow, '--cd': theme.dim, animationDelay: `${index * 0.022}s` }}
      onClick={onPlay}
      aria-label={`${sound.letters}, ${sound.example}`}
    >
      <div className="card-glow-overlay" />
      {isPlaying && <div className="ripple-ring" />}
      <div style={{ fontSize: sound.letters.length >= 3 ? '22px' : sound.letters.length === 2 ? '28px' : '36px', fontWeight: 900, color: theme.color, lineHeight: 1, textShadow: isPlaying ? `0 0 24px ${theme.color}` : 'none', letterSpacing: '-0.5px', transition: 'text-shadow .2s' }}>
        {sound.letters}
      </div>
      <div style={{ fontSize: '24px', lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>{sound.emoji}</div>
      <div style={{ fontSize: '12px', fontWeight: 800, color: '#d8d6f8', maxWidth: '88px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sound.example}</div>
      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100px' }}>
        {(sound.words || []).slice(1).map(w => (
          <span key={w} style={{ fontSize: '9px', fontWeight: 800, color: theme.color, background: theme.dim, padding: '2px 5px', borderRadius: '6px' }}>{w}</span>
        ))}
      </div>
      <div style={{ fontSize: '10px', color: '#5e5c88', fontFamily: 'monospace', letterSpacing: '0.4px' }}>{sound.symbol}</div>
      {isPlaying ? (
        <div className="wave-bars">{[0,1,2,3,4].map(i => <div key={i} className="wave-bar" style={{ animationDelay: `${i*.11}s` }} />)}</div>
      ) : (
        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: theme.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', marginTop: '2px' }}>🔊</div>
      )}
    </button>
  );
}

/* ── Learn View ── */
function LearnView({ activeCat, setActiveCat, voices }) {
  const [playing, setPlaying] = useState(null);
  const theme  = CATEGORY_THEMES[activeCat];
  const sounds = SOUNDS[activeCat] || [];

  const playSound = useCallback((sound) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(sound.speech);
    utt.rate = 0.78; utt.pitch = 1.05; utt.lang = 'en-US';
    const preferred = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utt.voice = preferred;
    utt.onstart = () => setPlaying(sound.id);
    utt.onend   = () => setPlaying(null);
    utt.onerror = () => setPlaying(null);
    window.speechSynthesis.speak(utt);
  }, [voices]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '18px 20px 10px', textAlign: 'center', flexShrink: 0, background: 'linear-gradient(180deg,rgba(10,8,30,0.95) 0%,transparent 100%)' }}>
        <h1 style={{ fontSize: 'clamp(22px,5.5vw,38px)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, background: `linear-gradient(120deg,${theme.color} 0%,#fff 50%,${theme.color} 100%)`, backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'aurora 4s linear infinite' }}>
          PhonicsLand
        </h1>
        <p style={{ color: '#5e5c88', fontSize: '12px', fontWeight: 700, marginTop: '3px' }}>{TOTAL_SOUNDS} sounds · tap any card to play</p>
      </header>

      <nav style={{ flexShrink: 0, overflowX: 'auto', borderBottom: '1px solid #1a1835', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '7px', padding: '7px 16px 0', width: 'max-content' }}>
          {Object.entries(CATEGORY_THEMES).map(([id, t]) => (
            <button key={id} className={`tab-pill${activeCat === id ? ' active' : ''}`} style={{ '--tc': t.color, '--tg': t.glow }} onClick={() => setActiveCat(id)}>
              <span>{t.icon}</span><span>{t.label}</span>
              <span className="cnt-badge">{SOUNDS[id]?.length}</span>
            </button>
          ))}
        </div>
      </nav>

      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px 8px' }}>
        <div style={{ width: '5px', height: '34px', borderRadius: '3px', background: theme.color, boxShadow: `0 0 16px ${theme.color}` }} />
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 900, color: theme.color, lineHeight: 1.2 }}>{theme.label}</h2>
          <p style={{ fontSize: '11px', color: '#5e5c88', fontWeight: 600 }}>{sounds.length} sounds · {sounds.flatMap(s => s.words || []).length} example words</p>
        </div>
        {playing && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: theme.dim, border: `1px solid ${theme.glow}`, borderRadius: '50px', padding: '5px 12px', fontSize: '12px', fontWeight: 800, color: theme.color }}>
            🔊 Playing…
          </div>
        )}
      </div>

      <main style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(96px,1fr))', gap: '10px', maxWidth: '880px', margin: '0 auto' }}>
          {sounds.map((s, i) => (
            <SoundCard key={s.id} sound={s} theme={theme} isPlaying={playing === s.id} onPlay={() => playSound(s)} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

/* ── Bottom Nav ── */
function BottomNav({ view, setView, themeColor }) {
  return (
    <nav style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', background: 'rgba(8,7,22,0.95)', borderTop: '1px solid #1a1835', paddingBottom: 'env(safe-area-inset-bottom,0px)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
      {[['learn','🔤','Learn'],['typeship','🚀','TypeShip'],['record','🎤','Record']].map(([id,icon,label]) => (
        <button key={id} className="bottom-nav-btn" onClick={() => setView(id)}>
          <span style={{ fontSize: '22px', filter: view===id ? `drop-shadow(0 0 8px ${themeColor})` : 'none', transition: 'filter .2s' }}>{icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: view===id ? themeColor : '#4a4870', transition: 'color .2s' }}>{label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ── Main App ── */
export default function PhonicsApp() {
  const [view, setView]         = useState('learn');
  const [activeCat, setActiveCat] = useState('shortVowels');
  const [voices, setVoices]     = useState([]);

  // Derive theme color from active category — no MutationObserver needed
  const themeColor = CATEGORY_THEMES[activeCat]?.color || '#FF006E';

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch (_) {} };
  }, []);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  return (
    <ErrorBoundary>
      <div style={{ position: 'fixed', inset: 0, background: '#080716', color: '#e8e6ff', overflow: 'hidden' }}>
        <StarCanvas />
        <Nebulae color={themeColor} />
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'hidden', paddingBottom: '62px' }}>
            {view === 'learn'     && <LearnView activeCat={activeCat} setActiveCat={setActiveCat} voices={voices} />}
            {view === 'typeship'  && <TypeShip themeColor={themeColor} onBack={() => setView('learn')} />}
            {view === 'record'    && <RecordCompare themeColor={themeColor} onBack={() => setView('learn')} />}
          </div>
          <BottomNav view={view} setView={setView} themeColor={themeColor} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
