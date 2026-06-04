import { useState, useRef, useCallback, useEffect } from 'react';
import { SOUNDS, CATEGORY_THEMES } from './phonicsData';

const ALL_SOUNDS = Object.entries(SOUNDS).flatMap(([cat, arr]) =>
  arr.map(s => ({ ...s, cat }))
);

export default function RecordCompare({ themeColor, onBack }) {
  const [idx, setIdx]                 = useState(0);
  const [recording, setRecording]     = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [ttsPlaying, setTtsPlaying]   = useState(false);
  const [grade, setGrade]             = useState(null);   // 'nailed' | 'keep'
  const [voices, setVoices]           = useState([]);
  const recorderRef = useRef(null);
  const waveCanvasRef = useRef(null);
  const animRef = useRef(null);
  const audioCtxRef = useRef(null);

  const sound = ALL_SOUNDS[idx];
  const theme = CATEGORY_THEMES[sound.cat] || { color: themeColor, glow: `${themeColor}60` };

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    cancelAnimationFrame(animRef.current);
    if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close();
  };

  const navigate = (dir) => {
    setIdx(i => (i + dir + ALL_SOUNDS.length) % ALL_SOUNDS.length);
    setRecordedUrl(null);
    setGrade(null);
    window.speechSynthesis.cancel();
    setTtsPlaying(false);
  };

  const playTTS = useCallback(() => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(sound.speech);
    utt.rate = 0.78; utt.pitch = 1.05; utt.lang = 'en-US';
    const preferred = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utt.voice = preferred;
    utt.onstart = () => setTtsPlaying(true);
    utt.onend = () => setTtsPlaying(false);
    utt.onerror = () => setTtsPlaying(false);
    window.speechSynthesis.speak(utt);
  }, [sound, voices]);

  const drawWaveform = (analyser, ctx, canvas, color) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bw = canvas.width / data.length;
      data.forEach((v, i) => {
        const h = (v / 255) * canvas.height * 0.85;
        const hue = 260 + (i / data.length) * 80;
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
      if (canvas) {
        const ctx = canvas.getContext('2d');
        drawWaveform(analyser, ctx, canvas, theme.color);
      }

      const chunks = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        stopRecordingCleanup();
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedUrl(URL.createObjectURL(blob));
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0 12px' }}>
        <button onClick={onBack} style={{ background:'none',border:'none',color:'#6b69a0',fontSize:'22px',cursor:'pointer',padding:'4px' }}>←</button>
        <h2 style={{ fontSize:'22px',fontWeight:900,color:theme.color,flex:1,textShadow:`0 0 20px ${theme.color}` }}>
          🎤 Record & Compare
        </h2>
        <span style={{ fontSize:'13px',color:'#6b69a0',fontWeight:700 }}>{idx + 1}/{ALL_SOUNDS.length}</span>
      </div>

      {/* Navigation */}
      <div style={{ display:'flex',gap:'10px',alignItems:'center',marginBottom:'16px' }}>
        <button onClick={() => navigate(-1)} style={navBtnStyle}>← Prev</button>
        <div style={{ flex:1,textAlign:'center' }}>
          <span style={{ fontSize:'12px',fontWeight:800,color:theme.color,background:theme.dim,padding:'3px 10px',borderRadius:'20px' }}>
            {CATEGORY_THEMES[sound.cat]?.label}
          </span>
        </div>
        <button onClick={() => navigate(1)} style={navBtnStyle}>Next →</button>
      </div>

      {/* Sound card */}
      <div style={{
        background:'rgba(255,255,255,0.04)',
        border:`2px solid ${theme.color}50`,
        borderRadius:'24px', padding:'28px 20px', textAlign:'center',
        marginBottom:'20px',
        boxShadow:`0 0 40px ${theme.glow}`,
      }}>
        <div style={{ fontSize:'52px',fontWeight:900,color:theme.color,textShadow:`0 0 30px ${theme.color}`,lineHeight:1,marginBottom:'8px' }}>
          {sound.letters}
        </div>
        <div style={{ fontSize:'40px',marginBottom:'10px' }}>{sound.emoji}</div>
        <div style={{ fontSize:'11px',color:'#6b69a0',fontFamily:'monospace',marginBottom:'12px' }}>{sound.symbol}</div>
        <div style={{ display:'flex',gap:'8px',justifyContent:'center',flexWrap:'wrap' }}>
          {sound.words.map(w => (
            <span key={w} style={{
              padding:'5px 12px',borderRadius:'20px',
              background:theme.dim, color:theme.color,
              fontSize:'14px',fontWeight:800,
            }}>{w}</span>
          ))}
        </div>
      </div>

      {/* Hear it */}
      <button onClick={playTTS} style={{
        display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',
        padding:'14px', borderRadius:'16px',
        background: ttsPlaying ? theme.dim : 'rgba(255,255,255,0.05)',
        border:`2px solid ${ttsPlaying ? theme.color : '#27254a'}`,
        color: ttsPlaying ? theme.color : '#9b99c0',
        fontSize:'16px',fontWeight:800,cursor:'pointer',marginBottom:'12px',
        boxShadow: ttsPlaying ? `0 0 20px ${theme.glow}` : 'none',
        transition:'all 0.2s',
      }}>
        {ttsPlaying ? (
          <WaveBars color={theme.color} />
        ) : '🔊'}
        {ttsPlaying ? 'Playing target…' : '🔊  Hear Target Sound'}
      </button>

      {/* Record button */}
      <button
        onClick={recording ? stopRecording : startRecording}
        style={{
          display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',
          padding:'16px', borderRadius:'16px',
          background: recording ? 'rgba(255,0,110,0.15)' : 'rgba(255,255,255,0.04)',
          border:`2px solid ${recording ? '#FF006E' : '#27254a'}`,
          color: recording ? '#FF006E' : '#9b99c0',
          fontSize:'16px',fontWeight:800,cursor:'pointer',marginBottom:'16px',
          boxShadow: recording ? '0 0 24px rgba(255,0,110,0.4)' : 'none',
          transition:'all 0.2s',
        }}
      >
        {recording ? '⏹  Stop Recording' : '🎤  Record Yourself'}
      </button>

      {/* Waveform canvas */}
      <canvas
        ref={waveCanvasRef}
        width={360} height={60}
        style={{
          width:'100%', height:'60px', borderRadius:'12px',
          background:'rgba(255,255,255,0.02)',
          marginBottom:'16px',
          display: recording ? 'block' : 'none',
        }}
      />

      {/* Playback & grade */}
      {recordedUrl && (
        <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
          <div style={{ display:'flex',gap:'10px' }}>
            <div style={{ flex:1,background:'rgba(255,255,255,0.04)',borderRadius:'14px',padding:'12px',border:`1px solid ${theme.color}30` }}>
              <p style={{ fontSize:'11px',color:theme.color,fontWeight:800,marginBottom:'6px' }}>🎯 TARGET</p>
              <button onClick={playTTS} style={{ ...audioPlayBtn, borderColor: theme.color, color: theme.color }}>▶ Play</button>
            </div>
            <div style={{ flex:1,background:'rgba(255,255,255,0.04)',borderRadius:'14px',padding:'12px',border:'1px solid #27254a' }}>
              <p style={{ fontSize:'11px',color:'#9b99c0',fontWeight:800,marginBottom:'6px' }}>🎤 YOU</p>
              <audio src={recordedUrl} controls style={{ width:'100%',height:'32px',filter:'invert(0.7)' }} />
            </div>
          </div>

          <p style={{ fontSize:'13px',color:'#6b69a0',fontWeight:600,textAlign:'center' }}>
            How did you sound?
          </p>
          <div style={{ display:'flex',gap:'10px' }}>
            <button onClick={() => setGrade('nailed')} style={{
              flex:1,padding:'12px',borderRadius:'14px',
              background: grade==='nailed' ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)',
              border:`2px solid ${grade==='nailed' ? '#00FF88' : '#27254a'}`,
              color: grade==='nailed' ? '#00FF88' : '#9b99c0',
              fontSize:'15px',fontWeight:800,cursor:'pointer',transition:'all 0.15s',
            }}>
              🎯 Nailed it!
            </button>
            <button onClick={() => setGrade('keep')} style={{
              flex:1,padding:'12px',borderRadius:'14px',
              background: grade==='keep' ? 'rgba(255,0,110,0.12)' : 'rgba(255,255,255,0.04)',
              border:`2px solid ${grade==='keep' ? '#FF006E' : '#27254a'}`,
              color: grade==='keep' ? '#FF006E' : '#9b99c0',
              fontSize:'15px',fontWeight:800,cursor:'pointer',transition:'all 0.15s',
            }}>
              🔁 Keep trying
            </button>
          </div>

          {grade === 'nailed' && (
            <div style={{ textAlign:'center',padding:'12px',borderRadius:'14px',background:'rgba(0,255,136,0.08)',border:'1px solid #00FF8840' }}>
              <p style={{ fontSize:'18px',fontWeight:900,color:'#00FF88',textShadow:'0 0 20px #00FF88' }}>
                🌟 Amazing! You nailed it!
              </p>
            </div>
          )}
          {grade === 'keep' && (
            <div style={{ textAlign:'center',padding:'12px',borderRadius:'14px',background:'rgba(255,0,110,0.08)',border:'1px solid #FF006E40' }}>
              <p style={{ fontSize:'15px',fontWeight:800,color:'#FF006E' }}>
                💪 Keep going — try again!
              </p>
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
          width:'3px', height:'100%', borderRadius:'2px', background: color,
          animation: `wave 0.7s ease-in-out ${i*0.12}s infinite`,
          transformOrigin: 'bottom',
        }} />
      ))}
      <style>{`@keyframes wave{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}`}</style>
    </div>
  );
}

const navBtnStyle = {
  padding:'8px 16px', borderRadius:'20px',
  background:'rgba(255,255,255,0.04)', border:'1px solid #27254a',
  color:'#9b99c0', fontSize:'13px', fontWeight:700, cursor:'pointer',
};

const audioPlayBtn = {
  display:'block', width:'100%', padding:'6px', borderRadius:'8px',
  background:'transparent', border:'2px solid', fontSize:'13px',
  fontWeight:800, cursor:'pointer',
};
