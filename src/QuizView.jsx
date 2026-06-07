import { useState, useRef, useEffect, useCallback } from 'react';
import { PHRASES, SLANG } from './langData';

const C = {
  void:'#03010a', card:'#0e0c1a', glass:'#14102a',
  violet:'#c77dff', cyan:'#00e5ff', bio:'#00ff88',
  gold:'#FFD700', dim:'#44406a', ghost:'#140f20',
  red:'#ff0044', silver:'#d0d0e8',
};

const ALL_VOCAB = [
  ...Object.values(PHRASES).flat(),
  ...Object.values(SLANG).flat(),
];

function getDueQueue(srs) {
  const now = Date.now();
  const due = ALL_VOCAB.filter(v => { const s = srs[v.id]; return !s || now >= s.nextReview; });
  return due.length > 0 ? due.slice(0, 20) : ALL_VOCAB.slice(0, 20);
}

function fuzzyMatch(input, answer) {
  const clean = s => s.toLowerCase().trim().replace(/[^a-z0-9 ']/g, '').replace(/\s+/g, ' ');
  const a = clean(input), b = clean(answer);
  if (!a) return false;
  if (a === b) return true;
  const maxDist = b.length <= 6 ? 1 : b.length <= 12 ? 2 : 3;
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length] <= maxDist;
}

function CompletionScreen({ easy, again, onRestart }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:32, gap:20 }}>
      <div style={{ fontSize:60 }}>🌟</div>
      <div style={{ fontFamily:"'Bebas Neue',display", fontSize:36, color:C.bio, letterSpacing:3, textAlign:'center' }}>ALL CAUGHT UP!</div>
      <div style={{ color:C.dim, fontSize:14, textAlign:'center', fontFamily:"'Space Mono',monospace" }}>
        ✓ Easy: {easy} &nbsp;·&nbsp; ✗ Again: {again}
      </div>
      <div style={{ color:C.dim, fontSize:12, textAlign:'center', lineHeight:1.6 }}>
        Come back later when more cards are due,<br/>or restart to practice them all.
      </div>
      <button onClick={onRestart} style={{
        padding:'14px 32px', borderRadius:14, fontSize:16, fontWeight:700,
        background:`${C.violet}22`, border:`1.5px solid ${C.violet}66`, color:C.violet,
        cursor:'pointer', fontFamily:"'Outfit',sans-serif", marginTop:8,
      }}>↺ Restart Session</button>
    </div>
  );
}

export default function QuizView({ srs = {}, known, onRate, themeColor = '#c77dff', godMode, studyMode = 'flip_es_en', voices = [] }) {
  const [queue, setQueue]         = useState(() => getDueQueue(srs));
  const [idx, setIdx]             = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [sessionEasy, setEasy]    = useState(0);
  const [sessionAgain, setAgain]  = useState(0);
  const [anim, setAnim]           = useState('');
  const [typeMode, setTypeMode]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('lucid_quiz_typemode') ?? 'false'); } catch { return false; }
  });
  const [typeInput, setTypeInput] = useState('');
  const [typeResult, setTypeResult] = useState(null); // null | 'correct' | 'wrong'
  const cardRef = useRef(null);
  const inputRef = useRef(null);

  const card = queue[idx];
  const isDone = !card && (sessionEasy + sessionAgain > 0);

  const toggleTypeMode = () => setTypeMode(m => {
    const next = !m;
    localStorage.setItem('lucid_quiz_typemode', JSON.stringify(next));
    return next;
  });

  // refresh when srs changes and we've run out of cards mid-session
  useEffect(() => {
    if (!card && sessionEasy + sessionAgain === 0) {
      setQueue(getDueQueue(srs));
      setIdx(0);
    }
  }, [srs, card, sessionEasy, sessionAgain]);

  // reset type input on card change
  useEffect(() => { setTypeInput(''); setTypeResult(null); }, [idx]);

  // auto-focus input in type mode
  useEffect(() => {
    if (typeMode && inputRef.current) inputRef.current.focus();
  }, [idx, typeMode]);

  const showFront = studyMode === 'flip_en_es' ? card?.en : card?.es;
  const showBack  = studyMode === 'flip_en_es' ? card?.es : card?.en;

  const speak = useCallback((text) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US'; utt.rate = 0.82; utt.pitch = 1.05;
    const pref = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
    if (pref) utt.voice = pref;
    window.speechSynthesis.speak(utt);
  }, [voices]);

  const answer = useCallback((type) => {
    if (!card) return;
    const yes = type === 'easy';
    setAnim(yes ? 'easy' : 'again');
    setTimeout(() => setAnim(''), 600);
    onRate(card.id, yes);
    if (yes) setEasy(e => e + 1);
    else {
      setAgain(a => a + 1);
      setQueue(prev => [...prev, card]);
    }
    setTimeout(() => {
      setFlipped(false);
      setIdx(i => i + 1);
    }, 280);
  }, [card, onRate]);

  const submitAnswer = useCallback(() => {
    if (!typeInput.trim() || typeResult) return;
    const correct = fuzzyMatch(typeInput, showBack ?? '');
    setTypeResult(correct ? 'correct' : 'wrong');
    if (correct) {
      if (card?.en) speak(card.en);
      setTimeout(() => answer('easy'), 700);
    } else {
      setTimeout(() => answer('again'), 1600);
    }
  }, [typeInput, typeResult, showBack, answer, card, speak]);

  const handleReveal = () => {
    if (!flipped && !typeMode) {
      setFlipped(true);
      if (card?.en) speak(card.en);
    }
  };

  const restart = () => {
    setQueue(getDueQueue(srs));
    setIdx(0);
    setEasy(0);
    setAgain(0);
    setFlipped(false);
    setTypeInput('');
    setTypeResult(null);
  };

  if (isDone || !card) {
    return <CompletionScreen easy={sessionEasy} again={sessionAgain} onRestart={restart} />;
  }

  const total = queue.length;
  const progress = total > 0 ? Math.round((idx / total) * 100) : 0;
  const tc = godMode ? C.gold : themeColor;

  const catLabel = (() => {
    for (const [cat, items] of Object.entries(PHRASES)) {
      if (items.some(i => i.id === card.id)) return cat;
    }
    for (const [cat, items] of Object.entries(SLANG)) {
      if (items.some(i => i.id === card.id)) return cat;
    }
    return '';
  })();

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'12px 14px 4px' }}>
      <style>{`
        @keyframes easyFloat{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-10px) scale(1.03);filter:brightness(1.5)}100%{transform:translateY(0) scale(1)}}
        @keyframes shakeCard{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-7px)}80%{transform:translateX(7px)}}
        @keyframes revealIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes correctPop{0%{transform:scale(0.85);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes wrongShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        .quiz-type-input:focus{border-color:${tc} !important;box-shadow:0 0 0 2px ${tc}33 !important;outline:none}
      `}</style>

      {/* Progress bar + type mode toggle */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ flex:1, height:4, background:C.ghost, borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${tc},${C.cyan})`, transition:'width .4s ease', borderRadius:2 }}/>
        </div>
        <span style={{ color:C.dim, fontSize:11, minWidth:36, textAlign:'right', fontFamily:"'Space Mono',monospace" }}>{idx+1}/{total}</span>
        <button
          onClick={toggleTypeMode}
          title={typeMode ? 'Switch to reveal mode' : 'Switch to type mode'}
          style={{
            padding:'4px 10px', borderRadius:8, fontSize:12, fontWeight:800,
            background: typeMode ? `${tc}22` : 'rgba(255,255,255,0.04)',
            border:`1px solid ${typeMode ? tc : C.dim}55`,
            color: typeMode ? tc : C.dim,
            cursor:'pointer', fontFamily:"'Outfit',sans-serif", flexShrink:0,
            transition:'all .15s',
          }}
        >⌨️</button>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        onClick={!typeMode ? handleReveal : undefined}
        style={{
          flex:1,
          background:`linear-gradient(145deg,${C.card},${C.glass})`,
          border:`1.5px solid ${tc}${flipped || typeResult ? 'aa' : '33'}`,
          borderRadius:24, padding:'28px 24px',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          cursor: (!typeMode && !flipped) ? 'pointer' : 'default',
          userSelect:'none',
          boxShadow: (flipped || typeResult) ? `0 0 28px ${tc}33,inset 0 0 40px ${tc}11` : `0 0 16px ${tc}18`,
          transition:'border-color .3s, box-shadow .3s',
          animation: anim === 'easy' ? 'easyFloat .55s ease-out' : anim === 'again' ? 'shakeCard .5s ease-out' : 'none',
          minHeight:260,
        }}
      >
        {/* Category */}
        <div style={{ fontSize:11, color:C.dim, letterSpacing:3, marginBottom:16, fontFamily:"'Space Mono',monospace", textTransform:'uppercase' }}>
          {catLabel}
        </div>

        {/* Front word */}
        <div style={{
          fontFamily:"'Bebas Neue',display", fontSize: showFront && showFront.length > 20 ? 32 : 48,
          color:tc, letterSpacing:2, textAlign:'center', lineHeight:1.1,
          textShadow:`0 0 20px ${tc}55`,
        }}>
          {showFront}
        </div>

        {/* Reveal mode: TAP TO REVEAL hint */}
        {!typeMode && !flipped && (
          <div style={{ marginTop:24, color:C.dim, fontSize:12, letterSpacing:2, fontFamily:"'Space Mono',monospace" }}>
            TAP TO REVEAL
          </div>
        )}

        {/* Reveal mode: flipped content */}
        {!typeMode && flipped && (
          <div style={{ marginTop:24, width:'100%', borderTop:`1px solid ${C.dim}33`, paddingTop:20, textAlign:'center', animation:'revealIn .3s ease' }}>
            <div style={{ fontSize:22, color:C.silver, fontWeight:700, marginBottom: card?.meaning ? 10 : 0 }}>
              {showBack}
            </div>
            {card?.meaning && (
              <div style={{ background:`${tc}11`, border:`1px solid ${tc}22`, borderRadius:12, padding:'9px 14px', fontSize:13, color:`${C.silver}cc`, lineHeight:1.4, marginTop:8 }}>
                {card.meaning}
              </div>
            )}
          </div>
        )}

        {/* Type mode: input field */}
        {typeMode && !typeResult && (
          <div style={{ marginTop:20, width:'100%' }} onClick={e => e.stopPropagation()}>
            <input
              ref={inputRef}
              className="quiz-type-input"
              value={typeInput}
              onChange={e => setTypeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitAnswer()}
              placeholder="type in English…"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              style={{
                width:'100%', padding:'14px 16px', borderRadius:14, fontSize:16,
                background:C.ghost, border:`1.5px solid ${C.dim}55`,
                color:C.silver, fontFamily:"'Outfit',sans-serif",
                boxSizing:'border-box', transition:'border-color .2s, box-shadow .2s',
              }}
            />
            <button
              onClick={e => { e.stopPropagation(); submitAnswer(); }}
              style={{
                width:'100%', marginTop:10, padding:'14px 0', borderRadius:14,
                background:`${tc}18`, border:`1.5px solid ${tc}55`, color:tc,
                fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              }}
            >Check →</button>
          </div>
        )}

        {/* Type mode: correct result */}
        {typeMode && typeResult === 'correct' && (
          <div style={{ marginTop:20, textAlign:'center', animation:'correctPop .4s ease' }}>
            <div style={{ color:C.bio, fontSize:28, fontWeight:900, marginBottom:6 }}>✓ Correct!</div>
            <div style={{ color:`${C.silver}99`, fontSize:14 }}>{showBack}</div>
          </div>
        )}

        {/* Type mode: wrong result */}
        {typeMode && typeResult === 'wrong' && (
          <div style={{ marginTop:20, textAlign:'center', animation:'wrongShake .4s ease' }}>
            <div style={{ color:C.red, fontSize:15, fontWeight:800, marginBottom:8 }}>✗ The answer was:</div>
            <div style={{ color:C.silver, fontSize:24, fontWeight:700 }}>{showBack}</div>
            {card?.meaning && (
              <div style={{ color:`${C.silver}77`, fontSize:12, marginTop:8, fontStyle:'italic' }}>{card.meaning}</div>
            )}
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div style={{ padding:'14px 0 4px' }}>
        {typeMode ? (
          <div style={{ textAlign:'center', color:C.dim, fontSize:12, padding:'8px 0', fontFamily:"'Space Mono',monospace" }}>
            {typeResult ? (typeResult === 'correct' ? '✓ Moving to next…' : '✗ Try again next round…') : 'Type · press Enter to check'}
          </div>
        ) : flipped ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <button onClick={() => answer('again')} style={{
              padding:'18px 0', borderRadius:16, fontSize:17, fontWeight:800, letterSpacing:0.5,
              background:'rgba(255,0,68,0.12)', border:`1.5px solid ${C.red}66`, color:C.red,
              cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              boxShadow:`0 4px 20px ${C.red}22`,
            }}>✗ AGAIN</button>
            <button onClick={() => answer('easy')} style={{
              padding:'18px 0', borderRadius:16, fontSize:17, fontWeight:800, letterSpacing:0.5,
              background:`${C.bio}12`, border:`1.5px solid ${C.bio}66`, color:C.bio,
              cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              boxShadow:`0 4px 20px ${C.bio}22`,
            }}>✓ EASY</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <button onClick={() => answer('again')} style={{
              padding:'16px 0', borderRadius:16, fontSize:14, fontWeight:700,
              background:'rgba(255,0,68,0.07)', border:`1px solid ${C.red}44`, color:`${C.red}aa`,
              cursor:'pointer', fontFamily:"'Outfit',sans-serif",
            }}>✗ Again (3m)</button>
            <button onClick={handleReveal} style={{
              padding:'16px 0', borderRadius:16, fontSize:15, fontWeight:800,
              background:`${C.bio}12`, border:`1.5px solid ${C.bio}55`, color:C.bio,
              cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              boxShadow:`0 4px 16px ${C.bio}22`,
            }}>Reveal →</button>
          </div>
        )}
      </div>

      {/* Session stats */}
      <div style={{ display:'flex', justifyContent:'center', gap:24, paddingBottom:10, paddingTop:4 }}>
        <span style={{ color:C.bio, fontSize:12, fontFamily:"'Space Mono',monospace" }}>✓ Easy: {sessionEasy}</span>
        <span style={{ color:C.red, fontSize:12, fontFamily:"'Space Mono',monospace" }}>✗ Again: {sessionAgain}</span>
        <span style={{ color:C.dim, fontSize:12, fontFamily:"'Space Mono',monospace" }}>+2 XP next</span>
      </div>
    </div>
  );
}
