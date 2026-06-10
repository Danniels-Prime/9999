import { useState, useRef, useEffect, useCallback } from 'react';
import TappableText from './TappableText';
import WordPopup from './WordPopup';
import { lookupWordAI } from './aiLookup';

const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export default function CallTranscribe({
  themeColor, voices,
  apiKey, openaiKey, openrouterKey, deepseekKey,
  customEndpoint, customKey, customModel,
}) {
  const pc = themeColor;
  const [listening, setListening] = useState(false);
  const [utterances, setUtterances] = useState([]);
  const [interim, setInterim] = useState('');
  const [popup, setPopup] = useState(null);

  const srRef = useRef(null);
  const listeningRef = useRef(false);
  const scrollRef = useRef(null);
  const wordCacheRef = useRef({});

  const provider = localStorage.getItem('lucid_ai_provider') ||
    (apiKey ? 'claude' : openaiKey ? 'openai' : openrouterKey ? 'openrouter' : deepseekKey ? 'deepseek' : customKey ? 'custom' : null);

  const aiCfg = { provider, claudeKey: apiKey, openaiKey, openrouterKey, deepseekKey, customEndpoint, customKey, customModel };

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [utterances, interim]);

  const startListening = useCallback(() => {
    if (!hasSR) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      if (finalText.trim()) {
        setUtterances(prev => [...prev, { id: Date.now() + Math.random(), text: finalText.trim() }]);
        setInterim('');
      } else {
        setInterim(interimText);
      }
    };

    r.onerror = (e) => {
      if (e.error === 'no-speech') return;
      if (e.error === 'aborted') return;
      listeningRef.current = false;
      setListening(false);
      setInterim('');
    };

    r.onend = () => {
      setInterim('');
      if (listeningRef.current) {
        try { r.start(); } catch (_) {}
      }
    };

    srRef.current = r;
    try {
      r.start();
      listeningRef.current = true;
      setListening(true);
    } catch (_) {}
  }, []);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    setInterim('');
    try { srRef.current?.stop(); } catch (_) {}
    srRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopListening(), [stopListening]);

  const toggleListening = () => {
    if (listening) stopListening();
    else startListening();
  };

  const clearTranscript = () => {
    stopListening();
    setUtterances([]);
    setInterim('');
    wordCacheRef.current = {};
    setPopup(null);
  };

  const handleWordTap = useCallback(async (word, sentence) => {
    if (!word) return;
    const key = word.toLowerCase();
    if (wordCacheRef.current[key]) {
      setPopup({ word, data: wordCacheRef.current[key], loading: false, error: null });
      return;
    }
    setPopup({ word, data: null, loading: true, error: null });
    try {
      const data = await lookupWordAI(word, aiCfg, sentence);
      wordCacheRef.current[key] = data;
      setPopup(prev => prev?.word === word ? { word, data, loading: false, error: null } : prev);
    } catch (e) {
      setPopup(prev => prev?.word === word ? { word, data: null, loading: false, error: e.message === 'no_key' ? 'no_key' : e.message } : prev);
    }
  }, [apiKey, openaiKey, openrouterKey, deepseekKey, customEndpoint, customKey, customModel, provider]);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#03010a', position:'relative', overflow:'hidden' }}>
      <style>{`
        @keyframes liveDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.7)}}
        @keyframes micRing{0%,100%{box-shadow:0 0 0 0 ${pc}50}70%{box-shadow:0 0 0 22px transparent}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes waveBar{0%,100%{transform:scaleY(0.4)}50%{transform:scaleY(1)}}
      `}</style>

      {/* Top bar */}
      <div style={{
        flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 16px 12px', borderBottom:'1px solid #14102a',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {listening && (
            <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#ff3b6b', animation:'liveDot 1.1s ease-in-out infinite', flexShrink:0 }} />
          )}
          <span style={{ fontSize:'15px', fontWeight:900, color:'#fff', letterSpacing:'-0.2px' }}>
            Live Transcribe
          </span>
          {listening && (
            <div style={{ display:'flex', alignItems:'flex-end', gap:'2px', height:'16px' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width:'3px', background:pc, borderRadius:'2px', height:'100%',
                  animation:`waveBar 0.8s ${i*0.15}s ease-in-out infinite`,
                  transformOrigin:'bottom',
                }} />
              ))}
            </div>
          )}
        </div>
        {utterances.length > 0 && (
          <button onClick={clearTranscript} style={{
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            color:'#7a789e', borderRadius:'50px', padding:'5px 13px',
            fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
          }}>Clear</button>
        )}
      </div>

      {/* Transcript scroll area */}
      <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:'16px' }}>

        {/* Empty state */}
        {utterances.length === 0 && !interim && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'14px', paddingBottom:'40px', minHeight:'200px' }}>
            <div style={{ fontSize:'52px', opacity:0.2, lineHeight:1 }}>🎙</div>
            <p style={{ fontSize:'14px', color:'#5e5c88', textAlign:'center', fontWeight:600, lineHeight:1.6, maxWidth:'260px', margin:0 }}>
              Tap the mic to start live transcription. Tap any word to get its full meaning.
            </p>
            {!hasSR && (
              <p style={{ fontSize:'12px', color:'#ff3b6b', textAlign:'center', fontWeight:700, margin:0 }}>
                ⚠️ Speech recognition not supported in this browser
              </p>
            )}
          </div>
        )}

        {/* Final utterances */}
        {utterances.map((u) => (
          <div key={u.id} style={{ animation:'fadeUp .22s ease both' }}>
            <TappableText
              text={u.text}
              onWordTap={handleWordTap}
              accentColor={pc}
              baseStyle={{ fontSize:'19px', fontWeight:700, color:'#e8e6ff', lineHeight:1.6 }}
            />
          </div>
        ))}

        {/* Interim (live, dimmed) */}
        {interim && (
          <div style={{
            fontSize:'19px', fontWeight:600, color:'rgba(255,255,255,0.28)',
            fontStyle:'italic', lineHeight:1.6, animation:'fadeUp .1s ease both',
          }}>
            {interim}
          </div>
        )}
      </div>

      {/* Bottom mic controls */}
      <div style={{
        flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:'10px',
        padding:'18px 16px 36px', borderTop:'1px solid #14102a',
      }}>
        <button
          onClick={toggleListening}
          disabled={!hasSR}
          style={{
            width:'74px', height:'74px', borderRadius:'50%', border:'none',
            background: listening
              ? 'linear-gradient(135deg, #ff3b6b, #c0155a)'
              : `linear-gradient(135deg, ${pc}, ${pc}bb)`,
            cursor: hasSR ? 'pointer' : 'not-allowed',
            fontSize:'28px',
            display:'flex', alignItems:'center', justifyContent:'center',
            animation: listening ? 'micRing 2s ease-in-out infinite' : 'none',
            boxShadow: listening ? 'none' : `0 4px 24px ${pc}45`,
            transition:'background .2s, box-shadow .2s',
            flexShrink:0,
          }}
        >
          {listening ? '⏹' : '🎙'}
        </button>
        <p style={{ fontSize:'11px', color: listening ? '#ff3b6b' : '#5e5c88', fontWeight:700, margin:0, letterSpacing:'0.06em' }}>
          {listening ? 'TAP TO STOP' : 'TAP TO LISTEN'}
        </p>
      </div>

      {/* Word genius popup */}
      {popup && (
        <WordPopup
          word={popup.word}
          data={popup.data}
          loading={popup.loading}
          error={popup.error}
          onClose={() => setPopup(null)}
          themeColor={pc}
        />
      )}
    </div>
  );
}
