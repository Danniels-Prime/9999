import { useState, useRef, useEffect, useCallback } from 'react';

const SYSTEM_PROMPT = `You are Alex, a friendly American English conversation partner helping Spanish speakers practice everyday American English. You use natural American slang, expressions, and idioms. Keep responses short (2-4 sentences max). When the user types a word or phrase (like "bet" or "no cap"), explain briefly how it's used, give one quick example sentence, then continue the conversation naturally. If they make grammar errors, model the correct phrasing naturally in your reply without explicitly calling it out. Stay casual, warm, and encouraging. Never be preachy or lecture-y.`;

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

export default function ConvoAI({ apiKey, voices, themeColor, onBack }) {
  const [messages, setMessages] = useState([
    { role:'ai', text:"Hey! I'm Alex 🇺🇸 Your American English practice buddy. Ask me anything — like how to use \"bet\", \"no cap\", or just chat with me in English. I've got you!" }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

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

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!apiKey) { setError('no_key'); return; }

    setError(null);
    const userMsg = { role:'user', text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    inputRef.current?.focus();

    // Build history for API (exclude first AI greeting from history)
    const history = nextMessages
      .filter((_, i) => !(i === 0 && nextMessages[0].role === 'ai'))
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 180,
          system: SYSTEM_PROMPT,
          messages: history,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data?.content?.[0]?.text || "Sorry, I didn't catch that. Try again?";
      setMessages(prev => [...prev, { role:'ai', text: reply }]);
      speak(reply);
    } catch (e) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const cc = themeColor;

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px 18px 10px', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#6b69a0', fontSize:'20px', cursor:'pointer', padding:'4px' }}>←</button>
        <span style={{ fontSize:'22px' }}>🇺🇸</span>
        <div>
          <p style={{ fontSize:'16px', fontWeight:900, color:cc, textShadow:`0 0 14px ${cc}` }}>Alex — AI Chat</p>
          <p style={{ fontSize:'10px', color:'#5e5c88', fontWeight:700 }}>Powered by Claude · Practice natural American English</p>
        </div>
      </div>

      {/* No API key banner */}
      {!apiKey && (
        <div style={{ margin:'0 16px 10px', padding:'12px 14px', background:'rgba(255,200,0,0.08)', border:'1px solid rgba(255,200,0,0.3)', borderRadius:'14px' }}>
          <p style={{ fontSize:'13px', color:'#FFD700', fontWeight:700 }}>🔑 API key needed</p>
          <p style={{ fontSize:'11px', color:'#9b99c0', marginTop:'3px' }}>Go to ⚙️ Settings → add your Claude API key to start chatting.</p>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 14px 10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom:'10px', animation:'fadeUp .25s ease both',
          }}>
            {m.role === 'ai' && (
              <span style={{ fontSize:'20px', marginRight:'6px', flexShrink:0, alignSelf:'flex-end', marginBottom:'2px' }}>🇺🇸</span>
            )}
            <div style={{
              maxWidth:'78%', padding:'10px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user' ? `${cc}22` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${m.role === 'user' ? cc + '50' : 'rgba(255,255,255,0.08)'}`,
              color: m.role === 'user' ? cc : '#d4d2f0',
              fontSize:'14px', fontWeight:600, lineHeight:1.5,
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:'flex', alignItems:'flex-end', marginBottom:'10px' }}>
            <span style={{ fontSize:'20px', marginRight:'6px' }}>🇺🇸</span>
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
        <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type something… e.g. 'how do I use no cap?'"
            disabled={!apiKey || loading}
            rows={1}
            style={{
              flex:1, background:'rgba(255,255,255,0.05)', border:`1px solid ${input ? cc + '60' : '#27254a'}`,
              borderRadius:'14px', padding:'11px 14px', color:'#e8e6ff', fontSize:'14px', fontWeight:600,
              fontFamily:'inherit', resize:'none', outline:'none', transition:'border-color .2s',
              opacity: (!apiKey || loading) ? 0.5 : 1,
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || !apiKey || loading}
            style={{
              width:'44px', height:'44px', borderRadius:'14px', border:'none',
              background: (input.trim() && apiKey && !loading) ? cc : '#27254a',
              color:'#fff', fontSize:'18px', cursor:'pointer', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background .2s', boxShadow: (input.trim() && apiKey && !loading) ? `0 0 14px ${cc}60` : 'none',
            }}
          >→</button>
        </div>
        <p style={{ fontSize:'10px', color:'#3d3b60', marginTop:'6px', textAlign:'center' }}>
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
