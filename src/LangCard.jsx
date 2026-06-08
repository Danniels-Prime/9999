import { useState, useCallback } from 'react';

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
  'clock':'⏰','key':'🔑','door':'🚪','tree':'🌳',
  'flower':'🌸','rain':'🌧️','snow':'❄️',
};

function getWordEmoji(en) {
  if (!en) return null;
  return WORD_EMOJI[en.toLowerCase().trim()] || null;
}

function MiniWave({ color }) {
  return (
    <span style={{ display:'inline-flex', gap:'2px', alignItems:'center', height:'14px' }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          display:'inline-block', width:'2px', height:'100%',
          borderRadius:'1px', background:color, transformOrigin:'bottom',
          animation:`waveBar .7s ${i*0.12}s ease-in-out infinite`,
        }}/>
      ))}
    </span>
  );
}

function fuzzyMatch(input, target) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const inp = norm(input);
  return target.split(/[/,]/).map(t => norm(t.trim())).some(t => t === inp);
}

export default function LangCard({ item, theme, isFlipped, onFlip, index, godMode, isPlaying, onSpeak, rateStatus, onRate, studyMode, defMode = false }) {
  const [typeInput, setTypeInput]   = useState('');
  const [typeResult, setTypeResult] = useState(null); // null | 'correct' | 'wrong'
  const [showInput, setShowInput]   = useState(false);
  const [listenPhase, setListenPhase] = useState('idle'); // idle | typing | done

  const cc       = godMode ? '#FFD700' : theme.color;
  const fs_es    = item.es.length > 26 ? '11px' : item.es.length > 18 ? '13px' : item.es.length > 12 ? '15px' : '17px';
  const fs_en    = item.en.length > 30 ? '16px' : item.en.length > 20 ? '19px' : item.en.length > 12 ? '22px' : '26px';
  const isKnown  = rateStatus === 'yes';
  const isMissed = rateStatus === 'no';

  const isImmersion = studyMode === 'flip_def';
  const isReversed  = !isImmersion && (studyMode === 'flip_en_es' ||
    (studyMode === 'flip_random' && item.id.charCodeAt(item.id.length - 1) % 2 === 1));

  const frontText  = isImmersion ? item.en : (isReversed ? item.en : item.es);
  const frontLang  = isImmersion ? '🇺🇸 EN' : (isReversed ? '🇺🇸 EN' : '🇪🇸 ES');
  const frontColor = isImmersion ? cc : (isReversed ? cc : '#FFD700');
  const frontSize  = isImmersion ? fs_en : (isReversed ? fs_en : fs_es);
  const backText   = isReversed ? item.es : item.en;
  const backLang   = isImmersion ? '📖 MEANING' : (isReversed ? '🇪🇸 ES' : '🇺🇸 EN');
  const backColor  = isReversed ? '#FFD700' : cc;
  const backSize   = isReversed ? fs_es : fs_en;
  const backGlow   = isReversed ? '0 0 14px #FFD70080' : `0 0 20px ${cc}, 0 0 40px ${cc}60`;

  const checkType = useCallback(() => {
    if (!typeInput.trim()) return;
    const ok = fuzzyMatch(typeInput, item.en);
    setTypeResult(ok ? 'correct' : 'wrong');
    onRate(ok);
  }, [typeInput, item.en, onRate]);

  const reset = () => { setTypeInput(''); setTypeResult(null); setShowInput(false); setListenPhase('idle'); };

  const badge = (isKnown || isMissed) ? (
    <div style={{ position:'absolute', top:'6px', right:'7px', fontSize:'11px', animation:'knownPop .3s ease' }}>
      {isKnown ? '✅' : '❌'}
    </div>
  ) : null;

  const ActionRow = () => (
    <div className="card-action-row" onClick={e => e.stopPropagation()}>
      <button className={`card-audio-btn${isPlaying?' playing':''}`}
        style={{ '--cc':cc, '--cd':theme.dim, '--cg':theme.glow }} onClick={onSpeak}>
        {isPlaying ? <MiniWave color={cc}/> : '🔊'}
      </button>
      <button className={`card-rate-btn${rateStatus==='yes'?' yes':''}`} onClick={() => { onRate(true); reset(); }}>✅ Sí</button>
      <button className={`card-rate-btn${rateStatus==='no'?' no':''}`}  onClick={() => { onRate(false); reset(); }}>❌ No</button>
    </div>
  );

  const base = { '--cc':cc, '--cg':theme.glow, '--cd':theme.dim, animationDelay:`${index*0.022}s` };

  /* ── BOTH MODE ── */
  if (studyMode === 'flip_both') {
    return (
      <div className={`lang-card${godMode?' god-mode':''}${isKnown?' known-glow':''}`} style={base}>
        <div className="card-glow"/>{badge}
        <div style={{ fontSize:'10px', color:'#6b69a0', fontWeight:800, letterSpacing:'0.8px' }}>🇪🇸 ES</div>
        <div style={{ fontSize:fs_es, fontWeight:900, color:'#FFD700', lineHeight:1.3 }}>{item.es}</div>
        <div style={{ width:'100%', height:'1px', background:'rgba(255,255,255,0.07)', margin:'4px 0', flexShrink:0 }}/>
        <div style={{ fontSize:'10px', color:cc, fontWeight:800, letterSpacing:'0.8px' }}>🇺🇸 EN</div>
        <div style={{ fontSize:fs_en, fontWeight:900, color:cc, lineHeight:1.25, textShadow:`0 0 14px ${cc}60`, letterSpacing:'-0.3px' }}>{item.en}</div>
        {item.meaning && <div style={{ fontSize:'9px', color:'#5e5c88', fontStyle:'italic', lineHeight:1.3 }}>{item.meaning}</div>}
        <ActionRow/>
      </div>
    );
  }

  /* ── TYPE MODE ── */
  if (studyMode === 'type') {
    return (
      <div className={`lang-card${godMode?' god-mode':''}${isKnown?' known-glow':''}`}
        style={{ ...base, cursor: showInput||typeResult ? 'default':'pointer' }}
        onClick={() => !showInput && !typeResult && setShowInput(true)}>
        <div className="card-glow"/>{badge}
        <div style={{ fontSize:'10px', color:'#6b69a0', fontWeight:800, letterSpacing:'0.8px' }}>🇪🇸 ES</div>
        <div style={{ fontSize:fs_es, fontWeight:900, color:'#FFD700', lineHeight:1.3 }}>{item.es}</div>

        {!showInput && !typeResult && (
          <div style={{ fontSize:'10px', color:'#3d3b60', fontWeight:700, marginTop:'auto', display:'flex', alignItems:'center', gap:'4px' }}>⌨️ tap to type answer</div>
        )}
        {showInput && !typeResult && (
          <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginTop:'4px' }} onClick={e=>e.stopPropagation()}>
            <input value={typeInput} onChange={e=>setTypeInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&checkType()}
              placeholder="English…" autoFocus
              style={{ background:'rgba(255,255,255,0.07)', border:`1px solid ${cc}50`, borderRadius:'10px',
                padding:'7px 10px', color:'#e8e6ff', fontSize:'13px', fontWeight:600, fontFamily:'inherit', outline:'none' }}/>
            <button onClick={checkType} style={{ padding:'5px', borderRadius:'10px', border:`1px solid ${cc}60`,
              background:`${cc}18`, color:cc, fontSize:'12px', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>✓ Check</button>
          </div>
        )}
        {typeResult && (
          <div style={{ display:'flex', flexDirection:'column', gap:'4px', marginTop:'4px' }}>
            <p style={{ fontSize:'11px', fontWeight:800, color:typeResult==='correct'?'#00FF88':'#FF006E', animation:'ratePop .2s ease' }}>
              {typeResult==='correct' ? '🎯 Correct!' : `❌ ${item.en}`}
            </p>
            <ActionRow/>
          </div>
        )}
      </div>
    );
  }

  /* ── LISTEN MODE ── */
  if (studyMode === 'listen') {
    return (
      <div className={`lang-card${godMode?' god-mode':''}${isKnown?' known-glow':''}`}
        style={{ ...base, cursor:'default', minHeight:'155px' }}>
        <div className="card-glow"/>{badge}

        {listenPhase === 'idle' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, gap:'7px' }}>
            <button onClick={e=>{ e.stopPropagation(); onSpeak(); setListenPhase('typing'); }}
              style={{ fontSize:'26px', background:'none', border:`2px solid ${cc}60`, borderRadius:'50%',
                width:'52px', height:'52px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 0 18px ${cc}30`, color:'#fff' }}>🔊</button>
            <p style={{ fontSize:'10px', color:'#5e5c88', fontWeight:700 }}>Tap to hear</p>
          </div>
        )}

        {listenPhase === 'typing' && !typeResult && (
          <div style={{ display:'flex', flexDirection:'column', gap:'6px', flex:1 }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontSize:'10px', color:cc, fontWeight:800 }}>🎧 Type what you heard:</p>
              <button onClick={e=>{ e.stopPropagation(); onSpeak(); }}
                style={{ fontSize:'14px', background:'none', border:'none', cursor:'pointer', color:'#7a789e' }}>🔊</button>
            </div>
            <input value={typeInput} onChange={e=>setTypeInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&checkType()}
              placeholder="English…" autoFocus
              style={{ background:'rgba(255,255,255,0.07)', border:`1px solid ${cc}50`, borderRadius:'10px',
                padding:'7px 10px', color:'#e8e6ff', fontSize:'13px', fontWeight:600, fontFamily:'inherit', outline:'none' }}/>
            <button onClick={checkType} style={{ padding:'5px', borderRadius:'10px', border:`1px solid ${cc}60`,
              background:`${cc}18`, color:cc, fontSize:'12px', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>✓ Check</button>
          </div>
        )}

        {typeResult && (
          <div style={{ display:'flex', flexDirection:'column', gap:'5px', flex:1 }}>
            <div style={{ textAlign:'center', fontSize:'20px' }}>{typeResult==='correct'?'✅':'❌'}</div>
            <p style={{ fontSize:'12px', fontWeight:800, color:typeResult==='correct'?'#00FF88':'#FF006E', textAlign:'center' }}>
              {typeResult==='correct' ? '🎯 Correct!' : item.en}
            </p>
            <p style={{ fontSize:'10px', color:'#5e5c88', textAlign:'center' }}>🇪🇸 {item.es}</p>
            <div className="card-action-row" onClick={e=>e.stopPropagation()}>
              <button className={`card-rate-btn${rateStatus==='yes'?' yes':''}`} onClick={() => { onRate(true); reset(); }}>✅ Sí</button>
              <button className={`card-rate-btn${rateStatus==='no'?' no':''}`}  onClick={() => { onRate(false); reset(); }}>❌ No</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── FLIP MODES (default, en_es, random, weak, speed) ── */
  const isSpeedMode = studyMode === 'speed';
  const emoji = getWordEmoji(item.en);

  // Immersion mode: EN front + meaning back. defMode: same but as toggle.
  const immersionBack = item.meaning || item.en;
  const backPrimary   = isImmersion ? immersionBack
    : (defMode && !isReversed && item.meaning) ? item.meaning : backText;
  const backPrimaryFs = (isImmersion || (defMode && !isReversed && item.meaning))
    ? (backPrimary.length > 40 ? '11px' : backPrimary.length > 24 ? '13px' : '15px')
    : backSize;

  return (
    <div className={`lang-card${isFlipped?' flipped':''}${godMode?' god-mode':''}${isKnown?' known-glow':''}`}
      role="button" tabIndex={0}
      style={base}
      onClick={onFlip} onKeyDown={e=>e.key==='Enter'&&onFlip()}>
      <div className="card-glow"/>
      {isFlipped && <div className="ripple-ring"/>}
      {(isKnown||isMissed) && !isFlipped && (
        <div style={{ position:'absolute', top:'6px', right:'7px', fontSize:'11px', lineHeight:1, pointerEvents:'none', animation:'knownPop .3s ease' }}>
          {isKnown?'✅':'❌'}
        </div>
      )}

      {/* Emoji for concrete nouns (front face only) */}
      {emoji && !isFlipped && (
        <div style={{ fontSize:'28px', lineHeight:1, marginBottom:'2px' }}>{emoji}</div>
      )}

      <div style={{ fontSize:'10px', color:isReversed?cc:'#6b69a0', fontWeight:800, letterSpacing:'0.8px' }}>{frontLang}</div>
      <div style={{ fontSize:frontSize, fontWeight:900, color:frontColor, lineHeight:1.3,
        textShadow:isFlipped?(isReversed?`0 0 14px ${cc}80`:'0 0 14px #FFD70080'):'none', transition:'text-shadow .2s' }}>
        {frontText}
      </div>

      {isFlipped ? (
        <>
          <div style={{ width:'100%', height:'1px', background:'rgba(255,255,255,0.07)', margin:'1px 0', flexShrink:0 }}/>
          <div style={{ fontSize:'10px', color:isReversed?'#6b69a0':cc, fontWeight:800, letterSpacing:'0.8px' }}>{backLang}</div>
          {/* Primary back content */}
          <div style={{ fontSize:backPrimaryFs, fontWeight:900, color:backColor, lineHeight:1.25, textShadow:backGlow, letterSpacing:'-0.3px', padding:'4px 0 2px' }}>
            {backPrimary}
          </div>
          {/* defMode only (not immersion): show EN word smaller below the definition */}
          {defMode && !isImmersion && !isReversed && item.meaning && (
            <div style={{ fontSize:'11px', color:`${cc}99`, fontWeight:700, lineHeight:1.2 }}>{item.en}</div>
          )}
          {/* Meaning (shown when NOT in defMode or immersion) */}
          {!isImmersion && !defMode && item.meaning && !isReversed && (
            <div style={{ fontSize:'10px', color:cc, fontWeight:700, lineHeight:1.3, opacity:0.8 }}>{item.meaning}</div>
          )}
          {/* English example sentence (always shown; immersion hides nothing — no Spanish anyway) */}
          {item.en_ex && !isReversed && (
            <div style={{ fontSize:'9px', color:'#6b69a0', lineHeight:1.4, fontStyle:'italic', borderLeft:`2px solid ${cc}40`, paddingLeft:'6px', marginTop:'1px' }}>
              "{item.en_ex}"
            </div>
          )}
          <ActionRow/>
          {rateStatus==='yes' && <div style={{ fontSize:'9px', color:'#00FF88', fontWeight:700, textAlign:'center', animation:'ratePop .2s ease' }}>🌟 ¡Lo sabías!</div>}
          {rateStatus==='no'  && <div style={{ fontSize:'9px', color:'#FF006E', fontWeight:700, textAlign:'center', animation:'ratePop .2s ease' }}>🔁 ¡A repasar!</div>}
        </>
      ) : (
        <div style={{ fontSize:'10px', color:'#3d3b60', fontWeight:700, marginTop:'auto', display:'flex', alignItems:'center', gap:'4px' }}>
          <span>👆</span> {isSpeedMode ? 'tap fast · rate!' : 'tap · hear 🔊 · rate ✅❌'}
        </div>
      )}
    </div>
  );
}
