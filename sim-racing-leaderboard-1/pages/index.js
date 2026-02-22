import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode.react";

export default function Home() {
  // Branding
  const [eventName, setEventName] = useState("Sim Racing Trade Show Challenge");
  const [subtitle, setSubtitle] = useState("Top 5 Win Prizes • Best Lap of 5");
  const [presentationMode, setPresentationMode] = useState(false);
  const [winnerMode, setWinnerMode] = useState(false);

  // Sponsor rotation (URLs)
  const [sponsorUrlsText, setSponsorUrlsText] = useState(
    "https://placehold.co/600x200?text=Sponsor+1\nhttps://placehold.co/600x200?text=Sponsor+2"
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

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]); // {name, time}
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [newFastest, setNewFastest] = useState(false);

  const url =
    typeof window !== "undefined" ? window.location.href : "https://example.com";

  // ---- persistence ----
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tradeShowState_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        setEventName(parsed.eventName ?? "Sim Racing Trade Show Challenge");
        setSubtitle(parsed.subtitle ?? "Top 5 Win Prizes • Best Lap of 5");
        setSponsorUrlsText(parsed.sponsorUrlsText ?? sponsorUrlsText);
        setLeaderboard(parsed.leaderboard ?? []);
        setTotalDrivers(parsed.totalDrivers ?? 0);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "tradeShowState_v1",
        JSON.stringify({
          eventName,
          subtitle,
          sponsorUrlsText,
          leaderboard,
          totalDrivers,
        })
      );
    } catch {}
  }, [eventName, subtitle, sponsorUrlsText, leaderboard, totalDrivers]);

  // Sponsor rotate
  useEffect(() => {
    if (sponsorUrls.length <= 1) return;
    const t = setInterval(() => {
      setActiveSponsor((p) => (p + 1) % sponsorUrls.length);
    }, 3000);
    return () => clearInterval(t);
  }, [sponsorUrls.length]);

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

    const entry = { name: driverName.trim(), time: best };

    // Compute new top 5
    const updated = [...leaderboard, entry]
      .sort((a, b) => a.time - b.time)
      .slice(0, 5);

    // New fastest highlight if this entry is now P1
    if (updated[0] && updated[0].name === entry.name && updated[0].time === entry.time) {
      setNewFastest(true);
      setTimeout(() => setNewFastest(false), 3500);
    }

    setLeaderboard(updated);
    setTotalDrivers((n) => n + 1);
    setDriverName("");
    setLaps(["", "", "", "", ""]);
  };

  const resetEvent = () => {
    if (!confirm("Reset leaderboard and counters?")) return;
    setLeaderboard([]);
    setTotalDrivers(0);
    setNewFastest(false);
  };

  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "");

  const fastest = leaderboard[0]?.time;
  const avgTop5 =
    leaderboard.length > 0
      ? leaderboard.reduce((s, e) => s + e.time, 0) / leaderboard.length
      : null;

  // Winner screen
  if (winnerMode && leaderboard.length > 0) {
    return (
      <div style={styles.winnerWrap}>
        <div style={styles.winnerTitle}>🏆 WINNER 🏆</div>
        <div style={styles.winnerName}>{leaderboard[0].name}</div>
        <div style={styles.winnerTime}>{leaderboard[0].time.toFixed(3)} sec</div>
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
        background: presentationMode ? "#000" : "#f3f4f6",
        color: presentationMode ? "#fff" : "#111",
      }}
    >
      <div style={styles.card}>
        <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <div style={{ ...styles.h1, color: presentationMode ? "#fff" : "#111" }}>{eventName}</div>
            <div style={{ ...styles.sub, color: presentationMode ? "#cfcfcf" : "#444" }}>{subtitle}</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={styles.btn} onClick={() => setPresentationMode((v) => !v)}>
              {presentationMode ? "Exit Presentation" : "Presentation Mode"}
            </button>
            <button style={styles.btn} onClick={() => setWinnerMode(true)} disabled={!leaderboard.length}>
              Winner Reveal
            </button>
            <button style={styles.btnDanger} onClick={resetEvent}>
              Reset Event
            </button>
          </div>
        </div>

        {/* Sponsor rotation */}
        {sponsorUrls.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            <img
              src={sponsorUrls[activeSponsor]}
              alt="Sponsor"
              style={{
                height: 80,
                maxWidth: "100%",
                objectFit: "contain",
                background: "#fff",
                borderRadius: 12,
                padding: 8,
              }}
              onError={(e) => {
                // Hide broken images
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        {!presentationMode && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #e5e7eb" }}>
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
                <div style={{ fontWeight: 700 }}>Sponsor logo URLs (one per line):</div>
                <textarea
                  style={styles.textarea}
                  value={sponsorUrlsText}
                  onChange={(e) => setSponsorUrlsText(e.target.value)}
                  rows={3}
                />
                <div style={{ fontSize: 12, color: "#666" }}>
                  Tip: Put your sponsor logo images somewhere online (or your own site) and paste the image URLs here.
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 700 }}>Edit text:</div>
                <input style={styles.input} value={eventName} onChange={(e) => setEventName(e.target.value)} />
                <input style={styles.input} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          {newFastest && <div style={styles.flash}>🚨 NEW FASTEST LAP! 🚨</div>}
          <div style={styles.stats}>
            <span><b>Total Drivers:</b> {totalDrivers}</span>
            <span><b>Fastest:</b> {fastest ? `${fastest.toFixed(3)}s` : "--"}</span>
            <span><b>Avg Top 5:</b> {avgTop5 ? `${avgTop5.toFixed(3)}s` : "--"}</span>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ marginTop: 18 }}>
          <div style={styles.sectionTitle}>Top 5 Leaderboard</div>
          <ol style={{ paddingLeft: 0, listStyle: "none", marginTop: 10, display: "grid", gap: 10 }}>
            {leaderboard.map((e, i) => (
              <li
                key={`${e.name}-${i}`}
                style={{
                  ...styles.row,
                  background: presentationMode ? "#111827" : "#fff",
                  color: presentationMode ? "#fff" : "#111",
                }}
              >
                <div style={{ fontSize: presentationMode ? 34 : 22, fontWeight: 800 }}>
                  {medal(i)} {i + 1}. {e.name}
                </div>
                <div style={{ fontSize: presentationMode ? 34 : 22, fontWeight: 800 }}>
                  {e.time.toFixed(3)} sec
                </div>
              </li>
            ))}
            {leaderboard.length === 0 && (
              <li style={{ color: presentationMode ? "#cfcfcf" : "#555", padding: 10 }}>
                No runs yet — start adding drivers.
              </li>
            )}
          </ol>
        </div>

        {/* QR Code */}
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Scan for Live Leaderboard</div>
            <div style={{ background: "#fff", padding: 10, borderRadius: 12, display: "inline-block" }}>
              <QRCode value={url} size={160} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, textAlign: "center", opacity: 0.8 }}>
          Tip: Put the TV in Presentation Mode. Use the Operator Panel on the tablet.
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 18,
    fontFamily: "Arial, sans-serif",
  },
  card: {
    maxWidth: 1200,
    margin: "0 auto",
    background: "rgba(255,255,255,0.0)",
  },
  h1: { fontSize: 34, fontWeight: 900, letterSpacing: 0.2 },
  sub: { marginTop: 4, fontSize: 16, fontWeight: 600 },
  sectionTitle: { fontSize: 18, fontWeight: 900, marginTop: 6 },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 16,
  },
  textarea: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
    fontFamily: "Arial, sans-serif",
  },
  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
  btnPrimary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 16,
  },
  btnDanger: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #ef4444",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
  },
  stats: {
    display: "flex",
    justifyContent: "center",
    gap: 18,
    flexWrap: "wrap",
    fontSize: 16,
    marginTop: 8,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "16px 16px",
    borderRadius: 16,
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  },
  flash: {
    display: "inline-block",
    fontWeight: 900,
    fontSize: 22,
    padding: "10px 16px",
    borderRadius: 14,
    background: "#fde68a",
    color: "#111",
    marginBottom: 10,
    animation: "pulse 1s infinite",
  },
  winnerWrap: {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: 16,
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  winnerTitle: { fontSize: 60, fontWeight: 900 },
  winnerName: { fontSize: 54, fontWeight: 900 },
  winnerTime: { fontSize: 44, fontWeight: 900 },
};
