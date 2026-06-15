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

function FireRedDoll({ w, h, hasHelmet, hasChest, hasCloak, hasWeapon }: {
  w: number; h: number;
  hasHelmet: boolean; hasChest: boolean; hasCloak: boolean; hasWeapon: boolean;
}) {
  const vw = 20;
  const vh = 28;
  const sx = w / vw;
  const sy = h / vh;

  type Rect = { x: number; y: number; w: number; h: number; fill: string };

  const pixels: Rect[] = [
    { x: 7,  y: 0, w: 6,  h: 1, fill: "#CC2200" },
    { x: 6,  y: 1, w: 8,  h: 1, fill: "#CC2200" },
    { x: 6,  y: 2, w: 8,  h: 2, fill: hasHelmet ? "#FF3300" : "#CC2200" },
    { x: 5,  y: 2, w: 1,  h: 2, fill: "#222222" },
    { x: 14, y: 2, w: 1,  h: 2, fill: "#222222" },
    { x: 7,  y: 4, w: 6,  h: 4, fill: "#F0C080" },
    { x: 8,  y: 5, w: 1,  h: 1, fill: "#111111" },
    { x: 11, y: 5, w: 1,  h: 1, fill: "#111111" },
    { x: 8,  y: 7, w: 4,  h: 1, fill: "#D08050" },
    { x: 5,  y: 8, w: 10, h: 1, fill: "#AAAAAA" },
    { x: 5,  y: 9,  w: 10, h: 5, fill: hasChest ? "#2255CC" : "#334488" },
    { x: 4,  y: 9,  w: 1,  h: 4, fill: hasChest ? "#1A44BB" : "#223377" },
    { x: 15, y: 9,  w: 1,  h: 4, fill: hasChest ? "#1A44BB" : "#223377" },
    { x: 3,  y: 9,  w: 1,  h: 3, fill: "#F0C080" },
    { x: 16, y: 9,  w: 1,  h: 3, fill: "#F0C080" },
    { x: 5,  y: 14, w: 10, h: 1, fill: "#224488" },
    { x: 6,  y: 15, w: 3,  h: 5, fill: "#224488" },
    { x: 11, y: 15, w: 3,  h: 5, fill: "#224488" },
    { x: 6,  y: 20, w: 3,  h: 3, fill: "#1A1A1A" },
    { x: 11, y: 20, w: 3,  h: 3, fill: "#1A1A1A" },
    { x: 5,  y: 20, w: 1,  h: 3, fill: "#333333" },
    { x: 14, y: 20, w: 1,  h: 3, fill: "#333333" },
  ];

  if (hasCloak) {
    pixels.push(
      { x: 4, y: 9,  w: 12, h: 6, fill: "#5A1A88" },
      { x: 5, y: 15, w: 10, h: 4, fill: "#44126E" },
    );
  }

  if (hasWeapon) {
    pixels.push(
      { x: 17, y: 5,  w: 1, h: 12, fill: "#CCCCCC" },
      { x: 16, y: 9,  w: 3, h: 1,  fill: "#A08050" },
      { x: 17, y: 17, w: 1, h: 2,  fill: "#D4A020" },
    );
  }

  return (
    <svg
      width={w} height={h}
      viewBox={`0 0 ${vw} ${vh}`}
      style={{ imageRendering: "pixelated", display: "block" }}
    >
      {pixels.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
      {void (sx, sy)}
    </svg>
  );
}

export default function CharacterDoll({ equipped, size = "sm" }: Props) {
  const imgSrc = CHARACTER_SPRITES["inventory_player_model"] ?? CHARACTER_SPRITES["self"];
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
        <div style={{
          position: "absolute", bottom: 2, right: 2,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2,
        }}>
          {slots.map(s => {
            const meta = SLOT_META[s.key];
            const eq = !!s.item;
            return (
              <div key={s.key} title={meta.label} style={{
                width: size === "lg" ? 18 : 14,
                height: size === "lg" ? 18 : 14,
                backgroundColor: eq ? meta.color + "CC" : "#000000AA",
                border: `1px solid ${eq ? meta.color : "#444"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="pixel-text" style={{ fontSize: size === "lg" ? 7 : 6, color: eq ? "#000" : "#555", lineHeight: 1 }}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const hasHelmet = !!equipped.helmet;
  const hasChest  = !!equipped.chest;
  const hasCloak  = !!equipped.cloak;
  const hasWeapon = !!equipped.weapon;

  return (
    <div style={{ width: w, height: h, position: "relative", flexShrink: 0, backgroundColor: "#0A0A14", border: `2px solid ${C.green}44` }}>
      <FireRedDoll
        w={w - 4}
        h={h - 4}
        hasHelmet={hasHelmet}
        hasChest={hasChest}
        hasCloak={hasCloak}
        hasWeapon={hasWeapon}
      />
      <div style={{
        position: "absolute", bottom: 2, right: 2,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
      }}>
        {slots.map(s => {
          const meta = SLOT_META[s.key];
          const eq = !!s.item;
          return (
            <div key={s.key} title={meta.label} style={{
              width: size === "lg" ? 16 : 12,
              height: size === "lg" ? 16 : 12,
              backgroundColor: eq ? meta.color + "CC" : "#000000AA",
              border: `1px solid ${eq ? meta.color : "#333"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="pixel-text" style={{ fontSize: size === "lg" ? 6 : 5, color: eq ? "#000" : "#444", lineHeight: 1 }}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
