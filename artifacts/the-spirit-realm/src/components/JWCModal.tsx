import React, { useRef, useState, useCallback } from "react";
import { useGame } from "@/game/state";
import { C, PixelButton } from "./PixelUI";
import { ENEMY_SPRITES, CHARACTER_SPRITES } from "@/assets/sprites";
import { PixelPortrait } from "./CardArt";
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
    enemyAnim.trigger(jwc.enemies[idx]?.id ?? idx);
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
    const inlineSize = liveEnemies.length > 2 ? 80 : 100;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{
          flex: 1, display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "3fr 3fr 2.2fr",
          overflow: "hidden",
          borderBottom: `3px solid ${accent}`,
        }}>
          {/* [0,0] Enemy HP */}
          <div style={{
            backgroundColor: "#0D0404", borderRight: `1px solid ${accent}33`, borderBottom: `1px solid ${accent}22`,
            padding: "4px 6px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 3,
          }}>
            {jwc.enemies.map((e, i) => {
              const isTarget = i === jwc.active, isDead = e.hp <= 0, atkN = atkByEnemy[i] ?? 0;
              return (
                <div key={e.id}
                  onClick={() => !isDead && !jwc.finished && handleAttackEnemy(i)}
                  onContextMenu={ev => { ev.preventDefault(); if (atkN > 0) jwcUnqueueAtkForEnemy(i); else if (!isDead && !jwc.finished) jwcSelectTarget(i); }}
                  onTouchStart={() => startHold(i)} onTouchEnd={clearHold} onTouchMove={clearHold}
                  style={{ padding: "3px 4px", backgroundColor: isDead ? "#0A0000" : isTarget ? "#1E0404" : "#110202", border: `1px solid ${isDead ? "#300" : isTarget ? C.redBright : "#600"}`, cursor: isDead || jwc.finished ? "default" : "pointer", opacity: isDead ? 0.4 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
                    <span className="pixel-text" style={{ color: isDead ? "#600" : isTarget ? C.redBright : "#C06060", fontSize: 13, flex: 1, lineHeight: 1 }}>
                      {isDead ? `✗ ${e.name}` : e.name}
                    </span>
                    {atkN > 0 && <span className="pixel-text" style={{ color: C.redBright, fontSize: 10, backgroundColor: "#3A0000", padding: "0 3px" }}>ATK×{atkN}</span>}
                  </div>
                  {!isDead && (
                    <>
                      <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} height={5} />
                      <span className="pixel-text" style={{ color: "#904040", fontSize: 10 }}>{e.hp}/{e.maxHp}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* [0,1] Enemy sprites — fill the cell */}
          <div style={{
            backgroundColor: "#100404", borderBottom: `1px solid ${accent}22`,
            display: "flex", alignItems: "stretch",
            justifyContent: "stretch",
            overflow: "hidden", position: "relative",
          }}>
            {liveEnemies.map(e => {
              const idx = jwc.enemies.findIndex(x => x.id === e.id);
              const isTarget = e.id === activeEnemy?.id, atkN = atkByEnemy[idx] ?? 0;
              const animClass = enemyAnim.getClass(e.id, "jwc-attack-hit");
              return (
                <div key={e.id} onClick={() => !jwc.finished && handleAttackEnemy(idx)}
                  onContextMenu={ev => { ev.preventDefault(); if (atkN > 0) jwcUnqueueAtkForEnemy(idx); }}
                  style={{
                    flex: 1, position: "relative", cursor: "pointer",
                    outline: isTarget ? `2px solid ${C.redBright}` : "none",
                    outlineOffset: -2,
                    borderRight: liveEnemies.indexOf(e) < liveEnemies.length - 1 ? `1px solid ${accent}33` : "none",
                    overflow: "hidden",
                  }}>
                  <SpriteFill name={e.name} animClass={animClass} />
                  {atkN > 0 && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, textAlign: "center", backgroundColor: "#8B000099", padding: "1px 0" }}>
                      <span className="pixel-text" style={{ color: C.redBright, fontSize: 9 }}>ATK×{atkN}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* [1,0] Player sprite — fill the cell */}
          <div style={{
            backgroundColor: "#040C04", borderRight: `1px solid ${accent}33`, borderBottom: `1px solid ${accent}22`,
            overflow: "hidden", position: "relative",
          }}>
            <SpriteFill
              name="self" isPlayer
              animClass={playerAnim.getClass("player", "jwc-shield-block") || playerAnim.getClass("reserve", "jwc-reserve-pulse")}
            />
          </div>

          {/* [1,1] Player HP */}
          <div style={{
            backgroundColor: "#040A04", borderBottom: `1px solid ${accent}22`,
            padding: "6px 8px", display: "flex", flexDirection: "column", gap: 5, justifyContent: "center",
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span className="pixel-text" style={{ color: C.green, fontSize: 13 }}>HP</span>
                <span className="pixel-text" style={{ color: jwc.playerHp / jwc.playerMaxHp > 0.3 ? C.green : C.redBright, fontSize: 14 }}>
                  {jwc.playerHp}/{jwc.playerMaxHp}
                </span>
              </div>
              <HpBar hp={jwc.playerHp} maxHp={jwc.playerMaxHp} color={C.green} height={7} />
            </div>
            <span className="pixel-text" style={{ color: sp > 0 ? C.cyan : "#334", fontSize: 14 }}>SP:{sp}{spReserved > 0 ? `+${spReserved}` : ""}</span>
            {w && <span className="pixel-text" style={{ color: C.yellow, fontSize: 11 }}>{w.name} · {w.damage}dmg</span>}
          </div>

          {/* [2,0] Log */}
          <div style={{ backgroundColor: "#020A02", borderRight: `1px solid ${accent}33`, padding: "4px 6px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
            {recentLog.map((line, i) => (
              <span key={i} className="pixel-text" style={{
                fontSize: i === 0 ? 12 : 10,
                color: line.includes("STUN") || line.includes("[ICE]") ? C.cyan : line.includes("hit") || line.includes("collapse") ? C.redBright : line.includes("VICTORY") || line.includes("★") ? C.green : line.includes("WEAK") ? C.yellow : C.textDim,
                opacity: 1 - i * 0.13, lineHeight: 1.2,
              }}>{line}</span>
            ))}
          </div>

          {/* [2,1] Buttons — End Turn big, 3 action buttons fill rest */}
          <div style={{ backgroundColor: "#030A03", padding: "3px 4px", display: "flex", flexDirection: "column", gap: 3, height: "100%" }}>
            {!jwc.finished ? (
              <>
                <button onClick={jwcEndRound} style={{
                  padding: "10px 0", flexShrink: 0,
                  backgroundColor: totalPending > 0 || spReserved > 0 ? "#083008" : "#0A0A0A",
                  border: `2px solid ${totalPending > 0 || spReserved > 0 ? C.green : "#333"}`,
                  color: totalPending > 0 || spReserved > 0 ? C.green : "#444",
                  fontFamily: "'VT323', monospace", fontSize: 18, cursor: "pointer", width: "100%",
                }}>{totalPending > 0 || spReserved > 0 ? "END TURN ▶ RESOLVE" : "END TURN — PASS"}</button>
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
                          backgroundColor: noSp ? bg + "33" : bg, border: `2px solid ${noSp ? col + "33" : col}`,
                          color: noSp ? col + "44" : col, fontFamily: "'VT323', monospace", fontSize: 16,
                        }}>{label}</button>
                        {remover && queuedN > 0 && (
                          <button onClick={remover} style={{
                            width: "100%", cursor: "pointer", backgroundColor: "#0A0A0A",
                            border: `1px solid ${col}66`, color: col + "AA",
                            fontFamily: "'VT323', monospace", fontSize: 11, padding: "1px 0",
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
                    <div style={{ backgroundColor: "#001A08", border: `1px solid ${C.green}44`, padding: "4px 6px", marginBottom: 3 }}>
                      <span className="pixel-text" style={{ color: C.green, fontSize: 11 }}>{isBossFight ? "★ BOSS REWARDS" : "★ REWARDS"}</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                        {tm > 0 && <span className="pixel-text" style={{ color: C.yellow, fontSize: 13 }}>+${tm}</span>}
                        {tg > 0 && <span className="pixel-text" style={{ color: C.cyan, fontSize: 13 }}>+{tg}💎</span>}
                        {drops.map((d, i) => <span key={i} className="pixel-text" style={{ color: "#A080FF", fontSize: 11 }}>{d}</span>)}
                      </div>
                    </div>
                  );
                })()}
                <PixelButton onClick={closeJWC} color={jwc.victory ? C.green : "#6B0000"} textColor={jwc.victory ? "#052002" : "#fff"} style={{ width: "100%", padding: "12px 0" }}>
                  {jwc.victory ? (isBossFight ? "★ BOSS SLAIN" : "★ CLAIM LOOT") : "CONTINUE..."}
                </PixelButton>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── FULL-SCREEN MOBILE MODAL ───────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "#04060A",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "5fr 5fr 2fr",
      zIndex: 100,
      overflow: "hidden",
    }}>

      {/* ── [0,0] TOP-LEFT: Enemy HP bars ──────────────────────────────────── */}
      <div style={{
        backgroundColor: "#0D0404",
        borderRight: `1px solid ${accent}33`,
        borderBottom: `1px solid ${accent}33`,
        padding: "16px 20px",
        overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <span className="pixel-text" style={{ color: accent, fontSize: 16, letterSpacing: 2, marginBottom: 2 }}>
          {isBossFight ? "★ ENEMIES" : "ENEMIES"}
        </span>

        {jwc.enemies.map((e, i) => {
          const isTarget   = i === jwc.active, isDead = e.hp <= 0;
          const isStunned  = e.stunned ?? false, isFrozen = (e.iceTurns ?? 0) > 0;
          const atkN       = atkByEnemy[i] ?? 0, allQueued = atkN >= maxSp;

          return (
            <div key={e.id}
              onClick={() => !isDead && !jwc.finished && handleAttackEnemy(i)}
              onContextMenu={ev => {
                ev.preventDefault();
                if (atkN > 0) jwcUnqueueAtkForEnemy(i);
                else if (!isDead && !jwc.finished) jwcSelectTarget(i);
              }}
              onTouchStart={() => startHold(i)} onTouchEnd={clearHold} onTouchMove={clearHold}
              style={{
                padding: "12px 16px",
                backgroundColor: isDead ? "#0A0000" : isTarget ? "#1E0404" : "#110202",
                border: `2px solid ${isDead ? "#300" : isTarget ? C.redBright : atkN > 0 ? C.redBright + "88" : "#600"}`,
                cursor: isDead || jwc.finished ? "default" : "pointer", opacity: isDead ? 0.4 : 1, userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {(isBossFight || e.isElite) && <span style={{ color: isBossFight ? C.yellow : "#D06060", fontSize: 16 }}>★</span>}
                <span className="pixel-text" style={{ color: isDead ? "#600" : isTarget ? C.redBright : "#C06060", fontSize: 26, flex: 1, lineHeight: 1 }}>
                  {isDead ? `✗ ${e.name}` : e.name}
                </span>
                <span className="pixel-text" style={{ color: "#7A4444", fontSize: 18 }}>Lv{e.level ?? "?"}</span>
                {isTarget && !isDead && <span style={{ fontSize: 16, color: C.redBright }}>◀</span>}
              </div>

              {!isDead && (
                <>
                  <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} height={14} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                    <span className="pixel-text" style={{ color: "#904040", fontSize: 20 }}>{e.hp}/{e.maxHp} HP</span>
                    <span className="pixel-text" style={{ color: "#704040", fontSize: 18 }}>{e.damage}dmg · weak:{e.weakness}</span>
                  </div>
                  {atkN > 0 && (
                    <div style={{ marginTop: 6, padding: "4px 10px", backgroundColor: allQueued ? C.redBright + "22" : "#3A000022", border: `2px solid ${allQueued ? C.redBright : C.redBright + "66"}`, display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="pixel-text" style={{ color: allQueued ? C.redBright : "#DD4444", fontSize: allQueued ? 22 : 19 }}>
                        {allQueued ? `⚔ ALL IN! (${atkN} ATK)` : `⚔ ATK ×${atkN} queued`}
                      </span>
                      <span className="pixel-text" style={{ color: "#884444", fontSize: 14 }}>right-click to remove</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {isStunned && <span className="pixel-text" style={{ color: C.yellow, fontSize: 14, backgroundColor: C.yellow + "18", padding: "2px 6px", border: `1px solid ${C.yellow}44` }}>STUN</span>}
                    {isFrozen  && <span className="pixel-text" style={{ color: C.cyan,   fontSize: 14, backgroundColor: C.cyan   + "18", padding: "2px 6px", border: `1px solid ${C.cyan}44`   }}>ICE×{e.iceTurns}</span>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── [0,1] TOP-RIGHT: Enemy sprites — fills entire cell ─────────────── */}
      <div style={{
        backgroundColor: "#0C0308",
        borderBottom: `1px solid ${accent}33`,
        display: "flex",
        alignItems: "stretch",
        overflow: "hidden",
        padding: 0,
      }}>
        {liveEnemies.map(e => {
          const idx      = jwc.enemies.findIndex(x => x.id === e.id);
          const isTarget = e.id === activeEnemy?.id;
          const atkN     = atkByEnemy[idx] ?? 0, allQueued = atkN >= maxSp;
          const animClass = enemyAnim.getClass(e.id, "jwc-attack-hit");

          return (
            <div key={e.id}
              onClick={() => !jwc.finished && handleAttackEnemy(idx)}
              onContextMenu={ev => { ev.preventDefault(); if (atkN > 0) jwcUnqueueAtkForEnemy(idx); }}
              style={{
                flex: 1, position: "relative", cursor: "pointer", userSelect: "none",
                outline: isTarget ? `4px solid ${C.redBright}` : atkN > 0 ? `3px solid ${C.redBright}55` : "none",
                outlineOffset: -4,
                borderRight: liveEnemies.indexOf(e) < liveEnemies.length - 1 ? `1px solid ${accent}22` : "none",
                overflow: "hidden",
              }}
            >
              <SpriteFill name={e.name} animClass={animClass} />

              {atkN > 0 && (
                <div style={{
                  position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
                  backgroundColor: allQueued ? C.redBright : "#8B0000CC",
                  border: `2px solid ${C.redBright}`,
                  padding: "3px 14px", zIndex: 2, whiteSpace: "nowrap",
                }}>
                  <span className="pixel-text" style={{ color: allQueued ? "#000" : C.redBright, fontSize: allQueued ? 24 : 22 }}>
                    {allQueued ? "⚔ ALL IN!" : `⚔ ATK ×${atkN}`}
                  </span>
                </div>
              )}

              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(transparent, #000000CC)",
                padding: "16px 8px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              }}>
                <span className="pixel-text" style={{ color: isTarget ? C.redBright : "#C06060", fontSize: 20, textShadow: isTarget ? `0 0 8px ${C.redBright}` : "none" }}>
                  {isTarget ? "▼ " : ""}{e.name}
                </span>
                <span className="pixel-text" style={{ color: "#554444", fontSize: 13 }}>tap to attack</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── [1,0] MIDDLE-LEFT: Player sprite — fills entire cell ───────────── */}
      <div style={{
        backgroundColor: "#040C04",
        borderRight: `1px solid ${accent}33`,
        borderBottom: `1px solid ${accent}22`,
        position: "relative",
        overflow: "hidden",
      }}>
        <SpriteFill
          name="self" isPlayer
          animClass={playerAnim.getClass("player", "jwc-shield-block") || playerAnim.getClass("reserve", "jwc-reserve-pulse")}
        />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, #000000BB)",
          padding: "16px 8px 8px",
          display: "flex", justifyContent: "center",
        }}>
          <span className="pixel-text" style={{ color: C.green, fontSize: 22, textShadow: `0 0 10px ${C.green}55` }}>YOU</span>
        </div>
      </div>

      {/* ── [1,1] MIDDLE-RIGHT: Player HP/stats ────────────────────────────── */}
      <div style={{
        backgroundColor: "#040A04",
        borderBottom: `1px solid ${accent}22`,
        padding: "24px 32px",
        display: "flex", flexDirection: "column", gap: 20, justifyContent: "center",
        overflowY: "auto",
      }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
            <span className="pixel-text" style={{ color: C.green, fontSize: 26 }}>HEALTH</span>
            <span className="pixel-text" style={{ color: jwc.playerHp / jwc.playerMaxHp > 0.3 ? C.green : C.redBright, fontSize: 40 }}>
              {jwc.playerHp}/{jwc.playerMaxHp}
            </span>
          </div>
          <div style={{ height: 22, backgroundColor: "#111", border: `2px solid ${C.green}44`, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              backgroundColor: jwc.playerHp / jwc.playerMaxHp > 0.5 ? C.green : jwc.playerHp / jwc.playerMaxHp > 0.2 ? C.yellow : C.redBright,
              width: `${Math.max(0, (jwc.playerHp / jwc.playerMaxHp) * 100)}%`,
              transition: "width 0.3s",
            }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="pixel-text" style={{ color: sp > 0 ? C.cyan : "#334", fontSize: 34 }}>SP: {sp}</span>
          {spReserved > 0 && <span className="pixel-text" style={{ color: C.yellow, fontSize: 26 }}>+{spReserved} reserved</span>}
        </div>

        <div style={{ backgroundColor: "#0A0F0A", border: `1px solid ${C.textDim}22`, padding: "12px 16px" }}>
          {w ? (
            <>
              <span className="pixel-text" style={{ color: C.yellow, fontSize: 28, display: "block" }}>{w.name}</span>
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 20, display: "block", marginTop: 4 }}>
                {w.weaponKind} · {w.damage}dmg · {w.damageType}
                {w.effect ? (w.effect === "ice" ? " · [ICE]" : " · [STUN]") : ""}
              </span>
            </>
          ) : (
            <span className="pixel-text" style={{ color: C.textDim, fontSize: 22 }}>No weapon</span>
          )}
        </div>
      </div>

      {/* ── [2,0] BOTTOM-LEFT: Combat log ──────────────────────────────────── */}
      <div style={{
        backgroundColor: "#020A02",
        borderRight: `1px solid ${accent}33`,
        padding: "12px 16px",
        overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <span className="pixel-text" style={{ color: accent, fontSize: 13, marginBottom: 4 }}>COMBAT LOG</span>
        {recentLog.map((line, i) => (
          <span key={i} className="pixel-text" style={{
            fontSize: i === 0 ? 16 : 13,
            color: line.includes("STUN") || line.includes("[ICE]") ? C.cyan
                 : line.includes("hit") || line.includes("collapse") ? C.redBright
                 : line.includes("VICTORY") || line.includes("★") ? C.green
                 : line.includes("WEAK") ? C.yellow
                 : C.textDim,
            opacity: 1 - i * 0.1,
            lineHeight: 1.3,
          }}>{line}</span>
        ))}
      </div>

      {/* ── [2,1] BOTTOM-RIGHT: Action buttons ─────────────────────────────── */}
      <div style={{ backgroundColor: "#030A03", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {!jwc.finished ? (
          <>
            <div style={{ display: "flex", gap: 10, flex: 1 }}>
              {([
                { label: "STRIKE", handler: jwcAttack, remover: null, col: C.redBright, bg: "#3A0808" },
                { label: "BLOCK",  handler: handleDefend,  remover: jwcUnqueueDef,     col: C.cyan,     bg: "#001A2A" },
                { label: "RSRV",   handler: handleReserve, remover: jwcUnqueueReserve, col: C.yellow,   bg: "#201800" },
              ] as const).map(({ label, handler, remover, col, bg }) => {
                const queuedN = label === "BLOCK" ? pendingDef : label === "RSRV" ? spReserved : 0;
                return (
                  <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={handler} disabled={noSp} style={{
                      flex: 1, cursor: noSp ? "not-allowed" : "pointer", padding: "10px 0",
                      backgroundColor: noSp ? bg + "33" : bg, border: `2px solid ${noSp ? col + "33" : col}`,
                      color: noSp ? col + "44" : col, fontFamily: "'VT323', monospace", fontSize: 20,
                    }}>{label}</button>
                    {remover && queuedN > 0 && (
                      <button onClick={remover} style={{
                        cursor: "pointer", backgroundColor: "#0A0A0A", padding: "6px 0",
                        border: `1px solid ${col}66`, color: col + "AA",
                        fontFamily: "'VT323', monospace", fontSize: 16,
                      }}>↩ ×{queuedN}</button>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={jwcEndRound} style={{
              padding: "14px 0",
              backgroundColor: totalPending > 0 || spReserved > 0 ? "#083008" : "#0A0A0A",
              border: `2px solid ${totalPending > 0 || spReserved > 0 ? C.green : "#333"}`,
              color: totalPending > 0 || spReserved > 0 ? C.green : "#444",
              fontFamily: "'VT323', monospace", fontSize: 22, cursor: "pointer",
            }}>{totalPending > 0 || spReserved > 0 ? "END TURN — RESOLVE" : "END TURN — PASS"}</button>
          </>
        ) : (
          <>
            {jwc.victory && (() => {
              const tm = jwc.enemies.reduce((s, e) => s + (e.loot?.money ?? 0), 0);
              const tg = jwc.enemies.reduce((s, e) => s + (e.loot?.gems ?? 0), 0);
              const drops = jwc.enemies.map(e => e.loot?.partName).filter(Boolean) as string[];
              return (
                <div style={{ backgroundColor: "#001A08", border: `1px solid ${C.green}44`, padding: "10px 14px", marginBottom: 6 }}>
                  <span className="pixel-text" style={{ color: C.green, fontSize: 16 }}>{isBossFight ? "★ BOSS REWARDS" : "★ REWARDS"}</span>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                    {tm > 0 && <span className="pixel-text" style={{ color: C.yellow, fontSize: 20 }}>+${tm}</span>}
                    {tg > 0 && <span className="pixel-text" style={{ color: C.cyan, fontSize: 20 }}>+{tg}💎</span>}
                    {drops.map((d, i) => <span key={i} className="pixel-text" style={{ color: "#A080FF", fontSize: 16 }}>{d}</span>)}
                  </div>
                </div>
              );
            })()}
            <PixelButton onClick={closeJWC} color={jwc.victory ? C.green : "#6B0000"} textColor={jwc.victory ? "#052002" : "#fff"} style={{ width: "100%", padding: "20px 0", fontSize: 22 }}>
              {jwc.victory ? (isBossFight ? "★ BOSS SLAIN" : "★ CLAIM LOOT") : "CONTINUE..."}
            </PixelButton>
          </>
        )}
      </div>
    </div>
  );
}
