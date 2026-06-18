import React from "react";
import { C } from "./PixelUI";
import type { Card } from "@/game/data";
import { CARD_SPRITES, PART_SPRITES } from "@/assets/sprites";

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

  const mainColor = isPlayer ? "#50C080" : spec.main;
  const hiColor   = isPlayer ? "#90FFB0" : spec.hi;

  return (
    <svg width={size} height={size} style={{ display:"block", imageRendering:"pixelated" }}>
      <rect width={size} height={size} fill={spec.bg} />
      {spec.rows.map((rowBits, ri) =>
        Array.from({ length: 8 }, (_, ci) => {
          if (!((rowBits >> (7 - ci)) & 1)) return null;
          const isHi = ri <= 2 && ci >= 5;
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
      {Array.from({ length: 8 }, (_, ri) => (
        <rect key={`sl-${ri}`} x={0} y={ri*cell + cell*0.85} width={size} height={cell*0.15} fill="#00000040" />
      ))}
    </svg>
  );
}

// ── Part pixel art ────────────────────────────────────────────────────────────
// For parts with generated PNG images, render the image directly.
// For the remaining 11 items, use high-quality 16×16 SVG pixel art.

interface PartDef16 {
  bg: string;
  pal: readonly string[]; // up to 5 colors for chars '1'–'5'
  rows: readonly string[]; // exactly 16 strings of 16 chars each
}

// char '_' = transparent, '1'=pal[0] (darkest) … '5'=pal[4] (brightest/accent)
const PART_DEFS_16: Record<string, PartDef16> = {
  "Knight Sigil": {
    bg: "#070810",
    pal: ["#1A1C28","#404860","#7A8EA8","#B8CCE0","#C83030"],
    rows: [
      "________________",
      "_____11111______",
      "____1333331_____",
      "___133333321____",
      "___133535221____",
      "___133535221____",
      "___135555521____",
      "___133535221____",
      "___133535221____",
      "___133333221____",
      "____1333321_____",
      "____1333221_____",
      "_____13321______",
      "______131_______",
      "_______1________",
      "________________",
    ],
  },
  "Gaunt Core": {
    bg: "#060318",
    pal: ["#150A28","#2E1450","#5E28A0","#9640D0","#D862FF"],
    rows: [
      "________________",
      "______151_______",
      "_____15551______",
      "____155451______",
      "____154441______",
      "___1554441______",
      "___1544441______",
      "___1544441______",
      "___1544441______",
      "___1544421______",
      "___1533321______",
      "___1333321______",
      "___1222221______",
      "____12221_______",
      "_____1111_______",
      "________________",
    ],
  },
  "Cinder Rune": {
    bg: "#0C0402",
    pal: ["#2A1808","#4A3018","#8A7038","#B89850","#FF5020"],
    rows: [
      "___111111111____",
      "__12222222221___",
      "__12333333321___",
      "__12345554321___",
      "__12355555321___",
      "__12345554321___",
      "__12354554321___",
      "__12355555321___",
      "__12354554321___",
      "__12345554321___",
      "__12355555321___",
      "__12345554321___",
      "__12333333321___",
      "__12222222221___",
      "___111111111____",
      "________________",
    ],
  },
  "Ashen Hide": {
    bg: "#0C0C0C",
    pal: ["#181818","#303030","#606060","#989898","#C8C8C8"],
    rows: [
      "_11__11__11_____",
      "_12121_12121____",
      "_123232323221___",
      "_123333333221___",
      "_123434343221___",
      "_123344443221___",
      "_123444443221___",
      "_123444443221___",
      "_123344443221___",
      "_123434343221___",
      "_123333333221___",
      "_123232323221___",
      "_12222222221____",
      "__122222222221__",
      "___1222222221___",
      "____111111111___",
    ],
  },
  "Magma Core": {
    bg: "#140200",
    pal: ["#300600","#700E00","#C02010","#E05000","#FF9000"],
    rows: [
      "________________",
      "_____11111______",
      "____1222221_____",
      "___123333221____",
      "___123444321____",
      "___124554321____",
      "__12455543221___",
      "__12455543221___",
      "__12445443221___",
      "__12344443221___",
      "___1244432221___",
      "___1234332221___",
      "____123332221___",
      "____12332221____",
      "_____12221______",
      "______111_______",
    ],
  },
  "Demon Heart": {
    bg: "#080005",
    pal: ["#1A0010","#440018","#880028","#CC2040","#FF5060"],
    rows: [
      "________________",
      "___11___11______",
      "__12211_12221___",
      "_1222211122221__",
      "_1222221222221__",
      "_12222222222221_",
      "__1222244222221_",
      "___12222442221__",
      "___12222442221__",
      "___12222222221__",
      "____122222221___",
      "____12222222221_",
      "_____122222221__",
      "______122221____",
      "_______1221_____",
      "________11______",
    ],
  },
  "Slime Gland": {
    bg: "#020A02",
    pal: ["#041404","#103018","#20682A","#40B844","#80FF88"],
    rows: [
      "________________",
      "_____11111______",
      "____1233321_____",
      "____1244421_____",
      "____1244421_____",
      "____1245421_____",
      "____1244421_____",
      "____1244421_____",
      "____1244421_____",
      "____1244421_____",
      "____1244421_____",
      "____1244421_____",
      "____1234421_____",
      "____1234321_____",
      "_____12221______",
      "______111_______",
    ],
  },
  "Venom Fang": {
    bg: "#040800",
    pal: ["#0C1C00","#283C00","#608C10","#A8C830","#E0FF00"],
    rows: [
      "______________1_",
      "_____________121",
      "____________1221",
      "___________12321",
      "__________123421",
      "_________1234321",
      "_________1243221",
      "________12432221",
      "________12443221",
      "_______124433221",
      "_______124433221",
      "_______124433221",
      "_______124433221",
      "_______124332221",
      "_______123322221",
      "________1222221_",
    ],
  },
  "Troll Hide": {
    bg: "#060A04",
    pal: ["#0C1A08","#1E3818","#3A6030","#609048","#88C068"],
    rows: [
      "__11__11__11____",
      "_1212112121211__",
      "_123232323221___",
      "_123434444221___",
      "_123444444221___",
      "_123444444221___",
      "_123444444221___",
      "_123444443221___",
      "_123334433221___",
      "_123333333221___",
      "_12333333322221_",
      "_12222333222221_",
      "_12222222222221_",
      "__122222222221__",
      "___1222222221___",
      "____111111111___",
    ],
  },
  "Black Scale": {
    bg: "#050208",
    pal: ["#0D0618","#1C1030","#401858","#702888","#B040E0"],
    rows: [
      "________________",
      "_______1________",
      "______141_______",
      "_____14441______",
      "____1444441_____",
      "___144455441____",
      "___14455544221__",
      "___14455443221__",
      "___1444443221___",
      "___1444433221___",
      "___1443332221___",
      "___1443222221___",
      "___144322221____",
      "___143222221____",
      "___132222221____",
      "____1111111_____",
    ],
  },
  "Boss Trophy": {
    bg: "#0A0800",
    pal: ["#1E1200","#4A3000","#A07010","#E0A820","#FFE060"],
    rows: [
      "____1111111_____",
      "___122222221____",
      "___123444321____",
      "___124455421____",
      "___124444421____",
      "___123333321____",
      "___123113321____",
      "___123113321____",
      "___123333321____",
      "___123434321____",
      "___123434321____",
      "___123333321____",
      "____1222221_____",
      "____1224221_____",
      "____1222221_____",
      "_____11111______",
    ],
  },
};

function getPartDef16(name: string): PartDef16 | null {
  if (PART_DEFS_16[name]) return PART_DEFS_16[name];
  const n = name.toLowerCase();
  if (/scale|hide|pelt|fur/.test(n))  return PART_DEFS_16["Troll Hide"];
  if (/core|gland/.test(n))           return PART_DEFS_16["Slime Gland"];
  if (/fang|tusk|shard/.test(n))      return PART_DEFS_16["Venom Fang"];
  if (/bone|fragment/.test(n))        return null;
  if (/crown|sigil|trophy/.test(n))   return PART_DEFS_16["Boss Trophy"];
  if (/heart/.test(n))                return PART_DEFS_16["Demon Heart"];
  if (/rune/.test(n))                 return PART_DEFS_16["Cinder Rune"];
  return PART_DEFS_16["Slime Gland"];
}

export function PartPixelArt({ name, size = 32 }: { name: string; size?: number }) {
  const imgSrc = PART_SPRITES[name] ?? null;
  if (imgSrc) {
    return (
      <div style={{ width: size, height: size, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={imgSrc}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }}
        />
      </div>
    );
  }

  const def = getPartDef16(name);
  if (!def) {
    return (
      <div style={{ width: size, height: size, backgroundColor: "#0A0A14", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#606080", fontSize: size * 0.4, fontFamily: "monospace" }}>?</span>
      </div>
    );
  }

  const cell = size / 16;
  return (
    <svg width={size} height={size} style={{ display: "block", imageRendering: "pixelated" }}>
      <rect width={size} height={size} fill={def.bg} />
      {def.rows.flatMap((row, ri) =>
        Array.from({ length: 16 }, (_, ci) => {
          const ch = row[ci] ?? "_";
          if (ch === "_") return null;
          const idx = parseInt(ch, 10) - 1;
          const color = def.pal[idx];
          if (!color) return null;
          return (
            <rect
              key={`${ri}-${ci}`}
              x={ci * cell} y={ri * cell}
              width={cell} height={cell}
              fill={color}
            />
          );
        })
      )}
    </svg>
  );
}

// ── Star tier backgrounds ─────────────────────────────────────────────────────
const STAR_STYLES: readonly { bg: string; border: string }[] = [
  { bg: "#0C0C18", border: "" },        // 0★  default — use nameColor
  { bg: "#081A08", border: "#30A830" }, // 1★  green
  { bg: "#080820", border: "#3060C8" }, // 2★  blue
  { bg: "#100818", border: "#8030C0" }, // 3★  purple
  { bg: "#180E04", border: "#C06010" }, // 4★  orange
  { bg: "#181400", border: "#C09800" }, // 5★  gold
];

function starCount(name: string): number {
  return (name.match(/★/g) || []).length;
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

// Strip trailing stars for sprite lookup so "Slimeling ★" uses same art as "Slimeling"
function baseCardName(name: string): string {
  return name.replace(/\s*★+\s*$/, "").trim();
}

// ── Small card art thumbnail ──────────────────────────────────────────────────
export default function CardArt({ name, size = 40 }: { name: string; size?: number }) {
  const col    = nameColor(name);
  const stars  = starCount(name);
  const sc     = STAR_STYLES[Math.min(stars, 5)];
  const imgSrc = CARD_SPRITES[name] ?? CARD_SPRITES[baseCardName(name)] ?? null;
  return (
    <div style={{
      width:size, height:size, flexShrink:0,
      border:`2px solid ${stars > 0 ? sc.border : col}`,
      backgroundColor: sc.bg,
      overflow:"hidden",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {imgSrc
        ? <img src={imgSrc} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover", imageRendering:"pixelated" }} />
        : <PixelPortrait name={baseCardName(name)} size={size} />
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
  ghosted?: boolean;
}

export function FullCard({ card, selected, onClick, dimmed, isEnemy, scale = 1, ghosted }: FullCardProps) {
  const col    = nameColor(card.name);
  const stars  = starCount(card.name);
  const sc     = STAR_STYLES[Math.min(stars, 5)];
  const starBorder = stars > 0 ? sc.border : col;
  const cardBg = isEnemy ? "#150505" : sc.bg;
  const frameW = Math.round(60 * scale);
  const frameH = Math.round(92 * scale);
  const artH   = frameH - Math.round(22 * scale);
  const imgSrc = CARD_SPRITES[card.name] ?? CARD_SPRITES[baseCardName(card.name)] ?? null;

  return (
    <div
      onClick={onClick}
      style={{
        width:frameW, height:frameH, flexShrink:0,
        cursor: onClick ? "pointer" : "default",
        display:"flex", flexDirection:"column",
        border:`2px solid ${selected ? C.yellow : isEnemy ? "#600" : starBorder}`,
        backgroundColor: cardBg,
        boxShadow: selected ? `0 0 8px ${C.yellow}80` : (stars > 0 && !isEnemy ? `0 0 6px ${sc.border}40` : undefined),
        opacity: ghosted ? 0.38 : dimmed ? 0.55 : 1,
        transition:"border-color 0.15s, box-shadow 0.15s, opacity 0.15s",
        overflow:"hidden",
        filter: ghosted ? "saturate(0.5)" : undefined,
      }}
    >
      {/* Header: cost | name | power */}
      <div style={{
        display:"flex", alignItems:"center",
        backgroundColor: isEnemy ? "#200000" : (stars > 0 ? sc.bg : "#0A0A22"),
        borderBottom:`1px solid ${(isEnemy ? col : starBorder)}44`,
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
      <div style={{ flex:1, overflow:"hidden", position:"relative", backgroundColor: "#060612" }}>
        {imgSrc
          ? <img src={imgSrc} alt={card.name} style={{ width:"100%", height:"100%", objectFit:"cover", imageRendering:"pixelated" }} />
          : <PixelPortrait name={baseCardName(card.name)} size={Math.max(frameW - 4, artH)} />
        }
        <div style={{
          position:"absolute", inset:0,
          background:`linear-gradient(to bottom, transparent 50%, ${cardBg} 100%)`,
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
        {ghosted && (
          <div style={{
            position:"absolute", inset:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            backgroundColor:"rgba(0,0,0,0.25)",
          }}>
            <span className="pixel-text" style={{ color:"#CC88FF", fontSize:Math.round(8*scale), textAlign:"center", lineHeight:1.3 }}>
              CLICK{"\n"}CONFIRM
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
