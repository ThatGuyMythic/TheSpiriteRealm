import React from "react";
import { C } from "./PixelUI";

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

// ── 64×96 forward-facing pixel art knight ─────────────────────────────────────
export function GearDoll({
  w, h,
  hasHelmet, hasChest, hasCloak, hasWeapon,
}: {
  w: number; h: number;
  hasHelmet: boolean; hasChest: boolean; hasCloak: boolean; hasWeapon: boolean;
}) {
  type R = { x: number; y: number; w: number; h: number; fill: string };
  const px: R[] = [];
  const r = (x: number, y: number, rw: number, rh: number, fill: string) =>
    px.push({ x, y, w: rw, h: rh, fill });

  // ── Helmet / hair ────────────────────────────────────────────────────────────
  if (hasHelmet) {
    // brim
    r(14,  2, 36, 2, "#1A55AA");
    // main dome
    r(18,  4, 28, 2, "#2266CC");
    r(16,  6, 32, 2, "#2B73DD");
    r(14,  8, 36, 6, "#2266CC");
    // visor slot
    r(16, 10, 32, 2, "#0A1428");
    // side guards
    r(14, 14,  4, 6, "#1A55AA");
    r(46, 14,  4, 6, "#1A55AA");
    // highlight
    r(20,  5,  6, 2, "#5599EE");
    r(19,  7,  4, 2, "#4488DD");
  } else {
    // hair
    r(20,  2, 24, 3, "#2A1806");
    r(18,  5, 28, 4, "#3A2208");
    r(16,  8,  4, 4, "#2A1806");
    r(44,  8,  4, 4, "#2A1806");
  }

  // ── Head / face ──────────────────────────────────────────────────────────────
  const skin = "#F0C888";
  const skinDark = "#D8A860";
  r(20, 12, 24, 16, skin);
  // sides (ears)
  r(16, 14, 4, 10, skin);
  r(44, 14, 4, 10, skin);
  r(16, 14, 2, 10, skinDark); // ear shadow left
  r(46, 14, 2, 10, skinDark); // ear shadow right

  // eye sockets
  r(22, 17, 8, 6, skin);
  r(34, 17, 8, 6, skin);
  // eyes
  r(23, 18, 6, 4, "#1A1A2A");
  r(35, 18, 6, 4, "#1A1A2A");
  r(24, 18, 4, 2, "#4466CC"); // iris
  r(36, 18, 4, 2, "#4466CC");
  r(25, 18, 2, 2, "#7799EE"); // highlight
  r(37, 18, 2, 2, "#7799EE");
  r(24, 19, 2, 2, "#111");    // pupil
  r(36, 19, 2, 2, "#111");

  // eyebrows
  r(23, 16, 7, 1, "#2A1808");
  r(34, 16, 7, 1, "#2A1808");

  // nose
  r(29, 22, 6, 2, skinDark);
  r(29, 24, 2, 2, "#C09060");
  r(33, 24, 2, 2, "#C09060");

  // mouth
  r(26, 26, 12, 1, skinDark);
  r(28, 27,  8, 2, "#B06050");
  r(29, 27,  6, 1, "#E08070");

  // chin / jaw
  r(20, 28, 24, 2, skinDark);

  // ── Neck ─────────────────────────────────────────────────────────────────────
  r(26, 30,  6, 2, skin);
  r(28, 30,  8, 4, skin);

  // ── Collar / pauldrons ───────────────────────────────────────────────────────
  const plate = hasChest ? "#2266AA" : "#2A3D55";
  const plateLt = hasChest ? "#4488CC" : "#3A5566";
  const plateDk = hasChest ? "#1A4488" : "#1A2D3A";

  r(22, 34, 20, 2, plateLt); // collar
  r(20, 36, 24, 2, plate);

  // left pauldron
  r(10, 34, 14, 4, plate);
  r(10, 38, 14, 4, plateDk);
  r(10, 34, 2,  8, plateDk);
  r(12, 34, 2,  4, plateLt);

  // right pauldron
  r(40, 34, 14, 4, plate);
  r(40, 38, 14, 4, plateDk);
  r(52, 34, 2,  8, plateDk);
  r(40, 34, 2,  4, plateLt);

  // ── Chest plate ──────────────────────────────────────────────────────────────
  r(20, 38, 24, 18, plate);
  r(22, 38,  4, 18, plateLt); // left highlight stripe
  r(38, 38,  4, 10, plateDk); // right shadow
  // center line detail
  r(30, 38,  4, 16, plateDk + "AA");
  // chest emblem
  r(28, 42,  8,  6, plateLt);
  r(30, 42,  4,  6, "#6AAAD0");

  // ── Belt ─────────────────────────────────────────────────────────────────────
  r(20, 56, 24, 4, "#4A3010");
  r(28, 56,  8, 4, "#7A5020");
  r(30, 56,  4, 4, "#AA7030");

  // ── Cloak ────────────────────────────────────────────────────────────────────
  if (hasCloak) {
    r( 8, 36, 48, 28, "#3A1880AA");
    r( 8, 64, 14,  8, "#2A1060");
    r(42, 64, 14,  8, "#2A1060");
    r(12, 72,  8,  6, "#1A0850");
    r(44, 72,  8,  6, "#1A0850");
  }

  // ── Upper arms ───────────────────────────────────────────────────────────────
  r(10, 42, 10, 16, skin);
  r(44, 42, 10, 16, skin);
  // gauntlet cuffs
  const cuff = hasChest ? "#2266AA" : "#334455";
  r(10, 54, 10, 4, cuff);
  r(44, 54, 10, 4, cuff);

  // ── Forearms / hands ─────────────────────────────────────────────────────────
  r(10, 58, 10, 10, skin);
  r(44, 58, 10, 10, skin);
  r(12, 68,  8,  4, skin);
  r(44, 68,  8,  4, skin);

  // ── Thighs ───────────────────────────────────────────────────────────────────
  const legCo = hasChest ? "#1A4A88" : "#1A2D44";
  const legHi = hasChest ? "#2B66AA" : "#253D55";
  r(20, 60, 10, 16, legCo);
  r(34, 60, 10, 16, legCo);
  r(22, 60,  4, 16, legHi);
  r(36, 60,  4, 16, legHi);
  // inner thigh gap
  r(30, 60,  4,  2, "#0A0A14");

  // ── Shins ────────────────────────────────────────────────────────────────────
  r(20, 76, 10, 12, legCo);
  r(34, 76, 10, 12, legCo);
  r(22, 76,  4, 12, legHi);
  r(36, 76,  4, 12, legHi);
  // knee cap
  r(21, 74,  8,  4, plateLt);
  r(35, 74,  8,  4, plateLt);

  // ── Boots ────────────────────────────────────────────────────────────────────
  r(18, 88, 14,  6, "#181818");
  r(32, 88, 14,  6, "#181818");
  r(16, 90, 16,  4, "#0A0A0A"); // toe
  r(30, 90, 18,  4, "#0A0A0A");
  r(20, 86,  8,  4, "#242424"); // ankle
  r(36, 86,  8,  4, "#242424");

  // ── Weapon (sword, right side) ───────────────────────────────────────────────
  if (hasWeapon) {
    // guard
    r(50, 40,  6, 2, "#CC9922");
    r(48, 41, 10, 4, "#DDAA33");
    // grip
    r(51, 45,  2,14, "#8B4513");
    r(52, 45,  1,14, "#A05820");
    // pommel
    r(50, 59,  4,  4, "#CC9922");
    // blade (going up)
    r(51,  6,  2, 34, "#CCCCCC");
    r(52,  6,  2, 34, "#EEEEEE");
    r(51,  5,  2,  1, "#FFFFFF");
    r(50,  7,  1, 28, "#AAAAAA");
    r(53,  7,  1, 28, "#DDDDDD");
  }

  return (
    <svg
      width={w} height={h}
      viewBox="0 0 64 96"
      style={{ imageRendering: "pixelated", display: "block" }}
    >
      {px.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.fill} />
      ))}
    </svg>
  );
}

export default function CharacterDoll({ equipped, size = "sm" }: Props) {
  const w = size === "lg" ? 96 : 64;
  const h = size === "lg" ? 144 : 96;

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
            width: size === "lg" ? 18 : 14,
            height: size === "lg" ? 18 : 14,
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

  return (
    <div style={{
      width: w, height: h, position: "relative", flexShrink: 0,
      backgroundColor: "#060A10",
      border: `2px solid ${C.green}44`,
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
