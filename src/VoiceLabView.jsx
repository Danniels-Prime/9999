import { useState, useRef, useEffect } from 'react';
import { PHRASES, SLANG } from './langData';

const C = { dim:'#44406a', glass:'#14102a', ghost:'#140f20', silver:'#d0d0e8', rose:'#ff006b', bio:'#00ff88', void:'#03010a', red:'#ff0044' };

const ALL_CARDS = [
  ...Object.values(PHRASES).flat(),
  ...Object.values(SLANG).flat(),
];

export default function VoiceLabView({ onBack, themeColor = '#c77dff', voiceRecs = {}, onSaveVoiceRecs, voices = [] }) {
  const [cardIdx, setCardIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [hasRec, setHasRec] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('');
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  const card = ALL_CARDS[cardIdx];
  const recKey = card?.id;
  const storedRec = voiceRecs[recKey];

  useEffect(() => { setHasRec(!!storedRec); setStatus(''); }, [cardIdx, storedRec]);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      mrRef.current = new MediaRecorder(stream);
      mrRef.current.ondataavailable = e => chunksRef.current.push(e.data);
      mrRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const b64 = reader.result;
          onSaveVoiceRecs?.({ ...voiceRecs, [recKey]: b64 });
          setHasRec(true); setStatus('Saved!');
          setTimeout(() => setStatus(''), 2000);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mrRef.current.start();
      setRecording(true); setStatus('Recording…');
    } catch {
      setStatus('Microphone access denied');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const stopRec = () => {
    if (mrRef.current && recording) { mrRef.current.stop(); setRecording(false); }
  };

  const playRec = () => {
    if (!storedRec) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const audio = new Audio(storedRec);
    audioRef.current = audio;
    audio.onplay = () => setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audio.play().catch(() => setPlaying(false));
  };

  const speakTTS = () => {
    if (!card) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(card.en);
    utt.lang = 'en-US'; utt.rate = 0.82; utt.pitch = 1.05;
    const pref = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
    if (pref) utt.voice = pref;
    window.speechSynthesis.speak(utt);
  };

  const deleteRec = () => {
    const nr = { ...voiceRecs }; delete nr[recKey];
    onSaveVoiceRecs?.(nr);
    setHasRec(false); setStatus('Deleted');
    setTimeout(() => setStatus(''), 1500);
  };

  if (!card) return null;

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'16px 16px 90px' }}>
      <style>{`
        @keyframes recPulseVL{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.7}}
        @keyframes waveBarVL{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
      `}</style>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.dim, fontSize:20, cursor:'pointer' }}>←</button>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',display", fontSize:28, letterSpacing:3, color:C.rose }}>VOICE LAB</div>
          <div style={{ fontSize:11, color:C.dim, fontFamily:"'Space Mono',monospace", letterSpacing:2 }}>
            {Object.keys(voiceRecs).length} recordings · {ALL_CARDS.length} cards
          </div>
        </div>
      </div>

      <div style={{ color:C.dim, fontSize:13, marginBottom:20, lineHeight:1.6 }}>
        Record yourself reading each phrase. Play back to check your pronunciation against the TTS reference.
      </div>

      <div style={{ background:'rgba(14,12,26,0.7)', backdropFilter:'blur(16px)', border:`1px solid ${themeColor}33`, borderRadius:20, padding:24, marginBottom:20, textAlign:'center' }}>
        <div style={{ fontSize:11, color:C.dim, letterSpacing:3, marginBottom:12, fontFamily:"'Space Mono',monospace" }}>
          {card.id.startsWith('s') ? '🔥 SLANG' : '🌍 ENGLISH'}
        </div>
        <div style={{ fontFamily:"'Bebas Neue',display", fontSize:40, color:themeColor, letterSpacing:2, marginBottom:8, lineHeight:1.1 }}>{card.en}</div>
        <div style={{ color:C.silver, fontSize:16, fontWeight:600, marginBottom:12 }}>🇪🇸 {card.es}</div>
        {card.meaning && (
          <div style={{ fontSize:12, color:C.dim, background:`${themeColor}11`, borderRadius:10, padding:'8px 12px' }}>
            {card.meaning}
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16, justifyContent:'center', alignItems:'center' }}>
        <button onClick={() => setCardIdx(i => Math.max(0, i - 1))} disabled={cardIdx === 0}
          style={{ background:'rgba(14,12,26,0.7)', border:`1px solid ${C.dim}44`, borderRadius:10, padding:'10px 16px', color:C.dim, cursor:'pointer', fontFamily:'inherit', fontSize:14, opacity: cardIdx === 0 ? 0.4 : 1 }}>← Prev</button>
        <span style={{ color:C.dim, fontSize:12, padding:'10px 14px', background:'rgba(14,12,26,0.7)', borderRadius:10, border:`1px solid ${C.dim}22`, fontFamily:"'Space Mono',monospace" }}>
          {cardIdx + 1} / {ALL_CARDS.length}
        </span>
        <button onClick={() => setCardIdx(i => Math.min(ALL_CARDS.length - 1, i + 1))} disabled={cardIdx === ALL_CARDS.length - 1}
          style={{ background:'rgba(14,12,26,0.7)', border:`1px solid ${C.dim}44`, borderRadius:10, padding:'10px 16px', color:C.dim, cursor:'pointer', fontFamily:'inherit', fontSize:14, opacity: cardIdx === ALL_CARDS.length - 1 ? 0.4 : 1 }}>Next →</button>
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:16, flexWrap:'wrap' }}>
        <button onClick={speakTTS} style={{
          padding:'12px 18px', borderRadius:12, fontSize:14, fontWeight:700,
          background:`${themeColor}15`, border:`1px solid ${themeColor}40`, color:themeColor,
          cursor:'pointer', fontFamily:'inherit',
        }}>🔊 Reference</button>

        {!recording ? (
          <button onClick={startRec} style={{
            padding:'12px 22px', borderRadius:12, fontSize:14, fontWeight:700,
            background:`${C.rose}22`, border:`1px solid ${C.rose}66`, color:C.rose,
            cursor:'pointer', fontFamily:'inherit',
          }}>🎙 Record</button>
        ) : (
          <button onClick={stopRec} style={{
            padding:'12px 22px', borderRadius:12, fontSize:14, fontWeight:700,
            background:`${C.red}22`, border:`1px solid ${C.red}66`, color:C.red,
            cursor:'pointer', fontFamily:'inherit',
            animation:'recPulseVL 1s ease-in-out infinite',
          }}>⏹ Stop</button>
        )}

        {hasRec && (
          <button onClick={playRec} disabled={playing} style={{
            padding:'12px 18px', borderRadius:12, fontSize:14, fontWeight:700,
            background:`${C.bio}15`, border:`1px solid ${C.bio}40`, color:C.bio,
            cursor:'pointer', fontFamily:'inherit', opacity: playing ? 0.6 : 1,
          }}>{playing ? '▶ Playing…' : '▶ My Voice'}</button>
        )}

        {hasRec && (
          <button onClick={deleteRec} style={{
            padding:'12px 14px', borderRadius:12, fontSize:14,
            background:'rgba(255,255,255,0.03)', border:`1px solid ${C.dim}44`, color:C.dim,
            cursor:'pointer', fontFamily:'inherit',
          }}>🗑</button>
        )}
      </div>

      {status && (
        <div style={{ textAlign:'center', color:C.bio, fontSize:14, marginBottom:12 }}>{status}</div>
      )}

      {recording && (
        <div style={{ display:'flex', gap:3, justifyContent:'center', height:32, alignItems:'flex-end', marginTop:8 }}>
          {Array.from({length:20}).map((_, i) => (
            <div key={i} style={{
              width:6, background:C.rose, borderRadius:3,
              animation:`waveBarVL ${0.2 + Math.random() * 0.5}s ${i * 0.04}s ease-in-out infinite`,
              transformOrigin:'bottom',
            }}/>
          ))}
        </div>
      )}
    </div>
  );
}
