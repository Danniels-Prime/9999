import { useState, useCallback, useEffect, useRef } from 'react';
import { PHRASES, SLANG, CATEGORY_THEMES, TOTAL_PHRASES, TOTAL_SLANG } from './langData';
import WordBlast from './WordBlast';
import SpeakCoach from './SpeakCoach';

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

  .lang-card{
    position:relative;
    display:flex;flex-direction:column;gap:6px;padding:16px 14px 14px;
    background:rgba(255,255,255,0.03);
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    border:1.5px solid rgba(255,255,255,0.08);
    border-radius:20px;cursor:pointer;user-select:none;overflow:hidden;
    transition:border-color .18s ease,box-shadow .18s ease,transform .12s ease;
    animation:fadeUp .3s ease both;
    -webkit-tap-highlight-color:transparent;outline:none;
    min-height:140px;
  }
  .lang-card:hover{
    border-color:var(--cc);
    transform:translateY(-4px) scale(1.02);
    box-shadow:0 16px 40px rgba(0,0,0,0.5),0 0 0 1px var(--cc)30;
  }
  .lang-card:active{transform:scale(0.93)}
  .lang-card.flipped{animation:flipIn .25s ease both}
  .card-glow{
    position:absolute;inset:0;border-radius:19px;pointer-events:none;
    background:radial-gradient(ellipse at 50% -10%,var(--cd) 0%,transparent 65%);
    opacity:0;transition:opacity .2s;
  }
  .lang-card:hover .card-glow,.lang-card.flipped .card-glow{opacity:1}
  .ripple-ring{
    position:absolute;inset:0;border-radius:19px;
    border:2px solid var(--cc);pointer-events:none;
    animation:rippleOut .9s ease-out infinite;
  }
  .tab-pill{
    display:flex;align-items:center;gap:5px;
    padding:9px 15px;border-radius:50px;
    border:2px solid #27254a;background:rgba(255,255,255,0.03);
    color:#7a789e;font-size:12.5px;font-weight:800;font-family:inherit;
    white-space:nowrap;cursor:pointer;
    transition:all .18s ease;-webkit-tap-highlight-color:transparent;outline:none;
  }
  .tab-pill:hover:not(.active){border-color:var(--tc);color:var(--tc)}
  .tab-pill.active{background:var(--tc);border-color:var(--tc);color:#fff;box-shadow:0 4px 20px var(--tg)}
  .cnt-badge{padding:1px 7px;border-radius:20px;font-size:11px;font-weight:900;background:rgba(0,0,0,0.3);transition:background .18s}
  .tab-pill.active .cnt-badge{background:rgba(255,255,255,0.25)}
  .bottom-nav-btn{
    flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;
    background:none;border:none;cursor:pointer;padding:8px 4px;
    font-family:inherit;transition:transform .12s;
    -webkit-tap-highlight-color:transparent;outline:none;
  }
  .bottom-nav-btn:active{transform:scale(0.9)}
  .mode-toggle-btn{
    padding:8px 18px;border-radius:50px;border:2px solid #27254a;
    background:rgba(255,255,255,0.03);color:#7a789e;
    font-size:12px;font-weight:800;font-family:inherit;cursor:pointer;
    transition:all .18s;-webkit-tap-highlight-color:transparent;outline:none;
    white-space:nowrap;
  }
  .mode-toggle-btn.active{background:var(--mc);border-color:var(--mc);color:#fff;box-shadow:0 4px 16px var(--mg)}
`;

/* ── Starfield ── */
function StarCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const stars = Array.from({ length: 240 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.4 + 0.2,
      o: Math.random() * 0.6 + 0.15,
      do: (Math.random() - 0.5) * 0.008,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.o += s.do;
        if (s.o > 0.8 || s.o < 0.1) s.do *= -1;
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.o.toFixed(2)})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0 }}/>;
}

/* ── Nebulae ── */
function Nebulae({ color }) {
  return (
    <>
      <div style={{ position:'fixed',width:'70vw',height:'70vw',borderRadius:'50%',background:`radial-gradient(circle,${color}18 0%,transparent 70%)`,top:'-20%',left:'-15%',filter:'blur(60px)',animation:'nebula-a 22s ease-in-out infinite',pointerEvents:'none',zIndex:0,transition:'background 0.8s ease' }}/>
      <div style={{ position:'fixed',width:'55vw',height:'55vw',borderRadius:'50%',background:`radial-gradient(circle,${color}12 0%,transparent 65%)`,top:'35%',right:'-15%',filter:'blur(50px)',animation:'nebula-b 28s ease-in-out infinite',pointerEvents:'none',zIndex:0,transition:'background 0.8s ease' }}/>
      <div style={{ position:'fixed',width:'45vw',height:'45vw',borderRadius:'50%',background:`radial-gradient(circle,${color}0d 0%,transparent 60%)`,bottom:'-15%',left:'25%',filter:'blur(40px)',animation:'nebula-c 19s ease-in-out infinite',pointerEvents:'none',zIndex:0,transition:'background 0.8s ease' }}/>
    </>
  );
}

/* ── Phrase / Slang Card ── */
function LangCard({ item, theme, isFlipped, onFlip, index }) {
  return (
    <button
      className={`lang-card${isFlipped ? ' flipped' : ''}`}
      style={{ '--cc': theme.color, '--cg': theme.glow, '--cd': theme.dim, animationDelay:`${index * 0.022}s` }}
      onClick={onFlip}
      aria-label={`${item.en} — ${item.es}`}
    >
      <div className="card-glow"/>
      {isFlipped && <div className="ripple-ring"/>}

      {/* Spanish side (always visible) */}
      <div style={{ fontSize:'11px',color:'#6b69a0',fontWeight:800,letterSpacing:'0.8px' }}>
        🇪🇸 ES
      </div>
      <div style={{
        fontSize: item.es.length > 22 ? '13px' : item.es.length > 14 ? '15px' : '18px',
        fontWeight:900, color:'#FFD700', lineHeight:1.3,
        textShadow:isFlipped?'0 0 14px #FFD70080':'none', transition:'text-shadow .2s',
      }}>
        {item.es}
      </div>

      {/* English — revealed on flip */}
      {isFlipped ? (
        <>
          <div style={{ width:'100%',height:'1px',background:'rgba(255,255,255,0.06)',margin:'2px 0' }}/>
          <div style={{ fontSize:'11px',color:theme.color,fontWeight:800,letterSpacing:'0.8px' }}>
            🇺🇸 EN
          </div>
          <div style={{
            fontSize: item.en.length > 22 ? '12px' : item.en.length > 14 ? '14px' : '16px',
            fontWeight:900, color:theme.color, lineHeight:1.3,
            textShadow:`0 0 12px ${theme.color}`,
          }}>
            {item.en}
          </div>
          {item.meaning && (
            <div style={{ fontSize:'10px',color:'#5e5c88',fontStyle:'italic',lineHeight:1.3 }}>
              {item.meaning}
            </div>
          )}
        </>
      ) : (
        <div style={{
          fontSize:'10px',color:'#3d3b60',fontWeight:700,marginTop:'auto',
          display:'flex',alignItems:'center',gap:'4px',
        }}>
          <span style={{ fontSize:'12px' }}>👆</span> tap to flip
        </div>
      )}
    </button>
  );
}

/* ── Learn View ── */
function LearnView() {
  const [mode, setMode]       = useState('phrases'); // 'phrases' | 'slang'
  const [activeCat, setActiveCat] = useState(null);
  const [flipped, setFlipped] = useState(new Set());

  const source    = mode === 'phrases' ? PHRASES : SLANG;
  const catKeys   = Object.keys(source);
  const activeCatKey = activeCat || catKeys[0];
  const theme     = CATEGORY_THEMES[activeCatKey] || {};
  const items     = source[activeCatKey] || [];

  useEffect(() => {
    setActiveCat(null);
    setFlipped(new Set());
  }, [mode]);

  useEffect(() => {
    setFlipped(new Set());
    document.documentElement.style.setProperty('--app-theme', theme.color || '#00F5D4');
  }, [activeCatKey, theme.color]);

  const toggleFlip = (id) => {
    setFlipped(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const modeColors = { phrases: '#4D79FF', slang: '#FF006E' };

  return (
    <div style={{ height:'100%',display:'flex',flexDirection:'column' }}>
      {/* Header */}
      <header style={{ padding:'16px 20px 8px',textAlign:'center',flexShrink:0,background:'linear-gradient(180deg,rgba(10,8,30,0.95) 0%,transparent 100%)' }}>
        <h1 style={{
          fontSize:'clamp(20px,5.5vw,36px)',fontWeight:900,letterSpacing:'-1px',lineHeight:1,
          background:`linear-gradient(120deg,${theme.color||'#00F5D4'} 0%,#fff 50%,${theme.color||'#00F5D4'} 100%)`,
          backgroundSize:'200% 100%',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
          animation:'aurora 4s linear infinite',
        }}>
          LucidLand 🌙
        </h1>
        <p style={{ color:'#5e5c88',fontSize:'11px',fontWeight:700,marginTop:'2px' }}>
          {TOTAL_PHRASES + TOTAL_SLANG} cards · Spanish → English · tap to flip
        </p>
      </header>

      {/* Mode toggle */}
      <div style={{ flexShrink:0,display:'flex',gap:'8px',padding:'6px 16px 0',justifyContent:'center' }}>
        {[['phrases','📚 Phrases',TOTAL_PHRASES],['slang','🔥 Slang',TOTAL_SLANG]].map(([m,label,cnt]) => (
          <button
            key={m}
            className={`mode-toggle-btn${mode===m?' active':''}`}
            style={{ '--mc':modeColors[m], '--mg':`${modeColors[m]}60` }}
            onClick={() => setMode(m)}
          >
            {label} <span style={{ opacity:0.6,fontSize:'11px' }}>({cnt})</span>
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <nav style={{ flexShrink:0,overflowX:'auto',borderBottom:'1px solid #1a1835',paddingBottom:'10px',marginTop:'8px' }}>
        <div style={{ display:'flex',gap:'7px',padding:'7px 16px 0',width:'max-content' }}>
          {catKeys.map(k => {
            const t = CATEGORY_THEMES[k];
            if (!t) return null;
            return (
              <button
                key={k}
                className={`tab-pill${activeCatKey===k?' active':''}`}
                style={{ '--tc':t.color, '--tg':t.glow }}
                onClick={() => setActiveCat(k)}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                <span className="cnt-badge">{(source[k]||[]).length}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Section label */}
      <div style={{ flexShrink:0,display:'flex',alignItems:'center',gap:'10px',padding:'10px 18px 6px' }}>
        <div style={{ width:'5px',height:'34px',borderRadius:'3px',background:theme.color,boxShadow:`0 0 16px ${theme.color}` }}/>
        <div>
          <h2 style={{ fontSize:'16px',fontWeight:900,color:theme.color,lineHeight:1.2,textShadow:`0 0 12px ${theme.color}50` }}>
            {theme.icon} {theme.label}
          </h2>
          <p style={{ fontSize:'11px',color:'#5e5c88',fontWeight:600 }}>
            {items.length} cards · {flipped.size} revealed
          </p>
        </div>
        {flipped.size > 0 && (
          <button
            onClick={() => setFlipped(new Set())}
            style={{ marginLeft:'auto',fontSize:'11px',color:'#5e5c88',background:'rgba(255,255,255,0.04)',border:'1px solid #27254a',borderRadius:'20px',padding:'4px 10px',cursor:'pointer',fontWeight:700 }}
          >
            🔄 Reset
          </button>
        )}
      </div>

      {/* Grid */}
      <main style={{ flex:1,overflowY:'auto',padding:'0 12px 16px' }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'10px',maxWidth:'880px',margin:'0 auto' }}>
          {items.map((item, i) => (
            <LangCard
              key={item.id}
              item={item}
              theme={theme}
              isFlipped={flipped.has(item.id)}
              onFlip={() => toggleFlip(item.id)}
              index={i}
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
    { id:'learn',  icon:'🌙', label:'Learn' },
    { id:'blast',  icon:'🚀', label:'WordBlast' },
    { id:'speak',  icon:'🎤', label:'SpeakCoach' },
  ];
  return (
    <nav style={{
      position:'absolute',bottom:0,left:0,right:0,
      display:'flex',background:'rgba(8,7,22,0.92)',
      borderTop:'1px solid #1a1835',
      paddingBottom:'env(safe-area-inset-bottom,0px)',
      backdropFilter:'blur(20px)',zIndex:10,
    }}>
      {tabs.map(t => (
        <button key={t.id} className="bottom-nav-btn" onClick={() => setView(t.id)}>
          <span style={{ fontSize:'22px',filter:view===t.id?`drop-shadow(0 0 8px ${themeColor})`:'none',transition:'filter .2s' }}>
            {t.icon}
          </span>
          <span style={{ fontSize:'11px',fontWeight:800,color:view===t.id?themeColor:'#4a4870',transition:'color .2s' }}>
            {t.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

/* ── Main App ── */
export default function LucidApp() {
  const [view, setView]     = useState('learn');
  const [appColor, setAppColor] = useState('#00F5D4');

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const c = getComputedStyle(document.documentElement).getPropertyValue('--app-theme').trim();
      if (c) setAppColor(c);
    });
    observer.observe(document.documentElement, { attributes:true, attributeFilter:['style'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ height:'100%',position:'relative',background:'#080716',color:'#e8e6ff',overflow:'hidden' }}>
      <StarCanvas/>
      <Nebulae color={appColor}/>

      <div style={{ position:'relative',zIndex:1,height:'100%',display:'flex',flexDirection:'column' }}>
        <div style={{ flex:1,overflow:'hidden',paddingBottom:'62px' }}>
          {view === 'learn' && <LearnView/>}
          {view === 'blast' && <WordBlast themeColor={appColor} onBack={() => setView('learn')}/>}
          {view === 'speak' && <SpeakCoach themeColor={appColor} onBack={() => setView('learn')}/>}
        </div>
        <BottomNav view={view} setView={setView} themeColor={appColor}/>
      </div>
    </div>
  );
}
