import { useEffect } from 'react';

export default function WordPopup({ word, data, loading, error, onClose, themeColor }) {
  const cc = themeColor;

  const playPhonetic = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(data?.phrase || word);
    utt.lang = 'en-US'; utt.rate = 0.82; utt.pitch = 1.05;
    window.speechSynthesis.speak(utt);
  };

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest('[data-word-popup]')) onClose();
    };
    const t = setTimeout(() => {
      document.addEventListener('touchstart', close, { passive: true });
      document.addEventListener('mousedown', close);
    }, 60);
    return () => {
      clearTimeout(t);
      document.removeEventListener('touchstart', close);
      document.removeEventListener('mousedown', close);
    };
  }, [onClose]);

  const examples = data?.examples || (data?.ex ? [data.ex] : []);

  return (
    <>
      <style>{`
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes dotPulse{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
        @keyframes overlayIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* Backdrop */}
      <div style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
        zIndex:999, animation:'overlayIn .2s ease both',
      }} />

      {/* Bottom sheet */}
      <div data-word-popup style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:1000,
        background:'#0e0c1a',
        border:`1.5px solid ${cc}35`,
        borderRadius:'26px 26px 0 0',
        boxShadow:`0 -8px 60px rgba(0,0,0,0.75), 0 0 50px ${cc}12`,
        maxHeight:'72vh', display:'flex', flexDirection:'column',
        animation:'sheetUp .28s cubic-bezier(.25,.8,.25,1) both',
        overflow:'hidden',
      }}>

        {/* Drag handle */}
        <div style={{ flexShrink:0, display:'flex', justifyContent:'center', paddingTop:'10px', paddingBottom:'2px' }}>
          <div style={{ width:'36px', height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY:'auto', padding:'8px 20px 32px', flex:1 }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
            <div style={{ flex:1, marginRight:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px' }}>
                <p style={{ fontSize:'22px', fontWeight:900, color:'#fff', letterSpacing:'-0.3px', margin:0 }}>
                  "{data?.phrase || word}"
                </p>
                {data?.type && (
                  <span style={{
                    fontSize:'9px', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase',
                    color:cc, background:`${cc}18`, border:`1px solid ${cc}35`,
                    borderRadius:'50px', padding:'3px 9px', flexShrink:0,
                  }}>{data.type}</span>
                )}
              </div>
              {/* Phonetic row */}
              {(data?.phonetic || loading) && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  {data?.phonetic && (
                    <p style={{ fontSize:'14px', color:'#8e8bbb', fontWeight:600, fontStyle:'italic', margin:0 }}>
                      {data.phonetic}
                    </p>
                  )}
                  {data?.phonetic && (
                    <button data-word-popup onClick={playPhonetic} style={{
                      background:`${cc}18`, border:`1px solid ${cc}35`,
                      borderRadius:'50%', width:'26px', height:'26px',
                      color:cc, fontSize:'10px', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:'inherit', flexShrink:0,
                    }}>▶</button>
                  )}
                </div>
              )}
            </div>
            <button data-word-popup onClick={onClose} style={{
              background:`${cc}15`, border:`1px solid ${cc}30`,
              color:cc, borderRadius:'50%',
              width:'30px', height:'30px', cursor:'pointer', fontSize:'13px',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              fontFamily:'inherit',
            }}>✕</button>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display:'flex', gap:'5px', alignItems:'center', padding:'10px 2px' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width:'8px', height:'8px', borderRadius:'50%', background:cc,
                  animation:`dotPulse 1.2s ${i*0.2}s ease-in-out infinite`,
                }} />
              ))}
              <p style={{ fontSize:'12px', color:'#5e5c88', marginLeft:'8px', fontWeight:600 }}>Looking up…</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <p style={{ fontSize:'13px', color: error === 'no_key' ? '#FFD700' : '#FF006E', fontWeight:700, lineHeight:1.5, margin:0 }}>
              {error === 'no_key'
                ? '🔑 Add an AI key in ⚙️ Settings to unlock word lookups'
                : `❌ ${error}`}
            </p>
          )}

          {/* Content */}
          {data && !loading && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

              {/* Definition */}
              <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:'16px', padding:'12px 15px' }}>
                <p style={{ fontSize:'9px', color:'#7a789e', fontWeight:800, letterSpacing:'0.08em', marginBottom:'6px', margin:'0 0 6px' }}>📖 MEANING</p>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#d4d2f0', lineHeight:1.55, margin:0 }}>{data.def}</p>
              </div>

              {/* Examples */}
              {examples.length > 0 && (
                <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:'16px', padding:'12px 15px' }}>
                  <p style={{ fontSize:'9px', color:'#7a789e', fontWeight:800, letterSpacing:'0.08em', margin:'0 0 8px' }}>💬 EXAMPLES</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                    {examples.map((ex, i) => (
                      <p key={i} style={{ fontSize:'13px', fontWeight:600, color:'#b8b6d8', lineHeight:1.5, fontStyle:'italic', margin:0 }}>
                        "{ex}"
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Synonyms */}
              {data.synonyms?.length > 0 && (
                <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:'16px', padding:'12px 15px' }}>
                  <p style={{ fontSize:'9px', color:'#7a789e', fontWeight:800, letterSpacing:'0.08em', margin:'0 0 9px' }}>🔗 SYNONYMS</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
                    {data.synonyms.map((s, i) => (
                      <span key={i} style={{
                        fontSize:'12px', fontWeight:700,
                        color:cc, background:`${cc}15`,
                        border:`1px solid ${cc}30`, borderRadius:'50px',
                        padding:'4px 11px',
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Spanish */}
              {data.es && (
                <div style={{ background:`${cc}0e`, border:`1px solid ${cc}28`, borderRadius:'16px', padding:'12px 15px' }}>
                  <p style={{ fontSize:'9px', color:cc, fontWeight:800, letterSpacing:'0.08em', margin:'0 0 5px' }}>🇪🇸 EN ESPAÑOL</p>
                  <p style={{ fontSize:'18px', fontWeight:900, color:'#fff', margin:0 }}>{data.es}</p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}
