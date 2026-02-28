import { useState, useEffect } from "react";

const FLOWER_TYPES = [
  { emoji: "🌸", name: "Cherry Blossom" },
  { emoji: "🌻", name: "Sunflower" },
  { emoji: "🌺", name: "Hibiscus" },
  { emoji: "🌼", name: "Daisy" },
  { emoji: "🌷", name: "Tulip" },
  { emoji: "💐", name: "Bouquet" },
  { emoji: "🌹", name: "Rose" },
  { emoji: "🪷", name: "Lotus" },
];

const PLANT_STAGES = ["🌱", "🌿", "🪴"];

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getFlowerForEntry(index) {
  return FLOWER_TYPES[index % FLOWER_TYPES.length];
}

export default function GratitudeGarden() {
  const [entries, setEntries] = useState([]);
  const [streak, setStreak] = useState(0);
  const [todayText, setTodayText] = useState("");
  const [todayDone, setTodayDone] = useState(false);
  const [view, setView] = useState("journal"); // journal | garden
  const [planted, setPlanted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [celebrateIdx, setCelebrateIdx] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await window.storage.get("gratitude-data");
      if (res) {
        const data = JSON.parse(res.value);
        setEntries(data.entries || []);
        setStreak(data.streak || 0);
        if (data.lastDate === getTodayKey()) {
          setTodayDone(true);
        }
      }
    } catch (e) {
      // no data yet
    }
    setLoading(false);
  }

  async function saveData(newEntries, newStreak, lastDate) {
    await window.storage.set(
      "gratitude-data",
      JSON.stringify({ entries: newEntries, streak: newStreak, lastDate })
    );
  }

  function calcStreak(entries) {
    if (!entries.length) return 0;
    const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    let count = 0;
    let current = new Date(getTodayKey());
    for (let i = 0; i < sorted.length; i++) {
      const d = new Date(sorted[i].date);
      const diff = Math.round((current - d) / 86400000);
      if (diff === 0 || diff === 1) {
        count++;
        current = d;
      } else break;
    }
    return count;
  }

  async function handlePlant() {
    if (!todayText.trim()) return;
    const today = getTodayKey();
    const newEntry = { date: today, text: todayText.trim(), flowerIdx: entries.length };
    const newEntries = [...entries, newEntry];
    const newStreak = calcStreak(newEntries);
    setEntries(newEntries);
    setStreak(newStreak);
    setTodayDone(true);
    setPlanted(true);
    setCelebrateIdx(newEntries.length - 1);
    await saveData(newEntries, newStreak, today);
    setTimeout(() => {
      setPlanted(false);
      setView("garden");
      setTimeout(() => setCelebrateIdx(null), 2000);
    }, 1800);
  }

  const flower = getFlowerForEntry(entries.length);

  if (loading) {
    return (
      <div style={styles.phone}>
        <div style={styles.loadingScreen}>
          <div style={styles.loadingEmoji}>🌱</div>
          <p style={styles.loadingText}>Growing your garden…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.phone}>
      {/* Status bar */}
      <div style={styles.statusBar}>
        <span style={styles.statusTime}>9:41</span>
        <span style={styles.statusIcons}>📶🔋</span>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.appTitle}>Gratitude Garden</div>
          <div style={styles.streakBadge}>
            🔥 {streak} day streak
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.seedCount}>🌸 {entries.length}</div>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tab, ...(view === "journal" ? styles.tabActive : {}) }}
          onClick={() => setView("journal")}
        >
          📝 Journal
        </button>
        <button
          style={{ ...styles.tab, ...(view === "garden" ? styles.tabActive : {}) }}
          onClick={() => setView("garden")}
        >
          🌷 Garden
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {view === "journal" ? (
          <JournalView
            todayDone={todayDone}
            todayText={todayText}
            setTodayText={setTodayText}
            handlePlant={handlePlant}
            planted={planted}
            flower={flower}
            entries={entries}
          />
        ) : (
          <GardenView entries={entries} celebrateIdx={celebrateIdx} />
        )}
      </div>
    </div>
  );
}

function JournalView({ todayDone, todayText, setTodayText, handlePlant, planted, flower, entries }) {
  return (
    <div style={styles.journalView}>
      {/* Today card */}
      <div style={styles.todayCard}>
        <div style={styles.cardLabel}>🌤 Today's Gratitude</div>
        {todayDone ? (
          <div style={styles.doneBox}>
            <div style={styles.doneEmoji}>{flower.emoji}</div>
            <p style={styles.doneText}>You planted a seed today! ✨</p>
            <p style={styles.doneSubtext}>Come back tomorrow to keep your streak going 🌿</p>
          </div>
        ) : (
          <>
            <p style={styles.prompt}>What are you grateful for today?</p>
            <textarea
              style={styles.textarea}
              placeholder="I'm grateful for…"
              value={todayText}
              onChange={(e) => setTodayText(e.target.value)}
              maxLength={280}
            />
            <div style={styles.charCount}>{todayText.length}/280</div>
            <button
              style={{
                ...styles.plantBtn,
                ...(planted ? styles.plantBtnDone : {}),
                opacity: todayText.trim() ? 1 : 0.5,
              }}
              onClick={handlePlant}
              disabled={!todayText.trim() || planted}
            >
              {planted ? "🌱 Seed Planted!" : `Plant a ${flower.name} ${flower.emoji}`}
            </button>
          </>
        )}
      </div>

      {/* Past entries */}
      {entries.length > 0 && (
        <div>
          <div style={styles.sectionTitle}>Past Seeds 🌿</div>
          {[...entries].reverse().slice(0, 5).map((e, i) => (
            <div key={i} style={styles.pastEntry}>
              <div style={styles.pastFlower}>{getFlowerForEntry(e.flowerIdx).emoji}</div>
              <div style={styles.pastRight}>
                <div style={styles.pastDate}>{formatDate(e.date)}</div>
                <div style={styles.pastText}>{e.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !todayDone && (
        <div style={styles.emptyHint}>
          <div style={styles.emptyEmoji}>🌱</div>
          <p style={styles.emptyText}>Plant your first seed above to start your garden!</p>
        </div>
      )}
    </div>
  );
}

function GardenView({ entries, celebrateIdx }) {
  if (entries.length === 0) {
    return (
      <div style={styles.emptyGarden}>
        <div style={{ fontSize: 64 }}>🏡</div>
        <p style={styles.emptyGardenText}>Your garden is empty</p>
        <p style={styles.emptyGardenSub}>Write your first gratitude entry to plant a flower!</p>
      </div>
    );
  }

  // Build grid of flowers
  return (
    <div style={styles.gardenView}>
      <div style={styles.gardenSky}>
        <span style={styles.skyCloud}>☁️</span>
        <span style={{ ...styles.skyCloud, right: 40, top: 20 }}>⛅</span>
        <span style={styles.sunEmoji}>☀️</span>
      </div>
      <div style={styles.gardenGround}>
        <div style={styles.flowerGrid}>
          {entries.map((entry, i) => {
            const f = getFlowerForEntry(entry.flowerIdx);
            const isNew = i === celebrateIdx;
            return (
              <div key={i} style={{ ...styles.flowerCell, ...(isNew ? styles.flowerCellNew : {}) }}>
                <div style={styles.flowerEmoji}>{f.emoji}</div>
                <div style={styles.flowerStem}>|</div>
              </div>
            );
          })}
          {/* Growing seed for today if not done */}
        </div>
        <div style={styles.groundBar} />
      </div>
      <div style={styles.gardenStats}>
        <div style={styles.statBox}>
          <div style={styles.statNum}>{entries.length}</div>
          <div style={styles.statLabel}>flowers</div>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statBox}>
          <div style={styles.statNum}>🔥</div>
          <div style={styles.statLabel}>streak</div>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statBox}>
          <div style={styles.statNum}>{entries.length * 7}g</div>
          <div style={styles.statLabel}>joy grown</div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const styles = {
  phone: {
    width: 390,
    minHeight: 844,
    margin: "0 auto",
    background: "#FFF9F0",
    fontFamily: "'Georgia', serif",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
    borderRadius: 44,
    boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
  },
  loadingScreen: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingEmoji: { fontSize: 56, animation: "bounce 1s infinite" },
  loadingText: { color: "#7CB98A", fontSize: 16 },
  statusBar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 24px 0",
    fontSize: 12,
    color: "#888",
    fontFamily: "monospace",
  },
  statusTime: { fontWeight: "bold" },
  statusIcons: { letterSpacing: 2 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px 8px",
    background: "linear-gradient(135deg, #A8E6CF 0%, #7CB98A 100%)",
    borderRadius: "0 0 24px 24px",
    boxShadow: "0 4px 20px rgba(124,185,138,0.3)",
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: 4 },
  appTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textShadow: "0 1px 3px rgba(0,0,0,0.15)",
    letterSpacing: 0.5,
  },
  streakBadge: {
    background: "rgba(255,255,255,0.3)",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 12,
    color: "#fff",
    fontFamily: "sans-serif",
    fontWeight: "600",
  },
  headerRight: {},
  seedCount: {
    background: "#fff",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 14,
    color: "#7CB98A",
    fontWeight: "bold",
    fontFamily: "sans-serif",
  },
  tabBar: {
    display: "flex",
    padding: "12px 24px 0",
    gap: 8,
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    border: "2px solid #E8D5C0",
    borderRadius: 16,
    background: "transparent",
    color: "#B8A090",
    fontSize: 14,
    fontFamily: "sans-serif",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "#A8E6CF",
    borderColor: "#7CB98A",
    color: "#2D6E4E",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 0 24px",
  },
  journalView: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: "0 20px",
  },
  todayCard: {
    background: "#fff",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    border: "2px solid #F0E8D8",
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: "sans-serif",
    fontWeight: "700",
    color: "#B8A090",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  prompt: {
    fontSize: 17,
    color: "#5D4037",
    marginBottom: 14,
    lineHeight: 1.4,
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    border: "2px solid #E8D5C0",
    borderRadius: 16,
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "Georgia, serif",
    color: "#5D4037",
    background: "#FFFBF7",
    resize: "none",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: 1.6,
  },
  charCount: {
    textAlign: "right",
    fontSize: 11,
    color: "#C0A090",
    fontFamily: "sans-serif",
    marginTop: 4,
    marginBottom: 12,
  },
  plantBtn: {
    width: "100%",
    padding: "14px 0",
    background: "linear-gradient(135deg, #A8E6CF, #7CB98A)",
    border: "none",
    borderRadius: 18,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "sans-serif",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(124,185,138,0.4)",
    transition: "all 0.3s",
    letterSpacing: 0.3,
  },
  plantBtnDone: {
    background: "linear-gradient(135deg, #FFD700, #FFA500)",
    boxShadow: "0 4px 15px rgba(255,165,0,0.4)",
  },
  doneBox: {
    textAlign: "center",
    padding: "10px 0",
  },
  doneEmoji: { fontSize: 52, marginBottom: 10 },
  doneText: { fontSize: 16, color: "#5D4037", fontWeight: "bold", marginBottom: 6 },
  doneSubtext: { fontSize: 13, color: "#B8A090", fontFamily: "sans-serif", lineHeight: 1.5 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "sans-serif",
    fontWeight: "700",
    color: "#B8A090",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  pastEntry: {
    display: "flex",
    gap: 12,
    background: "#fff",
    borderRadius: 18,
    padding: "12px 16px",
    marginBottom: 8,
    border: "1.5px solid #F0E8D8",
    alignItems: "flex-start",
  },
  pastFlower: { fontSize: 28, lineHeight: 1 },
  pastRight: { flex: 1 },
  pastDate: { fontSize: 11, color: "#B8A090", fontFamily: "sans-serif", fontWeight: "600", marginBottom: 4 },
  pastText: { fontSize: 14, color: "#6D4C41", lineHeight: 1.5 },
  emptyHint: {
    textAlign: "center",
    padding: "30px 20px",
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#B8A090", fontSize: 14, fontFamily: "sans-serif", lineHeight: 1.6 },
  // Garden view
  gardenView: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 500,
  },
  gardenSky: {
    background: "linear-gradient(180deg, #B3E5FC 0%, #E1F5FE 100%)",
    height: 120,
    position: "relative",
    overflow: "hidden",
  },
  skyCloud: {
    position: "absolute",
    fontSize: 28,
    left: 24,
    top: 16,
  },
  sunEmoji: {
    position: "absolute",
    fontSize: 36,
    right: 24,
    top: 12,
  },
  gardenGround: {
    background: "linear-gradient(180deg, #C8E6C9 0%, #A5D6A7 30%, #81C784 100%)",
    flex: 1,
    padding: "16px 16px 0",
    position: "relative",
  },
  flowerGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 30,
  },
  flowerCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "growIn 0.5s ease-out",
  },
  flowerCellNew: {
    animation: "growIn 0.5s ease-out, celebrate 0.5s ease-in-out 0.5s 3",
  },
  flowerEmoji: { fontSize: 28, lineHeight: 1 },
  flowerStem: {
    color: "#4CAF50",
    fontSize: 16,
    lineHeight: 1,
    fontWeight: "bold",
  },
  groundBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    background: "#6D4C41",
    borderRadius: "8px 8px 0 0",
  },
  gardenStats: {
    display: "flex",
    background: "#fff",
    padding: "16px 24px",
    justifyContent: "space-around",
    alignItems: "center",
    borderTop: "2px solid #F0E8D8",
  },
  statBox: { textAlign: "center" },
  statNum: { fontSize: 22, fontWeight: "bold", color: "#5D4037" },
  statLabel: { fontSize: 11, color: "#B8A090", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: 1, height: 36, background: "#F0E8D8" },
  emptyGarden: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 40px",
    gap: 12,
    textAlign: "center",
  },
  emptyGardenText: { fontSize: 18, color: "#5D4037", fontWeight: "bold" },
  emptyGardenSub: { fontSize: 14, color: "#B8A090", fontFamily: "sans-serif", lineHeight: 1.6 },
};

// Inject keyframes
const styleEl = document.createElement("style");
styleEl.textContent = `
  @keyframes growIn {
    from { transform: scale(0) translateY(20px); opacity: 0; }
    to { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes celebrate {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3) rotate(10deg); }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`;
document.head.appendChild(styleEl);
