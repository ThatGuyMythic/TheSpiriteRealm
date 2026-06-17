import React, { useState, useEffect } from "react";
import { GameProvider, useGame } from "@/game/state";
import BoardScreen     from "@/pages/BoardScreen";
import CardsScreen     from "@/pages/CardsScreen";
import BunkerScreen    from "@/pages/BunkerScreen";
import InventoryScreen from "@/pages/InventoryScreen";
import SettingsScreen  from "@/pages/SettingsScreen";
import { C } from "@/components/PixelUI";

const SAVE_KEY = "nolife.game.v5";
const TAB_KEY  = "nolife.tab.v1";

type Tab = "board" | "dcc" | "inv" | "bunker" | "settings";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "bunker",   label: "BUNKER",    icon: "⌂" },
  { id: "inv",      label: "GEAR",      icon: "†" },
  { id: "board",    label: "BOARD",     icon: "◈" },
  { id: "dcc",      label: "BLACK ROSE",icon: "♠" },
  { id: "settings", label: "SETTINGS",  icon: "≡" },
];

type Screen = "title" | "game";

function TitleScreen({ onContinue, hasSave, onNewGame, onTutorial }: {
  onContinue: () => void;
  hasSave: boolean;
  onNewGame: (hardcore: boolean) => void;
  onTutorial: () => void;
}) {
  const [confirmNew, setConfirmNew] = useState(false);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100dvh", width: "100%",
      maxWidth: 480, margin: "0 auto",
      backgroundColor: "#020608",
      alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
        zIndex: 1,
      }} />

      {/* Medieval fantasy background */}
      <img
        src={`${import.meta.env.BASE_URL}art/title-bg.png`}
        alt=""
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          zIndex: 0,
          imageRendering: "pixelated",
        }}
      />
      {/* Dark overlay for readability */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 100%)",
      }} />

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 32, padding: "0 24px", width: "100%" }}>
        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div className="pixel-text" style={{ color: "#4DBBCC", fontSize: 11, letterSpacing: 4, marginBottom: 8 }}>
            ✦ ✦ ✦
          </div>
          <div className="pixel-text" style={{ color: "#C080FF", fontSize: 28, lineHeight: 1.1, letterSpacing: 2, textShadow: "0 0 20px #8040CC" }}>
            THE SPIRIT
          </div>
          <div className="pixel-text" style={{ color: "#4DBBCC", fontSize: 28, lineHeight: 1.1, letterSpacing: 2, textShadow: "0 0 20px #204488" }}>
            REALM
          </div>
          <div className="pixel-text" style={{ color: "#555", fontSize: 10, marginTop: 10 }}>
            v0.9.2
          </div>
        </div>

        {/* Player pixel sprite */}
        <svg width="40" height="48" viewBox="0 0 10 12" style={{ imageRendering: "pixelated" }}>
          <rect x="3" y="0" width="4" height="4" fill="#4DBBCC" />
          <rect x="2" y="1" width="6" height="3" fill="#4DBBCC" />
          <rect x="3" y="4" width="4" height="5" fill="#3A8899" />
          <rect x="2" y="4" width="2" height="4" fill="#4DBBCC" />
          <rect x="6" y="4" width="2" height="4" fill="#4DBBCC" />
          <rect x="3" y="9" width="2" height="3" fill="#2A6677" />
          <rect x="5" y="9" width="2" height="3" fill="#2A6677" />
          <rect x="4" y="1" width="1" height="1" fill="#1A3344" />
          <rect x="5" y="1" width="1" height="1" fill="#1A3344" />
        </svg>

        {/* Menu buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
          {hasSave && (
            <button onClick={onContinue} style={{
              width: "100%", padding: "14px 0",
              backgroundColor: "#0A1A0A", border: `2px solid ${C.green}`,
              color: C.green, fontFamily: "'VT323', monospace", fontSize: 22,
              cursor: "pointer", letterSpacing: 2,
              textShadow: `0 0 8px ${C.green}66`,
            }}>
              ▶ CONTINUE
            </button>
          )}

          {!confirmNew ? (
            <button onClick={() => setConfirmNew(true)} style={{
              width: "100%", padding: "14px 0",
              backgroundColor: "#000A18", border: "2px solid #4DBBCC",
              color: "#4DBBCC", fontFamily: "'VT323', monospace", fontSize: 22,
              cursor: "pointer", letterSpacing: 2,
            }}>
              {hasSave ? "NEW GAME" : "▶ NEW GAME"}
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="pixel-text" style={{ color: C.redBright, fontSize: 12, textAlign: "center" }}>
                {hasSave ? "Overwrite save?" : "Choose mode:"}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onNewGame(false)} style={{
                  flex: 1, padding: "12px 0",
                  backgroundColor: "#001020", border: "2px solid #4DBBCC",
                  color: "#4DBBCC", fontFamily: "'VT323', monospace", fontSize: 18,
                  cursor: "pointer",
                }}>NORMAL</button>
                <button onClick={() => onNewGame(true)} style={{
                  flex: 1, padding: "12px 0",
                  backgroundColor: "#200000", border: `2px solid ${C.redBright}`,
                  color: C.redBright, fontFamily: "'VT323', monospace", fontSize: 18,
                  cursor: "pointer",
                }}>HARDCORE</button>
              </div>
              <button onClick={() => setConfirmNew(false)} style={{
                width: "100%", padding: "6px 0",
                backgroundColor: "transparent", border: "1px solid #333",
                color: "#555", fontFamily: "'VT323', monospace", fontSize: 14,
                cursor: "pointer",
              }}>CANCEL</button>
            </div>
          )}

          <button onClick={onTutorial} style={{
            width: "100%", padding: "12px 0",
            backgroundColor: "transparent", border: "1px solid #555",
            color: "#888", fontFamily: "'VT323', monospace", fontSize: 18,
            cursor: "pointer", letterSpacing: 2,
          }}>
            ★ HOW TO PLAY
          </button>
        </div>

        <div className="pixel-text" style={{ color: "#333", fontSize: 10 }}>
          Auto-saves to browser
        </div>
      </div>
    </div>
  );
}

function Inner({ startTab, onGameOver }: { startTab: Tab; onGameOver: () => void }) {
  const [tab, setTab] = useState<Tab>(startTab);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 700);
  const { gameOverSignal } = useGame();

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (gameOverSignal > 0) onGameOver();
  }, [gameOverSignal]); // eslint-disable-line

  function handleTabChange(t: Tab) {
    setTab(t);
    try { localStorage.setItem(TAB_KEY, t); } catch { /* ignore */ }
  }

  const tabBar = (
    <div style={{
      display: "flex",
      borderTop: isDesktop ? "none" : "3px solid #000",
      borderBottom: isDesktop ? "3px solid #000" : "none",
      backgroundColor: "#060E1A",
      flexShrink: 0,
      overflowX: "auto",
    }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => handleTabChange(t.id)}
          style={{
            flex: 1,
            padding: "5px 1px",
            backgroundColor: tab === t.id ? C.bg : "transparent",
            color: tab === t.id ? (t.id === "dcc" ? "#C060A0" : C.accent) : C.textDim,
            border: "none",
            borderBottom: isDesktop && tab === t.id
              ? `3px solid ${t.id === "dcc" ? "#C060A0" : C.accent}`
              : "3px solid transparent",
            borderTop: !isDesktop && tab === t.id
              ? `3px solid ${t.id === "dcc" ? "#C060A0" : C.accent}`
              : "3px solid transparent",
            fontFamily: "'VT323', monospace",
            fontSize: 10,
            letterSpacing: 0.3,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            minWidth: 46,
          }}
        >
          <span style={{ fontSize: 14 }}>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      width: "100%",
      maxWidth: isDesktop ? "100%" : 480,
      margin: "0 auto",
      backgroundColor: C.bg,
      position: "relative",
      overflow: "hidden",
    }}>
      {isDesktop && tabBar}

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: tab === "board"    ? "flex" : "none", flex: 1, flexDirection: "column", overflow: "hidden" }}><BoardScreen /></div>
        <div style={{ display: tab === "dcc"      ? "flex" : "none", flex: 1, flexDirection: "column", overflow: "hidden" }}><CardsScreen /></div>
        <div style={{ display: tab === "inv"      ? "flex" : "none", flex: 1, flexDirection: "column", overflow: "hidden" }}><InventoryScreen /></div>
        <div style={{ display: tab === "bunker"   ? "flex" : "none", flex: 1, flexDirection: "column", overflow: "hidden" }}><BunkerScreen /></div>
        <div style={{ display: tab === "settings" ? "flex" : "none", flex: 1, flexDirection: "column", overflow: "hidden" }}><SettingsScreen /></div>
      </div>

      {!isDesktop && tabBar}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw && JSON.parse(raw)) return "title";
    } catch { /* ignore */ }
    return "title";
  });
  const [startTab, setStartTab] = useState<Tab>(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY) as Tab | null;
      if (saved && TABS.some(t => t.id === saved)) return saved;
    } catch { /* ignore */ }
    return "board";
  });

  const hasSave = (() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return !!(raw && JSON.parse(raw));
    } catch { return false; }
  })();

  function handleContinue() {
    setScreen("game");
  }

  function handleNewGame(hardcore: boolean) {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    if (hardcore) {
      try {
        const base = { hardcore: true };
        localStorage.setItem(SAVE_KEY + ".mode", JSON.stringify(base));
      } catch { /* ignore */ }
    }
    setStartTab("settings");
    setScreen("game");
  }

  function handleTutorial() {
    setStartTab("settings");
    setScreen("game");
  }

  if (screen === "title") {
    return (
      <TitleScreen
        hasSave={hasSave}
        onContinue={handleContinue}
        onNewGame={handleNewGame}
        onTutorial={handleTutorial}
      />
    );
  }

  return (
    <GameProvider>
      <Inner startTab={startTab} onGameOver={() => setScreen("title")} />
    </GameProvider>
  );
}
