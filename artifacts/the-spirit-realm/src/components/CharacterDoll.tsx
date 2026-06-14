import React from "react";
import { C } from "./PixelUI";
import { CHARACTER_SPRITES } from "@/assets/sprites";

interface Props {
  equipped: { weapon: unknown; helmet: unknown; chest: unknown; cloak: unknown };
  size?: "sm" | "lg";
}

const SLOT_META = {
  weapon:  { label: "WPN", icon: "⚔", color: "#C0A030" },
  helmet:  { label: "HLM", icon: "🪖", color: C.cyan },
  chest:   { label: "CST", icon: "🛡", color: C.cyan },
  cloak:   { label: "CLK", icon: "🧣", color: "#A060C0" },
} as const;

export default function CharacterDoll({ equipped, size = "sm" }: Props) {
  const imgSrc = CHARACTER_SPRITES["self"];
  const w = size === "lg" ? 96 : 56;
  const h = size === "lg" ? 128 : 72;

  const slots = [
    { key: "helmet" as const,  item: equipped.helmet  },
    { key: "chest"  as const,  item: equipped.chest   },
    { key: "cloak"  as const,  item: equipped.cloak   },
    { key: "weapon" as const,  item: equipped.weapon  },
  ];

  if (imgSrc) {
    return (
      <div style={{ position: "relative", width: w, height: h, flexShrink: 0 }}>
        {/* Player sprite */}
        <img
          src={imgSrc}
          alt="Player"
          style={{
            width: "100%", height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            imageRendering: "pixelated",
            display: "block",
            border: `2px solid ${C.green}44`,
          }}
        />
        {/* Equipment badges — 2×2 grid in bottom-right corner */}
        <div style={{
          position: "absolute", bottom: 2, right: 2,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2,
        }}>
          {slots.map(s => {
            const meta = SLOT_META[s.key];
            const equipped = !!s.item;
            return (
              <div
                key={s.key}
                title={meta.label}
                style={{
                  width: size === "lg" ? 18 : 14,
                  height: size === "lg" ? 18 : 14,
                  backgroundColor: equipped ? meta.color + "CC" : "#000000AA",
                  border: `1px solid ${equipped ? meta.color : "#444"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span className="pixel-text" style={{ fontSize: size === "lg" ? 7 : 6, color: equipped ? "#000" : "#555", lineHeight: 1 }}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Fallback: original CSS doll ───────────────────────────────────────────
  const s = size === "lg" ? 96 : 40;
  const hasHelmet = !!equipped.helmet;
  const hasChest  = !!equipped.chest;
  const hasCloak  = !!equipped.cloak;
  const hasWeapon = !!equipped.weapon;

  return (
    <div style={{ width: s, height: s, position: "relative", flexShrink: 0 }}>
      <div style={{ position: "absolute", left: "4%", top: "42%", width: "20%", height: "12%", backgroundColor: hasChest ? C.cyan : C.textDim, border: "2px solid #000" }} />
      <div style={{ position: "absolute", right: "4%", top: "42%", width: "20%", height: "12%", backgroundColor: hasChest ? C.cyan : C.textDim, border: "2px solid #000" }} />
      <div style={{ position: "absolute", left: "2%", top: "52%", width: "16%", height: "10%", backgroundColor: "#D09060", border: "2px solid #000" }} />
      <div style={{ position: "absolute", right: "2%", top: "52%", width: "16%", height: "10%", backgroundColor: "#D09060", border: "2px solid #000" }} />
      {hasCloak && (
        <div style={{ position: "absolute", left: "10%", top: "38%", width: "80%", height: "55%", backgroundColor: "#5A2080", border: "2px solid #000", opacity: 0.75, zIndex: 0 }} />
      )}
      <div style={{ position: "absolute", left: "28%", top: "80%", width: "18%", height: "18%", backgroundColor: C.bg3, border: "2px solid #000" }} />
      <div style={{ position: "absolute", right: "28%", top: "80%", width: "18%", height: "18%", backgroundColor: C.bg3, border: "2px solid #000" }} />
      <div style={{ position: "absolute", left: "26%", top: "40%", width: "48%", height: "42%", backgroundColor: hasChest ? C.cyan : C.textDim, border: "2px solid #000", zIndex: 1 }} />
      <div style={{ position: "absolute", left: "26%", top: "68%", width: "48%", height: "6%", backgroundColor: "#8A6030", border: "1px solid #000", zIndex: 2 }} />
      <div style={{ position: "absolute", left: "26%", top: "8%", width: "48%", height: "34%", backgroundColor: hasHelmet ? C.yellow : "#E8C88A", border: "2px solid #000", zIndex: 2 }}>
        <div style={{ position: "absolute", left: "16%", top: "42%", width: "18%", height: "20%", backgroundColor: "#000" }} />
        <div style={{ position: "absolute", right: "16%", top: "42%", width: "18%", height: "20%", backgroundColor: "#000" }} />
        {hasHelmet && (
          <div style={{ position: "absolute", left: "-4%", bottom: "-2px", width: "108%", height: "16%", backgroundColor: "#C09020", border: "1px solid #000" }} />
        )}
      </div>
      {hasWeapon && (
        <>
          <div style={{ position: "absolute", right: "-2%", top: "22%", width: "8%", height: "58%", backgroundColor: "#C0C0C0", border: "2px solid #000", zIndex: 3 }} />
          <div style={{ position: "absolute", right: "-6%", top: "46%", width: "20%", height: "7%", backgroundColor: "#907040", border: "1px solid #000", zIndex: 3 }} />
          <div style={{ position: "absolute", right: "-1%", top: "75%", width: "10%", height: "8%", backgroundColor: "#D4A020", border: "1px solid #000", zIndex: 3 }} />
        </>
      )}
    </div>
  );
}
