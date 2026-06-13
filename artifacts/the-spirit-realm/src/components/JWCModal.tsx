import React, { useRef } from "react";
import { useGame } from "@/game/state";
import { C, PixelButton } from "./PixelUI";
import { ENEMY_SPRITES, CHARACTER_SPRITES } from "@/assets/sprites";
import { PixelPortrait } from "./CardArt";
import type { Weapon } from "@/game/data";

function HpBar({ hp, maxHp, color }: { hp: number; maxHp: number; color: string }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const barColor = pct > 50 ? color : pct > 20 ? C.yellow : C.redBright;
  return (
    <div style={{ height: 6, backgroundColor: "#111", border: "1px solid #000", overflow: "hidden" }}>
      <div style={{ height: "100%", backgroundColor: barColor, width: `${pct}%`, transition: "width 0.3s" }} />
    </div>
  );
}

function SpriteBox({ name, size, isPlayer }: { name: string; size: number; isPlayer?: boolean }) {
  const map    = isPlayer ? CHARACTER_SPRITES : ENEMY_SPRITES;
  const imgSrc = (map[name] ?? (isPlayer ? map["battle"] : null)) ?? null;
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      border: `2px solid ${isPlayer ? C.green : "#600"}`,
      backgroundColor: isPlayer ? "#060E06" : "#1A0808",
      overflow: "hidden", imageRendering: "pixelated",
    }}>
      {imgSrc
        ? <img src={imgSrc} alt={name} style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated" }} />
        : <PixelPortrait name={name} size={size} isPlayer={isPlayer} />
      }
    </div>
  );
}

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
  const noSp   = sp < 1;

  const w = player.equipped.weapon as Weapon | null;
  const activeEnemy = jwc.enemies[jwc.active];
  const accent = isBossFight ? C.yellow : "#880000";

  function startHold(enemyIdx: number) {
    holdTimerRef.current = setTimeout(() => {
      jwcUnqueueAtkForEnemy(enemyIdx);
    }, 500);
  }
  function clearHold() {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  }

  const recentLog = jwc.log.slice(0, 6);

  const spriteSize = inline
    ? (jwc.enemies.filter(x => x.hp > 0).length > 2 ? 96 : 120)
    : (jwc.enemies.filter(x => x.hp > 0).length > 2 ? 72 : 92);

  return (
    <div style={inline ? {
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
    } : {
      position: "fixed", inset: 0,
      backgroundColor: "rgba(0,0,0,0.97)",
      display: "flex", flexDirection: "column", zIndex: 100,
    }}>
      {/* ── 6-SECTION GRID ── */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr 1fr",
        overflow: "hidden",
        borderBottom: `3px solid ${accent}`,
      }}>

        {/* ── SECTION 1 (top-left): Enemy stats ── */}
        <div style={{
          backgroundColor: "#0D0404",
          borderRight: `1px solid ${accent}33`,
          borderBottom: `1px solid ${accent}22`,
          padding: "6px 8px", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 4,
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
                onContextMenu={(ev) => { ev.preventDefault(); if (atkForThis > 0) jwcUnqueueAtkForEnemy(i); }}
                onTouchStart={() => startHold(i)}
                onTouchEnd={clearHold}
                onTouchMove={clearHold}
                style={{
                  padding: "4px 6px",
                  backgroundColor: isDead ? "#0A0000" : isTarget ? "#1E0404" : "#110202",
                  border: `1px solid ${isDead ? "#300" : isTarget ? C.redBright : "#600"}`,
                  cursor: isDead || jwc.finished ? "default" : "pointer",
                  opacity: isDead ? 0.4 : 1,
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}>
                  {isBossFight && <span style={{ color: C.yellow, fontSize: 9 }}>★</span>}
                  {e.isElite && !isBossFight && <span style={{ color: "#D06060", fontSize: 9 }}>★</span>}
                  <span className="pixel-text" style={{
                    color: isDead ? "#600" : isTarget ? C.redBright : "#C06060",
                    fontSize: 14, flex: 1, lineHeight: 1,
                  }}>
                    {isDead ? `x ${e.name}` : e.name}
                  </span>
                  <span className="pixel-text" style={{ color: "#7A4444", fontSize: 11 }}>
                    Lv{e.level ?? "?"}
                  </span>
                  {isTarget && !isDead && <span style={{ fontSize: 10, color: C.redBright }}>◀</span>}
                </div>
                {!isDead && (
                  <>
                    <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 1 }}>
                      <span className="pixel-text" style={{ color: "#904040", fontSize: 11 }}>{e.hp}/{e.maxHp}</span>
                      <span className="pixel-text" style={{ color: "#704040", fontSize: 11 }}>{e.damage}dmg</span>
                    </div>
                    <span className="pixel-text" style={{ color: "#554040", fontSize: 11 }}>
                      weak:{e.weakness} · atk:{e.attackType}
                    </span>
                    <div style={{ display: "flex", gap: 3, marginTop: 2, flexWrap: "wrap" }}>
                      {isStunned && (
                        <div style={{ backgroundColor: C.yellow + "22", border: `1px solid ${C.yellow}`, padding: "0 3px" }}>
                          <span className="pixel-text" style={{ color: C.yellow, fontSize: 8 }}>STUN</span>
                        </div>
                      )}
                      {isFrozen && (
                        <div style={{ backgroundColor: C.cyan + "22", border: `1px solid ${C.cyan}`, padding: "0 3px" }}>
                          <span className="pixel-text" style={{ color: C.cyan, fontSize: 8 }}>ICE x{e.iceTurns}</span>
                        </div>
                      )}
                      {atkForThis > 0 && (
                        <div style={{ backgroundColor: C.redBright + "22", border: `1px solid ${C.redBright}`, padding: "0 3px" }}>
                          <span className="pixel-text" style={{ color: C.redBright, fontSize: 8 }}>ATK x{atkForThis}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ── SECTION 2 (top-right): Enemy sprites ── */}
        <div style={{
          backgroundColor: "#100404",
          borderBottom: `1px solid ${accent}22`,
          padding: "6px 8px",
          display: "flex", flexWrap: "wrap", gap: 4, alignContent: "flex-start",
        }}>
          {jwc.enemies.filter(e => e.hp > 0).map(e => {
            const isTarget = e.id === activeEnemy?.id;
            return (
              <div key={e.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ border: `2px solid ${isTarget ? C.redBright : "#500"}`, padding: 1 }}>
                  <SpriteBox name={e.name} size={spriteSize} />
                </div>
                <span className="pixel-text" style={{ color: "#7A3030", fontSize: inline ? 11 : 8 }}>Lv{e.level ?? "?"}</span>
                {isTarget && (
                  <span className="pixel-text" style={{ color: C.redBright, fontSize: inline ? 11 : 8 }}>TARGET</span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── SECTION 3 (mid-left): Player sprite ── */}
        <div style={{
          backgroundColor: "#040C04",
          borderRight: `1px solid ${accent}33`,
          borderBottom: `1px solid ${accent}22`,
          padding: "6px 8px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        }}>
          <SpriteBox name="self" size={100} isPlayer />
          <span className="pixel-text" style={{ color: C.green, fontSize: 13 }}>YOU</span>
        </div>

        {/* ── SECTION 4 (mid-right): Player HP + weapon ── */}
        <div style={{
          backgroundColor: "#040A04",
          borderBottom: `1px solid ${accent}22`,
          padding: "8px 10px",
          display: "flex", flexDirection: "column", gap: 6, justifyContent: "center",
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span className="pixel-text" style={{ color: C.green, fontSize: 11 }}>HP</span>
              <span className="pixel-text" style={{
                color: jwc.playerHp / jwc.playerMaxHp > 0.3 ? C.green : C.redBright, fontSize: 12,
              }}>
                {jwc.playerHp}/{jwc.playerMaxHp}
              </span>
            </div>
            <HpBar hp={jwc.playerHp} maxHp={jwc.playerMaxHp} color={C.green} />
          </div>

          <div style={{ backgroundColor: C.bg3, border: `1px solid ${C.textDim}33`, padding: "4px 6px" }}>
            {w ? (
              <>
                <span className="pixel-text" style={{ color: C.yellow, fontSize: 12, display: "block" }}>{w.name}</span>
                <span className="pixel-text" style={{ color: C.textDim, fontSize: 10, display: "block" }}>
                  {w.weaponKind} · {w.damage}dmg · {w.damageType}
                  {w.effect ? ` · ${w.effect === "ice" ? "[ICE]" : "[STUN]"}` : ""}
                </span>
                {activeEnemy && w.damageType === activeEnemy.weakness && (
                  <span className="pixel-text" style={{ color: C.green, fontSize: 10, display: "block" }}>
                    + HITS WEAKNESS!
                  </span>
                )}
              </>
            ) : (
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 12 }}>FISTS · blunt · 5dmg</span>
            )}
          </div>

          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span className="pixel-text" style={{ color: sp > 0 ? C.cyan : "#334", fontSize: 14 }}>SP:{sp}</span>
            {spReserved > 0 && (
              <span className="pixel-text" style={{ color: C.yellow, fontSize: 12 }}>+{spReserved}rsrv</span>
            )}
            {jwc.enemies.filter(e => e.hp > 0).length > 1 && (
              <span className="pixel-text" style={{ color: "#A06060", fontSize: 11, marginLeft: "auto" }}>
                {jwc.enemies.filter(e => e.hp > 0).length} attack simultaneously
              </span>
            )}
          </div>
        </div>

        {/* ── SECTION 5 (bot-left): Battle log ── */}
        <div style={{
          backgroundColor: "#020A02",
          borderRight: `1px solid ${accent}33`,
          padding: "6px 8px", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 1,
        }}>
          {recentLog.map((line, i) => (
            <span key={i} className="pixel-text" style={{
              display: "block",
              fontSize: i === 0 ? 12 : 10,
              color: line.includes("STUN") || line.includes("[ICE]") || line.includes("frozen") ? C.cyan
                   : line.includes("hit") || line.includes("collapse") ? C.redBright
                   : line.includes("VICTORY") || line.includes("★") ? C.green
                   : line.includes("WEAK") ? C.yellow
                   : line.startsWith("──") ? "#1A4A1A"
                   : C.textDim,
              opacity: 1 - i * 0.15, lineHeight: 1.2,
            }}>
              {line}
            </span>
          ))}
          {totalPending > 0 && (
            <div style={{ marginTop: 2, padding: "2px 4px", backgroundColor: "#0A1A0A" }}>
              <span className="pixel-text" style={{ color: "#2A6A2A", fontSize: 9 }}>
                {totalAtkQueued > 0 && `ATK x${totalAtkQueued} `}
                {pendingDef > 0 && `DEF x${pendingDef} `}
                {spReserved > 0 && `RSV x${spReserved}`}
                {" queued"}
              </span>
            </div>
          )}
        </div>

        {/* ── SECTION 6 (bot-right): Action buttons ── */}
        <div style={{
          backgroundColor: "#030A03", padding: "6px 8px",
          display: "flex", flexDirection: "column", gap: 4, justifyContent: "flex-end",
        }}>
          {!jwc.finished ? (
            <>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 2 }}>
                {atkByEnemy.map((n, i) => n > 0 ? (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span className="pixel-text" style={{ color: C.redBright, fontSize: 12 }}>
                      ATK x{n} → {jwc.enemies[i]?.name?.split(" ")[0]}
                    </span>
                    <button onClick={() => jwcUnqueueAtkForEnemy(i)} style={{
                      backgroundColor: "#2A0000", border: "1px solid #500",
                      color: "#FF8080", cursor: "pointer", fontSize: 11, padding: "0 3px", fontFamily: "inherit",
                    }}>↩</button>
                  </div>
                ) : null)}
                {pendingDef > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span className="pixel-text" style={{ color: C.cyan, fontSize: 12 }}>DEF x{pendingDef}</span>
                    <button onClick={jwcUnqueueDef} style={{ backgroundColor: "#001020", border: "1px solid #048", color: "#80D0FF", cursor: "pointer", fontSize: 11, padding: "0 3px", fontFamily: "inherit" }}>↩</button>
                  </div>
                )}
                {spReserved > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span className="pixel-text" style={{ color: C.yellow, fontSize: 12 }}>RSV x{spReserved}</span>
                    <button onClick={jwcUnqueueReserve} style={{ backgroundColor: "#201000", border: "1px solid #750", color: "#FFD060", cursor: "pointer", fontSize: 11, padding: "0 3px", fontFamily: "inherit" }}>↩</button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={jwcAttack} disabled={noSp} style={{
                  flex: 1, padding: "8px 4px",
                  cursor: noSp ? "not-allowed" : "pointer",
                  backgroundColor: noSp ? "#1A0808" : "#3A0808",
                  border: `2px solid ${noSp ? "#300" : C.redBright}`,
                  color: noSp ? "#500" : C.redBright,
                  fontFamily: "'VT323', monospace", fontSize: 17,
                }}>STRIKE</button>
                <button onClick={jwcDefend} disabled={noSp} style={{
                  flex: 1, padding: "8px 4px",
                  cursor: noSp ? "not-allowed" : "pointer",
                  backgroundColor: noSp ? "#000A12" : "#001A2A",
                  border: `2px solid ${noSp ? "#024" : C.cyan}`,
                  color: noSp ? "#024" : C.cyan,
                  fontFamily: "'VT323', monospace", fontSize: 17,
                }}>BLOCK</button>
                <button onClick={jwcReserve} disabled={noSp} style={{
                  flex: 1, padding: "8px 4px",
                  cursor: noSp ? "not-allowed" : "pointer",
                  backgroundColor: noSp ? "#100800" : "#201800",
                  border: `2px solid ${noSp ? "#430" : C.yellow}`,
                  color: noSp ? "#430" : C.yellow,
                  fontFamily: "'VT323', monospace", fontSize: 17,
                }}>RESERVE</button>
              </div>

              <button onClick={jwcEndRound} style={{
                padding: "10px 0",
                backgroundColor: totalPending > 0 || spReserved > 0 ? "#083008" : "#0A0A0A",
                border: `2px solid ${totalPending > 0 || spReserved > 0 ? C.green : "#333"}`,
                color: totalPending > 0 || spReserved > 0 ? C.green : "#444",
                fontFamily: "'VT323', monospace", fontSize: 18, cursor: "pointer",
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
                    padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4, marginBottom: 4,
                  }}>
                    <span className="pixel-text" style={{ color: C.green, fontSize: 11, letterSpacing: 1 }}>
                      {isBossFight ? "★ BOSS REWARDS" : "★ BATTLE REWARDS"}
                    </span>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {totalMoney  > 0 && <span className="pixel-text" style={{ color: C.yellow,  fontSize: 13 }}>+${totalMoney}</span>}
                      {totalGems   > 0 && <span className="pixel-text" style={{ color: C.cyan,    fontSize: 13 }}>+{totalGems} 💎</span>}
                      {totalMetals > 0 && <span className="pixel-text" style={{ color: C.textDim, fontSize: 13 }}>+{totalMetals} metals</span>}
                      {drops.length > 0 && (
                        <span className="pixel-text" style={{ color: "#A080FF", fontSize: 13 }}>
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
                style={{ width: "100%", padding: "14px 0" }}
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
