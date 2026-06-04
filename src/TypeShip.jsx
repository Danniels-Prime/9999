import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SOUNDS, CATEGORY_THEMES } from './phonicsData';

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

function buildWordPool(category) {
  const data = category === 'all'
    ? Object.values(SOUNDS).flat()
    : (SOUNDS[category] || []);
  return shuffle([...new Set(data.flatMap(s => s.words))]);
}

export default function TypeShip({ themeColor, onBack }) {
  const [category, setCategory]       = useState('all');
  const [gameState, setGameState]     = useState('idle'); // idle | countdown | playing | done
  const [countdown, setCountdown]     = useState(3);
  const [timeLeft, setTimeLeft]       = useState(60);
  const [words, setWords]             = useState([]);
  const [wordIdx, setWordIdx]         = useState(0);
  const [typed, setTyped]             = useState('');
  const [score, setScore]             = useState(0);
  const [streak, setStreak]           = useState(0);
  const [bestStreak, setBestStreak]   = useState(0);
  const [burst, setBurst]             = useState(false);
  const [shake, setShake]             = useState(false);
  const inputRef = useRef(null);

  const currentWord = words[wordIdx] || '';
  const theme = CATEGORY_THEMES[category] || { color: themeColor, glow: 'rgba(0,245,212,0.3)' };

  const startGame = useCallback(() => {
    const pool = buildWordPool(category);
    setWords(pool);
    setWordIdx(0);
    setTyped('');
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setGameState('countdown');
    setCountdown(3);
  }, [category]);

  // Countdown
  useEffect(() => {
    if (gameState !== 'countdown') return;
    if (countdown <= 0) { setGameState('playing'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [gameState, countdown]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) { setGameState('done'); return; }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [gameState, timeLeft]);

  // Auto-focus
  useEffect(() => {
    if (gameState === 'playing') inputRef.current?.focus();
  }, [gameState]);

  const handleInput = useCallback((e) => {
    if (gameState !== 'playing') return;
    const val = e.target.value;
    setTyped(val);

    if (val.toLowerCase() === currentWord.toLowerCase()) {
      const newStreak = streak + 1;
      setScore(s => s + 10 + Math.floor(newStreak / 3) * 5);
      setStreak(newStreak);
      setBestStreak(b => Math.max(b, newStreak));
      setTyped('');
      setWordIdx(i => (i + 1) % words.length);
      setBurst(true);
      setTimeout(() => setBurst(false), 500);
    }
  }, [gameState, currentWord, streak, words]);

  // Detect wrong char → shake
  useEffect(() => {
    if (!typed || !currentWord) return;
    const wrong = typed.split('').some((ch, i) =>
      ch.toLowerCase() !== (currentWord[i] || '').toLowerCase()
    );
    if (wrong) {
      setShake(true);
      setTimeout(() => setShake(false), 350);
    }
  }, [typed, currentWord]);

  const timerPct = timeLeft / 60;
  const timerColor = timeLeft > 20 ? theme.color : timeLeft > 10 ? '#FFD700' : '#FF006E';

  const letterColors = useMemo(() => {
    return currentWord.split('').map((ch, i) => {
      if (i >= typed.length) return '#ffffff30';
      return typed[i]?.toLowerCase() === ch.toLowerCase() ? '#00FF88' : '#FF006E';
    });
  }, [currentWord, typed]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0 12px' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: '#6b69a0',
          fontSize: '22px', cursor: 'pointer', padding: '4px',
        }}>←</button>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: theme.color, flex: 1,
          textShadow: `0 0 20px ${theme.color}` }}>
          🚀 TypeShip
        </h2>
        {gameState === 'playing' && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: theme.color }}>{score}</div>
              <div style={{ fontSize: '10px', color: '#6b69a0', fontWeight: 700 }}>SCORE</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: streak >= 3 ? '#FFD700' : '#fff' }}>
                {streak >= 3 ? `🔥${streak}` : streak}
              </div>
              <div style={{ fontSize: '10px', color: '#6b69a0', fontWeight: 700 }}>STREAK</div>
            </div>
          </div>
        )}
      </div>

      {/* Timer bar */}
      {gameState === 'playing' && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#6b69a0', fontWeight: 700 }}>TIME</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: timerColor }}>{timeLeft}s</span>
          </div>
          <div style={{ height: '6px', background: '#1a1835', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '3px',
              width: `${timerPct * 100}%`,
              background: timerColor,
              boxShadow: `0 0 10px ${timerColor}`,
              transition: 'width 1s linear, background 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* IDLE */}
      {gameState === 'idle' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
          <div style={{ fontSize: '64px', filter: `drop-shadow(0 0 20px ${theme.color})` }}>🚀</div>
          <p style={{ color: '#9b99c0', fontSize: '15px', fontWeight: 600, textAlign: 'center', maxWidth: '280px' }}>
            Type phonics words as fast as you can in 60 seconds!
          </p>

          {/* Category picker */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '380px' }}>
            {[['all', '⚡', 'All Words', '#fff'], ...Object.entries(CATEGORY_THEMES).map(([k,v]) => [k, v.icon, v.label, v.color])].map(([id, icon, label, col]) => (
              <button key={id} onClick={() => setCategory(id)} style={{
                padding: '7px 14px', borderRadius: '50px', border: `2px solid ${category === id ? col : '#27254a'}`,
                background: category === id ? `${col}22` : 'transparent',
                color: category === id ? col : '#6b69a0', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: category === id ? `0 0 12px ${col}50` : 'none',
              }}>
                {icon} {label}
              </button>
            ))}
          </div>

          <button onClick={startGame} style={{
            padding: '16px 48px', borderRadius: '50px',
            background: `linear-gradient(135deg, ${theme.color}, ${theme.color}aa)`,
            border: 'none', color: '#fff', fontSize: '18px', fontWeight: 900,
            cursor: 'pointer', boxShadow: `0 8px 32px ${theme.glow}`,
            letterSpacing: '1px', transition: 'transform 0.1s',
          }}>
            LAUNCH 🚀
          </button>
        </div>
      )}

      {/* COUNTDOWN */}
      {gameState === 'countdown' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            fontSize: '120px', fontWeight: 900,
            color: theme.color, textShadow: `0 0 60px ${theme.color}`,
            animation: 'pulseBig 0.9s ease infinite',
          }}>
            {countdown === 0 ? 'GO!' : countdown}
          </div>
        </div>
      )}

      {/* PLAYING */}
      {gameState === 'playing' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px' }}>
          {/* Word display */}
          <div style={{
            fontSize: 'clamp(36px, 10vw, 72px)', fontWeight: 900, letterSpacing: '4px',
            transition: 'opacity 0.15s',
            animation: shake ? 'shakeFX 0.35s ease' : burst ? 'burstFX 0.4s ease' : 'none',
          }}>
            {currentWord.split('').map((ch, i) => (
              <span key={i} style={{ color: letterColors[i], textShadow: letterColors[i] !== '#ffffff30' ? `0 0 15px ${letterColors[i]}` : 'none', transition: 'color 0.1s, text-shadow 0.1s' }}>
                {ch}
              </span>
            ))}
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[...Array(Math.min(5, words.length - wordIdx - 1))].map((_, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.dim, border: `1px solid ${theme.color}50` }} />
            ))}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            value={typed}
            onChange={handleInput}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `2px solid ${typed && letterColors.some(c => c === '#FF006E') ? '#FF006E' : theme.color}`,
              borderRadius: '16px', padding: '14px 24px',
              fontSize: '22px', fontWeight: 700, color: '#fff',
              outline: 'none', textAlign: 'center', width: '100%', maxWidth: '320px',
              letterSpacing: '3px',
              boxShadow: `0 0 20px ${theme.glow}`,
              fontFamily: 'inherit',
            }}
            placeholder="type here..."
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />

          {burst && (
            <div style={{ position: 'absolute', fontSize: '48px', animation: 'burstFX 0.5s ease forwards', pointerEvents: 'none' }}>
              {streak >= 5 ? '🔥' : streak >= 3 ? '⭐' : '✨'}
            </div>
          )}
        </div>
      )}

      {/* DONE */}
      {gameState === 'done' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <div style={{ fontSize: '56px' }}>🏆</div>
          <h3 style={{ fontSize: '28px', fontWeight: 900, color: theme.color, textShadow: `0 0 24px ${theme.color}` }}>
            Mission Complete!
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '300px' }}>
            {[['Final Score', score, theme.color], ['Best Streak', `🔥 ${bestStreak}`, '#FFD700'], ['Words', wordIdx, '#00FF88'], ['Time', '60s', '#4D79FF']].map(([label, val, col]) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${col}40`,
                borderRadius: '16px', padding: '16px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: 900, color: col }}>{val}</div>
                <div style={{ fontSize: '11px', color: '#6b69a0', fontWeight: 700, marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button onClick={startGame} style={{
              padding: '14px 32px', borderRadius: '50px',
              background: `linear-gradient(135deg, ${theme.color}, ${theme.color}99)`,
              border: 'none', color: '#fff', fontSize: '16px', fontWeight: 900, cursor: 'pointer',
              boxShadow: `0 6px 24px ${theme.glow}`,
            }}>
              🔄 Play Again
            </button>
            <button onClick={onBack} style={{
              padding: '14px 32px', borderRadius: '50px',
              background: 'rgba(255,255,255,0.06)', border: '2px solid #27254a',
              color: '#9b99c0', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
            }}>
              ← Back
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseBig {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes shakeFX {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes burstFX {
          0% { transform: scale(0.8) translateY(0); opacity: 1; }
          100% { transform: scale(1.4) translateY(-40px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
