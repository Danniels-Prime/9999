import { useState, useCallback, useEffect, useRef } from 'react';
import { PHRASES, SLANG, CATEGORY_THEMES, TOTAL_PHRASES, TOTAL_SLANG } from './langData';
import WordBlast from './WordBlast';
import PracticeHub from './PracticeHub';
import Settings from './Settings';
import LearnView from './LearnView';
import FrequencyView from './FrequencyView';
import QuizView from './QuizView';

/* ── ÆTHERMIND color palette ── */
const C = {
  void:'#03010a', deep:'#080810', card:'#0e0c1a', glass:'#14102a',
  violet:'#c77dff', ultra:'#9b30ff', cyan:'#00e5ff', bio:'#00ff88',
  gold:'#FFD700', rose:'#ff006b', silver:'#d0d0e8',
  dim:'#44406a', ghost:'#140f20', red:'#ff0044',
};

const HZ_COLORS = {
  174:'#8800ff', 285:'#00cc88', 396:'#cc0044', 432:'#0088cc',
  528:'#00cc44', 639:'#88cc00', 741:'#00cccc', 852:'#cc0088', 963:'#cccc00',
};

/* ── Infinite level system: levels 1-12 fixed, doubles every 3 levels beyond ── */
const LEVEL_XP_TABLE = [0, 6, 18, 36, 66, 120, 210, 360, 600, 900, 1500, 3000];
function xpForLevel(n) {
  if (n <= 1) return 0;
  if (n <= 12) return LEVEL_XP_TABLE[n - 1];
  return Math.round(3000 * Math.pow(2, (n - 12) / 3));
}
function getLevel(xp) {
  if (xp < 3000) {
    let lvl = 1;
    for (let i = 0; i < LEVEL_XP_TABLE.length; i++) {
      if (xp >= LEVEL_XP_TABLE[i]) lvl = i + 1;
    }
    return lvl;
  }
  return 12 + Math.floor(3 * Math.log2(xp / 3000));
}
function getLevelPct(xp) {
  const lvl = getLevel(xp);
  const floor = xpForLevel(lvl);
  const ceil  = xpForLevel(lvl + 1);
  return Math.min(((xp - floor) / (ceil - floor)) * 100, 100);
}

/* ── Persistent store ── */
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ── SRS helpers ── */
function srsAnswer(srs, cardId, yes) {
  const c = srs[cardId] || { reps: 0 };
  if (!yes) return { ...srs, [cardId]: { ...c, nextReview: Date.now() + 180_000 } };
  const interval = 900_000 * Math.pow(2, c.reps);
  return { ...srs, [cardId]: { reps: c.reps + 1, nextReview: Date.now() + interval } };
}
export function isDue(srs, cardId) {
  const s = srs[cardId]; return !s || Date.now() >= s.nextReview;
}

/* ── Binaural Hz hook ── */
function useHz() {
  const ctx = useRef(null), oscs = useRef([]);
  const stop = useCallback(() => {
    oscs.current.forEach(o => { try { o.stop(); } catch {} });
    oscs.current = [];
    if (ctx.current) { try { ctx.current.close(); } catch {} ctx.current = null; }
  }, []);
  const play = useCallback((hz) => {
    stop();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = new AC(); ctx.current = c;
    const g = c.createGain(); g.gain.value = 0.18; g.connect(c.destination);
    const mkOsc = (freq, pan) => {
      const o = c.createOscillator(), p = c.createStereoPanner();
      o.type = 'sine'; o.frequency.value = freq; p.pan.value = pan;
      o.connect(p); p.connect(g); o.start(); return o;
    };
    oscs.current = [mkOsc(hz, -1), mkOsc(hz + 4, 1)];
  }, [stop]);
  useEffect(() => () => stop(), [stop]);
  return { play, stop };
}

/* ── Global CSS — ÆTHERMIND × LucidLand fusion ── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;font-family:'Outfit',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
  #root{height:100%;position:relative}
  ::-webkit-scrollbar{width:3px;height:3px}
  ::-webkit-scrollbar-track{background:#03010a}
  ::-webkit-scrollbar-thumb{background:#44406a;border-radius:2px}

  @keyframes nebula-a{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}50%{transform:translate(40px,-30px) scale(1.15) rotate(8deg)}}
  @keyframes nebula-b{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}50%{transform:translate(-30px,40px) scale(1.1) rotate(-6deg)}}
  @keyframes nebula-c{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,20px) scale(1.08)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes rippleOut{0%{transform:scale(0.85);opacity:0.9}100%{transform:scale(2.4);opacity:0}}
  @keyframes glowPulse{0%,100%{opacity:0.7}50%{opacity:1}}
  @keyframes flipIn{0%{transform:rotateY(-90deg);opacity:0}100%{transform:rotateY(0deg);opacity:1}}
  @keyframes rainbowShift{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
  @keyframes legendaryPulse{0%,100%{box-shadow:0 0 12px #FFD700,0 0 24px #FFD70050}50%{box-shadow:0 0 24px #FFD700,0 0 48px #FFD700}}
  @keyframes waveBar{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}
  @keyframes knownPop{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
  @keyframes ratePop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
  @keyframes chromab{0%,100%{text-shadow:none}33%{text-shadow:-3px 0 #ff00ff,3px 0 #00e5ff}66%{text-shadow:3px 0 #ff00ff,-3px 0 #00ff88}}
  @keyframes bioGlow{0%,100%{box-shadow:0 0 8px #00ff8844,0 0 16px #00ff8822}50%{box-shadow:0 0 24px #00ff8899,0 0 48px #00ff8855}}
  @keyframes starPulse{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:1;transform:scale(2)}}
  @keyframes recPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.7}}
  @keyframes aurora{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

  .lang-card{
    position:relative;
    display:flex;flex-direction:column;gap:5px;padding:14px 12px 11px;
    background:rgba(14,12,26,0.75);
    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    border:1px solid rgba(199,125,255,0.18);
    border-radius:20px;cursor:pointer;user-select:none;overflow:hidden;
    transition:border-color .2s ease,box-shadow .2s ease,transform .12s ease;
    animation:fadeUp .3s ease both;
    -webkit-tap-highlight-color:transparent;
    min-height:155px;
  }
  .lang-card:hover{border-color:var(--cc);transform:translateY(-3px) scale(1.015);box-shadow:0 14px 36px rgba(0,0,0,0.6),0 0 20px var(--cc)22}
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
    border:1px solid rgba(199,125,255,0.15);background:rgba(14,12,26,0.5);
    color:#44406a;cursor:pointer;font-size:13px;
    display:flex;align-items:center;justify-content:center;
    font-family:inherit;transition:all .15s;-webkit-tap-highlight-color:transparent;min-width:32px;
  }
  .card-audio-btn.playing{border-color:var(--cc)!important;background:var(--cd)!important;color:var(--cc)!important;box-shadow:0 0 10px var(--cg)!important}
  .card-rate-btn{
    flex:1;padding:5px 3px;border-radius:8px;
    border:1px solid rgba(199,125,255,0.1);background:rgba(14,12,26,0.4);
    color:#44406a;cursor:pointer;font-size:12px;font-weight:800;
    font-family:inherit;transition:all .15s;-webkit-tap-highlight-color:transparent;
    animation:ratePop .2s ease both;
  }
  .card-rate-btn.yes{border-color:#00FF8860!important;background:rgba(0,255,136,0.14)!important;color:#00FF88!important;box-shadow:0 0 8px rgba(0,255,136,0.25)!important}
  .card-rate-btn.no{border-color:rgba(255,0,107,0.4)!important;background:rgba(255,0,107,0.09)!important;color:#ff006b!important}

  .tab-pill{display:flex;align-items:center;gap:5px;padding:9px 15px;border-radius:50px;border:1.5px solid #27254a;background:rgba(14,12,26,0.5);color:#44406a;font-size:12.5px;font-weight:800;font-family:inherit;white-space:nowrap;cursor:pointer;transition:all .18s ease;-webkit-tap-highlight-color:transparent;outline:none}
  .tab-pill:hover:not(.active){border-color:var(--tc);color:var(--tc)}
  .tab-pill.active{background:var(--tc)22;border-color:var(--tc);color:var(--tc);box-shadow:0 0 14px var(--tg)}
  .cnt-badge{padding:1px 7px;border-radius:20px;font-size:11px;font-weight:900;background:rgba(0,0,0,0.3);transition:background .18s}
  .tab-pill.active .cnt-badge{background:rgba(255,255,255,0.2)}
  .bottom-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;cursor:pointer;padding:8px 4px;font-family:inherit;transition:transform .12s;-webkit-tap-highlight-color:transparent;outline:none}
  .bottom-nav-btn:active{transform:scale(0.9)}
  .mode-toggle-btn{padding:8px 18px;border-radius:50px;border:1.5px solid #27254a;background:rgba(14,12,26,0.5);color:#44406a;font-size:12px;font-weight:800;font-family:inherit;cursor:pointer;transition:all .18s;-webkit-tap-highlight-color:transparent;outline:none;white-space:nowrap}
  .mode-toggle-btn.active{background:var(--mc)22;border-color:var(--mc);color:var(--mc);box-shadow:0 0 12px var(--mg)}
`;

/* ── Starfield canvas ── */
function StarCanvas({ warp, hzColor }) {
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
    let stars = warp ? Array.from({ length: 300 }, mkWarp) : Array.from({ length: 200 }, mkStar);
    let raf;
    const draw = () => {
      if (warp) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const maxD = Math.sqrt(cx * cx + cy * cy);
        ctx.fillStyle = 'rgba(3,1,10,0.22)';
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
        const col = hzColor || C.violet;
        stars.forEach(s => {
          s.o += s.do;
          if (s.o > 0.8 || s.o < 0.1) s.do *= -1;
          ctx.beginPath();
          ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
          ctx.fillStyle = hzColor
            ? `${col}${Math.round(s.o * 255).toString(16).padStart(2,'0')}`
            : `rgba(199,125,255,${s.o.toFixed(2)})`;
          ctx.fill();
        });
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [warp, hzColor]);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

/* ── Nebulae ── */
function Nebulae({ color, godMode }) {
  return (
    <>
      <div style={{ position:'fixed',width:'70vw',height:'70vw',borderRadius:'50%',background:`radial-gradient(circle,${color}1a 0%,transparent 70%)`,top:'-20%',left:'-15%',filter:'blur(60px)',animation:`nebula-a 22s ease-in-out infinite${godMode?',rainbowShift 6s linear infinite':''}`,pointerEvents:'none',zIndex:0,transition:'background 1s' }}/>
      <div style={{ position:'fixed',width:'55vw',height:'55vw',borderRadius:'50%',background:`radial-gradient(circle,${color}11 0%,transparent 65%)`,top:'35%',right:'-15%',filter:'blur(50px)',animation:`nebula-b 28s ease-in-out infinite${godMode?',rainbowShift 8s linear infinite':''}`,pointerEvents:'none',zIndex:0,transition:'background 1s' }}/>
      <div style={{ position:'fixed',width:'45vw',height:'45vw',borderRadius:'50%',background:`radial-gradient(circle,${color}0c 0%,transparent 60%)`,bottom:'-15%',left:'25%',filter:'blur(40px)',animation:`nebula-c 19s ease-in-out infinite${godMode?',rainbowShift 10s linear infinite':''}`,pointerEvents:'none',zIndex:0,transition:'background 1s' }}/>
    </>
  );
}

/* ── Hz active banner ── */
function HzBanner({ hz, color, onStop }) {
  if (!hz) return null;
  return (
    <div style={{
      position:'fixed', top:0, left:0, right:0, height:28, zIndex:20,
      background:`linear-gradient(90deg,${color}33,${color}11)`,
      borderBottom:`1px solid ${color}44`,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 14px',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:color, animation:'recPulse 1s ease-in-out infinite' }}/>
        <span style={{ color, fontSize:11, fontWeight:700, fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>{hz}Hz ACTIVE</span>
      </div>
      <button onClick={onStop} style={{ background:'none', border:'none', color, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>⏹ STOP</button>
    </div>
  );
}

/* ── Bottom Nav (5 tabs: Practice, Learn, Blast, Quiz, More) ── */
function BottomNav({ view, setView, themeColor, dueCount }) {
  const tabs = [
    { id:'practice', icon:'🎯', label:'Practice' },
    { id:'learn',    icon:'🌙', label:'Learn'    },
    { id:'blast',    icon:'💥', label:'Blast'    },
    { id:'quiz',     icon:'🎴', label: dueCount > 0 ? `Quiz (${dueCount})` : 'Quiz' },
    { id:'settings', icon:'⚙', label:'More'      },
  ];
  return (
    <nav style={{
      position:'absolute', bottom:0, left:0, right:0, height:70,
      background:'rgba(3,1,10,0.92)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      borderTop:`1px solid ${C.dim}33`,
      display:'flex', alignItems:'center', justifyContent:'space-around',
      zIndex:10, paddingBottom:'env(safe-area-inset-bottom,0px)',
    }}>
      {tabs.map(t => {
        const active = view === t.id;
        const col = active ? themeColor : C.dim;
        return (
          <div key={t.id} onClick={() => setView(t.id)} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            cursor:'pointer', padding:'6px 4px',
            transition:'transform .12s', WebkitTapHighlightColor:'transparent',
          }}>
            <div style={{ fontSize:20, color:col, transition:'color .2s', filter: active ? `drop-shadow(0 0 6px ${col})` : 'none' }}>{t.icon}</div>
            <div style={{ fontSize:9, color:col, transition:'color .2s', fontFamily:"'Space Mono',monospace", letterSpacing:0.5 }}>{t.label}</div>
          </div>
        );
      })}
    </nav>
  );
}

/* ── Main App ── */
export default function LucidApp() {
  const [view, setView]         = useState('learn');
  const [appColor, setAppColor] = useState('#00F5D4');
  const [voices, setVoices]     = useState([]);
  const [hz, setHz]             = useState(null);
  const audioHook               = useHz();

  // Persistent state
  const [lifetimeScore,  _setXP]      = useState(() => LS.get('lucid_xp', 0));
  const [bestEverStreak, _setStreak]  = useState(() => LS.get('lucid_streak', 0));
  const [hideAnswer,     _setHide]    = useState(() => LS.get('lucid_hide', false));
  const [known, setKnown]             = useState(() => new Set(LS.get('lucid_known', [])));
  const [srs,   setSrsRaw]            = useState(() => LS.get('lucid_srs', {}));
  const [voiceRecs, setVoiceRecsRaw]  = useState(() => LS.get('lucid_voice_recs', {}));
  const [apiKey,         setApiKey]   = useState(() => LS.get('lucid_api_key', ''));
  const [openaiKey,      _setOAI]     = useState(() => LS.get('lucid_openai_key', ''));
  const [openrouterKey,  _setOR]      = useState(() => LS.get('lucid_openrouter_key', ''));
  const [deepseekKey,    _setDS]      = useState(() => LS.get('lucid_deepseek_key', ''));
  const [customEndpoint, _setCustEp]  = useState(() => LS.get('lucid_custom_ep', ''));
  const [customKey,      _setCustKey] = useState(() => LS.get('lucid_custom_key', ''));
  const [customModel,    _setCustMod] = useState(() => LS.get('lucid_custom_model', ''));
  const [username,       _setUser]    = useState(() => LS.get('lucid_username', ''));
  const [studyStreak, setStudyStreak] = useState(0);
  const studyStreakRef = useRef(0);
  const [studyMode, _setStudyMode]    = useState(() => LS.get('lucid_study_mode', 'flip_es_en'));
  const [defMode,   _setDefMode]      = useState(() => LS.get('lucid_def_mode', false));

  const saveApiKey         = useCallback((k) => { setApiKey(k);     LS.set('lucid_api_key',      k); }, []);
  const saveOpenaiKey      = useCallback((k) => { _setOAI(k);       LS.set('lucid_openai_key',   k); }, []);
  const saveOpenrouterKey  = useCallback((k) => { _setOR(k);        LS.set('lucid_openrouter_key',k); }, []);
  const saveDeepseekKey    = useCallback((k) => { _setDS(k);        LS.set('lucid_deepseek_key', k); }, []);
  const saveCustomEndpoint = useCallback((v) => { _setCustEp(v);    LS.set('lucid_custom_ep',    v); }, []);
  const saveCustomKey      = useCallback((v) => { _setCustKey(v);   LS.set('lucid_custom_key',   v); }, []);
  const saveCustomModel    = useCallback((v) => { _setCustMod(v);   LS.set('lucid_custom_model', v); }, []);
  const saveUsername       = useCallback((n) => { _setUser(n);      LS.set('lucid_username',     n); }, []);
  const saveStudyMode      = useCallback((m) => { _setStudyMode(m); LS.set('lucid_study_mode',   m); }, []);
  const saveDefMode        = useCallback((v) => { _setDefMode(v);   LS.set('lucid_def_mode',     v); }, []);
  const saveSrs            = useCallback((s) => { setSrsRaw(s);     LS.set('lucid_srs',          s); }, []);
  const saveVoiceRecs      = useCallback((r) => { setVoiceRecsRaw(r); LS.set('lucid_voice_recs', r); }, []);

  const setLifetimeScore = useCallback((v) => {
    _setXP(prev => { const n = typeof v === 'function' ? v(prev) : v; LS.set('lucid_xp', n); return n; });
  }, []);
  const setBestEverStreak = useCallback((v) => {
    _setStreak(prev => { const n = typeof v === 'function' ? v(prev) : v; LS.set('lucid_streak', n); return n; });
  }, []);
  const toggleHideAnswer = () => _setHide(prev => { const n = !prev; LS.set('lucid_hide', n); return n; });

  const markCard = useCallback((id, yes) => {
    setKnown(prev => {
      const next = new Set(prev);
      if (yes) { next.add(id); next.delete('no_' + id); }
      else     { next.delete(id); next.add('no_' + id); }
      LS.set('lucid_known', [...next]);
      return next;
    });
    saveSrs(srsAnswer(srs, id, yes));
    if (yes) {
      const ns = studyStreakRef.current + 1;
      studyStreakRef.current = ns;
      setStudyStreak(ns);
      const mult = ns >= 20 ? 5 : ns >= 10 ? 3 : ns >= 5 ? 2 : 1;
      setLifetimeScore(prev => prev + mult);
    } else {
      studyStreakRef.current = 0;
      setStudyStreak(0);
    }
  }, [setLifetimeScore, srs, saveSrs]);

  const godMode   = lifetimeScore  >= 9_999_999_999;
  const beastMode = bestEverStreak >= 50;
  const knownCount = [...known].filter(id => !id.startsWith('no_')).length;
  const level    = getLevel(lifetimeScore);
  const levelPct = getLevelPct(lifetimeScore);

  // Due card count for Quiz tab badge
  const dueCount = (() => {
    const now = Date.now();
    const all = [...Object.values(PHRASES).flat(), ...Object.values(SLANG).flat()];
    return Math.min(all.filter(v => { const s = srs[v.id]; return !s || now >= s.nextReview; }).length, 20);
  })();

  const handleGameEnd = useCallback(({ score, streak }) => {
    setLifetimeScore(prev => prev + score);
    setBestEverStreak(prev => Math.max(prev, streak));
  }, [setLifetimeScore, setBestEverStreak]);

  // Effective theme: hz overrides category color
  const baseColor  = godMode ? C.gold : appColor;
  const themeColor = hz ? (HZ_COLORS[hz] || baseColor) : baseColor;
  const hzColor    = hz ? HZ_COLORS[hz] : null;

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
  }, []);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const stopHz = useCallback(() => { audioHook.stop(); setHz(null); }, [audioHook]);

  return (
    <div style={{ height:'100%', position:'relative', background:C.void, color:C.silver, overflow:'hidden' }}>
      <StarCanvas warp={godMode} hzColor={hzColor} />
      <Nebulae color={themeColor} godMode={godMode} />
      <HzBanner hz={hz} color={hzColor || themeColor} onStop={stopHz} />

      <div style={{ position:'relative', zIndex:1, height:'100%', display:'flex', flexDirection:'column' }}>
        <div style={{ flex:1, overflow:'hidden', paddingTop: hz ? '28px' : 0, paddingBottom:'70px', transition:'padding-top .2s' }}>
          {view === 'learn' && (
            <LearnView
              godMode={godMode}
              voices={voices}
              known={known}
              srs={srs}
              onRate={markCard}
              onThemeChange={setAppColor}
              level={level}
              levelPct={levelPct}
              lifetimeScore={lifetimeScore}
              studyStreak={studyStreak}
              username={username}
              studyMode={studyMode}
              onStudyModeChange={saveStudyMode}
              defMode={defMode}
            />
          )}
          {view === 'quiz' && (
            <QuizView
              srs={srs}
              known={known}
              onRate={markCard}
              themeColor={themeColor}
              godMode={godMode}
              studyMode={studyMode}
              voices={voices}
              defMode={defMode}
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
          {view === 'freq' && (
            <FrequencyView
              hz={hz}
              setHz={setHz}
              audioHook={audioHook}
              onBack={() => setView('settings')}
              themeColor={themeColor}
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
              apiKey={apiKey}
              onSaveApiKey={saveApiKey}
              openaiKey={openaiKey}
              onSaveOpenaiKey={saveOpenaiKey}
              openrouterKey={openrouterKey}
              onSaveOpenrouterKey={saveOpenrouterKey}
              deepseekKey={deepseekKey}
              onSaveDeepseekKey={saveDeepseekKey}
              customEndpoint={customEndpoint}
              onSaveCustomEndpoint={saveCustomEndpoint}
              customKey={customKey}
              onSaveCustomKey={saveCustomKey}
              customModel={customModel}
              onSaveCustomModel={saveCustomModel}
              level={level}
              levelPct={levelPct}
              username={username}
              onSaveUsername={saveUsername}
              studyMode={studyMode}
              onSaveStudyMode={saveStudyMode}
              defMode={defMode}
              onSaveDefMode={saveDefMode}
              hz={hz}
              hzColor={hzColor}
              onGoToFreq={() => setView('freq')}
            />
          )}
          {view === 'practice' && (
            <PracticeHub
              themeColor={themeColor}
              voices={voices}
              apiKey={apiKey}
              openaiKey={openaiKey}
              openrouterKey={openrouterKey}
              deepseekKey={deepseekKey}
              customEndpoint={customEndpoint}
              customKey={customKey}
              customModel={customModel}
              onBack={() => setView('learn')}
              voiceRecs={voiceRecs}
              onSaveVoiceRecs={saveVoiceRecs}
            />
          )}
        </div>
        <BottomNav view={view} setView={setView} themeColor={themeColor} dueCount={dueCount} />
      </div>
    </div>
  );
}
