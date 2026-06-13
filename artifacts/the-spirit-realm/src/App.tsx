import React, { useState, useEffect } from "react";
import { GameProvider } from "@/game/state";
import BoardScreen     from "@/pages/BoardScreen";
import CardsScreen     from "@/pages/CardsScreen";
import BunkerScreen    from "@/pages/BunkerScreen";
import InventoryScreen from "@/pages/InventoryScreen";
import SettingsScreen  from "@/pages/SettingsScreen";
import { C } from "@/components/PixelUI";

type Tab = "board" | "dcc" | "inv" | "bunker" | "settings";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "bunker",   label: "BUNKER",    icon: "⌂" },
  { id: "inv",      label: "GEAR",      icon: "†" },
  { id: "board",    label: "BOARD",     icon: "◈" },
  { id: "dcc",      label: "BLACK ROSE",icon: "♠" },
  { id: "settings", label: "SETTINGS",  icon: "≡" },
];

function Inner() {
  const [tab, setTab] = useState<Tab>("board");
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 700);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

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
      <div style={{
        display: "flex",
        borderBottom: "3px solid #000",
        backgroundColor: "#060E1A",
        flexShrink: 0,
        overflowX: "auto",
      }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "5px 1px",
              backgroundColor: tab === t.id ? C.bg : "transparent",
              color: tab === t.id ? (t.id === "dcc" ? "#C060A0" : C.accent) : C.textDim,
              border: "none",
              borderBottom: tab === t.id
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

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === "board"    && <BoardScreen />}
        {tab === "dcc"      && <CardsScreen />}
        {tab === "inv"      && <InventoryScreen />}
        {tab === "bunker"   && <BunkerScreen />}
        {tab === "settings" && <SettingsScreen />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Inner />
    </GameProvider>
  );
}
