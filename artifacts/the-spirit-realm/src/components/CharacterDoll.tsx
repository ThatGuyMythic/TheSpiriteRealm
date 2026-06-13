import React from "react";
import { C } from "./PixelUI";

interface Props {
  equipped: { weapon: unknown; helmet: unknown; chest: unknown; cloak: unknown };
  size?: "sm" | "lg";
}

export default function CharacterDoll({ equipped, size = "sm" }: Props) {
  const s = size === "lg" ? 96 : 40;
  const hasHelmet = !!equipped.helmet;
  const hasChest  = !!equipped.chest;
  const hasCloak  = !!equipped.cloak;
  const hasWeapon = !!equipped.weapon;

  return (
    <div style={{ width: s, height: s, position: "relative", flexShrink: 0 }}>
      {/* Left arm */}
      <div style={{ position: "absolute", left: "4%", top: "42%", width: "20%", height: "12%", backgroundColor: hasChest ? C.cyan : C.textDim, border: "2px solid #000" }} />
      {/* Right arm */}
      <div style={{ position: "absolute", right: "4%", top: "42%", width: "20%", height: "12%", backgroundColor: hasChest ? C.cyan : C.textDim, border: "2px solid #000" }} />
      {/* Left forearm (angled down slightly) */}
      <div style={{ position: "absolute", left: "2%", top: "52%", width: "16%", height: "10%", backgroundColor: "#D09060", border: "2px solid #000" }} />
      {/* Right forearm / weapon hand */}
      <div style={{ position: "absolute", right: "2%", top: "52%", width: "16%", height: "10%", backgroundColor: "#D09060", border: "2px solid #000" }} />
      {/* Cloak (behind body, extends to sides) */}
      {hasCloak && (
        <div style={{ position: "absolute", left: "10%", top: "38%", width: "80%", height: "55%", backgroundColor: "#5A2080", border: "2px solid #000", opacity: 0.75, zIndex: 0 }} />
      )}
      {/* Legs */}
      <div style={{ position: "absolute", left: "28%", top: "80%", width: "18%", height: "18%", backgroundColor: C.bg3, border: "2px solid #000" }} />
      <div style={{ position: "absolute", right: "28%", top: "80%", width: "18%", height: "18%", backgroundColor: C.bg3, border: "2px solid #000" }} />
      {/* Body */}
      <div style={{ position: "absolute", left: "26%", top: "40%", width: "48%", height: "42%", backgroundColor: hasChest ? C.cyan : C.textDim, border: "2px solid #000", zIndex: 1 }} />
      {/* Belt line */}
      <div style={{ position: "absolute", left: "26%", top: "68%", width: "48%", height: "6%", backgroundColor: "#8A6030", border: "1px solid #000", zIndex: 2 }} />
      {/* Head */}
      <div style={{ position: "absolute", left: "26%", top: "8%", width: "48%", height: "34%", backgroundColor: hasHelmet ? C.yellow : "#E8C88A", border: "2px solid #000", zIndex: 2 }}>
        {/* Eyes */}
        <div style={{ position: "absolute", left: "16%", top: "42%", width: "18%", height: "20%", backgroundColor: "#000" }} />
        <div style={{ position: "absolute", right: "16%", top: "42%", width: "18%", height: "20%", backgroundColor: "#000" }} />
        {/* Helmet brim */}
        {hasHelmet && (
          <div style={{ position: "absolute", left: "-4%", bottom: "-2px", width: "108%", height: "16%", backgroundColor: "#C09020", border: "1px solid #000" }} />
        )}
      </div>
      {/* Weapon */}
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
