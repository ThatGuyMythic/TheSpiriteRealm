import React from "react";
import { C } from "./PixelUI";
import { CHARACTER_SPRITES } from "@/assets/sprites";

interface Props {
  equipped: { weapon: unknown; helmet: unknown; chest: unknown; cloak: unknown };
  size?: "sm" | "lg";
}

const SLOT_META = {
  weapon:  { label: "WPN", color: "#C0A030" },
  helmet:  { label: "HLM", color: C.cyan },
  chest:   { label: "CST", color: C.cyan },
  cloak:   { label: "CLK", color: "#A060C0" },
} as const;

function GearDoll({ w, h, hasHelmet, hasChest, hasCloak, hasWeapon }: {
  w: number; h: number;
  hasHelmet: boolean; hasChest: boolean; hasCloak: boolean; hasWeapon: boolean;
}) {
  const vw = 24;
  const vh = 36;

  type R = { x: number; y: number; w: number; h: number; fill: string };
  const px: R[] = [];
  const r = (x: number, y: number, rw: number, rh: number, fill: string) =>
    px.push({ x, y, w: rw, h: rh, fill });

  // ── Helmet / head ─────────────────────────────────────────────
  if (hasHelmet) {
    r(7,  0, 10, 1, "#2266AA");
    r(6,  1, 12, 1, "#2277CC");
    r(5,  2, 14, 2, "#3388DD");
    r(5,  2,  2, 2, "#1A5599");
    r(17, 2,  2, 2, "#1A5599");
    r(5,  3,  1, 1, "#AADDFF");
    r(18, 3,  1, 1, "#AADDFF");
  } else {
    r(8,  0,  8, 1, "#3A2510");
    r(7,  1, 10, 2, "#4A3218");
    r(6,  1,  1, 2, "#2A1A08");
    r(17, 1,  1, 2, "#2A1A08");
  }

  // ── Face / neck ───────────────────────────────────────────────
  r(7,  4, 10, 5, "#E8C090");
  r(9,  5,  1, 1, "#222");
  r(14, 5,  1, 1, "#222");
  r(9,  8,  6, 1, "#C09060");
  r(10, 7,  4, 1, "#E0B080");
  r(10, 9,  4, 2, "#D0A070");

  // ── Shoulders ─────────────────────────────────────────────────
  const shCo = hasChest ? "#5599CC" : "#3A5566";
  r(4,  9,  3, 3, shCo);
  r(17, 9,  3, 3, shCo);
  r(3,  10, 1, 2, hasChest ? "#4488BB" : "#2A4455");
  r(20, 10, 1, 2, hasChest ? "#4488BB" : "#2A4455");

  // ── Torso / chest ─────────────────────────────────────────────
  const chFill = hasChest ? "#2266AA" : "#1A3A55";
  const chHi   = hasChest ? "#3388CC" : "#224466";
  r(7,  9, 10, 7, chFill);
  r(8,  9,  3, 7, chHi);
  r(13, 9,  2, 4, hasChest ? "#1A5599" : "#112233");
  r(11, 9,  2, 3, hasChest ? "#88BBDD" : "#334455");

  // ── Belt ──────────────────────────────────────────────────────
  r(7, 16,  10, 2, "#5A4020");
  r(10,16,  4,  2, "#8A6030");
  r(11,16,  2,  2, "#C08040");

  // ── Cloak overlay ─────────────────────────────────────────────
  if (hasCloak) {
    r(3,  9, 18, 8, "#331A66");
    r(4, 17, 16, 4, "#220F55");
    r(3, 20,  3, 2, "#1A0A44");
    r(18,20,  3, 2, "#1A0A44");
  }

  // ── Upper arms ────────────────────────────────────────────────
  r(4, 12,  3, 4, "#E8C090");
  r(17,12,  3, 4, "#E8C090");

  // ── Forearms / hands ──────────────────────────────────────────
  const glFill = hasChest ? "#2266AA" : "#334455";
  r(3, 16,  3, 3, glFill);
  r(18,16,  3, 3, glFill);
  r(3, 19,  3, 2, "#DDAA88");
  r(18,19,  3, 2, "#DDAA88");

  // ── Legs ──────────────────────────────────────────────────────
  r(7, 18,  4, 8, "#224488");
  r(13,18,  4, 8, "#224488");
  r(8, 18,  2, 8, "#2A55AA");
  r(14,18,  2, 8, "#2A55AA");
  r(7, 24,  4, 2, "#1A3366");
  r(13,24,  4, 2, "#1A3366");

  // ── Boots ─────────────────────────────────────────────────────
  r(6, 26,  5, 4, "#1A1A2A");
  r(12,26,  5, 4, "#1A1A2A");
  r(6, 29,  6, 1, "#0A0A14");
  r(12,29,  6, 1, "#0A0A14");
  r(5, 28,  2, 2, "#2A2A3A");
  r(17,28,  2, 2, "#2A2A3A");

  // ── Weapon ───────────────────────────────────────────────────
  if (hasWeapon) {
    r(20, 3,  2, 1, "#AAAAAA");
    r(21, 4,  1,16, "#CCCCCC");
    r(20, 8,  3, 1, "#AA8844");
    r(21,20,  1, 3, "#DDAA22");
    r(20,20,  1, 1, "#FFCC44");
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${vw} ${vh}`}
      style={{ imageRendering: "pixelated", display: "block" }}>
      {px.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.fill} />
      ))}
    </svg>
  );
}

export default function CharacterDoll({ equipped, size = "sm" }: Props) {
  const imgSrc = CHARACTER_SPRITES["inventory_player_model"] ?? CHARACTER_SPRITES["self"];
  const w = size === "lg" ? 96 : 60;
  const h = size === "lg" ? 132 : 80;

  const slots = [
    { key: "helmet" as const, item: equipped.helmet },
    { key: "chest"  as const, item: equipped.chest  },
    { key: "cloak"  as const, item: equipped.cloak  },
    { key: "weapon" as const, item: equipped.weapon },
  ];

  const slotPips = (
    <div style={{
      position: "absolute", bottom: 2, right: 2,
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
    }}>
      {slots.map(s => {
        const meta = SLOT_META[s.key];
        const eq = !!s.item;
        return (
          <div key={s.key} title={meta.label} style={{
            width: size === "lg" ? 17 : 13,
            height: size === "lg" ? 17 : 13,
            backgroundColor: eq ? meta.color + "CC" : "#000000BB",
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
  );

  if (imgSrc) {
    return (
      <div style={{ position: "relative", width: w, height: h, flexShrink: 0 }}>
        <img src={imgSrc} alt="Player" style={{
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "top center",
          imageRendering: "pixelated", display: "block",
          border: `2px solid ${C.green}44`,
        }} />
        {slotPips}
      </div>
    );
  }

  return (
    <div style={{
      width: w, height: h, position: "relative", flexShrink: 0,
      backgroundColor: "#080C14", border: `2px solid ${C.green}44`,
    }}>
      <GearDoll
        w={w - 4} h={h - 4}
        hasHelmet={!!equipped.helmet}
        hasChest={!!equipped.chest}
        hasCloak={!!equipped.cloak}
        hasWeapon={!!equipped.weapon}
      />
      {slotPips}
    </div>
  );
}
