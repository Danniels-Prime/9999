const PAIRS = [
  {
    id: 'es_en',
    flag1: '🇪🇸', flag2: '🇺🇸',
    name: 'Spanish',
    native: 'Español',
    subtitle: 'Spanish → English',
    desc: 'Phrases, slang, idioms & vocab with spaced repetition',
    color: '#FF9500',
    glow: 'rgba(255,149,0,0.35)',
    available: true,
  },
  {
    id: 'ja_en',
    flag1: '🇯🇵', flag2: '🇺🇸',
    name: 'Japanese',
    native: '日本語',
    subtitle: 'Japanese → English',
    desc: 'Hiragana, katakana, kanji & conversational phrases',
    color: '#FF3CAC',
    glow: 'rgba(255,60,172,0.35)',
    available: false,
  },
  {
    id: 'fr_en',
    flag1: '🇫🇷', flag2: '🇺🇸',
    name: 'French',
    native: 'Français',
    subtitle: 'French → English',
    desc: 'Everyday French with culture, slang & pronunciation',
    color: '#4D79FF',
    glow: 'rgba(77,121,255,0.35)',
    available: false,
  },
  {
    id: 'pt_en',
    flag1: '🇧🇷', flag2: '🇺🇸',
    name: 'Portuguese',
    native: 'Português',
    subtitle: 'Portuguese → English',
    desc: 'Brazilian Portuguese — street slang to formal speech',
    color: '#00CC44',
    glow: 'rgba(0,204,68,0.35)',
    available: false,
  },
];

export default function LangSelector({ currentPair, onSelect, onBack }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'linear-gradient(180deg,#03010a 0%,#080614 100%)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '44px 24px 0', textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🌍</div>
        <h1 style={{
          fontSize: 'clamp(22px,6vw,36px)', fontWeight: 900, letterSpacing: '-1px',
          background: 'linear-gradient(120deg,#c77dff 0%,#00e5ff 50%,#c77dff 100%)',
          backgroundSize: '200% 100%', WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          animation: 'aurora 4s linear infinite',
        }}>
          Choose Your Language
        </h1>
        <p style={{ color: '#5e5c88', fontSize: 13, fontWeight: 700, marginTop: 6 }}>
          Pick a language pair to start learning
        </p>
      </div>

      {/* Language cards */}
      <div style={{ flex: 1, padding: '24px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {PAIRS.map(pair => {
          const isActive = currentPair === pair.id;
          return (
            <button
              key={pair.id}
              disabled={!pair.available}
              onClick={() => pair.available && onSelect(pair.id)}
              style={{
                width: '100%', textAlign: 'left', cursor: pair.available ? 'pointer' : 'default',
                background: isActive
                  ? `linear-gradient(135deg, ${pair.glow.replace('0.35', '0.18')}, rgba(0,0,0,0.4))`
                  : pair.available
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.02)',
                border: `2px solid ${isActive ? pair.color : pair.available ? pair.color + '50' : '#1e1c3a'}`,
                borderRadius: 20,
                padding: '18px 20px',
                boxShadow: isActive ? `0 0 28px ${pair.glow}` : 'none',
                transition: 'all 0.2s',
                opacity: pair.available ? 1 : 0.55,
                fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Flags */}
                <div style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>
                  {pair.flag1}<span style={{ fontSize: 16, opacity: 0.6 }}>→</span>{pair.flag2}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 16, fontWeight: 900,
                      color: isActive ? pair.color : pair.available ? '#c8c6e8' : '#5e5c88',
                    }}>
                      {pair.name}
                    </span>
                    <span style={{ fontSize: 12, color: '#5e5c88', fontWeight: 700 }}>{pair.native}</span>
                    {!pair.available && (
                      <span style={{
                        fontSize: 10, fontWeight: 900, letterSpacing: '0.5px',
                        padding: '2px 8px', borderRadius: 20,
                        background: 'rgba(255,255,255,0.06)',
                        color: '#5e5c88', border: '1px solid #27254a',
                        marginLeft: 'auto', flexShrink: 0,
                      }}>
                        COMING SOON
                      </span>
                    )}
                    {isActive && (
                      <span style={{
                        fontSize: 10, fontWeight: 900, letterSpacing: '0.5px',
                        padding: '2px 8px', borderRadius: 20,
                        background: pair.color + '22',
                        color: pair.color, border: `1px solid ${pair.color}50`,
                        marginLeft: 'auto', flexShrink: 0,
                      }}>
                        ✓ ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#5e5c88', fontWeight: 600, marginBottom: 3 }}>
                    {pair.subtitle}
                  </div>
                  <div style={{ fontSize: 11, color: '#44406a', lineHeight: 1.4 }}>
                    {pair.desc}
                  </div>
                </div>

                {/* Chevron */}
                {pair.available && (
                  <div style={{ fontSize: 18, color: isActive ? pair.color : '#27254a', flexShrink: 0 }}>›</div>
                )}
              </div>
            </button>
          );
        })}

        {/* More languages teaser */}
        <div style={{
          textAlign: 'center', padding: '10px 0 4px',
          color: '#3d3b60', fontSize: 11, fontWeight: 700,
        }}>
          🌐 More languages unlocking soon — Korean, Mandarin, Italian, German...
        </div>
      </div>

      {/* Back button — only if already selected a language */}
      {currentPair && onBack && (
        <div style={{ padding: '0 16px 32px', flexShrink: 0 }}>
          <button onClick={onBack} style={{
            width: '100%', padding: '14px 0', borderRadius: 16,
            border: '1px solid #27254a', background: 'rgba(255,255,255,0.03)',
            color: '#5e5c88', fontSize: 14, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
