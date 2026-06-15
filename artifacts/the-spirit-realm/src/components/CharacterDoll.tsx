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

function GearDoll({ w, h, hasHelmet, hasChest, hasCloak, hasWeapon }: {
  w: number; h: number;
  hasHelmet: boolean; hasChest: boolean; hasCloak: boolean; hasWeapon: boolean;
}) {
  const vw = 20;
  const vh = 28;

  type Rect = { x: number; y: number; w: number; h: number; fill: string };

  const pixels: Rect[] = [
    { x: 7,  y: 0, w: 6,  h: 1, fill: hasHelmet ? "#4488CC" : "#5A4020" },
    { x: 6,  y: 1, w: 8,  h: 3, fill: hasHelmet ? "#5599DD" : "#6B5030" },
    { x: 5,  y: 1, w: 1,  h: 2, fill: hasHelmet ? "#3377BB" : "#3A2A14" },
    { x: 14, y: 1, w: 1,  h: 2, fill: hasHelmet ? "#3377BB" : "#3A2A14" },

    { x: 7,  y: 4, w: 6,  h: 4, fill: "#E8C090" },
    { x: 8,  y: 5, w: 1,  h: 1, fill: "#111111" },
    { x: 11, y: 5, w: 1,  h: 1, fill: "#111111" },
    { x: 8,  y: 7, w: 4,  h: 1, fill: "#C09060" },

    { x: 4,  y: 8, w: 12, h: 1, fill: "#BBBBBB" },
    { x: 5,  y: 9, w: 10, h: 5, fill: hasChest ? "#448833" : "#336622" },
    { x: 4,  y: 9, w: 1,  h: 4, fill: hasChest ? "#336622" : "#224411" },
    { x: 15, y: 9, w: 1,  h: 4, fill: hasChest ? "#336622" : "#224411" },
    { x: 9,  y: 9, w: 2,  h: 5, fill: hasChest ? "#55AA44" : "#336622" },
    { x: 3,  y: 9, w: 1,  h: 3, fill: "#E8C090" },
    { x: 16, y: 9, w: 1,  h: 3, fill: "#E8C090" },

    { x: 4,  y: 13, w: 1, h: 2, fill: "#BBBBBB" },
    { x: 15, y: 13, w: 1, h: 2, fill: "#BBBBBB" },

    { x: 5,  y: 14, w: 10, h: 1, fill: "#336622" },

    { x: 6,  y: 15, w: 3,  h: 5, fill: "#2A4A88" },
    { x: 11, y: 15, w: 3,  h: 5, fill: "#2A4A88" },
    { x: 9,  y: 15, w: 2,  h: 3, fill: "#445566" },

    { x: 6,  y: 20, w: 3,  h: 3, fill: "#1A1A2A" },
    { x: 11, y: 20, w: 3,  h: 3, fill: "#1A1A2A" },
    { x: 7,  y: 23, w: 2,  h: 2, fill: "#333344" },
    { x: 11, y: 23, w: 2,  h: 2, fill: "#333344" },
  ];

  if (hasCloak) {
    pixels.push(
      { x: 3,  y: 9,  w: 14, h: 6, fill: "#221A44" },
      { x: 4,  y: 15, w: 12, h: 5, fill: "#1A1336" },
    );
  }

  if (hasWeapon) {
    pixels.push(
      { x: 17, y: 4,  w: 2, h: 1,  fill: "#AAAAAA" },
      { x: 18, y: 5,  w: 1, h: 13, fill: "#CCCCCC" },
      { x: 17, y: 8,  w: 3, h: 1,  fill: "#AA8844" },
      { x: 18, y: 17, w: 1, h: 2,  fill: "#DDAA22" },
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
    <div style={{ width: w, height: h, position: "relative", flexShrink: 0, backgroundColor: "#080C10", border: `2px solid ${C.green}44` }}>
      <GearDoll
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
