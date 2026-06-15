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

// ── 64×96 Pokemon Fire Red–style pixel art trainer ────────────────────────────
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

  const skin    = "#F5C070";
  const skinSh  = "#C8904A";
  const dark    = "#0E0A08";

  // ── Helmet or spiky Pokemon-style hair ───────────────────────────────────────
  if (hasHelmet) {
    // Dome outline
    r(17, 2, 30, 16, dark);
    // Dome fill (bright blue)
    r(19, 3, 26, 12, "#1A55AA");
    r(22, 3,  8,  4, "#4A90DD"); // highlight
    // Brim
    r(14,13, 36,  4, dark);
    r(15,14, 34,  3, "#1A55AA");
    // Visor slit
    r(18,12, 28,  3, "#081828");
    r(20,13, 24,  1, "#0A2055");
    // Side guards
    r(14,16,  6,  8, "#1A55AA");
    r(44,16,  6,  8, "#1A55AA");
  } else {
    // Spiky hair — three upward spikes like Pokemon trainers
    r(22, 0,  6,  8, dark); // spike L
    r(29, 0,  6, 10, dark); // spike C (tallest)
    r(37, 0,  6,  8, dark); // spike R
    // Hair mass
    r(18, 6, 28, 12, dark);
    // Inner lighter tone
    r(20, 8,  6,  8, "#2A1808");
    r(38, 8,  6,  8, "#2A1808");
    // Side tufts
    r(16,14,  4,  6, dark);
    r(44,14,  4,  6, dark);
  }

  // ── Head (big Pokemon proportions) ───────────────────────────────────────────
  // Outline
  r(16,12, 32, 22, dark);
  // Face fill
  r(18,13, 28, 20, skin);
  // Ears
  r(15,15,  4, 10, skin);
  r(45,15,  4, 10, skin);
  r(15,15,  2, 10, skinSh);
  r(47,15,  2, 10, skinSh);

  // Eyes — large simple Pokemon-style dots
  r(20,18,  8,  7, dark); // L eye bg
  r(21,19,  6,  5, "#225599");
  r(22,19,  4,  3, "#4488CC");
  r(21,19,  2,  2, "#AAD0EE"); // sparkle
  r(35,18,  8,  7, dark); // R eye bg
  r(36,19,  6,  5, "#225599");
  r(37,19,  4,  3, "#4488CC");
  r(36,19,  2,  2, "#AAD0EE");

  // Eyebrows (thick, expressive)
  r(20,16,  8,  2, dark);
  r(36,16,  8,  2, dark);

  // Simple mouth — no nose (classic Pokemon style)
  r(26,27,  3,  2, skinSh); // L cheek dimple
  r(35,27,  3,  2, skinSh); // R cheek dimple
  r(29,28,  6,  2, "#CC7060"); // lips
  r(25,30,  4,  2, skinSh); // chin shadow L
  r(35,30,  4,  2, skinSh); // chin shadow R

  // ── Neck ─────────────────────────────────────────────────────────────────────
  r(27,33,  4,  2, skin);
  r(25,35, 14,  4, skin);

  // ── Body colours ─────────────────────────────────────────────────────────────
  const pl  = hasChest ? "#1A55AA" : "#1E4060";
  const plL = hasChest ? "#4A90DD" : "#3A6888";
  const plD = hasChest ? "#0E3880" : "#0E2030";

  // ── Pauldrons ────────────────────────────────────────────────────────────────
  // Left
  r( 8,36, 18, 14, dark);
  r( 9,37, 16, 12, pl);
  r( 9,37,  5, 12, plL);
  r(21,37,  4, 12, plD);
  // Right
  r(38,36, 18, 14, dark);
  r(39,37, 16, 12, pl);
  r(39,37,  5, 12, plL);
  r(51,37,  4, 12, plD);

  // ── Torso ────────────────────────────────────────────────────────────────────
  r(18,38, 28, 22, dark); // outline
  r(20,39, 24, 20, pl);   // fill
  r(22,39,  6, 20, plL);  // highlight strip
  r(38,41,  4, 16, plD);  // shadow strip
  // Belt + buckle
  r(18,58, 28,  5, dark);
  r(20,59, 24,  4, "#4A3008");
  r(26,59,  6,  4, "#7A5018");
  r(28,59,  4,  4, "#CCAA44");
  r(29,60,  2,  2, "#FFEE88"); // buckle shine
  // Chest emblem
  r(26,44, 12, 10, plL);
  r(28,46,  8,  6, "#88CCFF");
  r(30,48,  4,  2, "#FFFFFF");

  // ── Cloak ────────────────────────────────────────────────────────────────────
  if (hasCloak) {
    r( 6,38, 52, 28, "#3A1880BB");
    r( 6,66, 18, 10, "#2A1060");
    r(40,66, 18, 10, "#2A1060");
    r(10,74, 10,  8, "#1A0850");
    r(44,74, 10,  8, "#1A0850");
  }

  // ── Arms ─────────────────────────────────────────────────────────────────────
  // Left
  r( 8,40, 12, 22, dark);
  r( 9,41, 10, 20, skin);
  // Right
  r(44,40, 12, 22, dark);
  r(45,41, 10, 20, skin);
  // Cuffs
  const cf = hasChest ? "#1A55AA" : "#1A3048";
  r( 8,58, 12,  5, cf);
  r(44,58, 12,  5, cf);
  // Fists
  r( 9,63, 10,  6, skin);
  r(45,63, 10,  6, skin);
  r(10,68,  8,  3, skinSh);
  r(46,68,  8,  3, skinSh);

  // ── Legs ─────────────────────────────────────────────────────────────────────
  const lc = hasChest ? "#1A3A88" : "#1A2E44";
  const lh = hasChest ? "#3060BB" : "#2A4A60";
  // Thighs
  r(20,63, 12, 18, dark);
  r(21,64, 10, 16, lc);
  r(22,64,  4, 16, lh);
  r(32,63, 12, 18, dark);
  r(33,64, 10, 16, lc);
  r(34,64,  4, 16, lh);
  r(30,63,  4,  2, dark); // gap
  // Knee caps
  r(21,79, 10,  4, plL);
  r(33,79, 10,  4, plL);
  // Shins
  r(20,81, 12, 10, dark);
  r(21,82, 10,  8, lc);
  r(22,82,  4,  8, lh);
  r(32,81, 12, 10, dark);
  r(33,82, 10,  8, lc);
  r(34,82,  4,  8, lh);

  // ── Boots ────────────────────────────────────────────────────────────────────
  r(18,90, 14,  6, dark);
  r(32,90, 14,  6, dark);
  r(16,92, 18,  4, "#0A0808");
  r(30,92, 18,  4, "#0A0808");
  r(20,88,  8,  4, "#1E1818"); // ankle
  r(34,88,  8,  4, "#1E1818");

  // ── Weapon (sword on right) ───────────────────────────────────────────────────
  if (hasWeapon) {
    r(52, 2,  4, 40, "#BBBBBB"); // blade
    r(53, 2,  2, 40, "#F0F0F0"); // edge shine
    r(52, 1,  4,  1, "#FFFFFF"); // tip
    r(48,42, 12,  5, dark);      // guard outline
    r(49,43, 10,  3, "#DDB030");
    r(51,43,  4,  1, "#FFEE66"); // guard shine
    r(53,47,  2, 14, "#7A3810"); // grip
    r(51,61,  6,  5, dark);      // pommel outline
    r(52,62,  4,  3, "#DDB030");
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
