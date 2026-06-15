import React from "react";
import { C } from "./PixelUI";
import type { Card } from "@/game/data";
import { CARD_SPRITES } from "@/assets/sprites";

// ── Category detection ────────────────────────────────────────────────────────
function detectCategory(name: string): string {
  const n = name.toLowerCase();
  if (/dragon|drake/.test(n))                                       return "dragon";
  if (/slime|blob|goo|acid|slug/.test(n))                          return "slime";
  if (/skeleton|bone|skull|risen|tomb|walker/.test(n))             return "skeleton";
  if (/fire|burn|ember|firegaunt|blaze/.test(n))                   return "fire";
  if (/ice|frost|snow|blizzard|glacial|frozen/.test(n))            return "ice";
  if (/goblin|runt|warchief|shaman|bomb/.test(n))                  return "goblin";
  if (/demon|shadow|fiend|imp|pit|dark assassin/.test(n))          return "demon";
  if (/vine|root|treant|sprout|thorn|plant|ancient sprout/.test(n)) return "plant";
  if (/troll|golem|titan|colossus|giant/.test(n))                  return "troll";
  if (/wolf|hound|beast|hydra|serpent/.test(n))                    return "beast";
  if (/witch|swamp witch|bog/.test(n))                             return "mage";
  if (/archer|hunter|brass hunter/.test(n))                        return "archer";
  if (/assassin|dagger|cloak|shade|rogue|shadow/.test(n))          return "assassin";
  if (/mage|shaman|witch|cleric|sorcerer|warlock|lich|scientist/.test(n)) return "mage";
  if (/orc/.test(n))                                               return "orc";
  if (/king|ruler/.test(n))                                        return "king";
  if (/jester|joker/.test(n))                                      return "jester";
  if (/knight|guard|soldier|warrior|village/.test(n))              return "warrior";
  return "warrior";
}

interface CatSpec { bg: string; main: string; hi: string; rows: number[] }

const CATS: Record<string, CatSpec> = {
  warrior:  { bg:"#080C14", main:"#5080C0", hi:"#A0C8FF", rows:[0x3C,0x7E,0x66,0x7E,0xFF,0x7E,0x66,0x3C] },
  archer:   { bg:"#060C06", main:"#507850", hi:"#90C880", rows:[0x3C,0x7E,0x3C,0x7E,0xBD,0x7E,0x3C,0x18] },
  assassin: { bg:"#04040A", main:"#404070", hi:"#8080C0", rows:[0x18,0x3C,0x7E,0xFF,0x7E,0x3C,0x42,0x24] },
  mage:     { bg:"#0A0614", main:"#7050A0", hi:"#C090FF", rows:[0x18,0x3C,0x7E,0xFE,0x7E,0x7E,0x3C,0x10] },
  goblin:   { bg:"#040804", main:"#406035", hi:"#70A055", rows:[0x00,0x42,0xFF,0x7E,0x3C,0x3C,0x24,0x00] },
  skeleton: { bg:"#0A0A0A", main:"#909090", hi:"#E0E0E0", rows:[0x3C,0x7E,0x66,0x3C,0x18,0x66,0x18,0x42] },
  fire:     { bg:"#140400", main:"#C04010", hi:"#FF8020", rows:[0x18,0x3C,0x7E,0x7E,0xFF,0x7E,0x3C,0x18] },
  ice:      { bg:"#04080C", main:"#4090C0", hi:"#A0E0FF", rows:[0x18,0x3C,0x5A,0xE7,0x5A,0x3C,0x18,0x00] },
  slime:    { bg:"#040C04", main:"#40A040", hi:"#80FF80", rows:[0x00,0x3C,0x7E,0xFF,0xFF,0x7E,0x3C,0x00] },
  dragon:   { bg:"#140800", main:"#C08010", hi:"#FFD040", rows:[0xC3,0xFF,0x7E,0x3C,0x7E,0x7E,0x3C,0x14] },
  plant:    { bg:"#040A04", main:"#307030", hi:"#60C060", rows:[0x54,0xFE,0x7C,0x7E,0x7E,0xFF,0x7F,0xBE] },
  demon:    { bg:"#0A0004", main:"#900030", hi:"#FF2060", rows:[0x42,0xC3,0x7E,0xFF,0x7E,0x7E,0x66,0x24] },
  troll:    { bg:"#0A0A06", main:"#607050", hi:"#90A070", rows:[0x7E,0xFF,0xFF,0xFF,0xFF,0x7E,0xE7,0xC3] },
  beast:    { bg:"#0C0806", main:"#806040", hi:"#C0A060", rows:[0x42,0xE7,0x7E,0xFF,0xFF,0x66,0x66,0x42] },
  orc:      { bg:"#040A04", main:"#408040", hi:"#60C060", rows:[0x3C,0x7E,0xFF,0x7E,0xFF,0x7E,0x66,0x66] },
  king:     { bg:"#0A0800", main:"#B08010", hi:"#FFD040", rows:[0x7E,0xFF,0x7E,0x3C,0xFF,0x7E,0x7E,0x3C] },
  jester:   { bg:"#0A040A", main:"#C040A0", hi:"#FF80D0", rows:[0x54,0x3C,0x7E,0x66,0xFF,0x7E,0x6E,0x24] },
};

// ── Pixel portrait renderer ───────────────────────────────────────────────────
export function PixelPortrait({ name, size, isPlayer }: { name: string; size: number; isPlayer?: boolean }) {
  const cat  = isPlayer ? "warrior" : detectCategory(name);
  const spec = CATS[cat] ?? CATS.warrior;
  const cell = size / 8;

  // For player override color to cyan-green
  const mainColor = isPlayer ? "#50C080" : spec.main;
  const hiColor   = isPlayer ? "#90FFB0" : spec.hi;

  return (
    <svg width={size} height={size} style={{ display:"block", imageRendering:"pixelated" }}>
      <rect width={size} height={size} fill={spec.bg} />
      {spec.rows.map((rowBits, ri) =>
        Array.from({ length: 8 }, (_, ci) => {
          if (!((rowBits >> (7 - ci)) & 1)) return null;
          const isHi = ri <= 2 && ci >= 5; // top-right highlight
          return (
            <rect
              key={`${ri}-${ci}`}
              x={ci * cell} y={ri * cell}
              width={cell}  height={cell}
              fill={isHi ? hiColor : mainColor}
            />
          );
        })
      )}
      {/* Scanline overlay for pixel-art depth */}
      {Array.from({ length: 8 }, (_, ri) => (
        <rect key={`sl-${ri}`} x={0} y={ri*cell + cell*0.85} width={size} height={cell*0.15} fill="#00000040" />
      ))}
    </svg>
  );
}

// ── Deterministic card color from name ───────────────────────────────────────
function nameColor(name: string): string {
  const palette = [
    "#A860D0","#50B878","#D46030","#4090D0",
    "#D04050","#60C0B0","#C0A030","#6060C8",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xFFFFFF;
  return palette[Math.abs(h) % palette.length];
}

// ── Small card art thumbnail ──────────────────────────────────────────────────
export default function CardArt({ name, size = 40 }: { name: string; size?: number }) {
  const col     = nameColor(name);
  const imgSrc  = CARD_SPRITES[name] ?? null;
  return (
    <div style={{
      width:size, height:size, flexShrink:0,
      border:`2px solid ${col}`,
      backgroundColor: imgSrc ? "#888888" : "#0A0A14",
      overflow:"hidden",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {imgSrc
        ? <img src={imgSrc} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover", imageRendering:"pixelated", mixBlendMode:"multiply" }} />
        : <PixelPortrait name={name} size={size} />
      }
    </div>
  );
}

// ── Full card frame ───────────────────────────────────────────────────────────
interface FullCardProps {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  dimmed?: boolean;
  isEnemy?: boolean;
  scale?: number;
}

export function FullCard({ card, selected, onClick, dimmed, isEnemy, scale = 1 }: FullCardProps) {
  const col    = nameColor(card.name);
  const frameW = Math.round(60 * scale);
  const frameH = Math.round(92 * scale);
  const artH   = frameH - Math.round(22 * scale);
  const imgSrc = CARD_SPRITES[card.name] ?? null;

  return (
    <div
      onClick={onClick}
      style={{
        width:frameW, height:frameH, flexShrink:0,
        cursor: onClick ? "pointer" : "default",
        display:"flex", flexDirection:"column",
        border:`2px solid ${selected ? C.yellow : isEnemy ? "#600" : col}`,
        backgroundColor: isEnemy ? "#150505" : "#0C0C18",
        boxShadow: selected ? `0 0 8px ${C.yellow}80` : undefined,
        opacity: dimmed ? 0.55 : 1,
        transition:"border-color 0.15s, box-shadow 0.15s",
        overflow:"hidden",
      }}
    >
      {/* Header: cost | name | power */}
      <div style={{
        display:"flex", alignItems:"center",
        backgroundColor: isEnemy ? "#200000" : "#0A0A22",
        borderBottom:`1px solid ${col}44`,
        padding:`${Math.round(2*scale)}px ${Math.round(3*scale)}px`, gap:Math.round(2*scale),
      }}>
        <div style={{
          backgroundColor:col, width:Math.round(11*scale), height:Math.round(11*scale), flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          border:"1px solid #000",
        }}>
          <span className="pixel-text" style={{ color:"#000", fontSize:Math.round(8*scale), lineHeight:1 }}>{card.cost}</span>
        </div>
        <span className="pixel-text" style={{ color:col, fontSize:Math.round(7*scale), flex:1, overflow:"hidden", whiteSpace:"nowrap", lineHeight:1 }}>
          {card.name}
        </span>
        <div style={{
          backgroundColor: isEnemy ? C.redBright : C.yellow, minWidth:Math.round(11*scale), height:Math.round(11*scale), flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          border:"1px solid #000", padding:"0 1px",
        }}>
          <span className="pixel-text" style={{ color:"#000", fontSize:Math.round(8*scale), lineHeight:1 }}>{card.power}</span>
        </div>
      </div>

      {/* Art area */}
      <div style={{ flex:1, overflow:"hidden", position:"relative", backgroundColor: imgSrc ? "#888888" : "#060612" }}>
        {imgSrc
          ? <img src={imgSrc} alt={card.name} style={{ width:"100%", height:"100%", objectFit:"cover", imageRendering:"pixelated", mixBlendMode:"multiply" }} />
          : <PixelPortrait name={card.name} size={Math.max(frameW - 4, artH)} />
        }
        <div style={{
          position:"absolute", inset:0,
          background:`linear-gradient(to bottom, transparent 50%, ${isEnemy ? "#150505" : "#0C0C18"} 100%)`,
        }} />
        <div style={{
          position:"absolute", bottom: card.text ? Math.round(14*scale) : 0, left:0, right:0,
          backgroundColor: col + "18",
          padding:`1px ${Math.round(3*scale)}px`,
        }}>
          <span className="pixel-text" style={{ color: col + "99", fontSize:Math.round(7*scale) }}>
            {isEnemy ? "ENEMY" : "SPIRIT"}
          </span>
        </div>
        {card.text && (
          <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:`1px ${Math.round(3*scale)}px`, backgroundColor:"#08080Ecc" }}>
            <span className="pixel-text" style={{ color:C.textDim, fontSize:Math.round(7*scale), lineHeight:1.2 }}>
              {card.text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
