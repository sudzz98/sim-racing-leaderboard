import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode.react";

const THEME = {
  bg: "#000000",
  panel: "#0b0f14",
  panel2: "#0f172a",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.75)",
  border: "rgba(255,255,255,0.14)",
  red: "#ff1e1e",
  green: "#00d13a",
  blue: "#1f7bff",
};

export default function Home() {
  // Branding
  const [eventName, setEventName] = useState("Victory SIM Trade Show Challenge");
  const [subtitle, setSubtitle] = useState("Top 10 Win Prizes • Best Lap of 5");
  const [presentationMode, setPresentationMode] = useState(false);
  const [winnerMode, setWinnerMode] = useState(false);

  // Show logo toggle (logo file should be in /public)
  const [showLogo, setShowLogo] = useState(true);
  const logoSrc = "/victory-sim.png"; // <-- upload your logo to /public/victory-sim.png

  // Sponsor rotation (direct image URLs only)
  const [sponsorUrlsText, setSponsorUrlsText] = useState(
    "https://placehold.co/900x200/png?text=Sponsor+1\nhttps://placehold.co/900x200/png?text=Sponsor+2\nhttps://placehold.co/900x200/png?text=Sponsor+3"
  );

  const sponsorUrls = useMemo(() => {
    return sponsorUrlsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [sponsorUrlsText]);

  const [activeSponsor, setActiveSponsor] = useState(0);

  // Entry input (best of 5 laps)
  const [driverName, setDriverName] = useState("");
  const [laps, setLaps] = useState(["", "", "", "", ""]);

  // Store ALL runs (unlimited)
  const [allRuns, setAllRuns] = useState([]); // {name, time, ts}
  const [newFastest, setNewFastest] = useState(false);

  const url =
    typeof window !== "undefined" ? window.location.href : "https://example.com";

  // ---- persistence ----
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tradeShowState_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        setEventName(parsed.eventName ?? "Victory SIM Trade Show Challenge");
        setSubtitle(parsed.subtitle ?? "Top 10 Win Prizes • Best Lap of 5");
        setSponsorUrlsText(parsed.sponsorUrlsText ?? sponsorUrlsText);
        setAllRuns(parsed.allRuns ?? []);
        setShowLogo(parsed.showLogo ?? true);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "tradeShowState_v2",
        JSON.stringify({
          eventName,
          subtitle,
          sponsorUrlsText,
          allRuns,
          showLogo,
        })
      );
    } catch {}
  }, [eventName, subtitle, sponsorUrlsText, allRuns, showLogo]);

  // Sponsor rotate
  useEffect(() => {
    if (sponsorUrls.length <= 1) return;
    const t = setInterval(() => {
      setActiveSponsor((p) => (p + 1) % sponsorUrls.length);
    }, 3000);
    return () => clearInterval(t);
  }, [sponsorUrls.length]);

  const top10 = useMemo(() => {
    return [...allRuns].sort((a, b) => a.time - b.time).slice(0, 10);
  }, [allRuns]);

  const bestLapFromInputs = () => {
    const times = laps
      .map((x) => parseFloat(x))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (!times.length) return null;
    return Math.min(...times);
  };

  const addDriver = () => {
    const best = bestLapFromInputs();
    if (!driverName.trim() || best === null) return;

    const entry = { name: driverName.trim(), time: best, ts: Date.now() };

    const nextRuns = [...allRuns, entry];

    // New fastest highlight if this entry becomes overall best
    const nextBest = [...nextRuns].sort((a, b) => a.time - b.time)[0];
    if (nextBest && nextBest.ts === entry.ts) {
      setNewFastest(true);
      setTimeout(() => setNewFastest(false), 3500);
    }

    setAllRuns(nextRuns);
    setDriverName("");
    setLaps(["", "", "", "", ""]);
  };

  const resetEvent = () => {
    if (!confirm("Reset leaderboard and all drivers?")) return;
    setAllRuns([]);
    setNewFastest(false);
  };

  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "");

  const fastest = top10[0]?.time;
  const avgTop10 =
    top10.length > 0 ? top10.reduce((s, e) => s + e.time, 0) / top10.length : null;

  // Winner screen
  if (winnerMode && top10.length > 0) {
    return (
      <div style={styles.winnerWrap}>
        <div style={styles.winnerTitle}>🏆 WINNER 🏆</div>
        <div style={styles.winnerName}>{top10[0].name}</div>
        <div style={styles.winnerTime}>{top10[0].time.toFixed(3)} sec</div>
        <button style={styles.btnPrimary} onClick={() => setWinnerMode(false)}>
          Exit Winner Mode
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.page,
        background: presentationMode
          ? THEME.bg
          : `radial-gradient(1200px 600px at 20% 0%, rgba(31,123,255,0.18), transparent 60%),
             radial-gradient(1200px 600px at 80% 0%, rgba(0,209,58,0.18), transparent 60%),
             radial-gradient(900px 500px at 50% 110%, rgba(255,30,30,0.16), transparent 55%),
             ${THEME.bg}`,
        color: THEME.text,
      }}
    >
      <div style={styles.card}>
        <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            {showLogo && (
              <div style={{ marginBottom: 10 }}>
                <img
                  src={logoSrc}
                  alt="Logo"
                  style={{ height: 60, maxWidth: "100%", objectFit: "contain" }}
                  onError={(e) => {
                    // if logo missing, just hide it
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
            <div style={styles.h1}>{eventName}</div>
            <div style={styles.sub}>{subtitle}</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={styles.btn} onClick={() => setPresentationMode((v) => !v)}>
              {presentationMode ? "Exit Presentation" : "Presentation Mode"}
            </button>
            <button style={styles.btnBlue} onClick={() => setWinnerMode(true)} disabled={!top10.length}>
              Winner Reveal
            </button>
            <button style={styles.btnRed} onClick={resetEvent}>
              Reset Event
            </button>
          </div>
        </div>

        {/* Sponsor rotation */}
        {sponsorUrls.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            <div style={styles.sponsorStrip}>
              <img
                src={sponsorUrls[activeSponsor]}
                alt="Sponsor"
                style={{ height: 70, width: "100%", objectFit: "contain" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
        )}

        {!presentationMode && (
          <div style={styles.operatorPanel}>
            <div style={styles.sectionTitle}>Operator Panel</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 10 }}>
              <input
                style={styles.input}
                placeholder="Driver name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
              />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
                {laps.map((v, i) => (
                  <input
                    key={i}
                    style={styles.input}
                    placeholder={`Lap ${i + 1}`}
                    value={v}
                    onChange={(e) => {
                      const next = [...laps];
                      next[i] = e.target.value;
                      setLaps(next);
                    }}
                    type="number"
                    step="0.001"
                    inputMode="decimal"
                  />
                ))}
              </div>

              <button style={styles.btnPrimary} onClick={addDriver}>
                Add Driver (Best of 5)
              </button>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 800, color: THEME.muted }}>Sponsor logo URLs (one per line):</div>
                <textarea
                  style={styles.textarea}
                  value={sponsorUrlsText}
                  onChange={(e) => setSponsorUrlsText(e.target.value)}
                  rows={3}
                />
                <div style={{ fontSize: 12, color: THEME.muted }}>
                  Tip: Use DIRECT image links ending with .png/.jpg/.webp
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 800, color: THEME.muted }}>Edit text:</div>
                <input style={styles.input} value={eventName} onChange={(e) => setEventName(e.target.value)} />
                <input style={styles.input} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                <label style={{ display: "flex", gap: 10, alignItems: "center", color: THEME.muted }}>
                  <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} />
                  Show logo at top
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          {newFastest && <div style={styles.flash}>🚨 NEW FASTEST LAP! 🚨</div>}
          <div style={styles.stats}>
            <span><b>Total Drivers:</b> {allRuns.length}</span>
            <span><b>Fastest:</b> {fastest ? `${fastest.toFixed(3)}s` : "--"}</span>
            <span><b>Avg Top 10:</b> {avgTop10 ? `${avgTop10.toFixed(3)}s` : "--"}</span>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ marginTop: 18 }}>
          <div style={styles.sectionTitle}>
            Top 10 Leaderboard{" "}
            <span style={{ fontSize: 14, fontWeight: 700, color: THEME.muted }}>
              (showing {Math.min(10, top10.length)} of {allRuns.length})
            </span>
          </div>

          <ol style={{ paddingLeft: 0, listStyle: "none", marginTop: 10, display: "grid", gap: 10 }}>
            {top10.map((e, i) => (
              <li key={`${e.ts}`} style={styles.row}>
                <div style={{ fontSize: presentationMode ? 34 : 20, fontWeight: 900 }}>
                  {medal(i)} {i + 1}. {e.name}
                </div>
                <div style={{ fontSize: presentationMode ? 34 : 20, fontWeight: 900 }}>
                  {e.time.toFixed(3)} sec
                </div>
              </li>
            ))}
            {top10.length === 0 && (
              <li style={{ color: THEME.muted, padding: 10 }}>
                No runs yet — start adding drivers.
              </li>
            )}
          </ol>
        </div>

        {/* QR Code */}
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Scan for Live Leaderboard</div>
            <div style={{ background: "#fff", padding: 10, borderRadius: 14, display: "inline-block" }}>
              <QRCode value={url} size={160} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, textAlign: "center", color: THEME.muted }}>
          Tip: Put the TV in Presentation Mode. Use the Operator Panel on the phone/tablet.
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", padding: 18, fontFamily: "Arial, sans-serif" },
  card: { maxWidth: 1200, margin: "0 auto" },

  h1: { fontSize: 34, fontWeight: 950, letterSpacing: 0.2 },
  sub: { marginTop: 4, fontSize: 16, fontWeight: 700, color: THEME.muted },

  operatorPanel: {
    marginTop: 16,
    paddingTop: 14,
    borderTop: `1px solid ${THEME.border}`,
  },

  sectionTitle: { fontSize: 18, fontWeight: 950, marginTop: 6 },

  sponsorStrip: {
    width: "100%",
    maxWidth: 1000,
    borderRadius: 16,
    padding: 10,
    border: `1px solid ${THEME.border}`,
    background: THEME.panel,
  },

  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    background: THEME.panel,
    color: THEME.text,
    fontSize: 16,
    outline: "none",
  },

  textarea: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    background: THEME.panel,
    color: THEME.text,
    fontSize: 14,
    fontFamily: "Arial, sans-serif",
    outline: "none",
  },

  btn: {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${THEME.border}`,
    background: THEME.panel,
    color: THEME.text,
    cursor: "pointer",
    fontWeight: 900,
  },

  btnPrimary: {
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${THEME.green}`,
    background: THEME.green,
    color: "#000",
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 16,
  },

  btnRed: {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${THEME.red}`,
    background: THEME.red,
    color: "#000",
    cursor: "pointer",
    fontWeight: 950,
  },

  btnBlue: {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${THEME.blue}`,
    background: THEME.blue,
    color: "#000",
    cursor: "pointer",
    fontWeight: 950,
  },

  stats: {
    display: "flex",
    justifyContent: "center",
    gap: 18,
    flexWrap: "wrap",
    fontSize: 16,
    marginTop: 8,
    color: THEME.muted,
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "16px 16px",
    borderRadius: 18,
    border: `1px solid ${THEME.border}`,
    background: THEME.panel2,
    boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
  },

  flash: {
    display: "inline-block",
    fontWeight: 950,
    fontSize: 22,
    padding: "10px 16px",
    borderRadius: 14,
    background: "#fff",
    color: "#000",
    marginBottom: 10,
    border: `4px solid ${THEME.red}`,
  },

  winnerWrap: {
    minHeight: "100vh",
    background: THEME.bg,
    color: THEME.text,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: 16,
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  winnerTitle: { fontSize: 60, fontWeight: 950 },
  winnerName: { fontSize: 54, fontWeight: 950 },
  winnerTime: { fontSize: 44, fontWeight: 950 },
};
