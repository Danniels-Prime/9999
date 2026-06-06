import { useState, useEffect, useRef } from 'react';

const GOD_GOAL   = 9_999_999_999;
const BEAST_GOAL = 50;

const STUDY_MODES = [
  { id:'flip_es_en',  icon:'🇪🇸', label:'ES → EN',     desc:'See Spanish, reveal English' },
  { id:'flip_en_es',  icon:'🇺🇸', label:'EN → ES',     desc:'See English, reveal Spanish' },
  { id:'flip_both',   icon:'👁',   label:'Both Sides',  desc:'Both sides always visible' },
  { id:'flip_random', icon:'🎲',   label:'Random Dir',  desc:'Random direction each card' },
  { id:'type',        icon:'⌨️',  label:'Type It',     desc:'See Spanish, type English' },
  { id:'listen',      icon:'🎧',  label:'Listen',      desc:'Hear English, type it back' },
  { id:'weak',        icon:'📊',  label:'Weak Spots',  desc:'Only cards you missed ❌' },
  { id:'speed',       icon:'⚡',  label:'Speed Drill', desc:'30 second countdown timer' },
  { id:'match',       icon:'🃏',  label:'Pair Match',  desc:'Match Spanish to English tiles' },
];

function fmt(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(3) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function ProgressBar({ pct, color, glow }) {
  return (
    <div style={{ height: '8px', background: '#1a1835', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
      <div style={{
        height: '100%', borderRadius: '4px',
        width: `${Math.min(pct, 100)}%`,
        background: color,
        boxShadow: pct > 0 ? `0 0 10px ${glow}` : 'none',
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

function Toggle({ on, onToggle, label, sub }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', background: 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${on ? '#00F5D4' : '#27254a'}`,
      borderRadius: '16px', padding: '14px 18px', cursor: 'pointer',
      transition: 'all 0.2s', boxShadow: on ? '0 0 20px rgba(0,245,212,0.2)' : 'none',
    }}>
      <div style={{ textAlign: 'left' }}>
        <p style={{ fontSize: '15px', fontWeight: 800, color: on ? '#00F5D4' : '#c8c6e8' }}>{label}</p>
        <p style={{ fontSize: '11px', color: '#5e5c88', marginTop: '2px', fontWeight: 600 }}>{sub}</p>
      </div>
      <div style={{
        width: '48px', height: '26px', borderRadius: '13px',
        background: on ? '#00F5D4' : '#27254a',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        boxShadow: on ? '0 0 14px rgba(0,245,212,0.5)' : 'none',
      }}>
        <div style={{
          position: 'absolute', top: '3px',
          left: on ? '25px' : '3px',
          width: '20px', height: '20px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }} />
      </div>
    </button>
  );
}

function ClassifiedCard({ unlocked, icon, codename, featureName, powers, progress, goal, progressColor, progressGlow, pct }) {
  const [revealed, setRevealed] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const prevRef = useRef(unlocked);

  useEffect(() => {
    if (unlocked && !prevRef.current) {
      setJustUnlocked(true);
      setTimeout(() => { setJustUnlocked(false); setRevealed(true); }, 1200);
    }
    if (unlocked) setRevealed(true);
    prevRef.current = unlocked;
  }, [unlocked]);

  const isClose = pct > 75 && !unlocked;

  return (
    <div style={{
      borderRadius: '20px', overflow: 'hidden', marginBottom: '14px',
      border: `2px solid ${unlocked ? progressColor : isClose ? progressColor + '80' : '#1e1c3a'}`,
      boxShadow: unlocked ? `0 0 30px ${progressGlow}` : isClose ? `0 0 16px ${progressGlow}` : 'none',
      transition: 'all 0.4s',
      animation: justUnlocked ? 'unlockFlash 1.2s ease' : 'none',
    }}>
      {unlocked ? (
        /* ── UNLOCKED FACE ── */
        <div style={{
          background: `linear-gradient(135deg, rgba(0,0,0,0.7), ${progressGlow}20)`,
          padding: '20px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '32px', filter: `drop-shadow(0 0 12px ${progressColor})` }}>{icon}</span>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 900, color: progressColor, letterSpacing: '2px', fontFamily: 'monospace' }}>
                ✅ UNLOCKED — {codename}
              </p>
              <p style={{ fontSize: '20px', fontWeight: 900, color: '#fff', textShadow: `0 0 16px ${progressColor}` }}>
                {featureName}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {powers.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: progressColor, flexShrink: 0, boxShadow: `0 0 6px ${progressColor}` }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#c8c6e8' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── LOCKED FACE ── */
        <div style={{
          background: '#0a0919',
          padding: '18px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Scanlines overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)',
          }} />

          {/* CLASSIFIED stamp */}
          <div style={{
            position: 'absolute', top: '16px', right: '12px',
            transform: 'rotate(-18deg)',
            border: '3px solid #FF0000',
            borderRadius: '4px',
            padding: '3px 8px',
            color: '#FF0000',
            fontSize: '14px',
            fontWeight: 900,
            fontFamily: 'monospace',
            opacity: 0.85,
            letterSpacing: '2px',
            boxShadow: '0 0 10px rgba(255,0,0,0.4)',
          }}>CLASSIFIED</div>

          {/* Codename header */}
          <p style={{ fontSize: '10px', fontFamily: 'monospace', color: '#FF4444', letterSpacing: '3px', marginBottom: '6px', fontWeight: 900 }}>
            OPERATION: {codename}
          </p>

          {/* Corrupted / blurred name */}
          <p style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#3d3b60', marginBottom: '10px', filter: 'blur(3px)', userSelect: 'none' }}>
            {featureName}
          </p>

          {/* Redacted description */}
          <div style={{ marginBottom: '14px' }}>
            {powers.map((_, i) => (
              <div key={i} style={{ height: '10px', borderRadius: '4px', background: '#1e1c3a', marginBottom: '5px', width: `${60 + (i * 17) % 30}%` }} />
            ))}
          </div>

          {/* Progress toward unlock */}
          <div style={{ fontFamily: 'monospace' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '10px', color: isClose ? progressColor : '#3d3b60', fontWeight: 800, letterSpacing: '1px' }}>
                {isClose ? '⚠ APPROACHING THRESHOLD' : 'ACCESS LEVEL'}
              </span>
              <span style={{ fontSize: '10px', color: isClose ? progressColor : '#3d3b60', fontWeight: 900 }}>
                {fmt(progress)} / {fmt(goal)}
              </span>
            </div>
            <ProgressBar pct={pct} color={progressColor} glow={progressGlow} />
            <p style={{ fontSize: '9px', color: '#2e2c48', marginTop: '5px', letterSpacing: '1px', textAlign: 'right' }}>
              ACCESS: DENIED
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings({ lifetimeScore, bestEverStreak, hideAnswer, onToggleHideAnswer, knownCount = 0, totalCards = 896, apiKey = '', onSaveApiKey, openaiKey = '', onSaveOpenaiKey, openrouterKey = '', onSaveOpenrouterKey, deepseekKey = '', onSaveDeepseekKey, customEndpoint = '', onSaveCustomEndpoint, customKey = '', onSaveCustomKey, customModel = '', onSaveCustomModel, level = 1, levelPct = 0, username = '', onSaveUsername, studyMode = 'flip_es_en', onSaveStudyMode }) {
  const [showKey,   setShowKey]   = useState(false);
  const [showKey2,  setShowKey2]  = useState(false);
  const [showKeyOR, setShowKeyOR] = useState(false);
  const [showKey3,  setShowKey3]  = useState(false);
  const [showKey4,  setShowKey4]  = useState(false);
  const godPct   = Math.min((lifetimeScore / GOD_GOAL)   * 100, 100);
  const beastPct = Math.min((bestEverStreak / BEAST_GOAL) * 100, 100);
  const godUnlocked   = lifetimeScore   >= GOD_GOAL;
  const beastUnlocked = bestEverStreak  >= BEAST_GOAL;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '0 18px 80px' }}>
      <style>{`
        @keyframes unlockFlash {
          0%   { box-shadow: 0 0 0px transparent; }
          20%  { box-shadow: 0 0 60px #fff, 0 0 120px #fff; }
          40%  { box-shadow: 0 0 30px #FFD700; }
          60%  { box-shadow: 0 0 50px #FFD700; }
          100% { box-shadow: 0 0 20px var(--ug); }
        }
        @keyframes glitch {
          0%,100% { transform: skewX(0deg); }
          25%  { transform: skewX(-3deg) translateX(2px); }
          50%  { transform: skewX(2deg) translateX(-1px); }
          75%  { transform: skewX(-1deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '18px 0 12px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#c8c6e8' }}>⚙️ Settings</h1>
      </div>

      {/* ── PROFILE ── */}
      <div style={{ marginBottom: '24px' }}>
        <SectionLabel icon="👤" label="PROFILE" color="#B388FF" />
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid #1e1c3a', borderRadius:'16px', padding:'14px 16px' }}>
          <p style={{ fontSize:'13px', fontWeight:800, color:'#c8c6e8', marginBottom:'8px' }}>Your Name</p>
          <input
            type="text"
            value={username}
            onChange={e => onSaveUsername?.(e.target.value)}
            placeholder="Enter your name…"
            maxLength={24}
            style={{
              width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid #27254a',
              borderRadius:'12px', padding:'11px 14px', color:'#e8e6ff', fontSize:'15px', fontWeight:700,
              fontFamily:'inherit', outline:'none', boxSizing:'border-box',
              transition:'border-color .2s',
            }}
            onFocus={e => e.target.style.borderColor = '#B388FF'}
            onBlur={e => e.target.style.borderColor = '#27254a'}
          />
          {username ? (
            <p style={{ fontSize:'11px', color:'#B388FF', marginTop:'6px', fontWeight:700 }}>
              ✅ Hey {username}! Your name shows on the main screen.
            </p>
          ) : (
            <p style={{ fontSize:'10px', color:'#3d3b60', marginTop:'6px' }}>Personalize your app — shows as a greeting on the Learn screen</p>
          )}
        </div>
      </div>

      {/* ── LEVEL ── */}
      <div style={{ marginBottom: '24px' }}>
        <SectionLabel icon="⭐" label="YOUR LEVEL" color="#FFD700" />
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid #1e1c3a', borderRadius:'16px', padding:'14px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
            <span style={{ fontSize:'22px', fontWeight:900, color:'#FFD700' }}>Level {level}</span>
            <span style={{ fontSize:'13px', color:'#9b99c0', fontWeight:700 }}>{fmt(lifetimeScore)} XP</span>
          </div>
          <div style={{ height:'8px', background:'#1a1835', borderRadius:'4px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${levelPct}%`, background:'#FFD700', borderRadius:'4px', transition:'width .6s', boxShadow: levelPct > 0 ? '0 0 10px #FFD70080' : 'none' }}/>
          </div>
          <p style={{ fontSize:'10px', color:'#3d3b60', marginTop:'5px' }}>
            Flip cards ✅ to earn XP (streak = more XP) · WordBlast gives bonus XP
          </p>
        </div>
      </div>

      {/* ── AI CHAT ── */}
      <div style={{ marginBottom: '28px' }}>
        <SectionLabel icon="🤖" label="AI CHAT" color="#00F5D4" />
        <p style={{ fontSize:'10px', color:'#5e5c88', marginBottom:'12px', fontWeight:600 }}>
          Add one or more API keys — switch between providers inside Chat AI
        </p>

        {/* Claude */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${apiKey ? '#C9644240' : '#1e1c3a'}`, borderRadius:'16px', padding:'14px 16px', marginBottom:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            <span style={{ fontSize:'14px' }}>🟣</span>
            <p style={{ fontSize:'13px', fontWeight:800, color:'#c8c6e8' }}>Claude (Anthropic)</p>
            {apiKey && <span style={{ fontSize:'10px', color:'#C96442', fontWeight:900, marginLeft:'auto' }}>✅ ACTIVE</span>}
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => onSaveApiKey?.(e.target.value)} placeholder="sk-ant-..."
              style={{ flex:1, background:'rgba(255,255,255,0.06)', border:`1px solid ${apiKey ? '#C96442' : '#27254a'}`, borderRadius:'10px', padding:'9px 12px', color:'#e8e6ff', fontSize:'13px', fontFamily:'monospace', outline:'none' }}
            />
            <button onClick={() => setShowKey(s => !s)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid #27254a', borderRadius:'10px', padding:'9px 12px', color:'#9b99c0', cursor:'pointer', fontSize:'14px' }}>{showKey ? '🙈' : '👁'}</button>
          </div>
          <p style={{ fontSize:'10px', color:'#3d3b60', marginTop:'5px' }}>console.anthropic.com</p>
        </div>

        {/* OpenAI / ChatGPT */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${openaiKey ? '#10A37F40' : '#1e1c3a'}`, borderRadius:'16px', padding:'14px 16px', marginBottom:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            <span style={{ fontSize:'14px' }}>🟢</span>
            <p style={{ fontSize:'13px', fontWeight:800, color:'#c8c6e8' }}>ChatGPT (OpenAI)</p>
            {openaiKey && <span style={{ fontSize:'10px', color:'#10A37F', fontWeight:900, marginLeft:'auto' }}>✅ ACTIVE</span>}
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <input type={showKey2 ? 'text' : 'password'} value={openaiKey} onChange={e => onSaveOpenaiKey?.(e.target.value)} placeholder="sk-..."
              style={{ flex:1, background:'rgba(255,255,255,0.06)', border:`1px solid ${openaiKey ? '#10A37F' : '#27254a'}`, borderRadius:'10px', padding:'9px 12px', color:'#e8e6ff', fontSize:'13px', fontFamily:'monospace', outline:'none' }}
            />
            <button onClick={() => setShowKey2(s => !s)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid #27254a', borderRadius:'10px', padding:'9px 12px', color:'#9b99c0', cursor:'pointer', fontSize:'14px' }}>{showKey2 ? '🙈' : '👁'}</button>
          </div>
          <p style={{ fontSize:'10px', color:'#3d3b60', marginTop:'5px' }}>platform.openai.com/api-keys · uses gpt-4o-mini</p>
        </div>

        {/* OpenRouter */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${openrouterKey ? '#6366F140' : '#1e1c3a'}`, borderRadius:'16px', padding:'14px 16px', marginBottom:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            <span style={{ fontSize:'14px' }}>🔷</span>
            <p style={{ fontSize:'13px', fontWeight:800, color:'#c8c6e8' }}>OpenRouter</p>
            {openrouterKey && <span style={{ fontSize:'10px', color:'#6366F1', fontWeight:900, marginLeft:'auto' }}>✅ ACTIVE</span>}
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <input type={showKeyOR ? 'text' : 'password'} value={openrouterKey} onChange={e => onSaveOpenrouterKey?.(e.target.value)} placeholder="sk-or-v3-..."
              style={{ flex:1, background:'rgba(255,255,255,0.06)', border:`1px solid ${openrouterKey ? '#6366F1' : '#27254a'}`, borderRadius:'10px', padding:'9px 12px', color:'#e8e6ff', fontSize:'13px', fontFamily:'monospace', outline:'none' }}
            />
            <button onClick={() => setShowKeyOR(s => !s)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid #27254a', borderRadius:'10px', padding:'9px 12px', color:'#9b99c0', cursor:'pointer', fontSize:'14px' }}>{showKeyOR ? '🙈' : '👁'}</button>
          </div>
          <p style={{ fontSize:'10px', color:'#3d3b60', marginTop:'5px' }}>openrouter.ai · free models (Llama, Gemma) · works from browser ✅</p>
        </div>

        {/* DeepSeek */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${deepseekKey ? '#4D6EFF40' : '#1e1c3a'}`, borderRadius:'16px', padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            <span style={{ fontSize:'14px' }}>🔵</span>
            <p style={{ fontSize:'13px', fontWeight:800, color:'#c8c6e8' }}>DeepSeek</p>
            {deepseekKey && <span style={{ fontSize:'10px', color:'#4D6EFF', fontWeight:900, marginLeft:'auto' }}>✅ ACTIVE</span>}
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <input type={showKey3 ? 'text' : 'password'} value={deepseekKey} onChange={e => onSaveDeepseekKey?.(e.target.value)} placeholder="sk-..."
              style={{ flex:1, background:'rgba(255,255,255,0.06)', border:`1px solid ${deepseekKey ? '#4D6EFF' : '#27254a'}`, borderRadius:'10px', padding:'9px 12px', color:'#e8e6ff', fontSize:'13px', fontFamily:'monospace', outline:'none' }}
            />
            <button onClick={() => setShowKey3(s => !s)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid #27254a', borderRadius:'10px', padding:'9px 12px', color:'#9b99c0', cursor:'pointer', fontSize:'14px' }}>{showKey3 ? '🙈' : '👁'}</button>
          </div>
          <p style={{ fontSize:'10px', color:'#3d3b60', marginTop:'5px' }}>platform.deepseek.com · very affordable</p>
        </div>

        {/* ⚙️ Custom / Any Provider */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${(customKey && customEndpoint) ? '#9B59B640' : '#1e1c3a'}`, borderRadius:'16px', padding:'14px 16px', marginTop:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
            <span style={{ fontSize:'14px' }}>⚙️</span>
            <p style={{ fontSize:'13px', fontWeight:800, color:'#c8c6e8' }}>Custom / Other Provider</p>
            {customKey && customEndpoint && customModel && <span style={{ fontSize:'10px', color:'#9B59B6', fontWeight:900, marginLeft:'auto' }}>✅ ACTIVE</span>}
          </div>
          <p style={{ fontSize:'10px', color:'#5e5c88', marginBottom:'10px', lineHeight:1.5 }}>
            Groq, Mistral, Together AI, Perplexity, Ollama, or any OpenAI-compatible API
          </p>

          <p style={{ fontSize:'11px', color:'#7a789e', fontWeight:700, marginBottom:'4px' }}>Endpoint URL</p>
          <input value={customEndpoint} onChange={e => onSaveCustomEndpoint?.(e.target.value)}
            placeholder="https://api.groq.com/openai/v1/chat/completions"
            style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:`1px solid ${customEndpoint ? '#9B59B6' : '#27254a'}`, borderRadius:'10px', padding:'9px 12px', color:'#e8e6ff', fontSize:'12px', fontFamily:'monospace', outline:'none', boxSizing:'border-box', marginBottom:'8px' }}
          />

          <p style={{ fontSize:'11px', color:'#7a789e', fontWeight:700, marginBottom:'4px' }}>Model Name</p>
          <input value={customModel} onChange={e => onSaveCustomModel?.(e.target.value)}
            placeholder="llama-3.1-8b-instant"
            style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:`1px solid ${customModel ? '#9B59B6' : '#27254a'}`, borderRadius:'10px', padding:'9px 12px', color:'#e8e6ff', fontSize:'12px', fontFamily:'monospace', outline:'none', boxSizing:'border-box', marginBottom:'8px' }}
          />

          <p style={{ fontSize:'11px', color:'#7a789e', fontWeight:700, marginBottom:'4px' }}>API Key</p>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <input type={showKey4 ? 'text' : 'password'} value={customKey} onChange={e => onSaveCustomKey?.(e.target.value)}
              placeholder="sk-..."
              style={{ flex:1, background:'rgba(255,255,255,0.06)', border:`1px solid ${customKey ? '#9B59B6' : '#27254a'}`, borderRadius:'10px', padding:'9px 12px', color:'#e8e6ff', fontSize:'13px', fontFamily:'monospace', outline:'none' }}
            />
            <button onClick={() => setShowKey4(s => !s)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid #27254a', borderRadius:'10px', padding:'9px 12px', color:'#9b99c0', cursor:'pointer', fontSize:'14px' }}>{showKey4 ? '🙈' : '👁'}</button>
          </div>
          <p style={{ fontSize:'10px', color:'#3d3b60', marginTop:'6px' }}>Uses Bearer token auth — stored on this device only</p>
        </div>
      </div>

      {/* ── GAMEPLAY ── */}
      <div style={{ marginBottom: '28px' }}>
        <SectionLabel icon="🎮" label="GAMEPLAY" color="#4D79FF" />
        <Toggle
          on={hideAnswer}
          onToggle={onToggleHideAnswer}
          label="🙈 Hide Answer"
          sub="No ghost letters in WordBlast — type from pure memory"
        />
      </div>

      {/* ── FLASHCARD MODE ── */}
      <div style={{ marginBottom: '28px' }}>
        <SectionLabel icon="🃏" label="FLASHCARD MODE" color="#FF6B6B" />
        <p style={{ fontSize:'10px', color:'#5e5c88', marginBottom:'12px', fontWeight:600 }}>
          Choose how cards behave in Learn mode · tap the mode chip on Learn screen to cycle quickly
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
          {STUDY_MODES.map(m => {
            const active = studyMode === m.id;
            return (
              <button key={m.id} onClick={() => onSaveStudyMode?.(m.id)} style={{
                padding:'12px', borderRadius:'14px',
                border:`2px solid ${active ? '#FF6B6B' : '#1e1c3a'}`,
                background: active ? 'rgba(255,107,107,0.12)' : 'rgba(255,255,255,0.03)',
                cursor:'pointer', textAlign:'left', transition:'all .15s', fontFamily:'inherit',
                boxShadow: active ? '0 0 14px rgba(255,107,107,0.3)' : 'none',
              }}>
                <div style={{ fontSize:'18px', marginBottom:'3px' }}>{m.icon}</div>
                <div style={{ fontSize:'12px', fontWeight:900, color:active ? '#FF6B6B' : '#c8c6e8' }}>{m.label}</div>
                <div style={{ fontSize:'10px', color:'#5e5c88', marginTop:'2px', lineHeight:1.3 }}>{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SECRET VAULT ── */}
      <div>
        <SectionLabel icon="🔐" label="SECRET VAULT" color="#FF4444" mono />

        {/* Stats summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <StatBox label="LIFETIME XP" value={fmt(lifetimeScore)} color="#FFD700" />
          <StatBox label="BEST STREAK" value={`🔥 ${bestEverStreak}`} color="#FF6B6B" />
        </div>

        {/* Known cards progress */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1c3a', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', color: '#5e5c88', fontWeight: 800, letterSpacing: '1px', fontFamily: 'monospace' }}>✅ CARDS KNOWN</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#00FF88' }}>{knownCount}<span style={{ fontSize: '11px', color: '#5e5c88', fontWeight: 700 }}>/{totalCards}</span></span>
          </div>
          <div style={{ height: '6px', background: '#1a1835', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((knownCount / totalCards) * 100, 100)}%`, background: '#00FF88', borderRadius: '3px', transition: 'width .5s ease', boxShadow: knownCount > 0 ? '0 0 8px #00FF8880' : 'none' }} />
          </div>
          <p style={{ fontSize: '10px', color: '#3d3b60', marginTop: '5px', fontFamily: 'monospace' }}>
            {knownCount === 0 ? 'Flip cards in Learn and tap ✅ to track progress' : knownCount === totalCards ? '🏆 ALL CARDS MASTERED' : `${(knownCount / totalCards * 100).toFixed(1)}% mastered`}
          </p>
        </div>

        {/* GOD MODE card */}
        <ClassifiedCard
          unlocked={godUnlocked}
          icon="👁"
          codename="OMEGA-9B"
          featureName="GOD MODE"
          powers={[
            'Score ×9999 per correct answer',
            'Warp-drive starfield activated',
            'All cards shimmer LEGENDARY gold',
            'OMEGA badge in app header',
          ]}
          progress={lifetimeScore}
          goal={GOD_GOAL}
          progressColor="#FFD700"
          progressGlow="rgba(255,215,0,0.5)"
          pct={godPct}
        />

        {/* BEAST MODE card */}
        <ClassifiedCard
          unlocked={beastUnlocked}
          icon="🔥"
          codename="BEAST-50"
          featureName="BEAST MODE"
          powers={[
            '45s start · +2s per correct answer',
            'Score ×2 multiplier',
            'No hints · No ghost letters',
            'Unlocks ⚡ BEAST preset in WordBlast',
          ]}
          progress={bestEverStreak}
          goal={BEAST_GOAL}
          progressColor="#FF6B6B"
          progressGlow="rgba(255,107,107,0.5)"
          pct={beastPct}
        />

        {/* Vault note */}
        <p style={{
          fontSize: '10px', fontFamily: 'monospace', color: '#2e2c48',
          textAlign: 'center', letterSpacing: '1px', lineHeight: 1.7,
        }}>
          CLASSIFIED · LUCIDLAND VAULT v1.0<br />
          UNAUTHORIZED ACCESS PROHIBITED
        </p>
      </div>
    </div>
  );
}

function SectionLabel({ icon, label, color, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
      <div style={{ width: '4px', height: '22px', background: color, borderRadius: '2px', boxShadow: `0 0 10px ${color}` }} />
      <span style={{
        fontSize: '12px', fontWeight: 900, color,
        letterSpacing: '2px', fontFamily: mono ? 'monospace' : 'inherit',
        animation: mono ? 'glitch 4s ease-in-out infinite' : 'none',
      }}>
        {icon} {label}
      </span>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1c3a',
      borderRadius: '14px', padding: '14px', textAlign: 'center',
    }}>
      <p style={{ fontSize: '10px', color: '#5e5c88', fontWeight: 800, letterSpacing: '1px', marginBottom: '6px', fontFamily: 'monospace' }}>
        {label}
      </p>
      <p style={{ fontSize: '20px', fontWeight: 900, color }}>{value}</p>
    </div>
  );
}
