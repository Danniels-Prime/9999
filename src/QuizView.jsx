import { useState, useRef, useEffect, useCallback } from 'react';
import { PHRASES, SLANG, CATEGORY_THEMES } from './langData';
import TappableText from './TappableText';
import WordPopup from './WordPopup';
import { lookupWordAI } from './aiLookup';

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

/* ── Category list for filter picker ── */
const ALL_CATS = [
  { key:'__all__', label:'All Due', icon:'📋', items: null },
  ...Object.entries(PHRASES).map(([k, items]) => ({
    key: k,
    label: CATEGORY_THEMES[k]?.label || k,
    icon: CATEGORY_THEMES[k]?.icon || '📚',
    items,
  })),
  ...Object.entries(SLANG).map(([k, items]) => ({
    key: k,
    label: CATEGORY_THEMES[k]?.label || k,
    icon: CATEGORY_THEMES[k]?.icon || '💬',
    items,
  })),
];

/* ── Emoji map for concrete nouns ── */
const WORD_EMOJI = {
  'water':'💧','coffee':'☕','milk':'🥛','juice':'🧃',
  'bread':'🍞','meat':'🥩','chicken':'🍗','fish':'🐟',
  'vegetables':'🥦','vegetable':'🥦','beer':'🍺','wine':'🍷',
  'tea':'🍵','apple':'🍎','egg':'🥚','eggs':'🥚',
  'rice':'🍚','pasta':'🍝','pizza':'🍕','burger':'🍔',
  'salad':'🥗','soup':'🍲','ice cream':'🍦','cake':'🎂',
  'cookie':'🍪','phone':'📱','book':'📚','car':'🚗',
  'house':'🏠','dog':'🐕','cat':'🐈','sun':'☀️',
  'moon':'🌙','star':'⭐','money':'💰','music':'🎵',
  'computer':'💻','shirt':'👕','shoes':'👟','hat':'🎩',
  'bus':'🚌','train':'🚂','plane':'✈️','boat':'⛵',
  'clock':'⏰','key':'🔑','door':'🚪','window':'🪟',
  'tree':'🌳','flower':'🌸','rain':'🌧️','snow':'❄️',
};

function getWordEmoji(en) {
  if (!en) return null;
  const lower = en.toLowerCase().trim();
  return WORD_EMOJI[lower] || null;
}

function getDueQueue(srs, catItems = null, weakOnly = false) {
  const pool = catItems ?? ALL_VOCAB;
  const now = Date.now();
  if (weakOnly) {
    const weak = pool.filter(v => srs[v.id]?.reps === 0 || (srs[v.id] && now >= srs[v.id].nextReview));
    return weak.length > 0 ? weak.slice(0, 20) : pool.slice(0, 20);
  }
  const due = pool.filter(v => { const s = srs[v.id]; return !s || now >= s.nextReview; });
  return due.length > 0 ? due.slice(0, 20) : pool.slice(0, 20);
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

/* ── Pair Match mini-game ── */
function PairMatch({ items, onRate, tc }) {
  const pick = useCallback(() => {
    const pool = [...items].sort(() => Math.random() - 0.5).slice(0, 5);
    const tiles = [
      ...pool.map(it => ({ id: it.id, side: 'es', text: it.es.split('/')[0].trim(), item: it })),
      ...pool.map(it => ({ id: it.id, side: 'en', text: it.en.split('/')[0].trim(), item: it })),
    ].sort(() => Math.random() - 0.5);
    return { pool, tiles };
  }, [items]);

  const [state, setState] = useState(() => pick());
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState(new Set());
  const [wrong, setWrong] = useState(new Set());
  const [done, setDone] = useState(false);

  const reset = useCallback(() => {
    const s = pick();
    setState(s);
    setSelected(null);
    setMatched(new Set());
    setWrong(new Set());
    setDone(false);
  }, [pick]);

  const handleTap = (tileIdx) => {
    const tile = state.tiles[tileIdx];
    if (matched.has(tile.id + tile.side)) return;
    if (wrong.has(tileIdx)) return;

    if (selected === null) {
      setSelected(tileIdx);
      return;
    }
    if (selected === tileIdx) { setSelected(null); return; }

    const selTile = state.tiles[selected];
    if (selTile.id === tile.id && selTile.side !== tile.side) {
      const nm = new Set(matched);
      nm.add(tile.id + tile.side);
      nm.add(selTile.id + selTile.side);
      setMatched(nm);
      setSelected(null);
      onRate(tile.id, true);
      if (nm.size === state.tiles.length) setDone(true);
    } else {
      const nw = new Set([tileIdx, selected]);
      setWrong(nw);
      setSelected(null);
      setTimeout(() => setWrong(new Set()), 700);
    }
  };

  if (done) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, gap:16 }}>
      <div style={{ fontSize:48 }}>🎉</div>
      <div style={{ color:C.bio, fontFamily:"'Bebas Neue',display", fontSize:28, letterSpacing:2 }}>¡PERFECTO!</div>
      <button onClick={reset} style={{
        padding:'12px 28px', borderRadius:14, fontSize:15, fontWeight:700,
        background:`${tc}22`, border:`1.5px solid ${tc}66`, color:tc,
        cursor:'pointer', fontFamily:"'Outfit',sans-serif",
      }}>Next Round →</button>
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:'auto' }}>
      <div style={{ fontSize:11, color:C.dim, textAlign:'center', marginBottom:10, fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>
        TAP MATCHING PAIRS
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {state.tiles.map((tile, i) => {
          const isMatched = matched.has(tile.id + tile.side);
          const isWrong   = wrong.has(i);
          const isSel     = selected === i;
          return (
            <button key={i} onClick={() => !isMatched && handleTap(i)} style={{
              padding:'12px 8px', borderRadius:14, fontSize:12, fontWeight:700, textAlign:'center',
              lineHeight:1.3, cursor: isMatched ? 'default' : 'pointer',
              background: isMatched ? `${C.bio}18` : isSel ? `${tc}22` : isWrong ? `${C.red}18` : C.card,
              border: `1.5px solid ${isMatched ? C.bio : isSel ? tc : isWrong ? C.red : C.dim}${isMatched||isSel||isWrong?'aa':'44'}`,
              color: isMatched ? C.bio : isSel ? tc : isWrong ? C.red : tile.side === 'es' ? '#FFD700' : C.silver,
              opacity: isMatched ? 0.5 : 1,
              transition:'all .15s',
              fontFamily:"'Outfit',sans-serif",
            }}>
              <div style={{ fontSize:9, color:isMatched?C.bio:tile.side==='es'?'#FFD70099':`${tc}99`, marginBottom:3, letterSpacing:1 }}>
                {tile.side === 'es' ? '🇪🇸' : '🇺🇸'}
              </div>
              {tile.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const LS_PROVIDER = 'lucid_ai_provider';
const PROVIDERS = ['claude','openai','openrouter','deepseek','custom'];

export default function QuizView({ srs = {}, known, onRate, themeColor = '#c77dff', godMode, studyMode = 'flip_es_en', voices = [], defMode = false, autoRead = true, apiKey = '', openaiKey = '', openrouterKey = '', deepseekKey = '', customEndpoint = '', customKey = '', customModel = '' }) {
  const [selectedCat, setSelectedCat] = useState('__all__');
  const [queue, setQueue]             = useState(() => getDueQueue(srs, null, studyMode === 'weak'));
  const [idx, setIdx]                 = useState(0);
  const [flipped, setFlipped]         = useState(studyMode === 'flip_both');
  const [sessionEasy, setEasy]        = useState(0);
  const [sessionAgain, setAgain]      = useState(0);
  const [anim, setAnim]               = useState('');
  const [typeInput, setTypeInput]     = useState('');
  const [typeResult, setTypeResult]   = useState(null);
  const [timeLeft, setTimeLeft]       = useState(30);
  const cardRef      = useRef(null);
  const inputRef     = useRef(null);
  const catRowRef    = useRef(null);
  const wordCacheRef = useRef({});
  const [popup, setPopup] = useState(null);

  const isTypeMode   = studyMode === 'type' || studyMode === 'listen';
  const isMatchMode  = studyMode === 'match';
  const isSpeedMode  = studyMode === 'speed';
  const isBothMode   = studyMode === 'flip_both';
  const isImmersion  = studyMode === 'flip_def';
  const isWeakMode   = studyMode === 'weak';

  const card   = queue[idx];
  const isDone = !card && (sessionEasy + sessionAgain > 0);

  /* ── Direction logic ── */
  const isReversedDir = !isImmersion && (studyMode === 'flip_en_es' ||
    (studyMode === 'flip_random' && card?.id.charCodeAt(card.id.length - 1) % 2 === 1));

  const showFront = isImmersion ? card?.en : (isReversedDir ? card?.en : card?.es);
  const showBack  = isImmersion
    ? (card?.meaning || card?.en)
    : (isReversedDir ? card?.es : card?.en);
  const frontLangLabel = isImmersion ? '🇺🇸 EN' : (isReversedDir ? '🇺🇸 EN' : '🇪🇸 ES');
  const backLangLabel  = isImmersion ? '📖 MEANING' : (isReversedDir ? '🇪🇸 ES' : '🇺🇸 EN');

  const revealPrimary   = (defMode && !isImmersion && card?.meaning) ? card.meaning : showBack;
  const revealSecondary = (defMode && !isImmersion && card?.meaning) ? showBack : null;

  const speak = useCallback((text) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US'; utt.rate = 0.82; utt.pitch = 1.05;
    const pref = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
    if (pref) utt.voice = pref;
    window.speechSynthesis.speak(utt);
  }, [voices]);

  const provider = (() => {
    const saved = localStorage.getItem(LS_PROVIDER);
    return PROVIDERS.includes(saved) ? saved : 'claude';
  })();
  const aiCfg = { provider, claudeKey: apiKey, openaiKey, openrouterKey, deepseekKey, customEndpoint, customKey, customModel };

  const handleWordTap = useCallback(async (word, sentence) => {
    const key = word.toLowerCase();
    if (wordCacheRef.current[key]) {
      setPopup({ word, data: wordCacheRef.current[key], loading: false, error: null });
      return;
    }
    setPopup({ word, data: null, loading: true, error: null });
    try {
      const data = await lookupWordAI(word, aiCfg, sentence);
      wordCacheRef.current[key] = data;
      setPopup({ word, data, loading: false, error: null });
    } catch (e) {
      setPopup({ word, data: null, loading: false, error: e.message === 'no_key' ? 'no_key' : e.message });
    }
  }, [apiKey, openaiKey, openrouterKey, deepseekKey, customEndpoint, customKey, customModel]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Refresh queue when empty at session start ── */
  useEffect(() => {
    if (!card && sessionEasy + sessionAgain === 0) {
      const cat = ALL_CATS.find(c => c.key === selectedCat);
      setQueue(getDueQueue(srs, cat?.items ?? null, isWeakMode));
      setIdx(0);
    }
  }, [srs, card, sessionEasy, sessionAgain, selectedCat, isWeakMode]);

  /* ── Reset type input on card change ── */
  useEffect(() => { setTypeInput(''); setTypeResult(null); }, [idx]);

  /* ── Auto-focus input in type/listen mode ── */
  useEffect(() => {
    if (isTypeMode && inputRef.current) inputRef.current.focus();
  }, [idx, isTypeMode]);

  /* ── flip_both: always show both sides ── */
  useEffect(() => {
    setFlipped(isBothMode);
  }, [idx, isBothMode]);

  /* ── Auto-play audio on new card ── */
  useEffect(() => {
    if (!card) return;
    if (studyMode === 'listen') {
      const t = setTimeout(() => speak(card.en), 400);
      return () => clearTimeout(t);
    }
    if (!isTypeMode) {
      const t = setTimeout(() => speak(card.en), 350);
      return () => clearTimeout(t);
    }
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auto-speak example sentence on card reveal ── */
  useEffect(() => {
    if (!flipped || !autoRead || !card?.en_ex || isTypeMode) return;
    const utt = new SpeechSynthesisUtterance(card.en_ex);
    utt.lang = 'en-US'; utt.rate = 0.82; utt.pitch = 1.05;
    const pref = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
    if (pref) utt.voice = pref;
    window.speechSynthesis.speak(utt);
    return () => window.speechSynthesis.cancel();
  }, [flipped]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Speed mode: 30-second countdown ── */
  useEffect(() => {
    if (!isSpeedMode) { setTimeLeft(30); return; }
    setTimeLeft(30);
    const t = setInterval(() => setTimeLeft(s => {
      if (s <= 1) { clearInterval(t); answer('again'); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [idx, isSpeedMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setFlipped(isBothMode);
      setIdx(i => i + 1);
    }, 280);
  }, [card, onRate, isBothMode]);

  const submitAnswer = useCallback(() => {
    if (!typeInput.trim() || typeResult) return;
    const correct = fuzzyMatch(typeInput, card?.en ?? '');
    setTypeResult(correct ? 'correct' : 'wrong');
    if (correct) {
      if (card?.en) speak(card.en);
      setTimeout(() => answer('easy'), 700);
    } else {
      setTimeout(() => answer('again'), 1600);
    }
  }, [typeInput, typeResult, card, speak, answer]);

  const handleReveal = () => {
    if (!flipped && !isTypeMode) {
      setFlipped(true);
      if (card?.en) speak(card.en);
    }
  };

  const handleCatChange = (catKey) => {
    const cat = ALL_CATS.find(c => c.key === catKey);
    setSelectedCat(catKey);
    setQueue(getDueQueue(srs, cat?.items ?? null, isWeakMode));
    setIdx(0);
    setEasy(0);
    setAgain(0);
    setFlipped(isBothMode);
    setTypeInput('');
    setTypeResult(null);
  };

  const restart = () => {
    const cat = ALL_CATS.find(c => c.key === selectedCat);
    setQueue(getDueQueue(srs, cat?.items ?? null, isWeakMode));
    setIdx(0);
    setEasy(0);
    setAgain(0);
    setFlipped(isBothMode);
    setTypeInput('');
    setTypeResult(null);
  };

  if (isDone || !card) {
    return <CompletionScreen easy={sessionEasy} again={sessionAgain} onRestart={restart} />;
  }

  const total    = queue.length;
  const progress = total > 0 ? Math.round((idx / total) * 100) : 0;
  const tc       = godMode ? C.gold : themeColor;
  const emoji    = getWordEmoji(card?.en);

  const catLabel = (() => {
    for (const [cat, items] of Object.entries(PHRASES)) {
      if (items.some(i => i.id === card.id)) return CATEGORY_THEMES[cat]?.label || cat;
    }
    for (const [cat, items] of Object.entries(SLANG)) {
      if (items.some(i => i.id === card.id)) return CATEGORY_THEMES[cat]?.label || cat;
    }
    return '';
  })();

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'8px 14px 4px' }}>
      <style>{`
        @keyframes easyFloat{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-10px) scale(1.03);filter:brightness(1.5)}100%{transform:translateY(0) scale(1)}}
        @keyframes shakeCard{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-7px)}80%{transform:translateX(7px)}}
        @keyframes revealIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes correctPop{0%{transform:scale(0.85);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes wrongShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        .quiz-type-input:focus{border-color:${tc} !important;box-shadow:0 0 0 2px ${tc}33 !important;outline:none}
        .cat-row::-webkit-scrollbar{display:none}
      `}</style>

      {/* Category filter row */}
      <div ref={catRowRef} className="cat-row" style={{
        display:'flex', overflowX:'auto', gap:6, paddingBottom:8, marginBottom:4,
        scrollbarWidth:'none', WebkitOverflowScrolling:'touch', flexShrink:0,
      }}>
        {ALL_CATS.map(cat => {
          const active = selectedCat === cat.key;
          const dueInCat = cat.items
            ? getDueQueue(srs, cat.items).length
            : getDueQueue(srs).length;
          return (
            <button key={cat.key} onClick={() => handleCatChange(cat.key)} style={{
              flexShrink:0, padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:700,
              background: active ? `${tc}22` : 'rgba(255,255,255,0.04)',
              border:`1px solid ${active ? tc : C.dim}55`,
              color: active ? tc : C.dim,
              cursor:'pointer', fontFamily:"'Space Mono',monospace", whiteSpace:'nowrap',
              transition:'all .15s',
            }}>
              {cat.key === '__all__' ? `All Due (${dueInCat})` : `${cat.icon} ${cat.label}`}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: isSpeedMode ? 6 : 12, flexShrink:0 }}>
        <div style={{ flex:1, height:4, background:C.ghost, borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${tc},${C.cyan})`, transition:'width .4s ease', borderRadius:2 }}/>
        </div>
        <span style={{ color:C.dim, fontSize:11, minWidth:36, textAlign:'right', fontFamily:"'Space Mono',monospace" }}>{idx+1}/{total}</span>
      </div>

      {/* Speed mode timer bar */}
      {isSpeedMode && (
        <div style={{ marginBottom:8, flexShrink:0 }}>
          <div style={{ height:6, background:C.ghost, borderRadius:3, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:3,
              width:`${(timeLeft / 30) * 100}%`,
              background: timeLeft <= 10 ? C.red : timeLeft <= 20 ? '#FFD700' : C.bio,
              transition:'width 1s linear, background .5s',
            }}/>
          </div>
          <div style={{ fontSize:11, color: timeLeft <= 10 ? C.red : C.dim, textAlign:'right', marginTop:2, fontFamily:"'Space Mono',monospace" }}>
            {timeLeft}s
          </div>
        </div>
      )}

      {/* Match mode: inline pair game */}
      {isMatchMode ? (
        <PairMatch items={queue} onRate={(id, yes) => onRate(id, yes)} tc={tc} />
      ) : (

      /* Card */
      <div
        ref={cardRef}
        onClick={!isTypeMode && !isBothMode ? handleReveal : undefined}
        style={{
          flex:1, overflowY:'auto',
          background:`linear-gradient(145deg,${C.card},${C.glass})`,
          border:`1.5px solid ${tc}${flipped || typeResult ? 'aa' : '33'}`,
          borderRadius:24, padding:'24px 20px',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          cursor: (!isTypeMode && !isBothMode && !flipped) ? 'pointer' : 'default',
          userSelect:'none',
          boxShadow: (flipped || typeResult) ? `0 0 28px ${tc}33,inset 0 0 40px ${tc}11` : `0 0 16px ${tc}18`,
          transition:'border-color .3s, box-shadow .3s',
          animation: anim === 'easy' ? 'easyFloat .55s ease-out' : anim === 'again' ? 'shakeCard .5s ease-out' : 'none',
          minHeight:200,
        }}
      >
        {/* Category label */}
        <div style={{ fontSize:10, color:C.dim, letterSpacing:3, marginBottom:12, fontFamily:"'Space Mono',monospace", textTransform:'uppercase' }}>
          {catLabel}
        </div>

        {/* Word emoji (for concrete nouns) */}
        {emoji && (
          <div style={{ fontSize:48, marginBottom:8, lineHeight:1, filter:`drop-shadow(0 0 10px ${tc}44)` }}>
            {emoji}
          </div>
        )}

        {/* Lang label */}
        <div style={{ fontSize:10, color:C.dim, fontWeight:800, letterSpacing:1, marginBottom:4 }}>
          {frontLangLabel}
        </div>

        {/* Front word */}
        <div style={{
          fontFamily:"'Bebas Neue',display", fontSize: showFront && showFront.length > 20 ? 32 : 48,
          color:tc, letterSpacing:2, textAlign:'center', lineHeight:1.1,
          textShadow:`0 0 20px ${tc}55`,
        }}>
          <TappableText text={showFront || ''} onWordTap={handleWordTap} accentColor={tc} />
        </div>

        {/* listen mode: tap to hear button */}
        {studyMode === 'listen' && !typeResult && (
          <button
            onClick={e => { e.stopPropagation(); speak(card.en); }}
            style={{
              marginTop:16, padding:'10px 20px', borderRadius:12, fontSize:22,
              background:`${tc}18`, border:`1.5px solid ${tc}55`, cursor:'pointer',
              color:tc, transition:'all .15s',
            }}
          >🔊 Play Again</button>
        )}

        {/* Reveal mode: TAP TO REVEAL hint */}
        {!isTypeMode && !flipped && !isBothMode && (
          <div style={{ marginTop:20, color:C.dim, fontSize:12, letterSpacing:2, fontFamily:"'Space Mono',monospace" }}>
            TAP TO REVEAL
          </div>
        )}

        {/* Reveal mode OR both mode: flipped content */}
        {!isTypeMode && flipped && (
          <div style={{ marginTop:20, width:'100%', borderTop:`1px solid ${C.dim}33`, paddingTop:18, textAlign:'center', animation: isBothMode ? 'none' : 'revealIn .3s ease' }}>
            <div style={{ fontSize:11, color:tc, fontWeight:800, letterSpacing:1, marginBottom:8 }}>
              {backLangLabel}
            </div>
            {/* Primary reveal */}
            <div style={{
              fontSize: (isImmersion || defMode) ? 20 : 26,
              color: C.silver,
              fontWeight: 700,
              marginBottom:10, lineHeight:1.4,
            }}>
              <TappableText text={isImmersion ? (showBack || '') : (revealPrimary || '')} onWordTap={handleWordTap} accentColor={tc} />
            </div>
            {/* In defMode (non-immersion): show EN word below meaning */}
            {!isImmersion && revealSecondary && (
              <div style={{ fontSize:15, color:`${C.silver}99`, fontWeight:600, marginBottom:10 }}>
                🇺🇸 <TappableText text={revealSecondary} onWordTap={handleWordTap} accentColor={tc} />
              </div>
            )}
            {/* Meaning pill (non-immersion, non-defMode) */}
            {!isImmersion && !defMode && card?.meaning && (
              <div style={{ background:`${tc}11`, border:`1px solid ${tc}22`, borderRadius:12, padding:'10px 16px', fontSize:15, color:C.silver, fontWeight:600, lineHeight:1.4, marginTop:6 }}>
                {card.meaning}
              </div>
            )}
            {/* Example sentences */}
            {(card?.en_ex || (!isImmersion && card?.es_ex)) && (
              <div style={{ marginTop:14, paddingTop:10 }}>
                {card.en_ex && (
                  <div style={{ fontSize:14, color:`${C.silver}bb`, lineHeight:1.6, fontStyle:'italic', marginBottom:6 }}>
                    🇺🇸 "<TappableText text={card.en_ex} onWordTap={handleWordTap} accentColor={tc} />"
                  </div>
                )}
                {!isImmersion && !defMode && card.es_ex && (
                  <div style={{ fontSize:13, color:`${C.silver}77`, lineHeight:1.5, fontStyle:'italic' }}>
                    🇪🇸 "<TappableText text={card.es_ex} onWordTap={handleWordTap} accentColor={tc} />"
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Type/Listen mode: input field */}
        {isTypeMode && !typeResult && (
          <div style={{ marginTop:20, width:'100%' }} onClick={e => e.stopPropagation()}>
            <input
              ref={inputRef}
              className="quiz-type-input"
              value={typeInput}
              onChange={e => setTypeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitAnswer()}
              placeholder={studyMode === 'listen' ? 'type what you heard…' : 'type in English…'}
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
        {isTypeMode && typeResult === 'correct' && (
          <div style={{ marginTop:20, textAlign:'center', animation:'correctPop .4s ease' }}>
            <div style={{ color:C.bio, fontSize:28, fontWeight:900, marginBottom:6 }}>✓ Correct!</div>
            <div style={{ color:`${C.silver}99`, fontSize:14 }}><TappableText text={card?.en || ''} onWordTap={handleWordTap} accentColor={tc} /></div>
            {card?.en_ex && (
              <div style={{ fontSize:12, color:`${C.dim}`, fontStyle:'italic', marginTop:8, lineHeight:1.4 }}>
                "<TappableText text={card.en_ex} onWordTap={handleWordTap} accentColor={tc} />"
              </div>
            )}
          </div>
        )}

        {/* Type mode: wrong result */}
        {isTypeMode && typeResult === 'wrong' && (
          <div style={{ marginTop:20, textAlign:'center', animation:'wrongShake .4s ease' }}>
            <div style={{ color:C.red, fontSize:15, fontWeight:800, marginBottom:8 }}>✗ The answer was:</div>
            <div style={{ color:C.silver, fontSize:24, fontWeight:700 }}><TappableText text={card?.en || ''} onWordTap={handleWordTap} accentColor={tc} /></div>
            {card?.meaning && (
              <div style={{ color:`${C.silver}77`, fontSize:12, marginTop:6, fontStyle:'italic' }}><TappableText text={card.meaning} onWordTap={handleWordTap} accentColor={tc} /></div>
            )}
            {card?.en_ex && (
              <div style={{ fontSize:11, color:`${C.dim}`, fontStyle:'italic', marginTop:6, lineHeight:1.4 }}>
                "<TappableText text={card.en_ex} onWordTap={handleWordTap} accentColor={tc} />"
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Bottom buttons (not shown in match mode) */}
      {!isMatchMode && (
        <div style={{ padding:'12px 0 4px', flexShrink:0 }}>
          {isTypeMode ? (
            <div style={{ textAlign:'center', color:C.dim, fontSize:12, padding:'8px 0', fontFamily:"'Space Mono',monospace" }}>
              {typeResult ? (typeResult === 'correct' ? '✓ Moving to next…' : '✗ Try again next round…') : 'Type · press Enter to check'}
            </div>
          ) : flipped || isBothMode ? (
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
      )}

      {/* Session stats */}
      <div style={{ display:'flex', justifyContent:'center', gap:24, paddingBottom:8, paddingTop:2, flexShrink:0 }}>
        <span style={{ color:C.bio, fontSize:12, fontFamily:"'Space Mono',monospace" }}>✓ Easy: {sessionEasy}</span>
        <span style={{ color:C.red, fontSize:12, fontFamily:"'Space Mono',monospace" }}>✗ Again: {sessionAgain}</span>
        <span style={{ color:C.dim, fontSize:12, fontFamily:"'Space Mono',monospace" }}>+2 XP next</span>
      </div>
      {popup && (
        <WordPopup
          word={popup.word}
          data={popup.data}
          loading={popup.loading}
          error={popup.error}
          onClose={() => setPopup(null)}
          themeColor={godMode ? '#FFD700' : themeColor}
        />
      )}
    </div>
  );
}
