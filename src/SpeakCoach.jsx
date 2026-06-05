import { useState, useRef, useCallback, useEffect } from 'react';
import { PHRASES, SLANG, CATEGORY_THEMES } from './langData';

const ALL_CARDS = [
  ...Object.entries(PHRASES).flatMap(([catKey, arr]) =>
    arr.map(p => ({ ...p, catKey, type: 'phrase' }))
  ),
  ...Object.entries(SLANG).flatMap(([catKey, arr]) =>
    arr.map(s => ({ ...s, catKey, type: 'slang' }))
  ),
];

export default function SpeakCoach({ themeColor, voices = [], onBack }) {
  const [idx, setIdx]               = useState(0);
  const [recording, setRecording]   = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [grade, setGrade]           = useState(null);
  const [showEs, setShowEs]         = useState(true);
  const recorderRef  = useRef(null);
  const waveCanvasRef = useRef(null);
  const animRef      = useRef(null);
  const audioCtxRef  = useRef(null);

  const card  = ALL_CARDS[idx];
  const theme = CATEGORY_THEMES[card.catKey] || { color: themeColor, glow: `${themeColor}60`, dim: `${themeColor}15` };

  useEffect(() => {
    return () => stopCleanup();
  }, []);

  const stopCleanup = () => {
    cancelAnimationFrame(animRef.current);
    if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close();
  };

  const navigate = (dir) => {
    setIdx(i => (i + dir + ALL_CARDS.length) % ALL_CARDS.length);
    setRecordedUrl(null);
    setGrade(null);
    setShowEs(true);
    window.speechSynthesis.cancel();
    setTtsPlaying(false);
  };

  const playTTS = useCallback(() => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(card.en);
    utt.rate = 0.82; utt.pitch = 1.05; utt.lang = 'en-US';
    const preferred = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utt.voice = preferred;
    utt.onstart = () => setTtsPlaying(true);
    utt.onend   = () => setTtsPlaying(false);
    utt.onerror = () => setTtsPlaying(false);
    window.speechSynthesis.speak(utt);
  }, [card, voices]);

  const drawWave = (analyser, ctx, canvas, color) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bw = canvas.width / data.length;
      data.forEach((v, i) => {
        const h = (v / 255) * canvas.height * 0.85;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7 + (v / 255) * 0.3;
        ctx.beginPath();
        ctx.roundRect(i * bw, canvas.height - h, bw - 1, h, 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
    draw();
  };

  const startRecording = async () => {
    try {
      setRecordedUrl(null);
      setGrade(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      const canvas = waveCanvasRef.current;
      if (canvas) drawWave(analyser, canvas.getContext('2d'), canvas, theme.color);
      const chunks = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        stopCleanup();
        stream.getTracks().forEach(t => t.stop());
        setRecordedUrl(URL.createObjectURL(new Blob(chunks, { type:'audio/webm' })));
        setRecording(false);
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
    } catch {
      alert('🎤 Microphone permission needed');
    }
  };

  const stopRecording = () => recorderRef.current?.stop();

  const typeTag = card.type === 'slang' ? '🔥 SLANG' : '📚 PHRASE';

  return (
    <div style={{ height:'100%',display:'flex',flexDirection:'column',padding:'0 20px 20px',overflowY:'auto' }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',gap:'12px',padding:'16px 0 12px' }}>
        <button onClick={onBack} style={{ background:'none',border:'none',color:'#6b69a0',fontSize:'22px',cursor:'pointer',padding:'4px' }}>←</button>
        <h2 style={{ fontSize:'22px',fontWeight:900,color:theme.color,flex:1,textShadow:`0 0 20px ${theme.color}` }}>
          🎤 SpeakCoach
        </h2>
        <span style={{ fontSize:'13px',color:'#6b69a0',fontWeight:700 }}>{idx+1}/{ALL_CARDS.length}</span>
      </div>

      {/* Navigation */}
      <div style={{ display:'flex',gap:'10px',alignItems:'center',marginBottom:'16px' }}>
        <button onClick={() => navigate(-1)} style={navBtn}>← Prev</button>
        <div style={{ flex:1,textAlign:'center',display:'flex',gap:'6px',justifyContent:'center',flexWrap:'wrap' }}>
          <span style={{ fontSize:'11px',fontWeight:800,color:theme.color,background:theme.dim,padding:'3px 10px',borderRadius:'20px' }}>
            {theme.icon} {theme.label}
          </span>
          <span style={{ fontSize:'11px',fontWeight:800,color:'#9b99c0',background:'rgba(255,255,255,0.05)',padding:'3px 10px',borderRadius:'20px' }}>
            {typeTag}
          </span>
        </div>
        <button onClick={() => navigate(1)} style={navBtn}>Next →</button>
      </div>

      {/* Card */}
      <div style={{
        background:'rgba(255,255,255,0.04)',border:`2px solid ${theme.color}50`,
        borderRadius:'24px',padding:'24px 20px',textAlign:'center',marginBottom:'16px',
        boxShadow:`0 0 40px ${theme.glow}`,
      }}>
        {/* Spanish */}
        <div style={{ marginBottom:'12px' }}>
          <p style={{ fontSize:'11px',color:'#6b69a0',fontWeight:800,letterSpacing:'1px',marginBottom:'4px' }}>🇪🇸 EN ESPAÑOL</p>
          <p style={{ fontSize:'clamp(16px,4.5vw,24px)',fontWeight:900,color:'#FFD700',lineHeight:1.4 }}>
            {card.es}
          </p>
        </div>

        {/* Toggle English */}
        <button onClick={() => setShowEs(s => !s)} style={{
          background:showEs?`${theme.color}20`:'rgba(255,255,255,0.03)',
          border:`1px solid ${showEs?theme.color:'#27254a'}`,
          borderRadius:'12px',padding:'10px 16px',width:'100%',cursor:'pointer',
          marginBottom:'10px',transition:'all 0.2s',
        }}>
          {showEs ? (
            <div>
              <p style={{ fontSize:'11px',color:theme.color,fontWeight:800,marginBottom:'4px' }}>🇺🇸 IN ENGLISH</p>
              <p style={{ fontSize:'clamp(18px,5vw,28px)',fontWeight:900,color:'#fff',lineHeight:1.3 }}>
                {card.en}
              </p>
              {card.meaning && (
                <p style={{ fontSize:'12px',color:'#6b69a0',marginTop:'4px',fontStyle:'italic' }}>
                  ({card.meaning})
                </p>
              )}
            </div>
          ) : (
            <p style={{ fontSize:'13px',color:'#4a4870',fontWeight:700 }}>👁 Tap to reveal English</p>
          )}
        </button>

        {/* Example sentence */}
        {card.en_ex && (
          <div style={{ background:'rgba(255,255,255,0.03)',borderRadius:'12px',padding:'10px 14px',textAlign:'left' }}>
            <p style={{ fontSize:'11px',color:'#6b69a0',fontWeight:800,marginBottom:'3px' }}>💬 EXAMPLE</p>
            <p style={{ fontSize:'13px',color:'#c8c6e8',fontWeight:600,lineHeight:1.5 }}>{card.en_ex}</p>
            {card.es_ex && (
              <p style={{ fontSize:'12px',color:'#5e5c88',fontWeight:600,marginTop:'4px',lineHeight:1.4 }}>{card.es_ex}</p>
            )}
          </div>
        )}
      </div>

      {/* Hear it */}
      <button onClick={playTTS} style={{
        display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',
        padding:'13px',borderRadius:'16px',
        background:ttsPlaying?theme.dim:'rgba(255,255,255,0.05)',
        border:`2px solid ${ttsPlaying?theme.color:'#27254a'}`,
        color:ttsPlaying?theme.color:'#9b99c0',
        fontSize:'15px',fontWeight:800,cursor:'pointer',marginBottom:'10px',
        boxShadow:ttsPlaying?`0 0 20px ${theme.glow}`:'none',transition:'all 0.2s',
      }}>
        {ttsPlaying ? <WaveBars color={theme.color}/> : '🔊'}
        {ttsPlaying ? 'Playing…' : '🔊  Hear Native English'}
      </button>

      {/* Record */}
      <button onClick={recording ? stopRecording : startRecording} style={{
        display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',
        padding:'14px',borderRadius:'16px',
        background:recording?'rgba(255,0,110,0.15)':'rgba(255,255,255,0.04)',
        border:`2px solid ${recording?'#FF006E':'#27254a'}`,
        color:recording?'#FF006E':'#9b99c0',
        fontSize:'15px',fontWeight:800,cursor:'pointer',marginBottom:'12px',
        boxShadow:recording?'0 0 24px rgba(255,0,110,0.4)':'none',transition:'all 0.2s',
      }}>
        {recording ? '⏹  Stop Recording' : '🎤  Record Yourself'}
      </button>

      <canvas ref={waveCanvasRef} width={360} height={60} style={{
        width:'100%',height:'60px',borderRadius:'12px',
        background:'rgba(255,255,255,0.02)',marginBottom:'12px',
        display:recording?'block':'none',
      }}/>

      {/* Playback & grade */}
      {recordedUrl && (
        <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
          <div style={{ display:'flex',gap:'10px' }}>
            <div style={{ flex:1,background:'rgba(255,255,255,0.04)',borderRadius:'14px',padding:'12px',border:`1px solid ${theme.color}30` }}>
              <p style={{ fontSize:'11px',color:theme.color,fontWeight:800,marginBottom:'6px' }}>🎯 NATIVE</p>
              <button onClick={playTTS} style={{ ...audioBtn, borderColor:theme.color,color:theme.color }}>▶ Play</button>
            </div>
            <div style={{ flex:1,background:'rgba(255,255,255,0.04)',borderRadius:'14px',padding:'12px',border:'1px solid #27254a' }}>
              <p style={{ fontSize:'11px',color:'#9b99c0',fontWeight:800,marginBottom:'6px' }}>🎤 TÚ</p>
              <audio src={recordedUrl} controls style={{ width:'100%',height:'32px',filter:'invert(0.7)' }}/>
            </div>
          </div>

          <p style={{ fontSize:'13px',color:'#6b69a0',fontWeight:600,textAlign:'center' }}>¿Cómo sonaste?</p>
          <div style={{ display:'flex',gap:'10px' }}>
            <button onClick={() => setGrade('nailed')} style={{
              flex:1,padding:'12px',borderRadius:'14px',
              background:grade==='nailed'?'rgba(0,255,136,0.15)':'rgba(255,255,255,0.04)',
              border:`2px solid ${grade==='nailed'?'#00FF88':'#27254a'}`,
              color:grade==='nailed'?'#00FF88':'#9b99c0',
              fontSize:'14px',fontWeight:800,cursor:'pointer',transition:'all 0.15s',
            }}>🎯 ¡Lo clavé!</button>
            <button onClick={() => setGrade('keep')} style={{
              flex:1,padding:'12px',borderRadius:'14px',
              background:grade==='keep'?'rgba(255,0,110,0.12)':'rgba(255,255,255,0.04)',
              border:`2px solid ${grade==='keep'?'#FF006E':'#27254a'}`,
              color:grade==='keep'?'#FF006E':'#9b99c0',
              fontSize:'14px',fontWeight:800,cursor:'pointer',transition:'all 0.15s',
            }}>🔁 Seguir</button>
          </div>

          {grade === 'nailed' && (
            <div style={{ textAlign:'center',padding:'12px',borderRadius:'14px',background:'rgba(0,255,136,0.08)',border:'1px solid #00FF8840' }}>
              <p style={{ fontSize:'18px',fontWeight:900,color:'#00FF88',textShadow:'0 0 20px #00FF88' }}>
                🌟 ¡Perfecto! You nailed it!
              </p>
            </div>
          )}
          {grade === 'keep' && (
            <div style={{ textAlign:'center',padding:'12px',borderRadius:'14px',background:'rgba(255,0,110,0.08)',border:'1px solid #FF006E40' }}>
              <p style={{ fontSize:'15px',fontWeight:800,color:'#FF006E' }}>💪 ¡Sigue intentando!</p>
              <button onClick={startRecording} style={{
                marginTop:'8px',padding:'8px 20px',borderRadius:'20px',
                background:'rgba(255,0,110,0.2)',border:'1px solid #FF006E',
                color:'#FF006E',fontSize:'13px',fontWeight:800,cursor:'pointer',
              }}>🎤 Record again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WaveBars({ color }) {
  return (
    <div style={{ display:'flex',gap:'3px',alignItems:'center',height:'20px' }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          width:'3px',height:'100%',borderRadius:'2px',background:color,
          animation:`wave 0.7s ease-in-out ${i*0.12}s infinite`,transformOrigin:'bottom',
        }}/>
      ))}
      <style>{`@keyframes wave{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}`}</style>
    </div>
  );
}

const navBtn = {
  padding:'8px 16px',borderRadius:'20px',
  background:'rgba(255,255,255,0.04)',border:'1px solid #27254a',
  color:'#9b99c0',fontSize:'13px',fontWeight:700,cursor:'pointer',
};

const audioBtn = {
  display:'block',width:'100%',padding:'6px',borderRadius:'8px',
  background:'transparent',border:'2px solid',fontSize:'13px',fontWeight:800,cursor:'pointer',
};
