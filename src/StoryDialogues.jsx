import { useState, useRef, useCallback } from 'react';
import { CATEGORY_THEMES } from './langData';
import { DIALOGUES } from './dialogues';
import WordPopup from './WordPopup';
import TappableText from './TappableText';
import { lookupWordAI, translateTextAI } from './aiLookup';

const CATS = Object.keys(DIALOGUES);
const LS_PROVIDER = 'lucid_ai_provider';
const PROVIDER_KEYS = ['claude','openai','deepseek','custom'];

export default function StoryDialogues({ voices, themeColor, onBack, apiKey, openaiKey, deepseekKey, customEndpoint, customKey, customModel }) {
  const [activeCat, setActiveCat]     = useState(CATS[0]);
  const [playing, setPlaying]         = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [popup, setPopup]             = useState(null);
  const [translations, setTranslations] = useState({});  // { lineIdx: text }
  const [translating, setTranslating]   = useState({});  // { lineIdx: true }
  const stopRef    = useRef(false);
  const wordCacheRef = useRef({});

  const provider = (() => {
    const saved = localStorage.getItem(LS_PROVIDER);
    return PROVIDER_KEYS.includes(saved) ? saved : 'claude';
  })();

  const aiCfg = { provider, claudeKey: apiKey, openaiKey, deepseekKey, customEndpoint, customKey, customModel };

  const dialogue = DIALOGUES[activeCat]?.[0];
  const theme    = CATEGORY_THEMES[activeCat] || {};
  const cc       = theme.color || themeColor;
  const cg       = theme.glow  || `${cc}60`;

  const speakLine = useCallback((text, speaker) => {
    return new Promise(resolve => {
      const synth = window.speechSynthesis;
      if (!synth) { setTimeout(resolve, 800); return; }
      synth.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang  = 'en-US';
      utt.rate  = speaker === 'A' ? 0.88 : 0.82;
      utt.pitch = speaker === 'A' ? 1.08 : 0.95;
      const pref = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
      if (pref) utt.voice = pref;
      utt.onend   = resolve;
      utt.onerror = resolve;
      synth.speak(utt);
    });
  }, [voices]);

  const playDialogue = useCallback(async () => {
    if (!dialogue) return;
    stopRef.current = false;
    setPlaying(true);
    for (let i = 0; i < dialogue.lines.length; i++) {
      if (stopRef.current) break;
      setCurrentLine(i);
      await speakLine(dialogue.lines[i].text, dialogue.lines[i].speaker);
      if (stopRef.current) break;
      await new Promise(r => setTimeout(r, 300));
    }
    setCurrentLine(null);
    setPlaying(false);
  }, [dialogue, speakLine]);

  const stopDialogue = () => {
    stopRef.current = true;
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setCurrentLine(null);
  };

  const switchCat = (cat) => {
    stopDialogue();
    setActiveCat(cat);
    setTranslations({});
  };

  const handleWordTap = useCallback(async (word) => {
    const key = word.toLowerCase();
    if (wordCacheRef.current[key]) {
      setPopup({ word, data: wordCacheRef.current[key], loading: false, error: null });
      return;
    }
    setPopup({ word, data: null, loading: true, error: null });
    try {
      const data = await lookupWordAI(word, aiCfg);
      wordCacheRef.current[key] = data;
      setPopup({ word, data, loading: false, error: null });
    } catch (e) {
      setPopup({ word, data: null, loading: false, error: e.message === 'no_key' ? 'no_key' : e.message });
    }
  }, [aiCfg]);

  const handleTranslateLine = useCallback(async (text, idx) => {
    if (translations[idx]) {
      setTranslations(prev => { const n = {...prev}; delete n[idx]; return n; });
      return;
    }
    setTranslating(prev => ({ ...prev, [idx]: true }));
    try {
      const translated = await translateTextAI(text, aiCfg);
      setTranslations(prev => ({ ...prev, [idx]: translated }));
    } catch (e) {
      setTranslations(prev => ({ ...prev, [idx]: e.message === 'no_key' ? '🔑 Add an AI key in Settings' : `❌ ${e.message}` }));
    } finally {
      setTranslating(prev => { const n = {...prev}; delete n[idx]; return n; });
    }
  }, [aiCfg, translations]);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Word popup */}
      {popup && (
        <WordPopup
          word={popup.word}
          data={popup.data}
          loading={popup.loading}
          error={popup.error}
          onClose={() => setPopup(null)}
          themeColor={cc}
        />
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px 18px 10px', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#6b69a0', fontSize:'20px', cursor:'pointer', padding:'4px' }}>←</button>
        <div>
          <p style={{ fontSize:'16px', fontWeight:900, color:cc, textShadow:`0 0 14px ${cc}` }}>📖 Story Dialogues</p>
          <p style={{ fontSize:'10px', color:'#5e5c88', fontWeight:700 }}>Tap any word · 🌐 to translate a line · ▶ to listen</p>
        </div>
      </div>

      {/* Category tabs */}
      <nav style={{ flexShrink:0, overflowX:'auto', borderBottom:'1px solid #1a1835', paddingBottom:'8px' }}>
        <div style={{ display:'flex', gap:'6px', padding:'4px 16px 0', width:'max-content' }}>
          {CATS.map(k => {
            const t = CATEGORY_THEMES[k] || {};
            const active = k === activeCat;
            return (
              <button key={k} onClick={() => switchCat(k)} style={{
                padding:'6px 12px', borderRadius:'20px', border:`1.5px solid ${active ? t.color || cc : '#27254a'}`,
                background: active ? `${t.color || cc}22` : 'rgba(255,255,255,0.03)',
                color: active ? (t.color || cc) : '#7a789e', fontSize:'11px', fontWeight:800,
                cursor:'pointer', whiteSpace:'nowrap', transition:'all .15s',
                boxShadow: active ? `0 0 10px ${t.glow || cg}` : 'none',
              }}>
                {t.icon} {t.label || k}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Dialogue */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>
        {dialogue ? (
          <>
            <div style={{ textAlign:'center', marginBottom:'14px' }}>
              <p style={{ fontSize:'18px', marginBottom:'2px' }}>{dialogue.setting}</p>
              <p style={{ fontSize:'13px', fontWeight:800, color:cc }}>{dialogue.title}</p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
              {dialogue.lines.map((line, i) => {
                const isA       = line.speaker === 'A';
                const isCurrent = currentLine === i;
                return (
                  <div key={i} style={{ display:'flex', justifyContent: isA ? 'flex-start' : 'flex-end' }}>
                    <div style={{ maxWidth:'82%', display:'flex', flexDirection:'column', gap:'4px',
                      alignItems: isA ? 'flex-start' : 'flex-end' }}>
                      {/* Bubble */}
                      <div style={{
                        padding:'10px 14px',
                        borderRadius: isA ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                        background: isCurrent
                          ? (isA ? `${cc}22` : `${cc}33`)
                          : (isA ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'),
                        border: `1.5px solid ${isCurrent ? cc : isA ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'}`,
                        boxShadow: isCurrent ? `0 0 16px ${cg}` : 'none',
                        transition:'all .2s',
                      }}>
                        <p style={{ fontSize:'10px', color: isCurrent ? cc : '#5e5c88', fontWeight:800, marginBottom:'3px' }}>
                          {isA ? '👤 Person A' : '🧑 Person B'}
                          {isCurrent && ' 🔊'}
                        </p>
                        <TappableText
                          text={line.text}
                          onWordTap={handleWordTap}
                          accentColor={isCurrent ? '#fff' : cc}
                          baseStyle={{
                            fontSize:'14px', fontWeight:700,
                            color: isCurrent ? '#fff' : '#c8c6e8',
                            lineHeight: 1.5,
                            textShadow: isCurrent ? `0 0 8px ${cc}` : 'none',
                          }}
                        />
                      </div>

                      {/* Translate toggle */}
                      <div style={{ display:'flex', flexDirection:'column', gap:'4px', width:'100%' }}>
                        <button
                          onClick={() => handleTranslateLine(line.text, i)}
                          style={{
                            alignSelf: isA ? 'flex-start' : 'flex-end',
                            padding:'3px 10px', borderRadius:'20px',
                            border:`1px solid ${translating[i] ? cc + '60' : '#27254a'}`,
                            background: translations[i] ? `${cc}15` : 'rgba(255,255,255,0.03)',
                            color: translations[i] ? cc : '#5e5c88',
                            fontSize:'10px', fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                            transition:'all .15s',
                          }}
                        >
                          {translating[i] ? '⏳' : translations[i] ? '🌐 hide' : '🌐'}
                        </button>
                        {translations[i] && (
                          <div style={{
                            padding:'7px 11px', borderRadius:'12px',
                            background:`${cc}10`, border:`1px solid ${cc}25`,
                          }}>
                            <p style={{ fontSize:'9px', color:cc, fontWeight:800, marginBottom:'2px', letterSpacing:'0.06em' }}>🇪🇸 EN ESPAÑOL</p>
                            <p style={{ fontSize:'13px', color:'#c8c6e8', fontWeight:600, lineHeight:1.4 }}>{translations[i]}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p style={{ textAlign:'center', color:'#3d3b60', marginTop:'40px' }}>No dialogue for this category yet.</p>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding:'12px 16px 16px', flexShrink:0, background:'rgba(8,7,22,0.85)', borderTop:'1px solid #1a1835' }}>
        <div style={{ display:'flex', gap:'10px' }}>
          {!playing ? (
            <button onClick={playDialogue} disabled={!dialogue} style={{
              flex:1, padding:'13px', borderRadius:'16px', border:`2px solid ${cc}`,
              background:`${cc}18`, color:cc, fontSize:'15px', fontWeight:800, cursor:'pointer',
              boxShadow:`0 0 16px ${cg}`, transition:'all .2s',
            }}>
              ▶ Play Dialogue
            </button>
          ) : (
            <button onClick={stopDialogue} style={{
              flex:1, padding:'13px', borderRadius:'16px', border:'2px solid #FF006E',
              background:'rgba(255,0,110,0.12)', color:'#FF006E', fontSize:'15px', fontWeight:800, cursor:'pointer',
              boxShadow:'0 0 16px rgba(255,0,110,0.3)',
            }}>
              ⏹ Stop
            </button>
          )}
          {!playing && currentLine !== null && (
            <button onClick={() => { setCurrentLine(null); playDialogue(); }} style={{
              padding:'13px 18px', borderRadius:'16px', border:'1px solid #27254a',
              background:'rgba(255,255,255,0.04)', color:'#9b99c0', fontSize:'14px', fontWeight:700, cursor:'pointer',
            }}>↩ Restart</button>
          )}
        </div>
        {playing && (
          <p style={{ textAlign:'center', fontSize:'11px', color:'#5e5c88', marginTop:'8px', fontWeight:700 }}>
            Line {(currentLine ?? 0) + 1} of {dialogue?.lines?.length ?? 0} · reading aloud…
          </p>
        )}
      </div>
    </div>
  );
}
