import React from "react";
import { C } from "./PixelUI";

const B = import.meta.env.BASE_URL;
const PLAYER_IMG = `${B}art/jwc/inventory_player_model.png`;

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

export function GearDoll({
  w, h,
  hasHelmet: _h, hasChest: _c, hasCloak: _cl, hasWeapon: _w,
}: {
  w: number; h: number;
  hasHelmet: boolean; hasChest: boolean; hasCloak: boolean; hasWeapon: boolean;
}) {
  return (
    <img
      src={PLAYER_IMG}
      alt="Player"
      style={{
        width: w,
        height: h,
        imageRendering: "pixelated",
        objectFit: "contain",
        objectPosition: "center bottom",
        display: "block",
      }}
    />
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
      <img
        src={PLAYER_IMG}
        alt="Player"
        style={{
          width: w - 4,
          height: h - 4,
          imageRendering: "pixelated",
          objectFit: "contain",
          objectPosition: "center bottom",
          display: "block",
        }}
      />
      {slotPips}
    </div>
  );
}
