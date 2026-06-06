import { useMemo } from 'react';

const FREQS = [
  {hz:174,name:'Liberation',desc:'Pain relief & security',color:'#8800ff'},
  {hz:285,name:'Quantum Heal',desc:'Cellular restoration',color:'#00cc88'},
  {hz:396,name:'Root Release',desc:'Guilt & fear dissolve',color:'#cc0044'},
  {hz:432,name:'Cosmic Tune',desc:'Universal harmony',color:'#0088cc'},
  {hz:528,name:'DNA Repair',desc:'Love frequency',color:'#00cc44'},
  {hz:639,name:'Connection',desc:'Heart relationships',color:'#88cc00'},
  {hz:741,name:'Awakening',desc:'Intuition & expression',color:'#00cccc'},
  {hz:852,name:'Third Eye',desc:'Spiritual order',color:'#cc0088'},
  {hz:963,name:'Crown',desc:'Divine consciousness',color:'#cccc00'},
];

const C = { void:'#03010a', glass:'#14102a', dim:'#44406a', silver:'#d0d0e8' };

const waveKeys = useMemo ? null : null; // suppress lint

export default function FrequencyView({ hz, setHz, audioHook, onBack, themeColor = '#c77dff' }) {
  const { play, stop } = audioHook;

  const toggle = (f) => {
    if (hz === f.hz) { stop(); setHz(null); }
    else { play(f.hz); setHz(f.hz); }
  };

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'16px 16px 90px' }}>
      <style>{`
        @keyframes bioGlow{0%,100%{box-shadow:0 0 8px var(--fg,#00ff88)44,0 0 16px var(--fg,#00ff88)22}50%{box-shadow:0 0 24px var(--fg,#00ff88)99,0 0 48px var(--fg,#00ff88)55}}
        @keyframes recPulse2{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.7}}
        @keyframes waveBarF{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
      `}</style>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.dim, fontSize:20, cursor:'pointer' }}>←</button>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',display", fontSize:28, letterSpacing:3, color:'#9b30ff' }}>SOLFEGGIO FREQUENCIES</div>
          <div style={{ fontSize:11, color:C.dim, fontFamily:"'Space Mono',monospace", letterSpacing:2 }}>USE HEADPHONES · BINAURAL BEATS</div>
        </div>
      </div>

      <div style={{ color:C.dim, fontSize:13, marginBottom:20, lineHeight:1.6 }}>
        Left ear receives base Hz, right ear +4Hz. Active frequency recolors the entire app.
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {FREQS.map(f => {
          const active = hz === f.hz;
          return (
            <div key={f.hz} onClick={() => toggle(f)} style={{
              background: active ? `linear-gradient(135deg,${f.color}33,${f.color}11)` : 'rgba(14,12,26,0.7)',
              border: `1px solid ${active ? f.color + 'aa' : f.color + '33'}`,
              borderRadius:16, padding:'16px 20px', cursor:'pointer',
              boxShadow: active ? `0 0 24px ${f.color}44` : 'none',
              transition:'all .25s',
              '--fg': f.color,
              animation: active ? 'bioGlow 2.5s ease-in-out infinite' : 'none',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontFamily:"'Bebas Neue',display", fontSize:28, color:f.color, letterSpacing:1 }}>{f.hz}</span>
                    <span style={{ color:C.dim, fontSize:12, fontFamily:"'Space Mono',monospace" }}>Hz</span>
                    {active && <div style={{ width:8, height:8, borderRadius:'50%', background:f.color, animation:'recPulse2 1s ease-in-out infinite' }}/>}
                  </div>
                  <div style={{ color: active ? C.silver : C.dim, fontSize:14, fontWeight:600 }}>{f.name}</div>
                  <div style={{ color:C.dim, fontSize:12 }}>{f.desc}</div>
                </div>
                <div style={{
                  width:44, height:44, borderRadius:'50%',
                  background: active ? f.color : 'transparent',
                  border:`2px solid ${f.color}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: active ? C.void : f.color, fontSize:18, fontWeight:700, transition:'all .25s',
                }}>{active ? '■' : '▶'}</div>
              </div>
              {active && (
                <div style={{ display:'flex', gap:4, marginTop:12, height:24, alignItems:'flex-end' }}>
                  {Array.from({length:16}).map((_,i) => (
                    <div key={i} style={{
                      flex:1, background:f.color, borderRadius:2,
                      animation:`waveBarF ${0.3 + Math.random() * 0.7}s ${i * 0.05}s ease-in-out infinite`,
                      transformOrigin:'bottom',
                    }}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hz && (
        <button onClick={() => { stop(); setHz(null); }} style={{
          width:'100%', marginTop:16, padding:'14px 0',
          background:'rgba(255,0,68,0.12)', border:'1px solid #ff004466',
          borderRadius:12, color:'#ff0044', fontSize:15, fontWeight:700,
          cursor:'pointer', fontFamily:'inherit',
        }}>
          ⏹ Stop Frequency
        </button>
      )}
    </div>
  );
}
