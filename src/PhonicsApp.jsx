import { useState, useCallback, useEffect, useRef } from 'react';
import { CATEGORIES, SOUNDS, TOTAL_SOUNDS } from './phonicsData';

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    height: 100%;
    background: #0d0c18;
    font-family: 'Nunito', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  #root { height: 100%; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2e2c48; border-radius: 4px; }

  @keyframes wave {
    0%, 100% { transform: scaleY(0.3); }
    50%       { transform: scaleY(1); }
  }

  @keyframes ripple {
    0%   { transform: scale(0.8); opacity: 0.8; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .phonic-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 16px 10px 14px;
    background: #17162a;
    border: 2px solid #27254a;
    border-radius: 18px;
    cursor: pointer;
    user-select: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease;
    overflow: hidden;
    animation: fadeUp 0.3s ease both;
    -webkit-tap-highlight-color: transparent;
    outline: none;
  }

  .phonic-card:hover {
    border-color: var(--c);
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
  }

  .phonic-card:active {
    transform: scale(0.93);
  }

  .phonic-card.playing {
    border-color: var(--c);
    box-shadow: 0 0 0 3px var(--cg), 0 12px 40px rgba(0,0,0,0.6);
  }

  .phonic-card .ripple-ring {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    border: 2px solid var(--c);
    animation: ripple 0.8s ease-out infinite;
    pointer-events: none;
  }

  .card-glow {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background: radial-gradient(circle at 50% 0%, var(--cg) 0%, transparent 65%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .phonic-card:hover .card-glow,
  .phonic-card.playing .card-glow { opacity: 1; }

  .wave-bars {
    display: flex;
    gap: 3px;
    align-items: center;
    height: 22px;
  }

  .wave-bar {
    width: 3px;
    height: 100%;
    border-radius: 2px;
    background: var(--c);
    transform-origin: bottom;
    animation: wave 0.7s ease-in-out infinite;
  }

  .tab-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    border-radius: 50px;
    border: 2px solid #27254a;
    background: #17162a;
    color: #7a789e;
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.18s ease;
    -webkit-tap-highlight-color: transparent;
    outline: none;
  }

  .tab-pill:hover:not(.tab-active) {
    border-color: var(--c);
    color: var(--c);
  }

  .tab-pill.tab-active {
    background: var(--c);
    border-color: var(--c);
    color: #fff;
    box-shadow: 0 4px 18px var(--cg);
  }

  .count-badge {
    padding: 1px 7px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 900;
    background: rgba(0,0,0,0.25);
    transition: background 0.18s ease;
  }

  .tab-active .count-badge { background: rgba(255,255,255,0.25); }

  .sound-speaker {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    background: var(--cg);
    transition: background 0.15s ease;
    flex-shrink: 0;
  }

  .phonic-card:hover .sound-speaker { background: var(--cm); }
`;

function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function SoundCard({ sound, color, isPlaying, onPlay, index }) {
  const cg  = hexToRgba(color, 0.18);
  const cgm = hexToRgba(color, 0.28);

  return (
    <button
      className={`phonic-card${isPlaying ? ' playing' : ''}`}
      style={{ '--c': color, '--cg': cg, '--cm': cgm, animationDelay: `${index * 0.025}s` }}
      onClick={onPlay}
      aria-label={`${sound.letters}, ${sound.example}`}
    >
      <div className="card-glow" />
      {isPlaying && <div className="ripple-ring" />}

      {/* Letter(s) */}
      <div style={{
        fontSize: sound.letters.length >= 3 ? '26px' : '34px',
        fontWeight: 900,
        color,
        lineHeight: 1,
        letterSpacing: '-0.5px',
      }}>
        {sound.letters}
      </div>

      {/* Emoji */}
      <div style={{ fontSize: '26px', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>
        {sound.emoji}
      </div>

      {/* Example word */}
      <div style={{
        fontSize: '12px',
        fontWeight: 800,
        color: '#d8d6f0',
        letterSpacing: '0.2px',
        maxWidth: '90px',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {sound.example}
      </div>

      {/* IPA symbol */}
      <div style={{ fontSize: '10px', color: '#5e5c88', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
        {sound.symbol}
      </div>

      {/* Audio indicator */}
      {isPlaying ? (
        <div className="wave-bars">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.11}s` }} />
          ))}
        </div>
      ) : (
        <div className="sound-speaker">🔊</div>
      )}
    </button>
  );
}

export default function PhonicsApp() {
  const [activeCat, setActiveCat] = useState('shortVowels');
  const [playing, setPlaying]     = useState(null);
  const [voices, setVoices]       = useState([]);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const load = () => setVoices(synthRef.current.getVoices());
    load();
    synthRef.current.addEventListener('voiceschanged', load);
    return () => synthRef.current.removeEventListener('voiceschanged', load);
  }, []);

  const playSound = useCallback((sound) => {
    const synth = synthRef.current;
    synth.cancel();

    const utt = new SpeechSynthesisUtterance(sound.speech);
    utt.rate   = 0.78;
    utt.pitch  = 1.05;
    utt.volume = 1;
    utt.lang   = 'en-US';

    const preferred = voices.find(v =>
      v.lang === 'en-US' &&
      (v.name.includes('Samantha') || v.name.includes('Google US English') ||
       v.name.includes('Alex') || v.name.includes('Zira'))
    ) || voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));

    if (preferred) utt.voice = preferred;

    utt.onstart = () => setPlaying(sound.id);
    utt.onend   = () => setPlaying(null);
    utt.onerror = () => setPlaying(null);

    synth.speak(utt);
  }, [voices]);

  const cat    = CATEGORIES.find(c => c.id === activeCat);
  const sounds = SOUNDS[activeCat] || [];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d0c18',
      color: '#e8e6ff',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <header style={{
        padding: '20px 20px 12px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #131224 0%, transparent 100%)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '32px', marginBottom: '2px' }}>🔤</div>
        <h1 style={{
          fontSize: 'clamp(24px, 5.5vw, 40px)',
          fontWeight: 900,
          letterSpacing: '-1px',
          lineHeight: 1.1,
          background: 'linear-gradient(120deg, #ff6b9d 0%, #a29bfe 50%, #4ecdc4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          PhonicsLand
        </h1>
        <p style={{ color: '#6b69a0', fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
          {TOTAL_SOUNDS} phoneme sounds · Tap any card to hear it
        </p>
      </header>

      {/* ── Category tabs ── */}
      <nav style={{
        flexShrink: 0,
        overflowX: 'auto',
        borderBottom: '1px solid #1e1d35',
        paddingBottom: '12px',
      }}>
        <div style={{ display: 'flex', gap: '8px', padding: '8px 16px 0', width: 'max-content' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`tab-pill${activeCat === c.id ? ' tab-active' : ''}`}
              style={{ '--c': c.color, '--cg': hexToRgba(c.color, 0.35) }}
              onClick={() => setActiveCat(c.id)}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
              <span className="count-badge">{SOUNDS[c.id]?.length}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Section label ── */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 20px 10px',
      }}>
        <div style={{
          width: '5px', height: '36px', borderRadius: '3px',
          background: cat.color,
          boxShadow: `0 0 14px ${hexToRgba(cat.color, 0.7)}`,
        }} />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: cat.color, lineHeight: 1.2 }}>
            {cat.label}
          </h2>
          <p style={{ fontSize: '12px', color: '#5e5c88', fontWeight: 600 }}>
            {sounds.length} sounds — tap a card to play
          </p>
        </div>
        {playing && (
          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: hexToRgba(cat.color, 0.15),
            border: `1px solid ${hexToRgba(cat.color, 0.4)}`,
            borderRadius: '50px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 800,
            color: cat.color,
          }}>
            <span>🔊</span> Playing…
          </div>
        )}
      </div>

      {/* ── Sound grid ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '0 14px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(98px, 1fr))',
          gap: '10px',
          maxWidth: '860px',
          margin: '0 auto',
        }}>
          {sounds.map((sound, i) => (
            <SoundCard
              key={sound.id}
              sound={sound}
              color={cat.color}
              isPlaying={playing === sound.id}
              onPlay={() => playSound(sound)}
              index={i}
            />
          ))}
        </div>
      </main>

      {/* ── Bottom bar ── */}
      <div style={{
        flexShrink: 0,
        padding: '8px 20px 10px',
        borderTop: '1px solid #1e1d35',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#3e3c60',
      }}>
        {CATEGORIES.map(c => (
          <span
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            style={{
              cursor: 'pointer',
              color: activeCat === c.id ? c.color : '#3e3c60',
              transition: 'color 0.15s',
            }}
          >
            {c.icon}
          </span>
        ))}
      </div>
    </div>
  );
}
