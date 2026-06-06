import { useState, useEffect, useRef } from 'react';

const C = { dim:'#44406a', ghost:'#140f20', silver:'#d0d0e8', bio:'#00ff88', amber:'#ffaa00', void:'#03010a' };

export default function FocusTimerView({ onBack, themeColor = '#c77dff' }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const timerRef = useRef(null);

  const total = minutes * 60;
  const remaining = Math.max(0, total - elapsed);
  const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const done = elapsed >= total && total > 0;

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (running && !done) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running, done]);

  useEffect(() => { if (done) setRunning(false); }, [done]);

  const reset = () => { setRunning(false); setElapsed(0); };
  const saveMin = (v) => { const m = parseInt(v) || 25; setMinutes(m); if (!running) reset(); };

  const r = 80, circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'16px 16px 90px', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, width:'100%' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.dim, fontSize:20, cursor:'pointer' }}>←</button>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',display", fontSize:28, letterSpacing:3, color:'#FFD700' }}>FOCUS TIMER</div>
          <div style={{ fontSize:11, color:C.dim, fontFamily:"'Space Mono',monospace", letterSpacing:2 }}>DEEP WORK SESSION</div>
        </div>
      </div>

      <div style={{ position:'relative', width:200, height:200, marginBottom:32 }}>
        <svg width={200} height={200} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={100} cy={100} r={r} fill="none" stroke={C.ghost} strokeWidth={8}/>
          <circle cx={100} cy={100} r={r} fill="none" stroke={done ? C.bio : themeColor} strokeWidth={8}
            strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
            style={{ transition:'stroke-dashoffset .5s ease, stroke .3s' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontFamily:"'Bebas Neue',display", fontSize:44, color: done ? C.bio : themeColor, letterSpacing:2, lineHeight:1 }}>
            {done ? 'DONE!' : fmt(remaining)}
          </div>
          <div style={{ color:C.dim, fontSize:12, marginTop:4 }}>{pct}%</div>
        </div>
      </div>

      {!running && elapsed === 0 && (
        <div style={{ background:'rgba(14,12,26,0.7)', border:`1px solid ${C.dim}44`, borderRadius:14, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
          <span style={{ color:C.dim, fontSize:14 }}>Minutes:</span>
          <input type="number" min={1} max={300} value={minutes}
            onChange={e => saveMin(e.target.value)}
            style={{ width:70, background:C.ghost, border:`1px solid ${C.dim}44`, borderRadius:8, padding:'6px 10px', color:C.silver, fontSize:16, textAlign:'center', outline:'none', fontFamily:"'Outfit',sans-serif" }}/>
          <div style={{ display:'flex', gap:6 }}>
            {[5, 10, 25, 45].map(m => (
              <button key={m} onClick={() => saveMin(m)} style={{
                background: minutes === m ? `${themeColor}33` : 'rgba(14,12,26,0.7)',
                border: `1px solid ${minutes === m ? themeColor : C.dim}44`,
                borderRadius:8, padding:'5px 8px',
                color: minutes === m ? themeColor : C.dim,
                fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              }}>{m}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:12 }}>
        {!done && (
          <button onClick={() => setRunning(r => !r)} style={{
            padding:'14px 32px', borderRadius:12, fontSize:18, fontWeight:700,
            background: running ? `${C.amber}22` : `${C.bio}22`,
            border: `1px solid ${running ? C.amber : C.bio}66`,
            color: running ? C.amber : C.bio, cursor:'pointer', fontFamily:'inherit',
          }}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
        )}
        {(elapsed > 0 || done) && (
          <button onClick={reset} style={{
            padding:'14px 24px', borderRadius:12, fontSize:16,
            background:'rgba(255,255,255,0.03)', border:`1px solid ${C.dim}44`,
            color:C.dim, cursor:'pointer', fontFamily:'inherit',
          }}>↺ Reset</button>
        )}
      </div>

      {done && (
        <div style={{ marginTop:20, textAlign:'center', animation:'slideUp .4s ease both' }}>
          <div style={{ fontSize:40 }}>🧠</div>
          <div style={{ color:C.bio, fontSize:18, fontWeight:700, marginTop:8, fontFamily:"'Outfit',sans-serif" }}>Focus session complete!</div>
          <div style={{ color:C.dim, fontSize:13, marginTop:6 }}>Great work. Take a short break.</div>
          <button onClick={reset} style={{
            marginTop:12, padding:'12px 28px', borderRadius:12,
            background:`${themeColor}22`, border:`1px solid ${themeColor}66`,
            color:themeColor, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
          }}>New Session</button>
        </div>
      )}
    </div>
  );
}
