import React, { useRef } from "react";
import { useGame } from "@/game/state";
import { C, PixelButton } from "./PixelUI";
import { ENEMY_SPRITES, CHARACTER_SPRITES } from "@/assets/sprites";
import { PixelPortrait } from "./CardArt";
import type { Weapon } from "@/game/data";

// ── HP bar ────────────────────────────────────────────────────────────────────
function HpBar({ hp, maxHp, color }: { hp: number; maxHp: number; color: string }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const barColor = pct > 50 ? color : pct > 20 ? C.yellow : C.redBright;
  return (
    <div style={{ height: 6, backgroundColor: "#111", border: "1px solid #000", overflow: "hidden" }}>
      <div style={{ height: "100%", backgroundColor: barColor, width: `${pct}%`, transition: "width 0.3s" }} />
    </div>
  );
}

// ── Sprite renderer — transparent bg, no box border for enemies ───────────────
function SpriteImg({
  name, w, h, isPlayer,
}: { name: string; w: number; h: number; isPlayer?: boolean }) {
  const map    = isPlayer ? CHARACTER_SPRITES : ENEMY_SPRITES;
  const imgSrc = (map[name] ?? (isPlayer ? map["battle"] : null)) ?? null;

  return (
    <div style={{
      width: w, height: h, flexShrink: 0,
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={name}
          style={{
            width: "100%", height: "100%",
            objectFit: "contain",
            imageRendering: "pixelated",
            display: "block",
            // Player has black bg so mix-blend-mode makes it "transparent"
            mixBlendMode: "screen",
            filter: isPlayer ? "none" : "drop-shadow(0 4px 12px rgba(0,0,0,0.8))",
          }}
        />
      ) : (
        <PixelPortrait name={name} size={Math.min(w, h)} isPlayer={isPlayer} />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function JWCModal({ inline }: { inline?: boolean }) {
  const {
    jwc, player,
    jwcAttack, jwcUnqueueAtk,
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
  const recentLog      = jwc.log.slice(0, 5);

  function startHold(idx: number) {
    holdTimerRef.current = setTimeout(() => jwcUnqueueAtkForEnemy(idx), 500);
  }
  function clearHold() {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  }

  // ── Sprite sizes: desktop full-screen vs inline compact ───────────────────
  const playerW  = inline ? 120 : 260;
  const playerH  = inline ? 160 : 360;
  const enemyW   = inline
    ? (liveEnemies.length > 2 ? 80 : 100)
    : (liveEnemies.length === 1 ? 280 : liveEnemies.length === 2 ? 220 : 160);
  const enemyH   = inline
    ? (liveEnemies.length > 2 ? 80 : 100)
    : (liveEnemies.length === 1 ? 280 : liveEnemies.length === 2 ? 220 : 160);

  const arenaH   = inline ? 200 : 420;

  return (
    <div style={inline ? {
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
    } : {
      position: "fixed", inset: 0,
      backgroundColor: "#04060A",
      display: "flex", flexDirection: "column", zIndex: 100,
    }}>

      {/* ── STAT BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 0, flexShrink: 0, overflowX: "auto",
        borderBottom: `2px solid ${accent}44`,
        backgroundColor: "#060408",
      }}>
        {/* Enemy stat chips */}
        <div style={{
          flex: 1, display: "flex", gap: 0, borderRight: `1px solid ${accent}33`,
          minWidth: 0,
        }}>
          {jwc.enemies.map((e, i) => {
            const isTarget   = i === jwc.active;
            const isDead     = e.hp <= 0;
            const isStunned  = e.stunned ?? false;
            const isFrozen   = (e.iceTurns ?? 0) > 0;
            const atkForThis = atkByEnemy[i] ?? 0;
            return (
              <div
                key={e.id}
                onClick={() => !isDead && !jwc.finished && jwcSelectTarget(i)}
                onDoubleClick={() => !isDead && !jwc.finished && jwcAttackEnemy(i)}
                onContextMenu={ev => { ev.preventDefault(); if (atkForThis > 0) jwcUnqueueAtkForEnemy(i); }}
                onTouchStart={() => startHold(i)}
                onTouchEnd={clearHold}
                onTouchMove={clearHold}
                style={{
                  flex: 1, minWidth: inline ? 80 : 140,
                  padding: inline ? "3px 5px" : "5px 10px",
                  backgroundColor: isDead ? "#08000A" : isTarget ? "#1A0410" : "#0E0208",
                  borderRight: `1px solid ${accent}22`,
                  cursor: isDead || jwc.finished ? "default" : "pointer",
                  opacity: isDead ? 0.45 : 1,
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  {(isBossFight || e.isElite) && (
                    <span style={{ color: isBossFight ? C.yellow : "#D06060", fontSize: 10 }}>★</span>
                  )}
                  <span className="pixel-text" style={{
                    color: isDead ? "#600" : isTarget ? C.redBright : "#C06060",
                    fontSize: inline ? 12 : 15, flex: 1, lineHeight: 1,
                  }}>
                    {isDead ? `✗ ${e.name}` : e.name}
                  </span>
                  <span className="pixel-text" style={{ color: "#7A3030", fontSize: inline ? 9 : 11 }}>
                    Lv{e.level}
                  </span>
                  {isTarget && !isDead && <span style={{ color: C.redBright, fontSize: 10 }}>▼</span>}
                </div>
                {!isDead && (
                  <>
                    <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 1, flexWrap: "wrap", gap: 2 }}>
                      <span className="pixel-text" style={{ color: "#904040", fontSize: inline ? 9 : 11 }}>
                        {e.hp}/{e.maxHp}
                      </span>
                      <span className="pixel-text" style={{ color: "#704040", fontSize: inline ? 9 : 11 }}>
                        {e.damage}dmg · weak:{e.weakness}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 2, marginTop: 2, flexWrap: "wrap" }}>
                      {isStunned && (
                        <span className="pixel-text" style={{ color: C.yellow, fontSize: 9, backgroundColor: C.yellow + "18", padding: "0 3px", border: `1px solid ${C.yellow}44` }}>STUN</span>
                      )}
                      {isFrozen && (
                        <span className="pixel-text" style={{ color: C.cyan, fontSize: 9, backgroundColor: C.cyan + "18", padding: "0 3px", border: `1px solid ${C.cyan}44` }}>ICE×{e.iceTurns}</span>
                      )}
                      {atkForThis > 0 && (
                        <span className="pixel-text" style={{ color: C.redBright, fontSize: 9, backgroundColor: C.redBright + "18", padding: "0 3px", border: `1px solid ${C.redBright}44` }}>ATK×{atkForThis}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Player stat chip */}
        <div style={{
          flexShrink: 0,
          minWidth: inline ? 110 : 200,
          padding: inline ? "3px 5px" : "5px 10px",
          backgroundColor: "#030A04",
          display: "flex", flexDirection: "column", gap: 3, justifyContent: "center",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="pixel-text" style={{ color: C.green, fontSize: inline ? 11 : 14 }}>YOU</span>
            <span className="pixel-text" style={{
              color: jwc.playerHp / jwc.playerMaxHp > 0.3 ? C.green : C.redBright,
              fontSize: inline ? 11 : 14,
            }}>
              {jwc.playerHp}/{jwc.playerMaxHp}
            </span>
          </div>
          <HpBar hp={jwc.playerHp} maxHp={jwc.playerMaxHp} color={C.green} />
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span className="pixel-text" style={{ color: sp > 0 ? C.cyan : "#334", fontSize: inline ? 11 : 13 }}>
              SP:{sp}{spReserved > 0 ? `+${spReserved}` : ""}
            </span>
            {w && (
              <span className="pixel-text" style={{ color: C.yellow, fontSize: inline ? 9 : 11 }}>
                {w.name} · {w.damage}dmg
                {activeEnemy && w.damageType === activeEnemy.weakness ? " ★WEAK!" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── SPRITE ARENA ─────────────────────────────────────────────────── */}
      <div style={{
        height: arenaH, flexShrink: 0,
        display: "flex", alignItems: "flex-end",
        backgroundColor: "#060A0E",
        borderBottom: `3px solid ${accent}`,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Subtle ground line */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 2, backgroundColor: accent + "33",
        }} />

        {/* Player — centered on the left half */}
        <div style={{
          flex: 1,
          height: "100%",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          paddingBottom: 4,
          borderRight: `1px solid ${accent}22`,
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <SpriteImg name="self" w={playerW} h={playerH} isPlayer />
            <span className="pixel-text" style={{
              color: C.green, fontSize: inline ? 11 : 14,
              textShadow: `0 0 8px ${C.green}`,
            }}>YOU</span>
          </div>
        </div>

        {/* Enemies — centered (1) or evenly spaced (2+) */}
        <div style={{
          flex: liveEnemies.length === 1 ? 1 : 1.4,
          height: "100%",
          display: "flex", alignItems: "flex-end",
          justifyContent: liveEnemies.length === 1 ? "center" : "space-evenly",
          paddingBottom: 4,
          paddingLeft: inline ? 4 : 12,
          paddingRight: inline ? 4 : 12,
          gap: liveEnemies.length === 1 ? 0 : (inline ? 6 : 20),
        }}>
          {liveEnemies.map(e => {
            const isTarget = e.id === activeEnemy?.id;
            return (
              <div
                key={e.id}
                onClick={() => !jwc.finished && jwcSelectTarget(jwc.enemies.findIndex(x => x.id === e.id))}
                onDoubleClick={() => !jwc.finished && jwcAttackEnemy(jwc.enemies.findIndex(x => x.id === e.id))}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
              >
                <div style={{
                  outline: isTarget ? `3px solid ${C.redBright}` : `1px solid ${accent}44`,
                  outlineOffset: 2,
                  transition: "outline 0.15s",
                }}>
                  <SpriteImg name={e.name} w={enemyW} h={enemyH} />
                </div>
                <span className="pixel-text" style={{
                  color: isTarget ? C.redBright : "#C06060",
                  fontSize: inline ? 10 : 13,
                  textShadow: isTarget ? `0 0 6px ${C.redBright}` : "none",
                }}>
                  {isTarget ? "▼ " : ""}{e.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── COMBAT UI: log + actions ──────────────────────────────────────── */}
      <div style={{
        flex: 1, display: "flex", minHeight: 0, overflow: "hidden",
        gap: 0,
      }}>

        {/* Battle log */}
        <div style={{
          flex: 1,
          backgroundColor: "#020A02",
          borderRight: `1px solid ${accent}22`,
          padding: inline ? "4px 6px" : "8px 12px",
          overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          {recentLog.map((line, i) => (
            <span key={i} className="pixel-text" style={{
              display: "block",
              fontSize: i === 0 ? (inline ? 12 : 14) : (inline ? 10 : 12),
              color: line.includes("STUN") || line.includes("[ICE]") || line.includes("frozen") ? C.cyan
                   : line.includes("hit") || line.includes("collapse") ? C.redBright
                   : line.includes("VICTORY") || line.includes("★") ? C.green
                   : line.includes("WEAK") ? C.yellow
                   : line.startsWith("──") ? "#1A4A1A"
                   : C.textDim,
              opacity: 1 - i * 0.14, lineHeight: 1.25,
            }}>
              {line}
            </span>
          ))}
          {totalPending > 0 && (
            <div style={{ marginTop: 3, padding: "2px 5px", backgroundColor: "#0A1A0A", border: "1px solid #1A3A1A" }}>
              <span className="pixel-text" style={{ color: "#3A7A3A", fontSize: inline ? 9 : 11 }}>
                {totalAtkQueued > 0 && `ATK×${totalAtkQueued} `}
                {pendingDef > 0 && `DEF×${pendingDef} `}
                {spReserved > 0 && `RSV×${spReserved}`}
                {" queued"}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{
          flexShrink: 0, minWidth: inline ? 150 : 260,
          backgroundColor: "#030A03",
          padding: inline ? "4px 6px" : "8px 10px",
          display: "flex", flexDirection: "column", gap: inline ? 4 : 6,
          justifyContent: "flex-end",
        }}>
          {!jwc.finished ? (
            <>
              {/* Queued actions */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {atkByEnemy.map((n, i) => n > 0 ? (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span className="pixel-text" style={{ color: C.redBright, fontSize: inline ? 10 : 12 }}>
                      ATK×{n}→{jwc.enemies[i]?.name?.split(" ")[0]}
                    </span>
                    <button onClick={() => jwcUnqueueAtkForEnemy(i)} style={{
                      backgroundColor: "#2A0000", border: "1px solid #500",
                      color: "#FF8080", cursor: "pointer", fontSize: 10, padding: "0 3px", fontFamily: "inherit",
                    }}>↩</button>
                  </div>
                ) : null)}
                {pendingDef > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span className="pixel-text" style={{ color: C.cyan, fontSize: inline ? 10 : 12 }}>DEF×{pendingDef}</span>
                    <button onClick={jwcUnqueueDef} style={{ backgroundColor: "#001020", border: "1px solid #048", color: "#80D0FF", cursor: "pointer", fontSize: 10, padding: "0 3px", fontFamily: "inherit" }}>↩</button>
                  </div>
                )}
                {spReserved > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span className="pixel-text" style={{ color: C.yellow, fontSize: inline ? 10 : 12 }}>RSV×{spReserved}</span>
                    <button onClick={jwcUnqueueReserve} style={{ backgroundColor: "#201000", border: "1px solid #750", color: "#FFD060", cursor: "pointer", fontSize: 10, padding: "0 3px", fontFamily: "inherit" }}>↩</button>
                  </div>
                )}
              </div>

              {/* STRIKE / BLOCK / RESERVE */}
              <div style={{ display: "flex", gap: inline ? 3 : 5 }}>
                <button onClick={jwcAttack} disabled={noSp} style={{
                  flex: 1, padding: inline ? "7px 2px" : "10px 4px",
                  cursor: noSp ? "not-allowed" : "pointer",
                  backgroundColor: noSp ? "#1A0808" : "#3A0808",
                  border: `2px solid ${noSp ? "#300" : C.redBright}`,
                  color: noSp ? "#500" : C.redBright,
                  fontFamily: "'VT323', monospace", fontSize: inline ? 16 : 20,
                }}>STRIKE</button>
                <button onClick={jwcDefend} disabled={noSp} style={{
                  flex: 1, padding: inline ? "7px 2px" : "10px 4px",
                  cursor: noSp ? "not-allowed" : "pointer",
                  backgroundColor: noSp ? "#000A12" : "#001A2A",
                  border: `2px solid ${noSp ? "#024" : C.cyan}`,
                  color: noSp ? "#024" : C.cyan,
                  fontFamily: "'VT323', monospace", fontSize: inline ? 16 : 20,
                }}>BLOCK</button>
                <button onClick={jwcReserve} disabled={noSp} style={{
                  flex: 1, padding: inline ? "7px 2px" : "10px 4px",
                  cursor: noSp ? "not-allowed" : "pointer",
                  backgroundColor: noSp ? "#100800" : "#201800",
                  border: `2px solid ${noSp ? "#430" : C.yellow}`,
                  color: noSp ? "#430" : C.yellow,
                  fontFamily: "'VT323', monospace", fontSize: inline ? 16 : 20,
                }}>RSRV</button>
              </div>

              {/* END TURN */}
              <button onClick={jwcEndRound} style={{
                padding: inline ? "9px 0" : "13px 0",
                backgroundColor: totalPending > 0 || spReserved > 0 ? "#083008" : "#0A0A0A",
                border: `2px solid ${totalPending > 0 || spReserved > 0 ? C.green : "#333"}`,
                color: totalPending > 0 || spReserved > 0 ? C.green : "#444",
                fontFamily: "'VT323', monospace", fontSize: inline ? 17 : 22, cursor: "pointer",
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
                    backgroundColor: "#001A08", border: `1px solid ${C.green}44`,
                    padding: "6px 8px", display: "flex", flexDirection: "column", gap: 3, marginBottom: 4,
                  }}>
                    <span className="pixel-text" style={{ color: C.green, fontSize: inline ? 11 : 13, letterSpacing: 1 }}>
                      {isBossFight ? "★ BOSS REWARDS" : "★ BATTLE REWARDS"}
                    </span>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {totalMoney  > 0 && <span className="pixel-text" style={{ color: C.yellow,  fontSize: inline ? 11 : 14 }}>+${totalMoney}</span>}
                      {totalGems   > 0 && <span className="pixel-text" style={{ color: C.cyan,    fontSize: inline ? 11 : 14 }}>+{totalGems}💎</span>}
                      {totalMetals > 0 && <span className="pixel-text" style={{ color: C.textDim, fontSize: inline ? 11 : 14 }}>+{totalMetals}M</span>}
                      {drops.length > 0 && (
                        <span className="pixel-text" style={{ color: "#A080FF", fontSize: inline ? 11 : 13 }}>
                          {drops.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
              <PixelButton
                onClick={closeJWC}
                color={jwc.victory ? C.green : "#6B0000"}
                textColor={jwc.victory ? "#052002" : "#fff"}
                style={{ width: "100%", padding: inline ? "12px 0" : "16px 0" }}
              >
                {jwc.victory ? (isBossFight ? "★ BOSS SLAIN — CLAIM LOOT" : "★ CLAIM LOOT") : "CONTINUE..."}
              </PixelButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
