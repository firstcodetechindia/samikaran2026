export function Fraunces() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #fef9e7 0%, #fdeaa0 60%, #f5c842 100%)",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ textAlign: "center", padding: "40px 48px", maxWidth: 480 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.25em", color: "#92610a", marginBottom: 28, fontWeight: 600, textTransform: "uppercase" }}>
          This is to certify with honour that
        </p>
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 52,
            fontWeight: 700,
            color: "#3b1a01",
            lineHeight: 1.1,
            margin: "0 0 20px",
            letterSpacing: "0.01em",
            fontVariationSettings: "'opsz' 72",
          }}
        >
          Arjun Sharma
        </h1>
        <div style={{ width: 80, height: 2, background: "#c9970a", margin: "0 auto 20px" }} />
        <p style={{ fontSize: 12, color: "#7a5208", letterSpacing: "0.05em", margin: 0, lineHeight: 1.6 }}>
          Delhi Public School, New Delhi
        </p>
        <p style={{ fontSize: 11, color: "#a07520", marginTop: 8, letterSpacing: "0.04em" }}>
          GOLD · Rank 1 · 96%
        </p>
        <div style={{
          marginTop: 28,
          padding: "8px 20px",
          background: "rgba(201,151,10,0.12)",
          borderRadius: 4,
          border: "1px solid rgba(201,151,10,0.3)",
          display: "inline-block"
        }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 13, color: "#7a5208", letterSpacing: "0.08em" }}>
            Fraunces
          </span>
        </div>
      </div>
    </div>
  );
}
