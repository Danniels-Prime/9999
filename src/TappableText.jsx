export default function TappableText({ text, onWordTap, accentColor, baseStyle }) {
  const tokens = text.split(/(\s+)/);

  return (
    <span>
      {tokens.map((token, i) => {
        if (!token) return null;
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;

        const word = token.replace(/^[^a-zA-Z'']+|[^a-zA-Z'']+$/g, '');
        if (!word) return <span key={i} style={baseStyle}>{token}</span>;

        return (
          <span
            key={i}
            onClick={(e) => { e.stopPropagation(); onWordTap(word, text, e); }}
            style={{
              ...baseStyle,
              cursor: 'pointer',
              borderBottom: `1.5px dotted ${accentColor}60`,
              borderRadius: '2px',
              WebkitTapHighlightColor: `${accentColor}20`,
            }}
          >
            {token}
          </span>
        );
      })}
    </span>
  );
}
