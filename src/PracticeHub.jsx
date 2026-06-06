import { useState } from 'react';
import SpeakCoach from './SpeakCoach';
import ConvoAI from './ConvoAI';
import StoryDialogues from './StoryDialogues';

const LS_KEY = 'lucid_practice_mode';
const MODES = [
  { id:'speak',   icon:'🎤', label:'Speak' },
  { id:'chat',    icon:'💬', label:'Chat AI' },
  { id:'stories', icon:'📖', label:'Stories' },
];

export default function PracticeHub({ themeColor, voices, apiKey, openaiKey, deepseekKey, customEndpoint, customKey, customModel, onBack }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return MODES.find(m => m.id === saved) ? saved : 'speak';
  });

  const switchMode = (id) => {
    setMode(id);
    localStorage.setItem(LS_KEY, id);
    window.speechSynthesis?.cancel();
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Sub-mode pill selector */}
      <div style={{ flexShrink:0, display:'flex', gap:'6px', padding:'12px 16px 8px', justifyContent:'center', borderBottom:'1px solid #1a1835' }}>
        {MODES.map(m => {
          const active = mode === m.id;
          return (
            <button key={m.id} onClick={() => switchMode(m.id)} style={{
              padding:'7px 16px', borderRadius:'50px',
              border:`2px solid ${active ? themeColor : '#27254a'}`,
              background: active ? `${themeColor}22` : 'rgba(255,255,255,0.03)',
              color: active ? themeColor : '#7a789e',
              fontSize:'12px', fontWeight:800, cursor:'pointer',
              boxShadow: active ? `0 0 14px ${themeColor}50` : 'none',
              transition:'all .18s', whiteSpace:'nowrap',
              fontFamily:'inherit',
            }}>
              {m.icon} {m.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'hidden' }}>
        {mode === 'speak' && (
          <SpeakCoach themeColor={themeColor} voices={voices} onBack={onBack} />
        )}
        {mode === 'chat' && (
          <ConvoAI themeColor={themeColor} voices={voices} apiKey={apiKey} openaiKey={openaiKey} deepseekKey={deepseekKey} customEndpoint={customEndpoint} customKey={customKey} customModel={customModel} onBack={() => switchMode('speak')} />
        )}
        {mode === 'stories' && (
          <StoryDialogues themeColor={themeColor} voices={voices} onBack={() => switchMode('speak')} apiKey={apiKey} openaiKey={openaiKey} deepseekKey={deepseekKey} customEndpoint={customEndpoint} customKey={customKey} customModel={customModel} />
        )}
      </div>
    </div>
  );
}
