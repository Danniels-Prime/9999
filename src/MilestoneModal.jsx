const MOTIVATIONAL = {
  15: "You're just getting started — keep it up!",
  20: "Silver speed! You're building something real.",
  25: "Gold rank! You're unstoppable!",
  30: "Diamond status! You've come so far!",
  40: "Champion! Most people never make it here.",
  50: "LEGEND! You are one of the greats!",
  77: "GOD MODE! You've mastered the language!",
  100: "ULTIMATE MASTER! The final achievement!",
};

export default function MilestoneModal({ level, milestone, onClose }) {
  const { emoji, title, reward, color } = milestone;
  const msg = MOTIVATIONAL[level] || 'Keep going — you are incredible!';

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:999,
      background:'rgba(3,1,10,0.88)',
      backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20,
    }}>
      <style>{`
        @keyframes milestoneIn{0%{transform:scale(0.7);opacity:0}65%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
        @keyframes emojiBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes mGlowPulse{0%,100%{text-shadow:0 0 20px ${color}99,0 0 40px ${color}55}50%{text-shadow:0 0 40px ${color},0 0 80px ${color}88}}
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'linear-gradient(145deg,#0e0c1a,#14102a)',
          border:`2px solid ${color}55`,
          borderRadius:28, padding:'36px 28px',
          maxWidth:360, width:'100%',
          textAlign:'center',
          boxShadow:`0 0 60px ${color}33, 0 0 120px ${color}18, inset 0 0 40px rgba(0,0,0,0.4)`,
          animation:'milestoneIn .55s cubic-bezier(0.34,1.56,0.64,1) both',
          position:'relative', overflow:'hidden',
        }}
      >
        {/* Sparkle decorations */}
        {['★','✦','✧','⋆','✦','★'].map((s, i) => (
          <div key={i} style={{
            position:'absolute', fontSize: i % 2 ? '10px' : '8px',
            color:`${color}55`,
            top:`${10 + i * 14}%`,
            left: i % 2 ? `${5 + i * 3}%` : 'auto',
            right: i % 2 ? 'auto' : `${5 + i * 3}%`,
            animation:`mGlowPulse ${1.5 + i * 0.3}s ease-in-out infinite`,
            animationDelay:`${i * 0.2}s`,
            pointerEvents:'none',
          }}>{s}</div>
        ))}

        {/* Animated emoji */}
        <div style={{ fontSize:72, lineHeight:1, marginBottom:16, animation:'emojiBounce 2s ease-in-out infinite', display:'inline-block' }}>
          {emoji}
        </div>

        {/* Level headline */}
        <div style={{
          fontSize:38, fontFamily:"'Bebas Neue',display",
          letterSpacing:4, marginBottom:8,
          animation:'mGlowPulse 2s ease-in-out infinite',
          color,
        }}>
          LEVEL {level} REACHED!
        </div>

        {/* Title badge */}
        <div style={{
          fontSize:18, fontWeight:800, color:'#fff',
          marginBottom:20, letterSpacing:1,
          textShadow:`0 0 12px ${color}60`,
        }}>
          {title}
        </div>

        {/* Reward box */}
        <div style={{
          background:'rgba(255,215,0,0.08)',
          border:'1.5px solid rgba(255,215,0,0.35)',
          borderRadius:16, padding:'14px 20px',
          marginBottom:20,
        }}>
          <div style={{ fontSize:11, color:'#FFD70099', fontWeight:700, letterSpacing:2, marginBottom:6 }}>
            🎁 YOUR PRIZE
          </div>
          <div style={{ fontSize:26, fontWeight:900, color:'#FFD700', textShadow:'0 0 16px #FFD70080' }}>
            {reward}
          </div>
        </div>

        {/* Motivational message */}
        <div style={{
          fontSize:13, color:'#d0d0e888', lineHeight:1.6,
          marginBottom:24, fontStyle:'italic',
        }}>
          {msg}
        </div>

        {/* Claim button */}
        <button
          onClick={onClose}
          style={{
            width:'100%', padding:'16px 0', borderRadius:16,
            fontSize:17, fontWeight:800, cursor:'pointer',
            fontFamily:"'Outfit',sans-serif", letterSpacing:1,
            background:`linear-gradient(135deg,${color}33,${color}18)`,
            border:`1.5px solid ${color}88`,
            color,
            boxShadow:`0 0 20px ${color}33`,
            transition:'all .15s',
          }}
        >
          Claim It! 🎉
        </button>
      </div>
    </div>
  );
}
