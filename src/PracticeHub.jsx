import { useState } from 'react';
import SpeakCoach from './SpeakCoach';
import ConvoAI from './ConvoAI';
import StoryDialogues from './StoryDialogues';
import VoiceLabView from './VoiceLabView';
import FocusTimerView from './FocusTimerView';
import CallTranscribe from './CallTranscribe';

const LS_KEY = 'lucid_practice_mode';
const MODES = [
  { id:'speak',      icon:'🎤', label:'Speak' },
  { id:'chat',       icon:'💬', label:'Chat AI' },
  { id:'transcribe', icon:'📡', label:'Live' },
  { id:'stories',    icon:'📖', label:'Stories' },
  { id:'voice',      icon:'🎙', label:'Voice Lab' },
  { id:'focus',      icon:'◎', label:'Focus' },
];

export default function PracticeHub({ themeColor, voices, apiKey, openaiKey, openrouterKey, deepseekKey, customEndpoint, customKey, customModel, onBack, voiceRecs, onSaveVoiceRecs }) {
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
      <div style={{ flexShrink:0, overflowX:'auto', borderBottom:'1px solid #1a1835', paddingBottom:'8px' }}>
        <div style={{ display:'flex', gap:'6px', padding:'10px 12px 0', width:'max-content' }}>
          {MODES.map(m => {
            const active = mode === m.id;
            return (
              <button key={m.id} onClick={() => switchMode(m.id)} style={{
                padding:'7px 14px', borderRadius:'50px',
                border:`2px solid ${active ? themeColor : '#27254a'}`,
                background: active ? `${themeColor}22` : 'rgba(255,255,255,0.03)',
                color: active ? themeColor : '#7a789e',
                fontSize:'11px', fontWeight:800, cursor:'pointer',
                boxShadow: active ? `0 0 14px ${themeColor}50` : 'none',
                transition:'all .18s', whiteSpace:'nowrap',
                fontFamily:'inherit',
              }}>
                {m.icon} {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'hidden' }}>
        {mode === 'speak' && (
          <SpeakCoach themeColor={themeColor} voices={voices} onBack={onBack} />
        )}
        {mode === 'chat' && (
          <ConvoAI themeColor={themeColor} voices={voices} apiKey={apiKey} openaiKey={openaiKey} openrouterKey={openrouterKey} deepseekKey={deepseekKey} customEndpoint={customEndpoint} customKey={customKey} customModel={customModel} onBack={() => switchMode('speak')} />
        )}
        {mode === 'transcribe' && (
          <CallTranscribe
            themeColor={themeColor}
            voices={voices}
            apiKey={apiKey}
            openaiKey={openaiKey}
            openrouterKey={openrouterKey}
            deepseekKey={deepseekKey}
            customEndpoint={customEndpoint}
            customKey={customKey}
            customModel={customModel}
          />
        )}
        {mode === 'stories' && (
          <StoryDialogues themeColor={themeColor} voices={voices} onBack={() => switchMode('speak')} apiKey={apiKey} openaiKey={openaiKey} openrouterKey={openrouterKey} deepseekKey={deepseekKey} customEndpoint={customEndpoint} customKey={customKey} customModel={customModel} />
        )}
        {mode === 'voice' && (
          <VoiceLabView
            onBack={() => switchMode('speak')}
            themeColor={themeColor}
            voices={voices}
            voiceRecs={voiceRecs}
            onSaveVoiceRecs={onSaveVoiceRecs}
          />
        )}
        {mode === 'focus' && (
          <FocusTimerView onBack={() => switchMode('speak')} themeColor={themeColor} />
        )}
      </div>
    </div>
  );
}
