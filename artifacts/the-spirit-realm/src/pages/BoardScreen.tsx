import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BOARD, TILE_COLORS, TILE_GLYPH, BIOME_COLORS, BIOME_BG,
  getBiome, getStarDisplay, getTileName, shopPrice,
  type Item, type Weapon, type Armor, type EnemyPart,
} from "@/game/data";
import { useGame, effectiveMaxHp } from "@/game/state";
import { C, PixelButton, StatChip } from "@/components/PixelUI";
import JWCModal from "@/components/JWCModal";

const ROWS = 9;
const COLS = 9;
const TILE_SIZE = Math.min(48, Math.floor(window.innerWidth / ROWS));
const OUTER_BOARD_SIZE = TILE_SIZE * ROWS;

// 9x9 board — 32 perimeter tiles clockwise
function tileCoord(idx: number): { row: number; col: number } {
  if (idx <= 8)  return { row: 0,        col: idx      };
  if (idx <= 16) return { row: idx - 8,  col: 8        };
  if (idx <= 24) return { row: 8,        col: 24 - idx };
  return              { row: 32 - idx, col: 0        };
}

function tilePos(idx: number) {
  const g = tileCoord(idx);
  return { left: g.col * TILE_SIZE, top: g.row * TILE_SIZE };
}

function itemDesc(item: Weapon | Armor): string {
  if (item.kind === "weapon") {
    const w   = item as Weapon;
    const eff = w.effect ? ` · ${w.effect === "ice" ? "[ICE]" : "[STUN]"}` : "";
    return `[${w.weaponKind}] ${w.damage}dmg Lv${w.level}${eff}`;
  }
  const a = item as Armor;
  return `[${a.slot}] bl:${a.bluntDef} pi:${a.pierceDef} sl:${a.slashDef} +${a.bonusHP}HP Lv${a.level}`;
}

// ── Dice animation ────────────────────────────────────────────────────────────
function DiceDisplay({ value, rolling }: { value: number | null; rolling: boolean }) {
  const [display, setDisplay] = useState<number | null>(value);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rolling) {
      let t = 0;
      intervalRef.current = setInterval(() => {
        const r1 = 1 + Math.floor(Math.random() * 6);
        const r2 = 1 + Math.floor(Math.random() * 6);
        setDisplay(r1 + r2);
        t++;
        if (t > 8) {
          clearInterval(intervalRef.current!);
          setDisplay(value);
        }
      }, 80);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplay(value);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [rolling, value]);

  if (value === null && !rolling) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span className="pixel-text" style={{ color: C.yellow, fontSize: 28, lineHeight: 1 }}>
        {display ?? "?"}
      </span>
      <span className="pixel-text" style={{ color: C.textDim, fontSize: 10 }}>
        {rolling ? "rolling..." : "rolled"}
      </span>
    </div>
  );
}

// ── Shop modal overlay ────────────────────────────────────────────────────────
function ShopOverlay({ items, onClose, inline }: { items: Item[]; onClose: () => void; inline?: boolean }) {
  const { buyShopItem, player } = useGame();
  const [msg, setMsg] = useState("");
  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 1600); }

  const gearItems = items.filter(i => i.kind !== "part") as (Weapon | Armor)[];

  const outerStyle: React.CSSProperties = inline
    ? { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }
    : { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", zIndex: 90 };
  const innerStyle: React.CSSProperties = inline
    ? { flex: 1, width: "100%", backgroundColor: "#080C10", display: "flex", flexDirection: "column", overflow: "hidden" }
    : { margin: "auto", maxWidth: 380, width: "100%", backgroundColor: "#080C10", border: `2px solid ${C.yellow}`, display: "flex", flexDirection: "column", maxHeight: "88vh", overflow: "hidden" };

  return (
    <div style={outerStyle}>
      <div style={innerStyle}>
        <div style={{
          padding: "8px 12px", backgroundColor: "#120C00",
          borderBottom: `2px solid ${C.yellow}44`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span className="pixel-text" style={{ color: C.yellow, fontSize: 16 }}>◈ SHOP</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="pixel-text" style={{ color: C.yellow, fontSize: 13 }}>${player.money}</span>
            <button onClick={onClose} style={{
              background: "none", border: `1px solid ${C.yellow}55`, color: C.yellow,
              cursor: "pointer", fontFamily: "inherit", fontSize: 16, padding: "0 8px", lineHeight: 1.4,
            }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {gearItems.map(item => {
            const price = shopPrice(item);
            const canBuy = player.money >= price;
            const w = item as Weapon | Armor;
            return (
              <div key={w.id} style={{
                backgroundColor: C.bg3, border: `1px solid ${C.textDim}44`,
                padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <span className="pixel-text" style={{ color: item.kind === "weapon" ? C.yellow : C.cyan, fontSize: inline ? 16 : 14, display: "block" }}>
                    {w.name}
                  </span>
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: inline ? 13 : 11 }}>
                    {itemDesc(w)}
                  </span>
                </div>
                <PixelButton small
                  color={canBuy ? C.yellow : C.bg3}
                  textColor={canBuy ? "#000" : C.textDim}
                  onClick={() => { const r = buyShopItem(item); flash(r.msg); }}
                >
                  ${price}
                </PixelButton>
              </div>
            );
          })}
        </div>
        {msg && (
          <div style={{ padding: "4px 12px", backgroundColor: "#001A00", borderTop: "1px solid #0A3A0A" }}>
            <span className="pixel-text" style={{ color: C.green, fontSize: 12 }}>{msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Forge modal overlay ───────────────────────────────────────────────────────
function ForgeOverlay({ onClose, inline }: { onClose: () => void; inline?: boolean }) {
  const { player, forgeItem, mergePartIntoWeapon } = useGame();
  const [msg, setMsg]         = useState("");
  const [partSel, setPartSel] = useState<string | null>(null);
  const [gearSel, setGearSel] = useState<string | null>(null);
  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 2000); }

  function doForge(which: "weapon" | "armor") {
    const ok = forgeItem(which);
    flash(ok ? `Forged a new ${which}!` : player.metals < 3 ? "Need 3 metals." : "Gear bag full.");
  }

  function doMerge() {
    if (!partSel || !gearSel) return;
    const partGroup = (player.inventory.filter(i => i.kind === "part") as EnemyPart[]).filter(p => p.name === partSel);
    if (!partGroup.length) { setPartSel(null); return; }
    const partId = partGroup[0].id;
    const targetGear = allGear.find(g => g.id === gearSel);
    const r = mergePartIntoWeapon(partId, gearSel);
    flash(r.msg);
    if (r.ok) {
      const afterMerges = (targetGear?.mergeCount ?? 0) + 1;
      const remainingSameName = partGroup.length - 1;
      if (remainingSameName <= 0) {
        setPartSel(null);
        setGearSel(null);
      } else if (afterMerges >= 20) {
        setGearSel(null);
      }
    }
  }

  const parts   = player.inventory.filter(i => i.kind === "part");
  const allGear = [
    player.equipped.weapon, player.equipped.helmet,
    player.equipped.chest,  player.equipped.cloak,
    ...player.inventory.filter(i => i.kind !== "part"),
  ].filter(Boolean) as (Weapon | Armor)[];

  const outerStyle: React.CSSProperties = inline
    ? { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }
    : { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", zIndex: 90 };
  const innerStyle: React.CSSProperties = inline
    ? { flex: 1, width: "100%", backgroundColor: "#060E18", display: "flex", flexDirection: "column", overflow: "hidden" }
    : { margin: "auto", maxWidth: 380, width: "100%", backgroundColor: "#060E18", border: `2px solid ${C.accent}`, display: "flex", flexDirection: "column", maxHeight: "88vh", overflow: "hidden" };

  return (
    <div style={outerStyle}>
      <div style={innerStyle}>
        <div style={{
          padding: "8px 12px", backgroundColor: "#040A14",
          borderBottom: `2px solid ${C.accent}44`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span className="pixel-text" style={{ color: C.accent, fontSize: 16 }}>FORGE</span>
          <button onClick={onClose} style={{
            background: "none", border: `1px solid ${C.accent}55`, color: C.accent,
            cursor: "pointer", fontFamily: "inherit", fontSize: 16, padding: "0 8px", lineHeight: 1.4,
          }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <span className="pixel-text" style={{ color: C.textDim, fontSize: 12, display: "block", marginBottom: 4 }}>
              Forge gear from 3 metals:
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <PixelButton small color={player.metals >= 3 ? C.accent : C.bg3} textColor="#000"
                disabled={player.metals < 3} onClick={() => doForge("weapon")} style={{ flex: 1 }}>
                WEAPON · 3M
              </PixelButton>
              <PixelButton small color={player.metals >= 3 ? C.accent : C.bg3} textColor="#000"
                disabled={player.metals < 3} onClick={() => doForge("armor")} style={{ flex: 1 }}>
                ARMOR · 3M
              </PixelButton>
            </div>
          </div>

          {parts.length > 0 ? (
            <div>
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 12, display: "block", marginBottom: 4 }}>
                Merge part into gear:
              </span>
              <span className="pixel-text" style={{ color: C.yellow, fontSize: 11, display: "block", marginBottom: 3 }}>
                1. Select a part:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(() => {
                  const groups = new Map<string, EnemyPart[]>();
                  for (const p of parts) {
                    const list = groups.get(p.name) ?? [];
                    list.push(p);
                    groups.set(p.name, list);
                  }
                  return Array.from(groups.entries()).map(([name, group]) => {
                    const isSel = partSel === name;
                    return (
                      <PixelButton key={name} small
                        color={isSel ? C.yellow : C.bg3}
                        textColor={isSel ? "#000" : C.textDim}
                        onClick={() => setPartSel(isSel ? null : name)}>
                        {name}{group.length > 1 ? ` ×${group.length}` : ""}
                      </PixelButton>
                    );
                  });
                })()}
              </div>
              {partSel && (
                <>
                  <span className="pixel-text" style={{ color: C.yellow, fontSize: 11, display: "block", marginTop: 6, marginBottom: 3 }}>
                    2. Select target gear:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {allGear.map(g => {
                      const mc    = (g as Weapon | Armor).mergeCount ?? 0;
                      const atMax = mc >= 20;
                      return (
                        <PixelButton key={g.id} small
                          color={atMax ? C.bg3 : gearSel === g.id ? C.cyan : C.bg3}
                          textColor={atMax ? "#4A4A4A" : gearSel === g.id ? "#000" : C.textDim}
                          onClick={() => { if (!atMax) setGearSel(g.id); }}>
                          {g.name} ({mc}/20)
                        </PixelButton>
                      );
                    })}
                  </div>
                  {gearSel && (() => {
                    const part = (parts as EnemyPart[]).find(p => p.name === partSel);
                    const gear = allGear.find(g => g.id === gearSel);
                    if (!part || !gear) return null;
                    const isWeapon = gear.kind === "weapon";
                    const wp = gear as Weapon;
                    const ar = gear as Armor;
                    const newDmg    = isWeapon ? wp.damage + part.buff.damageBonus : 0;
                    const newHp     = !isWeapon ? ar.bonusHP + part.buff.damageBonus : 0;
                    const newEffect = isWeapon ? (part.buff.addEffect ?? wp.effect) : null;
                    return (
                      <div style={{ marginTop: 8, backgroundColor: "#001A08", border: `2px solid ${C.green}55`, padding: "8px 10px" }}>
                        <span className="pixel-text" style={{ color: C.green, fontSize: 11, display: "block", marginBottom: 4 }}>
                          MERGE PREVIEW
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span className="pixel-text" style={{ color: C.yellow, fontSize: 11 }}>
                            {part.name} — {part.buff.label}
                          </span>
                          <span className="pixel-text" style={{ color: C.textDim, fontSize: 11 }}>
                            {gear.name} (Lv {gear.level} → {gear.level + 1}) · Merges: {(gear as Weapon | Armor).mergeCount ?? 0}/20
                          </span>
                          {isWeapon ? (
                            <span className="pixel-text" style={{ color: C.text, fontSize: 12 }}>
                              Dmg {wp.damage} → <span style={{ color: C.green }}>{newDmg}</span>
                              {newEffect && (
                                <span style={{ color: newEffect === "ice" ? "#60C8FF" : "#D0C040", marginLeft: 6 }}>
                                  {newEffect === "ice" ? "[ICE]" : "[STUN]"}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="pixel-text" style={{ color: C.text, fontSize: 12 }}>
                              Bonus HP +{ar.bonusHP} → <span style={{ color: C.green }}>+{newHp}</span>
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          {(() => {
                            const mc = (gear as Weapon | Armor).mergeCount ?? 0;
                            return (
                              <PixelButton
                                color={mc >= 20 ? C.bg3 : C.green}
                                textColor="#000"
                                onClick={doMerge}
                                disabled={mc >= 20}>
                                {mc >= 20 ? "MAX MERGES REACHED" : "MERGE!"}
                              </PixelButton>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          ) : (
            <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>
              No parts in inventory. Parts drop from enemies.
            </span>
          )}

          {msg && (
            <div style={{ padding: "4px 8px", backgroundColor: "#001A00", border: "1px solid #0A3A0A" }}>
              <span className="pixel-text" style={{ color: C.green, fontSize: 12 }}>{msg}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Combat prompt ─────────────────────────────────────────────────────────────
function CombatPrompt({ isElite, onFight }: { isElite: boolean; onFight: () => void }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      backgroundColor: isElite ? "#1A0505" : "#0A0808",
      border: `2px solid ${isElite ? "#9B2020" : "#600"}`,
      borderBottom: "none", padding: "10px 12px",
      display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 80,
    }}>
      <span className="pixel-text" style={{ color: isElite ? "#D06060" : C.redBright, fontSize: 13 }}>
        {isElite ? "★ ELITE enemy blocks your path!" : "Enemy spotted!"}
      </span>
      <PixelButton color={C.redBright} textColor="#000" onClick={onFight}>FIGHT</PixelButton>
    </div>
  );
}

// ── Main Board Screen ─────────────────────────────────────────────────────────
export default function BoardScreen() {
  const {
    player, jwc, hasPendingCombat, pendingTileAction,
    rollDice, triggerPendingCombat, closeTileAction, collectProperties,
  } = useGame();

  const biome      = getBiome(player.bossKills);
  const biomeColor = BIOME_COLORS[biome];
  const biomeBg    = BIOME_BG[biome];
  const eMax       = effectiveMaxHp(player);
  const stars      = getStarDisplay(player.bossKills);

  const [rolling, setRolling] = useState(false);
  const [diceVal, setDiceVal] = useState<number | null>(null);
  const [animPos, setAnimPos] = useState<{ row: number; col: number } | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 700);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setAnimPos(tileCoord(player.position)); }, []);
  useEffect(() => () => { if (animRef.current) clearTimeout(animRef.current); }, []);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function animateTo(startIdx: number, endIdx: number) {
    if (animRef.current) clearTimeout(animRef.current);
    const total = 32;
    let cur = startIdx;
    function step() {
      cur = (cur + 1) % total;
      setAnimPos(tileCoord(cur));
      if (cur !== endIdx) {
        animRef.current = setTimeout(step, 85);
      }
    }
    step();
  }

  function handleRoll() {
    if (rolling || hasPendingCombat || jwc || pendingTileAction) return;
    const prevPos = player.position;
    setRolling(true);
    const { roll, tile } = rollDice();
    setDiceVal(roll);
    animateTo(prevPos, tile);
    setTimeout(() => setRolling(false), 600);
  }

  // Total pending property income
  const totalPropertyIncome = Object.values(player.propertyIncome).reduce((a, b) => a + b, 0);

  const curPos  = animPos ?? tileCoord(player.position);
  const curTile = BOARD[player.position];
  const tileColor = TILE_COLORS[curTile.kind];
  const isOwnedProperty = curTile.kind === "property" && player.propertyLanded[player.position];

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      backgroundColor: biomeBg, overflow: "hidden", position: "relative",
    }}>
      {/* Header */}
      <div style={{
        padding: "5px 10px", flexShrink: 0,
        backgroundColor: "#06101C", borderBottom: "3px solid #000",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <span className="pixel-text" style={{ color: biomeColor, fontSize: isDesktop ? 18 : 14 }}>
            {TILE_GLYPH[curTile.kind]} {getTileName(curTile.kind, biome, isOwnedProperty)}
          </span>
          <span className="pixel-text" style={{ color: C.textDim, fontSize: isDesktop ? 13 : 10, marginLeft: 6 }}>
            Lap {player.lap} · {biome.toUpperCase()}{stars ? ` ${stars}` : ""}
          </span>
        </div>
        {isDesktop && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <StatChip label="♥" value={`${player.hp}/${eMax}`} color={C.green} />
            <StatChip label="$" value={player.money} color={C.yellow} />
            <StatChip label="M" value={player.metals} color={C.textDim} />
          </div>
        )}
      </div>

      {/* Main two-column area */}
      <div style={{ flex: 1, display: "flex", flexDirection: isDesktop ? "row" : "column", overflow: "hidden", position: "relative" }}>

      {/* Board scroll area */}
      <div style={isDesktop ? {
        flexShrink: 0,
        width: OUTER_BOARD_SIZE + 24,
        overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center",
        gap: 8, padding: "8px 12px 16px",
      } : {
        flex: 1, minHeight: 0,
        width: "100%",
        overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center",
        gap: 8, padding: "8px 0 90px",
      }}>

        {/* Stats above board — mobile only */}
        {!isDesktop && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "2px 8px", backgroundColor: "#06101C", border: "1px solid #1A2A3A", borderRadius: 2, flexShrink: 0 }}>
            <span className="pixel-text" style={{ color: C.green, fontSize: 15 }}>♥ {player.hp}/{eMax}</span>
            <span className="pixel-text" style={{ color: C.yellow, fontSize: 15 }}>$ {player.money}</span>
            <span className="pixel-text" style={{ color: C.textDim, fontSize: 15 }}>M {player.metals}</span>
          </div>
        )}

        {/* Board */}
        <div style={{
          position: "relative", width: OUTER_BOARD_SIZE, height: OUTER_BOARD_SIZE,
          flexShrink: 0, marginTop: 4,
        }}>
          {/* Interior biome background */}
          <div style={{
            position: "absolute",
            left: TILE_SIZE, top: TILE_SIZE, right: TILE_SIZE, bottom: TILE_SIZE,
            backgroundColor: biomeColor + "12", border: `1px solid ${biomeColor}22`,
          }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
              <span className="pixel-text" style={{ color: biomeColor + "30", fontSize: 32, userSelect: "none" }}>
                {biome.toUpperCase()}
              </span>
              {stars && (
                <span className="pixel-text" style={{ color: biomeColor + "40", fontSize: 18, userSelect: "none" }}>
                  {stars}
                </span>
              )}
            </div>
          </div>

          {/* Tiles */}
          {BOARD.map(({ index, kind }) => {
            const pos      = tilePos(index);
            const color    = TILE_COLORS[kind];
            const glyph    = TILE_GLYPH[kind];
            const isBoss   = kind === "boss";
            const isElite  = kind === "elite";
            const isTele   = kind === "teleport";
            const isForge  = kind === "forge";
            const isShop   = kind === "shop";
            const isProp   = kind === "property";
            const propOwned = isProp && player.propertyLanded[index];
            const bgTile   = isBoss   ? "#200404"
                           : isElite  ? "#160202"
                           : isTele   ? "#0C0020"
                           : isForge  ? "#040C18"
                           : isShop   ? "#100C00"
                           : kind === "bank"  ? "#141000"
                           : kind === "start" ? "#041004"
                           : isProp && propOwned ? "#141008"
                           : biomeBg;
            return (
              <div key={index} style={{
                position: "absolute", left: pos.left, top: pos.top,
                width: TILE_SIZE, height: TILE_SIZE,
                backgroundColor: bgTile,
                border: `2px solid ${isBoss || isElite ? "#500" : isProp && propOwned ? C.yellow + "55" : color + "55"}`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                overflow: "hidden", boxSizing: "border-box",
              }}>
                <span style={{ fontSize: 14, lineHeight: 1, color }}>{glyph}</span>
                <span className="pixel-text" style={{
                  color: isProp && propOwned ? C.yellow + "BB" : color + "BB",
                  fontSize: 8, textAlign: "center", lineHeight: 1.1,
                  maxWidth: TILE_SIZE - 4, wordBreak: "break-word",
                }}>
                  {isProp ? (propOwned ? "OWNED" : "ABND") : TILE_GLYPH[kind] === glyph ? kind.slice(0,4).toUpperCase() : ""}
                </span>
                {/* Property income badge */}
                {isProp && (player.propertyIncome[index] ?? 0) > 0 && (
                  <div style={{ position: "absolute", top: 1, right: 1, backgroundColor: "#00000088" }}>
                    <span className="pixel-text" style={{ color: C.yellow, fontSize: 7 }}>
                      ${player.propertyIncome[index]}
                    </span>
                  </div>
                )}
                {/* Owned indicator dot */}
                {isProp && propOwned && (
                  <div style={{ position: "absolute", bottom: 1, left: 1 }}>
                    <span style={{ fontSize: 6, color: C.yellow }}>✦</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Player token — 3 pixel art variants based on rebirth */}
          <div style={{
            position: "absolute",
            left:  curPos.col * TILE_SIZE + TILE_SIZE / 2 - 8,
            top:   curPos.row * TILE_SIZE + TILE_SIZE / 2 - 10,
            zIndex: 10, pointerEvents: "none",
          }}>
            {player.rebirthCount === 0 && (
              <svg width="16" height="20" viewBox="0 0 8 10" style={{ imageRendering: "pixelated", display: "block" }}>
                <rect x="2" y="0" width="4" height="3" fill="#4DBBCC" />
                <rect x="1" y="1" width="6" height="2" fill="#4DBBCC" />
                <rect x="2" y="3" width="4" height="4" fill="#3A8899" />
                <rect x="1" y="3" width="2" height="3" fill="#4DBBCC" />
                <rect x="5" y="3" width="2" height="3" fill="#4DBBCC" />
                <rect x="2" y="7" width="2" height="3" fill="#2A6677" />
                <rect x="4" y="7" width="2" height="3" fill="#2A6677" />
                <rect x="3" y="1" width="1" height="1" fill="#1A3344" />
                <rect x="4" y="1" width="1" height="1" fill="#1A3344" />
                <rect x="2" y="9" width="2" height="1" fill="#1A4455" />
                <rect x="4" y="9" width="2" height="1" fill="#1A4455" />
              </svg>
            )}
            {player.rebirthCount === 1 && (
              <svg width="16" height="20" viewBox="0 0 8 10" style={{ imageRendering: "pixelated", display: "block" }}>
                <rect x="2" y="0" width="4" height="3" fill="#B060FF" />
                <rect x="1" y="1" width="6" height="2" fill="#C080FF" />
                <rect x="2" y="3" width="4" height="4" fill="#7040BB" />
                <rect x="1" y="3" width="2" height="3" fill="#9050DD" />
                <rect x="5" y="3" width="2" height="3" fill="#9050DD" />
                <rect x="2" y="7" width="2" height="3" fill="#502090" />
                <rect x="4" y="7" width="2" height="3" fill="#502090" />
                <rect x="3" y="1" width="1" height="1" fill="#FF80FF" />
                <rect x="4" y="1" width="1" height="1" fill="#FF80FF" />
                <rect x="1" y="0" width="1" height="1" fill="#E0A0FF" />
                <rect x="6" y="0" width="1" height="1" fill="#E0A0FF" />
                <rect x="2" y="9" width="2" height="1" fill="#3A1070" />
                <rect x="4" y="9" width="2" height="1" fill="#3A1070" />
              </svg>
            )}
            {player.rebirthCount >= 2 && (
              <svg width="16" height="20" viewBox="0 0 8 10" style={{ imageRendering: "pixelated", display: "block" }}>
                <rect x="2" y="0" width="4" height="3" fill="#FFD700" />
                <rect x="1" y="1" width="6" height="2" fill="#FFE840" />
                <rect x="2" y="3" width="4" height="4" fill="#CC9900" />
                <rect x="1" y="3" width="2" height="3" fill="#E8B000" />
                <rect x="5" y="3" width="2" height="3" fill="#E8B000" />
                <rect x="2" y="7" width="2" height="3" fill="#AA7700" />
                <rect x="4" y="7" width="2" height="3" fill="#AA7700" />
                <rect x="3" y="1" width="1" height="1" fill="#FFFFFF" />
                <rect x="4" y="1" width="1" height="1" fill="#FFFFFF" />
                <rect x="0" y="0" width="2" height="1" fill="#FFD700" />
                <rect x="6" y="0" width="2" height="1" fill="#FFD700" />
                <rect x="2" y="9" width="2" height="1" fill="#886600" />
                <rect x="4" y="9" width="2" height="1" fill="#886600" />
              </svg>
            )}
          </div>
        </div>

        {/* Tile info strip */}
        <div style={{
          padding: "4px 12px",
          backgroundColor: tileColor + "15", border: `1px solid ${tileColor}33`,
          alignSelf: "stretch", marginLeft: 8, marginRight: 8,
        }}>
          <span className="pixel-text" style={{ color: tileColor, fontSize: 12 }}>
            {TILE_GLYPH[curTile.kind]} {getTileName(curTile.kind, biome, isOwnedProperty)}
          </span>
          {curTile.kind === "bank" && player.bankBalance > 0 && (
            <span className="pixel-text" style={{ color: C.yellow, fontSize: 11, marginLeft: 8 }}>
              balance: ${player.bankBalance}
            </span>
          )}
          {isOwnedProperty && (
            <span className="pixel-text" style={{ color: C.yellow, fontSize: 11, marginLeft: 8 }}>
              accrued: ${player.propertyIncome[player.position] ?? 0}
            </span>
          )}
          {!isOwnedProperty && curTile.kind === "property" && (
            <span className="pixel-text" style={{ color: C.textDim, fontSize: 11, marginLeft: 8 }}>
              (abandoned — land here to claim)
            </span>
          )}
          {curTile.kind === "teleport" && (
            <span className="pixel-text" style={{ color: "#A860FF", fontSize: 11, marginLeft: 8 }}>
              warps to boss
            </span>
          )}
        </div>

        {/* Collect Properties button — shown when total income > 0 */}
        {totalPropertyIncome > 0 && (
          <div style={{
            alignSelf: "stretch", marginLeft: 8, marginRight: 8,
            backgroundColor: "#141008", border: `2px solid ${C.yellow}66`,
            padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <span className="pixel-text" style={{ color: C.yellow, fontSize: 13 }}>$ PROPERTY INCOME</span>
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 11, display: "block" }}>
                {Object.keys(player.propertyIncome).length} properties · ${totalPropertyIncome} ready
              </span>
            </div>
            <PixelButton color={C.yellow} textColor="#000" onClick={collectProperties}>
              COLLECT
            </PixelButton>
          </div>
        )}

        {!isDesktop && <DiceDisplay value={diceVal} rolling={rolling} />}
      </div>

      {/* ── Desktop right panel ── */}
      {isDesktop && (
        <div style={{
          flex: 1, borderLeft: "2px solid #1A2A3A",
          display: "flex", flexDirection: "column", overflow: "hidden",
          backgroundColor: "#040810",
        }}>
          {jwc && <JWCModal inline />}
          {pendingTileAction?.type === "forge" && <ForgeOverlay onClose={closeTileAction} inline />}
          {pendingTileAction?.type === "shop" && <ShopOverlay items={pendingTileAction.items} onClose={closeTileAction} inline />}
          {!jwc && !pendingTileAction && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 28px", gap: 18, overflowY: "auto" }}>
              {/* Tile info */}
              <div style={{ padding: "10px 16px", backgroundColor: tileColor + "15", border: `1px solid ${tileColor}33` }}>
                <span className="pixel-text" style={{ color: tileColor, fontSize: 22 }}>
                  {TILE_GLYPH[curTile.kind]} {getTileName(curTile.kind, biome, isOwnedProperty)}
                </span>
                {curTile.kind === "bank" && player.bankBalance > 0 && (
                  <span className="pixel-text" style={{ color: C.yellow, fontSize: 16, display: "block", marginTop: 4 }}>
                    Bank balance: ${player.bankBalance}
                  </span>
                )}
                {isOwnedProperty && (
                  <span className="pixel-text" style={{ color: C.yellow, fontSize: 16, display: "block", marginTop: 4 }}>
                    Accrued: ${player.propertyIncome[player.position] ?? 0}
                  </span>
                )}
                {!isOwnedProperty && curTile.kind === "property" && (
                  <span className="pixel-text" style={{ color: C.textDim, fontSize: 14, display: "block", marginTop: 4 }}>
                    Abandoned — land here to claim
                  </span>
                )}
                {curTile.kind === "teleport" && (
                  <span className="pixel-text" style={{ color: "#A860FF", fontSize: 14, display: "block", marginTop: 4 }}>
                    Warps to boss
                  </span>
                )}
              </div>

              {totalPropertyIncome > 0 && (
                <div style={{ backgroundColor: "#141008", border: `2px solid ${C.yellow}66`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span className="pixel-text" style={{ color: C.yellow, fontSize: 20 }}>$ PROPERTY INCOME</span>
                    <span className="pixel-text" style={{ color: C.textDim, fontSize: 14, display: "block" }}>
                      {Object.keys(player.propertyIncome).length} properties · ${totalPropertyIncome} ready
                    </span>
                  </div>
                  <PixelButton color={C.yellow} textColor="#000" onClick={collectProperties} style={{ fontSize: 16, padding: "8px 14px" }}>
                    COLLECT
                  </PixelButton>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center" }}>
                <DiceDisplay value={diceVal} rolling={rolling} />
              </div>

              {hasPendingCombat ? (
                <div style={{
                  backgroundColor: BOARD[player.position].kind === "elite" ? "#1A0505" : "#0A0808",
                  border: `2px solid ${BOARD[player.position].kind === "elite" ? "#9B2020" : "#600"}`,
                  padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span className="pixel-text" style={{ color: BOARD[player.position].kind === "elite" ? "#D06060" : C.redBright, fontSize: 20 }}>
                    {BOARD[player.position].kind === "elite" ? "★ ELITE enemy blocks your path!" : "Enemy spotted!"}
                  </span>
                  <PixelButton color={C.redBright} textColor="#000" onClick={triggerPendingCombat} style={{ fontSize: 18, padding: "10px 18px" }}>
                    FIGHT
                  </PixelButton>
                </div>
              ) : (
                <PixelButton
                  color={rolling ? C.bg3 : biomeColor}
                  textColor="#000"
                  onClick={handleRoll}
                  disabled={rolling || !!hasPendingCombat || !!pendingTileAction}
                  style={{ padding: "20px 0", fontSize: 26 }}
                >
                  {rolling ? "ROLLING..." : "ROLL DICE"}
                </PixelButton>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Mobile overlays ── */}
      {!isDesktop && (
        <>
          {!hasPendingCombat && !pendingTileAction && !jwc && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "8px 16px", backgroundColor: "#06101Cee",
              borderTop: `2px solid ${biomeColor}44`,
              display: "flex", gap: 10, justifyContent: "center", zIndex: 80,
            }}>
              <PixelButton
                color={rolling ? C.bg3 : biomeColor}
                textColor="#000"
                onClick={handleRoll}
                disabled={rolling}
                style={{ flex: 1, maxWidth: 240, padding: "10px 0", fontSize: 18 }}
              >
                {rolling ? "..." : "ROLL DICE"}
              </PixelButton>
            </div>
          )}
          {hasPendingCombat && !jwc && (
            <CombatPrompt isElite={BOARD[player.position].kind === "elite"} onFight={triggerPendingCombat} />
          )}
          {pendingTileAction?.type === "shop" && (
            <ShopOverlay items={pendingTileAction.items} onClose={closeTileAction} />
          )}
          {pendingTileAction?.type === "forge" && (
            <ForgeOverlay onClose={closeTileAction} />
          )}
          {jwc && <JWCModal />}
        </>
      )}

      </div>{/* end main two-column */}
    </div>
  );
}
