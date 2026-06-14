import React, { useRef, useState, useCallback } from "react";
import { useGame } from "@/game/state";
import { C, PixelButton } from "./PixelUI";
import { ENEMY_SPRITES, CHARACTER_SPRITES } from "@/assets/sprites";
import { PixelPortrait } from "./CardArt";
import { getBiome, BIOME_BG, BIOME_COLORS } from "@/game/data";
import type { Weapon } from "@/game/data";

function HpBar({ hp, maxHp, color, height = 10 }: { hp: number; maxHp: number; color: string; height?: number }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const barColor = pct > 50 ? color : pct > 20 ? C.yellow : C.redBright;
  return (
    <div style={{ height, backgroundColor: "#111", border: "1px solid #000", overflow: "hidden" }}>
      <div style={{ height: "100%", backgroundColor: barColor, width: `${pct}%`, transition: "width 0.3s" }} />
    </div>
  );
}

// Fill the entire container — objectFit contain so transparent sprites show properly
function SpriteFill({ name, isPlayer, animClass }: { name: string; isPlayer?: boolean; animClass?: string }) {
  const map    = isPlayer ? CHARACTER_SPRITES : ENEMY_SPRITES;
  const imgSrc = (map[name] ?? (isPlayer ? map["battle"] : null)) ?? null;
  return imgSrc ? (
    <img src={imgSrc} alt={name} className={animClass} style={{
      width: "100%", height: "100%",
      objectFit: "contain",
      objectPosition: "center center",
      imageRendering: "pixelated",
      display: "block",
    }} />
  ) : (
    <div className={animClass} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <PixelPortrait name={name} size={200} isPlayer={isPlayer} />
    </div>
  );
}

// Fixed-size sprite for inline mode
function SpriteBox({ name, size, isPlayer, animClass }: { name: string; size: number; isPlayer?: boolean; animClass?: string }) {
  const map    = isPlayer ? CHARACTER_SPRITES : ENEMY_SPRITES;
  const imgSrc = (map[name] ?? (isPlayer ? map["battle"] : null)) ?? null;
  return (
    <div className={animClass} style={{ width: size, height: size, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {imgSrc ? (
        <img src={imgSrc} alt={name} style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated", mixBlendMode: "screen" }} />
      ) : (
        <PixelPortrait name={name} size={size} isPlayer={isPlayer} />
      )}
    </div>
  );
}

// Hook to run a one-shot animation key
function useAnimKey() {
  const [keys, setKeys] = useState<Record<string | number, number>>({});
  const trigger = useCallback((id: string | number) => {
    setKeys(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);
  const getClass = useCallback((id: string | number, className: string) => {
    const k = keys[id];
    if (!k) return "";
    return `${className} anim-key-${k}`;
  }, [keys]);
  return { trigger, getClass };
}

export default function JWCModal({ inline }: { inline?: boolean }) {
  const {
    jwc, player,
    jwcAttack,
    jwcDefend, jwcUnqueueDef,
    jwcReserve, jwcUnqueueReserve,
    jwcEndRound, jwcSelectTarget,
    jwcAttackEnemy,
    jwcUnqueueAtkForEnemy,
    closeJWC,
  } = useGame();

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation state
  const enemyAnim  = useAnimKey();
  const playerAnim = useAnimKey();

  if (!jwc) return null;

  const { atkByEnemy, pendingDef, sp, spReserved, isBossFight } = jwc;
  const totalAtkQueued = atkByEnemy.reduce((a, b) => a + b, 0);
  const totalPending   = totalAtkQueued + pendingDef;
  const noSp           = sp < 1;
  const w              = player.equipped.weapon as Weapon | null;
  const activeEnemy    = jwc.enemies[jwc.active];
  const accent         = isBossFight ? C.yellow : "#880000";
  const biome          = getBiome(player.bossKills);
  const biomeBg        = BIOME_BG[biome];
  const biomeColor     = BIOME_COLORS[biome];
  const liveEnemies    = jwc.enemies.filter(e => e.hp > 0);
  const recentLog      = jwc.log.slice(0, 8);
  const maxSp          = 3;

  function startHold(idx: number) {
    holdTimerRef.current = setTimeout(() => jwcUnqueueAtkForEnemy(idx), 500);
  }
  function clearHold() {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  }

  // Wrapped action handlers that trigger animations
  function handleAttackEnemy(idx: number) {
    enemyAnim.trigger(jwc!.enemies[idx]?.id ?? idx);
    jwcAttackEnemy(idx);
  }
  function handleDefend() {
    playerAnim.trigger("player");
    jwcDefend();
  }
  function handleReserve() {
    playerAnim.trigger("reserve");
    jwcReserve();
  }

  // ── INLINE compact layout ──────────────────────────────────────────────────
  if (inline) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* ── Battle scene — floating sprites, no rigid columns ── */}
        <div style={{
          flex: 1, minHeight: 0,
          display: "flex", flexDirection: "row",
          background: `linear-gradient(180deg, ${biomeBg} 0%, ${biomeColor}22 60%, ${biomeBg} 100%)`,
          overflow: "hidden",
        }}>

          {/* Player — left 30%, sprite faces right naturally (no flip needed) */}
          <div style={{
            width: "30%", position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "flex-end",
          }}>
            <div
              className={playerAnim.getClass("player", "jwc-shield-block") || playerAnim.getClass("reserve", "jwc-reserve-pulse")}
              style={{ width: "100%", flex: 1, minHeight: 0 }}
            >
              <SpriteFill name="self" isPlayer />
            </div>
          </div>

          {/* Enemies — right 70%, all side-by-side, stretch to full height */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "row",
            alignItems: "stretch", overflow: "hidden",
          }}>
            {jwc.enemies.map((e, i) => {
              const isDead = e.hp <= 0;
              const isTarget = i === jwc.active;
              const atkN = atkByEnemy[i] ?? 0;
              const animClass = enemyAnim.getClass(e.id, "jwc-attack-hit");
              const isBoss = jwc.isBossFight && jwc.enemies.length === 1;
              return (
                <div key={e.id}
                  onClick={() => !isDead && !jwc.finished && handleAttackEnemy(i)}
                  onContextMenu={ev => { ev.preventDefault(); if (atkN > 0) jwcUnqueueAtkForEnemy(i); else if (!isDead && !jwc.finished) jwcSelectTarget(i); }}
                  onTouchStart={() => startHold(i)} onTouchEnd={clearHold} onTouchMove={clearHold}
                  style={{
                    flex: isDead ? "0 0 18px" : 1,
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "flex-end",
                    cursor: isDead || jwc.finished ? "default" : "pointer",
                    opacity: isDead ? 0.25 : 1,
                    overflow: "hidden",
                  }}>
                  {isDead ? (
                    <span className="pixel-text" style={{ color: "#500", fontSize: 10, paddingBottom: 4 }}>✗</span>
                  ) : (
                    <>
                      {/* Sprite — capped smaller for bosses/elites */}
                      <div className={animClass} style={{
                        flex: 1, width: "100%", minHeight: 0,
                        maxHeight: isBoss ? "65%" : jwc.enemies.length === 1 ? "72%" : "100%",
                        filter: isTarget
                          ? `drop-shadow(0 0 6px ${C.redBright}) drop-shadow(0 0 12px ${C.redBright}99)`
                          : "none",
                        transition: "filter 0.15s",
                      }}>
                        <SpriteFill name={e.name} />
                      </div>
                      {/* HP overlay — always visible at the bottom */}
                      <div style={{
                        width: "100%", flexShrink: 0,
                        padding: "3px 4px",
                        background: "linear-gradient(0deg, #000000CC 0%, #00000066 80%, transparent 100%)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                          <span className="pixel-text" style={{
                            color: isTarget ? C.redBright : "#DD8888", fontSize: 9, lineHeight: 1,
                            textShadow: isTarget ? `0 0 6px ${C.redBright}` : "none",
                          }}>
                            {e.name.split(" ")[0]}
                          </span>
                          {atkN > 0 && (
                            <span className="pixel-text" style={{ color: C.redBright, fontSize: 9 }}>⚔×{atkN}</span>
                          )}
                        </div>
                        <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} height={4} />
                        <span className="pixel-text" style={{ color: "#CC7777", fontSize: 8 }}>{e.hp}/{e.maxHp}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom strip: whiteboard log | HP + buttons ── */}
        <div style={{
          height: "44%", flexShrink: 0,
          display: "flex", flexDirection: "row",
          borderTop: `2px solid ${accent}66`,
        }}>

          {/* Whiteboard log — parchment/cream style */}
          <div style={{
            flex: 1, minWidth: 0,
            backgroundColor: "#EDE8D4",
            borderRight: "1px solid #B8A870",
            padding: "4px 6px", overflowY: "auto",
            display: "flex", flexDirection: "column", gap: 1,
          }}>
            {recentLog.length === 0 && (
              <span className="pixel-text" style={{ color: "#9A8060", fontSize: 9 }}>Combat begins...</span>
            )}
            {recentLog.map((line, i) => (
              <span key={i} className="pixel-text" style={{
                fontSize: i === 0 ? 11 : 9,
                color: line.includes("STUN") || line.includes("[ICE]") ? "#005580"
                     : line.includes("hit") || line.includes("collapse")  ? "#880010"
                     : line.includes("VICTORY") || line.includes("★")    ? "#105010"
                     : line.includes("WEAK")                               ? "#705000"
                     : "#3A2810",
                opacity: 1 - i * 0.1, lineHeight: 1.25,
              }}>{line}</span>
            ))}
          </div>

          {/* Player HP floating + action buttons */}
          <div style={{
            width: "48%", display: "flex", flexDirection: "column",
            backgroundColor: "#050C05", padding: "3px 4px", gap: 3,
          }}>
            {/* Floating HP chip */}
            <div style={{
              padding: "2px 5px", flexShrink: 0,
              background: "linear-gradient(90deg, #001A0044 0%, #001A0088 100%)",
              border: `1px solid ${C.green}44`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span className="pixel-text" style={{ color: C.green, fontSize: 10 }}>
                    ♥ {jwc.playerHp}/{jwc.playerMaxHp}
                  </span>
                  <span className="pixel-text" style={{ color: sp > 0 ? C.cyan : "#334", fontSize: 10 }}>
                    SP {sp}{spReserved > 0 ? `+${spReserved}` : ""}
                  </span>
                </div>
                <HpBar hp={jwc.playerHp} maxHp={jwc.playerMaxHp} color={C.green} height={4} />
              </div>
            </div>

            {!jwc.finished ? (
              <>
                <button onClick={jwcEndRound} style={{
                  padding: "8px 0", flexShrink: 0,
                  backgroundColor: totalPending > 0 || spReserved > 0 ? "#082808" : "#080808",
                  border: `2px solid ${totalPending > 0 || spReserved > 0 ? C.green : "#2A2A2A"}`,
                  color: totalPending > 0 || spReserved > 0 ? C.green : "#3A3A3A",
                  fontFamily: "'VT323', monospace", fontSize: 16, cursor: "pointer", width: "100%",
                }}>{totalPending > 0 || spReserved > 0 ? "END TURN ▶" : "END TURN"}</button>
                <div style={{ display: "flex", gap: 3, flex: 1, minHeight: 0 }}>
                  {(["STRIKE", "BLOCK", "RSRV"] as const).map((label) => {
                    const handler = label === "STRIKE" ? jwcAttack : label === "BLOCK" ? handleDefend : handleReserve;
                    const remover = label === "BLOCK" ? jwcUnqueueDef : label === "RSRV" ? jwcUnqueueReserve : null;
                    const queuedN = label === "BLOCK" ? pendingDef : label === "RSRV" ? spReserved : 0;
                    const col = label === "STRIKE" ? C.redBright : label === "BLOCK" ? C.cyan : C.yellow;
                    const bg  = label === "STRIKE" ? "#3A0808" : label === "BLOCK" ? "#001A2A" : "#201800";
                    return (
                      <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                        <button onClick={handler} disabled={noSp} style={{
                          flex: 1, width: "100%", cursor: noSp ? "not-allowed" : "pointer",
                          backgroundColor: noSp ? bg + "22" : bg,
                          border: `2px solid ${noSp ? col + "22" : col}`,
                          color: noSp ? col + "33" : col,
                          fontFamily: "'VT323', monospace", fontSize: 15,
                        }}>{label}</button>
                        {remover && queuedN > 0 && (
                          <button onClick={remover} style={{
                            width: "100%", cursor: "pointer", backgroundColor: "#080808",
                            border: `1px solid ${col}55`, color: col + "99",
                            fontFamily: "'VT323', monospace", fontSize: 10, padding: "1px 0",
                          }}>↩ ×{queuedN}</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {jwc.victory && (() => {
                  const tm = jwc.enemies.reduce((s, e) => s + (e.loot?.money ?? 0), 0);
                  const tg = jwc.enemies.reduce((s, e) => s + (e.loot?.gems ?? 0), 0);
                  const drops = jwc.enemies.map(e => e.loot?.partName).filter(Boolean) as string[];
                  return (
                    <div style={{ backgroundColor: "#001608", border: `1px solid ${C.green}44`, padding: "3px 4px", marginBottom: 2 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {tm > 0 && <span className="pixel-text" style={{ color: C.yellow, fontSize: 11 }}>+${tm}</span>}
                        {tg > 0 && <span className="pixel-text" style={{ color: C.cyan, fontSize: 11 }}>+{tg}💎</span>}
                        {drops.map((d, i) => <span key={i} className="pixel-text" style={{ color: "#A080FF", fontSize: 10 }}>{d}</span>)}
                      </div>
                    </div>
                  );
                })()}
                <PixelButton onClick={closeJWC} color={jwc.victory ? C.green : "#6B0000"} textColor={jwc.victory ? "#052002" : "#fff"} style={{ width: "100%", flex: 1 }}>
                  {jwc.victory ? (isBossFight ? "★ BOSS SLAIN" : "★ CLAIM LOOT") : "CONTINUE..."}
                </PixelButton>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── FULL-SCREEN MODAL ─────────────────────────────────────────────────────
  const spPips = Array.from({ length: maxSp }, (_, i) => i < sp);
  const hasActions = totalPending > 0 || spReserved > 0;

  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "#03050A",
      display: "flex", flexDirection: "column",
      zIndex: 100, overflow: "hidden",
    }}>

      {/* ── TOP: Battle arena (50% height) ─────────────────────────────────── */}
      <div style={{
        flex: "0 0 50%", display: "flex", flexDirection: "row",
        background: `linear-gradient(180deg, ${isBossFight ? "#1A0408" : biomeBg} 0%, ${isBossFight ? "#2A0808" : biomeColor + "33"} 100%)`,
        overflow: "hidden", position: "relative",
      }}>
        {/* Boss/fight label */}
        {isBossFight && (
          <div style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
            backgroundColor: "#2A0808CC", border: `1px solid ${C.yellow}`,
            padding: "2px 16px", zIndex: 5,
          }}>
            <span className="pixel-text" style={{ color: C.yellow, fontSize: 14 }}>★ BOSS FIGHT ★</span>
          </div>
        )}

        {/* Player sprite (left 30%) */}
        <div style={{
          width: "28%", position: "relative", overflow: "hidden",
          display: "flex", flexDirection: "column", alignItems: "center",
          background: "linear-gradient(90deg, #04100444 0%, transparent 100%)",
        }}>
          <div
            className={playerAnim.getClass("player", "jwc-shield-block") || playerAnim.getClass("reserve", "jwc-reserve-pulse")}
            style={{ width: "100%", flex: 1, minHeight: 0 }}
          >
            <SpriteFill name="self" isPlayer />
          </div>
          {/* Player HP bar at bottom */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(transparent, #00000099)",
            padding: "12px 6px 6px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span className="pixel-text" style={{ color: C.green, fontSize: 11, lineHeight: 1 }}>♥ YOU</span>
              <span className="pixel-text" style={{
                fontSize: 12, lineHeight: 1,
                color: jwc.playerHp / jwc.playerMaxHp > 0.4 ? C.green : C.redBright,
              }}>{jwc.playerHp}/{jwc.playerMaxHp}</span>
            </div>
            <HpBar hp={jwc.playerHp} maxHp={jwc.playerMaxHp} color={C.green} height={5} />
          </div>
        </div>

        {/* VS divider */}
        <div style={{ width: 2, backgroundColor: `${accent}33`, flexShrink: 0 }} />

        {/* Enemy sprites (right 70%) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "stretch", overflow: "hidden" }}>
          {jwc.enemies.map((e, i) => {
            const isDead = e.hp <= 0;
            const isTarget = i === jwc.active;
            const atkN = atkByEnemy[i] ?? 0;
            const allQueued = atkN >= maxSp;
            const animClass = enemyAnim.getClass(e.id, "jwc-attack-hit");
            return (
              <div key={e.id}
                onClick={() => !isDead && !jwc.finished && handleAttackEnemy(i)}
                onContextMenu={ev => { ev.preventDefault(); if (atkN > 0) jwcUnqueueAtkForEnemy(i); else if (!isDead && !jwc.finished) jwcSelectTarget(i); }}
                onTouchStart={() => startHold(i)} onTouchEnd={clearHold} onTouchMove={clearHold}
                style={{
                  flex: isDead ? "0 0 20px" : 1,
                  position: "relative", cursor: isDead || jwc.finished ? "default" : "pointer",
                  opacity: isDead ? 0.2 : 1, overflow: "hidden",
                  outline: isTarget && !isDead ? `3px solid ${C.redBright}88` : "none",
                  outlineOffset: -3,
                  borderRight: i < jwc.enemies.length - 1 ? `1px solid ${accent}22` : "none",
                }}
              >
                {isDead ? (
                  <span className="pixel-text" style={{ color: "#500", fontSize: 9, padding: 4 }}>✗</span>
                ) : (
                  <>
                    <div className={animClass} style={{ width: "100%", height: "100%" }}>
                      <SpriteFill name={e.name} />
                    </div>

                    {/* Attack queue badge */}
                    {atkN > 0 && (
                      <div style={{
                        position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
                        backgroundColor: allQueued ? C.redBright : "#660000CC",
                        border: `2px solid ${C.redBright}`,
                        padding: "2px 10px", zIndex: 3, whiteSpace: "nowrap",
                      }}>
                        <span className="pixel-text" style={{
                          color: allQueued ? "#000" : C.redBright, fontSize: allQueued ? 22 : 19,
                        }}>
                          {allQueued ? "⚔ ALL IN!" : `⚔ ×${atkN}`}
                        </span>
                      </div>
                    )}

                    {/* Enemy info overlay */}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "linear-gradient(transparent, #000000DD)",
                      padding: "14px 6px 6px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span className="pixel-text" style={{
                          color: isTarget ? C.redBright : "#CC6666", fontSize: 13, lineHeight: 1,
                          textShadow: isTarget ? `0 0 6px ${C.redBright}` : "none",
                        }}>
                          {(isBossFight || e.isElite) ? "★ " : ""}{e.name.split(" ")[0]}
                        </span>
                        <span className="pixel-text" style={{ color: "#664444", fontSize: 10 }}>Lv{e.level}</span>
                      </div>
                      <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} height={4} />
                      <span className="pixel-text" style={{ color: "#885555", fontSize: 10 }}>{e.hp}/{e.maxHp}</span>
                    </div>

                    {/* Status badges */}
                    {((e.stunned ?? false) || (e.iceTurns ?? 0) > 0) && (
                      <div style={{ position: "absolute", top: 4, right: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                        {(e.stunned ?? false) && (
                          <span className="pixel-text" style={{ color: C.yellow, fontSize: 9, backgroundColor: C.yellow + "22", padding: "1px 4px", border: `1px solid ${C.yellow}44` }}>STUN</span>
                        )}
                        {(e.iceTurns ?? 0) > 0 && (
                          <span className="pixel-text" style={{ color: C.cyan, fontSize: 9, backgroundColor: C.cyan + "22", padding: "1px 4px", border: `1px solid ${C.cyan}44` }}>ICE×{e.iceTurns}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BOTTOM: Combat HUD (50% height) ────────────────────────────────── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        backgroundColor: "#06090F",
        borderTop: `2px solid ${accent}44`,
        overflow: "hidden",
      }}>
        {/* SP pips + weapon bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 12px", backgroundColor: "#050810",
          borderBottom: `1px solid #1A1A2A`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>SP</span>
            <div style={{ display: "flex", gap: 5 }}>
              {spPips.map((filled, i) => (
                <div key={i} style={{
                  width: 16, height: 16,
                  backgroundColor: filled ? C.cyan : "#1A1A2A",
                  border: `2px solid ${filled ? C.cyan : "#333"}`,
                  boxShadow: filled ? `0 0 6px ${C.cyan}88` : "none",
                  transition: "all 0.15s",
                }} />
              ))}
              {spReserved > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: 4 }}>
                  {Array.from({ length: spReserved }, (_, i) => (
                    <div key={i} style={{
                      width: 14, height: 14,
                      backgroundColor: C.yellow + "33",
                      border: `2px solid ${C.yellow}`,
                      boxShadow: `0 0 4px ${C.yellow}66`,
                    }} />
                  ))}
                  <span className="pixel-text" style={{ color: C.yellow, fontSize: 10 }}>RSRV</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {w && <span className="pixel-text" style={{ color: C.yellow, fontSize: 12 }}>
              {w.damage}⚔ {w.damageType}{w.effect ? ` [${w.effect.toUpperCase()}]` : ""}
            </span>}
            {pendingDef > 0 && (
              <span className="pixel-text" style={{ color: C.cyan, fontSize: 12, backgroundColor: C.cyan + "18", padding: "1px 6px", border: `1px solid ${C.cyan}44` }}>
                🛡×{pendingDef}
              </span>
            )}
          </div>
        </div>

        {/* Log + actions */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

          {/* Combat log */}
          <div style={{
            flex: 1, minWidth: 0, overflow: "hidden",
            backgroundColor: "#EDE8D4",
            borderRight: "2px solid #B8A870",
            padding: "6px 8px",
            display: "flex", flexDirection: "column", gap: 1,
          }}>
            {recentLog.length === 0 && (
              <span className="pixel-text" style={{ color: "#9A8060", fontSize: 10 }}>Combat begins...</span>
            )}
            {recentLog.map((line, i) => (
              <span key={i} className="pixel-text" style={{
                fontSize: i === 0 ? 12 : 10,
                color: line.includes("STUN") || line.includes("[ICE]") ? "#005580"
                     : line.includes("VICTORY") || line.includes("★")   ? "#105010"
                     : line.includes("hit") || line.includes("collapse") ? "#880010"
                     : line.includes("WEAK")                              ? "#705000"
                     : "#3A2810",
                opacity: 1 - i * 0.09, lineHeight: 1.3,
                fontWeight: i === 0 ? "bold" : "normal",
              }}>{line}</span>
            ))}
          </div>

          {/* Action panel */}
          <div style={{
            width: "52%", display: "flex", flexDirection: "column",
            backgroundColor: "#050E05", padding: "6px 8px", gap: 5,
          }}>
            {!jwc.finished ? (
              <>
                {/* Strike enemy panel - compact */}
                <div style={{
                  backgroundColor: "#0A0404", border: `1px solid ${accent}33`,
                  padding: "4px 8px", flexShrink: 0,
                }}>
                  <span className="pixel-text" style={{ color: accent, fontSize: 10 }}>
                    TARGET: {activeEnemy?.name ?? "—"} · {activeEnemy?.damage ?? 0}dmg in
                  </span>
                </div>

                {/* Main action buttons */}
                <div style={{ display: "flex", gap: 5, flex: 1 }}>
                  {([
                    { label: "HIT", sublabel: "STRIKE", handler: jwcAttack, remover: null as (() => void) | null, col: C.redBright, bg: "#2A0404", icon: "⚔" },
                    { label: "DEF", sublabel: "BLOCK",  handler: handleDefend,  remover: jwcUnqueueDef,     col: C.cyan,     bg: "#001520", icon: "🛡" },
                    { label: "RSV", sublabel: "RESERVE", handler: handleReserve, remover: jwcUnqueueReserve, col: C.yellow,   bg: "#181000", icon: "◆" },
                  ]).map(({ label, sublabel, handler, remover, col, bg, icon }) => {
                    const queuedN = sublabel === "BLOCK" ? pendingDef : sublabel === "RESERVE" ? spReserved : (atkByEnemy[jwc.active] ?? 0);
                    const showQueue = sublabel !== "STRIKE" && queuedN > 0;
                    return (
                      <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                        <button onClick={handler} disabled={noSp} style={{
                          flex: 1, width: "100%", cursor: noSp ? "not-allowed" : "pointer",
                          backgroundColor: noSp ? bg + "44" : bg,
                          border: `2px solid ${noSp ? col + "33" : col}`,
                          color: noSp ? col + "44" : col,
                          fontFamily: "'VT323', monospace",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0,
                          padding: "6px 4px",
                        }}>
                          <span style={{ fontSize: 20 }}>{icon}</span>
                          <span style={{ fontSize: 16 }}>{label}</span>
                        </button>
                        {showQueue && remover && (
                          <button onClick={remover} style={{
                            width: "100%", padding: "3px 0",
                            cursor: "pointer", backgroundColor: col + "18",
                            border: `1px solid ${col}55`, color: col,
                            fontFamily: "'VT323', monospace", fontSize: 13,
                          }}>↩ ×{queuedN}</button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* End turn button */}
                <button onClick={jwcEndRound} style={{
                  width: "100%", padding: "10px 0", flexShrink: 0,
                  backgroundColor: hasActions ? "#052005" : "#080808",
                  border: `2px solid ${hasActions ? C.green : "#2A2A2A"}`,
                  color: hasActions ? C.green : "#3A3A3A",
                  fontFamily: "'VT323', monospace", fontSize: 18, cursor: "pointer",
                  boxShadow: hasActions ? `0 0 8px ${C.green}44` : "none",
                }}>
                  {hasActions ? "▶ END TURN" : "END TURN"}
                </button>
              </>
            ) : (
              <>
                {jwc.victory && (() => {
                  const tm = jwc.enemies.reduce((s, e) => s + (e.loot?.money ?? 0), 0);
                  const tg = jwc.enemies.reduce((s, e) => s + (e.loot?.gems ?? 0), 0);
                  const drops = jwc.enemies.map(e => e.loot?.partName).filter(Boolean) as string[];
                  return (
                    <div style={{ backgroundColor: "#001A08", border: `1px solid ${C.green}44`, padding: "6px 10px", flexShrink: 0 }}>
                      <span className="pixel-text" style={{ color: C.green, fontSize: 14 }}>{isBossFight ? "★ BOSS REWARDS" : "★ REWARDS"}</span>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 3 }}>
                        {tm > 0 && <span className="pixel-text" style={{ color: C.yellow, fontSize: 18 }}>+${tm}</span>}
                        {tg > 0 && <span className="pixel-text" style={{ color: C.cyan, fontSize: 18 }}>+{tg}💎</span>}
                        {drops.map((d, i) => <span key={i} className="pixel-text" style={{ color: "#A080FF", fontSize: 14 }}>{d}</span>)}
                      </div>
                    </div>
                  );
                })()}
                <PixelButton
                  onClick={closeJWC}
                  color={jwc.victory ? C.green : "#6B0000"}
                  textColor={jwc.victory ? "#052002" : "#fff"}
                  style={{ width: "100%", flex: 1, fontSize: 20 }}
                >
                  {jwc.victory ? (isBossFight ? "★ BOSS SLAIN" : "★ CLAIM LOOT") : "CONTINUE..."}
                </PixelButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
