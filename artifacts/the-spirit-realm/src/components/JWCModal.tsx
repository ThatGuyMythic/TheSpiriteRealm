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
    <div style={{ height: 8, backgroundColor: "#111", border: "1px solid #000", overflow: "hidden" }}>
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

  function startHold(idx: number) {
    holdTimerRef.current = setTimeout(() => jwcUnqueueAtkForEnemy(idx), 500);
  }
  function clearHold() {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  }

  // Sprite sizes: bigger for full-screen, compact for inline
  const playerW = inline ? 110 : 280;
  const playerH = inline ? 150 : 380;
  const enemySize = inline
    ? (liveEnemies.length > 2 ? 80 : 100)
    : (liveEnemies.length === 1 ? 300 : liveEnemies.length === 2 ? 230 : 170);

  // ── INLINE: compact stacked layout ────────────────────────────────────────
  if (inline) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Inline: compact 3×2 grid */}
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
                  onClick={() => !isDead && !jwc.finished && jwcSelectTarget(i)}
                  onDoubleClick={() => !isDead && !jwc.finished && jwcAttackEnemy(i)}
                  onContextMenu={ev => { ev.preventDefault(); if (atkForThis > 0) jwcUnqueueAtkForEnemy(i); }}
                  onTouchStart={() => startHold(i)} onTouchEnd={clearHold} onTouchMove={clearHold}
                  style={{
                    padding: "3px 4px", backgroundColor: isDead ? "#0A0000" : isTarget ? "#1E0404" : "#110202",
                    border: `1px solid ${isDead ? "#300" : isTarget ? C.redBright : "#600"}`,
                    cursor: isDead || jwc.finished ? "default" : "pointer", opacity: isDead ? 0.4 : 1,
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
                    {(isBossFight || e.isElite) && <span style={{ color: isBossFight ? C.yellow : "#D06060", fontSize: 9 }}>★</span>}
                    <span className="pixel-text" style={{ color: isDead ? "#600" : isTarget ? C.redBright : "#C06060", fontSize: 12, flex: 1, lineHeight: 1 }}>
                      {isDead ? `✗ ${e.name}` : e.name}
                    </span>
                    {isTarget && !isDead && <span style={{ color: C.redBright, fontSize: 9 }}>◀</span>}
                  </div>
                  {!isDead && (
                    <>
                      <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} />
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
            padding: "4px", gap: liveEnemies.length > 1 ? 4 : 0, flexWrap: "wrap", overflowY: "hidden",
          }}>
            {liveEnemies.map(e => {
              const isTarget = e.id === activeEnemy?.id;
              return (
                <div key={e.id} onClick={() => !jwc.finished && jwcSelectTarget(jwc.enemies.findIndex(x => x.id === e.id))}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, cursor: "pointer" }}>
                  <div style={{ outline: isTarget ? `2px solid ${C.redBright}` : "none", outlineOffset: 1 }}>
                    <SpriteImg name={e.name} w={enemySize} h={enemySize} />
                  </div>
                  {isTarget && <span className="pixel-text" style={{ color: C.redBright, fontSize: 9 }}>TARGET</span>}
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
                <span className="pixel-text" style={{ color: C.green, fontSize: 12 }}>HP</span>
                <span className="pixel-text" style={{ color: jwc.playerHp / jwc.playerMaxHp > 0.3 ? C.green : C.redBright, fontSize: 13 }}>
                  {jwc.playerHp}/{jwc.playerMaxHp}
                </span>
              </div>
              <HpBar hp={jwc.playerHp} maxHp={jwc.playerMaxHp} color={C.green} />
            </div>
            <span className="pixel-text" style={{ color: sp > 0 ? C.cyan : "#334", fontSize: 13 }}>SP:{sp}{spReserved > 0 ? `+${spReserved}` : ""}</span>
            {w && <span className="pixel-text" style={{ color: C.yellow, fontSize: 11 }}>{w.name} · {w.damage}dmg</span>}
          </div>

          {/* [2,0] Battle log */}
          <div style={{
            backgroundColor: "#020A02", borderRight: `1px solid ${accent}33`,
            padding: "4px 6px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 1,
          }}>
            {recentLog.map((line, i) => (
              <span key={i} className="pixel-text" style={{
                fontSize: i === 0 ? 11 : 9,
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
                    const borderColor = label === "STRIKE" ? C.redBright : label === "BLOCK" ? C.cyan : C.yellow;
                    const bg = label === "STRIKE" ? "#3A0808" : label === "BLOCK" ? "#001A2A" : "#201800";
                    const disabledBg = label === "STRIKE" ? "#1A0808" : label === "BLOCK" ? "#000A12" : "#100800";
                    return (
                      <button key={label} onClick={handler} disabled={noSp} style={{
                        flex: 1, cursor: noSp ? "not-allowed" : "pointer",
                        backgroundColor: noSp ? disabledBg : bg,
                        border: `2px solid ${noSp ? borderColor + "33" : borderColor}`,
                        color: noSp ? borderColor + "44" : borderColor,
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
                  const totalMoney = jwc.enemies.reduce((s, e) => s + (e.loot?.money ?? 0), 0);
                  const totalGems  = jwc.enemies.reduce((s, e) => s + (e.loot?.gems  ?? 0), 0);
                  const drops      = jwc.enemies.map(e => e.loot?.partName).filter(Boolean) as string[];
                  return (
                    <div style={{ backgroundColor: "#001A08", border: `1px solid ${C.green}44`, padding: "4px 6px", marginBottom: 3 }}>
                      <span className="pixel-text" style={{ color: C.green, fontSize: 10 }}>{isBossFight ? "★ BOSS REWARDS" : "★ REWARDS"}</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                        {totalMoney > 0 && <span className="pixel-text" style={{ color: C.yellow, fontSize: 12 }}>+${totalMoney}</span>}
                        {totalGems  > 0 && <span className="pixel-text" style={{ color: C.cyan,   fontSize: 12 }}>+{totalGems}💎</span>}
                        {drops.map((d, i) => <span key={i} className="pixel-text" style={{ color: "#A080FF", fontSize: 10 }}>{d}</span>)}
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

  // ── FULL-SCREEN DESKTOP layout ─────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "#04060A",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "2fr 2fr 1.8fr",
      zIndex: 100,
    }}>

      {/* ── [0,0] TOP-LEFT: Enemy HP bars ────────────────────────────────── */}
      <div style={{
        backgroundColor: "#0D0404",
        borderRight: `1px solid ${accent}33`,
        borderBottom: `1px solid ${accent}33`,
        padding: "14px 18px",
        overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <span className="pixel-text" style={{ color: accent, fontSize: 13, letterSpacing: 2, marginBottom: 2 }}>
          {isBossFight ? "★ ENEMIES" : "ENEMIES"}
        </span>
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
              onTouchStart={() => startHold(i)} onTouchEnd={clearHold} onTouchMove={clearHold}
              style={{
                padding: "10px 14px",
                backgroundColor: isDead ? "#0A0000" : isTarget ? "#1E0404" : "#110202",
                border: `2px solid ${isDead ? "#300" : isTarget ? C.redBright : "#600"}`,
                cursor: isDead || jwc.finished ? "default" : "pointer",
                opacity: isDead ? 0.4 : 1, userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                {(isBossFight || e.isElite) && <span style={{ color: isBossFight ? C.yellow : "#D06060", fontSize: 13 }}>★</span>}
                <span className="pixel-text" style={{ color: isDead ? "#600" : isTarget ? C.redBright : "#C06060", fontSize: 20, flex: 1, lineHeight: 1 }}>
                  {isDead ? `✗ ${e.name}` : e.name}
                </span>
                <span className="pixel-text" style={{ color: "#7A4444", fontSize: 14 }}>Lv{e.level ?? "?"}</span>
                {isTarget && !isDead && <span style={{ fontSize: 14, color: C.redBright }}>◀</span>}
              </div>
              {!isDead && (
                <>
                  <HpBar hp={e.hp} maxHp={e.maxHp} color={C.redBright} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span className="pixel-text" style={{ color: "#904040", fontSize: 15 }}>{e.hp}/{e.maxHp} HP</span>
                    <span className="pixel-text" style={{ color: "#704040", fontSize: 14 }}>{e.damage}dmg · weak:{e.weakness}</span>
                  </div>
                  <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                    {isStunned  && <span className="pixel-text" style={{ color: C.yellow, fontSize: 11, backgroundColor: C.yellow + "18", padding: "1px 5px", border: `1px solid ${C.yellow}44` }}>STUN</span>}
                    {isFrozen   && <span className="pixel-text" style={{ color: C.cyan, fontSize: 11, backgroundColor: C.cyan + "18", padding: "1px 5px", border: `1px solid ${C.cyan}44` }}>ICE×{e.iceTurns}</span>}
                    {atkForThis > 0 && <span className="pixel-text" style={{ color: C.redBright, fontSize: 11, backgroundColor: C.redBright + "18", padding: "1px 5px", border: `1px solid ${C.redBright}44` }}>ATK×{atkForThis}</span>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── [0,1] TOP-RIGHT: Enemy sprites ───────────────────────────────── */}
      <div style={{
        backgroundColor: "#0C0308",
        borderBottom: `1px solid ${accent}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: liveEnemies.length === 1 ? "center" : "space-evenly",
        padding: "12px 20px",
        gap: liveEnemies.length > 1 ? 24 : 0,
        overflow: "hidden",
      }}>
        {liveEnemies.map(e => {
          const isTarget = e.id === activeEnemy?.id;
          return (
            <div key={e.id}
              onClick={() => !jwc.finished && jwcSelectTarget(jwc.enemies.findIndex(x => x.id === e.id))}
              onDoubleClick={() => !jwc.finished && jwcAttackEnemy(jwc.enemies.findIndex(x => x.id === e.id))}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" }}
            >
              <div style={{
                outline: isTarget ? `4px solid ${C.redBright}` : `1px solid ${accent}44`,
                outlineOffset: 3,
                transition: "outline 0.15s",
              }}>
                <SpriteImg name={e.name} w={enemySize} h={enemySize} />
              </div>
              <span className="pixel-text" style={{
                color: isTarget ? C.redBright : "#C06060", fontSize: 16,
                textShadow: isTarget ? `0 0 8px ${C.redBright}` : "none",
              }}>
                {isTarget ? "▼ TARGET" : e.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── [1,0] MIDDLE-LEFT: Player sprite ─────────────────────────────── */}
      <div style={{
        backgroundColor: "#040C04",
        borderRight: `1px solid ${accent}33`,
        borderBottom: `1px solid ${accent}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 12,
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <SpriteImg name="self" w={playerW} h={playerH} isPlayer />
          <span className="pixel-text" style={{ color: C.green, fontSize: 16, textShadow: `0 0 10px ${C.green}55` }}>
            YOU
          </span>
        </div>
      </div>

      {/* ── [1,1] MIDDLE-RIGHT: Player HP/stats ──────────────────────────── */}
      <div style={{
        backgroundColor: "#040A04",
        borderBottom: `1px solid ${accent}22`,
        padding: "20px 28px",
        display: "flex", flexDirection: "column", gap: 16, justifyContent: "center",
      }}>
        {/* Big HP display */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
            <span className="pixel-text" style={{ color: C.green, fontSize: 20 }}>HEALTH</span>
            <span className="pixel-text" style={{
              color: jwc.playerHp / jwc.playerMaxHp > 0.3 ? C.green : C.redBright,
              fontSize: 28,
            }}>
              {jwc.playerHp}/{jwc.playerMaxHp}
            </span>
          </div>
          <div style={{ height: 16, backgroundColor: "#111", border: `2px solid ${C.green}44`, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              backgroundColor: jwc.playerHp / jwc.playerMaxHp > 0.5 ? C.green : jwc.playerHp / jwc.playerMaxHp > 0.2 ? C.yellow : C.redBright,
              width: `${Math.max(0, (jwc.playerHp / jwc.playerMaxHp) * 100)}%`,
              transition: "width 0.3s",
            }} />
          </div>
        </div>

        {/* SP */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="pixel-text" style={{ color: sp > 0 ? C.cyan : "#334", fontSize: 24 }}>
            SP: {sp}
          </span>
          {spReserved > 0 && (
            <span className="pixel-text" style={{ color: C.yellow, fontSize: 18 }}>
              +{spReserved} reserved
            </span>
          )}
        </div>

        {/* Weapon */}
        <div style={{ backgroundColor: "#0A0F0A", border: `1px solid ${C.textDim}22`, padding: "10px 14px" }}>
          {w ? (
            <>
              <span className="pixel-text" style={{ color: C.yellow, fontSize: 20, display: "block" }}>{w.name}</span>
              <span className="pixel-text" style={{ color: C.textDim, fontSize: 15, display: "block", marginTop: 3 }}>
                {w.weaponKind} · {w.damage}dmg · {w.damageType}
                {w.effect ? (w.effect === "ice" ? " · [ICE]" : " · [STUN]") : ""}
              </span>
              {activeEnemy && w.damageType === activeEnemy.weakness && (
                <span className="pixel-text" style={{ color: C.green, fontSize: 15, display: "block", marginTop: 2 }}>
                  ★ HITS WEAKNESS!
                </span>
              )}
            </>
          ) : (
            <span className="pixel-text" style={{ color: C.textDim, fontSize: 18 }}>FISTS · blunt · 5dmg</span>
          )}
        </div>

        {/* Queued actions */}
        {(totalPending > 0 || spReserved > 0) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {atkByEnemy.map((n, i) => n > 0 ? (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span className="pixel-text" style={{ color: C.redBright, fontSize: 14 }}>ATK×{n}→{jwc.enemies[i]?.name?.split(" ")[0]}</span>
                <button onClick={() => jwcUnqueueAtkForEnemy(i)} style={{ backgroundColor: "#2A0000", border: "1px solid #500", color: "#FF8080", cursor: "pointer", fontSize: 12, padding: "0 4px", fontFamily: "inherit" }}>↩</button>
              </div>
            ) : null)}
            {pendingDef > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span className="pixel-text" style={{ color: C.cyan, fontSize: 14 }}>DEF×{pendingDef}</span>
                <button onClick={jwcUnqueueDef} style={{ backgroundColor: "#001020", border: "1px solid #048", color: "#80D0FF", cursor: "pointer", fontSize: 12, padding: "0 4px", fontFamily: "inherit" }}>↩</button>
              </div>
            )}
            {spReserved > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span className="pixel-text" style={{ color: C.yellow, fontSize: 14 }}>RSV×{spReserved}</span>
                <button onClick={jwcUnqueueReserve} style={{ backgroundColor: "#201000", border: "1px solid #750", color: "#FFD060", cursor: "pointer", fontSize: 12, padding: "0 4px", fontFamily: "inherit" }}>↩</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── [2,0] BOTTOM-LEFT: Battle log ────────────────────────────────── */}
      <div style={{
        backgroundColor: "#020A02",
        borderRight: `1px solid ${accent}33`,
        padding: "14px 18px",
        overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <span className="pixel-text" style={{ color: "#2A5A2A", fontSize: 12, letterSpacing: 2, marginBottom: 4 }}>COMBAT LOG</span>
        {recentLog.map((line, i) => (
          <span key={i} className="pixel-text" style={{
            display: "block",
            fontSize: i === 0 ? 16 : 14,
            color: line.includes("STUN") || line.includes("[ICE]") || line.includes("frozen") ? C.cyan
                 : line.includes("hit") || line.includes("collapse") ? C.redBright
                 : line.includes("VICTORY") || line.includes("★") ? C.green
                 : line.includes("WEAK") ? C.yellow
                 : line.startsWith("──") ? "#1A4A1A"
                 : C.textDim,
            opacity: 1 - i * 0.12, lineHeight: 1.3,
          }}>
            {line}
          </span>
        ))}
      </div>

      {/* ── [2,1] BOTTOM-RIGHT: Action buttons ───────────────────────────── */}
      <div style={{
        backgroundColor: "#030A03",
        padding: "12px 16px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {!jwc.finished ? (
          <>
            {/* STRIKE / BLOCK / RESERVE — big horizontal row */}
            <div style={{ display: "flex", gap: 10, flex: 1 }}>
              <button onClick={jwcAttack} disabled={noSp} style={{
                flex: 1,
                cursor: noSp ? "not-allowed" : "pointer",
                backgroundColor: noSp ? "#1A0808" : "#3A0808",
                border: `3px solid ${noSp ? "#300" : C.redBright}`,
                color: noSp ? "#500" : C.redBright,
                fontFamily: "'VT323', monospace", fontSize: 32,
                letterSpacing: 1,
              }}>STRIKE</button>
              <button onClick={jwcDefend} disabled={noSp} style={{
                flex: 1,
                cursor: noSp ? "not-allowed" : "pointer",
                backgroundColor: noSp ? "#000A12" : "#001A2A",
                border: `3px solid ${noSp ? "#024" : C.cyan}`,
                color: noSp ? "#024" : C.cyan,
                fontFamily: "'VT323', monospace", fontSize: 32,
                letterSpacing: 1,
              }}>BLOCK</button>
              <button onClick={jwcReserve} disabled={noSp} style={{
                flex: 1,
                cursor: noSp ? "not-allowed" : "pointer",
                backgroundColor: noSp ? "#100800" : "#201800",
                border: `3px solid ${noSp ? "#430" : C.yellow}`,
                color: noSp ? "#430" : C.yellow,
                fontFamily: "'VT323', monospace", fontSize: 32,
                letterSpacing: 1,
              }}>RESERVE</button>
            </div>

            {/* END TURN — full width, very tall */}
            <button onClick={jwcEndRound} style={{
              flex: 1,
              backgroundColor: totalPending > 0 || spReserved > 0 ? "#083008" : "#0A0A0A",
              border: `3px solid ${totalPending > 0 || spReserved > 0 ? C.green : "#333"}`,
              color: totalPending > 0 || spReserved > 0 ? C.green : "#444",
              fontFamily: "'VT323', monospace", fontSize: 36,
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
                  padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6, marginBottom: 8,
                }}>
                  <span className="pixel-text" style={{ color: C.green, fontSize: 16, letterSpacing: 2 }}>
                    {isBossFight ? "★ BOSS REWARDS" : "★ BATTLE REWARDS"}
                  </span>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {totalMoney  > 0 && <span className="pixel-text" style={{ color: C.yellow,  fontSize: 22 }}>+${totalMoney}</span>}
                    {totalGems   > 0 && <span className="pixel-text" style={{ color: C.cyan,    fontSize: 22 }}>+{totalGems} 💎</span>}
                    {totalMetals > 0 && <span className="pixel-text" style={{ color: C.textDim, fontSize: 18 }}>+{totalMetals} metals</span>}
                    {drops.length > 0 && (
                      <span className="pixel-text" style={{ color: "#A080FF", fontSize: 18 }}>{drops.join(", ")}</span>
                    )}
                  </div>
                </div>
              );
            })()}
            <PixelButton
              onClick={closeJWC}
              color={jwc.victory ? C.green : "#6B0000"}
              textColor={jwc.victory ? "#052002" : "#fff"}
              style={{ width: "100%", flex: 1, fontSize: 30 }}
            >
              {jwc.victory ? (isBossFight ? "★ BOSS SLAIN — CLAIM LOOT" : "★ CLAIM LOOT") : "CONTINUE..."}
            </PixelButton>
          </>
        )}
      </div>
    </div>
  );
}
