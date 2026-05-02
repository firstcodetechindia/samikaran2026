export function CinzelAlphabet() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #fef9e7 0%, #fdeaa0 60%, #f5c842 100%)",
        padding: "36px 40px",
        boxSizing: "border-box",
      }}
    >
      <p style={{
        fontFamily: "'Cinzel Decorative', serif",
        fontSize: 11,
        letterSpacing: "0.3em",
        color: "#92610a",
        marginBottom: 28,
        fontWeight: 700,
        textTransform: "uppercase",
        textAlign: "center",
      }}>
        Cinzel Decorative — All 26 Letters
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(13, 1fr)",
        gap: "10px 8px",
        width: "100%",
        maxWidth: 960,
      }}>
        {letters.map((letter) => (
          <div
            key={letter}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(201,151,10,0.3)",
              borderRadius: 6,
              padding: "10px 4px 8px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <span style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 32,
              color: "#3b1a01",
              lineHeight: 1,
              display: "block",
            }}>
              {letter}
            </span>
            <span style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 13,
              color: "#7a5208",
              lineHeight: 1,
              marginTop: 6,
              display: "block",
            }}>
              {letter.toLowerCase()}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 28,
        padding: "10px 28px",
        background: "rgba(201,151,10,0.12)",
        border: "1px solid rgba(201,151,10,0.35)",
        borderRadius: 6,
        textAlign: "center",
      }}>
        <span style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 20,
          color: "#3b1a01",
          letterSpacing: "0.08em",
        }}>
          Arjun Sharma
        </span>
      </div>
    </div>
  );
}
