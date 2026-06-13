import React, { useRef } from "react";
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

function SpriteImg({ name, w, h, isPlayer }: { name: string; w: number; h: number; isPlayer?: boolean }) {
  const map    = isPlayer ? CHARACTER_SPRITES : ENEMY_SPRITES;
  const imgSrc = (map[name] ?? (isPlayer ? map["battle"] : null)) ?? null;
  return (
    <div style={{ width: w, height: h, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {imgSrc ? (
        <img src={imgSrc} alt={name} style={{
          width: "100%", height: "100%",
          objectFit: "contain",
          imageRendering: "pixelated",
          mixBlendMode: "screen",
        }} />
      ) : (
        <PixelPortrait name={name} size={Math.min(w, h)} isPlayer={isPlayer} />
      )}
    </div>
  );
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
  const maxSp          = 3; // SP max for "all queued" check

  function startHold(idx: number) {
    holdTimerRef.current = setTimeout(() => jwcUnqueueAtkForEnemy(idx), 500);
  }
  function clearHold() {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  }

  // Sprite sizes — significantly bigger
  const playerW  = inline ? 110 : 480;
  const playerH  = inline ? 150 : 520;
  const enemySize = inline
    ? (liveEnemies.length > 2 ? 80 : 100)
    : (liveEnemies.length === 1 ? 460 : liveEnemies.length === 2 ? 340 : 240);

  // ── INLINE compact layout ────────────────────────────────────────────────
  if (inline) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{
          flex: 1, display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "2fr 2fr 1.6fr",
          overflow: "hidden",
          borderBottom: `3px solid ${accent}`,
        }}>
          {/* [0,0] Enemy HP bars */}
          <div style={{
            backgroundColor: "#0D0404", borderRight: `1px solid ${accent}33`, borderBottom: `1px solid ${accent}22`,
            padding: "4px 6px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 3,
          }}>
            {jwc.enemies.map((e, i) => {
              const isTarget = i === jwc.active;
              const isDead = e.hp <= 0;
              const atkForThis = atkByEnemy[i] ?? 0;
              return (
                <div key={e.id}
                  onClick={() => !isDead && !jwc.finished && jwcAttackEnemy(i)}
                  onContextMenu={ev => { ev.preventDefault(); if (atkForThis > 0) jwcUnqueueAtkForEnemy(i); else if (!isDead && !jwc.finished) jwcSelectTarget(i); }}
                  onTouchStart={() => startHold(i)} onTouchEnd={clearHold} onTouchMove={clearHold}
                  style={{
                    padding: "3px 4px", backgroundColor: isDead ? "#0A0000" : isTarget ? "#1E0404" : "#110202",
                    border: `1px solid ${isDead ? "#300" : isTarget ? C.redBright : "#600"}`,
                    cursor: isDead || jwc.finished ? "default" : "pointer", opacity: isDead ? 0.4 : 1,
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
                    {(isBossFight || e.isElite) && <span style={{ color: isBossFight ? C.yellow : "#D06060", fontSize: 9 }}>★</span>}
                    <span className="pixel-text" style={{ color: isDead ? "#600" : isTarget ? C.redBright : "#C06060", fontSize: 13, flex: 1, lineHeight: 1 }}>
                      {isDead ? `✗ ${e.name}` : e.name}
                    </span>
                    {atkForThis > 0 && <span className="pixel-text" style={{ color: C.redBright, fontSize: 10, backgroundColor: "#3A0000", padding: "0 3px" }}>ATK×{atkForThis}</span>}
                    {isTarget && !isDead && <span style={{ color: C.redBright, fontSize: 9 }}>◀</span>}
                  </div>
                  {!isDead && (
                    <>
                      <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} height={6} />
                      <span className="pixel-text" style={{ color: "#904040", fontSize: 10 }}>{e.hp}/{e.maxHp} · {e.damage}dmg</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* [0,1] Enemy sprites */}
          <div style={{
            backgroundColor: "#100404", borderBottom: `1px solid ${accent}22`,
            display: "flex", alignItems: "center",
            justifyContent: liveEnemies.length === 1 ? "center" : "space-evenly",
            padding: "4px", gap: liveEnemies.length > 1 ? 4 : 0, overflow: "hidden",
          }}>
            {liveEnemies.map(e => {
              const idx = jwc.enemies.findIndex(x => x.id === e.id);
              const isTarget = e.id === activeEnemy?.id;
              const atkForThis = atkByEnemy[idx] ?? 0;
              const allQueued = atkForThis >= maxSp;
              return (
                <div key={e.id}
                  onClick={() => !jwc.finished && jwcAttackEnemy(idx)}
                  onContextMenu={ev => { ev.preventDefault(); if (atkForThis > 0) jwcUnqueueAtkForEnemy(idx); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, cursor: "pointer", position: "relative" }}>
                  <div style={{ outline: isTarget ? `2px solid ${C.redBright}` : "none", outlineOffset: 1 }}>
                    <SpriteImg name={e.name} w={enemySize} h={enemySize} />
                  </div>
                  {atkForThis > 0 && (
                    <div style={{ position: "absolute", top: 2, right: 2, backgroundColor: allQueued ? C.redBright : "#8B0000", border: `1px solid ${C.redBright}`, padding: "1px 4px" }}>
                      <span className="pixel-text" style={{ color: allQueued ? "#000" : C.redBright, fontSize: 10 }}>{allQueued ? "ALL IN!" : `ATK×${atkForThis}`}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* [1,0] Player sprite */}
          <div style={{
            backgroundColor: "#040C04", borderRight: `1px solid ${accent}33`, borderBottom: `1px solid ${accent}22`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <SpriteImg name="self" w={playerW} h={playerH} isPlayer />
          </div>

          {/* [1,1] Player HP */}
          <div style={{
            backgroundColor: "#040A04", borderBottom: `1px solid ${accent}22`,
            padding: "6px 8px", display: "flex", flexDirection: "column", gap: 5, justifyContent: "center",
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span className="pixel-text" style={{ color: C.green, fontSize: 14 }}>HP</span>
                <span className="pixel-text" style={{ color: jwc.playerHp / jwc.playerMaxHp > 0.3 ? C.green : C.redBright, fontSize: 15 }}>{jwc.playerHp}/{jwc.playerMaxHp}</span>
              </div>
              <HpBar hp={jwc.playerHp} maxHp={jwc.playerMaxHp} color={C.green} height={8} />
            </div>
            <span className="pixel-text" style={{ color: sp > 0 ? C.cyan : "#334", fontSize: 15 }}>SP:{sp}{spReserved > 0 ? `+${spReserved}` : ""}</span>
            {w && <span className="pixel-text" style={{ color: C.yellow, fontSize: 12 }}>{w.name} · {w.damage}dmg</span>}
          </div>

          {/* [2,0] Battle log */}
          <div style={{
            backgroundColor: "#020A02", borderRight: `1px solid ${accent}33`,
            padding: "4px 6px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 1,
          }}>
            {recentLog.map((line, i) => (
              <span key={i} className="pixel-text" style={{
                fontSize: i === 0 ? 12 : 10,
                color: line.includes("STUN") || line.includes("[ICE]") ? C.cyan
                     : line.includes("hit") || line.includes("collapse") ? C.redBright
                     : line.includes("VICTORY") || line.includes("★") ? C.green
                     : line.includes("WEAK") ? C.yellow : C.textDim,
                opacity: 1 - i * 0.13, lineHeight: 1.2,
              }}>{line}</span>
            ))}
          </div>

          {/* [2,1] Buttons */}
          <div style={{ backgroundColor: "#030A03", padding: "4px 5px", display: "flex", flexDirection: "column", gap: 3 }}>
            {!jwc.finished ? (
              <>
                <div style={{ display: "flex", gap: 3, flex: 1 }}>
                  {(["STRIKE", "BLOCK", "RSRV"] as const).map((label) => {
                    const handler = label === "STRIKE" ? jwcAttack : label === "BLOCK" ? jwcDefend : jwcReserve;
                    const col = label === "STRIKE" ? C.redBright : label === "BLOCK" ? C.cyan : C.yellow;
                    const bg  = label === "STRIKE" ? "#3A0808" : label === "BLOCK" ? "#001A2A" : "#201800";
                    return (
                      <button key={label} onClick={handler} disabled={noSp} style={{
                        flex: 1, cursor: noSp ? "not-allowed" : "pointer",
                        backgroundColor: noSp ? bg + "33" : bg,
                        border: `2px solid ${noSp ? col + "33" : col}`,
                        color: noSp ? col + "44" : col,
                        fontFamily: "'VT323', monospace", fontSize: 15,
                      }}>{label}</button>
                    );
                  })}
                </div>
                <button onClick={jwcEndRound} style={{
                  padding: "8px 0",
                  backgroundColor: totalPending > 0 || spReserved > 0 ? "#083008" : "#0A0A0A",
                  border: `2px solid ${totalPending > 0 || spReserved > 0 ? C.green : "#333"}`,
                  color: totalPending > 0 || spReserved > 0 ? C.green : "#444",
                  fontFamily: "'VT323', monospace", fontSize: 16, cursor: "pointer",
                }}>{totalPending > 0 || spReserved > 0 ? "END TURN — RESOLVE" : "END TURN — PASS"}</button>
              </>
            ) : (
              <>
                {jwc.victory && (() => {
                  const tm = jwc.enemies.reduce((s, e) => s + (e.loot?.money ?? 0), 0);
                  const tg = jwc.enemies.reduce((s, e) => s + (e.loot?.gems  ?? 0), 0);
                  const drops = jwc.enemies.map(e => e.loot?.partName).filter(Boolean) as string[];
                  return (
                    <div style={{ backgroundColor: "#001A08", border: `1px solid ${C.green}44`, padding: "4px 6px", marginBottom: 3 }}>
                      <span className="pixel-text" style={{ color: C.green, fontSize: 11 }}>{isBossFight ? "★ BOSS REWARDS" : "★ REWARDS"}</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                        {tm > 0 && <span className="pixel-text" style={{ color: C.yellow, fontSize: 13 }}>+${tm}</span>}
                        {tg > 0 && <span className="pixel-text" style={{ color: C.cyan,   fontSize: 13 }}>+{tg}💎</span>}
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

  // ── FULL-SCREEN DESKTOP 3×2 grid ─────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "#04060A",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "3fr 3fr 2fr",
      zIndex: 100,
    }}>

      {/* ── [0,0] TOP-LEFT: Enemy HP bars ─────────────────────────────────── */}
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
          const isTarget   = i === jwc.active;
          const isDead     = e.hp <= 0;
          const isStunned  = e.stunned ?? false;
          const isFrozen   = (e.iceTurns ?? 0) > 0;
          const atkForThis = atkByEnemy[i] ?? 0;
          const allQueued  = atkForThis >= maxSp;

          return (
            <div
              key={e.id}
              onClick={() => !isDead && !jwc.finished && jwcAttackEnemy(i)}
              onContextMenu={ev => {
                ev.preventDefault();
                if (atkForThis > 0) jwcUnqueueAtkForEnemy(i);
                else if (!isDead && !jwc.finished) jwcSelectTarget(i);
              }}
              onTouchStart={() => startHold(i)} onTouchEnd={clearHold} onTouchMove={clearHold}
              style={{
                padding: "12px 16px",
                backgroundColor: isDead ? "#0A0000" : isTarget ? "#1E0404" : "#110202",
                border: `2px solid ${isDead ? "#300" : isTarget ? C.redBright : atkForThis > 0 ? C.redBright + "88" : "#600"}`,
                cursor: isDead || jwc.finished ? "default" : "pointer",
                opacity: isDead ? 0.4 : 1, userSelect: "none",
              }}
            >
              {/* Name row */}
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

                  {/* Attack queue indicator */}
                  {atkForThis > 0 && (
                    <div style={{
                      marginTop: 6, padding: "4px 10px",
                      backgroundColor: allQueued ? C.redBright + "22" : "#3A000022",
                      border: `2px solid ${allQueued ? C.redBright : C.redBright + "66"}`,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span className="pixel-text" style={{ color: allQueued ? C.redBright : "#DD4444", fontSize: allQueued ? 22 : 19 }}>
                        {allQueued ? `⚔ ALL IN! (${atkForThis} ATK)` : `⚔ ATK ×${atkForThis} queued`}
                      </span>
                      <span className="pixel-text" style={{ color: "#884444", fontSize: 14 }}>right-click to remove</span>
                    </div>
                  )}

                  {/* Status badges */}
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {isStunned  && <span className="pixel-text" style={{ color: C.yellow, fontSize: 14, backgroundColor: C.yellow + "18", padding: "2px 6px", border: `1px solid ${C.yellow}44` }}>STUN</span>}
                    {isFrozen   && <span className="pixel-text" style={{ color: C.cyan,   fontSize: 14, backgroundColor: C.cyan + "18",   padding: "2px 6px", border: `1px solid ${C.cyan}44`   }}>ICE×{e.iceTurns}</span>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── [0,1] TOP-RIGHT: Enemy sprites ────────────────────────────────── */}
      <div style={{
        backgroundColor: "#0C0308",
        borderBottom: `1px solid ${accent}33`,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: liveEnemies.length === 1 ? "center" : "space-evenly",
        padding: "12px 20px 8px",
        gap: liveEnemies.length > 1 ? 16 : 0,
        overflow: "hidden",
      }}>
        {liveEnemies.map(e => {
          const idx        = jwc.enemies.findIndex(x => x.id === e.id);
          const isTarget   = e.id === activeEnemy?.id;
          const atkForThis = atkByEnemy[idx] ?? 0;
          const allQueued  = atkForThis >= maxSp;

          return (
            <div key={e.id}
              onClick={() => !jwc.finished && jwcAttackEnemy(idx)}
              onContextMenu={ev => { ev.preventDefault(); if (atkForThis > 0) jwcUnqueueAtkForEnemy(idx); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none", position: "relative" }}
            >
              {/* ATK overlay badge */}
              {atkForThis > 0 && (
                <div style={{
                  position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
                  backgroundColor: allQueued ? C.redBright : "#8B0000",
                  border: `2px solid ${C.redBright}`,
                  padding: "2px 10px", zIndex: 2,
                }}>
                  <span className="pixel-text" style={{ color: allQueued ? "#000" : C.redBright, fontSize: allQueued ? 22 : 20 }}>
                    {allQueued ? "⚔ ALL IN!" : `⚔ ATK ×${atkForThis}`}
                  </span>
                </div>
              )}

              <div style={{
                outline: isTarget ? `4px solid ${C.redBright}` : atkForThis > 0 ? `3px solid ${C.redBright}66` : `1px solid ${accent}44`,
                outlineOffset: 3,
                transition: "outline 0.15s",
              }}>
                <SpriteImg name={e.name} w={enemySize} h={enemySize} />
              </div>
              <span className="pixel-text" style={{
                color: isTarget ? C.redBright : "#C06060", fontSize: 20,
                textShadow: isTarget ? `0 0 8px ${C.redBright}` : "none",
              }}>
                {isTarget ? "▼ " : ""}{e.name}
              </span>
              <span className="pixel-text" style={{ color: "#664444", fontSize: 16 }}>left-click to attack · right-click to remove</span>
            </div>
          );
        })}
      </div>

      {/* ── [1,0] MIDDLE-LEFT: Player sprite ──────────────────────────────── */}
      <div style={{
        backgroundColor: "#040C04",
        borderRight: `1px solid ${accent}33`,
        borderBottom: `1px solid ${accent}22`,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "12px 12px 8px",
        overflow: "hidden",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <SpriteImg name="self" w={playerW} h={playerH} isPlayer />
          <span className="pixel-text" style={{ color: C.green, fontSize: 20, textShadow: `0 0 10px ${C.green}55` }}>YOU</span>
        </div>
      </div>

      {/* ── [1,1] MIDDLE-RIGHT: Player HP/stats ───────────────────────────── */}
      <div style={{
        backgroundColor: "#040A04",
        borderBottom: `1px solid ${accent}22`,
        padding: "24px 32px",
        display: "flex", flexDirection: "column", gap: 20, justifyContent: "center",
      }}>
        {/* Big HP */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
            <span className="pixel-text" style={{ color: C.green, fontSize: 26 }}>HEALTH</span>
            <span className="pixel-text" style={{
              color: jwc.playerHp / jwc.playerMaxHp > 0.3 ? C.green : C.redBright,
              fontSize: 38,
            }}>
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

        {/* SP */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="pixel-text" style={{ color: sp > 0 ? C.cyan : "#334", fontSize: 32 }}>
            SP: {sp}
          </span>
          {spReserved > 0 && (
            <span className="pixel-text" style={{ color: C.yellow, fontSize: 24 }}>
              +{spReserved} reserved
            </span>
          )}
        </div>

        {/* Weapon */}
        <div style={{ backgroundColor: "#0A0F0A", border: `1px solid ${C.textDim}22`, padding: "12px 16px" }}>
          {w ? (
            <>
              <span className="pixel-text" style={{ color: C.yellow, fontSize: 26, display: "block" }}>{w.name}</span>
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 20, display: "block", marginTop: 4 }}>
                {w.weaponKind} · {w.damage}dmg · {w.damageType}
                {w.effect ? (w.effect === "ice" ? " · [ICE]" : " · [STUN]") : ""}
              </span>
              {activeEnemy && w.damageType === activeEnemy.weakness && (
                <span className="pixel-text" style={{ color: C.green, fontSize: 20, display: "block", marginTop: 4 }}>★ HITS WEAKNESS!</span>
              )}
            </>
          ) : (
            <span className="pixel-text" style={{ color: C.textDim, fontSize: 24 }}>FISTS · blunt · 5dmg</span>
          )}
        </div>

        {/* Queued actions */}
        {(totalPending > 0 || spReserved > 0) && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {atkByEnemy.map((n, i) => n > 0 ? (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="pixel-text" style={{ color: C.redBright, fontSize: 18 }}>ATK×{n}→{jwc.enemies[i]?.name?.split(" ")[0]}</span>
                <button onClick={() => jwcUnqueueAtkForEnemy(i)} style={{ backgroundColor: "#2A0000", border: "1px solid #500", color: "#FF8080", cursor: "pointer", fontSize: 14, padding: "0 5px", fontFamily: "inherit" }}>↩</button>
              </div>
            ) : null)}
            {pendingDef > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="pixel-text" style={{ color: C.cyan, fontSize: 18 }}>DEF×{pendingDef}</span>
                <button onClick={jwcUnqueueDef} style={{ backgroundColor: "#001020", border: "1px solid #048", color: "#80D0FF", cursor: "pointer", fontSize: 14, padding: "0 5px", fontFamily: "inherit" }}>↩</button>
              </div>
            )}
            {spReserved > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="pixel-text" style={{ color: C.yellow, fontSize: 18 }}>RSV×{spReserved}</span>
                <button onClick={jwcUnqueueReserve} style={{ backgroundColor: "#201000", border: "1px solid #750", color: "#FFD060", cursor: "pointer", fontSize: 14, padding: "0 5px", fontFamily: "inherit" }}>↩</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── [2,0] BOTTOM-LEFT: Battle log ─────────────────────────────────── */}
      <div style={{
        backgroundColor: "#020A02",
        borderRight: `1px solid ${accent}33`,
        padding: "16px 20px",
        overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 5,
      }}>
        <span className="pixel-text" style={{ color: "#2A5A2A", fontSize: 15, letterSpacing: 2, marginBottom: 4 }}>COMBAT LOG</span>
        {recentLog.map((line, i) => (
          <span key={i} className="pixel-text" style={{
            display: "block",
            fontSize: i === 0 ? 21 : 18,
            color: line.includes("STUN") || line.includes("[ICE]") || line.includes("frozen") ? C.cyan
                 : line.includes("hit") || line.includes("collapse") ? C.redBright
                 : line.includes("VICTORY") || line.includes("★") ? C.green
                 : line.includes("WEAK") ? C.yellow
                 : line.startsWith("──") ? "#1A4A1A"
                 : C.textDim,
            opacity: 1 - i * 0.1, lineHeight: 1.35,
          }}>
            {line}
          </span>
        ))}
      </div>

      {/* ── [2,1] BOTTOM-RIGHT: Action buttons ────────────────────────────── */}
      <div style={{
        backgroundColor: "#030A03",
        padding: "14px 18px",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {!jwc.finished ? (
          <>
            {/* STRIKE / BLOCK / RESERVE */}
            <div style={{ display: "flex", gap: 12, flex: 1 }}>
              <button onClick={jwcAttack} disabled={noSp} style={{
                flex: 1, cursor: noSp ? "not-allowed" : "pointer",
                backgroundColor: noSp ? "#1A0808" : "#3A0808",
                border: `3px solid ${noSp ? "#300" : C.redBright}`,
                color: noSp ? "#500" : C.redBright,
                fontFamily: "'VT323', monospace", fontSize: 44, letterSpacing: 1,
              }}>STRIKE</button>
              <button onClick={jwcDefend} disabled={noSp} style={{
                flex: 1, cursor: noSp ? "not-allowed" : "pointer",
                backgroundColor: noSp ? "#000A12" : "#001A2A",
                border: `3px solid ${noSp ? "#024" : C.cyan}`,
                color: noSp ? "#024" : C.cyan,
                fontFamily: "'VT323', monospace", fontSize: 44, letterSpacing: 1,
              }}>BLOCK</button>
              <button onClick={jwcReserve} disabled={noSp} style={{
                flex: 1, cursor: noSp ? "not-allowed" : "pointer",
                backgroundColor: noSp ? "#100800" : "#201800",
                border: `3px solid ${noSp ? "#430" : C.yellow}`,
                color: noSp ? "#430" : C.yellow,
                fontFamily: "'VT323', monospace", fontSize: 44, letterSpacing: 1,
              }}>RESERVE</button>
            </div>

            {/* END TURN */}
            <button onClick={jwcEndRound} style={{
              flex: 1,
              backgroundColor: totalPending > 0 || spReserved > 0 ? "#083008" : "#0A0A0A",
              border: `3px solid ${totalPending > 0 || spReserved > 0 ? C.green : "#333"}`,
              color: totalPending > 0 || spReserved > 0 ? C.green : "#444",
              fontFamily: "'VT323', monospace", fontSize: 48,
              cursor: "pointer", letterSpacing: 2,
            }}>
              {totalPending > 0 || spReserved > 0 ? "END TURN — RESOLVE" : "END TURN — PASS"}
            </button>
          </>
        ) : (
          <>
            {jwc.victory && (() => {
              const totalMoney  = jwc.enemies.reduce((s, e) => s + (e.loot?.money  ?? 0), 0);
              const totalGems   = jwc.enemies.reduce((s, e) => s + (e.loot?.gems   ?? 0), 0);
              const totalMetals = jwc.enemies.reduce((s, e) => s + (e.loot?.metals ?? 0), 0);
              const drops       = jwc.enemies.map(e => e.loot?.partName).filter(Boolean) as string[];
              return (
                <div style={{
                  backgroundColor: "#001A08", border: `2px solid ${C.green}44`,
                  padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8, marginBottom: 10,
                }}>
                  <span className="pixel-text" style={{ color: C.green, fontSize: 20, letterSpacing: 2 }}>
                    {isBossFight ? "★ BOSS REWARDS" : "★ BATTLE REWARDS"}
                  </span>
                  <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                    {totalMoney  > 0 && <span className="pixel-text" style={{ color: C.yellow,  fontSize: 30 }}>+${totalMoney}</span>}
                    {totalGems   > 0 && <span className="pixel-text" style={{ color: C.cyan,    fontSize: 30 }}>+{totalGems} 💎</span>}
                    {totalMetals > 0 && <span className="pixel-text" style={{ color: C.textDim, fontSize: 24 }}>+{totalMetals} metals</span>}
                    {drops.length > 0 && <span className="pixel-text" style={{ color: "#A080FF", fontSize: 22 }}>{drops.join(", ")}</span>}
                  </div>
                </div>
              );
            })()}
            <PixelButton
              onClick={closeJWC}
              color={jwc.victory ? C.green : "#6B0000"}
              textColor={jwc.victory ? "#052002" : "#fff"}
              style={{ width: "100%", flex: 1, fontSize: 38 }}
            >
              {jwc.victory ? (isBossFight ? "★ BOSS SLAIN — CLAIM LOOT" : "★ CLAIM LOOT") : "CONTINUE..."}
            </PixelButton>
          </>
        )}
      </div>
    </div>
  );
}
