import { useState, useRef, useEffect, useCallback } from 'react';
import WordPopup from './WordPopup';
import TappableText from './TappableText';
import { lookupWordAI, translateTextAI } from './aiLookup';

const SYSTEM_PROMPT = `You are Alex, a friendly American English conversation partner helping Spanish speakers practice everyday American English. You use natural American slang, expressions, and idioms. Keep responses short (2-4 sentences max). When the user types a word or phrase (like "bet" or "no cap"), explain briefly how it's used, give one quick example sentence, then continue the conversation naturally. If they make grammar errors, model the correct phrasing naturally in your reply without explicitly calling it out. Stay casual, warm, and encouraging. Never be preachy or lecture-y.`;

const PROVIDERS = {
  claude:      { label:'Claude',      icon:'🟣', color:'#C96442', placeholder:'sk-ant-...',  hint:'console.anthropic.com' },
  openai:      { label:'ChatGPT',     icon:'🟢', color:'#10A37F', placeholder:'sk-...',       hint:'platform.openai.com/api-keys' },
  openrouter:  { label:'OpenRouter',  icon:'🔷', color:'#6366F1', placeholder:'sk-or-v3-...', hint:'openrouter.ai · free models ✅' },
  deepseek:    { label:'DeepSeek',    icon:'🔵', color:'#4D6EFF', placeholder:'sk-...',       hint:'platform.deepseek.com' },
  custom:      { label:'Custom',      icon:'⚙️', color:'#9B59B6', placeholder:'sk-...',       hint:'Any OpenAI-compatible API' },
};
const PROVIDER_KEYS = Object.keys(PROVIDERS);
const LS_PROVIDER   = 'lucid_ai_provider';

async function callClaude(key, history) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:180, system:SYSTEM_PROMPT, messages:history }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`); }
  const d = await res.json();
  return d?.content?.[0]?.text;
}

const OPENROUTER_FREE_MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemma-3-12b-it:free',
  'qwen/qwen3-8b:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];

async function callOpenAICompat(endpoint, key, model, history) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization':`Bearer ${key}`, 'Content-Type':'application/json' },
    body: JSON.stringify({
      model, max_tokens:180,
      messages: [{ role:'system', content:SYSTEM_PROMPT }, ...history],
    }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`); }
  const d = await res.json();
  return d?.choices?.[0]?.message?.content;
}

async function callOpenRouterFallback(key, history) {
  let lastErr;
  for (const model of OPENROUTER_FREE_MODELS) {
    try {
      return await callOpenAICompat('https://openrouter.ai/api/v1/chat/completions', key, model, history);
    } catch (e) {
      if (e.message?.includes('No endpoints found') || e.message?.includes('Provider returned error')) { lastErr = e; continue; }
      throw e;
    }
  }
  throw lastErr;
}

function TypingDots() {
  return (
    <div style={{ display:'flex', gap:'4px', alignItems:'center', padding:'10px 14px' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:'7px', height:'7px', borderRadius:'50%', background:'#5e5c88',
          animation:`convoDot 1.2s ${i*0.2}s ease-in-out infinite`,
        }}/>
      ))}
      <style>{`@keyframes convoDot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export default function ConvoAI({ apiKey, openaiKey, openrouterKey, deepseekKey, customEndpoint, customKey, customModel, voices, themeColor, onBack }) {
  const [provider, setProvider] = useState(() => {
    const saved = localStorage.getItem(LS_PROVIDER);
    return PROVIDER_KEYS.includes(saved) ? saved : 'claude';
  });
  const [messages, setMessages] = useState([
    { role:'ai', text:"Hey! I'm Alex 🇺🇸 Your American English practice buddy. Ask me anything — like how to use \"bet\", \"no cap\", or just chat with me in English. I've got you!" }
  ]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError]         = useState(null);

  // Word popup state
  const [popup, setPopup] = useState(null); // { word, data, loading, error }
  const wordCacheRef = useRef({});

  // Per-message translation state
  const [translations, setTranslations] = useState({});   // { msgIdx: 'translated text' }
  const [translating, setTranslating]   = useState({});   // { msgIdx: true }

  const bottomRef      = useRef(null);
  const inputRef       = useRef(null);
  const recognitionRef = useRef(null);

  const keys = { claude: apiKey, openai: openaiKey, openrouter: openrouterKey, deepseek: deepseekKey, custom: customKey };
  const activeKey = keys[provider] || '';
  const prov = PROVIDERS[provider];

  const aiCfg = {
    provider,
    claudeKey: apiKey,
    openaiKey,
    openrouterKey,
    deepseekKey,
    customEndpoint,
    customKey,
    customModel,
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  const speak = useCallback((text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US'; utt.rate = 0.88; utt.pitch = 1.05;
    const pref = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
    if (pref) utt.voice = pref;
    synth.speak(utt);
  }, [voices]);

  const switchProvider = (p) => {
    setProvider(p);
    localStorage.setItem(LS_PROVIDER, p);
    setError(null);
  };

  // Tap a word → open popup + fetch definition
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
  }, [aiCfg]);

  // Tap 🌐 on a message → translate the whole thing
  const handleTranslate = useCallback(async (text, idx) => {
    if (translations[idx]) {
      // toggle off
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

  const sendText = useCallback(async (text) => {
    if (!text || loading) return;
    if (!activeKey) { setError('no_key'); return; }
    setError(null);

    const userMsg = { role:'user', text };
    let nextMessages;
    setMessages(prev => {
      nextMessages = [...prev, userMsg];
      return nextMessages;
    });
    setLoading(true);

    const history = [...(nextMessages || []), userMsg]
      .filter((_, i, arr) => !(i === 0 && arr[0].role === 'ai'))
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

    try {
      let reply;
      if (provider === 'claude') {
        reply = await callClaude(activeKey, history);
      } else if (provider === 'openai') {
        reply = await callOpenAICompat('https://api.openai.com/v1/chat/completions', activeKey, 'gpt-4o-mini', history);
      } else if (provider === 'openrouter') {
        reply = await callOpenRouterFallback(activeKey, history);
      } else if (provider === 'deepseek') {
        reply = await callOpenAICompat('https://api.deepseek.com/chat/completions', activeKey, 'deepseek-chat', history);
      } else if (provider === 'custom') {
        if (!customEndpoint || !customModel) throw new Error('Set endpoint + model in ⚙️ Settings → AI CHAT → Custom');
        reply = await callOpenAICompat(customEndpoint, activeKey, customModel, history);
      }
      reply = reply || "Sorry, I didn't catch that. Try again?";
      setMessages(prev => [...prev, { role:'ai', text: reply }]);
      speak(reply);
    } catch (e) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [loading, activeKey, provider, speak]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    inputRef.current?.focus();
    sendText(text);
  }, [input, sendText]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!hasSpeechRecognition) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1;
    r.onstart  = () => setListening(true);
    r.onend    = () => setListening(false);
    r.onerror  = () => setListening(false);
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      setInput(transcript);
      setTimeout(() => sendText(transcript), 200);
    };
    recognitionRef.current = r;
    r.start();
  }, [sendText]);

  const cc = themeColor;
  const pc = prov.color;

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
          themeColor={pc}
        />
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px 18px 8px', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#6b69a0', fontSize:'20px', cursor:'pointer', padding:'4px' }}>←</button>
        <span style={{ fontSize:'22px' }}>🇺🇸</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:'16px', fontWeight:900, color:pc, textShadow:`0 0 14px ${pc}` }}>
            Alex — {prov.label}
          </p>
          <p style={{ fontSize:'10px', color:'#5e5c88', fontWeight:700 }}>Tap any word to translate · 🌐 for full message</p>
        </div>
      </div>

      {/* Provider selector — 2×2 grid */}
      <div style={{ flexShrink:0, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', padding:'0 18px 10px', borderBottom:'1px solid #1a1835' }}>
        {PROVIDER_KEYS.map(p => {
          const pv = PROVIDERS[p];
          const active = p === provider;
          const hasKey = !!keys[p];
          return (
            <button key={p} onClick={() => switchProvider(p)} style={{
              flex:1, padding:'7px 4px', borderRadius:'12px',
              border:`1.5px solid ${active ? pv.color : '#27254a'}`,
              background: active ? `${pv.color}18` : 'rgba(255,255,255,0.02)',
              color: active ? pv.color : '#5e5c88',
              fontSize:'11px', fontWeight:800, cursor:'pointer', fontFamily:'inherit',
              boxShadow: active ? `0 0 12px ${pv.color}40` : 'none',
              transition:'all .15s', position:'relative',
            }}>
              {pv.icon} {pv.label}
              {hasKey && <span style={{ position:'absolute', top:'2px', right:'4px', fontSize:'7px', color: active ? pv.color : '#3d3b60' }}>●</span>}
            </button>
          );
        })}
      </div>

      {/* No API key banner */}
      {(!activeKey || (provider === 'custom' && (!customEndpoint || !customModel))) && (
        <div style={{ margin:'10px 16px 4px', padding:'12px 14px', background:'rgba(255,200,0,0.08)', border:'1px solid rgba(255,200,0,0.3)', borderRadius:'14px' }}>
          <p style={{ fontSize:'13px', color:'#FFD700', fontWeight:700 }}>🔑 {prov.label} setup needed</p>
          {provider === 'custom'
            ? <p style={{ fontSize:'11px', color:'#9b99c0', marginTop:'3px' }}>Go to ⚙️ Settings → AI CHAT → Custom — enter your endpoint URL, model name, and API key</p>
            : <p style={{ fontSize:'11px', color:'#9b99c0', marginTop:'3px' }}>Go to ⚙️ Settings → AI CHAT → paste your {prov.label} key ({prov.hint})</p>
          }
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'6px 14px 10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom:'10px', animation:'fadeUp .25s ease both',
            flexDirection: m.role === 'ai' ? 'row' : 'row-reverse',
            alignItems:'flex-end', gap:'6px',
          }}>
            {m.role === 'ai' && (
              <span style={{ fontSize:'20px', flexShrink:0, marginBottom:'2px' }}>🇺🇸</span>
            )}
            <div style={{ maxWidth:'78%', display:'flex', flexDirection:'column', gap:'4px',
              alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {/* Bubble */}
              <div style={{
                padding:'10px 14px',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.role === 'user' ? `${cc}22` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${m.role === 'user' ? cc + '50' : 'rgba(255,255,255,0.08)'}`,
                fontSize:'14px', fontWeight:600, lineHeight:1.5,
              }}>
                <TappableText
                  text={m.text}
                  onWordTap={handleWordTap}
                  accentColor={m.role === 'user' ? cc : '#a09ec8'}
                  baseStyle={{ color: m.role === 'user' ? cc : '#d4d2f0' }}
                />
              </div>

              {/* AI message: translate button + result */}
              {m.role === 'ai' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <button
                    onClick={() => handleTranslate(m.text, i)}
                    style={{
                      alignSelf:'flex-start',
                      padding:'3px 10px', borderRadius:'20px',
                      border:`1px solid ${translating[i] ? cc + '60' : '#27254a'}`,
                      background: translations[i] ? `${cc}15` : 'rgba(255,255,255,0.03)',
                      color: translations[i] ? cc : '#5e5c88',
                      fontSize:'10px', fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                      transition:'all .15s',
                    }}
                  >
                    {translating[i] ? '⏳ translating…' : translations[i] ? '🌐 hide' : '🌐 translate'}
                  </button>
                  {translations[i] && (
                    <div style={{
                      padding:'8px 12px', borderRadius:'12px',
                      background:`${cc}10`, border:`1px solid ${cc}25`,
                    }}>
                      <p style={{ fontSize:'9px', color:cc, fontWeight:800, marginBottom:'3px', letterSpacing:'0.06em' }}>🇪🇸 EN ESPAÑOL</p>
                      <p style={{ fontSize:'13px', color:'#c8c6e8', fontWeight:600, lineHeight:1.45 }}>{translations[i]}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:'flex', alignItems:'flex-end', marginBottom:'10px', gap:'6px' }}>
            <span style={{ fontSize:'20px' }}>🇺🇸</span>
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'18px 18px 18px 4px' }}>
              <TypingDots />
            </div>
          </div>
        )}

        {error && error !== 'no_key' && (
          <div style={{ margin:'6px 0 10px', padding:'8px 12px', background:'rgba(255,0,110,0.1)', border:'1px solid rgba(255,0,110,0.3)', borderRadius:'10px' }}>
            <p style={{ fontSize:'12px', color:'#FF006E', fontWeight:700 }}>❌ {error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div style={{ padding:'10px 14px 14px', flexShrink:0, background:'rgba(8,7,22,0.8)', borderTop:'1px solid #1a1835' }}>
        <style>{`@keyframes micPulse{0%,100%{box-shadow:0 0 8px rgba(255,0,110,0.3)}50%{box-shadow:0 0 22px rgba(255,0,110,0.8)}}`}</style>
        <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={listening ? '🎙 Listening…' : "Type or tap 🎙 to speak…"}
            disabled={!activeKey || loading}
            rows={1}
            style={{
              flex:1, background:'rgba(255,255,255,0.05)', border:`1px solid ${input ? cc + '60' : '#27254a'}`,
              borderRadius:'14px', padding:'11px 14px', color:'#e8e6ff', fontSize:'14px', fontWeight:600,
              fontFamily:'inherit', resize:'none', outline:'none', transition:'border-color .2s',
              opacity: (!activeKey || loading) ? 0.5 : 1,
            }}
          />
          {hasSpeechRecognition && (
            <button
              onClick={listening ? stopListening : startListening}
              disabled={!activeKey || loading}
              style={{
                width:'44px', height:'44px', borderRadius:'14px',
                background: listening ? 'rgba(255,0,110,0.15)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${listening ? '#FF006E' : '#27254a'}`,
                color: listening ? '#FF006E' : '#5e5c88',
                fontSize:'20px', cursor:'pointer', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all .2s',
                animation: listening ? 'micPulse 1s ease-in-out infinite' : 'none',
              }}
            >🎙</button>
          )}
          <button
            onClick={send}
            disabled={!input.trim() || !activeKey || loading}
            style={{
              width:'44px', height:'44px', borderRadius:'14px', border:'none',
              background: (input.trim() && activeKey && !loading) ? cc : '#27254a',
              color:'#fff', fontSize:'18px', cursor:'pointer', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background .2s',
              boxShadow: (input.trim() && activeKey && !loading) ? `0 0 14px ${cc}60` : 'none',
            }}
          >→</button>
        </div>
        <p style={{ fontSize:'10px', color:'#3d3b60', marginTop:'6px', textAlign:'center' }}>
          {hasSpeechRecognition ? `Tap 🎙 · tap any word to look it up · ${prov.icon} ${prov.label}` : `Tap any word to look it up · ${prov.icon} ${prov.label}`}
        </p>
      </div>
    </div>
  );
}
