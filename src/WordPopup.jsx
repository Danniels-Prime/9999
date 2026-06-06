import { useEffect } from 'react';

export default function WordPopup({ word, data, loading, error, onClose, themeColor }) {
  const cc = themeColor;

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

  return (
    <>
      <style>{`
        @keyframes popupIn{from{opacity:0;transform:translateX(-50%) scale(0.88) translateY(14px)}to{opacity:1;transform:translateX(-50%) scale(1) translateY(0)}}
        @keyframes dotPulse{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
      `}</style>
      <div data-word-popup style={{
        position:'fixed', bottom:'100px', left:'50%', transform:'translateX(-50%)',
        width:'min(318px,90vw)', zIndex:1000,
        background:'rgba(8,6,26,0.97)',
        border:`1.5px solid ${cc}50`,
        borderRadius:'22px',
        boxShadow:`0 12px 50px rgba(0,0,0,0.65), 0 0 40px ${cc}15`,
        padding:'16px 18px',
        animation:'popupIn .22s cubic-bezier(.34,1.56,.64,1) both',
      }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
          <div>
            <p style={{ fontSize:'20px', fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>"{data?.phrase || word}"</p>
            <p style={{ fontSize:'9px', color:cc, fontWeight:800, letterSpacing:'0.08em', marginTop:'2px' }}>TAP ANY WORD · EXPLORE IT</p>
          </div>
          <button data-word-popup onClick={onClose} style={{
            background:`${cc}15`, border:`1px solid ${cc}30`,
            color:cc, borderRadius:'50%',
            width:'28px', height:'28px', cursor:'pointer', fontSize:'13px',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            fontFamily:'inherit',
          }}>✕</button>
        </div>

        {loading && (
          <div style={{ display:'flex', gap:'5px', alignItems:'center', padding:'8px 2px' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width:'7px', height:'7px', borderRadius:'50%', background:cc,
                animation:`dotPulse 1.2s ${i*0.2}s ease-in-out infinite`,
              }} />
            ))}
            <p style={{ fontSize:'12px', color:'#5e5c88', marginLeft:'6px', fontWeight:600 }}>Looking up…</p>
          </div>
        )}

        {error && !loading && (
          <p style={{ fontSize:'12px', color: error === 'no_key' ? '#FFD700' : '#FF006E', fontWeight:700, lineHeight:1.5 }}>
            {error === 'no_key'
              ? '🔑 Add an AI key in ⚙️ Settings to look up words'
              : `❌ ${error}`}
          </p>
        )}

        {data && !loading && (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            <div style={{ background:`${cc}12`, border:`1px solid ${cc}28`, borderRadius:'14px', padding:'10px 13px' }}>
              <p style={{ fontSize:'9px', color:cc, fontWeight:800, letterSpacing:'0.06em', marginBottom:'4px' }}>🇪🇸 EN ESPAÑOL</p>
              <p style={{ fontSize:'18px', fontWeight:900, color:'#fff' }}>{data.es}</p>
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:'14px', padding:'10px 13px' }}>
              <p style={{ fontSize:'9px', color:'#7a789e', fontWeight:800, letterSpacing:'0.06em', marginBottom:'4px' }}>📖 MEANING</p>
              <p style={{ fontSize:'13px', fontWeight:700, color:'#d4d2f0', lineHeight:1.45 }}>{data.def}</p>
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:'14px', padding:'10px 13px' }}>
              <p style={{ fontSize:'9px', color:'#7a789e', fontWeight:800, letterSpacing:'0.06em', marginBottom:'4px' }}>💬 EXAMPLE</p>
              <p style={{ fontSize:'13px', fontWeight:600, color:'#b8b6d8', lineHeight:1.45, fontStyle:'italic' }}>"{data.ex}"</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
